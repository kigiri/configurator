const script = () => {
const isNum = x => typeof x === 'number'
const isStr = x => typeof x === 'string'
const isFn = x => typeof x === 'function'
const isElement = x => x instanceof Element
const isChildren = x => isStr(x) || Array.isArray(x) || isElement(x)

const empty = el => {
  if (!el) return
  while (el.lastChild && el.lastChild !== el) {
    el.removeChild(el.lastChild)
  }
}

const appendChild = (elem, child) => {
  if (child === undefined) return
  if (child instanceof Element) return elem.appendChild(child)
  if (Array.isArray(child)) return child.forEach(c => appendChild(elem, c))
  return elem.appendChild(document.createTextNode(String(child)))
}

const replaceContent = (el, content) => {
  empty(el)
  appendChild(el, content)
}

const setAttr = (elem, val, key) => elem.setAttribute(key, val)
const assignAttr = (elem, val, key) => elem[key] = val
const deepAssignAttr = (elem, val, key) => Object.assign(elem[key], val)
const getHandler = key => {
  switch (key) {
    case 'dataset':
    case 'style': return deepAssignAttr
    default: {
      if (key.indexOf('-') !== -1) return setAttr
      return assignAttr
    }    
  }
}

const createElement = (args, props, child) => {
  if (isChildren(props)) {
    child = props
    props = undefined
  }

  const elem = document.createElement(args.tag)
  if (props || args.props) {
    const mergeProps = ([k, v]) => v !== undefined && getHandler(k)(elem, v, k)
    args.props && Object.entries(args.props).forEach(mergeProps)
    props && Object.entries(props).forEach(mergeProps)
  }

  appendChild(elem, child)
  return elem
}

const prepareArgs = (tag, props) => {
  if (isStr(tag)) {
    props || (props = {})
    tag = tag.toLowerCase()
  } else {
    props = tag
    tag = 'div'
  }
  Object.keys(props).length || (props = undefined)
  return { tag, props }
}

const prepareStyleArgs = (tag, style) => isStr(tag)
  ? prepareArgs(tag, { style: style.style || style })
  : prepareArgs('div', { style: tag.style || tag })

const extend = (args, props) =>
  preparedH(mergePropsDefault(args, args))

const preparedH = args => {
  const create = (props, child) => createElement(args, props, child)
  create.style = (style, child) => createElement(args, { style }, child)
  create.extend = (tag, props) => extend(args, Array.isArray(tag)
    ? tag.reduce(mergePropsDefault)
    : prepareArgs(tag, props))

  create.extend.style = (tag, style) => extend(args, Array.isArray(tag)
    ? { style: tag.reduce(mergePropsDefault) }
    : prepareStyleArgs(tag, style))

  return create
}

const h = (tag, props) => preparedH(prepareArgs(tag, props))
h.style = (tag, style) => preparedH(prepareStyleArgs(tag, style))
h.a = h('a')
h.img = h('img')
h.div = h('div')
h.span = h('span')
h.label = h('label')
h.tr = h('tr')
h.th = h('th')
h.td = h('td')
h.table = h('table')
h.button = h('button')

const observ = value => {
  const listeners = new Set()
  const subscriber = fn => fn
    ? (listeners.add(fn), fn(value))
    : value

  subscriber.set = val => {
    if (val === value) return
    value = val
    for (const fn of listeners) fn(value)
  }

  subscriber.setCheck = newCheck => check = newCheck

  return subscriber
}

const keyHandler = handlers => ev => {
  const fn = handlers[ev.key.toLowerCase()]
  if (!isFn(fn)) return
  if (fn(ev) !== false) ev.preventDefault()
}

const _key = el => el.tagName === 'DIV' ? 'textContent' : 'value'
const _getVal = el => el[_key(el)]
const _setVal = (el, value) => el[_key(el)] = value

// STATE
const images =  {
  logo: 'data:image/png;base64,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',
  quest: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAdCAMAAACUsxyNAAAAqFBMVEUAAAAAAAAAAAAAAAACAAAAAgIAAACliy8AAQMAAAD3z0IABAgAAAgAAAAAAggAAAAAAAAAAAUAAAcAAAAAAAAAAAAAAAkHBQAAAAAAAAAJAAAAAggIAgAIBAj/9wj/4wj/0wj/vgj/ugj/6xD/ywjv1xgYEBDnmgitfgj320IQBBBaQQaUdUK4oC+lki9SSRuqnQ2ynQuvjgtaRAOfkRNgSQ2aZwVNMwP3F5REAAAAG3RSTlMA/mwlSB8E/oAM/r+9kHpvTxkV956ZdG1XRzuEqg3UAAAAyElEQVQYGQXBwU7CQBQAwNm3LViiAbFoNP7/P3nzgIkmRgO1qba06wwAgITbeVHM8wQVeQN4g4pFW7xoxYIQ2nGacv5UMqrV9Lz0HFgrCI4AIFwrYE8gBAAFMXaaiIgYhv2MEHqQjRAKezjrIcwAHqCi7ZZQe7WDoJOxdfcNwc55tZL8gIqx1jsyg4T7GrrqC4KoHa4e3TQNBMWhc9pwgYAOWKBCSswSELBFQ0CQffxux5NpgoSngPcLSNCsS/obAAAAAAAAAPwDmGtBZfVV/nYAAAAASUVORK5CYII=',
}

const wowheadCdn = '//wow.zamimg.com/modelviewer/thumbs'
const loc = window.location
const parseRoute = hash => hash.split('?')[0].slice(2)
const router = observ(parseRoute(loc.hash))

const routerSet = router.set
window.addEventListener('hashchange', ev =>
  routerSet(parseRoute(new URL(ev.newURL).hash)))

router.set = hash => loc.hash = `/${hash}`

const selectedTable = observ('')
const dbInfo = Object.create(null)

const bitFlags = list => {
  const ret = list.map((name, index) => ({
    value: Math.pow(2, index),
    index,
    name,
  })).filter(n => Boolean(n.name))

  ret.bitFlags = true
  return ret
}

const Rank = [
  'Normal',
  'Elite',
  'Rare Elite',
  'World Boss',
  'Rare',
]

const Family = [
  'Wolf',
  'Cat',
  'Spider',
  'Bear',
  'Boar',
  'Crocolisk',
  'Carrion Bird',
  'Crab',
  'Gorilla',
  'Raptor',
  'Tallstrider',
  'Felhunter',
  'Voidwalker',
  'Succubus',
  'Doomguard',
  'Scorpid',
  'Turtle',
  'Imp',
  'Bat',
  'Hyena',
  'Bird of Prey',
  'Wind Serpent',
  'Remote Control',
  'Felguard',
  'Dragonhawk',
  'Ravager',
  'Warp Stalker',
  'Sporebat',
  'Nether Ray',
  'Serpent',
  'Moth',
  'Chimaera',
  'Devilsaur',
  'Ghoul',
  'Silithid',
  'Worm',
  'Rhino',
  'Wasp',
  'Core Hound',
  'Spirit Beast',
]

const CreatureType = [
  'None',
  'Beast',
  'Dragonkin',
  'Demon',
  'Elemental',
  'Giant',
  'Undead',
  'Humanoid',
  'Critter',
  'Mechanical',
  'Not specified',
  'Totem',
  'Non-combat Pet',
  'Gas Cloud',
]

const RegenerateStats = [
  'Do NOT Regenerate Stats When Out Of Combat',
  'Regenerate Health When Out Of Combat',
  'Regenerate Power (Mana) When Out Of Combat',
  'Regenerate Health AND Power (Mana) When Out Of Combat',
]

const questSort = {
  1: 'Epic',
  22: 'Seasonal',
  24: 'Herbalism',
  25: 'Battlegrounds',
  61: 'Warlock',
  81: 'Warrior',
  82: 'Shaman',
  101: 'Fishing',
  121: 'Blacksmithing',
  141: 'Paladin',
  161: 'Mage',
  162: 'Rogue',
  181: 'Alchemy',
  182: 'Leatherworking',
  201: 'Engineering',
  221: 'Treasure Map',
  261: 'Hunter',
  262: 'Priest',
  263: 'Druid',
  264: 'Tailoring',
  284: 'Special',
  304: 'Cooking',
  324: 'First AID',
  344: 'Legendary',
  364: 'Darkmoon Faire',
  365: 'Ahn’Qiraj War',
  366: 'Lunar Festival',
  367: 'Reputation',
  368: 'Invasion',
  369: 'Midsummer',
  370: 'Brewfest',
  371: 'Inscription',
  372: 'Death Knight',
  373: 'Jewelcrafting',
  374: 'Noblegarden',
  375: 'Pilgrim’s Bounty',
  376: 'Love is in the Air',
  762: 'Riding',
}

const questInfo = [
  'Group',
  'Life',
  'PvP',
  'Raid',
  'Dungeon',
  'World Event',
  'Legendary',
  'Escort',
  'Heroic',
  'Raid (10)',
  'Raid (25)',
]

const classes = bitFlags([
 'Warrior',
 'Paladin',
 'Hunter',
 'Rogue',
 'Priest',
 'Death Knight',
 'Shaman',
 'Mage',
 'Warlock',
 'Druid',
])

const race = bitFlags([
  'Human',
  'Orc',
  'Dwarf',
  'Night Elf',
  'Undead',
  'Tauren',
  'Gnome',
  'Troll',
  'Goblin',
  'Blood Elf',
  'Draenei',
  'Fel Orc',
  'Naga',
  'Broken',
  'Skeleton',
  'Vrykul',
  'Tuskarr',
  'Forest Troll',
  'Taunka',
  'Northrend Skeleton',
  'Ice Troll',
])

const powerType = [
  'Mana',
  'Rage',
  '',
  'Energy',
]

const reputation = {
  21: 'Booty Bay',
  67: 'Horde',
  87: 'Bloodsail Buccaneers',
  270: 'Zandalar Tribe',
  469: 'Alliance',
  576: 'Timbermaw Hold',
  889: 'Warsong Outriders',
  890: 'Silverwing Sentinels',
}

const faction = {
  120: 'Booty Bay',
  119: 'Bloodsail Buccaneers',
  16: 'Hostile',
  // 92: 'Gelkis Clan Centaur',
  // 93: 'Magram Clan Centaur',
  // 59: 'Thorium Brotherhood',
  // 349: 'Ravenholdt',
  // 70: 'Syndicate',
  // 369: 'Gadgetzan',
  // 471: 'Wildhammer Clan',
  // 470: 'Ratchet',
  // 169: 'Steamwheedle Cartel',
  // 529: 'Argent Dawn',
  // 76: 'Orgrimmar',
  // 530: 'Darkspear Trolls',
  // 81: 'Thunder Bluff',
  // 68: 'Undercity',
  // 54: 'Gnomeregan Exiles',
  // 72: 'Stormwind',
  // 47: 'Ironforge',
  // 69: 'Darnassus',
  // 86: 'Leatherworking – Dragonscale',
  // 83: 'Leatherworking – Elemental',
  // 549: 'Leatherworking – Tribal',
  // 551: 'Engineering – Gnome',
  // 550: 'Engineering – Goblin',
  // 589: 'Wintersaber Trainers',
  // 577: 'Everlook',
  // 46: 'Blacksmithing – Armorsmithing',
  // 289: 'Blacksmithing – Weaponsmithing',
  // 570: 'Blacksmithing – Axesmithing',
  // 571: 'Blacksmithing – Swordsmithing',
  // 569: 'Blacksmithing – Hammersmithing',
  // 574: 'Caer Darrow',
  // 609: 'Cenarion Circle',
  // 947: 'Thrallmar',
  // 946: 'Honor Hold',
  // 935: 'The Sha’tar',
  // 730: 'Stormpike Guard',
  // 729: 'Frostwolf Clan',
  // 749: 'Hydraxian Waterlords',
  // 980: 'The Burning Crusade',
  // 809: 'Shen’dralar',
  // 891: 'Alliance Forces',
  // 892: 'Horde Forces',
  // 930: 'Exodar',
  // 909: 'Darkmoon Faire',
  // 510: 'The Defilers',
  // 509: 'The League of Arathor',
  // 910: 'Brood of Nozdormu',
  // 911: 'Silvermoon City',
  // 922: 'Tranquillien',
  // 990: 'The Scale of the Sands',
  // 932: 'The Aldor',
  // 936: 'Shattrath City',
  // 933: 'The Consortium',
  // 941: 'The Mag’har',
  // 934: 'The Scryers',
  // 967: 'The Violet Eye',
  // 942: 'Cenarion Expedition',
  // 970: 'Sporeggar',
  // 978: 'Kurenai',
  // 989: 'Keepers of Time',
  // 1005: 'Friendly, Hidden',
  // 1011: 'Lower City',
  // 1012: 'Ashtongue Deathsworn',
  // 1015: 'Netherwing',
  // 1031: 'Sha’tari Skyguard',
  // 1038: 'Ogri’la',
  // 1050: 'Valiance Expedition',
  // 1052: 'Horde Expedition',
  // 1064: 'The Taunka',
  // 1067: 'The Hand of Vengeance',
  // 1068: 'Explorers’ League',
  // 1073: 'The Kalu’ak',
  // 1077: 'Shattered Sun Offensive',
  // 1085: 'Warsong Offensive',
  // 1091: 'The Wyrmrest Accord',
  // 1090: 'Kirin Tor',
  // 1037: 'Alliance Vanguard',
  // 1097: 'Wrath of the Lich King',
  // 1094: 'The Silver Covenant',
  // 1098: 'Knights of the Ebon Blade',
  // 1104: 'Frenzyheart Tribe',
  // 1105: 'The Oracles',
  // 1106: 'Argent Crusade',
  // 1117: 'Sholazar Basin',
  // 1118: 'Classic',
  // 1119: 'The Sons of Hodir',
  // 1124: 'The Sunreavers',
  // 1126: 'The Frostborn',
  // 1136: 'Tranquillien Conversion',
  // 1137: 'Wintersaber Conversion',
  // 1154: 'Silver Covenant Conversion',
  // 1155: 'Sunreavers Conversion',
  // 1156: 'The Ashen Verdict',
}

const skill = {
  164: 'Blacksmithing',
  165: 'Leatherworking',
  171: 'Alchemy',
  185: 'Cooking',
  186: 'Mining',
  197: 'Tailoring',
  202: 'Engineering',
  356: 'Fishing',
  755: 'Jewelcrafting',
  333: 'Enchanting',
  129: 'First Aid',
  182: 'Herbalism',
  633: 'Lockpicking',
  393: 'Skinning',
}

const creature_template = {
  Rank,
  Family,
  CreatureType,
  RegenerateStats,
}

const quest_template = {
  RequiredRaces: race,
  RequiredClasses: classes,
  RequiredSkill: skill,
  RepObjectiveFaction: faction,
  RequiredMinRepFaction: faction,
  RequiredMaxRepFaction: faction,
  QuestFlags: bitFlags([
    'Fail on death',
    'Escort (group accept)',
    'Involves areatrigger',
    'Shareable',
    '',
    '',
    'Raid',
    '',
    'Needs non-objective items (ReqSourceID)',
    'Hide rewards until complete',
    'Automatically rewarded',
    '',
    'Daily',
    'PvP',
  ]),
}

const item_template = {
  RequiredReputationFaction: faction,
  RequiredSkill: skill,
  AllowableRace: race,
  AllowableClass: classes,
  Flags: bitFlags([
    'Soulbound',
    'Conjured',
    'Openable',
    'Wrapped',
    '',
    'Totem',
    'Useable',
    '',
    'Wrapper',
    '',
    'Gifts',
    'Party loot',
    '',
    'Charter',
    '',
    'PvP reward',
    'Unique equipped',
    '',
    '',
    'Throwable',
    'Special Use',
  ]),
  // stat_type:
  ...Object.fromEntries([...Array(11).keys()].slice(1).map(i => [
    `stat_type${i}`,
    [
      'ITEM_MOD_HEALTH',
      '',
      'ITEM_MOD_AGILITY',
      'ITEM_MOD_STRENGTH',
      'ITEM_MOD_INTELLECT',
      'ITEM_MOD_SPIRIT',
      'ITEM_MOD_STAMINA',
      '',
      '',
      '',
      '',
      'ITEM_MOD_DEFENSE_SKILL_RATING',
      'ITEM_MOD_DODGE_RATING',
      'ITEM_MOD_PARRY_RATING',
      'ITEM_MOD_BLOCK_RATING',
      'ITEM_MOD_HIT_MELEE_RATING',
      'ITEM_MOD_HIT_RANGED_RATING',
      'ITEM_MOD_HIT_SPELL_RATING',
      'ITEM_MOD_CRIT_MELEE_RATING',
      'ITEM_MOD_CRIT_RANGED_RATING',
      'ITEM_MOD_CRIT_SPELL_RATING',
      'ITEM_MOD_HIT_TAKEN_MELEE_RATING',
      'ITEM_MOD_HIT_TAKEN_RANGED_RATING',
      'ITEM_MOD_HIT_TAKEN_SPELL_RATING',
      'ITEM_MOD_CRIT_TAKEN_MELEE_RATING',
      'ITEM_MOD_CRIT_TAKEN_RANGED_RATING',
      'ITEM_MOD_CRIT_TAKEN_SPELL_RATING',
      'ITEM_MOD_HASTE_MELEE_RATING',
      'ITEM_MOD_HASTE_RANGED_RATING',
      'ITEM_MOD_HASTE_SPELL_RATING',
      'ITEM_MOD_HIT_RATING',
      'ITEM_MOD_CRIT_RATING',
      'ITEM_MOD_HIT_TAKEN_RATING',
      'ITEM_MOD_CRIT_TAKEN_RATING',
      'ITEM_MOD_RESILIENCE_RATING',
      'ITEM_MOD_HASTE_RATING',
      'ITEM_MOD_EXPERTISE_RATING',
    ]
  ])),
  // dmg_type1
  ...Object.fromEntries([...Array(6).keys()].slice(1).map(i => [
    `dmg_type${i}`,
    [
      /* 0  */ 'Physical',
      /* 1  */ 'Holy',
      /* 2  */ 'Fire',
      /* 3  */ 'Nature',
      /* 4  */ 'Frost',
      /* 5  */ 'Shadow',
      /* 6  */ 'Arcane',
    ],
  ])),
  RequiredReputationRank: [
    /* 0  */ 'Hated',
    /* 1  */ 'Hostile',
    /* 2  */ 'Unfriendly',
    /* 3  */ 'Neutral',
    /* 4  */ 'Friendly',
    /* 5  */ 'Honored',
    /* 6  */ 'Revered',
    /* 7  */ 'Exalted',
  ],
  InventoryType: [
    /* 0  */ 'Non equipable',
    /* 1  */ 'Head',
    /* 2  */ 'Neck',
    /* 3  */ 'Shoulder',
    /* 4  */ 'Shirt',
    /* 5  */ 'Chest',
    /* 6  */ 'Waist',
    /* 7  */ 'Legs',
    /* 8  */ 'Feet',
    /* 9  */ 'Wrists',
    /* 10 */ 'Hands',
    /* 11 */ 'Finger',
    /* 12 */ 'Trinket',
    /* 13 */ 'Weapon',
    /* 14 */ 'Shield',
    /* 15 */ 'Ranged',
    /* 16 */ 'Back',
    /* 17 */ 'Two-Hand',
    /* 18 */ 'Bag',
    /* 19 */ 'Tabard',
    /* 20 */ 'Robe',
    /* 21 */ 'Main hand',
    /* 22 */ 'Off hand',
    /* 23 */ 'Holdable (Tome)',
    /* 24 */ 'Ammo',
    /* 25 */ 'Thrown',
    /* 26 */ 'Ranged right',
    /* 27 */ 'Quiver',
    /* 28 */ 'Relic',
  ],
  class: [
    {
      name: 'Consumable',
      subclass: [
        'Potion',
        'Elixir',
        'Flask',
        'Scroll',
        'Food & Drink',
        'Item Enhancement',
        'Bandage',
        'Other',
      ],
    },
    {
      name: 'Container',
      subclass: [
        'Bag',
        'Soul Bag',
        'Herb Bag',
        'Enchanting Bag',
        'Engineering Bag',
        'Gem Bag',
        'Mining Bag',
        'Leatherworking Bag',
      ],
    },
    {
      name: 'Weapon',
      subclass: [
        'Axe One handed',
        'Axe Two handed',
        'Bow',
        'Gun',
        'Mace  One handed',
        'Mace  Two handed',
        'Polearm',
        'Sword One handed',
        'Sword Two handed',
        'Obsolete',
        'Staff',
        'Exotic',
        'Exotic',
        'Fist Weapon',
        'Miscellaneous (Blacksmith Hammer, Mining Pick, etc.)',
        'Dagger',
        'Thrown',
        'Spear',
        'Crossbow',
        'Wand',
        'Fishing Pole',
      ],
    },
    {
      name: 'Gem',
      subclass: [
        'Red',
        'Blue',
        'Yellow',
        'Purple',
        'Green',
        'Orange',
        'Meta',
        'Simple',
        'Prismatic',
      ],
    },
    {
      name: 'Armor',
      subclass: [
        'Miscellaneous',
        'Cloth',
        'Leather',
        'Mail',
        'Plate',
        'Buckler(OBSOLETE)',
        'Shield',
        'Libram',
        'Idol',
        'Totem',
      ],
    },
    {
      name: 'Reagent',
      subclass: [
        'Reagent',
      ],
    },
    {
      name: 'Projectile',
      subclass: [
        'Wand(OBSOLETE)',
        'Bolt(OBSOLETE)',
        'Arrow',
        'Bullet',
        'Thrown(OBSOLETE)',
      ],
    },
    {
      name: 'Trade Goods',
      subclass: [
        'Trade Goods',
        'Parts',
        'Explosives',
        'Devices',
        'Jewelcrafting',
        'Cloth',
        'Leather',
        'Metal & Stone',
        'Meat',
        'Herb',
        'Elemental',
        'Other',
        'Enchanting',
      ],
    },
    {
      name: 'Generic(OBSOLETE)',
      subclass: ['Generic(OBSOLETE)'],
    },
    {
      name: 'Recipe',
      subclass: [
        'Book',
        'Leatherworking',
        'Tailoring',
        'Engineering',
        'Blacksmithing',
        'Cooking',
        'Alchemy',
        'First Aid',
        'Enchanting',
        'Fishing',
        'Jewelcrafting',
      ],
    },
    {
      name: 'Money(OBSOLETE)',
      subclass: ['Money(OBSOLETE)'],
    },
    {
      name: 'Quiver',
      subclass: [
        'Quiver(OBSOLETE)',
        'Quiver(OBSOLETE)',
        'Quiver  Can hold arrows',
        'Ammo Pouch  Can hold bullets',
      ],
    },
    {
      name: 'Quest',
      subclass: ['Quest'],
    },
    {
      name: 'Key',
      subclass: ['Key', 'Lockpick'],
    },
    {
      name: 'Permanent(OBSOLETE)',
      subclass: ['Permanent'],
    },
    {
      name: 'Miscellaneous',
      subclass: [
        'Junk',
        'Reagent',
        'Pet',
        'Holiday',
        'Other',
        'Mount',
      ],
    },
    {
      name: 'Glyph',
      subclass: [
        'Warrior',
        'Paladin',
        'Hunter',
        'Rogue',
        'Priest',
        'Death Knight',
        'Shaman',
        'Mage',
        'Warlock',
        'Druid',
      ],
    },
  ],
  spelltrigger_1: [
    'Use',
    'On Equip',
    'Chance on Hit',
    'Soulstone',
    'Use with no delay',
    'Learn spell if spellid_1 = 55884',
  ],
  bonding: [
    '',
    'Binds when picked up',
    'Binds when equipped',
    'Binds when used',
    'Quest item',
  ],
  material: [
    '',
    'Metal',
    'Wood',
    'Liquid',
    'Jewelry',
    'Chain',
    'Plate',
    'Cloth',
    'Leather',
  ],
  BagFamily: bitFlags([
    'Arrows',
    'Bullets',
    'Soul Shards',
    'Leatherworking Supplies',
    '',
    'Herbs',
    'Enchanting Supplies',
    'Engineering Supplies',
    'Keys',
    'Gems',
    'Mining Supplies',
  ]),
  socketColor: bitFlags(['Meta','Red','Yellow','Blue']),
  foodType: [
    '',
    'Meat',
    'Fish',
    'Cheese',
    'Bread',
    'Fungus',
    'Fruit',
    'Raw Meat',
    'Raw Fish',
  ],
}

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

const wow = { creature_template, quest_template, item_template }

// LIB
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

const avg = (...args) => Math.round(args
  .map(Number)
  .reduce((t, n) => (n + t) / 2))

const getLevelColor = lvl => {
  lvl = Number(lvl)
  if (lvl > 25) return red
  if (lvl > 22) return orange
  if (lvl > 16) return color.blizz.yellow
  if (lvl > 13) return green
  return color.blizz.grey
}

const getCost = cost => [
  ['gold', Math.floor(cost / 10000)],
  ['silver', Math.floor((cost % 10000) / 100)],
  ['copper', Math.floor(cost % 100)],
].filter(([,v]) => v)

const queryBuild = r => q => console.log('executing query', q) || fetch(r, {
  method: 'POST',
  headers: { 'content-type': 'text/plain' },
  body: q,
}).then(toJSON)

const query = queryBuild('/admin/sql')
const queryLog = queryBuild('/admin/sql/log')

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

const inputBaseEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  borderRadius: '0.25em',
  border: 0,
  padding: '0 0.5em',
  height: '1.75em',
})

