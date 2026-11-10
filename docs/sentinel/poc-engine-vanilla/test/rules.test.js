'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { tune } = require('../lib/rule')
const powerAndHeat = require('../rules/container-power-and-heat')
const hashrateBelowFloor = require('../rules/hashrate-below-floor')
const containerHashrateDown = require('../rules/container-hashrate-down')

const series = ({ now, mean, max, covered = true }) => ({ now, mean: () => mean, max: () => max, covered: () => covered })

test('hashrate below floor needs a full hour below the floor', () => {
  const { when, params } = hashrateBelowFloor
  assert.equal(when({ hr: series({ max: 3 }), params }), true)
  assert.equal(when({ hr: series({ max: 7 }), params }), false)
  assert.equal(when({ hr: series({ max: 3, covered: false }), params }), false)
})

test('container hashrate down needs every miner below the floor', () => {
  const { when, params } = containerHashrateDown
  assert.equal(when({ hr: [series({ max: 1 }), series({ max: 2 })], params }), true)
  assert.equal(when({ hr: [series({ max: 1 }), series({ max: 220 })], params }), false)
  assert.equal(when({ hr: [], params }), false)
})

test('power and heat needs both the power rise and the heat rise', () => {
  const { when, params } = powerAndHeat
  const hot = series({ now: 42, mean: 38 })
  const cool = series({ now: 38.5, mean: 38 })
  const high = series({ now: 3900, mean: 3400 })
  const normal = series({ now: 3410, mean: 3400 })
  assert.equal(when({ power: [normal, high], temp: hot, params }), true)
  assert.equal(when({ power: [normal, high], temp: cool, params }), false)
  assert.equal(when({ power: [normal, normal], temp: hot, params }), false)
})

test('operators can tune only declared params, within bounds', () => {
  assert.equal(tune(powerAndHeat, { marginPct: 20 }).params.marginPct, 20)
  assert.throws(() => tune(powerAndHeat, { marginPct: 80 }), /ERR_PARAM_OUT_OF_BOUNDS/)
  assert.throws(() => tune(powerAndHeat, { minMiners: 2 }), /ERR_PARAM_NOT_TUNABLE/)
})
