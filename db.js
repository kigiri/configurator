const h = require('izi/h')
const { isNum } = require('izi/is')
const each = require('izi/collection/each')
const curry = require('izi/auto-curry')
const store = require('izi/collection/store')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const debounce = require('izi/debounce')
const bind = require('izi/data-bind')
const wow = require('./dbc')
const loop = require('izi/loop')
const persistant = require('izi/persistant')
const observ = require('izi/emiter/observ')
const keyHandler = require('izi/key-handler')

// STATE
const logoSrc = 'data:image/png;base64,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'
const wowheadCdn = '//wow.zamimg.com/modelviewer/thumbs'
const router = require('izi/router')
const event = require('izi/event')
const dbInfo = Object.create(null)
const colorKeys = [
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'foreground',
  'yellow',
]
const color = {
  background:    '#282A36',
  selection:     '#44475A',
  foreground:    '#F8F8F2',
  comment:       '#6272A4',
  cyan:          '#8BE9FD',
  green:         '#50FA7B',
  orange:        '#FFB86C',
  pink:          '#FF79C6',
  purple:        '#BD93F9',
  red:           '#FF5555',
  yellow:        '#F1FA8C',
  blizz: {
    grey:        '#9D9D9D',
    green:       '#1EFF00',
    blue:        '#0070DD',
    white:       '#FFFFFF',
    purple:      '#A335EE',
    orange:      '#FF8000',
    artifact:    '#E6CC80',
    blizz:       '#00CCFF',
    deathKnight: '#C41F3B',
    druid:       '#FF7D0A',
    hunter:      '#ABD473',
    mage:        '#69CCF0',
    monk:        '#00FF96',
    paladin:     '#F58CBA',
    priest:      '#FFFFFF',
    rogue:       '#FFF569',
    shaman:      '#0070DE',
    warlock:     '#9482C9',
    warrior:     '#C79C6E',
    gold:        '#FCD60F',
    silver:      '#C0C0C0',
    copper:      '#FFA45B',
  }
}
color.blizz.rank = [
  color.blizz.white,
  color.blizz.green,
  color.blizz.blue,
  color.blizz.purple,
  color.blizz.orange,
  color.blizz.artifact,
]
color.blizz.quality = [
  color.blizz.grey,
  color.blizz.white,
  color.blizz.green,
  color.blizz.blue,
  color.blizz.purple,
  color.blizz.orange,
  color.blizz.artifact,
]
const { cyan, green, orange, pink, red, purple, yellow } = color


// LIB
const wesh = _ => (console.log(_), _)
const g = (s, k) => s[k] || (s[k] = Object.create(null))
const b64 = s => encodeURIComponent(btoa(s.trim()))
const toJSON = r => r.ok
  ? r.json()
  : r.json().then(msg => Promise.reject(Error(msg)))

const avg = (...args) => Math.round(args
  .map(Number)
  .reduce((t, n) => (n + t) / 2))

const getLevelColor = lvl => {
  lvl = Number(lvl)
  if (lvl > 19) return red
  if (lvl > 15) return orange
  return lvl > 10
    ? color.blizz.yellow
    : color.blizz.grey
}

const getCost = cost => ({
  gold: Math.floor(cost / 10000),
  silver: Math.floor((cost % 10000) / 100),
  copper: Math.floor(cost % 100),
})

const query = a => {
  console.log('executing query', a)
  return fetch(`http://chupato.jcj.ovh/1/${b64(a)}`).then(toJSON)
}

const toKV = (v, k) => `${k}="${v}"`
const querify = sep => params => map.toArr(toKV, params).join(sep)
querify.comma = querify(', ')
querify.and = querify(' AND ')
querify.or = querify(' OR ')
const toValue = v => `"${v}"`
const toFields = params => `(${Object.keys(params).join(', ')})`
const toValues = params => `(${map.toArr(toValue, params).join(', ')})`
const insert = curry((db, params) => query(`
  INSERT INTO ${db} ${toFields(params)}
  VALUES ${toValues(params)}
`))


