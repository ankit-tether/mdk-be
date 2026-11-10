# Sentinel

## Overview

Sentinel is the first agent app on MDK: it watches a mining site, finds faults early, explains them
and proposes safe actions. This folder holds its design documents and two runnable proofs of concept
of its rules engine.

| Path                                                       | What it is                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`hld-rules-engine.md`](./hld-rules-engine.md)             | Rules engine and findings HLD: reading telemetry, rules, the engine, how findings are saved |
| [`hld-site-topology-graph.md`](./hld-site-topology-graph.md) | Site topology graph: an editor and graph database for site relationships   |
| [`poc-vanilla/`](./poc-vanilla/)                           | Reference proof of concept of the rules engine, in plain JavaScript          |
| [`poc/`](./poc/)                                           | The earlier proof of concept on RxJS, kept for comparison                    |

## Run the proofs of concept

Both need Node.js 22 or later and run the same rules over the same simulated site.

```bash
cd poc-vanilla
npm start
npm test
```

```bash
cd poc
npm install
npm start
npm test
```

`poc-vanilla/` has no dependencies. `poc/` installs `rxjs`. They print the same findings; the
[`poc-vanilla/` README](./poc-vanilla/README.md) explains the output and the code.

## Which proof of concept to read

Start with `poc-vanilla/`: it is the design the HLD describes. Read `poc/` to see why RxJS was dropped
(HLD §13.2), or for its two RxJS event-time techniques: `EventTimeScheduler`, which runs RxJS time
operators on reading timestamps, and `orderByEventTime`, which merges Worker logs in timestamp order.

## Next steps

- [Rules engine and findings HLD](./hld-rules-engine.md): start with §1 for the requirements and §2 for the architecture
- [Rules engine proof of concept](./poc-vanilla/README.md): run it, then write a rule
