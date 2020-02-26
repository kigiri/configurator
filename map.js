import { html, svg, css, append } from './lib/demonade.js'
import { ToolTip } from './elem/tooltip.js'

const { use, g } = svg
const tooltip = ToolTip()
css(`#${tooltip.id} {
  background: #0009;
  padding: 0.5em 0.75em;
  border: 1px solid black;
  color: var(--foreground);
}`)

const toJSON = r => r.ok
  ? r.json()
  : r.text()
    .then(msg => Promise.reject(Error(msg)))

const query = q => console.log('executing query', q) || fetch('/admin/sql/exec', {
  method: 'POST',
  headers: { 'content-type': 'text/plain' },
  body: q,
}).then(toJSON)

const params = Object.fromEntries(new URLSearchParams(location.search))
const map = document.getElementById('map')
const r = -0.588541667

const inSTG = `map = 0
  AND position_x < -11215
  AND position_x > -15057
  AND position_y < 1091
  AND position_y > -1229`

const toQuery = names => {
  names = names.split(',').filter(Boolean)
  if (!names.length) return ''
  return `AND (${names.map(name => `LOWER(name) LIKE "%${name}%"`).join(' OR ')})`
}

const charactersQuery = id => `
  SELECT name, level, position_x x, position_y y, online, class, race
  FROM tbccharacters.characters
  WHERE ${inSTG} ${toQuery(params.player.toLowerCase())}`

const creatureQuery = (page=0) => `
select position_x x, position_y y, name, subname, id from tbcmangos.creature a
  join tbcmangos.creature_template b on a.id = b.Entry
  WHERE ${inSTG}
  AND name NOT LIKE "%[DND]%" ${toQuery(params.creature.toLowerCase())}
limit ${page},${page+1000};
`

const objectQuery = (page=0) => `
select position_x x, position_y y, name, guid id from tbcmangos.gameobject a
  join tbcmangos.gameobject_template b on a.id = b.Entry
  WHERE ${inSTG} ${toQuery(params.object.toLowerCase())}
limit ${page},${page+1000};
`

const getQuery = () => {
  if (params.creature) return creatureQuery
  if (params.player) return charactersQuery
  if (params.object) return objectQuery
}

const loadAll = async (q, res=[], n=0) => await query(q(n))
  .then(({rows}) => rows.length === 1000
    ? loadAll(q, [ ...res, ...rows ], n + 1000)
    : [ ...res, ...rows ])

const get = async () => {
  const q = getQuery()
  if (!q) return
  const rows = await loadAll(q)
  append(map, rows.map(p => tooltip.content(g(
    { className: `id_${p.id}` },
    use({ href: '#pin', x: -(p.y-1094), y: -(p.x+11216) })
  ), p.name)))
}

append(document.body, tooltip.element)
get(/* setInterval(get, 5000) */)

