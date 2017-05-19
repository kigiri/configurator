const h = require('izi/h')
const { isNum, isFn, isStr } = require('izi/is')
const each = require('izi/collection/each')
const curry = require('izi/auto-curry')
const store = require('izi/collection/store')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const observ = require('izi/emiter/observ')
const keyHandler = require('izi/key-handler')
const images = require('./images')

// STATE
const color = require('./colors')
const { cyan, green, orange, pink, red, purple, yellow } = color

// LIB
const wesh = _ => (console.log(_), _)
const g = (s, k) => s[k] || (s[k] = Object.create(null))
const _tag = tag => Array.from(document.getElementsByTagName(tag))
const b64 = s => btoa(s.trim())
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '')

b64.decode = s => atob(s.replace(/\-/g, '+').replace(/\_/g, '/'))

const toJSON = r => r.ok
  ? r.json()
  : r.json().then(msg => Promise.reject(Error(msg)))

const avg = (...args) => Math.round(args
  .map(Number)
  .reduce((t, n) => (n + t) / 2))

const query = a => {
  console.log('executing query:')
  console.log(a)
  return fetch(`http://chupato.jcj.ovh/1/${b64(a)}`).then(toJSON)
}

// ELEMENTS
const comment = h.style('span', { color: color.comment })
const dbLink = h.style('a', {
  color: color.comment,
  textDecoration: 'none',
  border: '1px solid',
  borderRadius: '5px',
  padding: '1.25em',
  width: '20em',
  margin: '2em auto',
  display: 'block',
  textAlign: 'center',
  background: color.background,
})

const flex = h.style({ display: 'flex' })
const tableLink = h.style('a', {
  color: color.comment,
  textDecoration: 'none',
  padding: '0.25em',
})

const logo = h.a({
  href: '#/',
  style: {
    padding: '15px 15px 0',
    borderRadius: '50%',
    marginBottom: '-1em',
    marginLeft: '4em',
    borderRadius: '50%',
  },
}, h.img({
  src: images.logo,
  style: { width: '75px', height: '56.5px' },
}))

const keywordWrapper = h.style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '66em',
})

const content = h.style({
  background: color.selection,
  borderRadius: '0.5em',
  margin: '0 15px 15px',
  padding: '15px',
})

const labelEl = h.style('label', { display: 'flex', alignItems: 'baseline' })

const imgEl = h.style('img', {
  verticalAlign: 'middle',
})

const inputEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  padding: '0.75em',
  margin: '1em',
  borderRadius: '0.25em',
  border: 'none',
  width: '100%',
})

const inuptBaseEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  borderRadius: '0.25em',
  border: 0,
  padding: '0 0.5em',
  height: '1.75em',
})

const textAreaEl = h.style('textarea', {
  resize: 'vertical',
  width: '100%',
  border: 'none',
})

const inputHeader = h.style({
  flexGrow: 1,
  display: 'flex',
  backgroundColor: color.background,
  borderRadius: '0.25em',
  padding: '0.5em',
  margin: '0.25em',
  boxShadow: `0 0 20px 8px ${color.background} inset`,
  backgroundPosition: 'right',
  backgroundRepeat: 'no-repeat',
  minHeight: '115px',
})

const sideHeader = h.style({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

// APP

const result = h.pre()
const scriptTextArea = textAreaEl.style({
  minHeight: '600px',
  background: color.background,
  color: color.yellow,
  border: `1px solid ${color.comment}`,
  borderRadius: '3px',
})


const app = h.div.style({
  height: '100%',
  color: color.foreground,
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '70em',
  margin: '0 auto',
}, [
  flex.style({
    alignItems: 'center',
    color: color.background,
  }, [ logo, h.div.style({ color: green }, 'Execute SQL Script') ]),
  content([
    scriptTextArea,
    dbLink({
      href: '#',
      onclick: () => 
      console.log(scriptTextArea.value) ||
        query(scriptTextArea.value)
        .then(res => {
          result.style.color = color.foreground
          result.textContent = JSON.stringify(res, null, 2)
        }, err => {
          result.style.color = red
          result.textContent = err.message
        }),
    }, 'execute'),
    result,
  ]),
])

h.replaceContent(document.body, app)

Object.assign(window, {
  query,
})
/**/