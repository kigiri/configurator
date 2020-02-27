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

```js
```
#### `persist`

```js
```
#### `map`

```js
```
#### `derive`

```js
```
#### `on`

```js
```
#### `get`

```js
```
#### `sub`

```js
```
#### `set`

```js
```
#### `attach`

```js
```
#### `watch`

```js
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
