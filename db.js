import { h, observ, keyHandler, replaceContent, empty, isFn, isStr } from './lib/h.js'

import * as images from './lib/image.js'
import * as creature_template from './table/creature_template.js'
import * as quest_template from './table/quest_template.js'
import * as item_template from './table/item_template.js'
import { colorize, color } from './lib/colors.js'
import { a, flex, logo, comment, inputBaseEl } from './elem/shared.js'
const { cyan, green, orange, pink, red, purple, yellow } = color

const _key = el => el.tagName === 'DIV' ? 'textContent' : 'value'
const _getVal = el => el[_key(el)]
const _setVal = (el, value) => el[_key(el)] = value
const g = (s, k) => s[k] || (s[k] = {})
const _tag = tag => Array.from(document.getElementsByTagName(tag))
const b64 = s => btoa(s.trim())
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '')

b64.decode = s => atob(s.replace(/\-/g, '+').replace(/\_/g, '/'))

const toJSON = r => r.ok
  ? r.json()
  : r.text()
    .then(msg => Promise.reject(Error(msg)))

// STATE
const loc = window.location
const parseRoute = hash => hash.split('?')[0].slice(2)
const router = observ(parseRoute(loc.hash))

const routerSet = router.set
window.addEventListener('hashchange', ev =>
  routerSet(parseRoute(new URL(ev.newURL).hash)))

router.set = hash => loc.hash = `/${hash}`

const selectedTable = observ('')
const dbInfo = Object.create(null)


// QUERIES
const queryBuild = r => q => console.log('executing query', q) || fetch(r, {
  method: 'POST',
  headers: { 'content-type': 'text/plain' },
  body: q,
}).then(toJSON)

const query = queryBuild(`../sql/exec`)
const queryLog = queryBuild(`../sql/log`)

const toSQL = ([k, v]) => {
  if (!isStr(v)) {
    const test = toSQL('', v.value)
    return '('+ Array(v.max)
      .fill()
      .map((_, i) => `${k}${i + 1}${test}`)
      .join(' OR ') +')'
  }
  let not = ''
  if (/^(not|!) /i.test(v.trim())) {
    v = v.trim().replace(/^(not|!) /i, '')
    not = 'NOT '
  }
  if (/^-?[0-9.,]+$/.test(v)) return `${k} ${not}IN (${v})`
  if (/^-?[0-9.]+$/.test(v)) return not ? `${k}!=${v}` : `${k}=${v}`
  if (/^-?[0-9.]+--?[0-9.]+$/.test(v)) {
    const [ , start, end ] = v.split(/^(-?[0-9.]+)-(-?[0-9.]+)$/)
    return `${k} ${not}BETWEEN ${start} AND ${end}`
  }
  if (/^[=<>]+-?[0-9.]+$/.test(v)) return `${k} ${not}${v}`
  return `${k} ${not}LIKE "%${v}%"`
}
const querify = params => Object.entries(params).map(toSQL).join(' AND ')
const toValue = v => `"${v}"`
const toFields = params => `(${Object.keys(params).join(', ')})`
const toValues = params => `(${Object.values(params).map(toValue).join(', ')})`

const inSTG = `map = 0
  AND position_x < -11215
  AND position_x > -15057
  AND position_y < 1091
  AND position_y > -1229`

const getItem = entry => {
  const whereClause = /[0-9]+/.test(entry)
    ? `entry="${entry}"`
    : `name LIKE "%${entry}%"`

  query(`SELECT entry FROM tbcmangos.item_template WHERE ${whereClause} LIMIT 1`)
}

const selectQuery = (db, table, fields, params) => query(`
  SELECT ${fields.join(', ')}
  FROM ${db}.${table}
  WHERE ${isStr(params) ? params : querify(params)}
`)


// ELEMENTS
///// QUEST_TEMPLATE
const specialCases = {
  tbcmangos: {
    item_template: {...item_template},
    quest_template: {...quest_template},
    creature_template: {...creature_template},
    creature_questrelation: {
      links: { quest: 'quest_template', id: 'creature_template' },
    },
    creature_involvedrelation: {
      links: { quest: 'quest_template', id: 'creature_template' },
    },
    gameobject_questrelation: {
      links: { quest: 'quest_template', id: 'gameobject_template' },
    },
    gameobject_involvedrelation: {
      links: { quest: 'quest_template', id: 'gameobject_template' },
    },
    spell_template: {
      links: { Reagent: 'item_template', EffectItemType: 'item_template' },
    },
  },
}

// APP
const dbEl = h.span()
const tableEl = h.span()
const primaryEl = h.span.style({ color: pink })

const content = h.div.style({
  background: color.selection,
  borderRadius: '0.5em',
  margin: '0 15px 15px',
  padding: '15px',
})

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

