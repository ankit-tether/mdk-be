# MDK Worker Runtime (HLD)

> **Version:** 0.1.0  |  **Date:** 2026-07-06  |  **Status:** Draft
>
> The generic host that loads a Worker Plugin and runs **many same-type devices in one process behind a single RPC channel to the Kernel**. It is the counterpart to `[hld-worker-handlers.md](./hld-worker-handlers.md)`: that doc defines the per-action *handler* contract; this doc defines the *runtime* that hosts them.

## 1. What it is

The **Worker Runtime** (`@tetherto/mdk-worker`) is a library — not a base class you subclass. You hand it a Worker Plugin (an `mdk-contract.json` + handler files) and a list of device configs; it does everything generic:

- Opens **one** HRPC server / DHT presence — **one RPC channel to the Kernel** for the whole process, regardless of how many devices it drives.
- Builds **one isolated device context per device** (its own connection + handlers bound to it).
- Answers every MDK Protocol pull — `identity`, `capability`, `telemetry`, `command`, `health`, `state` — routing by `deviceId` to the right context.
- Wraps every handler return into the MDK Protocol envelope.

The handler author still writes single-device, logic-free code. The runtime is the only thing that knows there is more than one device.

---

## 2. This already exists — it is `MDKWorkerAdapter`, generalized

The shape is not new. Today `[startWorker()](../../mdk-prv/backend/core/mdk/index.js)` builds exactly one `MDKWorkerAdapter` (one RPC server, one Kernel connection) wrapping one manager that holds many device "things":

```289:294:mdk-prv/backend/core/mdk/index.js
  const adapter = new MDKWorkerAdapter(manager, contract, {
    workerId,
    orkTopic,
    store: adapterStore
  })
  await adapter.start()
```

The adapter already owns the whole generic surface — discovery, the single RPC server, and `deviceId` routing across a device map:

```40:59:mdk-prv/backend/workers/base/lib/mdk-worker-adapter.js
    this._server.respond('mdk', async (reqBuf) => {
      try {
        const envelope = deserialize(reqBuf)
        const result = await this.handleRequest(envelope)
        return serialize(result)
      } catch (err) {
        debug(`request error: ${err.message}`)
        return serialize({ error: err.message })
      }
    })

    await this._server.listen()
```

**The only thing that changes** is what turns an action into a device call. Today the adapter delegates to a subclassed `ThingManager` with a hand-written `command` switch (`_handleCommand`, and `applyThings` fan-out). The runtime replaces that switch with **handler files loaded from the plugin**, invoked against the addressed device's context. Everything else — DHT join, seed persistence, envelope (de)serialization, per-device telemetry iteration — carries over unchanged.

---

## 3. Library API

Code-level, the runtime is a plain library object. No subclassing, no framework:

```js
// worker.node.js — one process, one plugin type, N devices
const { WorkerRuntime } = require('@tetherto/mdk-worker')
const plugin = require('@braiins/mdk-worker-braiins') // { contract, connect, handlers }

const runtime = new WorkerRuntime(plugin, {
  kernel: { topic: process.env.ORK_TOPIC }, // one RPC channel for the whole process
  devices: [
    { deviceId: 'AM-001', ip: '10.0.4.11', port: 50051, token: process.env.T1 },
    { deviceId: 'AM-002', ip: '10.0.4.12', port: 50051, token: process.env.T2 }
    // ... up to devicesPerRuntime
  ]
})

await runtime.start()               // joins topic, opens one context per device, registers all deviceIds
```

The device list is fixed at construction — it is the runtime's input. There is no runtime-side add/remove; to change the set of devices a process drives, restart it with a new `devices` array (a supervisor concern, §6).

Every device in one `WorkerRuntime` must be the **same plugin type** (all Braiins, all Whatsminer) — the contract, capabilities, and handlers are shared; only the connection config differs per device. Mixed types run as separate runtimes (separate processes or separate objects).

---

