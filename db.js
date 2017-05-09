const h = require('izi/h')
const { isNum } = require('izi/is')
const each = require('izi/collection/each')
const store = require('izi/collection/store')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const debounce = require('izi/debounce')
const bind = require('izi/data-bind')
const loop = require('izi/loop')
const persistant = require('izi/persistant')
const observ = require('izi/emiter/observ')
const keyHandler = require('izi/key-handler')

// STATE
const logoSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABxCAMAAAAAnqrqAAADAFBMVEUAAAAAAAB5YgEAAAACAQACAgCMdQQAAAC7lwJmUgEAAADLpAIBAQDEngEKCAAMCQBIOgGtjAITDwCZfAKMcAKBaQM6LgE3LQFgTgIyKQEtJQCigwJMPgJ2YQRpVQMAAADdsgLarwImIALitQLWrAKP09ITDgGJ0tH///3TqQKU1tbgtALH6Oqa2NkIBQB4y8x0wL6hgQEOCgHN6+yq3d+g2tu85uu24+bZ8PXkuAGw4ONmUwFDNgLougHV7vEPFBL6XACDxcN9zs0KDQz/fAD//+/C5+y+5uU2LQQEBgbf8/pliHOk3N42UEqE0dAvNxonLiMVGxn+cwD+/YciFABvs61uknmEagJ5xcQdKCQeIxz+awD/+j4yNi/vXgDJUwD//Vs7SkD9vgD+YgD94wT+kgCwSwDR7fR7uLOwjgF+vbtfgWxifVB1NACJzMr/8wmXeAH8nQD+/uMtQj1wura5uqf/hwCDNwDo+v46WVZ4eFVceD51YAL9qwC+ZQBiLQDI6vFVdF5Na1chMjH+1ADvgQBtkGhVRQGv3sf//71CZmNkZCVLPwOoXwCdx6FWiH57nHf/+SSfRAA4FwCoqZeXmZGepnVMc3NcfmHXxU+ckDHs1QVjTADx9OrN5Nl5z9O+3tGHwbeInVxjZkq+uUbe2EKLhCupoCY3SCDUbQD2+/jFvmG0uGGNkj2OsTlvkjZxci++tBbfzxO9eADjVQCPPgB+qIucnU2tqERzfT9UVzE9YC6SUwBvRgDd5N2Ru5dcl5KGinihp2BMW1eAikZPaS0YGgvQvgeBSgBlo6GFtJW4t4OLrG98mmdCYUXKxUPs5S+427N3r6SGhlm/pjO7uTGAfi64pgNcSwLg5MvQ37+m0bHaxWRlZ2KXiwjxywDjnADchADocQB2n4WKnn/h43hvhF74+NWFkI5ti4lrjU5LczXqxC+4lyzSyypQURlULgCtvcHJyr6Yr7CivX/w8K5xeHfq6FXXry1NIQDb257GyHqixznHx6LKjgDh5aK/Q8F3AAAAH3RSTlMAOs4tCl31Hv3GE/5N/n1urfSW5uPZm77RqYnvxdvaIm9wGwAAFbtJREFUeNrElM9r2mAYx+uMMzP+6A+1am3z2uhGDJpsrBu2FUm8tNAECg3Gwe4mhyCYS8CbByEMPHoZjP0nuebaU/+F/Rd73jfVuXWnad1H81pt4Pn4fR6fnU1AUYlEPCSRoKid/w6ViEcjsUyplN8NyZdKmVgkGv+PclQ8Eivtvsplj0w6xVQBnknRe0fZF6/y6VgkvnUz4pRM7+aO6BQvCBzXAtrtNn7hBAHxKfroRTGT3LZZIpI+zDJ8BSEBlHhz2BtfXHy9GPeGZooDM4RQlU/liplIYmdbQFD7BZqD0pUqM/x61WR/53Tao6sVrIz2yvtbioyKxorHDCRSpd9enLJLrjHsgtfTIc0IgtCiT/LbEIvHdrMg1Uq9nN6xhE5/pLrenOC56mhy+2h22TMFTuDoHIjtPCuJZPEgJXBt8+G0SZRG3swPdMkwRFH8hhElJ/Dnaqh292XItQREZ/cjzxlYNH3MVBBHX74jTq6v646EMeACr6WbIQUeMWueDjkBVVKFzHMFBlEd7nGowkzJKE1muqM7APESFQWc8BWa4fiCEZm1UxNP/8F+8lkCo6LpkwqHmHETB6VCUETqMS3RCMF/gyIE5kjiN0ftYLMpDREz5ecIjIrkD2BRDq+gzK0bOPpc9WYBSBGvRScJyhspmLmeI4qS7rt9PP1jhkMoW4pSm7ZKlmnE8VMYqq7n60AwYrt9NTBCIUOUoIc4LUNT5pMOO9FF0dAdQ9LnHRC7MsFrr7jhyU/ECjxqm3gljPx7HTPQVdxND1s5ht/pdDxNUgxJ8fvQuIkjgpYjKvCQ8I3vem2EmMONDlgicwxT22tCVHNsNJCtwcCSVRaLzfQRy4IJHGCjT1igbygi/hWQU3NmXfjsCwLKscTmVmgmhxA/ZiGEexDCyLJsy5bLhja/6JJzoiggRA7cWtnxsexVCrwK4LWprHIVgX+A+q6sabYlA5ZlEy9QespI0RSMGKJohh64XTxgAqqegNemrDj+Eto1tyzZtt9gyItmD9y/WRkaQQEWXpY86+AVxiG+ENvEfFGxY8jqCtbCDA8V8SLY8JT1zhOrrg/CGlxEjaDZ8hvd78OmMFuoWt7A3FPJAkIkKx+sBpYFTxmMFnhPw1r+T1sCljU7wF60gCqHkfW3aLmK8FzdBjBQgByyqFyrdZ6E1agRlmr4xLfWrQn0kUaIKUbX1IrmaYTGoZWM+0Yq2qESflP3V52uIaxGHT5dMSPy+AIvyOuSgb1aiq837ukD1OqB1b2lD2S79jdm7mSppapzq1EnrNxRX3BmfWLZKUKV7HpjnzxBnNlku7OabT1arRTFscB7efRrrqw6tlql8cgZ5saCPdHDYx9Zp4WHVYG/Y689G1cjSqQsORuLsrUVLbvxJ+Cy4D0QwF2mIKT242u0cE8QYNwn3+0a+db1lWrLR+NmcMsSoNc3Z78R2mDOQz5+nLPsXRW1shnqn1t4zKHhOygG+6q2UHnKzfmPx4Gfn98QzhbxEIgOCAEfPn54/5llHwTE/XMb40UGMbBHf3y/H8ihD6n1kxbzC2kijgM4VtZSV5n9AaO+t51JazXwVraVTWKU+4OoEMoEH/YkMhFBgmE9LAMRTqwXqUY7Nkono017MfNhEYsehCxriho+VTBhU+bABvbQ9+48ndl0J/lhsIe72/dz3+/3vr/fDaNtACMCh36+9OrGIxyCEI8joQeqhCQkR3N2ON4LZLI6gBC3NF9eqwYGw48ARvPMh4DH8vjLpdLSK2sHBZ9UbjmWuSkhO563s34/IiUUKqjHEno8nstCNQT4kInlNr3RmPq2+OBx4koFd7RC4BYPb3XL4agGaCUIyYkDO0rWMZKcxhK23ECti+jEh0rFBv+mIV4hcEFAMEOvOIBcwaZr3446i5QCtOFy42m5LDjhT68FaoxAOh64L6DQOmpBjS0i83MR06VUNhXuoLuyT2uvd4Px4Q2Pp+X81SsVeKO8k3oVDfZuWubUanThThauEHLG/Op7VQzF7JYwS/zMOppLSopxZHnOYqpQiXNyONTqRkSn02nc1ZAefa9OvQle7Gff54UqdtaT+YdEVzHrDHn9GXbWJWxsTsqBqHkjdNJodCHYCotbtwG8kleb7fsceD2lh9tagjy5V2zDH5IopXKoKRWckEYWNOKJwNaE1DoBDV6EX7zWyoJ3ZGTSAKoSktyfLXo1JJWtKjCj1boTBuAwmUz2eDlsQ8SkSUWHoJX7U/STf2iSBujWEjKxIzWvgCiaBuNV9uFDJQ6NIIVWCQtsh3FeYzcJ8GIajXpiIRp2Pn/up0AuJUhsenE1zCWwhpXDoftdbnci3mjHCLwTYrcv87nato6sF+9mR0zuBLMS7TfQ7W/8ZaCqI4l8cQv2gSMKogngO+bEMtZlMeqrQxF0M/ERdCEjZEQDY19FE4/MNZTrjWOT3SqgnMmkF2BaRijEVTHruEx2DcrHbIBUCqmpCc3HL+g0jBUypXzJbmISy9YaWMXK3pA8Gg2/N7Kvs0UH94paePIJmQHahsc2G9RYLSCChs2JpcIv2tu/VgHVRMgK8sTM0kIJkQvQMTz2CP4/9NMRZzg8BdAqE9Vc2Fq5yhIw2oaHO427oBWLxZzO1wDPigjpiRwRU+ugjLwGoEfg/6OiqOJiigIwKIjcIwdETK3jpNYAuw6lIIr2ZInZlyq1FOwyKgApoTyWl7nW4XyyCNJTjw98RjSkP4+qqgIoIZQF2ftEPIikBMCYzqqnKxHZfnbVL8eDS/WQhsWpAYA6pfLU4cy1Tki1JaAfH7eU17RZ29qqIRVL0Ie4gpF62IJQ3OU7d+5cUL+xcHJDWTfuARed9NCACq4plfmF+zLfLyu0daDv6DSba1meQArVPRMzGJBlaS7Ng1rd6+LPCLbf/QApTEeRZLh/yO+nByjoJglJYU7mWjLtPdQyoxZrZkuJ3vC259vEbNDFm/l6//G32xzDO928OdseCAzKYZ26ZDSZDHv76Sn/6GIxlJFiBhdutrS4Ij4xd3bWIo9q16toHevpYb1mBDHL5j4Prlq57nwMBAL+NynFjiWTsVh//9Ao7aRpAxhIIleMlpbTstnMCIp1CN1f+RatJlhmZxnfVlpo9e7Hy8Dg4GBzx9pdlcWQ8BQ9RNNOr9cAcpKdpyK17ttYWC9zDXB08FaMy8d0uWcZ11ZaM+13VgK/J5ub73aMCyeN9jvDXqeTHh2dCnuHPmyllZOV/TeHTl7ni8h5odZ366oVamENv7l9bKZ8QYYJ1qfRWvrDlvmDNAxEYRz/IDrp5lhLRQqCoI61XUREQqiTguCQUdrBpYOcS+JScMjSOggNASGWgkmmgh5YQr0MQQKFUigds6i3OwX0S0sREn/Tbe/jffcO3n3l8o+JZpk+8X0y6ZdL/YcnY2DYt8aj8dJ0xyauLsfLz8yPd/qFBAgnr/HfrUYWqqpwEgj7uMqy14YuXddHYLfwquGoJWUdQ1aj4tTewtAyuUUptRgvpkCTMyoqz/agDyOJPZa1fpmovjIHWTOzCOfzMTL5U0RO0RAKqhoEQVu6kUqe10GjtFZL03qj6oTOP5NYyQ7vnGHDDNEswjm1TIuxZrF4Rhmj1PeN/r3NiDVwsWVkMrHKCMGXJrLSa4vbCXJ4IEqOCoJ2hAfzqr1o/AqHul6dIqeSfFdqtcZBNgzfvwjhlMNLzqGQAQqITRiMZW5qL1n3Ip2eytrMbW3E2UkdnUuSKIpX3a6iKLKMm/bh1Ov1T+GPX2XPwNZSPbYLqHBK24bu3btXrACG0tGj71dAgD8YRAYAiYCAAD15LNb2aMKcBWpbDRpgg81ZeiH1k0kyhS7OMtqanLzlJymm0MNZRgBeyd7GYRgGo6Okc+nCE6jQBIQ6AmJBgJ3aU2ftIE+R3looE1yb7mjKyv0gSXkPLkhJn/lsqLJzLubLf/NeK6lUIXbZHJd5ni/GtDyqg7Oe58XObdsWtHpDCEFDgylowtrxnvdaW2TehJnp6ISd42SD7R9aeNfKrPOxZufu7JQ9T5dv9k4ZrfsDUziVEsUjXcNLrVmQt4rjcgk6h8k2kFXYtAiJuB1auO/YtZCaVOH4+fjqjTk6jbShxfE3Q6swsvWIMr3QKoA5w2O/QqVTC2KO2F1BBKsWCYhQzAFIEKMezsOrYMzqqvudiJKNLRkZu1ZG3GsqqWlYl55qLQiUEGS5DC0hKF0L2w36oheBoQVdy5McTdPnZxQa0Pku8Ab4BGd5DWYPVOoV4FbvDXTyM63ifVv97XFFmpfVdy0PQyt/rOLl0PLr6qvd4I+r+DqJL/4WepR81tHVhlsqp1TKF9t1j+I6DAQAuA2EnCEkPALbBJzusZvOxR7A4F5YD1wseBq9JlIaiTSrZtPmAqpFOrv3LfxzArfbhB3LSuKQnSYzsqR8Y2GD923P6m/W+euMfxOZsD2aMGQsxORfGO5/Y2lmSsXw1HyUTAvWOZZSZ6WGZ5UKzXTfBBOC5e4qM30WtbnBjR3UsP+sDU2rHl6BG8M+lFrfHr6OsW/BmD6uPhRrNyETm19YDRM5ZfM7i2pBr6zcs/ZXVkeFoKUbo0ZQBGqV4487VoVpaaig+0cWLfw2bldNTUfV3q1oaFFSGj2z1goZoO+7FKAtDO0qmqvGZR0YTbVLrAXPahyrhBKEt+umWQoqoHxkQUHVvaRQWOzML2mOAOUzKwLIG16MWFxbros+8BIMrDfeaNAusdbPhsYCsnJecoulz5CJyzdjFi6A+lYuOXQAK1/V0DXcPrOWnMc1OYxYJLsQHzzm9cAil4wHmLwTa8nJjfHakgw/3OuYBO50ArIjMcIvdR2NWRdS8DvrQOrTvbzwnSX1MysiJJtKTK6xk8HnycfhRF7c4LtcZCRwyWQihybknxRZy202QwxGNF2k2N+KbFO5HLNm8pVsb+WrfNmR6bVKSRzI7TNrVclJmgQjVhLMEumi+htXi4GVbAMZ9KuTySwZWMliIrN1Kg+yenNzqqCqPufzqkr9DM+aJruqupWnH7bJFbmBGAagzKSH6LSgsCCsszlADpCZJYYiQeoBFmamxEQ04jW2DlFRk4yL3BtsrlDX3u1uZlbs+SM9jWx4Gn7eZno49yfY0HpkUAO8ZOkxJ2ApwcCGtT0I5Az5bwSYErq6hpqgQFZIbTrYA7x/dwInzGstheG8FHDIHfNuIoYhoW5oBWQjuEzRFC3sDiX291q1Vocp4H7WQoSCcpz66VRVVJMBfV1r4bDq+4joiszkCOAY84aWIfKe5Otfi3KgVpiiidK0iDLluhsCHdruaEIYhaThzkvhGl5orSU0xHiHfrr0Emh0RB8bWs/W2lu01znRxV6u9la/lo2fNV899MuW+asoDARh/G0sLe4VrroqwtfJHnzP4RsM6YVLazY5iEU6g6UcNlskIFpdu61Wy4KHeOtGjIVTzbC73/z2HwxMoYrglGq/V1HyTR3LLqwt7897pMuj6k0f+yn3gU6lqntwjgulg5w+BdV9SF2qbvuqgsjJ9kQ2ozsWs5xpFKA/ePZYZEGfF6lmk7PfKduGzB5/bstMUzd521K3PDxhedbejx5xQqYFSf9FMg9RNn6FlQDY1cDvOl7kBqsl6ngesD8WUWoKBPdm1XqJacRAtcRmyP6NlcX65sFWqJ6wgBp2O9ziCvhs0KslFjZ5XZ3ORGS2cCKXRYiMzI3MYt9Crjsn7xHrKm5uzDnYn5GINZWLETNk313nTiY37yzGycfQaBFZODcZZk7+yzmjkDTiOI5TbmQzbblqbW5TW4QiDNabbLGHEBojSogkwQcfh/cwLu5huZdrcLER4x70prAeOhUGGuwp0xfRyR5KCyaNGfpU063BHqLtYRHs+z/X7CF2DEqCfSK487z//+P//8P/3f/+P38++z5dQHFCIfQTVeuP1xry03TVV6TpTRf2GNp3QKel021Ff7UKBxCq0vSujylW6c1Nm7N29IChmXplzCZD07UtGoW561p0NV2tuvR1XJt09QC34AyDUqfvH6sF7vttwOS7pwe7NuCTzjbZaJvN9bsoxmajsQtMNS0TdnfrddE4UJS2fCaphEPsmPKySZp10zRtqhXFuP52+xqat83/qG36fT6/vyxVzJBNtP4fsfly2jZfZCR9Z3GXYdJHZiDK5XKtjrd+/+d0ua6F9zE+HDrKfTcmENJl+99uyMAQ3iGLc0jvhOWpcPfsz0G80p8ZjmhZnoz3yoEzJp8SJiedY5NgDLhGXa7R37jGCDhqt9udTiemikbHnGTn3iEoQrae8Y91LYM8Nx8hZrml94QtHpO8WxP8trC3t7q6HyPsvUilUku5fCBAUdQOEMWYUAmwM0gaGXGDqakh6em0PIda5j5ZsP77dr9+gMrlVlYWVvgJjv0ywcNL2Fvdj8aisT1CToQVS6yyoihmBI5YPYcU8cLD4Vt3iJVsXWZJS9HdLMv1DuKFjkyKuRS0OA/7YAta2zlBiO1HS6VPpVI0HI1lRLGQXYwvQiqeycPq7WM0FmmuSQw2TwxAd122tu4WKceiSZY2rc6KhJU5fIdRqYUUtDyeiW2AVhFWM7FoFGql9SAo4S8cDIYzOQ5WpAsfj7hdZJk1Ft5hpaJGtrJ/yIlTaDoHDRazA5/ZvbCQy3MejuO3+e18JS8IQiYej8MrGoQO/iORSDCT49kZdKGk5cS4Mqu2IEJvaE42TaRFc4NEoxIdaZ+AVj7P80tbHFWppAsi+g0sh6Pr6+H1cCQYWRcENBb7UrIisT7gIGFl7mk/6Uw3ZGOoEGB9r/pxCbTD5eG1xFNeeFWy2UQ8u5hd3sBFFqy+RYIiujDgYZ+TyHLigm1YaYWVkqxIP2nOtV1E4CNPZG4A4yLL5Xj+QYANUCCUSCSy2Wx8GSugNjbC0YyY56Qvh5EpMpQNO6wWfKBLp5OxdQ6pWmpEvuH2HBkX1zzkASjlXaO83oQXYouE5eVwTNzhqBk2wI48rUmpSKwrW08tXQuJbTqLAaH/cJaM6k43i16E1Vdi9SbxIZsoZGKZCkVVqJm1KfsQkXqkMuAMY2d32+klUKLBrqkMwKi6068H90aTWC6TKUwfUihUvN6dGXwjEOaURiOxUl5uP90cxXNN2i4VqiJ9eRdPYMA7VzKZDElMh0LJ12glcGug12G2GkCfukcjE1Un0pPaLmWfBWKDZmSY9vYfs8ZhfHjWoR60EntzR7OmMQmwLW1XWy+prMTMalTedjz5eHe4d7wfjGM9wewd5OWaB2uH1Z2tDZCqP7Ftv3Kjw4KqETjIglWp1UoJtVplNty0SK9bjbqe7vOKBknV06phZoTAcaDzdD3a9sanfBOzpnbtta4OlRlXRsZDcGFiVuuuX9aeb7xTPWUfGfsa7cXW5q7OS4TOrubWi1oNlBrQd/I/J6BoaqvRpFC0XDgDv3HwX/ELEUHyEHkwaTkAAAAASUVORK5CYII='
const router = require('izi/router')
const event = require('izi/event')
const dbInfo = Object.create(null)
const colorKeys = ['cyan', 'green', 'orange', 'pink', 'purple', 'foreground', 'yellow']
const color = {
  background: '#282a36',
  selection: '#44475a',
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
}
const { cyan, green, orange, pink, red, purple, yellow } = color


