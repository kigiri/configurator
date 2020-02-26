import { readFileStr } from 'https://deno.land/std/fs/mod.ts'
import { dirname, join } from 'https://deno.land/std/path/mod.ts'

const isHTTP = location.protocol.startsWith('http')
const base = dirname(isHTTP ? location.href : location.pathname.slice(1))
const read =  async path => {
  const res = await fetch(path)
  if (res.ok) return res.text()
  throw Error(`error ${res.status} fetching file ${path}`)
}



// console.log(join(base, '../lib.js').slice(2))
// console.log(await read('http://localhost:5000'))

const trim = s => s.slice(s[0] === '-' ? 1 : 0, s[s.length-1] === '-' ? -1 : s.length)
const slugify = s => s
  .normalize('NFKD').replace(/[^\w\s.-_\/]/g, '')
  //.normalize('NFKD').replace(/[^\w]/g, '')
  //.replace(/([^a-zA-Z_]+)/g, '-')


//console.log(slugify('ÉÉÉÉ'))
const [diagnostics, emitMap] = await Deno.bundle(
  "http://localhost:5000/item_template.js"
);

console.log(diagnostics)
console.log(emitMap)