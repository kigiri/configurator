const http = require('http')
const { isStr } = require('izi/is')
const { join } = require('path')
const { parse: parseUrl } = require('url')
const { readFile: fsread, writeFile } = require('mz/fs')
const { gzip } = require('mz/zlib')
const config = require('./tools/mangos-config')
const allowedIp = require('./allowedIp')
const { spawn } = require('child_process')
const MariaDBSqlClient = require('mariasql')
const dbClient = new MariaDBSqlClient({
  host: '127.0.0.1',
  user: 'mangos',
  password: 'mangos',
})

const query = q => new Promise((s, f) =>
  dbClient.query(q, (e, r) => e ? f(e) : s(r)))

const readFile = (path, opts) => fsread(join(__dirname, path), opts)

const confPath = process.argv[2] || './'
const serverPath = join(confPath, `/run/mangosd`)
const configFile = join(confPath, `/etc/mangosd.conf`)
const conf = Object.create(null)

const getConf = (src, path) => readFile(src)
  .then(body => ({ body: JSON.stringify(config.parse(body.toString('utf8'))), path }))

const filesPath = [
  '/db.html',
  '/controltower.html',
  '/index.html',
  '/config-comments.json',
  getConf(join(confPath, `/etc/mangosd.conf.dist`), '/original.json'),
  getConf(configFile, '/config.json')
    .then(obj => {
      Object.assign(conf, JSON.parse(obj.body))
      return obj
    }),
]

const zip = text => gzip(text, { level: 9 })

const files = Object.create(null)

const addBody = ({ path, body }) => gzip(body, { level: 9 })
  .then(body => files[path] = files[path.slice(0, path.lastIndexOf('.'))] = {
    body,
    head: {
      'Content-Type': /json/.test(path) ? 'application/json' : 'text/html',
      'Content-Encoding': 'gzip',
    }
  })

const addFile = path => isStr(path)
  ? readFile(join(path)).then(body => addBody({ path, body }))
  : Promise.resolve(path).then(addBody)

const headers = {
  'Content-type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': [
    'Cache-Control',
    'Pragma',
    'Origin',
    'Authorization',
    'Content-Type',
    'X-Requested-With',
  ].join(', '),
  'Access-Control-Allow-Methods': 'GET',
}
const end = (code, message, res) => {
  res.writeHead(code, headers)
  res.end(JSON.stringify(message))
}

const b64 = s => Buffer.from(decodeURIComponent(s), 'base64').toString('utf8')
const matchParam = /.{3}([^\/]+).(.+)/
const saveConfig = (req, res) => {
  const [ , key, value ] = req.url.split(matchParam).map(b64)
  if (!Object.hasOwnProperty.call(conf, key)) return end(500, 'not found', res)
  if (conf[key] === value) return end(200, 'ok', res)
  conf[key] = value
  writeFile(configFile, config.build(conf), 'utf8')
    .then(() => end(200, 'ok', res))
    .catch(err => {
      console.error(err)
      end(500, `unable to write config file:${err.message}`, res)
    })
    .then(() => zip(JSON.stringify(conf)))
    .then(body => files['/config'].body = body)
    .catch(console.error)
}

const execSql = (req, res) => query(b64(req.url.slice(3)))
  .then(result => end(200, result, res), err => end(500, err.message, res))

let serverSpawn
(function restartServer() {
  serverSpawn = spawn(serverPath)
  serverSpawn.on('close', restartServer)
})()

const handleServer = (req, res) => {
  req.url
  kill(serverSpawn.pid)
}

const handlers = [
  saveConfig,
  execSql,
  handleServer,
]

const server = http.createServer((req, res) => {
  const ip = req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress

  if (!allowedIp.has(ip)) return end(403, 'forbiden', res)
  req.ip = ip
  const handler = handlers[req.url[1]]
  const url = parseUrl(req.url)
  console.log(ip,'->', url.pathname)
  if (handler) {
    try {
      return handler(req, res, url)
    } catch (err) {
      return end(500, err.message, res)
    }
  }

  const file = files[url.pathname]
  if (!file) return end(404, 'not found', res)

  res.writeHead(200, file.head)
  res.end(file.body)
})

Promise.all(filesPath.map(addFile))
  .then(() => {
    files['/'] = files[''] = files['/index']
    files['/db/'] = files['/db']

    server.listen(3254, () => console.log('listening at 3254'))
  })
  .catch(console.error)