const tableLink = h.style('a', {
  color: color.comment,
  textDecoration: 'none',
  padding: '0.25em',
})

export const keywordWrapper = h.style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '66em',
})

export const labelEl = h.style('label', { display: 'flex', alignItems: 'baseline' })
export const inputEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  padding: '0.75em',
  margin: '1em',
  borderRadius: '0.25em',
  border: 'none',
  width: '100%',
})

//export const textAreaEl = h.style('textarea', { resize: 'vertical', border: 'none' })
export const textAreaEl = h({
  style: { display: 'inline-block' },
  contentEditable: true,
})

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

const execFind = e => {
  e && e.preventDefault()
  router.set(router()
    .split('/')
    .slice(0, 2)
    .concat(Array.from(document.getElementsByTagName('INPUT'))
      .map(_getVal))
    .join('/'))
}

const execFindOnEnter = keyHandler({ enter: execFind })
const findLinkEl = dbLink({
  style: { color: green },
  href: `#/`,
  onkeydown: execFindOnEnter,
  onclick: execFind,
}, 'find one')

const displayPrimarySearch = (path, primaryFields, params) => {
  console.log(primaryFields)
  empty(primaryEl)
  display([
    primaryFields.map(({ name, def }, i) => labelEl([
      h.div.style({
        width: '25em',
        textAlign: 'right',
        color: params[i] ? red : color.foreground,
      }, name),
      inputEl({
        id: name,
        placeholder: def,
        onkeydown: execFindOnEnter,
        value: params[i],
      }),
    ])),
    findLinkEl,
    dbLink({
      style: { color: yellow },
      href: `${path}/where`,
    }, 'search')
  ])
}

const displayDbSelection = () => {
  empty(dbEl)
  empty(tableEl)
  empty(primaryEl)
  display(Object.keys(dbInfo).sort().map((name, i) => dbLink({
    href: `#/${name}/`,
    style: colorize(i),
  }, name)))
}

const displayTableSelection = (db, dbName) => {  
  empty(tableEl)
  empty(primaryEl)
  display(keywordWrapper(Object.keys(db).sort()
    .map((name, i) => tableLink({
      href: `#/${dbName}/${name}/`,
      style: colorize(i),
    }, name))))
}

const buildFieldInput = ([name, field]) => {
  const isList = /[^0-9]1$/.test(name)
  if (isList) {
    name = name.replace(/[^a-zA-Z]+$/, '')
  } else if (/[0-9]+$/.test(name)) return
  const isText = field.type === "text"
  const specialCase = g(g(specialCases, field.db), field.tbl)
  const required = specialCase.required || (specialCase.required = new Set)
  const fieldInfo = { isList }

  const input = (isText ? textAreaEl : inputBaseEl)({
    style: {
      width: '100%',
      minHeight: 'calc(100% - 1em)',
      background: 'transparent',
      color: orange,
    },
    placeholder: field.def,
  })

  const label = h.span({
    style: {
      paddingRight: '0.5em',
      userSelect: 'none',
      lineHeight: '1.75em',
      cursor: 'pointer',
    },
    onclick: () => required.has(name) || (fieldInfo.selected
      ? (fieldInfo.selected = false, label.style.color = color.foreground)
      : (fieldInfo.selected = true, label.style.color = green)),
  }, [
    name,
    isList ? h.span.style({ color: purple }, '*') : undefined
  ])

  if (required.has(name)) {
    fieldInfo.selected = true
    label.style.color = green
  }

  fieldInfo.input = input
  fieldInfo.field = field
  fieldInfo.el = labelEl.style({
    flexDirection: isText ? 'column' : 'row',
    padding: isText ? '0.5em' : undefined,
    paddingLeft: '0.5em',
    background: color.background,
    margin: '2px 0.25em',
    borderRadius: '0.25em',
    width: 'calc(50% - 0.5em)',
  }, [ label, input ])
  return fieldInfo
}

const wrappedFlex = h.style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
})

const byFieldPos = (a, b) => a.field.pos - b.field.pos
const displayFields = (fields, headerContent) => display(wrappedFlex([
  headerContent,
  wrappedFlex(fields.sort(byFieldPos).map(c => c.el)),
]))

const displaySearchResults = (db, table, f, params) => {
  selectQuery(db, table, f, params)
    .then(({ rows, fields }) => {
      console.log('WHERE RESULT', rows, params, fields)
      if (!rows.length) return display('no results')
      display(h.table([
        h.tr(fields.map(f => h.th(f)))
      ].concat(rows.map(row => h.tr(fields.map(f => h.td(row[f])))))))
    })
}

