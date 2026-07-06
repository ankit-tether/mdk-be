# **Workers in MDK: a simpler model**

## **The problem**

Today, building a worker means learning our internal structure before you can integrate anything. Workers are sorted into device categories (miners, power meters, sensors) and built by extending base classes that carry assumptions specific to our own mining sites. To add a device you inherit logic you don't need and squeeze it into a category that may not fit what you're integrating.

We also tie a worker to the brand of the hardware, when what actually determines how you talk to a device is its firmware, not the metal. The same machine running different firmware needs a different worker today, and that is backwards.

It works for us, but it is opinionated and slow. It does not scale to an open standard that anyone can build on.

## **The idea**

A worker should be the smallest possible thing: a description of what something exposes, and a thin layer that translates between it and MDK. This holds whether the thing is a physical device (a miner, a power meter, a sensor) or a software service that exposes an API (a pool, a market feed, an energy provider). Both are just sources of data and actions. MDK should not treat them differently, and a worker should not care which one it is wrapping.

A worker is built from two parts:

* A declarative description of what the thing exposes: its readings, its commands, its error codes. This is filled directly from the device spec or the API docs. It is description, not code.  
* A thin translation layer: a small, fixed set of functions that turn an MDK request into the thing's own protocol and turn its responses back into MDK. For a device that means a TCP, Modbus, or HTTP call. For a service it means an API call. The shape is identical either way.

This layer does one job: translation. It holds no state, runs no aggregation, and encodes no business rules. All of that lives in the gateway (the app node), and the split is deliberate.

The gateway is the only place with the full picture. A worker sees one device. Aggregation, correlation, thresholds, and decisions need a view across many devices and services at once, which a single worker structurally cannot have.

It keeps logic in one place. Business rules change often. If they lived in workers, every change would mean editing and redeploying many workers owned by different people. In the gateway it is one codebase and one deployment.

It keeps workers reusable and unopinionated. A worker that only translates does not change when our business logic changes. The same worker serves us, a partner with entirely different rules, and an agent that defines its own. Putting logic in the worker would force everyone to inherit our decisions, which is the exact opinionation we are trying to remove.

And it is what makes a worker writable from a spec. A spec tells you how to talk to a device. It does not tell you what to do with the data. By drawing the line at translation, the worker's job matches exactly what the spec already contains, which is why an agent can build one.

Identity moves from brand to protocol, so one integration covers every device or service that speaks the same control surface, no matter who made it.

## **Miner workers**

Miners are the clearest case of what this fixes, and under the new model they stop being special. Today a miner worker is tied to the brand and model of the machine. But an Antminer running stock firmware and the same Antminer running Braiins are two completely different control surfaces, while Braiins running on an Antminer, a Whatsminer, or an Avalon is the same one. Keying a worker on the model keys it on the wrong thing.

So miner workers key on firmware, not model. One firmware is one worker, and it covers every machine that runs it regardless of who built the metal. The hardware make and model become plain metadata attached to the device: useful labels and static facts, never a reason to write new code. Firmware versions that talk differently are handled inside the same firmware worker, not as separate integrations.

This is a proven pattern, not a guess. The 256 Foundation's asic-rs library is built exactly this way: it separates firmwares from hardware makes, identifies a machine's firmware from its address, and builds the right implementation from that. It is worth following.

The result is that a miner worker is just a worker. It is a firmware's control surface wrapped as a translation layer with a declarative contract, the same shape as a power meter or an API service. There is no miner base class and no mining assumptions inside it. Hashrate rollups, share accounting, and site topology are gateway concerns, like everything else. A new firmware is simply another worker, and that is what makes miner workers unopinionated and easy to build.

## **Why it matters**

The goal is simple. A developer hands a device's specs to an agent, and the agent produces a working MDK worker. No internal knowledge required, measured in minutes, not days.

That is the bar for MDK being a real open standard. If integrating a device requires understanding how we built MDK, it is not unopinionated and it will not be adopted broadly. If it only requires describing the device, anyone can extend it, and so can their agents.

