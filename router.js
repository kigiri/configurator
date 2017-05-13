const observ = require('izi/emiter/observ')
const loc = window.location
const parseRoute = hash => hash.split('?')[0].slice(2)
const route = observ.check(parseRoute(loc.hash))

const set = route.set
window.addEventListener('hashchange', ev => {
  const newHash = parseRoute(new URL(ev.newURL).hash)
  set(newHash)
})

route.set = hash => loc.hash = `/${hash}`

module.exports = route
