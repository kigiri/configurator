const fs = require('fs')
const file = fs.readFileSync('./config-comments', 'utf8')

const lines = file
  .split('\n')
  .filter(Boolean)


const result = {}

let group = []
let text = []
let keys = []
let i = -1
while (++i < lines.length) {
  const l = lines[i]
  if (/^      /.test(l)) {
    text.push(l.slice(6))
  } else if (/^   /.test(l)) {
    if (text.length) {
      group[text.join('\n')] = keys.join()
      text = []
      keys = []
    }
    keys.push(l.trim())
  } else {
    group = result[l] = {}
  }
}
group[text.join('\n')] = keys.join()

fs.writeFile('./config-comments.json', JSON.stringify(result, null, 2), 'utf8')