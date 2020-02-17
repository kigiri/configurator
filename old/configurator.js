import { readFileStr, ensureFile, writeFileStr } from 'https://deno.land/std/fs/mod.ts'
import { join } from 'https://deno.land/std/path/mod.ts'
import { Status, STATUS_TEXT } from 'https://deno.land/std/http/http_status.ts'
import { serve } from 'https://deno.land/std/http/server.ts'
import { slugify } from 'https://deno.land/x/slugify/mod.ts'

// ENV
const PORT = 8686
const CONFIG_DIR = '.'
const SUFFIX = '.conf.dist'

// TOOLS
const all = (arr, fn) => Promise.all(arr.map(x => fn(x)))
const boom = Object.fromEntries(Object.entries(Status).map(([k, v]) =>
  [k, err => {err.status = v; throw err}]))

// PARSE CONFIG FILE
const getType = l => {
  if (l[0] !== '#' && l[0] !== '[') return 'property'
  if (/# \S/.test(l)) return 'category'
  if (/# {4}\S/.test(l)) return 'description-key'
  if (/# {5,}\S/.test(l)) return 'description-message'
  return ''
}

const parseConfig = data => data
  .split('\n')
  .map(l => l.trim())
  .map(l => [ getType(l), l ])
  .filter(([type, l]) => type && l)
  .reduce(({ prevType, conf, cat, desc }, [type, l]) => {

    if (type !== 'description-message' && prevType === 'description-message') {
      cat.descriptions.push(desc)
      desc = {}
    }

    if (type === 'property') {
      const [ k, v ] = l.split('=').map(s => s.trim())
      conf[k] = { key: k, value: v, cat: cat.title }
      const match = cat.descriptions.find(d => d.key === k.toLowerCase())
      match && (conf[k].description = match.msg)
    } else if (type === 'category') {
      cat = { title: l.slice(1).split(/ +#$/)[0].trim(), descriptions: [] }
    } else if (type === 'description-key') {
      desc.key = l.slice(5).split(' ')[0].toLowerCase()
    } else if (type === 'description-message') {
      desc.msg = desc.msg ? `${desc.msg}\n${l.slice(9)}` : l.slice(9)
    }

    return { prevType: type, conf, cat, desc }
  }, { conf: {}, cat: { descriptions: [] }, desc: {} })
  .conf

const saveConfig = async (file, config) => {
  const data = Object.entries(config).map(([k, v]) => `${k} = ${v.value}`).join('\n')
  await writeFileStr(file, data)
}

// CLIENT
const css = `
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
h1,h2,h3 {
  font-weight: normal;
  padding-right: 0.25em;
}
h1 { color: var(--pink) }
h2 {
  color: var(--cyan);
  margin: 64px 0 12px;
  text-align: center;
}
h3 {
  display: table-cell;
  padding: 0.25em 0.375em;
  width:1px;
}
input {
  display: table-cell;
  background: transparent;
  border: 0;
  color: var(--green);
  width: 100%;
  padding: 0 0.375em;
  outline: 0;
  border-radius: 0.125em;
  height: 2em;
}
input[disabled] { color: transparent }
input:focus {
  color: var(--yellow);
  background: #0003;
}
input[type="submit"] {
  width: fit-content;
  text-transform: uppercase;
}
label {
  display: table;
  width: 100%;
}
form > div {
  display: flex;
  border-radius: 0.25em;
  background: var(--selection);
  color: var(--foreground);
  margin-top: 2px;
}
pre {
  white-space: pre-wrap;
  margin-bottom: 2em;
  padding: 1em 2em;
}
.changed h3 {
  color: var(--orange)
}
`

const scriptFn = () => {
  const { pathname } = location
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`
  const save = async form => {
    try {
      const { value } = form[0]
      const { i, key, source } = form.dataset
      form.className = 'changing'
      const rest = await fetch([
        `${path}set?i=${i}`,
        `key=${encodeURIComponent(key)}`,
        `value=${encodeURIComponent(value)}`,
      ].join('&'))
      form.className = value === source ? 'default' : 'changed'
      form.dataset.value = value
    } catch (err) {
      form.className = 'failed'
    }
  }

  for (const form of document.getElementsByTagName('form')) {
    const { source } = form.dataset
    const [input, submit] = form

    form.className = input.value === source ? 'default' : 'changed'
    const handleChange = () => submit.disabled = input.value === form.dataset.value
    const handleSubmit = event => {
      event.preventDefault()
      if (form.className === 'saving') return
      form.className = 'saving'
      save(form).then(handleChange)
    }

    const handleKeyboard = event => {
      if (event.key === 'Escape') {
        input.value = form.dataset.value
        submit.disabled = true
        input.blur()
      } else if (event.ctrlKey && event.key === 's') {
        handleSubmit(event)
      }
    }

    input.addEventListener('keydown', handleKeyboard)
    input.addEventListener('change', handleChange, false)
    input.addEventListener('keyup', handleChange, false)
    input.addEventListener('blur', handleChange, false)
    input.addEventListener('focus', () => input.select())
    form.addEventListener('submit', handleSubmit)
  }
}

const script = scriptFn.toString().slice(7, -1).trim()
const quot = s => `"${String(s).replace(/"/g, '&quot;')}"`
const generateBody = configs => `<!DOCTYPE html>
<html>
<head>
  <title>Configurator</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="shortcut icon" type="image/x-icon" href="data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAx42QAFP/FABXQkMAQC0uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAQBEREREREREAFEREREREQQAURERERERBABREREREREEAFEREREREQQAURERERERBABQERAAEREEAFCBEIiREQQAUQgRERERBABRAJEREREEAFAJEREREQQAUJERERERBABRERERERDEAEREREREREQQAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA">
  <style>${css}</style>
</head>
<body>${configs.map(({ title, version, categories }, i) => `
  <div style="text-align: center; margin-bottom: 24px">
    <h1 id="${slugify(title)}-${i}">${title}</h1>
    ${version.key} ${version.value}
  </div>
  ${categories.map(([category, content]) => `
  <div>
    <h2 id="${slugify(category)}-${i}">${category}</h2>
    <div>
      ${content.map(({ key, value, source, description }) => `
      <form
        data-i="${i}"
        data-key=${quot(key)}
        data-value=${quot(value)}
        data-source=${quot(source)}
      >
        <div>
          <label>
            <h3 id="${slugify(key)}-${i}">${key}</h3>
            <input value=${quot(value)}/>
          </label>
          <input type="submit" value="save" disabled/>
        </div>
        ${description ? `<pre>${description}</pre>` : ''}
      </form>`).join('\n')}
    </div>
  </div>`).join('\n')}`).join('\n')}
  <script>${script}</script>
</body>
</html>`


// SERVER

// scan directory to find config files
const allFiles = (await Deno.readDir(CONFIG_DIR))
  .filter(info => info.isFile() && info.name.endsWith(SUFFIX))
  .map(info => [info.name.slice(0, -5), info.name])

// ensure file exist, or generate them
await all(allFiles, async ([file, fileSource]) => {
  try {
    const stat = await Deno.lstat(file)
    if (!stat.isFile()) throw Error(`Ensure path exists, expected 'file'`)
  } catch (err) {
    if (err instanceof Deno.DenoError && err.kind === Deno.ErrorKind.NotFound) {
      await saveConfig(file, parseConfig(await readFileStr(fileSource)))
      console.log(file, 'generated.')
    } else throw err
  }
})

// read & parse configs
const getConfigs = async files => {
  const [conf, defaultConf] = (await all(files, readFileStr)).map(parseConfig)
  const mergedProps = Object.values(defaultConf)
    .map(prop => ({ ...prop, value: conf?.[prop.key]?.value ?? '', source: prop.value ?? '' }))

  const groupedByCategory = {}
  for (const prop of mergedProps) {
    (groupedByCategory[prop.cat] || (groupedByCategory[prop.cat] = [])).push(prop)
  }

  const [[title, [version]], ...categories] = Object.entries(groupedByCategory)

  return { title, version, categories }
}

const getConfig = async (i, key) => {
  if (!allFiles[i]) boom.NotFound(Error(`no config at index ${i}`))
  const file = allFiles[i][0]
  const config = parseConfig(await readFileStr(file))
  if (!config[key]) boom.NotFound(Error(`${key} not found in ${file}`))
  return { file, config }
}

const route = {}
route['/'] = async () => generateBody(await all(allFiles, getConfigs))
route['/get'] = async ({ i, key }) => (await getConfig(i, key)).value
route['/set'] = async ({ i, key, value }) => {
  const { config, file } = await getConfig(i, key)
  await saveConfig(file, { ...config, [key]: { value } })
  return 'OK'
}

console.log('listening on port:', PORT)
for await (const req of serve({ port: PORT })) {
  const { pathname, searchParams } = new URL(`http://localhost${req.url}`)

  try {
    if (!route[pathname]) boom.NotFound(Error(`no handlers for ${pathname}`))
    req.respond({ body: await route[pathname](Object.fromEntries(searchParams)) })
  } catch (err) {
    console.log(err)
    const status = err.status || Status.InternalServerError
    req.respond({ body: STATUS_TEXT[status], status })
  }

  await new Promise(r => setTimeout(r, 100))
}

/* todo:
 *   client: display form states with css (saving / failed / etc...)
 *   config: env var & argv
 *   server: log & fail if no files found
 *   client: auto-update anchor in url
 *
 */
