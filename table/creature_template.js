import { faction, dmgTypes, bitFlags, getCost, sortQuest } from '../lib/wow.js'
import { color, red, cyan, green, getLevelColor } from '../lib/colors.js'
import { cdn } from '../lib/image.js'
import { h, appendChild, keyHandler, replaceContent } from '../lib/h.js'
import { a, sideHeader, inputHeader, questLink, flex, imgEl, inputBaseEl, itemLink } from '../elem/shared.js'

export const enums = {
  Rank: [
    'Normal',
    'Elite',
    'Rare Elite',
    'World Boss',
    'Rare',
  ],
  Family: [
    '',
    'Wolf',
    'Cat',
    'Spider',
    'Bear',
    'Boar',
    'Crocolisk',
    'Carrion Bird',
    'Crab',
    'Gorilla',
    'Tallstrider',
    'Raptor',
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
  ],
  CreatureType: [
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
  ],
  RegenerateStats: [
    'No regen',
    'Health only',
    'Mana only',
    'Health and Mana',
  ],
  TrainerType: [
    'Class',
    'Mounts',
    'Tradeskills',
    'Pets',
  ],
  NpcFlags: bitFlags([
    'Gossip', // Gossip  If creature has more gossip options, add this flag to bring up a menu.
    'Quest Giver', // Quest Giver Any creature giving or taking quests needs to have this flag.
    '', // 
    '', // 
    'Trainer', // Trainer Allows the creature to have a trainer list to teach spells
    'Trainer_Class', // Trainer_Class Allows the creature to have a class trainer list to teach spells. (MUST USE WITH FLAG: 16)
    'Trainer_Profession', // Trainer_Profession  Allows the creature to have a profession trainer list to teach spells     (MUST USE WITH FLAG: 16)
    'Vendor', // Vendor  Any creature selling items needs to have this flag.
    'Vendor_Ammo', // Vendor_Ammo Any creature selling ammo items needs to have this flag. (MUST USE WITH FLAG: 128)
    'Vendor_Food', // Vendor_Food Any creature selling food items needs to have this flag. (MUST USE WITH FLAG: 128)
    'Vendor_Poison', // Vendor_Poison Any creature selling poison items needs to have this flag. (MUST USE WITH FLAG: 128)
    'Vendor_Reagent', // Vendor_Reagent  Any creature selling reagent items needs to have this flag. (MUST USE WITH FLAG: 128)
    'Repairer', // Repairer  Creatures with this flag can repair items.
    'Flight Master', // Flight Master Any creature serving as fly master has this.
    'Spirit Healer', // Spirit Healer Makes the creature invisible to alive characters and has the resurrect function.
    'Spirit Guide', // Spirit Guide
    'Innkeeper', // Innkeeper Creatures with this flag can set hearthstone locations.
    'Banker', // Banker  Creatures with this flag can show the bank
    'Petitioner', // Petitioner  
    'Tabard Designer', // Tabard Designer Allows the designing of guild tabards.
    'Battlemaster', // Battlemaster  Creatures with this flag port players to battlegrounds.
    'Auctioneer', // Auctioneer  Allows creature to display auction list.
    'Stable Master', // Stable Master Has the option to stable pets for hunters.
    'Guild Banker', // Guild Banker  cause client to send 997 opcode
    '', // SpellClick/Instantloot  cause client to send 1015 opcode (spell click), dynamic, set at loading and don’t must be set in DB. (Npc_spellclick_spells)
    'Player Vehicle', // Player Vehicle  players with mounts that have vehicle data should have it set
    '', // 
    '', // 
    'Guard', // Guard ? Creatures with this flag act as guards in cities.
  ]),
  Faction: faction,
  UnitFlags: bitFlags([
    '', // Movement checks disabled, likely paired with loss of client control packet.
    'Non attackable', // not attackable
    'Client control lost', // Generic unspecified loss of control initiated by server script, movement checks disabled, paired with loss of client control packet.
    'Player controlled', // players, pets, totems, guardians, companions, charms, any units associated with players
    'Rename',
    'Preparation', // don’t take reagents for spells with SPELL ATTR EX5 NO REAGENT WHILE PREP
    '', // Related to Movement? often paired with UNIT FLAG SWIMMING
    'Not attackable 1', // UNIT FLAG PVP + UNIT FLAG NOT ATTACKABLE 1 = UNIT FLAG NON PVP ATTACKABLE – blue color target
    'Immune to player', // Target is immune to players
    'Immune to npc', // makes you unable to attack everything. Almost identical to our “civilian”-term. Will ignore it’s surroundings and not engage in combat unless “called upon” or engaged by another unit.
    'Looting', // loot animation
    'Pet in combat', // in combat?, 2.0.8
    'PvP', // Allows item spells to be casted upon. changed in 3.0.3
    'Silenced', // silenced, 2.1.1
    'Persuaded', // persuaded, 2.0.8
    'Swimming', // controls water swimming animation – TODO: confirm whether dynamic or static
    'Non attackable 2', // removes attackable icon, if on yourself, cannot assist self but can cast TARGET SELF spells – added by SPELL AURA MOD UNATTACKABLE
    'Pacified', // pacified, 3.0.3
    'Stunned', // stunned, 2.1.1 Unit is a subject to stun, turn and strafe movement disabled
    'In combat', // 
    'Taxi flight', // Unit is on taxi, paired with a duplicate loss of client control packet (likely a legacy serverside hack). Disables any spellcasts not allowed in taxi flight client-side.
    'Disarmed', // disable melee spells casting…, “Required melee weapon” added to melee spells tooltip.
    'Confused', // Unit is a subject to confused movement, movement checks disabled, paired with loss of client control packet.
    'Fleeing', // Unit is a subject to fleeing movement, movement checks disabled, paired with loss of client control packet.
    'Possessed', // Unit is under remote control by another unit, movement checks disabled, paired with loss of client control packet. New master is allowed to use melee attack and can’t select this unit via mouse in the world (as if it was own character).
    'Not selectable', // Can’t be selected by mouse
    'Skinnable', // 
    'Mount', // the client seems to handle it perfectly
    '', // 
    '', // used in Feing Death spell
    'Sheathe', // 
  ]),
  DynamicFlags: bitFlags([
    'Lootable',
    'Track unit',
    'Tapped', // Lua UnitIsTapped – Makes creatures name appear grey (good for simulating dead creatures) ???
    'Tapped by player', // Lua UnitIsTappedByPlayer
    'Show Creature Stats', //  Shows creatures basic stats (Health, damage, resistances, tamable).
    'Dead', // Makes the creature appear dead (this DOES NOT make the creatures name grey)
    'Refer a friend',
    'Tapped by all threat list', //  Lua UnitIsTappedByAllThreatList
  ]),
  Civilian: [ 'Normal', 'Civilian' ],
  MovementType: [ 'Stationary', 'Random', 'Waypoint' ],
  SchoolImmuneMask: bitFlags(dmgTypes),
  DamageSchool: dmgTypes,
  MechanicImmuneMask: bitFlags([
    'Charm',
    'Confused',
    'Disarm',
    'Distract',
    'Fear',
    'Fumble',
    'Root',
    'Pacify',
    'Silence',
    'Sleep',
    'Snare',
    'Stun',
    'Freeze',
    'Knockout',
    'Bleed',
    'Bandage',
    'Polymorph',
    'Banish',
    'Shield',
    'Shackle',
    'Mount',
    'Persuade',
    'Turn',
    'Horror',
    'Invulnerability',
    'Interrupt',
    'Daze',
    'Discovery',
    'Immune Shield',
    'Sapped',
  ]),
  AIName: {
    NullAI: 'NullAI - Do nothing.',
    AggressorAI: 'AggressorAI - Attacks in aggro range.',
    ReactorAI: 'ReactorAI - Attacks if attacked',
    GuardAI: 'GuardAI',
    PetAI: 'PetAI',
    TotemAI: 'TotemAI - Casts spell from field spell1',
    EventAI: 'EventAI - Event Based AI',
  },
  ExtraFlags: bitFlags([
    'Instance bind', // creature kill bind instance with killer and killer’s group
    'No aggro on sight', // no aggro (ignore faction/reputation hostility)
    'No parry', //  creature can’t parry
    'No parry hasten', // creature can’t counter-attack at parry
    'No block', //  creature can’t block
    'No crush', //  creature can’t do crush attacks
    'No xp at kill', // creature kill not provide XP
    'Invisible', // creature is always invisible for player (mostly trigger creatures)
    'Not tauntable', // creature is immune to taunt auras and effect attack me
    'Aggro zone', //  creature sets itself in combat with zone on aggro
    'Guard', // creature is a guard
    'No call assist', //  creature shouldn’t call for assistance on aggro
    'Active', //  creature is active object. Grid of this creature will be loaded and creature set as active
    'Mmap force enable', // creature is forced to use MMaps
    'Mmap force disable', //  creature is forced to NOT use MMaps
    'Walk in water', // creature is forced to walk in water even it can swim
    'Civilian', //  CreatureInfo→civilian substitute (for expansions as Civilian Colum was removed)
    'No melee', //  creature can’t melee
    'Far view', //  creature with far view
    'Force attacking capability', //  SetForceAttackingCapability(true); for nonattackable, nontargetable creatures that should be able to attack nontheless
    'Ignore used position', //  ignore creature when checking used positions around target
    'Count spawns', //  count creature spawns in Map*
    'Haste spell immunity', //
  ]),
  CreatureTypeFlags: bitFlags([
    'Tameable', // Makes the mob tameable (must also be a beast and have family set)
    'Ghost Visible', // Sets Creatures that can ALSO be seen when player is a ghost. Used in CanInteract function by client, can’t be attacked
    'Boss', // Sets “BOSS” flag for tooltips
    '',
    '', // Controls something in client tooltip related to creature faction
    '', // Something related to Sound
    '', // Related to attackable / not attackable creatures with spells
    'Interact Dead', //  has something to do with unit interaction / quest status requests
    'Herb loot', // Makes Mob Corpse Herbable – Uses Skinning Loot Field
    'Mining loot', // Makes Mob Corpse Mineable – Uses Skinning Loot Field
    '', //  no idea, but it used by client
    'Can cast mounted', //  related to possibility to cast spells while mounted
    'Can Assist', // Can aid any player or group in combat. Typically seen for escorting NPC’s
    '', //  checked from calls in Lua PetHasActionBar
    '', //  Lua_UnitGUID, client does guid_low &= 0xFF000000 if this flag is set
    'Engineer loot', // Makes Mob Corpse Engineer Lootable – Uses Skinning Loot Field
  ]),
  UnitClass: {
    1: 'Warrior',
    2: 'Paladin',
    4: 'Rogue',
    8: 'Mage',
  },
}

