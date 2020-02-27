# Demonade

## API
### Create
#### `html`
A proxy to create any HTML element

```js
const emptyDiv = html.div()
const helloSpan = html.span('hello')

const wrapper = html.article({ class: 'content' }, [
  emptyDiv,
  helloSpan,
  'wow',
])
```

#### `svg`
like `html` but for svg

#### `css`
inject style in the `head` of the document, it's just css.

```js
const className = `content-${rand()}`
css(`
.${className} {
  border-radius: 5px;
}
.${className}:hover {
  background: black;
}
`)

html.div({ className }, 'Css scoping, yey !')
```

### State
#### `init`
Initialize state.

You can have 2 types of values:
- **watched**: values watched by the state, you can not mutate them directly.
- **controled**: those are value that you can update externaly.

Once in the state, you can react to changes from those values to update your UI.

```js
const state = init({
  content: 'content is loading...', // a controlled value, you define their initial values here
  active: () => document.activeElement, // watched values are defined with a getter
  mouse: { x: 0, y: 0 }, // you can create structures
  window: { // it also work for watched values, you can mix controled and watched values.
    height: () => window.innerHeight,
    width: () => window.innerWidth,
  },
})
```

#### `persist`
Create a persistant value, stored as JSON in `localStorage`

```js
persist(state.content) // every changes done to the content will be persisted

// it can be used with an input
const input = html.input()
const state = init({
  content: () => input.value, // state from input must be watched
})
persist(state.content, { elem: input })
```

#### `map`
map form a state value, will only change if the resulting value changed

```js
const state = init({ content: 'value' })
const display = map(state.content, s => s ? 'hidden' : 'block')
console.log(get(display)) // 'block'
set(state.content, '')
console.log(get(display)) // 'hidden'
```

#### `derive`
call `map` on a state property and save the mapped result to a new state property.

```js
const state = init({
  mouse: { x: 0, y: 0 },
})

derive(state, 'position', 'mouse', ({ x, y }) => `(${x}px, ${y}px)`)
console.log(get(state.position)) // '(0px, 0px)'
```

#### `on`
bind multiple events at once, events are unbound when the state will be discarded, see `attach`

```js
on(state, {
  src: document, // optionnal, default to window
  events: [ 'click', 'mousedown', 'mouseup' ],
  handler: e => console.log(e),
})
```

#### `get`
Get a value from the state

```js
const state = init({
  content: 'content is loading...', // a controlled value, you define their initial values here
  mouse: { x: 0, y: 0 }, // you can create structures
  window: { // it also work for watched values, you can mix controled and watched values.
    height: () => window.innerHeight,
    width: () => window.innerWidth,
  },
})

console.log(get(state.content)) // 
console.log(get(state.mouse)) // { x: 0, y: 0 }
console.log(get(state.mouse.x)) // 0
console.log(get(state.window)) // { height: 1080, width: 1920 }
console.log(get(state)) /* {
  content: 'content is loading...',
  mouse: { x: 0, y: 0 },
  window: { height: 1080, width: 1920 },
} */
```

#### `sub`
Similar to get, but take a second argument, a function to subscribe to changes from the state.

```js
sub(state.window, console.log) // will log if window.height or window.width change.
```

#### `set`
Allow to set controlled state values

```js
set(state.content, 'some value')
```

#### `attach`
Bind your state to an element, state will be discarded, all events and listeners cleared on dismount.

```js
const state = init({ a: 'b' })
const mainElement = html.div(attach(state, { className: 'my-element' }))
```

#### `watch`
create watchers for each propetries of a given source object:

```js
const state = init({
  location: watch(window.location),
})

sub(state.location.hash, console.log)
```

### DOM manipulation
#### `append`
like `document.appendChild` but handle `strings` and `arrays` recursivly

```js
append(document.body, [
  elementA,
  4, // will be converted to a string
  false, // will be ignored
  [ 'some text', [ 'some nested text' ] ],
])
```

#### `setText`
replace text using `elem.firstChild.nodeValue`, faster than using `.textContent`.

```js
setText(document.body, 'some text')
```
> only work if you already had text in this element

#### `empty`
remove all children of an element.

```js
empty(document.body) // result in an empty page.
```

#### `replace`
like calling `empty` and `append` together.

### Utils
#### `isObject`
check the value constructor to be `Object`

```js
isObject([]) // false
isObject(4) // false
isObject(new Set()) // false
isObject({}) // true
```

#### `rand`
return a padded 12 character random string in `base36` with a leading `_`.

```js
rand() // _5of2v8ajrt6
rand() // _0ujvjhalow4
```

#### `toId`
convert a key to a valid js property access:

```js
toId('abc') // .abc
toId('456') // ["456"]
```
