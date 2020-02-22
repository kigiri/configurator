const mysql = require('mysql')
const got = require('got')

const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'mangos',
  //database : 'tbcmangos',
})

const parallelize = (work, size) => {
  const worker = () => work.length && work.pop()().then(worker)
  return Promise.all(Array(size).fill().map(() => worker()))
}

const query = query => new Promise((s,f) => db.query(
  query,
  (e, rows, fields) => e ? f(e) : s({ rows, fields }),
))

const setIcon = (entry, icon) =>
  query(`UPDATE tbcmangosclean.item_template SET icon="${icon}" WHERE entry="${entry}"`)

const getDistIcon = async entry => {
  const res = await got(`https://tbc-twinhead.twinstar.cz/?item=${entry}`)
  return res.body.split(/Icon\.create\('([^']+)/)[1]
}

const main = async items => {
  console.log('connecting to db...')
  await new Promise((s,f) => db.connect(err => err ? f(err) : s()))

  console.log('ensure db column...')
  await query(`ALTER TABLE tbcmangosclean.item_template ADD COLUMN icon VARCHAR(255)`)
    .catch(err => err.code === 'ER_DUP_FIELDNAME' || Promise.reject(err))

  console.log('fixing missing icons...')
  const { rows } = await query('select entry, icon from tbcmangos.item_template')

  for (const {entry, icon} of rows) {
    await setIcon(entry, icon)
    console.log(entry, icon, 'done')
  }
/*
  console.log(rows.length, 'items with missing icons')
  await parallelize(rows.map(({ entry }) => async () => {
    console.log('fetching', entry)
    const icon = await getDistIcon(entry)
    if (icon === 'inv_misc_questionmark') return
    icon && console.log('found', entry,)
    await setIcon(entry, icon || 'inv_misc_questionmark')
  }), 8) // keep 8 query open at a time, adjust as you like for speed and not ddos'n twinstar. 
*/
  console.log('done !')
  connection.end()
}

main().then(console.error)