// ELEMENTS
const comment = h.style('span', { color: color.comment })
const dbLink = h.style('a', {
  color: color.comment,
  textDecoration: 'none',
  border: '1px solid',
  borderRadius: '5px',
  padding: '1.25em',
  width: '20em',
  margin: '2em auto',
  display: 'block',
  textAlign: 'center',
  background: color.background,
})

const flex = h.style({ display: 'flex' })
const tableLink = h.style('a', {
  color: color.comment,
  textDecoration: 'none',
  padding: '0.25em',
})

const logo = h.a({
  href: '#/',
  style: {
    padding: '15px 15px 0',
    borderRadius: '50%',
    marginBottom: '-1em',
    marginLeft: '4em',
    borderRadius: '50%',
  },
}, h.img({
  src: logoSrc,
  style: { width: '75px', height: '56.5px' },
}))

const keywordWrapper = h.style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '66em',
})

const content = h.div.style({
  background: color.selection,
  borderRadius: '0.5em',
  margin: '0 15px 15px',
  padding: '15px',
})

const labelEl = h.style('label', { display: 'flex', alignItems: 'baseline' })

const inputEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  padding: '0.75em',
  margin: '1em',
  borderRadius: '0.2em',
  border: 'none',
  width: '100%',
})

const inputHeader = h.style({
  width: '100%',
  display: 'flex',
  backgroundColor: color.background,
  borderRadius: '0.25em',
  padding: '0.5em',
  margin: '0.25em',
  boxShadow: `0 0 20px 8px ${color.background} inset`,
  backgroundPosition: 'right',
  backgroundRepeat: 'no-repeat',
  minHeight: '115px',
})

const seamlessLink = h.style('a', { textDecoration: 'none', color: 'inherit' })

const dbEl = h.span()
const tableEl = h.span()
const primaryEl = h.span.style({ color: pink })

const findVendorItemList = VendorTemplateId => query(`
  SELECT
    a.entry as entry,
    item,
    a.maxcount as maxcount,
    b.SellPrice as cost,
    name,
    icon,
    ExtendedCost,
    condition_id,
    incrtime,
    Quality
  FROM mangos.npc_vendor_template as a
  LEFT JOIN mangos.item_template as b
    ON a.item = b.entry
  WHERE a.entry="${VendorTemplateId}"
`)


const addItemToVendorList = insert('mangos.npc_vendor_template')

const removeItemFromVendorList = (entry, item) => query(`
  DELETE
  FROM mangos.npc_vendor_template
  WHERE entry="${entry}" AND item="${item}"
`)

