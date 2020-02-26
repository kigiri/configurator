import { Status, STATUS_TEXT } from 'https://deno.land/std@v0.33.0/http/http_status.ts'
import { serve as httpServe } from 'https://deno.land/std@v0.33.0/http/server.ts'
import { dirname, extname, join } from 'https://deno.land/std@v0.33.0/path/mod.ts'
import { green, cyan, bold } from 'https://deno.land/std@v0.33.0/fmt/colors.ts'
import { readFileStr } from 'https://deno.land/std@v0.33.0/fs/mod.ts'
import { parse } from 'https://deno.land/std@v0.33.0/flags/mod.ts'

// import 'https://deno.land/x/dotenv/load.ts'

const isHTTP = location.protocol.startsWith('http')
const base = dirname(isHTTP ? location.href.split('//')[1] : location.pathname.slice(1))
const fetchCache = {}
const fileFetcher = !isHTTP ? readFileStr : async path => {
  const url = `${location.protocol}//${path}`
  console.log(green('Download'), url)
  const res = await fetch(url, { redirect: 'follow' })
  if (res.ok) return res.text()
  throw Error(`error ${res.status} fetching file ${path}`)
}
const fetchFile = path => fetchCache[path] || (fetchCache[path] = fileFetcher(path))

const rand = () => Math.random().toString(36).slice(2).padStart(11, '0')
export const boom = Object.fromEntries(Object.entries(Status).map(([k, v]) =>
  [k, err => {err.status = v; throw err}]))

const routes = {}
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

const flags = parse(Deno.args)
const env = Object.fromEntries(Object.entries(Deno.env()).map(([k,v]) => [k.toLowerCase(), v]))
const getFlag = (value, key) => key in flags ? flags[key] : key in env ? env[key] : value
export const vars = (defaults, ...key) => key.reduce(getFlag, defaults)
export const getIp = req =>
  req.headers.get('x-forwarded-for')
  || req.headers.get('x-real-ip')
  || req.conn.remoteAddr

export const getUser = req => {
  try { return atob(req.headers.get('authorization').split(' ')[1]).split(':')[0] }
  catch { return '' }
}

const contentTypeHeader = type => {
  const headers = new Headers()
  headers.set('content-type', type)
  return headers
}

export const json = data => ({ headers: contentTypeHeader('application/json'), body: JSON.stringify(data) })

export const redirect = to => {
  const headers = new Headers()
  headers.set('location', to)
  return { headers, body: '', status: 301 }
}

const handleRequest = async (req, routes) => {
  const { pathname, searchParams } = new URL(`http://localhost${req.url}`)
  console.log(green(req.method), pathname, getUser(req))
  const handler = routes[req.method]?.[pathname]
  if (!handler) boom.NotFound(Error(`no handlers for ${req.method} ${pathname}`))
  const params = (await readBody(req)) || Object.fromEntries(searchParams)
  return handler(params, req)
}

const serve = async () => {
  console.log(cyan(bold('Listen')), 'on port:', PORT)
  for await (const req of httpServe({ port: PORT })) {
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

const addRoute = method => {
  const r = routes[method] = {}
  return (path, handler, ignoreAlreadyExposed) => {
    const key = path.endsWith('/') ? path.slice(0, -1) : path
    if (r[key]) {
      if (ignoreAlreadyExposed) return
      throw Error(`${key} already exposed`)
    }
    const ext = extname(key)
    if (ext === ".html") {
      const slashed = `${key.slice(0, -5)}/`
      r[key] = r[key.slice(0, -5)] = handler //() => redirect(slashed)
      r[slashed] = handler
    } else if (!ext) {
      const slashed = `${key}/`
      r[key] = handler //() => redirect(slashed)
      r[slashed] = handler
    } else {
      r[key] = handler
    }
    console.log(cyan('Expose'), method, key||'/')
    return route
  }
}

export const DELETE = addRoute('DELETE')
export const PATCH = addRoute('PATCH')
export const POST = addRoute('POST')
export const PUT = addRoute('PUT')
export const GET = addRoute('GET')
export const route = { DELETE, PATCH, POST, PUT, GET }

export const serveFile = async (path, ignoreAlreadyExposed) => {
  const fullPath = join(base, path)
  const { pathname } = new URL(`p://${fullPath}`)
  try {
    const body = await fetchFile(fullPath)
    if (fullPath.endsWith('.js')) {
      const imports = body.split(/import [^'"]+.([^'"]+)/g).filter((a,i) => i%2)
      await Promise.all(imports.map(file => serveFile(join(dirname(path), file), true)))
      const headers = contentTypeHeader('application/javascript')
      GET(pathname, () => ({ body, headers }), ignoreAlreadyExposed)
    } else {
      GET(pathname, () => body, ignoreAlreadyExposed)
    }
  } catch (err) {
    console.log(path, 'not found')
    console.log(err)
    GET(pathname, () => boom.NotFound(err), ignoreAlreadyExposed)
  }
}

export const serveFiles = paths => Promise.all(paths.map(serveFile))
export const PORT = vars(8181, 'port', 'p')

serve()
