const h = require('izi/h')
const { isNum } = require('izi/is')
const each = require('izi/collection/each')
const store = require('izi/collection/store')
const map = require('izi/collection/map')
const debounce = require('izi/debounce')
const event = require('izi/event')
const bind = require('izi/data-bind')
const persistant = require('izi/persistant')
const observ = require('izi/emiter/observ')
const keyHandler = require('izi/key-handler')

// STATE
const color = {
  background: '#282a36',
  selection: '#44475a',
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
}

const categories = [
  "CONNECTIONS AND DIRECTORIES",
  "PERFORMANCE SETTINGS",
  "SERVER LOGGING",
  "SERVER SETTINGS",
  "PLAYER INTERACTION",
  "CREATURE AND GAMEOBJECT SETTINGS",
  "CHAT SETTINGS",
  "GAME MASTER SETTINGS",
  "VISIBILITY AND RADIUSES",
  "SERVER RATES",
  "BATTLEGROUND CONFIG",
  "ARENA CONFIG",
  "OUTDOOR PVP CONFIG",
  "NETWORK CONFIG",
  "CONSOLE, REMOTE ACCESS AND SOAP",
].reduce((cat, name, i, keys) => {
  cat[name] = {
    name,
    size: 1,
    next: keys[(i + 1) % keys.length],
    prev: keys[(i ? i : keys.length) - 1],
  }
  return cat
}, {})

const input = observ.check('')
const saving = observ({})
const selectedCategory = observ.check(Object.keys(categories)[0])
const selectedOption = observ.if(n => {
  const cat = categories[selectedCategory()]
  if (!Number.isInteger(n)) {
    selectedOption.set(0)
    return false
  }
  if (n < 0) {
    selectedCategory.set(cat.prev)
    selectedOption.set(categories[cat.prev].size - 1)
  } else if (n >= cat.size) {
    selectedCategory.set(cat.next)
    selectedOption.set(0)
  } else { return true }
}, observ.check(0))

selectedCategory(cat =>
  selectedOption.set(Math.min(selectedOption(), categories[cat].size - 1)))

const description = observ({})


// LIB
const wesh = _ => (console.log(_), _)
const toJSON = r => r.ok
  ? r.json()
  : Promise.reject(Object.assign(Error(r.status), r))

const fetchJSON = a => fetch(a).then(toJSON)

const nextCategory = () =>
  selectedCategory.set(categories[selectedCategory()].next)

const prevCategory = () =>
  selectedCategory.set(categories[selectedCategory()].prev)

const nextOption = () =>
  selectedOption.set(selectedOption() + 1)

const prevOption = () =>
  selectedOption.set(selectedOption() - 1)

const getVal = val => isNum(val)
  ? val
  : (val ? JSON.stringify(val) : '""')


// ELEMENTS
const catTitleEl = h.span.style({ color: color.cyan })
const optionTitleEl = h.span.style({ color: color.pink })
const currentValEl = h.span.style()
const defaultValEl = h.span.style({
  marginBottom: '2em',
  display: 'inline-block',
})

const descriptionEl = h.pre.style({
  color: color.foreground,
  whiteSpace: 'pre-wrap',
  cursor: 'default',
})

const inputEl = bind.input(input, h.input.style({
  background: color.background,
  padding: '0.75em',
  borderRadius: '0.2em',
  border: 'none',
  width: '80%',
  margin: '1em 0',
}))

const optionEl = h.style({
  paddingLeft: '1em',
  color: color.foreground,
})

const block = h.style({
  paddingTop: '2em',
  paddingLeft: '2em',
})

const rightBlock = block.style({ background: color.selection, flexGrow: 1 }, [
  catTitleEl,
  ' - ',
  optionTitleEl,
  inputEl,
  h.div.style({ color: color.yellow }, [ '   . current value ', currentValEl ]),
  h.div.style({ color: color.orange }, [ '   . default value ', defaultValEl ]),
  descriptionEl,
])

