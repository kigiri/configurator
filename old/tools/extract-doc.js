const { default: { parse } } = require('restructured')
const fs = require('mz/fs')

const result = {}
const toText = (acc, child) => child
  ? child.children
    ? child.children.reduce(toText, acc)
    : (acc + child.value || '')
  : acc

const p = text => parse(text.slice(text.indexOf('Fields') + 15))
  .children.reduce((acc, {  children: [ title, text ] }) =>
    (acc[toText('', title)] = toText('', text), acc), {})

const handleFile = f => fs.readFile(`world/${f}`, "utf8")
  .then(r => result[f.slice(0, -4).replace('-', '_')] = p(r))
  .catch(() => console.log(`unable to parse ${f}`))

fs.readdir('world')
  .then(files => Promise.all(files.map(handleFile)))
  .then(() => fs.writeFile('./result.json', JSON.stringify(result)))
  .then(() => console.log('all done'))
