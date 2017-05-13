const h = require('izi/h')
const { isNum, isFn, isStr } = require('izi/is')
const each = require('izi/collection/each')
const curry = require('izi/auto-curry')
const store = require('izi/collection/store')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const wow = require('./dbc')
const observ = require('izi/emiter/observ')
const keyHandler = require('izi/key-handler')

// STATE
const images = require('./images')
const wowheadCdn = '//wow.zamimg.com/modelviewer/thumbs'
const router = require('./router')
const selectedTable = observ.check('')
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
const _tag = tag => Array.from(document.getElementsByTagName(tag))
const b64 = s => btoa(s.trim())
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '')

b64.decode = s => atob(s.replace(/\-/g, '+').replace(/\_/g, '/'))

const toJSON = r => r.ok
  ? r.json()
  : r.json().then(msg => Promise.reject(Error(msg)))

const avg = (...args) => Math.round(args
  .map(Number)
  .reduce((t, n) => (n + t) / 2))

const getLevelColor = lvl => {
  lvl = Number(lvl)
  if (lvl > 25) return red
  if (lvl > 22) return orange
  if (lvl > 16) return green
  if (lvl > 13) return color.blizz.yellow
  return color.blizz.grey
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

const toSQL = (v, k) => {
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
const querify = params => map.toArr(toSQL, params).join(' AND ')
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
  src: images.logo,
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

const imgEl = h.style('img', {
  verticalAlign: 'middle',
})

const inputEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  padding: '0.75em',
  margin: '1em',
  borderRadius: '0.25em',
  border: 'none',
  width: '100%',
})

const inuptBaseEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  borderRadius: '0.25em',
  border: 0,
  padding: '0 0.5em',
  height: '1.75em',
})

const textAreaEl = h.style('textarea', {
  resize: 'vertical',
  border: 'none',
})

