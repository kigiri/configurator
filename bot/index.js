const mysql = require('mysql2/promise')
const Eris = require('eris')
const net = require('net')
const fs = require('fs').promises

const all = async (obj, fn) => Object.fromEntries(
  await Promise.all(Object.entries(obj).map(async ([k,v]) => [k, await fn(v, k, obj)]))
)

const connectCore = async ({ username, password }) => {
  console.log('connecting...')
  const socket = await new Promise((s,f,c) => c=net.connect(3443, err => err ? f(err) : s(c)).on('error', f))
  socket.setEncoding('utf8')
  let q
  const exec = async (command, waitFor='\r\nmangos>') => {
    try { await q } finally {
      return q = new Promise(async (s, f) => {
        let d = ''
        const handler = data => {
          d += data
          if (d.endsWith(waitFor)) {
            socket.removeListener('data', handler)
            socket.removeListener('error', f)
            return s(d.slice(0, -waitFor.length))
          }
        }
        socket.on('data', handler)
        socket.once('error', f)
        command && socket.write(`${command}\r\n`)
      })
    }
  }

  await exec('', 'Username: ')
  await exec(username, 'Password: ')
  if (await exec(password) !== '+Logged in.') {
    throw Error('core: Unable to login')
  }

  return { socket, exec }
}

const connectDiscord = ({ token }) => new Promise((s, f) => {
  const bot = new Eris(token)
  bot.on('ready', () => s(bot))
  bot.on('error', f)
  bot.connect()
})

const queries = {
  tbcAccount: `UPDATE tbcrealmd.account SET expansion=1 WHERE username=?`,
  unban: `DELETE tbcrealmd.account_banned
    FROM tbcrealmd.account_banned
    INNER JOIN tbcrealmd.account ON account_banned.account_id=account.id
    WHERE username=?`,
}

const connectDB = async ({ host, user, password }) => {
  const conn = await mysql.createConnection({ host, user, password })
  return all(queries, async query => {
    const statement = await conn.prepare(query)
    return async (...args) => (await statement.execute(args))[0]
  })
}

const connectStore = async ({ path, key = 'id' }) => {
  const index = value => (values.push(value), store[value[key]] = value)
  const save = value => {
    if (store[value[key]]) throw Error(`key ${value[key]} already taken`)
    index(value)
    return fs.appendFile(path, `${JSON.stringify(value)}\n`)
  }

  const rows = await fs.readFile(path, 'utf8')
    .catch(e => e.code === 'ENOENT' ? '' : Promise.reject(e))

  const values = []
  const store = { _values: values, save }
  for (const row of rows.split('\n')) {
    if (!row) continue
    try { index(JSON.parse(row)) }
    catch (err) { console.log(path, 'invalid JSON row', row) }
  }

  return store
}

// bot commands
const commands = {}
commands.join = {
  args: [ 'username', 'password' ],
  usage: 'If you want to create an account with username **`PATRICK`** and password **`qwerty123`** type `join Patrick qwerty123`',
  handler: async ({ core, players, db }, author, [ username, password ]) => {
    const account = players[author.id]
    if (account) return `You already have an account (\`${account.username}\`) if you lost your password see: ${commands.pass.describe}`
    username = username.toUpperCase()
    if (players._values.find(u => u.username === username)) {
      return `Username \`${username}\` already taken.`
    }

    await players.save({ username, ...author })
    try { return await core.exec(`account create ${username} ${password}`) }
    finally {
      db.tbcAccount(username).catch(console.error)
      console.log(await core.exec(`ban account ${username} -1 steamweedle`))
    }
  },
}

commands.pass = {
  args: [ 'password' ],
  usage: '`pass pouet123` will set your password to **`pouet123`**',
  handler: async ({ core, players }, author, [ password ]) => {
    const account = players[author.id]
    if (!account) return `You need an account first, see:\n${commands.join.describe}`
    return core.exec(`account set password ${account.username} ${password} ${password}`)
  },
}

// Generate commands help
for (const [name, { args, usage }] of Object.entries(commands)) {
  commands[name].describe = [
    `${name} ${args.map(a => `\`${a}\``).join(' ')}`,
    `> example: ${usage}`,
  ].join('\n')
}
commands.help = { args: [], describe: Object.values(commands).map(c => c.describe).join('\n\n') }
commands.help.handler = (_ => () => _)(Promise.resolve(commands.help.describe))

all({
  db: connectDB({ host: 'localhost', user: 'mangos', password: 'mangos' }),
  bot: connectDiscord({ token: process.env.BOT_TOKEN }),
  core: connectCore({ username: 'console', password: process.env.PASSWORD }),
  players: connectStore({ path: '/root/chupato/data/players' }),
}, (v, k) => v.finally(() => console.log(k, 'connected.'))).then(async context => {
  console.log('service online.')
  const { core, players, db, bot } = context
  core.socket.on('end', () => process.exit(1))

  // handle bot welcome message:
  const reply = (msg, text) => bot.createMessage(msg.channel.id, text)
  bot.on('messageCreate', async msg => {
    if (msg.author.bot || msg.channel.type !== 1) return
    const [action, ...args] = msg.content.split(' ').filter(Boolean)
    const author = {
      tag: `${msg.author.username}#${msg.author.discriminator}`,
      id: msg.author.id,
      ...players[msg.author.id],
    }

    const cmd = commands[action ? action.toLowerCase() : '']
    console.log(`[${action}] <@${author.id}> ${author.tag} ${author.username||''}`)
    if (!cmd) return reply(msg, `command ${action} not found\n\n${commands.help.describe}`)
    if (args.length < cmd.args.length) {
      return reply(msg, `command ${action} needs ${cmd.args.length} arguments\n\n${cmd.describe}`)
    }
    reply(msg, await cmd.handler(context, author, args).catch(String))
  })

  const PLAYER_ROLE = '334715090710298624'
  bot.on('guildMemberUpdate', async (guild, member, old) => {
    const wasPlayer = old.roles.includes(PLAYER_ROLE)
    const isPlayer = member.roles.includes(PLAYER_ROLE)
    const player = players[member.id]
    if (isPlayer && !wasPlayer) {
      const channel = await member.user.getDMChannel()
      if (!player) return
      await db.unban(player.username)
      bot.createMessage(channel.id, [
        `Hi ${member.user.username}, Welcome to CHUPATO beta.`,
        `Your account ${player.account} was granted access`,
        'You can now login using a 2.4.3 client and `set realmlist logon.chupato.com`',
      ].join('\n'))
    } else if (!isPlayer && wasPlayer) {
      player && console.log(await core.exec(`ban account ${player.username} -1 steamweedle`))
    }
  })
}).catch(err => {
  console.error(err)
  process.exit(1)
})
