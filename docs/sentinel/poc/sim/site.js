'use strict'

const T0 = Date.UTC(2026, 10, 6, 0, 0, 0)

const devices = {}
const containers = {}

for (const c of ['c01', 'c02']) {
  const containerDevice = `as-${c}`
  containers[c] = { device: containerDevice }
  devices[containerDevice] = { family: 'container', brand: 'antspace', container: c, worker: 'as-1' }
  for (let i = 1; i <= 4; i++) {
    devices[`m-${c}-${i}`] = { family: 'miner', brand: 'whatsminer', model: 'M56S', container: c, worker: 'wm-1' }
  }
}

const site = {
  workers: ['wm-1', 'as-1'],
  cadenceMs: { 'wm-1': 10_000, 'as-1': 30_000 },
  containers,
  devices
}

module.exports = { site, T0 }
