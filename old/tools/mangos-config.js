const each = (obj, fn) => Object.keys(obj).forEach(i => fn(obj[i], i))
const reduce = (fn, s) => _ => Object.keys(_).reduce((a, k) => fn(a, _[k], k), s)
const plzParse = v => { try { return JSON.parse(v) } catch (err) { return v } }
const numeral = n => /-?[0-9.]+/.test(n)
const stringify = s => numeral(s) ? s : JSON.stringify(s)

const buildConf = reduce((acc, val, key) =>`${acc}\n${key} = ${stringify(val)}`,
  "[MangosdConf]")

const parseConf = text => text.slice(text.indexOf('[MangosdConf]') + 13)
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean)
  .filter(s => s[0] !== '#')
  .reduce((acc, s) => {
    const index = s.indexOf('=')
    acc[s.slice(0, index).trim()] = plzParse(s.slice(index + 1).trim())
    return acc
  }, {})

module.exports = {
  build: buildConf,
  parse: parseConf,
}
