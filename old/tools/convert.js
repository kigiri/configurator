const tables = require('./table')
const doc = require('./result')
const fs = require('mz/fs')
const allTables = Object.keys(tables)

//allTables.forEach()
const matchType = /([^ (]+)\(?([0-9]+)?\)?(.*)/
const numberTypes = new Set([
  'bigint',
  'float',
  'int',
  'mediumint',
  'smallint',
  'tinyint',
  'timestamp',
])

const rgx = /\.\.\/\.\.\/file-formats\/dbc\//g
const replaceLink = t => t && t.replace(rgx, '@DBC').trim()
const resturcture = tableName => tables[tableName] = tables[tableName].columns
  .reduce((acc, c) => {
    const [ , type, size, unisgned ] = c.type.split(matchType)
    const constructor = numberTypes.has(type) ? Number : String

    acc[c.name] = {
      default: (c.defaultValue && constructor(c.defaultValue)) || undefined,
      str: numberTypes.has(type) ? undefined : true,
      doc: replaceLink((doc[tableName] || {})[c.name]),
    }
    return acc
  }, {})
allTables.forEach(resturcture)
fs.writeFile('finalSchema.json', JSON.stringify(tables, null, 2))
  .then(console.log, console.error)
/*
fs.readdir('world')
  .then(files => Promise.all(files.map(handleFile)))
  .then(() => fs.writeFile('./result.json', JSON.stringify(result)))
  .then(() => console.log('all done'))
*/