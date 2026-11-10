'use strict'

const { rule } = require('../lib/rule')

module.exports = rule({
  id: 'anomaly.container.power_and_heat',
  version: 1,
  severity: 'P2',
  keyBy: 'container',
  inputs: {
    power: { family: 'miner', model: 'M56S', metric: 'power', history: '1h' },
    temp: { family: 'container', brand: 'antspace', metric: 'outlet_temp', history: '30m' }
  },
  params: { marginPct: 10, deltaC: 2 },
  tunable: { marginPct: [2, 50], deltaC: [1, 10] },
  for: '5m',
  clear: { for: '10m' },
  when: ({ power, temp, params }) =>
    power.some((m) => m.covered('1h') && m.now > m.mean('1h') * (1 + params.marginPct / 100)) &&
    temp.covered('30m') && temp.now > temp.mean('30m') + params.deltaC
})
