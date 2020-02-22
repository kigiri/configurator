import { Status, STATUS_TEXT } from 'https://deno.land/std/http/http_status.ts'
import { serve as httpServe } from 'https://deno.land/std/http/server.ts'

export const boom = Object.fromEntries(Object.entries(Status).map(([k, v]) =>
  [k, err => {err.status = v; throw err}]))

const dec = new TextDecoder()
const readBodyStr = async req => dec.decode(await Deno.readAll(req.body))
const readBody = async req => {
  const contentType = req.headers.get('content-type')
  if (!req.body || !contentType) return
 
  try {
    if (contentType === 'text/plain') return await readBodyStr(req)
    if (contentType === 'application/json') {
      return JSON.parse(await readBodyStr(req))
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      const bodyStr = await readBodyStr(req)
      const params = new URLSearchParams(decodeURIComponent(bodyStr))
      return Object.fromEntries(params)
    }
  } catch (err) {
    boom.BadRequest(err)
  }
}

export const getIp = req =>
  req.headers.get('x-forwarded-for')
  || req.headers.get('x-real-ip')
  || req.conn.remoteAddr

export const getUser = req => {
  try { return atob(req.headers.get('authorization').split(' ')[1]).split(':')[0] }
  catch { return '' }
}

export const json = data => {
  const headers = new Headers()
  headers.set('content-type', 'application/json')
  return { headers, body: JSON.stringify(data) }
}

const handleRequest = async (req, routes, base) => {
  const { pathname, searchParams } = new URL(`http://localhost${req.url}`)
  if (pathname === '/ping') return req.respond({body: 'ok'})
  if (pathname === '/kill') {
    req.respond({body: 'ok'})
    await req.done
    Deno.exit(1)
  }
  const routeKey = `${req.method} ${pathname}`
  const handler = routes[routeKey]
  console.log(base, routeKey)
  if (!handler) boom.NotFound(Error(`no handlers for ${routeKey}`))
  const params = (await readBody(req)) || Object.fromEntries(searchParams)
  return handler(params, req)
}

const rand = () => Math.random().toString(36).slice(2).padStart(11, '0')
export const serve = async (routes, port, base) => {
  console.log(base, 'listening on port:', port)
  for await (const req of httpServe({ port })) {
    handleRequest(req, routes, base).then(
      body => req.respond(typeof body === 'string' ? { body } : (body||{body:'ok'})),
      err => {
        console.error(err)
        const status = err.status || Status.InternalServerError
        req.respond({ body: err.message, status })
      }
    )
  }
}

const scriptToString = script => typeof script === 'function'
  ? script.toString().slice(7, -1).trim()
  : script

export const makePage = ({ title, script, body, style }) => `<!DOCTYPE html>
<html>
<head>
  <title>${title||'Page'}</title>
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
a {
  color: var(--orange);
  text-decoration: none;
}
a:visited { color: var(--purple) }
a:active { color: var(--#d4b5ff) }
${style||''}
  </style>
  <script>
  if (location.search === '?debug=true') {
    console.log('debug mode on, CTRL+R will restart the server')
    window.addEventListener('keydown', async e => {
      if (e.key !== 'r' || !e.ctrlKey) return
      e.preventDefault()
      const path = '/admin/'+location.pathname.split('/')[2]
      await fetch(path+'/kill')
      await new Promise(s => setTimeout(s, 3000))
      while (true) {
        if ((await fetch(path+'/ping')).status === 200) {
          console.log('ping success, reload')
          window.location.reload()
        }
        await new Promise(s => setTimeout(s, 300))
      }
    })
  }
  </script>
</head>
<body>${body||''}
  <script type="module">${scriptToString(script||'')}</script>
</body>
</html>
`

/* todo:
 *   handle & optimise static routes (str instead of functions, compressed and served from memory)
 *
 */
