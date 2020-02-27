import { h, isStr } from '../lib/h.js'
import * as images from '../lib/image.js'
import { color, getLevelColor } from '../lib/colors.js'
const { pink } = color

export const itemThumbnail = item => imgEl({
  src: `//wowimg.zamimg.com/images/wow/icons/small/${item.icon}.jpg`,
  style: {
    width: '18px',
    height: '18px',
    margin: '4px 7px 4px 4px',
    boxShadow: '0 0 0 4px black',
    outline: `${color.blizz.quality[item.Quality]} solid 1px`,
    outlineOffset: '2px',
  },
})

export const flex = h.style({ display: 'flex' })
export const logo = h.a({
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

// Entry, QuestLevel, Title
export const questLink = quest => a({
  style: { display: 'block' },
  href: `#/tbcmangos/quest_template/update/${quest.Entry}`}, [
  imgEl({ src: images.quest }),
  h.span.style({ color: getLevelColor(quest.QuestLevel) }, Math.max(quest.QuestLevel, 0)),
  ` ${quest.Title}`,
])

// SPECIAL_CASE
export const sideHeader = h.style({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

export const inputHeader = h.style({
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

export const comment = h.style('span', { color: color.comment })
export const a = h.style('a', { textDecoration: 'none', color: 'inherit' })
export const imgEl = h.style('img', {
  verticalAlign: 'middle',
})

export const inputBaseEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  borderRadius: '0.25em',
  border: 0,
  padding: '0 0.5em',
  height: '1.75em',
})

export const itemLink = (item, href) => [
  itemThumbnail(item),
  h.a({
    href: isStr(href) ? href : `#/tbcmangos/item_template/update/${item.entry}`,
    style: {
      flexGrow: 1,
      color: color.blizz.quality[item.Quality],
      textDecoration: 'none',
    },
  }, item.name),
]