// SPECIAL_CASE
const creatureContent = npc => {
  const sub = flex()

  // find linked scripts : 
  // query(`SELECT * FROM mangos.creature_ai_scripts WHERE creature_id="2530" LIMIT 100`).then(console.log)
  if (npc.VendorTemplateId) {
    findVendorItemList(npc.VendorTemplateId)
      .then(r => sub.appendChild(inputHeader.style({
        flexFlow: 'row',
        flexWrap: 'wrap',
        alignContent: 'center',
      }, r.map(item => flex.style({
        alignItems: 'center',
        marginBottom: '0.25em',
        height: '2em',
        width: '33%',
        flexGrow: 1,
        paddingLeft: '0.25em',
      },[
        h.img({
          src: `//wowimg.zamimg.com/images/wow/icons/small/${item.icon}.jpg`,
          style: {
            verticalAlign: 'middle',
            boxShadow: '0 0 0 4px black',
            outline: `${color.blizz.quality[item.Quality]} solid 1px`,
            outlineOffset: '2px',
          },
        }),
        h.a({
          href: `#/mangos/npc_vendor_template/${npc.VendorTemplateId}/${item.item}`,
          style: {
            paddingLeft: '0.75em',
            flexGrow: 1,
            color: color.blizz.quality[item.Quality],
            textDecoration: 'none',
          },
        }, item.name),
        seamlessLink({
          href: location.hash,
          onclick: function handleDelete({ target: el }) {
            el.onclick = undefined
            el.style.color = green
            h.replaceContent(el, '↺')
            el.parentElement.style.opacity = 0.3
            removeItemFromVendorList(item.entry, item.item)
              .then(() => el.onclick = function resetItem() {
                el.onclick = undefined
                el.style.color = color.comment
                h.replaceContent(el, '.')
                addItemToVendorList(filter((_, name) =>
                  dbInfo.mangos.npc_vendor_template[name], item))
                    .then(r => {
                      console.log(r)
                      el.onclick = handleDelete
                      el.style.color = red
                      el.onclick = resetItem
                      h.replaceContent(el, 'X')
                      el.parentElement.style.opacity = 1
                    })
              })
          },
          style: {
            padding: '0.75em',
            color: red,
          },
        }, 'X')
      ])))))
  }
  return [
    inputHeader.style({
      backgroundImage: `url('${wowheadCdn}/npc/${npc.ModelId1}.png')`,
      justifyContent: 'center',
      alignItems: 'center',
      flexFlow: 'column',
    }, [
      h.span.style({
        color: getLevelColor(avg(npc.MaxLevel, npc.MinLevel)),
        paddingRight: '0.25em',
      }, avg(npc.MaxLevel, npc.MinLevel)),
      h.span([
        npc.Name,
        npc.Rank != 0 && ` (${wow.creature_template.Rank[npc.Rank]})`,
      ]),
      (npc.SubName !== 'null')
        && h.div.style({ color: cyan }, `<${npc.SubName}>`),
      h.div([
        //lootId,
        //SkinningLootId,
        //npc.VendorTemplateId && h.a.style({}, ),
        //PickpocketLootId,
        map.toArr((amount, type) =>
          h.span.style({ color: color.blizz[type] },
            `${amount}${type.slice(0, 1)} `),
          filter(Boolean, getCost(avg(npc.MaxLootGold, npc.MinLootGold))))
      ]),
    ].filter(Boolean)),
    sub,
  ]
}

const specialCases = {
  mangos: {
    creature_template: {
      blacklist: new Set([
        'RacialLeader',
        'InhabitType',
        'IconName',
        'Expansion',
      ]),
      content: creatureContent,
    },
    item_template: {
      content: item => inputHeader.style({
        backgroundImage: `url('${wowheadCdn}/item/${item.displayid}.png')`,
      }, [
        h.div(h.img({
          style: {
            verticalAlign: 'middle',
            border: '1px solid',
            borderColor: color.blizz.quality[item.Quality],
            boxShadow: '0 0 0 1px black',
            outline: 'black solid 1px',
            outlineOffset: '-2px',
          },
          src: `//wowimg.zamimg.com/images/wow/icons/large/${item.icon}.jpg`,
        })),
        h.div.style({
          padding: '0.25em',
          flexGrow: 1,
        }, [
          h.div.style({
            color: color.blizz.quality[item.Quality],
            display: 'inline-block',
            fontWeight: 'bold',
            borderRadius: '0.25em',
            padding: '0.25em',
            letterSpacing: '0.1em',
            background: 'rgba(0,0,0,.5)',
          }, item.name),
          h.div.style({
            padding: '0.25em',
            color: color.comment,
          }, item.description, console.log(wow)),
          h.div([
            h.span(wow.item_template.class[item.class].subclass[item.subclass]),
            comment(' - '),
            h.span.style({ color:getLevelColor(item.RequiredLevel) },
              `${item.RequiredLevel}(+${item.ItemLevel-item.RequiredLevel})`),
            comment(' - '),
            map.toArr((amount, type) =>
              h.span.style({ color: color.blizz[type] },
                `${amount}${type.slice(0, 1)} `),
              filter(Boolean, getCost(item.SellPrice))),
          ]),
        ]),
      ]),
      blacklist: new Set([
        'displayid',
        'icon',
        'class',
        'subclass',
      ])
    }
  }
}

