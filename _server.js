import { Status, STATUS_TEXT } from 'https://deno.land/std/http/http_status.ts'
import { serve as httpServe } from 'https://deno.land/std/http/server.ts'

export const boom = Object.fromEntries(Object.entries(Status).map(([k, v]) =>
  [k, err => {err.status = v; throw err}]))

const dec = new TextDecoder()
const readBodyStr = async req => dec.decode(await Deno.readAll(req.body))
const readBody = async req => {
  const contentType = req.headers.get('content-type')
  if (!req.body || !contentType) return ''
 
  console.log('parsing: content-type', contentType)
  try {
    if (contentType === 'text/plain') return await readBodyStr(req.body)
    if (contentType === 'application/json') {
      return JSON.parse(await readBodyStr(req.body))
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      const bodyStr = await readBodyStr(req.body)
      const params = new URLSearchParams(decodeURIComponent(bodyStr))
      return Object.fromEntries(params)
    }
  } catch (err) {
    boom.BadRequest(err)
  }
}

export const serve = async (routes, port) => {
  console.log('listening on port:', port)
  for await (const req of httpServe({ port })) {
    const { pathname, searchParams } = new URL(`http://localhost${req.url}`)
    const routeKey = `${req.method} ${pathname}`
    const handler = routes[routeKey]
    console.log({ method: req.method, pathname, url: req.url })
    try {
      if (!handler) boom.NotFound(Error(`no handlers for ${routeKey}`))

      const body = await readBody(req)
      const params = body || Object.fromEntries(searchParams)

      req.respond({ body: await handler(params, req) })
      console.log('OK')

    } catch (err) {
      console.error(err)
      const status = err.status || Status.InternalServerError
      req.respond({ body: STATUS_TEXT[status], status })
      console.log('NOT OK')
    }
    await req.done
    console.log('DONE')
  }
}

const scriptToString = script => typeof script === 'function'
  ? script.toString().slice(7, -1).trim()
  : script

export const makePage = ({ title, script, body, style }) => `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="shortcut icon" type="image/x-icon" href="data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAx42QAFP/FABXQkMAQC0uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAQBEREREREREAFEREREREQQAURERERERBABREREREREEAFEREREREQQAURERERERBABQERAAEREEAFCBEIiREQQAUQgRERERBABRAJEREREEAFAJEREREQQAUJERERERBABRERERERDEAEREREREREQQAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA">
  <style>

:root {
  --background: #282a36;
  --selection: #44475a;
  --foreground: #f8f8f2;
  --comment: #6272a4;
  --cyan: #8be9fd;
  --green: #50fa7b;
  --orange: #ffb86c;
  --pink: #ff79c6;
  --purple: #bd93f9;
  --red: #ff5555;
  --yellow: #f1fa8c;
}
* { margin: 0; padding: 0; font-family: monospace }
*, *:before, *:after { box-sizing: inherit }
html {
  box-sizing: border-box;
  background: var(--background);
  color: var(--comment);
}
html, body { height: 100% }
body {
  padding: 24px 64px;
  max-width: 1200px;
  margin: 24px auto;
}
h1,h2,h3 { font-weight: normal }
h1 { color: var(--pink) }
h2 { color: var(--cyan) }
${style}

  </style>
</head>
<body>${body}
  <script type="module">${scriptToString(script)}</script>
</body>
</html>
`

/* todo:
 *   handle & optimise static routes (str instead of functions, compressed and served from memory)
 *
 */
