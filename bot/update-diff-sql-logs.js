const mysql = require('mysql2/promise')
const fs = require('fs').promises

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'mangos',
  password: 'mangos',
})

const quote = value => typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
const query = async (sql, ...args) => args.length 
  ? (await (await connection).execute(sql, args))[0]
  : (await (await connection).query(sql))[0]

const eq = (a, b) => typeof a === 'number'
  ? Math.abs(a - b) < 0.01
  : a === b

const seen = new Set()
const getUpdates = async (table, { key, join, blackList = new Set(), page = 0 } = {}) => {
  if (!page) {
    join && blackList.add('name')
    await fs.unlink(`/root/chupato/logs/${table}.sql`)
      .catch(e => e.code === 'ENOENT' || Promise.reject(e))
    if (Array.isArray(key)) return getDiff(table, key)
    await getDiff(table, [key])
  }
  const limit = page + 200
  const q = join
    ? `select ${table}.*, name from tbcmangos.${table} INNER JOIN tbcmangos.${table}_template ON ${table}.id=${table}_template.entry order by ${key} ASC limit ${page}, ${limit}`
    : `select * from tbcmangos.${table} order by ${key} ASC limit ${page}, ${limit}`
  const rows = await query(q)
  const compare = await Promise.all(rows.map(async a => {
    const id = `${table}${a[key]}`
    if (seen.has(id)) return
    seen.add(id)
    const [b] = await query(`select * from tbcmangosclean.${table} where ${key}=? limit 1`, a[key])
    if (!b) return
    const changes = Object.entries(a)
      .filter(([k, v]) => !blackList.has(k) && !eq(b[k], v))
      .map(([k, v]) => `${k}=${quote(v)}`)
      .join(', ')

    if (!changes.length) return
    return `-- [${a[key]}] ${a.name||a.Name||''}\nUPDATE tbcmangos.${table} SET ${changes} WHERE ${key}=${a[key]};`
  }))

  const update = compare.filter(Boolean)
  update.length && (await fs.appendFile(`/root/chupato/logs/${table}.sql`, `\n${update.join('\n')}`))
  console.log(table, 'from page', page, 'to', limit, 'found', update.length, 'changes')
  if (rows.length >= 199) return getUpdates(table, { key, join, blackList, page: limit })
  console.log(table, 'done')
}

const getDiff = async (table, keys) => {
  // inserts
  const condition = `
    ON ${keys.map(k => `a.${k} = b.${k}`).join(' AND ')}
    WHERE b.${keys[0]} IS NULL`

  const inserts = (await query(`
    SELECT a.*
    FROM tbcmangos.${table} a
    LEFT OUTER JOIN tbcmangosclean.${table} b ${condition}
  `))
    .map(v => `INSERT INTO tbcmangos.${table} VALUES (${Object.values(v).map(quote).join(', ')});`)

  console.log(table, inserts.length, 'inserts')

  // deletes
  const deletes = (await query(`
    SELECT ${keys.map(k => `a.${k}`).join(', ')}
    FROM tbcmangosclean.${table} a
    LEFT OUTER JOIN tbcmangos.${table} b ${condition}
  `))
    .map(v => `DELETE FROM tbcmangos.${table} WHERE ${keys.map(k => `${k}=${quote(v[k])}`).join(' AND ')};`)

  console.log(table, deletes.length, 'deletes')

  const content = `${inserts.join('\n')}\n${deletes.join('\n')}`.trim()
  content.length && (await fs.writeFile(`/root/chupato/logs/${table}.sql`, content))
}

Promise.all(Object.entries({
  creature_ai_scripts: { key: 'id' },
  conditions: { key: 'condition_entry' },
  creature: { key: 'guid', blackList: new Set([ 'modelid' ]), join: true },
  creature_template: { key: 'Entry', blackList: new Set([ 'MinLevel', 'MaxLevel' ]) },
  gameobject: { key: 'guid', blackList: new Set(['id']), join: true },
  item_template: { key: 'entry', blackList: new Set([ 'RequiredDisenchantSkill', 'DisenchantID' ]) },
  npc_trainer: { key: ['entry', 'spell'] },
  npc_trainer_template: { key: ['entry', 'spell'] },
  npc_vendor: { key: ['entry', 'item'] },
  npc_vendor_template: { key: ['entry', 'item'] },
  player_xp_for_level: { key: 'lvl' },
  quest_template: { key: 'entry' },
}).map(args => getUpdates(...args)))
  .then(console.log, console.error)