//const textAreaEl = h.style('textarea', { resize: 'vertical', border: 'none' })
const textAreaEl = h({
  style: { display: 'inline-block' },
  contentEditable: true,
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
  FROM tbcmangos.npc_vendor_template
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

const npcLink = npc => a({ href: `#/tbcmangos/creature_template/update/${npc.entry}` }, [
  h.span.style({ color: getLevelColor(npc.lvl) }, npc.lvl),
  ` ${npc.name} `,
])

const gobLink = gob => a({ href: `#/tbcmangos/gameobject_template/update/${gob.entry}` },
  [ `${gob.name} `, comment('(object)') ])

const itemLink = (item, href) => [
  itemThumbnail(item),
  h.a({
    href: isStr(href) ? href : `#/tbcmangos/item_template/update/${item.entry}`,
    style: {
      flexGrow: 1,
      color: color.blizz.quality[item.Quality],
      textDecoration: 'none',
    },
  }, item.name),
]

// Entry, QuestLevel, Title
const questLink = quest => a({
  style: { display: 'block' },
  href: `#/tbcmangos/quest_template/update/${quest.Entry}`}, [
  imgEl({ src: images.quest }),
  h.span.style({ color: getLevelColor(quest.QuestLevel) }, Math.max(quest.QuestLevel, 0)),
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
  FROM tbcmangos.npc_vendor_template as a
  LEFT JOIN tbcmangos.item_template as b
    ON a.item = b.entry
  WHERE a.entry="${VendorTemplateId}"
`)

const addItemToVendorList = params => queryLog(`
  INSERT INTO tbcmangos.npc_vendor_template ${toFields(params)}
  VALUES ${toValues(params)}
`)

// SPECIAL_CASE
const fetchItemList = (vendor, vendorList) => findVendorItemList(vendor)
  .then(r => replaceContent(vendorList, r.map(item => flex.style({
    alignItems: 'center',
    marginBottom: '0.25em',
    height: '2em',
    width: '33%',
    flexGrow: 1,
    paddingLeft: '0.25em',
  },[
    itemLink(item, `#/tbcmangos/npc_vendor_template/${vendor}/update/${item.item}`),
    a({
      style: {
        padding: '0.75em',
        color: red,
      },
      href: location.hash,
      onclick: function handleDelete({ target: el }) {
        el.onclick = undefined
        el.style.color = green
        replaceContent(el, '↺')
        el.parentElement.style.opacity = 0.3
        removeItemFromVendorList(item.entry, item.item)
          .then(() => el.onclick = () => {
            el.onclick = undefined
            el.style.color = color.comment
            replaceContent(el, '.')
            addItemToVendorList(
              Object.fromEntries(Object.entries(item)
                .filter(([,name]) => dbInfo.tbcmangos.npc_vendor_template[name])))
              .then(r => {
                console.log(r)
                el.onclick = handleDelete
                el.style.color = red
                replaceContent(el, 'X')
                el.parentElement.style.opacity = 1
              })
          })
      },
    }, 'X')
  ]))))

