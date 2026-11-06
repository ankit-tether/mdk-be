'use strict'

const { rule } = require('../lib/rule')

module.exports = rule({
  id: 'performance.container.hashrate_down',
  version: 1,
  severity: 'P1',
  keyBy: 'container',
  inputs: { hr: { family: 'miner', metric: 'hashrate_avg', history: '1h' } },
  params: { floor: 5 },
  tunable: { floor: [1, 50] },
  clear: { for: '5m' },
  when: ({ hr, params }) => hr.length > 0 && hr.every((m) => m.covered('1h') && m.max('1h') < params.floor)
})
