'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { from, merge } = require('rxjs')
const { rule } = require('../lib/rule')
const rules = require('../rules')
const { site, T0 } = require('../sim/site')
const { generate } = require('../sim/generate')
const { run } = require('../sim/run')

const HOUR = 3_600_000
const { byWorker, interleaved } = generate(site, { start: T0, hours: 4, seed: 7 })

test('the injected faults open the expected findings', async () => {
  const { events } = await run(from(interleaved), { rules, site })
  const opened = events.filter((e) => e.type === 'finding.opened').map((e) => `${e.rule} ${e.key}`)

  assert.ok(opened.includes('anomaly.container.power_and_heat@1 c01'))
  assert.ok(opened.includes('performance.hashrate.below_floor@1 m-c02-3'))
  assert.ok(opened.includes('performance.container.hashrate_down@1 c02'))
  assert.ok(!opened.some((o) => o.endsWith(' c01') && o.includes('hashrate')))

  const floor = events.find((e) => e.type === 'finding.opened' && e.key === 'm-c02-3')
  assert.equal(floor.at, T0 + 2 * HOUR)
})

test('findings do not depend on the order Worker logs arrive in', async () => {
  const inOrder = await run(from(interleaved), { rules, site })
  const burst = await run(merge(...site.workers.map((w) => from(byWorker[w]))), { rules, site })
  assert.deepEqual(burst.events, inOrder.events)
})

test('a JSON checkpoint resumes with no gap and no duplicate', async () => {
  const full = await run(from(interleaved), { rules, site })
  const cut = Math.floor(interleaved.length / 3)
  const first = await run(from(interleaved.slice(0, cut)), { rules, site })
  const resumed = await run(from(interleaved.slice(cut)), { rules, site, initial: JSON.parse(JSON.stringify(first.state)) })
  assert.deepEqual([...first.events, ...resumed.events], full.events)
})

test('a small checkpoint of episodes resumes by replaying the declared history from the log', async () => {
  const full = await run(from(interleaved), { rules, site })
  const cut = Math.floor(interleaved.length * 0.8)
  const first = await run(from(interleaved.slice(0, cut)), { rules, site })

  const checkpoint = JSON.stringify({ offset: cut, nextEval: first.state.nextEval, episodes: first.state.episodes })
  assert.ok(checkpoint.length < 4096)

  const { nextEval, episodes } = JSON.parse(checkpoint)
  const historyMs = Math.max(...rules.flatMap((r) => Object.values(r.inputs).map((i) => i.historyMs)))
  const warmFrom = interleaved.findIndex((b) => b.ts >= nextEval - historyMs - 60_000)
  assert.ok(warmFrom < cut)

  const initial = { series: {}, watermarks: {}, nextEval, episodes }
  const resumed = await run(from(interleaved.slice(warmFrom)), { rules, site, initial })
  assert.deepEqual([...first.events, ...resumed.events], full.events)
})

test('a rule reading past its declared history reports an error instead of a finding', async () => {
  const greedy = rule({
    id: 'test.greedy',
    version: 1,
    severity: 'P4',
    keyBy: 'device',
    inputs: { hr: { family: 'miner', metric: 'hashrate_avg', history: '30m' } },
    when: ({ hr }) => hr.max('1h') < 5
  })
  const { events } = await run(from(interleaved.slice(0, 200)), { rules: [greedy], site })
  assert.ok(events.length > 0)
  assert.ok(events.every((e) => e.type === 'rule.error' && /ERR_WINDOW_EXCEEDS_HISTORY/.test(e.error)))
})
