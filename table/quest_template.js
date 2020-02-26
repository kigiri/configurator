import { h } from '../lib/h.js'
import { classes, skill, race, faction, bitFlags } from '../lib/wow.js'
import { a, sideHeader, inputHeader } from '../elem/shared.js'
import { purple, cyan, color, getLevelColor } from '../lib/colors.js'

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

export const enums = {
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

export const required = new Set([
  'Title',
  'QuestLevel',
])

export const links = {
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
}

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

const npcAndRelationLinks = (npc, quest, type) => h.div([
  npcLink(npc),
  a({
    style: { color: purple },
    href: `#/tbcmangos/creature_${type}relation/update/${npc.entry}/${quest.entry}`,
  }, '(relation)')
])

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

export const content = quest => {
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
}
