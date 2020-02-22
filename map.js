const style = `
html, body {
  margin: 0;
  padding: 0;
}

:root {
  --red:         #FF5555;
  --grey:        #9D9D9D;
  --green:       #1EFF00;
  --blue:        #0070DD;
  --white:       #FFFFFF;
  --purple:      #A335EE;
  --orange:      #FF8000;
  --artifact:    #E6CC80;
  --blizz:       #00CCFF;
  --deathKnight: #C41F3B;
  --druid:       #FF7D0A;
  --hunter:      #ABD473;
  --mage:        #69CCF0;
  --monk:        #00FF96;
  --paladin:     #F58CBA;
  --priest:      #FFFFFF;
  --rogue:       #FFF569;
  --shaman:      #0070DE;
  --warlock:     #9482C9;
  --warrior:     #C79C6E;
  --gold:        #FCD60F;
  --silver:      #C0C0C0;
  --copper:      #FFA45B;
}

.class_1 { fill: var(--warrior); background: var(--warrior); }
.class_2 { fill: var(--paladin); background: var(--paladin); }
.class_3 { fill: var(--hunter); background: var(--hunter); }
.class_4 { fill: var(--rogue); background: var(--rogue); }
.class_5 { fill: var(--priest); background: var(--priest); }
/*.class_6 { fill: var(--deathKnight); background: var(--deathKnight); }*/
.class_7 { fill: var(--shaman); background: var(--shaman); }
.class_8 { fill: var(--mage); background: var(--mage); }
.class_9 { fill: var(--warlock); background: var(--warlock); }
.class_11 { fill: var(--druid); background: var(--druid); }

.race_1 { stroke: var(--blue) } /* Human */
.race_2 { stroke: var(--red) } /* Orc */
.race_3 { stroke: var(--blue) } /* Dwarf */
.race_4 { stroke: var(--blue) } /* Night Elf */
.race_5 { stroke: var(--red) } /* Undead */
.race_6 { stroke: var(--red) } /* Tauren */
.race_7 { stroke: var(--blue) } /* Gnome */
.race_8 { stroke: var(--red) } /* Troll */
.race_10 { stroke: var(--red) } /* Blood Elf */
.race_11 { stroke: var(--blue) } /* Draenei */

text {
  fill: white;
  font: 40px sans-serif;
  text-anchor: middle;
  display: none;
  z-index: 1000;
}

g g:hover text {
  display: inherit;
}

svg {
  height: 100vh;
  width: 100vw;
}

#map-image {
  opacity: 0.3;
}

#pin {
  opacity: 0.7;
}

`
//  <image href="https://i.imgur.com/QBRy2ID.png" width="2318" height="3840" />
const body = `<svg viewBox="0 0 2318 3840" xmlns="http://www.w3.org/2000/svg">
  <symbol id="pin">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALBAMAAABbgmoVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAC1QTFRFAAAAAAAAAAAAR3BMAAAAAAAAAgYY1MIz6NRf+Ox3mY9JjIAmREAcV1M3p59X80VUBgAAAAZ0Uk5T/29/ABNFxQUIhgAAAEpJREFUCNdjMAlUUgwxYHBkYGBgdGAI4OiYyRDAINCRljlBgEGhbdW1CQoMCstWPANRZac3FCgwCGxPYy8QYAhgLy8HqoTqg5gCAO4AEzFnlApnAAAAAElFTkSuQmCC" width="28" height="28" />
  </symbol>
  <image id="map-image" href="https://i.imgur.com/L8lXZqL.png" width="2318" height="3840" />
  <g id="map"></g>
</svg>`
const script = () => {

const toJSON = r => r.ok
  ? r.json()
  : r.text()
    .then(msg => Promise.reject(Error(msg)))

const getLevelColor = lvl => {
  lvl = Number(lvl)
  if (lvl > 25) return 'red'
  if (lvl > 22) return 'orange'
  if (lvl > 16) return 'gold'
  if (lvl > 13) return 'green'
  return 'grey'
}

const getCost = cost => [
  ['gold', Math.floor(cost / 10000)],
  ['silver', Math.floor((cost % 10000) / 100)],
  ['copper', Math.floor(cost % 100)],
].filter(([,v]) => v)

const query = q => console.log('executing query', q) || fetch('/admin/sql', {
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

const charactersQuery = id => `
  SELECT name, level, position_x x, position_y y, online, class, race
  FROM tbccharacters.characters
  WHERE ${inSTG} AND id=${id}`

const creatureQuery = (page=0) => `
select position_x x, position_y y, name, subname, id from tbcmangos.creature a
  join tbcmangos.creature_template b on a.id = b.Entry
  WHERE ${inSTG}
  AND name NOT LIKE "%[DND]%"
  order by id
limit ${page},${page+1000};
`

const makeQuery = () => {
  if (params.creature) return creatureQuery(params.creature)
  return charactersQuery(1)
}

const loadAll = async (res=[], n=0) => await query(creatureQuery(n))
  .then(({rows}) => rows.length === 1000
    ? loadAll([ ...res, ...rows ], n + 1000)
    : [ ...res, ...rows ])

const get = async () => {
  const rows = await loadAll()
  const entries = rows.map(({id, name, subname }) =>
    [id, {id, name, subname, q: `${id}: ${name}${subname ? `<${subname}>`:''}` }])

  const creatures = Object.values(Object.fromEntries(entries))


  map.innerHTML = rows.map(p => `
    <g class="id_${p.id}">
      <use href="#pin" x="${-(p.y-1094)}" y="${-(p.x+11216)}" />
    </g>`
  ).join('\n')
}

get(/* setInterval(get, 5000) */)


}




// SERVER
import { magenta, bold } from 'https://deno.land/std/fmt/colors.ts'
import { serve, makePage } from './_server.js'

const index = makePage({ title: 'map', script, body, style })
await serve({ 'GET /': () => index }, 8383, bold(magenta('map')))
