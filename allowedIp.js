module.exports = [
  "127.0.0.1",
  "89.84.91.68",  // aos
  "78.224.65.10", // spam
  "31.38.18.133", // thai
].reduce((set, ip) => {
  set.add(`::ffff:${ip}`)
  set.add(ip)
  return set
}, new Set())
