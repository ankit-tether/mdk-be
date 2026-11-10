'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { rule } = require('../lib/rule')
const { runEngine, replay } = require('../lib/engine')
const { mergeLogs } = require('../lib/merge')
const rules = require('../rules')
const { site, T0 } = require('../sim/site')
const { generate } = require('../sim/generate')
const { asLiveLog } = require('../sim/logs')

const HOUR = 3_600_000
const { byWorker, interleaved } = generate(site, { start: T0, hours: 4, seed: 7 })

const collect = async (iterable) => {
  const out = []
  for await (const item of iterable) out.push(item)
  return out
}

test('the injected faults open the expected findings', () => {
  const { events } = replay(interleaved, { rules, site })
  const opened = events.filter((e) => e.type === 'finding.opened').map((e) => `${e.rule} ${e.key}`)

  assert.ok(opened.includes('anomaly.container.power_and_heat@1 c01'))
  assert.ok(opened.includes('performance.hashrate.below_floor@1 m-c02-3'))
  assert.ok(opened.includes('performance.container.hashrate_down@1 c02'))
  assert.ok(!opened.some((o) => o.endsWith(' c01') && o.includes('hashrate')))

  const floor = events.find((e) => e.type === 'finding.opened' && e.key === 'm-c02-3')
  assert.equal(floor.at, T0 + 2 * HOUR)
})

test('merged live logs produce the same findings as an in-order replay', async () => {
  const logs = site.workers.map((w) => asLiveLog(byWorker[w], { every: 7 }))
  const live = await collect(runEngine(mergeLogs(logs), { rules, site }))
  assert.deepEqual(live, replay(interleaved, { rules, site }).events)
})

test('findings do not depend on the order Worker logs arrive in', () => {
  const inOrder = replay(interleaved, { rules, site })
  const burst = replay(site.workers.flatMap((w) => byWorker[w]), { rules, site })
  assert.deepEqual(burst.events, inOrder.events)
})

test('a JSON checkpoint resumes with no gap and no duplicate', () => {
  const full = replay(interleaved, { rules, site })
  const cut = Math.floor(interleaved.length / 3)
  const first = replay(interleaved.slice(0, cut), { rules, site })
  const resumed = replay(interleaved.slice(cut), { rules, site, state: JSON.parse(JSON.stringify(first.state)) })
  assert.deepEqual([...first.events, ...resumed.events], full.events)
})

test('a small checkpoint of episodes resumes by replaying the declared history from the log', () => {
  const full = replay(interleaved, { rules, site })
  const cut = Math.floor(interleaved.length * 0.8)
  const first = replay(interleaved.slice(0, cut), { rules, site })

  const checkpoint = JSON.stringify({ offset: cut, nextEval: first.state.nextEval, episodes: first.state.episodes })
  assert.ok(checkpoint.length < 4096)

  const { nextEval, episodes } = JSON.parse(checkpoint)
  const historyMs = Math.max(...rules.flatMap((r) => Object.values(r.inputs).map((i) => i.historyMs)))
  const warmFrom = interleaved.findIndex((b) => b.ts >= nextEval - historyMs - 60_000)
  assert.ok(warmFrom < cut)

  const state = { series: {}, watermarks: {}, nextEval, episodes }
  const resumed = replay(interleaved.slice(warmFrom), { rules, site, state })
  assert.deepEqual([...first.events, ...resumed.events], full.events)
})

test('a rule set swapped mid-stream applies from the next block', async () => {
  const tightened = rules.map((r) => (r.id === 'performance.hashrate.below_floor' ? { ...r, params: { floor: 1 } } : r))
  let current = rules
  let seen = 0
  const blocks = (function * () {
    for (const block of interleaved) {
      if (++seen === Math.floor(interleaved.length / 4)) current = tightened
      yield block
    }
  })()

  const events = await collect(runEngine(blocks, { rules: () => current, site }))
  const floorOpens = events.filter((e) => e.type === 'finding.opened' && e.rule.startsWith('performance.hashrate.below_floor'))
  assert.equal(floorOpens.length, 0)
})

test('mergeLogs reads at most one block ahead per log', async () => {
  const pulled = { a: 0, b: 0 }
  const counting = (name, n) => (async function * () {
    for (let i = 0; i < n; i++) {
      pulled[name]++
      yield { name, i }
    }
  })()

  let consumed = 0
  for await (const item of mergeLogs([counting('a', 100), counting('b', 100)])) {
    consumed++
    assert.ok(pulled.a + pulled.b <= consumed + 2, `read ahead too far at ${item.name}:${item.i}`)
    if (consumed === 30) break
  }
})

test('a rule reading past its declared history reports an error instead of a finding', () => {
  const greedy = rule({
    id: 'test.greedy',
    version: 1,
    severity: 'P4',
    keyBy: 'device',
    inputs: { hr: { family: 'miner', metric: 'hashrate_avg', history: '30m' } },
    when: ({ hr }) => hr.max('1h') < 5
  })
  const { events } = replay(interleaved.slice(0, 200), { rules: [greedy], site })
  assert.ok(events.length > 0)
  assert.ok(events.every((e) => e.type === 'rule.error' && /ERR_WINDOW_EXCEEDS_HISTORY/.test(e.error)))
})
