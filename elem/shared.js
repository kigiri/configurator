import { h } from '../lib/h.js'
import * as images from '../lib/image.js'
import { color } from '../lib/colors.js'
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
export const fetchItemList = (vendor, vendorList) => findVendorItemList(vendor)
  .then(({rows}) => replaceContent(vendorList, rows.map(item => flex.style({
    alignItems: 'center',
    marginBottom: '0.25em',
    height: '2em',
    width: '33%',
    flexGrow: 1,
    paddingLeft: '0.25em',
  },[
    itemLink(item, `#/tbcmangos/npc_vendor_template/${vendor}/update/${item.item}`),
    a({
      style: {
        padding: '0.75em',
        color: red,
      },
      href: location.hash,
      onclick: function handleDelete({ target: el }) {
        el.onclick = undefined
        el.style.color = green
        replaceContent(el, '↺')
        el.parentElement.style.opacity = 0.3
        removeItemFromVendorList(item.entry, item.item)
          .then(() => el.onclick = () => {
            el.onclick = undefined
            el.style.color = color.comment
            replaceContent(el, '.')
            addItemToVendorList(
              Object.fromEntries(Object.entries(item)
                .filter(([,name]) => dbInfo.tbcmangos.npc_vendor_template[name])))
              .then(r => {
                console.log(r)
                el.onclick = handleDelete
                el.style.color = red
                replaceContent(el, 'X')
                el.parentElement.style.opacity = 1
              })
          })
      },
    }, 'X')
  ]))))

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
