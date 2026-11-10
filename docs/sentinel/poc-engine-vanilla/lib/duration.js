'use strict'

const UNITS = { s: 1000, m: 60_000, h: 3_600_000 }

function ms (duration) {
  if (typeof duration === 'number') return duration
  const match = /^(\d+)(s|m|h)$/.exec(String(duration))
  if (!match) throw new Error(`ERR_DURATION_INVALID: ${duration}`)
  return Number(match[1]) * UNITS[match[2]]
}

module.exports = { ms }
