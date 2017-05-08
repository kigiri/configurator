const fs = require('fs')
const conf = require('./tools/mangos-config')
const comments = require('./config-comments')

const configPath = 'original.conf'
const defaults = conf.parse(fs.readFileSync(`${configPath}.dist`, 'utf8'))
const config = conf.parse(fs.readFileSync(configPath, 'utf8'))
const log = err => err && console.error(err)
const saveConf = () => fs.writeFile(configPath, conf.build(config), 'utf8', log)


fs.writeFile('original.json', JSON.stringify(defaults), 'utf8', log)
