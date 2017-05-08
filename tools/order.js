const fs = require('fs')
const pouet = fs.readFileSync('./etc/mangosd.conf.dist', 'utf8')
const comments = require('./config-comments.json')
const okList = new Set(Object.keys(comments)
  .map(c => Object.keys(comments[c])
    .map(v => comments[c][v]).join()).join().split(','))

const result = {}
const has = [
  "RealmID",
  "DataDir",
  "LogsDir",
  "CharacterDatabaseInfo",
  "LoginDatabaseConnections",
  "WorldDatabaseConnections",
  "CharacterDatabaseConnections",
  "MaxPingTime",
  "WorldServerPort",
  "BindIP",
  "SD2ErrorLogFile",
  "UseProcessors",
  "ProcessPriority",
  "Compression",
  "PlayerLimit",
  "SaveRespawnTimeImmediately",
  "MaxOverspeedPings",
  "GridUnload",
  "LoadAllGridsOnMaps",
  "GridCleanUpDelay",
  "MapUpdateInterval",
  "ChangeWeatherInterval",
  "PlayerSave.Interval",
  "PlayerSave.Stats.MinLevel",
  "PlayerSave.Stats.SaveOnlyOnLogout",
  "vmap.enableLOS",
  "vmap.enableHeight",
  "vmap.ignoreSpellIds",
  "vmap.enableIndoorCheck",
  "DetectPosCollision",
  "TargetPosRecalculateRange",
  "mmap.enabled",
  "mmap.ignoreMapIds",
  "PathFinder.OptimizePath",
  "PathFinder.NormalizeZ",
  "UpdateUptimeInterval",
  "MaxCoreStuckTime",
  "AddonChannel",
  "CleanCharacterDB",
  "MaxWhoListReturns",
  "LogSQL",
  "PidFile",
  "LogLevel",
  "LogTime",
  "LogFile",
  "LogTimestamp",
  "LogFileLevel",
  "WorldLogFile",
  "WorldLogTimestamp",
  "DBErrorLogFile",
  "EventAIErrorLogFile",
  "CharLogFile",
  "CharLogTimestamp",
  "CharLogDump",
  "GmLogFile",
  "GmLogTimestamp",
  "GmLogPerAccount",
  "RaLogFile",
  "LogColors",
  "GameType",
  "RealmZone",
  "Expansion",
  "DBC.Locale",
  "DeclinedNames",
  "StrictPlayerNames",
  "StrictCharterNames",
  "StrictPetNames",
  "MinPlayerName",
  "MinCharterName",
  "MinPetName",
  "CharactersCreatingDisabled",
  "CharactersPerAccount",
  "CharactersPerRealm",
  "SkipCinematics",
  "MaxPlayerLevel",
  "StartPlayerLevel",
  "StartPlayerMoney",
  "MaxHonorPoints",
  "StartHonorPoints",
  "MaxArenaPoints",
  "StartArenaPoints",
  "InstantLogout",
  "DisableWaterBreath",
  "AllFlightPaths",
  "AlwaysMaxSkillForLevel",
  "ActivateWeather",
  "CastUnstuck",
  "MaxSpellCastsInChain",
  "RabbitDay",
  "Instance.IgnoreLevel",
  "Instance.IgnoreRaid",
  "Instance.ResetTimeHour",
  "Instance.UnloadDelay",
  "Quests.LowLevelHideDiff",
  "Quests.HighLevelHideDiff",
  "Quests.Daily.ResetHour",
  "Quests.IgnoreRaid",
  "Group.OfflineLeaderDelay",
  "Guild.EventLogRecordsCount",
  "Guild.BankEventLogRecordsCount",
  "TimerBar.Fatigue.GMLevel",
  "TimerBar.Fatigue.Max",
  "TimerBar.Breath.GMLevel",
  "TimerBar.Breath.Max",
  "TimerBar.Fire.GMLevel",
  "TimerBar.Fire.Max",
  "MaxPrimaryTradeSkill",
  "TradeSkill.GMIgnore.MaxPrimarySkillsCount",
  "TradeSkill.GMIgnore.Level",
  "TradeSkill.GMIgnore.Skill",
  "MinPetitionSigns",
  "MaxGroupXPDistance",
  "MailDeliveryDelay",
  "MassMailer.SendPerTick",
  "SkillChance.Prospecting",
  "OffhandCheckAtTalentsReset",
  "PetUnsummonAtMount",
  "Event.Announce",
  "BeepAtStart",
  "ShowProgressBars",
  "WaitAtStartupError",
  "Motd",
  "PlayerCommands",
  "AllowTwoSide.Accounts",
  "AllowTwoSide.Interaction.Chat",
  "AllowTwoSide.Interaction.Channel",
  "AllowTwoSide.Interaction.Group",
  "AllowTwoSide.Interaction.Guild",
  "AllowTwoSide.Interaction.Auction",
  "AllowTwoSide.Interaction.Mail",
  "AllowTwoSide.WhoList",
  "AllowTwoSide.AddFriend",
  "TalentsInspecting",
  "ThreatRadius",
  "Rate.Creature.Aggro",
  "CreatureRespawnAggroDelay",
  "CreatureFamilyFleeAssistanceRadius",
  "CreatureFamilyAssistanceRadius",
  "CreatureFamilyAssistanceDelay",
  "CreatureFamilyFleeDelay",
  "WorldBossLevelDiff",
  "Corpse.EmptyLootShow",
  "Corpse.Decay.NORMAL",
  "Corpse.Decay.RARE",
  "Corpse.Decay.ELITE",
  "Corpse.Decay.RAREELITE",
  "Corpse.Decay.WORLDBOSS",
  "Rate.Corpse.Decay.Looted",
  "Rate.Creature.Normal.Damage",
  "Rate.Creature.Elite.Elite.Damage",
  "Rate.Creature.Elite.RAREELITE.Damage",
  "Rate.Creature.Elite.WORLDBOSS.Damage",
  "Rate.Creature.Elite.RARE.Damage",
  "Rate.Creature.Normal.SpellDamage",
  "Rate.Creature.Elite.Elite.SpellDamage",
  "Rate.Creature.Elite.RAREELITE.SpellDamage",
  "Rate.Creature.Elite.WORLDBOSS.SpellDamage",
  "Rate.Creature.Elite.RARE.SpellDamage",
  "Rate.Creature.Normal.HP",
  "Rate.Creature.Elite.Elite.HP",
  "Rate.Creature.Elite.RAREELITE.HP",
  "Rate.Creature.Elite.WORLDBOSS.HP",
  "Rate.Creature.Elite.RARE.HP",
  "ListenRange.Say",
  "ListenRange.TextEmote",
  "ListenRange.Yell",
  "GuidReserveSize.Creature",
  "GuidReserveSize.GameObject",
  "ChatFakeMessagePreventing",
  "ChatStrictLinkChecking.Severity",
  "ChatStrictLinkChecking.Kick",
  "ChatFlood.MessageCount",
  "ChatFlood.MessageDelay",
  "ChatFlood.MuteTime",
  "Channel.RestrictedLfg",
  "Channel.SilentlyGMJoin",
  "Visibility.GroupMode",
  "Visibility.Distance.Grey.Object",
  "Visibility.AIRelocationNotifyDelay",
  "Rate.Health",
  "Rate.Mana",
  "Rate.Rage.Income",
  "Rate.Rage.Loss",
  "Rate.Focus",
  "Rate.Loyalty",
  "Rate.Energy",
  "Rate.Skill.Discovery",
  "Rate.Drop.Item.Poor",
  "Rate.Drop.Item.Normal",
  "Rate.Drop.Item.Uncommon",
  "Rate.Drop.Item.Rare",
  "Rate.Drop.Item.Epic",
  "Rate.Drop.Item.Legendary",
  "Rate.Drop.Item.Artifact",
  "Rate.Drop.Item.Referenced",
  "Rate.Drop.Item.Quest",
  "Rate.Drop.Money",
  "Rate.Pet.XP.Kill",
  "Rate.XP.Explore",
  "Rate.Rest.InGame",
  "Rate.Rest.Offline.InTavernOrCity",
  "Rate.Rest.Offline.InWilderness",
  "Rate.Damage.Fall",
  "Rate.Auction.Time",
  "Rate.Auction.Deposit",
  "Rate.Auction.Cut",
  "Auction.Deposit.Min",
  "Rate.Honor",
  "Rate.Mining.Amount",
  "Rate.Talent",
  "Rate.Reputation.Gain",
  "Rate.InstanceResetTime",
  "SkillGain.Crafting",
  "SkillGain.Defense",
  "SkillGain.Gathering",
  "SkillGain.Weapon",
  "SkillChance.Orange",
  "SkillChance.Yellow",
  "SkillChance.SkinningSteps",
  "SkillFail.Loot.Fishing",
  "SkillFail.Gain.Fishing",
  "SkillFail.Possible.FishingPool",
  "DurabilityLossChance.Damage",
  "DurabilityLossChance.Absorb",
  "Death.SicknessLevel",
  "Death.CorpseReclaimDelay.PvP",
  "Death.CorpseReclaimDelay.PvE",
  "Death.Bones.World",
  "Death.Bones.BattlegroundOrArena",
  "Death.Ghost.RunSpeed.World",
  "Death.Ghost.RunSpeed.Battleground",
  "Battleground.CastDeserter",
  "Battleground.QueueAnnouncer.Join",
  "Battleground.QueueAnnouncer.Start",
  "Battleground.ScoreStatistics",
  "Battleground.InvitationType",
  "BattleGround.PrematureFinishTimer",
  "BattleGround.PremadeGroupWaitForMatch",
  "Arena.MaxRatingDifference",
  "Arena.RatingDiscardTimer",
  "Arena.AutoDistributePoints",
  "Arena.AutoDistributeInterval",
  "Arena.QueueAnnouncer.Join",
  "Arena.QueueAnnouncer.Exit",
  "Arena.ArenaSeason.ID",
  "Arena.ArenaSeasonPrevious.ID",
  "Arena.StartRating",
  "Arena.StartPersonalRating",
  "OutdoorPvp.SIEnabled",
  "OutdoorPvp.EPEnabled",
  "OutdoorPvp.HPEnabled",
  "OutdoorPvp.ZMEnabled",
  "OutdoorPvp.TFEnabled",
  "OutdoorPvp.NAEnabled",
  "Network.Threads",
  "Network.OutKBuff",
  "Network.OutUBuff",
  "Network.TcpNodelay",
  "Network.KickOnBadPacket",
  "Console.Enable",
  "Ra.Enable",
  "Ra.IP",
  "Ra.Port",
  "Ra.MinLevel",
  "Ra.Secure",
  "Ra.Stricted",
  "SOAP.Enabled",
  "SOAP.IP",
  "SOAP.Port",
  "CharDelete.Method",
  "CharDelete.MinLevel",
  "CharDelete.KeepDays",
].filter(s => !okList.has(s))
  .map(s => str => str.indexOf(s) === 0 && s)
  .reduce((a, b) => str => a(str) || b(str))

pouet
  .split('\n')
  .reverse()
  .reduce((acc, l) => {
    if (/^# [A-Z ]+$/.test(l)) {
      const val = acc.join()
      val && (comments[l.slice(2)][''] = val)
      return []
    }
    const key = has(l)
    key && acc.push(key)
    return acc
  }, [])



console.log(JSON.stringify(comments, null, 2))

