'use strict'

const assert = require('node:assert/strict')
const { from, merge, of } = require('rxjs')
const { engine$, events } = require('./lib/engine')
const rules = require('./rules')
const { site, T0 } = require('./sim/site')
const { generate } = require('./sim/generate')
const { run } = require('./sim/run')

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
  console.log(`Replaying ${interleaved.length} blocks from ${site.workers.length} Workers (4 h of event time)\n`)

  const live$ = engine$(from(interleaved), { rules$: of(rules), site })
  await new Promise((resolve, reject) => events(live$).subscribe({ next: print, error: reject, complete: resolve }))

  const inOrder = await run(from(interleaved), { rules, site })

  const burst = await run(merge(...site.workers.map((w) => from(byWorker[w]))), { rules, site })
  assert.deepEqual(burst.events, inOrder.events)

  const cut = Math.floor(interleaved.length / 2)
  const first = await run(from(interleaved.slice(0, cut)), { rules, site })
  const checkpoint = JSON.stringify(first.state)
  const resumed = await run(from(interleaved.slice(cut)), { rules, site, initial: JSON.parse(checkpoint) })
  assert.deepEqual([...first.events, ...resumed.events], inOrder.events)

  console.log('\nChecks')
  console.log('  same findings when one Worker\'s whole log arrives before the other\'s (event time, not arrival time)')
  console.log(`  same findings after a restart from a ${(checkpoint.length / 1024).toFixed(0)} KB JSON checkpoint at block ${cut}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