const getLinkedQuest = npcEntry => query(`
  SELECT
    quest as Entry,
    QuestLevel,
    Title
  FROM tbcmangos.creature_questrelation as a
  LEFT JOIN tbcmangos.quest_template as b
    ON a.quest = b.entry
  WHERE a.id="${npcEntry}"
`)

const sideHeader = h.style({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

const sortQuest = (a, b) => (b.QuestLevel - a.QuestLevel) || a.Title.localeCompare(b.Title)
const creatureContent = npc => {
  console.log({ npc })
  const sub = flex.style({ flexFlow: 'column' })
  const rightHeader = sideHeader.style({ alignItems: 'flex-end' })
  const leftHeader = sideHeader.style({ alignItems: 'flex-start' })
  // find linked scripts:
  // query(`SELECT * FROM tbcmangos.creature_ai_scripts WHERE creature_id="2319" LIMIT 100`)

  // find spawned creatures:
  // query(`SELECT * FROM tbcmangos.creature WHERE creature_id="${npc.Entry}"`)

  // Get quest list if any
  getLinkedQuest(npc.Entry)
    .then(r => appendChild(leftHeader, r.rows.sort(sortQuest).map(questLink)))

  if (npc.VendorTemplateId != 0) {
    const onclick = () => {
      const entry = _getVal(itemInput).trim()
      const whereClause = /[0-9]+/.test(entry)
        ? `entry="${entry}"`
        : `name LIKE "%${entry}%"`

      query(`SELECT entry FROM tbcmangos.item_template WHERE ${whereClause} LIMIT 1`)
        .then(({ rows: [ item ] }) => {
          if (!item) {
            itemInput.style.color = red
            return itemInput.focus()
          }
          addItemToVendorList({ entry: npc.VendorTemplateId, item: item.entry })
            .then(({ info }) => {
              if (info.affectedRows == 1) {
                fetchItemList(npc.VendorTemplateId, vendorList)
              }
              _setVal(itemInput, '')
              itemInput.focus()
            })
        })
    }
    const vendorList = flex.style({ flexFlow: 'row', flexWrap: 'wrap' })
    const onkeydown = keyHandler({ enter: onclick })
    const itemInput = inputBaseEl({
      style: { width: '20em' },
      onkeypress: () => itemInput.style.color = yellow,
      onkeydown,
    })
    appendChild(sub, inputHeader.style({
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

  const buildCost = ([type, amount]) => h.span.style(
    { color: color.blizz[type] },
    `${amount}${type.slice(0, 1)} `,
  )
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
            ? ` (${creature_template.Rank[npc.Rank]})`
            : undefined,
        ]),
        (npc.SubName && npc.SubName !== 'null')
          && h.div.style({ color: cyan }, `<${npc.SubName}>`),
        h.div(getCost(avg(npc.MaxLootGold, npc.MinLootGold)).map(buildCost)),
      ].filter(Boolean)),
      rightHeader,
    ]),
    sub,
  ]
}

