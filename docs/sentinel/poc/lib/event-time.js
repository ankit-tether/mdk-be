'use strict'

const { Observable, VirtualTimeScheduler, VirtualAction } = require('rxjs')

// A scheduler whose clock is event time. RxJS time operators given this scheduler (bufferTime, windowTime,
// debounceTime, ...) fire on the readings' timestamps, so a 4 h replay and a live run produce the same windows.
class EventTimeScheduler extends VirtualTimeScheduler {
  constructor (start = 0) {
    super(VirtualAction, Infinity)
    this.frame = start
  }

  advanceTo (ts) {
    if (ts <= this.frame) return
    this.maxFrames = ts
    this.flush()
    this.frame = ts
  }
}

// Merges Worker logs that arrive in any interleaving into one stream in event-time order. A block is released once
// every Worker has swept at or past it, so the order is the same live, on replay and after a restart.
function orderByEventTime (workers) {
  return (source) => new Observable((subscriber) => {
    const queues = new Map(workers.map((w) => [w, []]))
    const swept = new Map()

    const release = (horizon) => {
      for (;;) {
        let pick = null
        for (const w of workers) {
          const head = queues.get(w)[0]
          if (head && head.ts <= horizon && (pick === null || head.ts < queues.get(pick)[0].ts)) pick = w
        }
        if (pick === null) return
        subscriber.next(queues.get(pick).shift())
      }
    }

    return source.subscribe({
      next (block) {
        const queue = queues.get(block.worker)
        if (!queue) return subscriber.error(new Error(`ERR_UNKNOWN_WORKER: ${block.worker}`))
        queue.push(block)
        if (block.type !== 'sweep') return
        swept.set(block.worker, block.ts)
        if (swept.size === workers.length) release(Math.min(...swept.values()))
      },
      error: (err) => subscriber.error(err),
      complete () {
        release(Infinity)
        subscriber.complete()
      }
    })
  })
}

// Advances the scheduler to each block's event time before passing it on, so windows close on event time.
function inEventTime (scheduler) {
  return (source) => new Observable((subscriber) => source.subscribe({
    next (block) {
      scheduler.advanceTo(block.ts)
      subscriber.next(block)
    },
    error: (err) => subscriber.error(err),
    complete: () => subscriber.complete()
  }))
}

module.exports = { EventTimeScheduler, orderByEventTime, inEventTime }
