import { ensureDir, readFileStr, writeFileStr, move } from 'https://deno.land/std@v0.33.0/fs/mod.ts'
import { yellow, cyan, bold } from 'https://deno.land/std@v0.33.0/fmt/colors.ts'

import { Client } from 'https://deno.land/x/mysql/mod.ts'
import { slugify } from './slugify.js'

import { boom, serveFiles, getUser, json, GET, POST, DELETE } from './lib.js'

// SETUP
const client = await new Client().connect({
  hostname: '127.0.0.1',
  username: 'mangos',
  password: 'mangos',
})

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

GET('/sql/save', getSQLFileOrDir('sql_save'))
POST('/sql/save', ({ name }) => {
  ensureValidName(name)
  move(`sql_save/${name}.sql`, `sql_history/${name}.sql`)
})

DELETE('/sql/save', ({ name }) => {
  ensureValidName(name)
  move(`sql_save/${name}.sql`, `sql_trash/${name}.sql`)
})

GET('/sql/history', getSQLFileOrDir('sql_history'))
POST('/sql/history', ({ name }) => {
  ensureValidName(name)
  move(`sql_history/${name}.sql`, `sql_save/${name}.sql`)
})

DELETE('/sql/history', ({ name }) => {
  ensureValidName(name)
  move(`sql_history/${name}.sql`, `sql_trash/${name}.sql`)
})

POST('/sql/exec', async query => json((await execQuery(query)).response))
POST('/sql/log', async (query, req) => {
  const user = getUser(req)
  const start = Date.now()
  const ts = bold(cyan(String(start)))
  const { action, title, response } = await execQuery(query)
  log(action, ts, 'completed in', Date.now() - start, 'ms by', user)
  writeFileStr(`sql_history/${start}_${action}_${user}_${title}.sql`, query)
    .catch(log)

  return json(response)
})

await ensureDir('sql_history')
await ensureDir('sql_trash')
await ensureDir('sql_save')
await serveFiles([
  '../sql.html',
  '../sql.js',
  '../db.html',
  '../db.js',
  '../map.html',
  '../map.js',
])