const inputHeader = h.style({
  flexGrow: 1,
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

const a = h.style('a', { textDecoration: 'none', color: 'inherit' })
const dbEl = h.span()
const tableEl = h.span()
const primaryEl = h.span.style({ color: pink })

const removeItemFromVendorList = (entry, item) => query(`
  DELETE
  FROM mangos.npc_vendor_template
  WHERE entry="${entry}" AND item="${item}"
`)

const itemThumbnail = item => imgEl({
  src: `//wowimg.zamimg.com/images/wow/icons/small/${item.icon}.jpg`,
  style: {
    width: '18px',
    height: '18px',
    margin: '4px 7px 4px 4px',
    boxShadow: '0 0 0 4px black',
    outline: `${color.blizz.quality[item.Quality]} solid 1px`,
    outlineOffset: '2px',
  },
})

const npcLink = npc => a({ href: `#/mangos/creature_template/update/${npc.entry}` }, [
  h.span.style({ color: getLevelColor(npc.lvl) }, npc.lvl),
  ` ${npc.name} `,
])

const gobLink = gob => a({ href: `#/mangos/gameobject_template/update/${gob.entry}` },
  [ `${gob.name} `, comment('(object)') ])

const itemLink = (item, href) => [
  itemThumbnail(item),
  h.a({
    href: isStr(href) ? href : `#/mangos/item_template/update/${item.entry}`,
    style: {
      flexGrow: 1,
      color: color.blizz.quality[item.Quality],
      textDecoration: 'none',
    },
  }, item.name),
]

// Entry, QuestLevel, Title
const questLink = quest => a({ href: `#/mangos/quest_template/update/${quest.Entry}` }, [
  imgEl({ src: images.quest }),
  h.span.style({ color: getLevelColor(quest.QuestLevel) }, quest.QuestLevel),
  ` ${quest.Title}`,
])

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
// SPECIAL_CASE
const fetchItemList = (vendor, vendorList) => findVendorItemList(vendor)
  .then(r => h.replaceContent(vendorList, r.map(item => flex.style({
    alignItems: 'center',
    marginBottom: '0.25em',
    height: '2em',
    width: '33%',
    flexGrow: 1,
    paddingLeft: '0.25em',
  },[
    itemLink(item, `#/mangos/npc_vendor_template/${vendor}/update/${item.item}`),
    a({
      style: {
        padding: '0.75em',
        color: red,
      },
      href: location.hash,
      onclick: function handleDelete({ target: el }) {
        el.onclick = undefined
        el.style.color = green
        h.replaceContent(el, '↺')
        el.parentElement.style.opacity = 0.3
        removeItemFromVendorList(item.entry, item.item)
          .then(() => el.onclick = () => {
            el.onclick = undefined
            el.style.color = color.comment
            h.replaceContent(el, '.')
            addItemToVendorList(filter((_, name) =>
              dbInfo.mangos.npc_vendor_template[name], item))
                .then(r => {
                  console.log(r)
                  el.onclick = handleDelete
                  el.style.color = red
                  h.replaceContent(el, 'X')
                  el.parentElement.style.opacity = 1
                })
          })
      },
    }, 'X')
  ]))))

const getLinkedQuest = curry((db, npcEntry) => query(`
  SELECT
    quest as Entry,
    QuestLevel,
    Title
  FROM mangos.${db} as a
  LEFT JOIN mangos.quest_template as b
    ON a.quest = b.entry
  WHERE a.id="${npcEntry}"
`))

getLinkedQuest.creature = getLinkedQuest('creature_questrelation')

const sideHeader = h.style({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  //alignContent: 'flex-end',
  alignItems: 'center',
  justifyContent: 'center',
})

const creatureContent = npc => {
  const sub = flex.style({ flexFlow: 'column' })
  const rightHeader = sideHeader.style({ alignItems: 'flex-end' })
  const leftHeader = sideHeader.style({ alignItems: 'flex-start' })
  // find linked scripts : 
  // query(`SELECT * FROM mangos.creature_ai_scripts WHERE creature_id="2319" LIMIT 100`)
  //   .then(console.log)

  // Get quest list if any
  getLinkedQuest.creature(npc.Entry)
    .then(r => h.appendChild(leftHeader, r.map(questLink)))

  if (npc.VendorTemplateId != 0) {
    const onclick = () => {
      const entry = itemInput.value.trim()
      const whereClause = /[0-9]+/.test(entry)
        ? `entry="${entry}"`
        : `name LIKE "%${entry}%"`

      query(`SELECT entry FROM mangos.item_template WHERE ${whereClause} LIMIT 1`)
        .then(([ item ]) => {
          if (!item) {
            itemInput.style.color = red
            return itemInput.focus()
          }
          addItemToVendorList({ entry: npc.VendorTemplateId, item: item.entry })
            .then(({ info }) => {
              if (info.affectedRows == 1) {
                fetchItemList(npc.VendorTemplateId, vendorList)
              }
              itemInput.value = ''
              itemInput.focus()
            })
        })
        
    }
    const vendorList = flex.style({ flexFlow: 'row', flexWrap: 'wrap' })
    const onkeydown = keyHandler({ enter: onclick })
    const itemInput = inuptBaseEl({
      style: { width: '20em' },
      onkeypress: () => itemInput.style.color = yellow,
      onkeydown,
    })
    h.appendChild(sub, inputHeader.style({
      flexFlow: 'column',
      alignContent: 'center',
    }, [
      flex.style({ color: cyan, justifyContent: 'center'},
        '- Vendor Item List -'),
      vendorList,
      h.label.style({
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        background: color.selection,
        borderRadius: '0.25em',
      }, [
        h.span.style({ paddingRight: '0.5em' }, 'item ID or Name'),
        itemInput,
        a({
          style: { padding: '0.75em', color: green },
          href: location.hash,
          onclick,
        }, 'add'),
      ])
    ]))

    fetchItemList(npc.VendorTemplateId, vendorList)
  }

  return [
    inputHeader.style({
      width: '100%',
      backgroundImage: `url('${wowheadCdn}/npc/${npc.ModelId1}.png')`,
    }, [
      leftHeader,
      flex.style({
        justifyContent: 'center',
        alignItems: 'center',
        flexFlow: 'column',
        flexGrow: 1,
      }, [
        h.span.style({
          color: getLevelColor(avg(npc.MaxLevel, npc.MinLevel)),
          paddingRight: '0.25em',
        }, avg(npc.MaxLevel, npc.MinLevel)),
        h.span([
          npc.Name,
          npc.Rank != 0
            ? ` (${wow.creature_template.Rank[npc.Rank]})`
            : undefined,
        ]),
        (npc.SubName && npc.SubName !== 'null')
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
      rightHeader,
    ]),
    sub,
  ]
}

///// ITEM_TEMPLATE
const findLinkedQuests = entry => query(`
  SELECT Entry, QuestLevel, Title
  FROM mangos.quest_template
  WHERE SrcItemId="${entry}"
    OR ReqItemId1="${entry}"
    OR ReqItemId2="${entry}"
    OR ReqItemId3="${entry}"
    OR ReqItemId4="${entry}"
    OR ReqSourceId1="${entry}"
    OR ReqSourceId2="${entry}"
    OR ReqSourceId3="${entry}"
    OR RewItemId1="${entry}"
    OR RewItemId2="${entry}"
    OR RewItemId3="${entry}"
    OR RewChoiceItemId1="${entry}"
    OR RewChoiceItemId2="${entry}"
    OR RewChoiceItemId3="${entry}"
    OR RewChoiceItemId4="${entry}"
    OR RewChoiceItemId5="${entry}"
    OR RewChoiceItemId6="${entry}"
`)


const itemContent = item => {
  const rightHeader = sideHeader.style({
    alignItems: 'flex-end',
    minWidth: '40%',
  })

  findLinkedQuests(item.entry)
    .then(related => rightHeader.appendChild(h.div(related.map(questLink))))

  return inputHeader.style({
    width: '100%',
    backgroundImage: `url('${wowheadCdn}/item/${item.displayid}.png')`,
  }, [
    h.div(imgEl({
      style: {
        border: '1px solid',
        borderColor: color.blizz.quality[item.Quality],
        boxShadow: '0 0 0 1px black',
        outline: 'black solid 1px',
        outlineOffset: '-2px',
      },
      src: `//wowimg.zamimg.com/images/wow/icons/large/${item.icon}.jpg`,
    })),
    h.div.style({ padding: '0.25em', flexGrow: 1 }, [
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
    rightHeader,
  ])
}

///// QUEST_TEMPLATE
const getQuestGiverItem = quest => query(`
  SELECT entry, name, Quality, icon
  FROM mangos.item_template
  WHERE startquest="${quest}"
`)

const getQuestGiverNpc = quest => query(`
  SELECT
    Entry as entry,
    MaxLevel as lvl,
    Name as name
  FROM mangos.creature_questrelation as a
  LEFT JOIN mangos.creature_template as b
    ON a.id = b.Entry
  WHERE a.quest="${quest}"
`)

const getQuestTakerNpc = quest => query(`
  SELECT
    Entry as entry,
    MaxLevel as lvl,
    Name as name
  FROM mangos.creature_involvedrelation as a
  LEFT JOIN mangos.creature_template as b
    ON a.id = b.Entry
  WHERE a.quest="${quest}"
`)

const getQuestGiverGob = quest => query(`
  SELECT entry, name
  FROM mangos.gameobject_questrelation as a
  LEFT JOIN mangos.gameobject_template as b
    ON a.id = b.entry
  WHERE a.quest="${quest}"
`)

const getQuestTakerGob = quest => query(`
  SELECT entry, name
  FROM mangos.gameobject_involvedrelation as a
  LEFT JOIN mangos.gameobject_template as b
    ON a.id = b.entry
  WHERE a.quest="${quest}"
`)

const npcAndRelationLinks = (npc, quest, type) => h.div([
  npcLink(npc),
  a({
    style: { color: purple },
    href: `#/mangos/creature_${type}relation/update/${npc.entry}/${quest.entry}`,
  }, '(relation)')
])
const specialCases = {
  mangos: {
    quest_template: {
      content: quest => {
        const leftHeader = sideHeader.style({ alignItems: 'flex-start' })
        const rightHeader = sideHeader.style({ alignItems: 'flex-end' })

        Promise.all([
          getQuestGiverNpc(quest.entry),
          getQuestGiverItem(quest.entry),
          getQuestGiverGob(quest.entry),
        ]).then(([ npcs, items, gobs ]) => {
          leftHeader.appendChild(h.div([
            gobs.map(gobLink),
            npcs.map(npc => npcAndRelationLinks(npc, quest, 'quest')),
            items.map(item => h.div(itemLink(item))),
          ]))
        })

        Promise.all([
          getQuestTakerNpc(quest.entry),
          getQuestTakerGob(quest.entry),
        ]).then(([ npcs, gobs ]) => {
          rightHeader.appendChild(h.div([
            gobs.map(gobLink),
            npcs.map(npc => npcAndRelationLinks(npc, quest, 'involved')),
          ]))
        })

        return inputHeader.style({
          minHeight: 0,
          width: '100%',
        }, [ leftHeader, sideHeader.style({ color: cyan }, '->'), rightHeader ])
      },
      required: new Set([
        'Title',
        'QuestLevel',
      ]),
      links: {
        SrcItemId: 'item_template',
        RewItemId: 'item_template',
        ReqItemId: 'item_template',
        ReqSourceId: 'item_template',
        RewChoiceItemId: 'item_template',
        RewMailTemplateId: 'quest_mail_loot_template',
        ReqCreatureOrGOId: val => `#/mangos/${Number(val) > 0
          ? 'creature_template'
          : 'gameobject_template'}/update/${Math.abs(Number(val))}`,
        StartScript: 'quest_start_scripts',
        CompleteScript: 'quest_end_scripts',
        RewSpell: 'spell_template',
        SrcSpell: 'spell_template',
        RewSpellCast: 'spell_template',
        PrevQuestId: 'quest_template',
        NextQuestInChain: 'quest_template',
      },
    },
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
    creature_template: {
      links: {
        //ModelId: 'Creature_Model_Info',
        LootId: 'creature_loot_template',
        PickpocketLootId: 'pickpocketing_loot_template',
        SkinningLootId: 'skinning_loot_template',
        KillCredit: 'creature_template',
        QuestItem: 'item_template',
        TrainerSpell: 'spell_template',
        TrainerTemplateId: 'npc_trainer_template',
        VendorTemplateId: 'npc_vendor_template',
        EquipmentTemplateId: 'creature_equip_template',
        GossipMenuId: 'gossip_menu_id',
      },
      blacklist: new Set([
        'RacialLeader',
        'InhabitType',
        'IconName',
        'Expansion',
        'HeroicEntry',
      ]),
      content: creatureContent,
    },
    spell_template: {
      links: {
        Reagent: 'item_template',
        EffectItemType: 'item_template',
      },
    },
    item_template: {
      links: {
        spellid_: 'spell_template',
        PageText: 'page_text',
        startquest: 'quest_template',
        RandomProperty: 'item_enchantment_template',
        RandomSuffix: 'item_enchantment_template',
        DisenchantID: 'disenchant_loot_template',
      },
      content: itemContent,
      required: new Set([
        'entry',
        'Quality',
        'name',
        'icon',
      ]),
      blacklist: new Set([
        'displayid',
        'icon',
        'class',
        'subclass',
      ]),
    },
  },
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

const displayPrimarySearch = (primaryFields, params) => {
  h.empty(primaryEl)
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

const buildFieldInput = (field, name) => {
  const isList = /[^0-9]1$/.test(name)
  if (isList) {
    name = name.replace(/[^a-zA-Z]+$/, '')
  } else if (/[0-9]+$/.test(name)) return
  const isText = field.type === "text"
  const specialCase = g(g(specialCases, field.db), field.tbl)
  const required = specialCase.required || (specialCase.required = new Set)
  const fieldInfo = { isList }

  const input = (isText ? textAreaEl : inuptBaseEl)({
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

const selectQuery = (db, table, fields, params) => query(`
  SELECT ${fields.join(', ')}
  FROM ${db}.${table}
  WHERE ${isStr(params) ? params : querify(params)}
`)

const displaySearchResults = (db, table, fields, params) => {
  selectQuery(db, table, fields, params)
    .then(r => {
      if (!r.length) return display('no results')
      display(h.table([
        h.tr(fields.map(f => h.th(f)))
      ].concat(r.map(row => h.tr(fields.map(f => h.td(row[f])))))))
    })
}

const displayWhereSelector = ({ db, tableName, table, params, primaryFields }) => {
  h.replaceContent(primaryEl, 'where')
  const [ hash ] = params
  if (hash) {
    try {
      return displaySearchResults(db, tableName,
        ...JSON.parse(`[[${b64.decode(hash)}"}]`))
    } catch (err) {
      return router.set(`${db}/${tableName}/where/`)
    }
  }

  const fields = map.toArr(buildFieldInput, table).filter(Boolean)
  const btn = dbLink({
    style: { color: purple, marginBottom: '1em', },
    href: location.hash,
    onclick: () => {
      const whereParams = {}
      const fieldNames = []
      fields.forEach(({ input, field, selected, isList }) => {
        selected && fieldNames.push(field.name)
        if (input.value !== '') {
          if (!isList) return whereParams[field.name] = input.value
          let i = 1
          while (table[`${field.name}${i}`]) { i++ }
          whereParams[field.name] = { max: i - 1, value: input.value }
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

const displayUpdateField = ({ db, tableName, table, params, primaryFields }) => {
  if (!params.join('')) return displayPrimarySearch(primaryFields, params)

  const TABLE = `${db}.${tableName}`
  const WHERE = 'WHERE '+ params
    .map((val, i) => primaryFields[i] && `${primaryFields[i].name}="${val}"`)
    .filter(Boolean)
    .join(' AND ')

  Promise.all([
    query(`SELECT * FROM ${TABLE} ${WHERE}`),
    query(`SELECT * FROM ${db}_clean.${tableName} ${WHERE}`)
      .catch(() => []),
  ]).then(([results, originalResults]) => {
      const originalValues = originalResults[0] || empty
      const [ first ] = results

      if (!first) return displayPrimarySearch(primaryFields, params)

      h.replaceContent(primaryEl, primaryFields.map(field =>
        a({ href: `#/${field.db}/${field.tbl}/` }, [
          comment(`${field.name}:`),
          `${first[field.name]}`,
        ])))

      const specialCase = g(g(specialCases, db), tableName)
      const links = g(specialCase, 'links')
      specialCase.blacklist || (specialCase.blacklist = new Set())

      const rawFieldList = map.toArr((field, name) => {
        let value = first[name]
        if (/^unk([0-9]+)?$/.test(name)) return
        if (field.name.toLowerCase() === 'entry') return
        const original = originalValues === empty ? empty : originalValues[name]
        const hasDefaultValue = field.def === value
        const valueKey = hasDefaultValue ? 'placeholder' : 'value'
        const isText = field.type === "text"

        const refresh = () => {
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
            color: href ? purple : 'inherit',
          },
          href,
        }, name)

        const input = (isText ? textAreaEl : inuptBaseEl)({
          style: {
            height: (value && isText)
              ? `${1 + (value.length / 40)}em`
              : undefined,
            minHeight: 'calc(100% - 1em)',
            width: '100%',
            background: 'transparent',
            color: original === value ? yellow : green,
          },
          placeholder: field.def,
          [valueKey]: value,
          onfocus: () => input.style.color = orange,
          onblur: () => {
            if (!input.value) {
              hasDefaultValue || (input.value = field.def)
              return refresh()
            }
            if (input.value === value) {
              hasDefaultValue && (input.value = '')
              return refresh()
            }
            query(`UPDATE ${TABLE} SET ${name}="${input.value}" ${WHERE}`)
              .then(res => {
                if (!Number(res.info.affectedRows)) {
                  throw Error('no changes done')
                }
                value = field.value = input.value
                href && (link.href = getLinkedHref(links, field, value))
                refresh()
              })
              .catch(err => (input.style.color = red,
                console.error(err.message)))
          },
        })

        const resetButton = h.span({
          onclick: () => {
            value = input.value = original
            href && (link.href = getLinkedHref(links, field, value))
            query(`UPDATE ${TABLE} SET ${name}="${original}" ${WHERE}`)
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

        return {
          field,
          el: labelEl.style({
            flexDirection: isText ? 'column' : 'row',
            padding: isText ? '0.5em' : undefined,
            paddingLeft: '0.5em',
            background: color.background,
            margin: '2px 0.25em',
            borderRadius: '0.25em',
            width: 'calc(50% - 0.5em)',
          }, [
            link,
            input,
            resetButton,
          ]),
        }
      }, table)

      displayFields(rawFieldList
        .filter(c => c && !specialCase.blacklist.has(c.field.name)),
        specialCase.content && specialCase.content(first))
    })
}

const getLinkedHref = (links, field, value) => {
  if (value === field.def) return
  const link = links[field.name] || links[field.name.slice(0, -1)]
  return link && (isFn(link) ? link(value) : `#/mangos/${link}/update/${value}`)
}

const empty = Object.freeze(Object.create(null))
const isPrimary = field => field.ref === 'PRIMARY'
const display = h.replaceContent(content)
selectedTable(() => logo.scrollIntoView())
const loadRoute = route => {
  let [ dbName, tableName, action, ...params ] = route.split('/')
  selectedTable.set(tableName)
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

  switch (action) {
    case 'where': return displayWhereSelector(routeArgs)
    default: displayUpdateField(routeArgs)
  }
}

query(`
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
  WHERE a.TABLE_SCHEMA != "information_schema"
  ORDER BY name
`).then(each(r => {
    r.pos = Number(r.pos)
    // 
    g(g(dbInfo, r.db), r.tbl)[r.name] = r
  }))
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
