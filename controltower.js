const h = require('izi/h')
const background = '#282a36'
const foreground = '#f8f8f2'
const selection = '#44475a'
const comment = '#6272a4'
const yellow = '#f1fa8c'
const orange = '#ffb86c'
const purple = '#bd93f9'
const green = '#50fa7b'
const cyan = '#8be9fd'
const pink = '#ff79c6'
const red = '#ff5555'

const toJSON = r => r.ok
  ? r.json()
  : r.json().then(msg => Promise.reject(Error(msg)))

const server = action => () => fetch(`//chupato.jcj.ovh/2/${action}`)
  .then(toJSON)

server.kill = server('kill')

const flex = h.style({ display: 'flex' })

document.body.appendChild(flex.style({
  background: selection,
  padding: '3em',
  margin: '3em auto',
}, [
  flex([
    h.button({
      style: {
        background: red,
        color: foreground,
        padding: '3em',
        margin: '3em',
        fontSize: '3em',
        borderRadius: '0.5em',
        borderColor: '#ff8d8d',
      },
      onclick: ({ target: el }) => {
        el.textContent = 'sending...'
        server.kill()
          .then(() => {
            el.textContent = 'RESET AGAIN !!'
          }, err => {
            alert('montre le message a Aos')
            h.replaceContent(document.body, h.pre.style({ color: foreground }, err.message))
          })
      },
    }, "RESET LOL")
  ])
]))