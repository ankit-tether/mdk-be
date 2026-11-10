'use strict'

// Merges several Worker logs into one async iterable, yielding blocks as each log produces them. Each log has at most
// one block read ahead, so a slow consumer slows every log down instead of letting blocks pile up in memory.
async function * mergeLogs (logs) {
  const iterators = logs.map((log) => (log[Symbol.asyncIterator] ? log[Symbol.asyncIterator]() : log[Symbol.iterator]()))
  const pending = new Map()
  const pull = (it) => pending.set(it, Promise.resolve(it.next()).then((result) => ({ it, result })))

  iterators.forEach(pull)
  try {
    while (pending.size > 0) {
      const { it, result } = await Promise.race(pending.values())
      if (result.done) {
        pending.delete(it)
        continue
      }
      // Asking this log for its next block before yielding is the one-block read-ahead; nothing more is requested
      // until the consumer comes back for the next value.
      pull(it)
      yield result.value
    }
  } finally {
    for (const it of iterators) {
      if (typeof it.return === 'function') await it.return()
    }
  }
}

module.exports = { mergeLogs }
