'use strict'

const { createHash } = require('node:crypto')
const { scan, withLatestFrom, concatMap, share } = require('rxjs')
const { BUCKET_MS, record, prune, view } = require('./series')

const EVAL_EVERY_MS = BUCKET_MS

// Everything the engine knows lives in this one plain object, so a checkpoint is JSON.stringify(state)
// and a restart is engine$(rest, { initial: JSON.parse(checkpoint) }).
function initialState () {
  return { series: {}, watermarks: {}, nextEval: null, episodes: {} }
}

function step (state, block, rules, site) {
  const events = []

  if (block.type === 'reading') {
    for (const [metric, value] of Object.entries(block.metrics)) {
      const key = `${block.deviceId}/${metric}`
      const series = state.series[key] || (state.series[key] = { first: null, buckets: {} })
      record(series, block.ts, value)
    }
    return { state, events }
  }

  if (block.type !== 'sweep') return { state, events }

  state.watermarks[block.worker] = block.ts
  const wm = watermark(state, site)
  if (wm === null) return { state, events }

  if (state.nextEval === null) state.nextEval = Math.ceil(wm / EVAL_EVERY_MS) * EVAL_EVERY_MS
  while (state.nextEval <= wm) {
    evaluate(state, rules, site, state.nextEval, events)
    state.nextEval += EVAL_EVERY_MS
  }

  const horizon = Math.max(0, ...rules.flatMap((r) => Object.values(r.inputs).map((i) => i.historyMs)))
  for (const series of Object.values(state.series)) prune(series, state.nextEval - horizon - EVAL_EVERY_MS)

  return { state, events }
}

// Event time, not arrival time: rules for minute M run only once every Worker has swept past M.
function watermark (state, site) {
  let wm = Infinity
  for (const worker of site.workers) {
    const ts = state.watermarks[worker]
    if (ts === undefined) return null
    wm = Math.min(wm, ts)
  }
  return wm
}

function evaluate (state, rules, site, at, events) {
  for (const r of rules) {
    for (const key of keysFor(r, site)) {
      let hit
      let clearHit
      try {
        const ctx = context(r, key, state, site, at)
        hit = Boolean(r.when(ctx))
        clearHit = r.clearWhen ? Boolean(r.clearWhen(ctx)) : !hit
      } catch (err) {
        events.push({ type: 'rule.error', rule: `${r.id}@${r.version}`, key, at, error: err.message })
        continue
      }
      advance(state, r, key, at, hit, clearHit, events)
    }
  }
}

function keysFor (r, site) {
  if (r.keyBy === 'container') return Object.keys(site.containers)
  const [first] = Object.values(r.inputs)
  return Object.keys(site.devices).filter((id) => matches(site.devices[id], first.select))
}

// keyBy 'container': the container's own device arrives as one series, the devices inside it as an array.
function context (r, key, state, site, at) {
  const inputs = {}
  for (const [name, input] of Object.entries(r.inputs)) {
    const seriesOf = (id) => view(state.series[`${id}/${input.metric}`], at, input.historyMs)
    if (r.keyBy === 'device') {
      inputs[name] = seriesOf(key)
      continue
    }
    const own = site.containers[key].device
    if (own && matches(site.devices[own], input.select)) {
      inputs[name] = seriesOf(own)
    } else {
      const inside = Object.keys(site.devices).filter((id) => {
        const d = site.devices[id]
        return id !== own && d.container === key && matches(d, input.select)
      })
      inputs[name] = Object.freeze(inside.map(seriesOf))
    }
  }
  return Object.freeze({ ...inputs, params: r.params, key, at })
}

function matches (device, select) {
  return Object.entries(select).every(([field, value]) => device[field] === value)
}

// One finding per episode: idle -> pending (for) -> open -> clearing (clear.for) -> closed.
function advance (state, r, key, at, hit, clearHit, events) {
  const id = `${r.id}@${r.version}|${key}`
  const ep = state.episodes[id] || (state.episodes[id] = { status: 'idle' })
  const rule = `${r.id}@${r.version}`

  if (ep.status === 'idle' && hit) Object.assign(ep, { status: 'pending', firstSeen: at })

  if (ep.status === 'pending') {
    if (!hit) {
      state.episodes[id] = { status: 'idle' }
      return
    }
    if (at - ep.firstSeen < r.forMs) return
    ep.status = 'open'
    ep.findingId = findingId(rule, key, ep.firstSeen)
    events.push({ type: 'finding.opened', id: ep.findingId, rule, severity: r.severity, key, firstSeen: ep.firstSeen, at })
    return
  }

  if (ep.status === 'open' && clearHit) Object.assign(ep, { status: 'clearing', clearSince: at })

  if (ep.status === 'clearing') {
    if (!clearHit) {
      ep.status = 'open'
      return
    }
    if (at - ep.clearSince < r.clearMs) return
    events.push({ type: 'finding.closed', id: ep.findingId, rule, severity: r.severity, key, firstSeen: ep.firstSeen, at })
    state.episodes[id] = { status: 'idle' }
  }
}

function findingId (rule, key, firstSeen) {
  return createHash('sha256').update(`${rule}|${key}|${firstSeen}`).digest('hex').slice(0, 12)
}

// rules$ is broadcast state: push a new rule set and the next block is evaluated with it.
function engine$ (blocks$, { rules$, site, initial = initialState() }) {
  return blocks$.pipe(
    withLatestFrom(rules$),
    scan((acc, [block, rules]) => step(acc.state, block, rules, site), { state: initial, events: [] }),
    share()
  )
}

function events (run$) {
  return run$.pipe(concatMap((acc) => acc.events))
}

module.exports = { engine$, events, initialState, step }