// LIB
const wesh = _ => (console.log(_), _)
const g = (s, k) => s[k] || (s[k] = Object.create(null))
const b64 = s => encodeURIComponent(btoa(s))
const toJSON = r => r.ok
  ? r.json()
  : r.json().then(msg => Promise.reject(Error(msg)))

const query = a => fetch(`http://chupato.jcj.ovh/1/${b64(a)}`).then(toJSON)
query.noparse = a => fetch(`http://chupato.jcj.ovh/1/${a}`).then(toJSON)

// ELEMENTS
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

const tableLink = h.style('a', {
  color: color.comment,
  textDecoration: 'none',
  padding: '0.25em',
})

const field = h.style({
  transform: 'rotate(-60deg)',
  transformOrigin: 'left',
  width: '1em'
})

const rowElem = h.style({
  display: 'flex',
})

const logo = h.a({
  href: '/db/#/',
  style: {
    padding: '15px 15px 0',
    borderRadius: '50%',
    marginBottom: '-1em',
    marginLeft: '4em',
    borderRadius: '50%',
  },
}, h.img({
  src: logoSrc,
  style: { width: '75px', height: '56.5px' }
}))

const keywordWrapper = h.style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '66em',
})

const content = h.div.style({
  background: color.selection,
  borderRadius: '0.5em',
  margin: '0 15px 15px',
  padding: '15px',
})

