// TOOLS
export const isNum = x => typeof x === 'number'
export const isStr = x => typeof x === 'string'
export const isFn = x => typeof x === 'function'
export const isElement = x => x instanceof Element
export const isChildren = x => isStr(x) || Array.isArray(x) || isElement(x)

export const empty = el => {
  if (!el) return
  while (el.lastChild && el.lastChild !== el) {
    el.removeChild(el.lastChild)
  }
}

export const appendChild = (elem, child) => {
  if (child === undefined) return
  if (child instanceof Element) return elem.appendChild(child)
  if (Array.isArray(child)) return child.forEach(c => appendChild(elem, c))
  return elem.appendChild(document.createTextNode(String(child)))
}

export const replaceContent = (el, content) => {
  empty(el)
  appendChild(el, content)
}

const setAttr = (elem, val, key) => elem.setAttribute(key, val)
const assignAttr = (elem, val, key) => elem[key] = val
const deepAssignAttr = (elem, val, key) => Object.assign(elem[key], val)
const getHandler = key => {
  switch (key) {
    case 'dataset':
    case 'style': return deepAssignAttr
    default: {
      if (key.indexOf('-') !== -1) return setAttr
      return assignAttr
    }    
  }
}

const createElement = (args, props, child) => {
  if (isChildren(props)) {
    child = props
    props = undefined
  }

  const elem = document.createElement(args.tag)
  if (props || args.props) {
    const mergeProps = ([k, v]) => v !== undefined && getHandler(k)(elem, v, k)
    args.props && Object.entries(args.props).forEach(mergeProps)
    props && Object.entries(props).forEach(mergeProps)
  }

  appendChild(elem, child)
  return elem
}

const prepareArgs = (tag, props) => {
  if (isStr(tag)) {
    props || (props = {})
    tag = tag.toLowerCase()
  } else {
    props = tag
    tag = 'div'
  }
  Object.keys(props).length || (props = undefined)
  return { tag, props }
}

const prepareStyleArgs = (tag, style) => isStr(tag)
  ? prepareArgs(tag, { style: style.style || style })
  : prepareArgs('div', { style: tag.style || tag })

const extend = (args, props) =>
  preparedH(mergePropsDefault(args, args))

const preparedH = args => {
  const create = (props, child) => createElement(args, props, child)
  create.style = (style, child) => createElement(args, { style }, child)
  create.extend = (tag, props) => extend(args, Array.isArray(tag)
    ? tag.reduce(mergePropsDefault)
    : prepareArgs(tag, props))

  create.extend.style = (tag, style) => extend(args, Array.isArray(tag)
    ? { style: tag.reduce(mergePropsDefault) }
    : prepareStyleArgs(tag, style))

  return create
}

export const h = (tag, props) => preparedH(prepareArgs(tag, props))
h.style = (tag, style) => preparedH(prepareStyleArgs(tag, style))

export const observ = value => {
  const listeners = new Set()
  const subscriber = fn => fn
    ? (listeners.add(fn), fn(value))
    : value

  subscriber.set = val => {
    if (val === value) return
    value = val
    for (const fn of listeners) fn(value)
  }

  subscriber.setCheck = newCheck => check = newCheck

  return subscriber
}

export const keyHandler = handlers => ev => {
  const fn = handlers[ev.key.toLowerCase()]
  if (!isFn(fn)) return
  if (fn(ev) !== false) ev.preventDefault()
}

h.a = h('a')
h.img = h('img')
h.div = h('div')
h.span = h('span')
h.label = h('label')
h.tr = h('tr')
h.th = h('th')
h.td = h('td')
h.table = h('table')
h.button = h('button')