///// ITEM_TEMPLATE
const findLinkedQuests = entry => query(`
  SELECT Entry, QuestLevel, Title
  FROM tbcmangos.quest_template
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
  console.log(item)

  const rightHeader = sideHeader.style({
    alignItems: 'flex-end',
    minWidth: '40%',
  })

  findLinkedQuests(item.entry)
    .then(({ rows }) => rightHeader.appendChild(h.div(rows.sort(sortQuest).map(questLink))))

  return inputHeader.style({
    width: '100%',
    minHeight: '0',
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
      h.div.style({ padding: '0.25em', color: color.comment }, item.description),
      h.div([
        h.span(`${item_template.class[item.class].name} (${item_template.class[item.class].subclass[item.subclass]})`),
        comment(' - '),
        h.span.style({ color:getLevelColor(item.RequiredLevel) },
          `${item.RequiredLevel}(+${item.ItemLevel-item.RequiredLevel})`),
        comment(' - '),
        getCost(item.SellPrice).map(([type, amount]) =>
          h.span.style({ color: color.blizz[type] }, `${amount}${type.slice(0, 1)} `)),
      ]),
    ]),
    rightHeader,
  ])
}

///// QUEST_TEMPLATE
const getQuestGiverItem = quest => query(`
  SELECT entry, name, Quality, icon
  FROM tbcmangos.item_template
  WHERE startquest="${quest}"
`)

const getQuestGiverNpc = quest => query(`
  SELECT
    Entry as entry,
    MaxLevel as lvl,
    Name as name
  FROM tbcmangos.creature_questrelation as a
  LEFT JOIN tbcmangos.creature_template as b
    ON a.id = b.Entry
  WHERE a.quest="${quest}"
`)

const getQuestTakerNpc = quest => query(`
  SELECT
    Entry as entry,
    MaxLevel as lvl,
    Name as name
  FROM tbcmangos.creature_involvedrelation as a
  LEFT JOIN tbcmangos.creature_template as b
    ON a.id = b.Entry
  WHERE a.quest="${quest}"
`)

const getQuestGiverGob = quest => query(`
  SELECT entry, name
  FROM tbcmangos.gameobject_questrelation as a
  LEFT JOIN tbcmangos.gameobject_template as b
    ON a.id = b.entry
  WHERE a.quest="${quest}"
`)

const getQuestTakerGob = quest => query(`
  SELECT entry, name
  FROM tbcmangos.gameobject_involvedrelation as a
  LEFT JOIN tbcmangos.gameobject_template as b
    ON a.id = b.entry
  WHERE a.quest="${quest}"
`)

const npcAndRelationLinks = (npc, quest, type) => h.div([
  npcLink(npc),
  a({
    style: { color: purple },
    href: `#/tbcmangos/creature_${type}relation/update/${npc.entry}/${quest.entry}`,
  }, '(relation)')
])

