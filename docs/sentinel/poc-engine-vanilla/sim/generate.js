'use strict'

const MIN = 60_000
const HOUR = 60 * MIN

// Faults injected into the synthetic site, relative to the start time:
// - 02:00 to 02:40  m-c01-1 draws 15% more power and the c01 outlet heats by 4 °C (rule 1)
// - from 01:00      m-c02-3 hashes at about 2 TH/s (rule 2, per miner)
// - from 02:45      every miner in c02 hashes at about 1 TH/s (rule 2, container down)
function generate (site, { start, hours, seed = 1 }) {
  const rand = mulberry32(seed)
  const noise = () => rand() * 2 - 1
  const ramp = (t, from, over) => Math.max(0, Math.min(1, (t - from) / over))
  const between = (t, a, b) => t >= a && t < b

  const byWorker = {}
  const groups = []

  site.workers.forEach((worker, order) => {
    byWorker[worker] = []
    const ids = Object.keys(site.devices).filter((id) => site.devices[id].worker === worker)
    for (let ts = start; ts <= start + hours * HOUR; ts += site.cadenceMs[worker]) {
      const t = ts - start
      const blocks = ids.map((deviceId) => ({ type: 'reading', worker, deviceId, ts, metrics: metricsFor(deviceId, t) }))
      blocks.push({ type: 'sweep', worker, ts, devices: ids.length, answered: ids.length })
      byWorker[worker].push(...blocks)
      groups.push({ ts, order, blocks })
    }
  })

  groups.sort((a, b) => a.ts - b.ts || a.order - b.order)
  const interleaved = groups.flatMap((g) => g.blocks)

  return { byWorker, interleaved }

  function metricsFor (deviceId, t) {
    const d = site.devices[deviceId]
    if (d.family === 'container') {
      let temp = 38 + noise() * 0.3
      if (deviceId === 'as-c01' && between(t, 2 * HOUR, 2 * HOUR + 40 * MIN)) temp += 4 * ramp(t, 2 * HOUR, 10 * MIN)
      return { outlet_temp: round(temp) }
    }
    let power = 3400 + noise() * 30
    if (deviceId === 'm-c01-1' && between(t, 2 * HOUR, 2 * HOUR + 40 * MIN)) power *= 1 + 0.15 * ramp(t, 2 * HOUR, 5 * MIN)
    let hashrate = 220 + noise() * 3
    if (deviceId === 'm-c02-3' && t >= HOUR) hashrate = 2 + noise() * 0.3
    if (d.container === 'c02' && t >= 2 * HOUR + 45 * MIN) hashrate = 1 + noise() * 0.2
    return { power: round(power), hashrate_avg: round(hashrate) }
  }
}

function round (v) {
  return Math.round(v * 100) / 100
}

function mulberry32 (seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

module.exports = { generate }
