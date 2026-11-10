'use strict'

// Stands in for a Worker's pull loop: an async iterable that hands over one block at a time and yields to the event
// loop every `every` blocks, the way Kernel reads would.
async function * asLiveLog (blocks, { every = 50 } = {}) {
  let n = 0
  for (const block of blocks) {
    if (++n % every === 0) await new Promise((resolve) => setImmediate(resolve))
    yield block
  }
}

module.exports = { asLiveLog }
