import { Client } from 'https://deno.land/x/mysql/mod.ts'
import { serve, boom, makePage } from './_server.js'

// SETUP
const PORT = 8787
const client = await new Client().connect({
  hostname: '127.0.0.1',
  username: 'mangos',
  password: 'mangos',
  db: 'tbcmangos',
})

// CLIENT
const style = `

`

const htmlBody = `
  <h1>SQL</h1>
  <form id="form" method="POST">
    <textarea id="query"></textarea>
    <input type="submit" />
  </form>
`

const script = () => {
  const form = document.getElementById('form')
  const query = document.getElementById('query')
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const sql = query.value

    console.log(sql)

    const res = await fetch(location.pathname, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: sql,
    })

    console.log(await res.text())
    const res2 = await fetch(location.pathname, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: sql,
    })

    console.log(await res2.text())

  })
}

const index = makePage({ title: 'sql', style, script, body: htmlBody })

// SERVER
const route = {}
route['GET /'] = () => index
route['POST /'] = body => {
  console.log({body})
  return 'ok'
}

serve(route, PORT)