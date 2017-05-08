const http = require('http')
const { isStr } = require('izi/is')
const { join } = require('path')
const { readFile, writeFile } = require('mz/fs')
const { gzip } = require('mz/zlib')
const config = require('./tools/mangos-config')
const allowedIp = require('./allowedIp')

const confPath = process.argv[2] || './etc'
const configFile = join(confPath, `mangosd.conf`)
const conf = Object.create(null)

const getConf = (src, path) => readFile(src)
  .then(body => ({ body: JSON.stringify(config.parse(body.toString('utf8'))), path }))

const filesPath = [
  '/index.html',
  '/config-comments.json',
  getConf(join(confPath, `mangosd.conf.dist`), '/original.json'),
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
  ? readFile(`.${path}`).then(body => addBody({ path, body }))
  : Promise.resolve(path).then(addBody)

const end = (code, message, res) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
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
    .then(() => zip(JSON.stringify(conf[key])))
    .then(body => files['/config'].body = body)
    .catch(console.error)
}

const handlers = [
  saveConfig,
]

const server = http.createServer((req, res) => {
  const ip = req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress

  if (!allowedIp.has(ip)) return end(403, 'forbiden', res)

  const handler = handlers[req.url[1]]
  if (handler) return handler(req, res)

  const file = files[req.url]
  if (!file) return end(404, 'not found', res)

  res.writeHead(200, file.head)
  res.end(file.body)
})

Promise.all(filesPath.map(addFile))
  .then(() => {
    files['/'] = files[''] = files['/index']
    server.listen(3254, () => console.log('listening at 3254'))
  })
  .catch(console.error)