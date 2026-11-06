'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { from, merge, lastValueFrom, filter, bufferTime, map, toArray } = require('rxjs')
const { EventTimeScheduler, orderByEventTime, inEventTime } = require('../lib/event-time')
const { site, T0 } = require('../sim/site')
const { generate } = require('../sim/generate')

const { byWorker, interleaved } = generate(site, { start: T0, hours: 4, seed: 7 })
const burst$ = () => merge(...site.workers.map((w) => from(byWorker[w])))

const readingsPerMinute = (blocks$) => {
  const scheduler = new EventTimeScheduler(T0)
  return lastValueFrom(blocks$.pipe(
    orderByEventTime(site.workers),
    inEventTime(scheduler),
    filter((b) => b.type === 'reading'),
    bufferTime(60_000, scheduler),
    map((buffer) => buffer.length),
    toArray()
  ))
}

test('orderByEventTime gives one order whatever the arrival order', async () => {
  const ordered = (blocks$) => lastValueFrom(blocks$.pipe(orderByEventTime(site.workers), toArray()))
  assert.deepEqual(await ordered(burst$()), interleaved)
  assert.deepEqual(await ordered(from(interleaved)), interleaved)
})

test('bufferTime on the event-time scheduler closes windows on reading timestamps', async () => {
  const windows = await readingsPerMinute(from(interleaved))
  assert.equal(windows.length, 241)
  assert.ok(windows.slice(0, 240).every((n) => n === 52))
  assert.equal(windows[240], 10)
  assert.deepEqual(await readingsPerMinute(burst$()), windows)
})

test('bufferTime on the default scheduler puts a fast replay in a single window', async () => {
  const windows = await lastValueFrom(from(interleaved).pipe(
    filter((b) => b.type === 'reading'),
    bufferTime(60_000),
    map((buffer) => buffer.length),
    toArray()
  ))
  assert.equal(windows.length, 1)
})