const displayWhereSelector = ({ db, tableName, table, params, primaryFields }) => {
  replaceContent(primaryEl, 'where')
  const [ hash ] = params
  if (hash) {
    try {
      return displaySearchResults(db, tableName,
        ...JSON.parse(`[[${b64.decode(hash)}"}]`))
    } catch (err) {
      console.error(err)
      return router.set(`${db}/${tableName}/where/`)
    }
  }

  const fields = Object.entries(table).map(buildFieldInput).filter(Boolean)
  const btn = dbLink({
    style: { color: purple, marginBottom: '1em', },
    href: location.hash,
    onclick: () => {
      const whereParams = {}
      const fieldNames = []
      fields.forEach(({ input, field, selected, isList }) => {
        selected && fieldNames.push(field.name)
        if (_getVal(input) !== '') {
          if (!isList) return whereParams[field.name] = _getVal(input)
          let i = 1
          while (table[`${field.name}${i}`]) { i++ }
          whereParams[field.name] = { max: i - 1, value: _getVal(input) }
        }
      })
      if (!Object.keys(whereParams).length) {
        setTimeout(() => btn.style.color = purple, 500)
        return btn.style.color = red
      }
      const q = b64(JSON.stringify([ fieldNames, whereParams ]).slice(2, -3))
      location.hash = `/${db}/${tableName}/where/${q}/`
    },
  }, `find in ${tableName}`)

  displayFields(fields, flex.style({ width: '100%' }, btn))
}

const hasNumberType = type => type.endsWith('int') || type === 'float'
const displayUpdateField = ({ db, tableName, table, params, primaryFields }) => {
  const TABLE = `${db}.${tableName}`
  const path = `#/${db}/${tableName}`
  if (!params.join('')) return displayPrimarySearch(path, primaryFields, params)

  const WHERE = 'WHERE '+ params
    .map((val, i) => primaryFields[i] && `${primaryFields[i].name}="${val}"`)
    .filter(Boolean)
    .join(' AND ')

  Promise.all([
    query(`SELECT * FROM ${TABLE} ${WHERE}`),
    query(`SELECT * FROM ${db}clean.${tableName} ${WHERE}`)
      .catch(() => []),
  ]).then(([results, originalResults]) => {
      const originalValues = originalResults.rows[0] || vide
      const [ first ] = results.rows

      if (!first) return displayPrimarySearch(path, primaryFields, params)

      replaceContent(primaryEl, primaryFields.map(field =>
        a({ href: `#/${field.db}/${field.tbl}/` }, [
          comment(`${field.name}:`),
          `${first[field.name]}`,
        ])))

      const specialCase = g(g(specialCases, db), tableName)
      const fields = g(specialCase, 'fields')
      const links = g(specialCase, 'links')
      const enums = g(specialCase, 'enums')

      specialCase.blacklist || (specialCase.blacklist = new Set())

      const rawFieldList = Object.entries(table).map(([name, field]) => {
        let value = first[name]
        if (/^unk([0-9]+)?$/.test(name)) return
        if (field.name.toLowerCase() === 'entry') return
        if (fields[name] && !fields[name](first)) return
        const enumList = enums[name] || []
        const isText = field.type === 'text'
        const original = originalValues === vide ? vide : originalValues[name]
        const hasDefaultValue = field.def === value
        const valueKey = hasDefaultValue ? 'placeholder' : 'value'
        const render = isText ? textAreaEl : inputBaseEl
        const convert = hasNumberType(field.type) ? Number : String
        const COMMENT = `-- ${TABLE} set ${name}\n`
        const checkEnumValue = enumList.bitFlags
          ? v => Boolean(Number(value) & v) ? 'active' : ''
          : v => v == value ? 'active' : ''

        const enumElements = enumList.bitFlags
          ? enumList.map(bit => h.button({
              onclick: () => saveValue(_setVal(input, Number(value) | bit.value)),
              enumValue: bit.value,
              className: checkEnumValue(bit.value),
            }, bit.name)
            )
          : Object.entries(enumList).filter(([,key]) => key).map(([v,key]) => h.button({
              onclick: () => saveValue(_setVal(input, v)),
              enumValue: v,
              className: checkEnumValue(v),
            }, key))

        const refresh = () => {
          for (const en of enumElements) {
            en.className = checkEnumValue(en.enumValue)
          }
          if (original === value) {
            resetButton.style.display = 'none'
            return input.style.color = yellow
          }
          resetButton.style.display = ''
          input.style.color = green
        }

        const href = getLinkedHref(links, field, value)
        const link = a({
          style: {
            paddingRight: '0.5em',
            paddingLeft: '0.5em',
            color: href ? purple : 'inherit',
          },
          href,
        }, name)

        const saveValue = async () => {
          if (!_getVal(input)) {
            hasDefaultValue || _setVal(input, field.def)
            return refresh()
          }
          const newValue = convert(_getVal(input))
          if (newValue === value) {
            hasDefaultValue && _setVal(input, '')
            return refresh()
          }

          return queryLog(`${COMMENT}UPDATE ${TABLE} SET ${name}="${newValue}" ${WHERE}`)
            .then(res => {
              if (!res.affectedRows) {
                throw Error('no changes done')
              }
              value = field.value = newValue
              href && (link.href = getLinkedHref(links, field, value))
              refresh()
              return true
            })
            .catch(err => (input.style.color = red, console.error(err.message)))
        }

        const input = render({
          style: {
            padding: '0.5em',
            width: enumElements.length ? 'fit-content' : '100%',
            background: 'transparent',
            color: original == value ? yellow : green,
          },
          placeholder: field.def,
          [valueKey]: value,
          onfocus: () => input.style.color = orange,
          onblur: saveValue,
        }, isText ? value : undefined)

        const resetButton = h.span({
          onclick: () => {
            value = _setVal(input, original)
            href && (link.href = getLinkedHref(links, field, value))
            queryLog(`${COMMENT}UPDATE ${TABLE} SET ${name}="${original}" ${WHERE}`)
              .then(refresh)
          },
          style: {
            fontSize: '1.35em',
            padding: '0 0.25em',
            cursor: 'pointer',
            color: color.comment,
            display: value === original ? 'none' : '',
          },
        }, '↺') // ⌀

        const labelStyle = {
          flexDirection: (isText || enumElements.length) ? 'column' : 'row',
          padding: isText ? '0.5em' : undefined,
          background: color.background,
          margin: '2px 0.25em',
          borderRadius: '0.25em',
          width: 'calc(50% - 0.5em)',
        }

        const elLabel = labelEl({
          onclick: e => e.target === elLabel ? input.focus() : undefined,
          style: enumElements.length ? { display: 'inline-flex', flexDirection: 'row' } : labelStyle,
        }, [ link, input, resetButton ])

        return {
          field,
          el: enumElements.length ? h.div({ style: labelStyle, className: 'enum' }, [ elLabel, enumElements ]) : elLabel
        }
      })

      displayFields(rawFieldList
        .filter(c => c && !specialCase.blacklist.has(c.field.name)),
        specialCase.content && specialCase.content(first))
    })
}

