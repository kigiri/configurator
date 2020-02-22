import { ensureDir, readFileStr, writeFileStr, move } from 'https://deno.land/std/fs/mod.ts'
import { yellow, cyan, bold } from 'https://deno.land/std/fmt/colors.ts'

import { Client } from 'https://deno.land/x/mysql/mod.ts'
import { slugify } from 'https://deno.land/x/slugify/mod.ts'

import { serve, boom, makePage, getUser, json } from './_server.js'

// SETUP
const client = await new Client().connect({
  hostname: '127.0.0.1',
  username: 'mangos',
  password: 'mangos',
})

// CLIENT
const style = `
html,body {
  max-width: 100%;
  background: var(--selection)
}
h1, h2 { text-align: center }
h2 { margin-bottom: 1em }
#output, #query {
  width: 100%;
  border-radius: 0.25em;
  padding: 0.25em;
  color: var(--foreground);
  background: var(--background);
}
#output { min-height: 10vh }
#query {
  height: calc(50vh - 10em);
  border: none;
}
form { text-align: center }
#skip { var(--yellow) }
#submit:after { content: "execute" }
.highlight #submit:after {
  color: var(--cyan);
  content: "drop files";
}
.highlight #query { background: var(--cyan) }
button {
  margin: 1em;
  background: var(--background);
  color: var(--green);
  padding: 0.5em 0.75em;
  border: none;
  border-radius: 0.2em;
  cursor: pointer;
}
button[disabled] {
  color: var(--comment);
}
#save:not(:target) { display: none }
#execute:not(:target) { display: none }
#history:not(:target) { display: none }
a .time {
  color: var(--comment);
  font-style: italic;
}
#history button:hover, #save button:hover {
  color: var(--red);
  background: var(--background);
}
#history button.warning, #save button.warning {
  background: var(--red);
  color: var(--background);
}
#history button, #save button {
  padding: 0.1em 0.25em;
  color: var(--comment);
  margin: 0;
  background: transparent;
}

#history, #save {
  padding: 0.25em;
  background: var(--background);
  border-radius: 0.25em;
}
h2 a.current { color: var(--yellow) }

`

const htmlBody = `
  <h1>SQL</h1>
  <h2><a href="#execute">execute</a> - <a href="#save">save</a> - <a href="#history">history</a></h2>
  <div id="execute">
    <form id="form" method="POST">
      <textarea id="query" onfocus="e => e.target.select()"></textarea>
      <button id="submit"></button>
      <button id="skip" type="button" disabled>skip</button>
    </form>
    <pre id="info"></pre>
    <table id="output"></table>
  </div>
  <div id="history">history loading...</div>
  <div id="save">saves loading...</div>
`