// APP
const app = h.div.style({
  //display: 'flex',
  height: '100%',
  color: color.foreground,
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '70em',
  margin: '0 auto',
}, [
  flex.style({
    alignItems: 'center',
    color: color.background,
  }, [ logo, h.div([ dbEl, '.', tableEl, '.', primaryEl ]) ]),
  content,
])

const getValue = el => el.value
const execFind = e => {
  e && e.preventDefault()
  router.set(router()
    .split('/')
    .slice(0, 2)
    .concat(Array.from(document.getElementsByTagName('INPUT'))
      .map(getValue))
    .join('/'))
}

const execFindOnEnter = keyHandler({ enter: execFind })
const findLinkEl = dbLink({
  style: { color: green },
  href: `#/`,
  onkeydown: execFindOnEnter,
  onclick: execFind,
}, 'find one')

const displayPrimarySearch = (primaryFields, selectParams) => {
  h.empty(primaryEl)
  display([
    primaryFields.map(({ name, def }, i) => labelEl([
      h.div.style({
        width: '25em',
        textAlign: 'right',
        color: selectParams[i] ? red : color.foreground,
      }, name),
      inputEl({
        id: name,
        placeholder: def,
        onkeydown: execFindOnEnter,
        value: selectParams[i],
      }),
    ])),
    findLinkEl,
  ])
}

const colorize = each((el, i) =>
  el.style.color = color[colorKeys[++i%colorKeys.length]])

const makeTableLink = (_, name) => dbLink({ href: `#/${name}/` }, name)
const displayDbSelection = () => {
  h.empty(dbEl)
  h.empty(tableEl)
  h.empty(primaryEl)
  display(colorize(map.toArr(makeTableLink, dbInfo)))
}

const displayTableSelection = (db, dbName) => {  
  h.empty(tableEl)
  h.empty(primaryEl)
  display(keywordWrapper(colorize(map.toArr((_, name) =>
    tableLink({ href: `#/${dbName}/${name}/` }, name), db))))
}

