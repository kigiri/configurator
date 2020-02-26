import { html, on, sub, map, set, init, attach, append, replace } from '../lib/demonade.js'

export const ToolTip = (contentMap = _ => _) => {
  const CONTENT = Symbol('tooltip')
  const tooltip = html.div()
  const state = init({
    position: {
      mouse: { x: 0, y: 0 },
      h: () => tooltip.clientHeight,
      w: () => tooltip.clientWidth,
      win: {
        h: () => window.innerHeight,
        w: () => window.innerWidth,
      }
    },
    content: '',
  })

  let prevTarget
  on(state, {
    src: document,
    events: [
      'click',
      'mouseup',
      'mousemove',
      'mouseover',
      'mousedown',
      'mouseenter',
      'mouseleave',
    ],
    handler: e => {
      set(state.position.mouse, e)
      if (prevTarget === e.target) return
      let t = prevTarget = e.target
      while (t.parentElement) {
        if (t[CONTENT]) return set(state.content, t[CONTENT])
        t = t.parentElement
      }
      set(state.content, '')
    },
  }, false)

  sub(state.content, content => replace(tooltip, contentMap(content)))
  const wrapper = html.div(attach(state, {
    style: {
      transform: map(state.position, ({ mouse: { x, y }, h, w, win }) => {
        y = y + h > win.h ? (y - h) : y
        x = x + w + 20 > win.w ? (x - w - 10) : x + 20
        return `translate(${x}px, ${y}px)`
      }),
      opacity: map(state.content, content => content ? 1 : 0),
      position: 'fixed',
      left: 0,
      top: 0,
    }
  }))

  append(wrapper, tooltip)

  return {
    element: wrapper,
    content: (src, content) => {
      src[CONTENT] = content
      return src
    },
  }
}


/* usage

const b = html.button('describe me')
const tip = ToolTip(text => html.b({ style: { color: 'hotpink' } }, text))

tip.content(b, 'wesh 2 ouf')

append(document.body, tip.element)
append(document.body, b)

})
*/