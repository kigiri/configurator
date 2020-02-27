export const ID = Symbol('id')
export const ON = Symbol('on')
export const SUB = Symbol('sub')
export const SRC = Symbol('src')
export const GET = Symbol('get')
export const SET = Symbol('set')
export const PATH = Symbol('path')
export const PROTO = Symbol('proto')
export const CLEAR = Symbol('clear')
export const EVENTS = Symbol('events')
const subscribers = new Set()
const readers = new Set()
const values = Object.create(null)
const onDismount = new Map()
let refs = new Set()
const contains = (a, b) => {
  for (const elem of a) {
    if (b.has(elem)) return true
  }
  return false
}
const loop = () => {
  refs = new Set()
  for (const [elem, handler] of onDismount) {
    if (document.body.contains(elem)) continue
    handler(elem)
    onDismount.delete(elem)
  }
  for (const reader of readers) {
    try {
      reader(refs)
    } catch (err) {
      err.reader = reader
      console.error(err)
    }
  }

  for (const sub of subscribers) {
    if (sub.ref) {
      refs.has(sub.ref) && sub(values[sub.ref])
    } else if (sub.refs) {
      contains(sub.refs, refs) && sub()
    }
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

export const isObject = value => value && value.constructor === Object
export const toId = key =>
  /^[$A-Za-z_][0-9A-Za-z_$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`

const nodeGetters = n => {
  switch (n.type) {
    case 'number':
    case 'range': return () => Number(n.value)
    case 'radio':
    case 'checkbox': return () => n.checked
    default: return () => n.value
  }
}

const nodeSetters = n => {
  const k = (n.type === 'radio' || n.type === 'checkbox') ? 'checked' : 'value'
  return v => n[k] = v
}

const toSetBody = (_, i, paths) =>
  `r.add(${JSON.stringify(paths.slice(0, i + 1).join(''))})`

const buildWatchProps = (acc, [k, v]) => {
  const ref = v[PATH]
  if (ref) {
    Object.defineProperty(acc, k, {
      get() {
        this[PATH].add(ref)
        return values[ref]
      }
    })
  } else {
    acc[k] = buildWatchProto(v)
  }
  return acc
}

const clearers = {
  subscriber:{ clear() { subscribers.delete(this) }, handlers: subscribers },
  reader: { clear() { readers.delete(this) }, handlers: readers },
  event: { clear() { for (const e of this[EVENTS]) { this[SRC].removeEventListener(e, this) } } },
}

const addHandler = (subRefs, { clear, handlers }, handler) => {
  handler[CLEAR] = clear
  subRefs.add(handler)
  handlers && handlers.add(handler)
  return handler
}

export const rand = () => `_${Math.random().toString(36).slice(2).padStart('0', 11)}`
const buildWatchProto = obj => Object.entries(obj).reduce(buildWatchProps, {})
export const init = data => {
  const id = rand()
  const subRefs = new Set()
  const statePath = []
  const state = { [id]: data }
  const build = (value, paths) => {
    const path = paths.join('')
    if (isObject(value)) {
      const keys = Object.keys(value)
      const v = Object.fromEntries(keys
        .map(k => [ k, build(value[k], [...paths, toId(k)]) ]))
      const refs = new Set(keys.map(k => v[k][PATH]))
      const get = new Function(['s'], `return ${path}`)
      const set = new Function(['SET', 's', 'v'], `${keys
        .filter(k => v[k][SET])
        .map(toId)
        .map(id => `s${id}[SET](v${id})`).join(';')};return s`)
      v[PATH] = path
      v[GET] = () => get(state)
      v[SET] = newValue => set(SET, v, newValue)
      v[SUB] = sub => {
        const subber = () => sub(get(state))
        subber.refs = refs
        return addHandler(subRefs, clearers.subscriber, subber)
      }
      return v
    }
    const set = new Function(['s', 'v'], `return ${path}=v`)
    const v = { [PATH]: path, [GET]: () => values[path] }
    statePath.push(path)
    if (value instanceof Node) {
      v[SET] = nodeSetters(value)
      values[path] = nodeGetters(value)
    }

    const refresh = new Function(['r'], `${paths.map(toSetBody).join(';\n')}`)
    if (typeof value === 'function') {
      const reader = value
      set(state, values[path] = reader())
      addHandler(subRefs, clearers.reader, refs => {
        const next = reader()
        if (next === values[path]) return
        values[path] = next
        set(state, next)
        refresh(refs)
      })
    } else {
      values[path] = value
      v[SET] = newValue => set(state, newValue)
      const reader = new Function(['s'], `return ${path}`)
      addHandler(subRefs, clearers.reader, refs => {
        const next = reader(state)
        if (next === values[path]) return
        values[path] = next
        refresh(refs)
      })
    }

    v[SUB] = sub => {
      sub(values[path])
      sub.ref = path
      return addHandler(subRefs, clearers.subscriber, sub)
    }

    return v
  }

  const base = build(state, ['s'])[id]
  const proto = buildWatchProto(base)
  base[PROTO] = proto
  base[ID] = id
  base[CLEAR] = () => {
    for (const fn of subRefs) fn[CLEAR]()
    for (const key of statePath) values[key] = undefined
  }
  base[ON] = ({ src = window, events, handler }, ...args) => {
    handler[SRC] = src
    handler[EVENTS] = events
    for (const event of events) src.addEventListener(event, handler, ...args)
    return addHandler(subRefs, clearers.event, handler)
  }

  return base
}

export const attach = (state, attrs) => ({
  id: state[ID],
  ...attrs,
  ondismount: typeof attrs.ondismount !== 'function' ? state[CLEAR] : () => {
    state[CLEAR]()
    attrs.ondismount()
  },
})

export const append = (elem, value) => {
  if (value == undefined) return elem
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'function':
    case 'boolean': {
      elem.appendChild(document.createTextNode(value))
      return elem
    }
    case 'symbol': return append(elem, `Symbol(${value.description})`)
    case 'object': {
      if (value[PATH] !== undefined) {
        const node = document.createTextNode('')
        let unsub
        const reader = () => {
          if (document.body.contains(elem)) {
            unsub || (unsub = value[SUB](v => node.nodeValue = v))
          } else if (unsub) {
            unsub()
            unsub = undefined
            readers.delete(reader)
          }
        }
        readers.add(reader)
        // TODO: remove when the element is dismounted.
        elem.appendChild(node)
        return elem
      }

      if (value instanceof Node) {
        elem.appendChild(value)
        return elem
      }

      if (Array.isArray(value)) {
        for (const v of value) {
          append(elem, v)
        }
        return elem
      }
    }
    console.warn('Unexpected children value type', value, elem)
    return elem
  }
}


const setAttribute = (src, key, value) => {
  switch (key) { case 'class': case 'href': return src.setAttribute(key, value) }
  return src[key] = value
}
const mergeAttr = (src, key, value) => (value && value[PATH] !== undefined)
  ? value[SUB](v => setAttribute(src, key, v))
  : setAttribute(src, key, value)

const createElement = ns => tag => (a, b) => {
  const elem = document.createElementNS(ns, tag)
  if (a == null) return elem
  if (!isObject(a) || a[PATH] !== undefined) return append(elem, a)
  for (const key of Object.keys(a)) {
    const value = a[key]
    if (value == null) continue
    if (key === 'ondismount') {
      if (typeof value !== 'function') continue
      onDismount.set(elem, value)
      continue
    }
    if (isObject(value) && value[PATH] === undefined) {
      for (const k of Object.keys(value)) {
        mergeValue(elem[key], k, value[k])
      }
    } else {
      mergeAttr(elem, key, value)
    }
  }
  return append(elem, b)
}

const h = ns => new Proxy({}, { get: (s, tag) => s[tag] || (s[tag] = createElement(tag, ns)) })
export const html = h('http://www.w3.org/1999/xhtml')
export const svg = h('http://www.w3.org/2000/svg')
export const css = style => append(document.head, html.style(style))

export const watch = object => Object.fromEntries(Object.keys(object)
  .filter(k => typeof object[k] !== 'function')
  .map(k => [ k, isObject(object[k]) ? watch(object[k]) : () => object[k]]))

export const empty = elem => {
  while (elem && elem.firstChild) {
    elem.removeChild(elem.firstChild)
  }
  return elem
}

const save = (k, v) => localStorage[k] = JSON.stringify(v)
export const persist = (value, { elem, debounce = 200 } = {}) => {
  const key = value[PATH]
  const cached = localStorage[key]
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      elem && (elem.value = parsed)
      value[SET] && value[SET](parsed)
    }
    catch (err) { localStorage[key] = JSON.stringify(value[GET]()) }
  } else {
    localStorage[key] = JSON.stringify(value[GET]())
  }

  let t
  return value[SUB](v => {
    clearTimeout(t)
    t = setTimeout(save, debounce, key, v)
  })
}

export const replace = (elem, content) => append(empty(elem), content)
export const setText = (elem, text) => elem.firstChild.nodeValue = text || ''
export const map = (value, mapper) => {
  let v = mapper(value[GET]())
  const subscribers = new Set()
  value[SUB](_v => {
    const newV = mapper(_v)
    if (newV === v) return 
    v = newV
    for (const sub of subscribers) {
      try { sub(v) } catch (e) { console.error(e) }
    }
  })

  return {
    [PATH]: value[PATH],
    [GET]: () => v,
    [SUB]: sub => {
      sub(v)
      subscribers.add(sub)
      return () => subscribers.delete(sub)
    },
  }
}

export const derive = (state, target, source, mapper) => {
  const mapped = state[target] = map(state[source], mapper)
  const ref = mapped[PATH]

  Object.defineProperty(state[PROTO], target, {
    get() {
      this[PATH].add(ref)
      return mapped[GET]()
    }
  })

  return mapped
}


export const on = (state, opts, ...args) => state[ON](opts, ...args)
export const get = value => value[GET]()
export const sub = (value, fn) => value[SUB](fn)
export const set = (value, newValue) => value[SET](newValue)