//const by
const empty = Object.freeze(Object.create(null))
const isPrimary = field => field.ref === 'PRIMARY'
const display = h.replaceContent(content)
const loadRoute = route => {
  const [ dbName, tableName, ...selectParams ] = route.split('/')

  const db = dbInfo[dbName]
  if (!db) return displayDbSelection()

  h.replaceContent(dbEl, tableLink({
    href: `#/`,
    style: { color: orange },
  }, dbName))

  const table = db[tableName]
  if (!table) return displayTableSelection(db, dbName)

  h.replaceContent(tableEl, tableLink({
    href: `#/${dbName}/`,
    style: { color: cyan },
  }, tableName))

  const primaryFields = filter.toArr(isPrimary, table)
  if (!selectParams.join('')) {
    return displayPrimarySearch(primaryFields, selectParams)
  }

  const TABLE = `${dbName}.${tableName}`
  const WHERE = 'WHERE '+ selectParams
    .map((val, i) => primaryFields[i] && `${primaryFields[i].name}="${val}"`)
    .filter(Boolean)
    .join(' AND ')

  Promise.all([
    query(`SELECT * FROM ${TABLE} ${WHERE}`),
    query(`SELECT * FROM ${dbName}_clean.${tableName} ${WHERE}`)
      .catch(() => []),
  ]).then(([results, originalResults]) => {
      const originalValues = originalResults[0] || empty
      const first = results[0]

      if (!first) {
        return displayPrimarySearch(primaryFields, selectParams)
      }

      h.replaceContent(primaryEl, primaryFields.map(field =>
        seamlessLink({ href: `#/${dbName}/${tableName}/` }, [
          comment(`${field.name}:`),
          `${first[field.name]}`,
        ])))

      const specialCase = g(g(specialCases, dbName), tableName)
      specialCase.blacklist || (specialCase.blacklist = new Set())

      const rawFieldList = map.toArr((field, name) => {
        let value = first[name]
        if (/^unk([0-9]+)?$/.test(name)) return
        if (primaryFields.includes(field)) return
        const original = originalValues === empty ? empty : originalValues[name]
        const hasDefaultValue = field.def === value
        const valueKey = hasDefaultValue ? 'placeholder' : 'value'

        const refresh = el => {
          if (original === value) {
            resetButton.style.display = 'none'
            return el.style.color = yellow
          }
          resetButton.style.display = ''
          el.style.color = green
        }

        const input = h.input({
          placeholder: field.def,
          [valueKey]: value,
          onfocus: ({ target: el }) => el.style.color = orange,
          onblur: ({ target: el }) => {
            if (!el.value) {
              hasDefaultValue || (el.value = field.def)
              return refresh(el)
            }
            if (el.value === value) {
              hasDefaultValue && (el.value = '')
              return refresh(el)
            }
            query(`UPDATE ${TABLE} SET ${name}="${el.value}" ${WHERE}`)
              .then(res => {
                if (Number(res.info.affectedRows)) {
                  value = field.value = el.value
                  refresh(el)
                } else {
                  throw Error('no changes done')
                }
              })
              .catch(err => {
                console.error(err.message)
                el.style.color = red
              })
          },
          style: {
            border: 0,
            padding: '0 0.5em',
            height: '1.75em',
            width: '100%',
            background: 'transparent',
            color: original === value ? yellow : green,
          },
        })

        const resetButton = h.span({
          onclick: ({ target: el }) => {
            el.style.display = 'none'
            input.value = original
          },
          style: {
            fontSize: '1.35em',
            padding: '0 0.25em',
            cursor: 'pointer',
            color: color.comment,
            display: value === original ? 'none' : '',
          },
        }, '↺') // ⌀

        return {
          field,
          el: labelEl.style({
            paddingLeft: '0.5em',
            background: color.background,
            margin: '0.5em 0.25em',
            borderRadius: '0.25em',
          }, [
            h.div.style({ paddingRight: '0.5em' }, name),
            input,
            resetButton,
          ]),
        }
      }, table)

      const left = []
      const right = []
      rawFieldList
        .sort((a, b) => Number(a.field.pos) - Number(b.field.pos))
        .forEach((c, i) => c
          && ((specialCase.blacklist && specialCase.blacklist.has(c.field.name))
            || (i % 2 ? right.push(c.el) : left.push(c.el))))

      display(flex.style({ 
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }, [
        specialCase.content && specialCase.content(first),
        h.div.style({ flexGrow: '1' }, left),
        h.div.style({ flexGrow: '1' }, right),
      ]))
    })
}

query(`
  SELECT
    a.TABLE_NAME as tbl,
    a.COLUMN_NAME as name,
    a.TABLE_SCHEMA as db,
    a.COLUMN_DEFAULT as def,
    a.ORDINAL_POSITION as pos,
    a.DATA_TYPE as type,
    b.CONSTRAINT_NAME as ref
  FROM INFORMATION_SCHEMA.COLUMNS as a
  LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE as b
    ON a.TABLE_NAME = b.TABLE_NAME
    AND a.COLUMN_NAME = b.COLUMN_NAME
    AND a.COLUMN_NAME = b.COLUMN_NAME
  WHERE a.TABLE_SCHEMA != "information_schema"
  ORDER BY name
`).then(each(r => g(g(dbInfo, r.db), r.tbl)[r.name] = r))
  .then(() => {
    loadRoute(router())
    router(loadRoute)
  })
/*

db(dbName => query(`show databases`)
  .then(r => h.replaceContent(app, map.toArr(, r)))
*/

h.replaceContent(document.body, app)

Object.assign(window, {
  query,
  router,
  dbInfo,
  wow,
})
