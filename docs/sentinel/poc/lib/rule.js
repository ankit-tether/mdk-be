'use strict'

const { ms } = require('./duration')

const KEYS = ['device', 'container']
const SEVERITIES = ['P1', 'P2', 'P3', 'P4']
const SELECTORS = ['family', 'brand', 'model']

function rule (def) {
  const fail = (msg) => { throw new Error(`ERR_RULE_INVALID: ${def && def.id}: ${msg}`) }

  if (!def || typeof def.id !== 'string') fail('id is required')
  if (!Number.isInteger(def.version)) fail('version must be an integer')
  if (!SEVERITIES.includes(def.severity)) fail(`severity must be one of ${SEVERITIES.join(', ')}`)
  if (!KEYS.includes(def.keyBy)) fail(`keyBy must be one of ${KEYS.join(', ')}`)
  if (typeof def.when !== 'function') fail('when must be a function')

  const inputs = Object.entries(def.inputs || {})
  if (inputs.length === 0) fail('at least one input is required')

  const params = { ...def.params }
  const tunable = { ...def.tunable }
  for (const [name, bounds] of Object.entries(tunable)) {
    if (!inBounds(params[name], bounds)) fail(`param ${name} outside [${bounds}]`)
  }

  const clear = def.clear || {}

  return Object.freeze({
    id: def.id,
    version: def.version,
    severity: def.severity,
    keyBy: def.keyBy,
    inputs: Object.freeze(Object.fromEntries(inputs.map(([name, input]) => {
      if (!input.metric) fail(`input ${name} needs a metric`)
      const select = Object.fromEntries(SELECTORS.filter((f) => input[f] !== undefined).map((f) => [f, input[f]]))
      return [name, Object.freeze({ metric: input.metric, select, historyMs: ms(input.history || '0s') })]
    }))),
    params: Object.freeze(params),
    tunable: Object.freeze(tunable),
    forMs: ms(def.for || '0s'),
    clearMs: ms(clear.for || '0s'),
    clearWhen: clear.when || null,
    when: def.when
  })
}

function tune (r, overrides) {
  for (const [name, value] of Object.entries(overrides)) {
    const bounds = r.tunable[name]
    if (!bounds) throw new Error(`ERR_PARAM_NOT_TUNABLE: ${r.id}: ${name}`)
    if (!inBounds(value, bounds)) throw new Error(`ERR_PARAM_OUT_OF_BOUNDS: ${r.id}: ${name}=${value} outside [${bounds}]`)
  }
  return Object.freeze({ ...r, params: Object.freeze({ ...r.params, ...overrides }) })
}

function inBounds (value, [min, max]) {
  return typeof value === 'number' && value >= min && value <= max
}

module.exports = { rule, tune }
