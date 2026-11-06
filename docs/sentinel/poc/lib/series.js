'use strict'

const { ms } = require('./duration')

const BUCKET_MS = 60_000

function record (series, ts, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return
  const k = Math.floor(ts / BUCKET_MS)
  const b = series.buckets[k]
  if (!b) {
    series.buckets[k] = { sum: value, count: 1, min: value, max: value, lastTs: ts, last: value }
  } else {
    b.sum += value
    b.count += 1
    b.min = Math.min(b.min, value)
    b.max = Math.max(b.max, value)
    if (ts >= b.lastTs) {
      b.lastTs = ts
      b.last = value
    }
  }
  if (series.first === null || ts < series.first) series.first = ts
}

function prune (series, beforeTs) {
  for (const k of Object.keys(series.buckets)) {
    if ((Number(k) + 1) * BUCKET_MS <= beforeTs) delete series.buckets[k]
  }
}

// A read-only view of one series as of event time `at`: only buckets that end at or before `at` are visible,
// so a Worker that is ahead of the watermark cannot leak future readings into an evaluation.
function view (series, at, historyMs) {
  const end = Math.floor(at / BUCKET_MS)

  const windowMs = (w) => {
    const wMs = ms(w)
    if (wMs > historyMs) throw new Error(`ERR_WINDOW_EXCEEDS_HISTORY: ${w} is longer than the declared history`)
    return wMs
  }

  const pick = (w) => {
    const from = end - Math.ceil(windowMs(w) / BUCKET_MS)
    const out = []
    if (!series) return out
    for (let k = from; k < end; k++) {
      if (series.buckets[k]) out.push(series.buckets[k])
    }
    return out
  }

  const count = (bs) => bs.reduce((n, b) => n + b.count, 0)
  const latest = series && series.buckets[end - 1]

  return Object.freeze({
    now: latest ? latest.last : undefined,
    count: (w) => count(pick(w)),
    mean: (w) => {
      const bs = pick(w)
      const n = count(bs)
      return n ? bs.reduce((s, b) => s + b.sum, 0) / n : NaN
    },
    min: (w) => {
      const bs = pick(w)
      return bs.length ? Math.min(...bs.map((b) => b.min)) : NaN
    },
    max: (w) => {
      const bs = pick(w)
      return bs.length ? Math.max(...bs.map((b) => b.max)) : NaN
    },
    covered: (w) => {
      const wMs = windowMs(w)
      return Boolean(series) && series.first !== null && series.first <= at - wMs
    }
  })
}

module.exports = { BUCKET_MS, record, prune, view }
