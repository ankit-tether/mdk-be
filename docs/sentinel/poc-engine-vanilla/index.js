'use strict'

const assert = require('node:assert/strict')
const { runEngine, replay } = require('./lib/engine')
const { mergeLogs } = require('./lib/merge')
const rules = require('./rules')
const { site, T0 } = require('./sim/site')
const { generate } = require('./sim/generate')
const { asLiveLog } = require('./sim/logs')

const { byWorker, interleaved } = generate(site, { start: T0, hours: 4, seed: 7 })

const clock = (ts) => {
  const m = Math.round((ts - T0) / 60_000)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const print = (e) => {
  if (e.type === 'rule.error') return console.log(`${clock(e.at)}  ERROR  ${e.rule}  ${e.key}  ${e.error}`)
  const verb = e.type === 'finding.opened' ? 'OPEN ' : 'CLOSE'
  console.log(`${clock(e.at)}  ${verb}  ${e.severity}  ${e.rule.padEnd(40)} ${e.key.padEnd(8)} since ${clock(e.firstSeen)}  ${e.id}`)
}

async function main () {
  console.log(`Streaming ${interleaved.length} blocks from ${site.workers.length} live Worker logs (4 h of event time)\n`)

  const logs = site.workers.map((w) => asLiveLog(byWorker[w]))
  const live = []
  for await (const event of runEngine(mergeLogs(logs), { rules, site })) {
    print(event)
    live.push(event)
  }

  const inOrder = replay(interleaved, { rules, site })
  assert.deepEqual(live, inOrder.events)

  const burst = replay(site.workers.flatMap((w) => byWorker[w]), { rules, site })
  assert.deepEqual(burst.events, inOrder.events)

  const cut = Math.floor(interleaved.length / 2)
  const first = replay(interleaved.slice(0, cut), { rules, site })
  const checkpoint = JSON.stringify(first.state)
  const resumed = replay(interleaved.slice(cut), { rules, site, state: JSON.parse(checkpoint) })
  assert.deepEqual([...first.events, ...resumed.events], inOrder.events)

  const started = process.hrtime.bigint()
  replay(interleaved, { rules, site })
  const ms = Number(process.hrtime.bigint() - started) / 1e6

  console.log('\nChecks')
  console.log('  same findings from the merged live logs as from an in-order replay')
  console.log('  same findings when one Worker\'s whole log arrives before the other\'s (event time, not arrival time)')
  console.log(`  same findings after a restart from a ${(checkpoint.length / 1024).toFixed(0)} KB JSON checkpoint at block ${cut}`)
  console.log(`  replay of ${interleaved.length} blocks: ${ms.toFixed(0)} ms`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