const labelEl = h.style('label', { display: 'flex', alignItems: 'baseline' })

const inputEl = h.style('input', {
  background: color.background,
  color: color.yellow,
  padding: '0.75em',
  margin: '1em',
  borderRadius: '0.2em',
  border: 'none',
  width: '100%',
})

const dbEl = h.span()
const tableEl = h.span()
const primaryEl = h.span.style({ color: pink })


// APP
const app = h.div.style({
  //display: 'flex',
  height: '100%',
  color: color.foreground,
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '70em',
  margin: '0 auto',
}, [
  h.div.style({ display: 'flex', alignItems: 'center', color: color.background }, [
    logo,
    h.div([ dbEl, '.', tableEl, '.', primaryEl ]),
  ]),
  content,
])



const similar = (a, b) => {
  if (!a && !b) return
}
const empty = Object.freeze(Object.create(null))
const isPrimary = field => field.ref === 'PRIMARY'
const display = h.replaceContent(content)
const loadRoute = route => {
  const [ dbName, tableName, ...selectParams ] = route.split('/')

  h.empty(dbEl)
  h.empty(tableEl)
  h.empty(primaryEl)

  const db = dbInfo[dbName]
  let i = -1
  if (!db) {
    return display(map.toArr((_, name) => dbLink({
      href: `/db/#/${name}`,
      style: { color: color[colorKeys[++i%colorKeys.length]] },
    }, name), dbInfo))
  }

  h.appendChild(dbEl, tableLink({
    href: `/db/#/${dbName}`,
    style: { color: orange },
  }, dbName))

  const table = db[tableName]
  if (!table) {
    return display(keywordWrapper(map.toArr((_, name) => tableLink({
      href: `/db/#/${dbName}/${name}/`,
      style: { color: color[colorKeys[++i%colorKeys.length]] },
    }, name), db)))
  }

  const href = `/db/#/${dbName}/${tableName}`
  h.appendChild(tableEl, tableLink({
    href,
    style: { color: cyan },
  }, tableName))

  const primaryFields = filter.toArr(isPrimary, table)
  if (selectParams.length) {
    const TABLE = `${dbName}.${tableName}`
    const WHERE = 'WHERE '+ selectParams
        .map((val, i) => `${primaryFields[i].name}="${val}"`)
        .join(' AND ')

    return Promise.all([
      query(`SELECT * FROM ${TABLE} ${WHERE}`),
      query(`SELECT * FROM ${dbName}_clean.${tableName} ${WHERE}`)
        .catch(() => []),
    ]).then(([results, originalResults]) => {
        const originalValues = originalResults[0] || empty
        const first = results[0]
        console.log({ first, originalResults })
        if (!first) {
          // should tell somehow that an error occured
          return router.set([ dbName, tableName ].join('/'))
        }
        h.appendChild(primaryEl, primaryFields.map(field => [
          h.span.style({ color: color.comment }, `${field.name}:`),
          `${first[field.name]}`,
        ]))

        const left = []
        const right = []
        each((value, name) => {
          if (/^unk([0-9]+)?$/.test(name)) return
          if (primaryFields.includes(table[name])) return
          const arr = (++i%2) ? right : left
          const original = originalValues === empty ? empty : originalValues[name]
          const hasDefaultValue = table[name].def === value
          const valueKey = hasDefaultValue ? 'placeholder' : 'value'

          const refresh = el => {
            if (original === value) {
              resetButton.style.display = 'none'
              return el.style.color = yellow
            }

            resetButton.style.display = ''
            el.style.color = green
          }

          const input = h.input({
            placeholder: table[name].def,
            [valueKey]: value,
            onfocus: ({ target: el }) => el.style.color = orange,
            onblur: ({ target: el }) => {
              if (!el.value) {
                hasDefaultValue || (el.value = table[name].def)
                return refresh(el)
              }
              if (el.value === value) {
                hasDefaultValue && (el.value = '')
                refresh(el)
              }
              query(`UPDATE ${TABLE} SET ${name}="${el.value}" ${WHERE}`)
                .then(() => {
                  value = table[name].value = el.value
                  refresh(el)
                })
                .catch(err => {
                  console.error(err)
                  el.style.color = red
                })

            },
            style: {
              border: 0,
              padding: '0 0.5em',
              height: '1.75em',
              width: '100%',
              background: 'transparent',
              color: original === value ? yellow : green,
            },
          })


          const resetButton = h.span({
            onclick: ({ target: el }) => {
              el.style.display = 'none'
              input.value = original
            },
            style: {
              fontSize: '1.35em',
              padding: '0 0.25em',
              color: color.comment,
              cursor: 'pointer',
              display: value === original ? 'none' : '',
            },
          }, '↺') // ⌀

          arr.push(labelEl.style({
            paddingLeft: '0.5em',
            background: color.background,
            margin: '0.5em 0.25em',
            borderRadius: '0.25em',
          }, [
            h.div.style({ paddingRight: '0.5em' }, name),
            input,
            resetButton,
          ]))
        }, first)

        display(h.div.style({ 
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }, [
          h.div.style({ flexGrow: '1' }, left),
          h.div.style({ flexGrow: '1' }, right),
        ]))
      })
  }

  display([
    primaryFields.map(({ name, def }) => labelEl([
      h.div.style({ width: '25em', textAlign: 'right' }, name),
      inputEl({ id: name, placeholder: def }),
    ])),
    dbLink({
      style: { color: green },
      href,
      onclick: e => {
        e.preventDefault()
        


        router.set([ dbName, tableName ]
          .concat(Array.from(document.getElementsByTagName('INPUT'))
            .map(el => el.value))
          .filter(val => val != undefined)
          .join('/'))
      },
    }, 'find')
  ])

}

query(`
  SELECT
    a.TABLE_NAME as tbl,
    a.COLUMN_NAME as name,
    a.TABLE_SCHEMA as db,
    a.COLUMN_DEFAULT as def,
    b.CONSTRAINT_NAME as ref
  FROM INFORMATION_SCHEMA.COLUMNS as a
  LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE as b
    ON a.TABLE_NAME = b.TABLE_NAME
    AND a.COLUMN_NAME = b.COLUMN_NAME
    AND a.COLUMN_NAME = b.COLUMN_NAME
  WHERE a.TABLE_SCHEMA != "information_schema"
  ORDER BY name
`).then(each(r => g(g(dbInfo, r.db), r.tbl)[r.name] = r))
  .then(() => {
    loadRoute(router())
    router(loadRoute)
  })
/*

db(dbName => query(`show databases`)
  .then(r => h.replaceContent(app, map.toArr(, r)))
*/

h.replaceContent(document.body, app)

Object.assign(window, {
  query,
  router,
})