const specialCases = {
  tbcmangos: {
    quest_template: {
      enums: quest_template,
      content: quest => {
        const leftHeader = sideHeader.style({ alignItems: 'flex-start' })
        const rightHeader = sideHeader.style({ alignItems: 'flex-end' })

        Promise.all([
          getQuestGiverNpc(quest.entry),
          getQuestGiverItem(quest.entry),
          getQuestGiverGob(quest.entry),
        ]).then(([ npcs, items, gobs ]) => {
          leftHeader.appendChild(h.div([
            gobs.rows.map(gobLink),
            npcs.rows.map(npc => npcAndRelationLinks(npc, quest, 'quest')),
            items.rows.map(item => h.div(itemLink(item))),
          ]))
        })

        Promise.all([
          getQuestTakerNpc(quest.entry),
          getQuestTakerGob(quest.entry),
        ]).then(([ npcs, gobs ]) => {
          rightHeader.appendChild(h.div([
            gobs.rows.map(gobLink),
            npcs.rows.map(npc => npcAndRelationLinks(npc, quest, 'involved')),
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
        ReqCreatureOrGOId: val => `#/tbcmangos/${Number(val) > 0
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
      enums: item_template,
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
        'sheat',
        'ExtraFlags'
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

const colorize = i => ({ color: color[colorKeys[(i+1)%colorKeys.length]] })
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

const selectQuery = (db, table, fields, params) => query(`
  SELECT ${fields.join(', ')}
  FROM ${db}.${table}
  WHERE ${isStr(params) ? params : querify(params)}
`)

const displaySearchResults = (db, table, params, fields) => {
  selectQuery(db, table, fields, params)
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
      const links = g(specialCase, 'links')
      const enums = g(specialCase, 'enums')
      specialCase.blacklist || (specialCase.blacklist = new Set())

      const rawFieldList = Object.entries(table).map(([name, field]) => {
        let value = first[name]
        if (/^unk([0-9]+)?$/.test(name)) return
        if (field.name.toLowerCase() === 'entry') return

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
          width: enumElements.length ? '100%' : 'calc(50% - 0.5em)',
        }

        const elLabel = labelEl({
          onclick: e => e.target === elLabel ? input.focus() : undefined,
          style: enumElements.length ? { display: 'inline-flex', flexDirection: 'row' } : labelStyle,
        }, [ link, input, resetButton ])

        return {
          field,
          el: enumElements.length ? h.div.style(labelStyle, [ elLabel, enumElements ]) : elLabel
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

  console.log('PRIMARY BUG', { table })
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
  WHERE a.TABLE_SCHEMA = "tbcmangos"
    and a.TABLE_NAME in (
      ${Object.keys(specialCases.tbcmangos).map(toValue)},
      "creature",
      "npc_trainer",
      "npc_trainer_template",
      "npc_vendor",
      "npc_vendor_template"
    )
  ORDER BY name
`).then(({ rows }) => {
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

}

const style = `
button {
  background: #14151b;
  color: aliceblue;
  border: none;
  padding: 0.125em 0.7em;
  border-radius: 1em;
  margin: 0.25em;
}
button[disabled] {
  background: transparent;
}
`

// SERVER
import { cyan, bold } from 'https://deno.land/std/fmt/colors.ts'
import { serve, makePage } from './_server.js'

const index = makePage({ title: 'db', script, style })
await serve({ 'GET /': () => index }, 8585, bold(cyan('db')))