bind((changes, el) => {
  const c = changes[selectedOption()] ? 'orange' : 'green'
  
  el.style.color = color[c]
  el.style.outlineColor = color[c]
}, saving, inputEl)

bind((content) => {
  h.replaceContent(catTitleEl, content.cat)
  h.replaceContent(optionTitleEl, content.name)
  h.replaceContent(descriptionEl, content.description)
  h.replaceContent(defaultValEl, getVal(content.default))
  h.replaceContent(currentValEl, getVal(content.value))
}, description, rightBlock)

const option = (content, name, index, cat) => {
  Object.assign(content, { name, index, cat })

  input(val => {
    if (cat !== selectedCategory()) return
    if (selectedOption() !== index) return
    val = isNum(content.default)
      ? (Number(val) || 0)
      : (val && String(val))
    if (val !== content.value) {
      description.set(content)
      saving.set(Object.assign(saving(), { [index]: [name, val] }))
    } else {
      saving.set(Object.assign(saving(), { [index]: false }))
    }
  })

  const el = optionEl({ onclick: () => selectedOption.set(index) }, name)

  bind(changes => el.style.color = changes[index]
    ? color.orange
    : color.foreground, saving, el)

  bind(selected => {
    if (cat !== selectedCategory()) return
    if (selected === index) {
      el.style.background = color.selection
      el.scrollIntoViewIfNeeded()
      description.set(content)
      const changes = saving()[index]
      input.set(String(changes ? changes[1] : content.value))
    } else {
      el.style.background = ''
    }
  }, selectedOption, el)

  return el
}

const catEl = h.style({ cursor: 'default' })

const category = (content, name) => {
  const htmlContent = Object.keys(content)
    .map((key, index) => option(content[key], key, index, name))

  const wrapper = h.div(htmlContent)
  return bind((selected, el) => {
    if (selected === name) {
      el.style.color = color.cyan
      h.appendChild(wrapper, htmlContent)
    } else {
      el.style.color = color.comment
      h.empty(wrapper)
    }
  },
    selectedCategory, catEl({ onclick: () => selectedCategory.set(name) }, [
    name,
    wrapper,
  ]))
}


// INPUTS
event.lbtn(() => inputEl.focus())
setTimeout(() => inputEl.focus(), 200)
window.onkeydown = keyHandler({
  up: prevOption,
  down: nextOption,
})

const b64 = s => encodeURIComponent(btoa(s))
// APP
Promise.all([ '/config-comments.json', '/config.json', '/original.json' ]
    .map(fetchJSON))
  .then(([ comments, config, defs ]) => map((list, group) => 
    store((s, keys, description) => keys.split(',').forEach(key => s[key] = {
      description,
      value: config[key],
      default: defs[key],
    }), list), comments))
  .then(r => {
    // load and init config state
    const opts = Object.create(null)
    Object.keys(r)
      .forEach(group => {
        const optsKeys = Object.keys(r[group])
        categories[group].size = optsKeys.length
        optsKeys.forEach(k => opts[k] = r[group][k])
      })

    // auto save
    saving(debounce(changes => Promise.all(Object.keys(changes)
      .filter(i => changes[i])
      .map(i => {
        const [ k, v ] = changes[i]
        console.log({ k, v })
        return fetchJSON(`/0/${b64(k)}/${b64(v)}`)
          .then(() => {
            opts[k].value = v
            saving.set(Object.assign(saving(), { [i]: false }))
            console.log(opts[k])
            description.set(opts[k])
          })
      })).catch(console.error), 1000))

    persistant(input, 'input')
    persistant(selectedCategory, 'selCat')
    persistant(selectedOption, 'selOpt', Number)
    persistant(saving, 'saving', JSON.parse, JSON.stringify)

    h.appendChild(document.body, h.div.style({
      display: 'flex',
      height: '100%',
    }, [
      block.style({
        minWidth: '460px',
        height: '100%',
        overflow: 'auto',
      }, map.toArr(category, r)),
      rightBlock,
    ]))
  })
  .then(console.log)
