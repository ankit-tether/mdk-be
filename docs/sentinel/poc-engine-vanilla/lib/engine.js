'use strict'

const { createHash } = require('node:crypto')
const { BUCKET_MS, record, prune, view } = require('./series')

const EVAL_EVERY_MS = BUCKET_MS

// Everything the engine knows lives in this one plain object, so a checkpoint is JSON.stringify(state)
// and a restart is runEngine(rest, { state: JSON.parse(checkpoint) }).
function initialState () {
  return { series: {}, watermarks: {}, nextEval: null, episodes: {} }
}

// Applies one block to the state and returns the finding events it produced.
// Readings only fill buckets. Only a sweep marker moves event time forward, so it is the only block that can
// trigger an evaluation; this is what makes the result independent of how blocks from different logs interleave.
function step (state, block, rules, site) {
  const events = []

  if (block.type === 'reading') {
    for (const [metric, value] of Object.entries(block.metrics)) {
      const key = `${block.deviceId}/${metric}`
      const series = state.series[key] || (state.series[key] = { first: null, buckets: {} })
      record(series, block.ts, value)
    }
    return events
  }

  if (block.type !== 'sweep') return events

  state.watermarks[block.worker] = block.ts
  const wm = watermark(state, site)
  if (wm === null) return events

  // One watermark jump can cross several minute boundaries (a slow Worker catching up); each is evaluated in order,
  // as if the blocks had arrived on time.
  if (state.nextEval === null) state.nextEval = Math.ceil(wm / EVAL_EVERY_MS) * EVAL_EVERY_MS
  while (state.nextEval <= wm) {
    evaluate(state, rules, site, state.nextEval, events)
    state.nextEval += EVAL_EVERY_MS
  }

  // Keep one bucket beyond the longest declared history, so the oldest window a rule may ask for stays complete.
  const horizon = Math.max(0, ...rules.flatMap((r) => Object.values(r.inputs).map((i) => i.historyMs)))
  for (const series of Object.values(state.series)) prune(series, state.nextEval - horizon - EVAL_EVERY_MS)

  return events
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
      // A failing rule must never stop the others: its error becomes an event and its episode is left as it was.
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

// Derived only from the rule version, the key and the episode start, so a replay or a restart reproduces the same ID
// and the case engine can drop duplicates.
function findingId (rule, key, firstSeen) {
  return createHash('sha256').update(`${rule}|${key}|${firstSeen}`).digest('hex').slice(0, 12)
}

// Live or replay: blocks is any iterable or async iterable. `rules` may be a function, read on every block, so
// swapping the rule set it returns applies from the next block with no restart.
async function * runEngine (blocks, { rules, site, state = initialState() }) {
  const currentRules = typeof rules === 'function' ? rules : () => rules
  for await (const block of blocks) {
    yield * step(state, block, currentRules(), site)
  }
}

// The synchronous form, for backtests and tests over an array of blocks.
function replay (blocks, { rules, site, state = initialState() }) {
  const events = []
  for (const block of blocks) events.push(...step(state, block, rules, site))
  return { events, state }
}

module.exports = { initialState, step, runEngine, replay }