export const links = {
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
}

export const fields = {
  Family: creature => creature.CreatureType === 1,
}

export const blacklist = new Set([
  'Armor', // unused
  'ExperienceMultiplier', // unused
  'MinLevelHealth', // unused
  'MaxLevelHealth', // unused
  'MinLevelMana', // unused
  'MaxLevelMana', // unused
  'MinMeleeDmg', // unused
  'MaxMeleeDmg', // unused
  'MinRangedDmg', // unused
  'MaxRangedDmg', // unused
  'MeleeAttackPower', // unused
  'RangedAttackPower', // unused
  'RacialLeader',
  'InhabitType',
  'IconName',
  'Expansion',
  'HeroicEntry',
])


const removeItemFromVendorList = (entry, item) => query(`
  DELETE
  FROM tbcmangos.npc_vendor_template
  WHERE entry="${entry}" AND item="${item}"
`)

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

const findNpcItemList = npcEntry => query(`
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
  FROM tbcmangos.npc_vendor as a
  LEFT JOIN tbcmangos.item_template as b
    ON a.item = b.entry
  WHERE a.entry="${npcEntry}"
`)


const addItemToVendorList = params => queryLog(`
  INSERT INTO tbcmangos.npc_vendor_template ${toFields(params)}
  VALUES ${toValues(params)}
`)

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


