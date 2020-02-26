import { colors as blizz } from './wow.js'

export const background ='#282A36'
export const selection ='#44475A'
export const foreground ='#F8F8F2'
export const comment ='#6272A4'
export const cyan ='#8BE9FD'
export const green ='#50FA7B'
export const orange ='#FFB86C'
export const pink ='#FF79C6'
export const purple ='#BD93F9'
export const red ='#FF5555'
export const yellow ='#F1FA8C'
export const color = {
  blizz,
  background,
  selection,
  foreground,
  comment,
  cyan,
  green,
  orange,
  pink,
  purple,
  red,
  yellow,
}

export const getLevelColor = lvl => {
  lvl = Number(lvl)
  if (lvl > 25) return red
  if (lvl > 22) return orange
  if (lvl > 16) return blizz.yellow
  if (lvl > 13) return green
  return blizz.grey
}

const colorKeys = [
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'foreground',
  'yellow',
]

export const colorize = i => ({ color: color[colorKeys[(i+1)%colorKeys.length]] })