const script = () => {
  const form = document.getElementById('form')
  const info = document.getElementById('info')
  const save = document.getElementById('save')
  const skip = document.getElementById('skip')
  const query = document.getElementById('query')
  const output = document.getElementById('output')
  const submit = document.getElementById('submit')
  const history = document.getElementById('history')

  let content = []
  window.files = { save: [], history: [] }
  const elements = { save, history }
  const methods = {
    DELETE: 'var(--red)',
    INSERT: 'var(--cyan)',
    SELECT: 'var(--green)',
    UPDATE: 'var(--yellow)',
    REPLACE: 'var(--orange)',
  }

  const rtf = new Intl.RelativeTimeFormat('en', { style: 'narrow' })
  const units = Object.entries({year:31536e6,month:2628e6,day:864e5,hour:36e5,minute:6e4,second:1e3})
  const relatime = timestamp => {
    const elapsed = timestamp - Date.now()
    for (const [u, size] of units) {
      if (Math.abs(elapsed) > size || u === 'second') return rtf.format(~~(elapsed/size), u)
    }
  }

  const updateHash = route => {
    const [prev] = document.getElementsByClassName('current')
    prev && prev.classList.remove('current')
    route && (location.hash = route)
    document.querySelector(`a[href="${location.hash}"]`)
      .classList.add('current')
  }

  window.handleDelete = async (event, file) => {
    if (!event.target.classList.contains('warning')) {
      event.target.classList.add('warning')
      setTimeout(() => event.target.classList.remove('warning'), 1500)
      return
    }
    event.target.classList.remove('warning')
    clearTimeout(event.target.warningTimeout)
    event.target.disabled = true
    const res = await fetch(file.url, { method: 'DELETE' })
    if (!res.ok) return event.target.disabled = false
    fetchFiles(file.route)
  }

  window.handleSave = async (event, file) => {
    event.target.disabled = true
    const res = await fetch(file.url, { method: 'POST' })
    if (!res.ok) return event.target.disabled = false
    fetchFiles(file.route)
  }

  window.handleLoad = async (event, file) => {
    event.preventDefault()
    event.target.disabled = true
    try {
      const res = await fetch(file.url)
      if (!res.ok) return
      query.value = await res.text()
      location.hash = '#execute'
    } finally {
      event.target.disabled = false
    }
  }

  const fetchFiles = async key => {
    if (location.hash !== `#${key}`) return
    const res = await fetch(`${location.pathname}/${key}`)
    const elem = elements[key]
    if (!res.ok) return elem.textContent = await res.text()
    files[key] = (await res.json())
      .map(f => ({...f, type: `${key}` }))
      .sort((a, b) => b.name.localeCompare(a.name))
    const url = `${location.pathname}/${key}`
    for (const file of files[key]) {
      file.route = key
      file.url = `${url}?name=${encodeURIComponent(file.name)}`
    }
    elem.innerHTML = files[key].length
      ? files[key].map((f, i) => genFile(f, `files.${key}[${i}]`)).join(`\n`)
      : `no ${key} files`
  }

  const genName = name => {
    const [ t, m, u, ...rest] = name.split('_')
    const user = `<span style="color:var(--yellow)">${u[0].toUpperCase()}${u.slice(1)}</span>`
    return [
      `<span class="method" style="color:${methods[m]||'var(--foreground)'}">[${m}]</span>`,
      `<span class="title">${rest.join('_') || 'untitled'}</span>`,
      `<span class="time">by ${user}, ${relatime(new Date(Number(t)).getTime())}</span>`,
    ].join(' ')
  }

  const genFile = ({ name, size }, i) => `
    <div>
      <button tabindex="-1" onclick="handleDelete(event, ${i})">X</button>
      <button tabindex="-1" onclick="handleSave(event, ${i})">💾</button>
      <a
        href="${location.pathname}/file?name=${name}"
        download="${name}.sql"
        onclick="handleLoad(event, ${i})"
      >${genName(name)}</a>
    </div>`

  const fetchAll = () => Promise.all(Object.keys(files).map(fetchFiles))

  if (location.hash) {
    fetchAll()
    updateHash()
  } else {
    updateHash('#execute')
  }

  window.addEventListener('hashchange', event => {
    updateHash()
    fetchAll()
  })

  const next = () => {
    submit.disabled = false
    content.length && (query.value = content.shift())
    skip.disabled = !content.length
    submit.focus()
  }

  window.addEventListener('onkeydown', event => {
    if (document.activeElement.tagName === 'TEXTAREA') return
    if (event.key.toUpperCase() === 's') {
      event.preventDefault()
      next()
    }
  })

  const renderData = (fields, rows) => output.innerHTML = `
    <thead>
      <tr>
        ${fields.map(({ name }) => `
        <th>${name}</th>`).join('\n')}
      </tr>
    </thead>
    <tbody>${rows.map(r => `
      <tr>${Object.values(r).map(value => `
        <td>${value}</td>`).join('\n')}
      </tr>`).join('\n')}
    </tbody>`

  const handleSubmit = async event => {
    event.preventDefault()
    if (!query.value.trim()) return
    console.debug(query.value)
    submit.disabled = true
    const res = await fetch(`${location.pathname}/log`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: query.value,
    })

    if (!res.ok) {
      skip.disabled = false
      const error = await res.text()
      info.textContent = `affected rows: 0`
      renderData([{ name: 'sql_error' }], [{error}])
      return
    }

    const { fields = [], rows = [], affectedRows = 0 } = await res.json()
    info.textContent = `affected rows: ${affectedRows}`
    output.innerHTML = `
    <thead>
      <tr>
        ${fields.map(({ name }) => `
        <th>${name}</th>`).join('\n')}
      </tr>
    </thead>
    <tbody>${rows.map(r => `
      <tr>${Object.values(r).map(value => `
        <td>${value}</td>`).join('\n')}
      </tr>`).join('\n')}
    </tbody>`

    next()
  }

  form.addEventListener('submit', handleSubmit)
  skip.addEventListener('click', next, false)

  const on = (eventNames, fn) => {
    const handler = e => (e.preventDefault(), fn(e))
    for (const eventName of eventNames) {
      form.addEventListener(eventName, handler, false)
    }
  }

  const readFile = async file =>
    `${await file.text().catch(err => `-- ERROR: ${err.message}\n-- ${file.name} END`)}`

  const readFiles = async ({ dataTransfer }) => {
    content = (await Promise.all([...dataTransfer.files].map(readFile))).join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .map((n, i, { length }) => `-- query ${i+1}/${length}\n${n}`)

    next()
  }

  on(['dragenter', 'dragover'], () => form.classList.add('highlight'))
  on(['dragleave', 'drop'], () => form.classList.remove('highlight'))
  on(['drop'], readFiles)
}

