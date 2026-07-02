# MDK Worker — Handler & Translation Layer (HLD)

> **Version:** 0.2.0  |  **Date:** 2026-07-02  |  **Status:** Draft
>
> The Worker-side mirror of `[hld-app-node-plugins.md](./hld-app-node-plugins.md)`: a manifest + plain-JS handlers, no framework or business logic.
>
> **Inspired by:** [Workers in MDK: a simpler model](https://docs.google.com/document/d/19wfo0RNVPyPBBE4tbGTvdOjmbauBBkCUVE3go3WFY3k/edit?tab=t.0) (Google Doc).

## 1. The model

1. **A worker is a thin translation of the device's public API** — no business logic, no stats, no state beyond an open connection.
2. **One worker instance controls one device** — one connection matching the vendor API 1:1 (gRPC channel, Modbus session, or HTTP client to a single IP:port).
3. **Capabilities are handler-style, like Gateway Plugins** — `mdk-contract.json` declares each action/query and points at a plain JS file. No `onCommand` switch, no protocol code in the handler.
4. **Aggregation always lives in the Gateway Plugin, never the worker** — fleet rollups and cross-device/cross-worker stats live in exactly one place.

The result: worker code is dumb by construction. A handler that only sees one device *cannot* aggregate — a structural constraint, not a convention.

---

## 2. Symmetry with Gateway Plugins

Instead of one `onCommand` switch handling every action, a worker exposes **one entry point per action or capability** — each command and each telemetry channel in `mdk-contract.json` points at its own small handler file. 

This is the exact model Gateway Plugins already use: `[hld-app-node-plugins.md](./hld-app-node-plugins.md)` declares each route in a manifest and points it at its own handler, rather than a hardcoded route table. The two sides of the Kernel end up mirror images:


|                     | Gateway Plugin           | Worker (this proposal)               |
| ------------------- | ------------------------ | ------------------------------------ |
| Manifest            | `mdk-plugin.json`        | `mdk-contract.json`                  |
| Unit of work        | one route                | one command or telemetry entry       |
| Handler             | `(req) => result`        | `(req) => result`                    |
| Sanctioned I/O      | `mdk-client` → Kernel    | device client → device               |
| Framework knowledge | none (Adapter owns HTTP) | none (Worker runtime owns MDK Protocol) |
| Host                | Gateway loads the plugin | Worker runtime loads the contract + handlers |
| Aggregates?         | **Yes — its job**        | **No — one device per instance**     |

**No more Worker Base.** Since a Worker Plugin is no longer subclassed, the `WorkerBase` you `extends` (the model in [`proposal/06-worker.md` §5](./proposal/06-worker.md)) is retired. It is replaced by a new **Worker runtime** — a generic host that *loads* a Worker Plugin (its `mdk-contract.json` + handlers) and wraps around all the shared logic the plugin no longer contains: worker discovery (joining the DHT topic), the ORK/Kernel connection, answering `identity`/`capability`/`health` pulls, dispatching each `command.request` to the right handler, and MDK Protocol envelope wrapping. Same relationship as the Gateway to a Gateway Plugin: the plugin is loaded, not inherited.


---

## 3. Manifest

`mdk-contract.json` already carries the vocabulary (`commands`, `telemetry`, `description`, `constraints`, `examples`, `errors`). This adds one field — `**handler**` — pointing at the file that implements that action, exactly like `mdk-plugin.json`.

```jsonc
// mdk-contract.json (excerpt) — one worker instance = one device
{
  "metadata": {
    "provider": "braiins", "deviceFamily": "miner", "brand": "AntMiner",
    "overview": "Controls a single Braiins OS+ miner over its public gRPC API."
  },
  "capabilities": {
    "telemetry": [
      { "name": "hashrate_rt", "unit": "TH/s", "type": "number",
        "handler": "src/telemetry/hashrate.js",
        "description": "Real-time hashrate. 0 implies offline or booting." }
    ],
    "commands": [
      { "name": "reboot", "handler": "src/commands/reboot.js",
        "constraints": "Do not call more than once in a 15-minute window." },
      { "name": "setPowerLimit", "handler": "src/commands/setPowerLimit.js",
        "params": [{ "name": "limit_watts", "type": "number", "min": 2000, "max": 4000 }] }
    ]
  }
}
```

At boot the Worker runtime reads the manifest, eagerly `require()`s every `handler`, and aborts on a missing module or non-function export.

---

## 4. Handler contract

A plain async function: takes `params`, returns any serializable value (the Worker runtime wraps it into the MDK Protocol envelope). `params` is the schema-validated inputs for this action — the only per-call data — and is empty for telemetry or parameterless commands.

Since a worker instance owns exactly one device — it is an ambient singleton the handler imports, exactly as a Gateway Plugin handler imports `@tetherto/mdk-client`:

```js
// src/device.js — the single connected device client, wired once at boot
const grpc = require('@braiins/bos-plus-api') // vendor SDK

const device = grpc.connect({
  host: process.env.DEVICE_IP,   // one worker instance = one device
  port: process.env.DEVICE_PORT, // e.g. 50051
  token: process.env.DEVICE_TOKEN
})

module.exports = device
```

```js
// src/commands/setPowerLimit.js
const device = require('../device')

module.exports = async (params) => {
  await device.advancedSettings.setPowerTarget({ watts: params.limit_watts })
  return { watts: params.limit_watts, ok: true }
}
```



---

## 5. Where aggregation goes instead

```mermaid
flowchart LR
    W1["braiins-worker (AM001)"] --> Kernel
    W2["braiins-worker (AM002)"] --> Kernel
    W3["whatsminer-worker (WM001)"] --> Kernel
    Kernel["Kernel — routes by deviceId"] --> GatewayPlugin
    GatewayPlugin["Gateway Plugin\n(only place aggregation lives)"] -->|"site rollups, fleet stats"| Consumer["UI / AI Agent"]
```



Already the documented path — `hld-app-node-plugins.md` [§5.2](./hld-app-node-plugins.md#52-cross-worker-aggregation) has the Gateway Plugin fan out via `mdk-client` across `deviceIds`. The only change: it becomes the *sole* place aggregation happens. No worker-level Manager rolls up a device pool; a fleet stat is computed by a Gateway Plugin after fanning out to individual single-device workers — the same path as cross-site aggregation (§5.3).

---

## 6. Vendor bundle: Worker Plugin + Gateway Plugin

Because the worker is deliberately dumb, "device support in MDK" is not one package — it is a **pair**, and a vendor ships both together:

- **Worker Plugin** (`@vendor/mdk-worker-<device>`) — the single-device translation layer + `mdk-contract.json`.
- **Gateway Plugin** (`@vendor/mdk-plugin-<device>`) — optional; cross-instance aggregated rollups over the vendor's own fleet of same-type devices (e.g. total hashrate, average outlet temperature, count offline), plus any convenience endpoints for that fleet of device class.

A vendor onboarding their hardware ships both as one distributable bundle so an operator installs support in a single step.

```mermaid
flowchart TB
    subgraph Bundle["@vendor/mdk-<device> bundle"]
        WP["Worker Plugin\n(1 device · translation + mdk-contract.json)"]
        GP["Gateway Plugin\n(same-type fleet aggregation + endpoints)"]
    end
```



The worker stays single-device and logic-free — while giving vendors a natural home for the "must-have" aggregation their device needs.

---

## References

- `[hld-app-node-plugins.md](./hld-app-node-plugins.md)` — the mirrored pattern.
- `"Workers in MDK: a simpler model.md"` — the "contract + thin translation" premise ([source Google Doc](https://docs.google.com/document/d/19wfo0RNVPyPBBE4tbGTvdOjmbauBBkCUVE3go3WFY3k/edit?tab=t.0)).
- `[mdk-contract.json](./mdk-contract.json)` / `[mdk-contract.schema.json](./mdk-contract.schema.json)` — manifest, extended with `handler`.
- `[hld.md](./hld.md)` §4.4.2 — the `onCommand` model being replaced.