const mergeResults = queries => Promise.all(queries)
  .then(results => results.flatMap(r => r.rows))

export const fetchItemList = (entry, vendor, vendorList) => mergeResults([
  findNpcItemList(entry),
  findVendorItemList(vendor),
]).then(rows => replaceContent(vendorList, rows.map(item => flex.style({
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


const buildCost = ([type, amount]) => h.span.style(
  { color: color.blizz[type] },
  `${amount}${type.slice(0, 1)} `,
)

const avg = (...args) => Math.round(args
  .map(Number)
  .reduce((t, n) => (n + t) / 2))

export const content = npc => {
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
    const onclick = async () => {
      const { rows: [ item ] } = await getItem(_getVal(itemInput).trim())
      if (!item) {
        itemInput.style.color = red
        return itemInput.focus()
      }

      const { affectedRows } = await addItemToVendorList({ entry: npc.VendorTemplateId, item: item.entry })
        if (affectedRows == 1) {
          fetchItemList(npc.Entry, npc.VendorTemplateId, vendorList)
        }
        _setVal(itemInput, '')
        itemInput.focus()
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

    fetchItemList(npc.Entry, npc.VendorTemplateId, vendorList)
  }

  return [
    inputHeader.style({
      width: '100%',
      backgroundImage: `url('${cdn}/npc/${npc.ModelId1}.png')`,
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
            ? ` (${enums.Rank[npc.Rank]})`
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
