import { readFileStr, ensureFile, writeFileStr } from 'https://deno.land/std@v0.33.0/fs/mod.ts'
import { green, bold } from 'https://deno.land/std@v0.33.0/fmt/colors.ts'
import { join } from 'https://deno.land/std@v0.33.0/path/mod.ts'

import { slugify } from './slugify.js'
import { GET, json, serveFile, vars, boom } from './lib.js'

// ENV
const SUFFIX = vars('.conf.dist', 'suffix', 's')
const CONFIG_DIR = vars('.', 'dir', 'd')

// TOOLS
const all = (arr, fn) => Promise.all(arr.map(x => fn(x)))

// PARSE CONFIG FILE
const getType = l => {
  if (l[0] !== '#' && l[0] !== '[') return 'property'
  if (/# \S/.test(l)) return 'category'
  if (/# {4}\S/.test(l)) return 'description-key'
  if (/# {5,}\S/.test(l)) return 'description-message'
  return ''
}

const parseConfig = data => data
  .split('\n')
  .map(l => l.trim())
  .map(l => [ getType(l), l ])
  .filter(([type, l]) => type && l)
  .reduce(({ prevType, conf, cat, desc }, [type, l]) => {

    if (type !== 'description-message' && prevType === 'description-message') {
      cat.descriptions.push(desc)
      desc = {}
    }

    if (type === 'property') {
      const [ k, v ] = l.split('=').map(s => s.trim())
      conf[k] = { key: k, value: v, cat: cat.title }
      const match = cat.descriptions.find(d => d.key === k.toLowerCase())
      match && (conf[k].description = match.msg)
    } else if (type === 'category') {
      cat = { title: l.slice(1).split(/ +#$/)[0].trim(), descriptions: [] }
    } else if (type === 'description-key') {
      desc.key = l.slice(5).split(' ')[0].toLowerCase()
    } else if (type === 'description-message') {
      desc.msg = desc.msg ? `${desc.msg}\n${l.slice(9)}` : l.slice(9)
    }

    return { prevType: type, conf, cat, desc }
  }, { conf: {}, cat: { descriptions: [] }, desc: {} })
  .conf

const saveConfig = async (file, config) => {
  const data = Object.entries(config).map(([k, v]) => `${k} = ${v.value}`).join('\n')
  await writeFileStr(file, data)
}

// SERVER
// scan directory to find config files
const allFiles = (await Deno.readDir(CONFIG_DIR))
  .filter(info => info.isFile() && info.name.endsWith(SUFFIX))
  .map(info => [info.name.slice(0, -5), info.name])

// ensure file exist, or generate them
await all(allFiles, async ([file, fileSource]) => {
  try {
    const stat = await Deno.lstat(file)
    if (!stat.isFile()) throw Error(`Ensure path exists, expected 'file'`)
  } catch (err) {
    if (err instanceof Deno.DenoError && err.kind === Deno.ErrorKind.NotFound) {
      await saveConfig(file, parseConfig(await readFileStr(fileSource)))
      console.log(file, 'generated.')
    } else throw err
  }
})

// read & parse configs
const getConfigs = async files => {
  const [conf, defaultConf] = (await all(files, readFileStr)).map(parseConfig)
  const mergedProps = Object.values(defaultConf)
    .map(prop => ({ ...prop, value: conf?.[prop.key]?.value ?? '', source: prop.value ?? '' }))

  const groupedByCategory = {}
  for (const prop of mergedProps) {
    (groupedByCategory[prop.cat] || (groupedByCategory[prop.cat] = [])).push(prop)
  }

  const [[title, [version]], ...categories] = Object.entries(groupedByCategory)

  return { title, version, categories }
}

// read a config and ensure specific key existance
const getConfig = async (i, key) => {
  if (!allFiles[i]) boom.NotFound(Error(`no config at index ${i}`))
  const file = allFiles[i][0]
  const config = parseConfig(await readFileStr(file))
  if (!config[key]) boom.NotFound(Error(`${key} not found in ${file}`))
  return { file, config }
}

GET('/config/all', async () => json(await all(allFiles, getConfigs)))
GET('/config/get', async ({ i, key }) => (await getConfig(i, key)).value)
GET('/config/set', async ({ i, key, value }) => {
  const { config, file } = await getConfig(i, key)
  await saveConfig(file, { ...config, [key]: { value } })
  return 'OK'
})

await serveFile('../config.html')

/* todo:
 *   client: display form states with css (saving / failed / etc...)
 *   config: env var & argv
 *   server: log & fail if no files found
 *   client: auto-update anchor in url
 *
 */
