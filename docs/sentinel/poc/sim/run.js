'use strict'

const { of, lastValueFrom, toArray } = require('rxjs')
const { engine$, initialState } = require('../lib/engine')

async function run (blocks$, { rules, site, initial = initialState() }) {
  const accs = await lastValueFrom(engine$(blocks$, { rules$: of(rules), site, initial }).pipe(toArray()))
  return { events: accs.flatMap((acc) => acc.events), state: initial }
}

module.exports = { run }
