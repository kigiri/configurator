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
  REPLACE: 'var(--pink)',
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
  const url = `${location.pathname}${key}`
  const res = await fetch(url)
  const elem = elements[key]
  if (!res.ok) return elem.textContent = await res.text()
  files[key] = (await res.json())
    .map(f => ({...f, type: `${key}` }))
    .sort((a, b) => b.name.localeCompare(a.name))
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
      href="${location.pathname}file?name=${name}"
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

const handleSubmit = async event => {
  event.preventDefault()
  if (!query.value.trim()) return
  console.debug(query.value)
  submit.disabled = true
  const res = await fetch(`${location.pathname}log`, {
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

on(['dragenter', 'dragover'], () => form.classList.add('highlight'))
on(['dragleave', 'drop'], () => form.classList.remove('highlight'))
on(['drop'], readFiles)