const index = makePage({ title: 'sql', style, script, body: htmlBody })

// SERVER
const base = bold(yellow('sql'))
const log =  (...args) => console.log(base, ...args)
const parseQuery = query => {
  let title = ''
  if (!query || !query.trim()) boom.BadRequest(Error('empty request'))
  const lines = query.split('\n')
  for (const line of lines) {
    const l = line.trim()
    if (!l.length) continue
    query.split()
    if (!l.startsWith('--')) return {
      action: l.trim().split(' ')[0].toUpperCase(),
      title: slugify(title.slice(2).trim()).replace(/\./g, '_').slice(0, 64),
    }
    title = l
  }
  boom.BadRequest(Error('unable to parse query'))
}

const execQuery = async query => {
  const { action, title } = parseQuery(query)

  return {
    action,
    title,
    response: await client.execute(query).catch(boom.BadRequest)
  }
}

const ensureValidName = name => (!name || name.includes('.'))
  && boom.BadRequest(Error('invalid file name.'))

const getSQLFileOrDir = dirname => async ({ name }) => {
  if (name) {
    ensureValidName(name)
    return readFileStr(`${dirname}/${name}.sql`)
  }

  const files = await Deno.readDir(dirname)
  const formatedFiles = files
    .filter(f => f.name.endsWith('.sql'))
    .map(f => ({ name: f.name.slice(0, -4), size: f.len }))

  return json(formatedFiles)
}

const route = {}
route['GET /'] = () => index
route['GET /save'] = getSQLFileOrDir('sql_save')
route['POST /save'] = ({ name }) => {
  ensureValidName(name)
  move(`sql_save/${name}.sql`, `sql_history/${name}.sql`)
}
route['DELETE /save'] = ({ name }) => {
  ensureValidName(name)
  move(`sql_save/${name}.sql`, `sql_trash/${name}.sql`)
}

route['GET /history'] = getSQLFileOrDir('sql_history')
route['POST /history'] = ({ name }) => {
  ensureValidName(name)
  move(`sql_history/${name}.sql`, `sql_save/${name}.sql`)
}

route['DELETE /history'] = ({ name }) => {
  ensureValidName(name)
  move(`sql_history/${name}.sql`, `sql_trash/${name}.sql`)
}

route['POST /'] = async query => json((await execQuery(query)).response)
route['POST /log'] = async (query, req) => {
  const user = getUser(req)

  const start = Date.now()
  const ts = bold(cyan(String(start)))
  const { action, title, response } = await execQuery(query)
  log(action, ts, 'completed in', Date.now() - start, 'ms by', user)
  writeFileStr(`sql_history/${start}_${action}_${user}_${title}.sql`, query)
    .catch(log)

  return json(response)
}

await ensureDir('sql_history')
await ensureDir('sql_trash')
await ensureDir('sql_save')
await serve(route, 8787, base)