const getLinkedHref = (links, field, value) => {
  if (value === field.def) return
  const link = links[field.name] || links[field.name.slice(0, -1)]
  return link && (isFn(link) ? link(value) : `#/tbcmangos/${link}/update/${value}`)
}

const vide = {}
const display = v => replaceContent(content, v)
selectedTable(() => logo.scrollIntoView())
const loadRoute = route => {
  console.log({route})
  let [ dbName, tableName, action, ...params ] = route.split('/')
  selectedTable.set(tableName)
  const db = dbInfo[dbName]
  if (!db) return displayDbSelection()

  replaceContent(dbEl, tableLink({
    href: `#/`,
    style: { color: orange },
  }, dbName))

  const table = db[tableName]
  if (!table) return displayTableSelection(db, dbName)

  replaceContent(tableEl, tableLink({
    href: `#/${dbName}/`,
    style: { color: cyan },
  }, tableName))

  const primaryFields = Object.values(table)
    .filter(field => field.ref === 'PRIMARY')

  if (/[0-9]+/.test(action)) {
    params.unshift(action)
    action = 'update'
  }

  const routeArgs = {
    primaryFields,
    tableName,
    params,
    table,
    db: dbName,
  }

  console.log(routeArgs)
  switch (action) {
    case 'where': return displayWhereSelector(routeArgs)
    default: displayUpdateField(routeArgs)
  }
}

const loadAll = (q, res=[], n=0) => query(`${q} LIMIT ${n},${n+1000}`)
  .then(({rows}) => rows.length === 1000
    ? loadAll(q, [ ...res, ...rows ], n + 1000)
    : [ ...res, ...rows ])

loadAll(`
  SELECT
    a.DATA_TYPE as type,
    a.TABLE_NAME as tbl,
    a.COLUMN_NAME as name,
    a.TABLE_SCHEMA as db,
    a.COLUMN_DEFAULT as def,
    a.ORDINAL_POSITION as pos,
    b.CONSTRAINT_NAME as ref
  FROM INFORMATION_SCHEMA.COLUMNS as a
  LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE as b
    ON a.TABLE_NAME = b.TABLE_NAME
    AND a.COLUMN_NAME = b.COLUMN_NAME
    AND a.COLUMN_NAME = b.COLUMN_NAME
  WHERE a.TABLE_SCHEMA = "tbcmangos"
  ORDER BY name
`).then(rows => {
    for (const r of rows) {
      r.pos = Number(r.pos)
      g(g(dbInfo, r.db), r.tbl)[r.name] = r
    }
  })
  .then(() => {
    loadRoute(router())
    router(loadRoute)
    console.log(dbInfo)
  })

replaceContent(document.body, app)

Object.assign(window, {
  query,
  router,
  dbInfo,
})
