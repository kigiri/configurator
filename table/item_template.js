import { h } from '../lib/h.js'
import { cdn } from '../lib/image.js'
import { color, getLevelColor } from '../lib/colors.js'
import { faction, skill, race, classes, dmgTypes, bitFlags, getCost, sortQuest } from '../lib/wow.js'
import { sideHeader, inputHeader, questLink, comment, imgEl } from '../elem/shared.js'

export const enums = {
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
      '', // Health
      '', // Health
      '',
      'Agility',
      'Strength',
      'Intellect',
      'Spirit',
      'Stamina',
      '',
      '',
      '',
      '',
      'Defense skill',
      'Dodge',
      'Parry',
      'Block',
      '', // Hit melee
      '', // Hit ranged
      '', // Hit spell
      '', // Crit melee
      '', // Crit ranged
      '', // Crit spell
      '', // Hit taken melee
      '', // Hit taken ranged
      '', // Hit taken spell
      '', // Crit taken melee
      '', // Crit taken ranged
      '', // Crit taken spell
      '', // Haste melee
      '', // Haste ranged
      '', // Haste spell
      'Hit',
      'Crit',
      '', // Hit taken
      '', // Crit taken
      'Resilience',
      'Haste',
      'Expertise',
    ]
  ])),
  // dmg_type1
  ...Object.fromEntries([...Array(6).keys()].slice(1).map(i => [ `dmg_type${i}`, dmgTypes ])),
  RequiredReputationRank: [
    'Hated',
    'Hostile',
    'Unfriendly',
    'Neutral',
    'Friendly',
    'Honored',
    'Revered',
    'Exalted',
  ],
  InventoryType: [
    'Non equipable',
    'Head',
    'Neck',
    'Shoulder',
    'Shirt',
    'Chest',
    'Waist',
    'Legs',
    'Feet',
    'Wrists',
    'Hands',
    'Finger',
    'Trinket',
    'Weapon',
    'Shield',
    'Ranged',
    'Back',
    'Two-Hand',
    'Bag',
    'Tabard',
    'Robe',
    'Main hand',
    'Off hand',
    'Holdable (Tome)',
    'Ammo',
    'Thrown',
    'Ranged right',
    'Quiver',
    'Relic',
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
        'Miscellaneous', //  (Blacksmith Hammer, Mining Pick, etc.)
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

export const links = {
  spellid_: 'spell_template',
  PageText: 'page_text',
  startquest: 'quest_template',
  RandomProperty: 'item_enchantment_template',
  RandomSuffix: 'item_enchantment_template',
  DisenchantID: 'disenchant_loot_template',
}

export const required = new Set([
  'entry',
  'Quality',
  'name',
  'icon',
])

export const blacklist = new Set([
  'displayid',
  'icon',
  'requiredhonorrank',
  'class',
  'subclass',
  'sheat',
  'ExtraFlags'
])

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

export const content = item => {
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
    backgroundImage: `url('${cdn}/item/${item.displayid}.png')`,
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
        h.span(`${enums.class[item.class].name} (${enums.class[item.class].subclass[item.subclass]})`),
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
