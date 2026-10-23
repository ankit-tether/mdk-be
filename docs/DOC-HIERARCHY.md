# MDK — Documentation Hierarchy & Standards

> **Version:** 2.1.0  |  **Date:** 2026-06-24  |  **Status:** In Review
>
> Foundational conventions for MDK documentation: canonical naming, the platform package hierarchy, and the site information architecture.

---

## 1. Canonical Component Naming

> **All component names are confirmed.** No open naming decisions remain.


| Retired Name | Canonical Name | Package                 |
| ------------ | -------------- | ----------------------- |
| ORK          | **Kernel**     | `@tetherto/mdk-kernel`  |
| App Node     | **Gateway**    | `@tetherto/mdk-gateway` |
| MDK Client   | **Client**     | `@tetherto/mdk-client`  |
| Worker Base  | **Worker**     | `@tetherto/mdk-worker`  |


---

## 2. Platform Package Hierarchy

The single source of truth for component structure. **Everyone must use this exact terminology and hierarchy.**

```
MDK Platform
│
├── mdk-core          [Built by Tether — invariant foundation]
│   ├── Kernel        @tetherto/mdk-kernel    — orchestration engine
│   ├── Gateway       @tetherto/mdk-gateway   — authenticated API boundary
│   ├── Client        @tetherto/mdk-client    — transport SDK (HRPC / IPC)
│   └── Worker        @tetherto/mdk-worker    — base for device integrations
│
├── mdk-extensions    [Built by Tether reference + Community]
│   ├── Worker Plugins    @<org>/mdk-worker-<device>        — subclass Worker + mdk-contract.json
│   └── Gateway Plugins   @<org>/mdk-plugin-<feature>       — controllers + mdk-plugin.json
│
└── mdk-ui-devkit     [Built by Tether — optional frontend layer]
    ├── UI Foundation      @tetherto/mdk-ui-foundation
    ├── React Adapter      @tetherto/mdk-react-adapter
    ├── React Components   @tetherto/mdk-react-components
    └── Fonts              @tetherto/mdk-fonts          
```

### 2.1 Architecture diagram (canonical)

![MDK platform architecture](./DOC-HIERARCHY-ARCH.png)

<details>
<summary>Mermaid source (for regeneration — PNG above is canonical)</summary>

```mermaid
flowchart TD
    subgraph DEVKIT["mdk-ui-devkit · optional"]
        direction TB
        RC["MDK React Components"] --> RA["React Adapter"] --> UIF["UI Foundation"]
    end

    subgraph CONSUMERS["Consumers"]
        direction LR
        UI["UI / Dashboard"]
        AI["AI Agent"]
    end

    subgraph CORE["mdk-core"]
        direction TB
        GW["<b>Gateway</b><br/>auth · JWT/RBAC · MCP"]
        KR["<b>Kernel</b><br/>orchestration engine"]
        WK["<b>Worker</b><br/>device integration"]
    end

    subgraph EXT["mdk-extensions"]
        direction TB
        GP(["Gateway Plugin"])
        WP(["Worker Plugin"])
    end

    DEVICES["Physical Devices<br/>Miners · Sensors · Containers"]

    UIF -.->|"builds"| UI
    UI  -->|"HTTP / WebSocket"| GW
    AI  -->|"MCP"| GW
    GW  -->|"Client · HRPC/IPC"| KR
    KR  -->|"MDK Protocol · pull-based"| WK
    WK  -->|"device APIs"| DEVICES

    GP  -.->|"plugs into"| GW
    WP  -.->|"subclasses"| WK

    classDef core fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef ext fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef devkit fill:#fef9c3,stroke:#ca8a04,color:#713f12;
    classDef consumer fill:#f1f5f9,stroke:#475569,color:#0f172a;
    classDef device fill:#fae8ff,stroke:#a21caf,color:#701a75;

    class GW,KR,WK core;
    class GP,WP ext;
    class RC,RA,UIF devkit;
    class UI,AI consumer;
    class DEVICES device;
```

</details>



### 2.2 Component descriptions


| Tier           | Component                | Package                          | Description                                                                                                                              |
| -------------- | ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| mdk-core       | **Kernel**               | `@tetherto/mdk-kernel`           | Orchestration engine: device registry, command routing, telemetry, health monitoring. Pull-only; trusts nothing but whitelisted clients. |
| mdk-core       | **Gateway**              | `@tetherto/mdk-gateway`          | The only authenticated entry point. JWT/RBAC, REST/WebSocket/MCP, hosts Gateway Plugins. Reaches the Kernel via Client.                  |
| mdk-core       | **Client**               | `@tetherto/mdk-client`           | Transport SDK over HRPC/IPC; multi-language (Node.js, Python, Go). Usable standalone without a Gateway.                                  |
| mdk-core       | **Worker**               | `@tetherto/mdk-worker`           | Base for device integrations. Provides MDK Protocol plumbing; implement `onTelemetryPull` / `onCommand`.                                 |
| mdk-extensions | **Worker Plugin**        | `@<org>/mdk-worker-<device>`     | Subclasses Worker, ships an `mdk-contract.json`. Integrates a physical device or external service.                                       |
| mdk-extensions | **Gateway Plugin**       | `@<org>/mdk-plugin-<feature>`    | Plain-JS controllers + `mdk-plugin.json`; loaded into the Gateway at boot. Adds custom HTTP/WS endpoints.                                |
| mdk-ui-devkit  | **UI Foundation**        | `@tetherto/mdk-ui-foundation`    | Headless state + API client; framework-agnostic. Telemetry buffering, optimistic UI, stale detection.                                    |
| mdk-ui-devkit  | **React Adapter**        | `@tetherto/mdk-react-adapter`    | React hooks (`useTelemetry`, `useCommand`) over UI Foundation.                                                                           |
| mdk-ui-devkit  | **MDK React Components** | `@tetherto/mdk-react-components` | Radix-based component library; 3-tier CSS customization, no Tailwind dependency.                                                         |
| mdk-ui-devkit  | **Fonts**                | `@tetherto/mdk-fonts`            | Shared typeface bundle for MDK UI surfaces.                                                                                              |


---

## 3. Site Information Architecture

The MDK docs site uses the **[Diátaxis](https://diataxis.fr/)** framework. Tutorials collapse into a single **Quickstart**; Explanation is surfaced as **Understanding MDK**; agentic content gets its own chapter.

```
📖 Introduction
   1.  What is MDK?
   2.  Quickstart  (one golden path, end-to-end)

🛠️ Guides
   1.  Deploy MDK
       1.1  Single-process mode
       1.2  Multi-process mode
       1.3  Multi-kernel deployment                    → U.5
       1.4  Harden your deployment                    → U.7
   2.  Build a Worker Plugin                          → U.3.4, U.4.1
       2.1  Author an mdk-contract.json               → R.1.4
   3.  Build a Gateway Plugin                         → U.3.2, U.4.2
       3.1  Aggregate across workers & sites          → U.5
   4.  Build a Dashboard
       4.1  Use the UI Devkit                         → U.6
       4.2  Use Components in Dashboard Shell         → U.6.1
       4.3  Customize UI components (3-tier CSS)      → R.2

💡 Understanding MDK  (U.*)
   U.1  Architecture overview
   U.2  The MDK Protocol
   U.3  mdk-core
        U.3.1  Kernel
        U.3.2  Gateway
        U.3.3  Client
        U.3.4  Worker
   U.4  mdk-extensions
        U.4.1  Worker Plugins
        U.4.2  Gateway Plugins
   U.5  Scaling model (multi-kernel)
   U.6  mdk-ui-devkit                                     → R.2
        U.6.1  Dashboard shell
        U.6.2  React Components
   U.7  Security  (auth · JWT/RBAC · whitelisting · etc)
   U.8  Storage model (Hypercore / Hyperbee)
        U.8.1  Worker & Gateway Plugin storage

🤖 MDK for Agents  (A.*)
   A.1  Overview (Developer Skill & Operator Agent)
   A.2  MDK Developer Skill
   A.3  Operator Agent
   A.4  MCP endpoint & tool derivation
   A.5  Connect an AI agent                           → U.3.2

📚 Reference  (R.*)
   R.1  mdk-core
        R.1.1  Kernel — API
        R.1.2  Gateway — API · mdk-plugin.json schema · error codes
        R.1.3  Client — API
        R.1.4  Worker — API · mdk-contract.json schema · error codes
   R.2  mdk-ui-devkit
        R.2.1  Dashboard shell
        R.2.2  UI Foundation — API
        R.2.3  React Adapter — API
        R.2.4  React Components — component catalogue
        R.2.5  Fonts
   R.3  MDK Protocol — envelope
   R.4  Glossary
```
### 3.2 Gap analysis and mapping current docs to proposed IA

- `[Supported]` means existing material directly supports the proposed page, although editing,
  splitting, moving, or terminology updates may still be required.
- `[Partial]` means useful source material exists, but it does not satisfy the proposed page on
  its own.
- `[Gap]` means no adequate canonical source exists in the current or archived material.

See the demo for the current routes where proposed IA items now lands in the site shell.

#### Introduction

##### 1. What is MDK?

- maps to: `/docs/`
- coverage: `[Supported]`
- notes: Create a short and orientation-led page. Architecture, scaling, package detail, and agent explanation 
should remain in canonical Explanation or Agents pages.
- sources:
  - [index.mdx](../../content/docs/index.mdx)
  - [index.mdx](../../content/archived/v0-4-0/index.mdx)
  - [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)

##### 2. Quickstart (one golden path, end-to-end)

- open question: Which user's path is the golden path?
- maps to: `/docs/tutorials/quickstart/`
- coverage: `[Supported] IF`
- notes: Supported IF first success is to run a mock miner and control it per tutorials/backend-stack/cli/ the mock-miner loop: discover, read telemetry, set power mode, verify. Currently hidden as 2 in a rung (run ORK being 1).
- sources:
  - [tutorials/quickstart.mdx](../../content/docs/tutorials/quickstart.mdx)
  - [get-started/control-a-mock-miner.mdx](../../content/get-started/control-a-mock-miner.mdx)
  - [get-started.mdx](../../content/archived/v0-4-0/get-started.mdx)
  - [tutorials/backend-stack/run.mdx](../../content/archived/v0-4-0/tutorials/backend-stack/run.mdx)
  - [tutorials/backend-stack/cli.mdx](../../content/archived/v0-4-0/tutorials/backend-stack/cli.mdx)
  - [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)


#### Guides

##### 1. Deploy MDK

- maps to: `/docs/guides/deploy-mdk/`
- coverage: `[Supported]`
- notes: Deployment overview and decision material exists but needs short
- sources:
  - [guides/deploy-mdk/index.mdx](../../content/docs/guides/deploy-mdk/index.mdx)
  - [how-to/deployment/index.mdx](../../content/archived/v0-4-0/how-to/deployment/index.mdx)
  - [concepts/deployment-topologies.mdx](../../content/archived/v0-4-0/concepts/deployment-topologies.mdx)

###### 1.1 Single-process mode

- maps to: `/docs/guides/deploy-mdk/single-process-mode/`
- coverage: `[Supported]`
- sources:
  - [guides/deploy-mdk/single-process-mode.mdx](../../content/docs/guides/deploy-mdk/single-process-mode.mdx)
  - [how-to/deployment/run-single-process-site.mdx](../../content/archived/v0-4-0/how-to/deployment/run-single-process-site.mdx)

###### 1.2 Multi-process mode

- maps to: `/docs/guides/deploy-mdk/multi-process-mode/`
- coverage: `[Supported]`
- notes: Confirm whether "microservices" is the topology the proposal calls "Multi-process mode";
  the existing procedure otherwise supports this page.
- blocker: {tbd does engineering agree we are ready to support this?}
- sources:
  - [guides/deploy-mdk/multi-process-mode.mdx](../../content/docs/guides/deploy-mdk/multi-process-mode.mdx)
  - [how-to/deployment/run-microservices-site.mdx](../../content/archived/v0-4-0/how-to/deployment/run-microservices-site.mdx)
  - [concepts/deployment-topologies.mdx](../../content/archived/v0-4-0/concepts/deployment-topologies.mdx)

###### 1.3 Multi-kernel deployment

- maps to: `/docs/guides/deploy-mdk/multi-kernel-deployment/`
- coverage: `[Partial]`
- notes: Deployment topology material hands off to the right single-process, local, and
  microservices decisions, but this page still needs a tested multi-kernel procedure for running
  more than one site-level ORK behind one App Node.
- cross-reference-target: `U.5 Scaling model (multi-kernel)`
- blocker: {tbd does engineering agree we are ready to support this?}
- sources:
  - [guides/deploy-mdk/multi-kernel-deployment.mdx](../../content/docs/guides/deploy-mdk/multi-kernel-deployment.mdx)
  - [concepts/deployment-topologies.mdx](../../content/archived/v0-4-0/concepts/deployment-topologies.mdx)
  - [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)

###### 1.4 Harden your deployment

- maps to: `/docs/guides/deploy-mdk/harden-your-deployment/`
- coverage: `[Partial]`
- notes: Not a full hardening guide yet, but package docs now cover JWT/RBAC, HRPC allowlisting, transport trust boundaries, and vulnerability reporting.
- cross-reference-target: `U.7 Security`
- blocker: Engineering does not agree we are ready to support this
- sources:
  - current stub: [guides/deploy-mdk/harden-your-deployment.mdx](../../content/docs/guides/deploy-mdk/harden-your-deployment.mdx)
  - fragments: [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)
  - fragments: [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - fragments: [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)
  - mdk-prv: [backend/core/ork/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/ork/README.md)
  - mdk-prv: [SECURITY.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/SECURITY.md)

##### 2. Build a Worker Plugin

- maps to: `/docs/guides/build-a-worker-plugin/`
- coverage: `[Partial]`
- notes: Running an existing miner Worker is not the same task as authoring a new Worker Plugin and authoring lacks support.
- cross-reference-target: `U.3.4 Worker`, `U.4.1 Worker Plugins`
- sources:
  - [guides/build-a-worker-plugin/index.mdx](../../content/docs/guides/build-a-worker-plugin/index.mdx)
  - [concepts/stack/workers.mdx](../../content/archived/v0-4-0/concepts/stack/workers.mdx)
  - [how-to/miners/index.mdx](../../content/archived/v0-4-0/how-to/miners/index.mdx)
  - [reference/supported-hardware.mdx](../../content/archived/v0-4-0/reference/supported-hardware.mdx)
  - mdk-prv: [backend/workers/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/README.md)
  - mdk-prv: [backend/workers/base/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/README.md)
  - mdk-prv: [docs/reference/maintainers/agent-ready-sdk.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/reference/maintainers/agent-ready-sdk.md)

###### 2.1 Author an mdk-contract.json

- maps to: `/docs/guides/build-a-worker-plugin/author-mdk-contract-json/`
- coverage: `[Partial]`
- cross-reference-target: `R.1.4 Worker -- API`
- blocker: {tbd worker contract/schema is not defined hence can't be described: our existing contracts are non-compliant per proposed schema}
- sources:
  - [guides/build-a-worker-plugin/author-mdk-contract-json.mdx](../../content/docs/guides/build-a-worker-plugin/author-mdk-contract-json.mdx)
  - [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - [reference/supported-hardware.mdx](../../content/archived/v0-4-0/reference/supported-hardware.mdx)
  - mdk-prv: [backend/workers/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/README.md)
  - mdk-prv: [backend/workers/base/mdk-contract.schema.json](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/mdk-contract.schema.json)
  - mdk-prv: [docs/reference/maintainers/agent-ready-sdk.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/reference/maintainers/agent-ready-sdk.md)

##### 3. Build a Gateway Plugin

- maps to: `/docs/guides/build-a-gateway-plugin/`
- coverage: `[Supported]`
- notes: Source exists as the App Node plugin guide; migration mainly needs naming alignment
  from "App Node plugin" to "Gateway Plugin" while retaining exact `app-node` identifiers where
  they are code or API names.
- cross-reference-target: `U.3.2 Gateway`, `U.4.2 Gateway Plugins`
- sources:
  - [guides/build-a-gateway-plugin/index.mdx](../../content/docs/guides/build-a-gateway-plugin/index.mdx)
  - [how-to/app-node/index.mdx](../../content/archived/v0-4-0/how-to/app-node/index.mdx)
  - [how-to/app-node/plugins.mdx](../../content/archived/v0-4-0/how-to/app-node/plugins.mdx)
  - mdk-prv: [backend/core/plugins/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/plugins/README.md)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)

###### 3.1 Aggregate across workers and sites

- maps to: `/docs/guides/build-a-gateway-plugin/aggregate-across-workers-and-sites/`
- coverage: `[Partial]`
- notes: Source covers controller-level aggregation with `mdkClient` and `dataProxy` and
  explains that cross-site aggregation belongs in the App Node, but a tested guide for
  aggregating across multiple workers and multiple site-level ORKs does not exist yet.
- cross-reference-target: `U.5 Scaling model (multi-kernel)`
- sources:
  - [guides/build-a-gateway-plugin/aggregate-across-workers-and-sites.mdx](../../content/docs/guides/build-a-gateway-plugin/aggregate-across-workers-and-sites.mdx)
  - [concepts/deployment-topologies.mdx](../../content/archived/v0-4-0/concepts/deployment-topologies.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)
  - mdk-prv: [backend/core/plugins/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/plugins/README.md)

##### 4. Build a Dashboard

- maps to: `/docs/guides/build-a-dashboard/`
- coverage: `[Supported]`
- notes: Consolidated guide = demo index + archived `tutorials/full-stack/dashboard.mdx` (primary); archived `tutorials/ui/react/tutorial.mdx` and `ui/react/get-started.mdx` are supporting.
- sources:
  - [guides/build-a-dashboard/index.mdx](../../content/docs/guides/build-a-dashboard/index.mdx)
  - [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)
  - [tutorials/ui/react/tutorial.mdx](../../content/archived/v0-4-0/tutorials/ui/react/tutorial.mdx)
  - [ui/react/get-started.mdx](../../content/archived/v0-4-0/ui/react/get-started.mdx)

###### 4.1 Use the UI Devkit

- maps to: `/docs/guides/build-a-dashboard/use-the-ui-devkit/`
- coverage: `[Supported]`
- notes: Archived `get-started.mdx` and `quickstart.mdx` overlap; consolidated source = demo page + archived `ui/react/quickstart.mdx` (primary) + headless usage from `use-ui-core-headlessly.mdx`.
- cross-reference-target: `U.6 mdk-ui-devkit`
- sources:
  - [guides/build-a-dashboard/use-the-ui-devkit.mdx](../../content/docs/guides/build-a-dashboard/use-the-ui-devkit.mdx)
  - [ui/react/get-started.mdx](../../content/archived/v0-4-0/ui/react/get-started.mdx)
  - [ui/react/quickstart.mdx](../../content/archived/v0-4-0/ui/react/quickstart.mdx)
  - [how-to/ui/core/use-ui-core-headlessly.mdx](../../content/archived/v0-4-0/how-to/ui/core/use-ui-core-headlessly.mdx)

###### 4.2 Use Components in Dashboard Shell

- maps to: `/docs/guides/build-a-dashboard/use-components-in-dashboard-shell/`
- coverage: `[Partial]`
- notes: Dashboard shell tutorial and layout how-to overlap; no current monorepo package README for the shell component surface — archived docs only.
- cross-reference-target: `U.6.1 Dashboard shell`
- sources:
  - [guides/build-a-dashboard/use-components-in-dashboard-shell.mdx](../../content/docs/guides/build-a-dashboard/use-components-in-dashboard-shell.mdx)
  - [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)
  - [ui/react/foundation/dashboard/index.mdx](../../content/archived/v0-4-0/ui/react/foundation/dashboard/index.mdx)
  - [how-to/ui/react/compose-reporting-layouts/index.mdx](../../content/archived/v0-4-0/how-to/ui/react/compose-reporting-layouts/index.mdx)

###### 4.3 Customize UI components (3-tier CSS)

- maps to: `/docs/guides/build-a-dashboard/customize-ui-components/`
- coverage: `[Supported]`
- notes: Consolidated source = demo page + archived `ui/react/core/theme.mdx` (primary for 3-tier CSS model) + `core/components/index.mdx` for component-class overrides.
- cross-reference-target: `R.2 mdk-ui-devkit`
- sources:
  - [guides/build-a-dashboard/customize-ui-components.mdx](../../content/docs/guides/build-a-dashboard/customize-ui-components.mdx)
  - [ui/react/core/theme.mdx](../../content/archived/v0-4-0/ui/react/core/theme.mdx)
  - [ui/react/core/components/index.mdx](../../content/archived/v0-4-0/ui/react/core/components/index.mdx)

#### Explanation

- proposal label: `Understanding MDK (U.*)`
- current nav label: `Explanation`
- maps to: `/docs/understanding/`

##### U.1 Architecture overview

- maps to: `/docs/understanding/architecture-overview/`
- coverage: `[Supported]`
- notes: Consolidated source = demo page drawing from `docs/concepts/architecture.md` (primary, current) + `concepts/about.mdx` (intro framing only); archived `architecture/index.mdx` is the predecessor to `architecture.md`.
- sources:
  - [understanding/architecture-overview.mdx](../../content/docs/understanding/architecture-overview.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)

##### U.2 The MDK Protocol

- maps to: `/docs/understanding/mdk-protocol/`
- coverage: `[Partial]`
- notes: Protocol principles, envelope, and discovery flow are covered in `docs/concepts/architecture.md`; no standalone explanation document. Archived `protocol/messages.mdx` holds per-message detail not reproduced in current material.
- sources:
  - [understanding/mdk-protocol.mdx](../../content/docs/understanding/mdk-protocol.mdx)
  - [reference/protocol/index.mdx](../../content/archived/v0-4-0/reference/protocol/index.mdx)
  - [reference/protocol/messages.mdx](../../content/archived/v0-4-0/reference/protocol/messages.mdx)

##### U.3 mdk-core

- maps to: `/docs/understanding/mdk-core/`
- coverage: `[Partial]`
- notes: No single conceptual overview of mdk-core as a package suite. Explanation index must abstract the package composition (ORK, client, plugins, mdk bootstrap) from `docs/concepts/architecture.md` and the individual package READMEs.
- sources:
  - [understanding/mdk-core/index.mdx](../../content/docs/understanding/mdk-core/index.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - [concepts/stack/index.mdx](../../content/archived/v0-4-0/concepts/stack/index.mdx)

###### U.3.1 Kernel

- maps to: `/docs/understanding/mdk-core/kernel/`
- coverage: `[Supported]`
- notes: Explanation page draws from demo page and archived ORK concept. Archived `reference/ork/index.mdx` detail belongs in R.1.1, not here.
- sources:
  - [understanding/mdk-core/kernel.mdx](../../content/docs/understanding/mdk-core/kernel.mdx)
  - [concepts/stack/ork.mdx](../../content/archived/v0-4-0/concepts/stack/ork.mdx)
  - [reference/ork/index.mdx](../../content/archived/v0-4-0/reference/ork/index.mdx)

###### U.3.2 Gateway

- maps to: `/docs/understanding/mdk-core/gateway/`
- coverage: `[Supported]`
- notes: Explanation page draws from demo page and archived app-node concept. Archived `how-to/app-node/index.mdx` content belongs in Guides.
- sources:
  - [understanding/mdk-core/gateway.mdx](../../content/docs/understanding/mdk-core/gateway.mdx)
  - [concepts/stack/app-node.mdx](../../content/archived/v0-4-0/concepts/stack/app-node.mdx)
  - [how-to/app-node/index.mdx](../../content/archived/v0-4-0/how-to/app-node/index.mdx)

###### U.3.3 Client

- maps to: `/docs/understanding/mdk-core/client/`
- coverage: `[Partial]`
- notes: `client/README.md` is comprehensive for R.1.3 (reference). This Explanation page needs the conceptual role — transport abstraction, position between App Node and ORK — not API tables.
- sources:
  - [understanding/mdk-core/client.mdx](../../content/docs/understanding/mdk-core/client.mdx)
  - [tutorials/backend-stack/run.mdx](../../content/archived/v0-4-0/tutorials/backend-stack/run.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - mdk-prv: [backend/core/client/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/client/README.md)

###### U.3.4 Worker

- maps to: `/docs/understanding/mdk-core/worker/`
- coverage: `[Supported]`
- notes: Explanation page draws from demo page and archived workers concept. How-to miners content belongs in Guides; supported-hardware is a separate page.
- sources:
  - [understanding/mdk-core/worker.mdx](../../content/docs/understanding/mdk-core/worker.mdx)
  - [concepts/stack/workers.mdx](../../content/archived/v0-4-0/concepts/stack/workers.mdx)
  - [how-to/miners/index.mdx](../../content/archived/v0-4-0/how-to/miners/index.mdx)
  - [reference/supported-hardware.mdx](../../content/archived/v0-4-0/reference/supported-hardware.mdx)

##### U.4 mdk-extensions

- maps to: `/docs/understanding/mdk-extensions/`
- coverage: `[Partial]`
- notes: No `mdk-extensions` package exists. Concept page must abstract the extension model from the two surfaces: Worker Plugins (`backend/workers/base/`) and Gateway Plugins (`backend/core/plugins/`).
- sources:
  - current stub: [understanding/mdk-extensions/index.mdx](../../content/docs/understanding/mdk-extensions/index.mdx)
  - fragments: [concepts/stack/workers.mdx](../../content/archived/v0-4-0/concepts/stack/workers.mdx)
  - fragments: [how-to/app-node/plugins.mdx](../../content/archived/v0-4-0/how-to/app-node/plugins.mdx)
  - mdk-prv: [backend/workers/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/README.md)
  - mdk-prv: [backend/core/plugins/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/plugins/README.md)
  - mdk-prv: [docs/reference/maintainers/agent-ready-sdk.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/reference/maintainers/agent-ready-sdk.md)

###### U.4.1 Worker Plugins

- maps to: `/docs/understanding/mdk-extensions/worker-plugins/`
- coverage: `[Partial]`
- notes: Sources cover running existing miners and the ThingManager API. Gap is the authoring lifecycle — creating a Worker Plugin from scratch — which is not documented as a standalone explanation.
- sources:
  - [understanding/mdk-extensions/worker-plugins.mdx](../../content/docs/understanding/mdk-extensions/worker-plugins.mdx)
  - [concepts/stack/workers.mdx](../../content/archived/v0-4-0/concepts/stack/workers.mdx)
  - [how-to/miners/index.mdx](../../content/archived/v0-4-0/how-to/miners/index.mdx)
  - mdk-prv: [backend/workers/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/README.md)
  - mdk-prv: [backend/workers/base/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/README.md)

###### U.4.2 Gateway Plugins

- maps to: `/docs/understanding/mdk-extensions/gateway-plugins/`
- coverage: `[Supported]`
- sources:
  - [understanding/mdk-extensions/gateway-plugins.mdx](../../content/docs/understanding/mdk-extensions/gateway-plugins.mdx)
  - [how-to/app-node/plugins.mdx](../../content/archived/v0-4-0/how-to/app-node/plugins.mdx)
  - mdk-prv: [backend/core/plugins/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/plugins/README.md)

##### U.5 Scaling model (multi-kernel)

- maps to: `/docs/understanding/scaling-model/`
- coverage: `[Partial]`
- notes: Conceptual model (parallel Workers, multi-site) is well covered in `docs/concepts/architecture.md`. App Node README notes multi-site aggregation is roadmap; explanation may need a current-status caveat.
- sources:
  - [understanding/scaling-model.mdx](../../content/docs/understanding/scaling-model.mdx)
  - [concepts/deployment-topologies.mdx](../../content/archived/v0-4-0/concepts/deployment-topologies.mdx)
  - [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)

##### U.6 mdk-ui-devkit

- maps to: `/docs/understanding/mdk-ui-devkit/`
- coverage: `[Supported]`
- notes: `ui/AGENTS.md` and `ui/docs/AGENT_FIRST.md` are agent/contributor contract docs; extract user-facing concept content only. Archived `app-toolkit.mdx` provides the concept framing.
- sources:
  - [understanding/mdk-ui-devkit/index.mdx](../../content/docs/understanding/mdk-ui-devkit/index.mdx)
  - [concepts/stack/app-toolkit.mdx](../../content/archived/v0-4-0/concepts/stack/app-toolkit.mdx)
  - [ui/react/core/index.mdx](../../content/archived/v0-4-0/ui/react/core/index.mdx)
  - mdk-prv: [ui/docs/AGENT_FIRST.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/docs/AGENT_FIRST.md)
  - mdk-prv: [ui/AGENTS.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/AGENTS.md)

###### U.6.1 Dashboard shell

- maps to: `/docs/understanding/mdk-ui-devkit/dashboard-shell/`
- coverage: `[Partial]`
- notes: Shell setup and composition are covered in `ui/docs/AGENT_FIRST.md` (end-to-end recipe); no standalone conceptual document for the dashboard shell as a framework concept.
- sources:
  - [understanding/mdk-ui-devkit/dashboard-shell.mdx](../../content/docs/understanding/mdk-ui-devkit/dashboard-shell.mdx)
  - [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)
  - [ui/react/foundation/dashboard/index.mdx](../../content/archived/v0-4-0/ui/react/foundation/dashboard/index.mdx)
  - mdk-prv: [ui/docs/AGENT_FIRST.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/docs/AGENT_FIRST.md)

###### U.6.2 React Components

- maps to: `/docs/understanding/mdk-ui-devkit/react-components/`
- coverage: `[Supported]`
- notes: `ui/docs/AGENT_FIRST.md` describes the tier system and CLI surface (contributor context); extract the component model description only for this Explanation page.
- sources:
  - [understanding/mdk-ui-devkit/react-components.mdx](../../content/docs/understanding/mdk-ui-devkit/react-components.mdx)
  - [ui/react/core/components/index.mdx](../../content/archived/v0-4-0/ui/react/core/components/index.mdx)
  - [ui/react/foundation/index.mdx](../../content/archived/v0-4-0/ui/react/foundation/index.mdx)
  - mdk-prv: [ui/docs/AGENT_FIRST.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/docs/AGENT_FIRST.md)

##### U.7 Security (auth, JWT/RBAC, whitelisting, etc)

- maps to: `/docs/understanding/security/`
- coverage: `[Partial]`
- notes: Needs security/engineering review before migration claims.
- sources:
  - current stub: [understanding/security.mdx](../../content/docs/understanding/security.mdx)
  - fragments: [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)
  - fragments: [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - fragments: [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)
  - mdk-prv: [backend/core/ork/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/ork/README.md)
  - mdk-prv: [SECURITY.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/SECURITY.md)

##### U.8 Storage model (Hypercore / Hyperbee)

- maps to: `/docs/understanding/storage-model/`
- coverage: `[Partial]`
- notes: Package docs describe worker Hyperbee stores, App Node SQLite/Hyperbee paths, and ORK WAL, but no canonical storage-model explanation exists yet.
- sources:
  - current stub: [understanding/storage-model/index.mdx](../../content/docs/understanding/storage-model/index.mdx)
  - mdk-prv: [backend/workers/base/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/README.md)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)
  - mdk-prv: [backend/core/ork/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/ork/README.md)

###### U.8.1 Worker and Gateway Plugin storage

- maps to: `/docs/understanding/storage-model/worker-and-gateway-plugin-storage/`
- coverage: `[Partial]`
- notes: Worker per-worker Hyperbee stores (6 stores) are documented in `base/README.md`. Gateway Plugins do not own storage directly — App Node config (`store.config.json`) controls storage paths.
- sources:
  - current stub: [understanding/storage-model/worker-and-gateway-plugin-storage.mdx](../../content/docs/understanding/storage-model/worker-and-gateway-plugin-storage.mdx)
  - mdk-prv: [backend/workers/base/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/README.md)
  - mdk-prv: [backend/core/plugins/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/plugins/README.md)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)

#### Agents shell

The proposal names this bucket "MDK for Agents". The current site owns it under `/agents/`,
outside the strict docs tree.

##### A.1 Overview (Developer Skill and Operator Agent)

- maps to: `/agents/` (site shell)
- coverage: `[Partial]`
- notes: Must explain Developer Skill and Operator Agent as distinct journeys.
- sources:
  - current shell page: [agents/page.tsx](../../src/app/%28site%29/agents/page.tsx)
  - [agents/index.mdx](../../content/archived/v0-4-0/agents/index.mdx)
  - [concepts/about.mdx](../../content/archived/v0-4-0/concepts/about.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)

##### A.2 MDK Developer Skill

- maps to: `/agents/mdk-developer-skill/` (site shell)
- coverage: `[Supported]`
- notes: Keep distinct from live Kernel/Gateway control.
- sources:
  - [agents/mdk-developer-skill.mdx](../../content/agents/mdk-developer-skill.mdx)
  - [agents/index.mdx](../../content/archived/v0-4-0/agents/index.mdx)
  - [tutorials/ui/react/build-any-dashboard-with-an-agent.mdx](../../content/archived/v0-4-0/tutorials/ui/react/build-any-dashboard-with-an-agent.mdx)
  - [reference/app-toolkit/ui-cli.mdx](../../content/archived/v0-4-0/reference/app-toolkit/ui-cli.mdx)

##### A.3 Operator Agent

- maps to: `/agents/operator-agent/` (site shell)
- coverage: `[Partial]`
- notes: The monorepo has an AI-agent scenario and App Node auth/RBAC boundary, but still lacks a production-ready operator-agent model with safety, audit, failure, and recovery details.
- sources:
  - current stub: [agents/operator-agent.mdx](../../content/agents/operator-agent.mdx)
  - mdk-prv: [docs/concepts/architecture.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/concepts/architecture.md)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)

##### A.4 MCP endpoint and tool derivation

- maps to: `/agents/mcp-endpoint-and-tool-derivation/` (site shell)
- coverage: `[Partial]`
- notes: Runtime tool derivation and contract fields exist in source material; endpoint schemas, authorization, errors, and safety behaviour still need canonical docs.
- sources:
  - [agents/mcp-endpoint-and-tool-derivation.mdx](../../content/agents/mcp-endpoint-and-tool-derivation.mdx)
  - [agents/index.mdx](../../content/archived/v0-4-0/agents/index.mdx)
  - [concepts/architecture/index.mdx](../../content/archived/v0-4-0/concepts/architecture/index.mdx)
  - mdk-prv: [docs/concepts/architecture.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/concepts/architecture.md)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)
  - mdk-prv: [docs/reference/maintainers/agent-ready-sdk.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/reference/maintainers/agent-ready-sdk.md)

##### A.5 Connect an AI agent

- maps to: `/agents/connect-an-ai-agent/` (site shell)
- coverage: `[Partial]`
- cross-reference-target: `U.3.2 Gateway`
- notes: Not a pure gap after monorepo review, but still ambiguous. Developer-agent setup overlaps `A.2`; runtime-agent connection depends on `A.3`, `A.4`, and `U.7`.
- sources:
  - current stub: [agents/connect-an-ai-agent.mdx](../../content/agents/connect-an-ai-agent.mdx)
  - mdk-prv: [docs/concepts/architecture.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/concepts/architecture.md)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)

#### Reference

##### R.1 mdk-core

- maps to: `/docs/reference/mdk-core/`
- coverage: `[Partial]`
- notes: `backend/core/mdk/README.md` covers bootstrap API only (`getOrk`, `startWorker`, `startAppNode`). Reference index must also scope ORK, client, and plugins sub-packages, each documented in their own READMEs.
- sources:
  - [reference/mdk-core/index.mdx](../../content/docs/reference/mdk-core/index.mdx)
  - [reference/ork/index.mdx](../../content/archived/v0-4-0/reference/ork/index.mdx)
  - [reference/ork/modules.mdx](../../content/archived/v0-4-0/reference/ork/modules.mdx)
  - mdk-prv: [backend/core/mdk/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/mdk/README.md)
  - mdk-prv: [backend/core/client/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/client/README.md)
  - mdk-prv: [backend/core/ork/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/ork/README.md)

###### R.1.1 Kernel -- API

- maps to: `/docs/reference/mdk-core/kernel-api/`
- coverage: `[Partial]`
- notes: ORK package README is current and comprehensive. Archived `reference/ork/modules.mdx` has module-level API tables that need to be verified against the current README and incorporated or dropped.
- sources:
  - [reference/mdk-core/kernel-api.mdx](../../content/docs/reference/mdk-core/kernel-api.mdx)
  - [reference/ork/index.mdx](../../content/archived/v0-4-0/reference/ork/index.mdx)
  - [reference/ork/modules.mdx](../../content/archived/v0-4-0/reference/ork/modules.mdx)
  - mdk-prv: [backend/core/ork/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/ork/README.md)

###### R.1.2 Gateway -- API, mdk-plugin.json schema, error codes

- maps to: `/docs/reference/mdk-core/gateway-api/`
- coverage: `[Partial]`
- notes: App Node README covers routes, config, and security model; plugin README covers `mdk-plugin.json` schema and generated default-route tables. No canonical error codes table exists for the gateway API.
- sources:
  - [reference/mdk-core/gateway-api.mdx](../../content/docs/reference/mdk-core/gateway-api.mdx)
  - [how-to/app-node/plugins.mdx](../../content/archived/v0-4-0/how-to/app-node/plugins.mdx)
  - mdk-prv: [backend/core/app-node/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/app-node/README.md)
  - mdk-prv: [backend/core/plugins/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/plugins/README.md)

###### R.1.3 Client -- API

- maps to: `/docs/reference/mdk-core/client-api/`
- coverage: `[Supported]`
- notes: This is no longer a genuine source gap: the package README documents factories, transports, methods, options, errors, and examples.
- sources:
  - current stub: [reference/mdk-core/client-api.mdx](../../content/docs/reference/mdk-core/client-api.mdx)
  - mdk-prv: [backend/core/client/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/core/client/README.md)

###### R.1.4 Worker -- API, mdk-contract.json schema, error codes

- maps to: `/docs/reference/mdk-core/worker-api/`
- coverage: `[Partial]`
- notes: Three distinct surfaces to consolidate: `ThingManager` + `MDKWorkerAdapter` (from `base/README.md`) and `mdk-contract.json` schema semantics (schema file + `agent-ready-sdk.md`).
- sources:
  - [reference/mdk-core/worker-api.mdx](../../content/docs/reference/mdk-core/worker-api.mdx)
  - [concepts/stack/workers.mdx](../../content/archived/v0-4-0/concepts/stack/workers.mdx)
  - [reference/supported-hardware.mdx](../../content/archived/v0-4-0/reference/supported-hardware.mdx)
  - mdk-prv: [backend/workers/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/README.md)
  - mdk-prv: [backend/workers/base/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/README.md)
  - mdk-prv: [backend/workers/base/mdk-contract.schema.json](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/base/mdk-contract.schema.json)
  - mdk-prv: [docs/reference/maintainers/agent-ready-sdk.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/reference/maintainers/agent-ready-sdk.md)

##### R.2 mdk-ui-devkit

- maps to: `/docs/reference/mdk-ui-devkit/`
- coverage: `[Supported]`
- notes: `ui/AGENTS.md` and `ui/docs/AGENT_FIRST.md` are agent/contributor docs; reference page should document the package surface (exports, subpath map, tier system overview), not the contribution contract.
- sources:
  - [reference/mdk-ui-devkit/index.mdx](../../content/docs/reference/mdk-ui-devkit/index.mdx)
  - [reference/app-toolkit/ui-kit/index.mdx](../../content/archived/v0-4-0/reference/app-toolkit/ui-kit/index.mdx)
  - [reference/app-toolkit/ui-core/index.mdx](../../content/archived/v0-4-0/reference/app-toolkit/ui-core/index.mdx)
  - [reference/app-toolkit/hooks/index.mdx](../../content/archived/v0-4-0/reference/app-toolkit/hooks/index.mdx)
  - mdk-prv: [ui/AGENTS.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/AGENTS.md)
  - mdk-prv: [ui/docs/AGENT_FIRST.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/docs/AGENT_FIRST.md)

###### R.2.1 Dashboard shell

- maps to: `/docs/reference/mdk-ui-devkit/dashboard-shell/`
- coverage: `[Partial]`
- notes: No monorepo package README for the dashboard shell; shell is a CLI template (`ui/packages/cli/templates/mdk-ui-shell/`). Sources are archived tutorial and foundation docs only.
- sources:
  - [reference/mdk-ui-devkit/dashboard-shell.mdx](../../content/docs/reference/mdk-ui-devkit/dashboard-shell.mdx)
  - [tutorials/full-stack/dashboard.mdx](../../content/archived/v0-4-0/tutorials/full-stack/dashboard.mdx)
  - [ui/react/foundation/dashboard/index.mdx](../../content/archived/v0-4-0/ui/react/foundation/dashboard/index.mdx)

###### R.2.2 UI Core -- API

- maps to: `/docs/reference/mdk-ui-devkit/ui-core-api/`
- coverage: `[Supported]`
- notes: Package README is current but minimal. Archived `ui-core/index.mdx` may have broader API surface. Consolidated reference = package README as primary; verify archived content is not superseded.
- sources:
  - [reference/mdk-ui-devkit/ui-core-api.mdx](../../content/docs/reference/mdk-ui-devkit/ui-core-api.mdx)
  - [reference/app-toolkit/ui-core/index.mdx](../../content/archived/v0-4-0/reference/app-toolkit/ui-core/index.mdx)
  - [how-to/ui/core/use-ui-core-headlessly.mdx](../../content/archived/v0-4-0/how-to/ui/core/use-ui-core-headlessly.mdx)
  - mdk-prv: [ui/packages/ui-core/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/packages/ui-core/README.md)

###### R.2.3 React Adapter -- API

- maps to: `/docs/reference/mdk-ui-devkit/react-adapter-api/`
- coverage: `[Partial]`
- notes: Adapter README is a surface listing only. `dist/hooks.json` (generated at build, not committed) is the canonical machine-readable hook API. Consolidated reference needs hook signatures, store bindings, and `MdkProvider` props.
- sources:
  - [reference/mdk-ui-devkit/react-adapter-api.mdx](../../content/docs/reference/mdk-ui-devkit/react-adapter-api.mdx)
  - [reference/app-toolkit/hooks/index.mdx](../../content/archived/v0-4-0/reference/app-toolkit/hooks/index.mdx)
  - [reference/app-toolkit/ui-kit/hooks/index.mdx](../../content/archived/v0-4-0/reference/app-toolkit/ui-kit/hooks/index.mdx)
  - mdk-prv: [ui/packages/react-adapter/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/packages/react-adapter/README.md)

###### R.2.4 React Components -- component catalogue

- maps to: `/docs/reference/mdk-ui-devkit/react-components/`
- coverage: `[Supported]`
- notes: `dist/registry.json` (generated component catalogue) is the canonical source; archived docs are the seed for page structure only.
- sources:
  - [reference/mdk-ui-devkit/react-components.mdx](../../content/docs/reference/mdk-ui-devkit/react-components.mdx)
  - [ui/react/core/components/index.mdx](../../content/archived/v0-4-0/ui/react/core/components/index.mdx)
  - [ui/react/foundation/index.mdx](../../content/archived/v0-4-0/ui/react/foundation/index.mdx)

###### R.2.5 Fonts

- maps to: `/docs/reference/mdk-ui-devkit/fonts/`
- coverage: `[Supported]`
- notes: The font package documents install, import, included weights, glyph coverage, optional use, and direct asset access.
- sources:
  - current stub: [reference/mdk-ui-devkit/fonts.mdx](../../content/docs/reference/mdk-ui-devkit/fonts.mdx)
  - mdk-prv: [ui/packages/fonts/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/ui/packages/fonts/README.md)

##### R.3 MDK Protocol -- envelope

- maps to: `/docs/reference/mdk-protocol-envelope/`
- coverage: `[Supported]`
- notes: Consolidated reference = demo page + archived `protocol/index.mdx` (envelope schema) + archived `protocol/messages.mdx` (per-message detail).
- sources:
  - [reference/mdk-protocol-envelope.mdx](../../content/docs/reference/mdk-protocol-envelope.mdx)
  - [reference/protocol/index.mdx](../../content/archived/v0-4-0/reference/protocol/index.mdx)
  - [reference/protocol/messages.mdx](../../content/archived/v0-4-0/reference/protocol/messages.mdx)

##### R.4 Glossary

- maps to: `/docs/reference/glossary/`
- coverage: `[Supported]`
- sources:
  - [reference/glossary.mdx](../../content/docs/reference/glossary.mdx)
  - [concepts/terminology.mdx](../../content/archived/v0-4-0/concepts/terminology.mdx)

#### Existing material without a named proposal destination

These should not disappear just because the proposed IA does not name them.

##### Supported hardware

- maps to: Catalogue / Hardware and Reference, decision still required
- sources:
  - [reference/supported-hardware.mdx](../../content/archived/v0-4-0/reference/supported-hardware.mdx)
  - mdk-prv: [backend/workers/docs/supported-hardware.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/docs/supported-hardware.md)
  - mdk-prv: [docs/reference/maintainers/agent-ready-sdk.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/docs/reference/maintainers/agent-ready-sdk.md)

##### Miner runbooks and troubleshooting

- maps to: `{no page match}` for a named operations guide
- notes: Do not mislabel these as "Build a Worker Plugin".
- sources:
  - [how-to/miners/index.mdx](../../content/archived/v0-4-0/how-to/miners/index.mdx)
  - mdk-prv: [backend/workers/README.md](https://github.com/tetherto/mdk-prv/blob/release/0.4.0/backend/workers/README.md)

##### Community, governance, and conduct

- maps to: `/support/` (site shell)
- sources:
  - [support/contributing.mdx](../../content/support/contributing.mdx)
  - [support/governance.mdx](../../content/support/governance.mdx)
  - [support/code-of-conduct.mdx](../../content/support/code-of-conduct.mdx)

##### Roadmap

- maps to: `/support/roadmap/` (site shell)
- sources:
  - [support/roadmap.mdx](../../content/support/roadmap.mdx)

##### Repositories

- maps to: `{no page match}` in current shell
- sources:
  - [resources/repositories.mdx](../../content/archived/v0-4-0/resources/repositories.mdx)

### 3.2 Design notes

**N1 — UI Devkit adapters in Reference only**
`@tetherto/mdk-ui-foundation` (UI Foundation) and `@tetherto/mdk-react-adapter` live exclusively in **Reference (R.2)**. They are abstracted implementation details relevant only to specific use cases. The Understanding MDK page for mdk-ui-devkit (U.6) contains a brief conceptual overview and links to R.2.
- **N2 — Fonts in Reference only**
`@tetherto/mdk-fonts` is an optional dependency; developers may bring their own typeface. Documented only in **Reference (R.2.5)**. No dedicated Understanding MDK page — a single line in U.6 noting its existence with a link to R.2.5 is sufficient.
- **N3 — Vue, Svelte, and WC adapters out of scope**
Additional framework adapters (Vue, Svelte, Web Components) are not on the current roadmap. Do not create or stub pages for them. The only mention belongs in the **UI Foundation reference page (R.2.2)**: a single sentence noting that UI Core is framework-agnostic and additional framework support will be added in the future.
**N4 — MDK is domain-agnostic; avoid mining-specific language**
MDK is a general-purpose framework for managing fleets of physical devices. The docs site must not frame it as a mining tool. Use domain-neutral examples and terminology (e.g. "devices" not "miners", "fleet" not "mine"). Mining may be used as one illustrative example but must never be the primary framing.

---

## 4. Decisions

### 4.1 Closed — mdk-addons tier name → mdk-extensions

> **Status: ✅ Resolved** — 2026-06-25.

**Decision:** rename `mdk-addons` to **`mdk-extensions`**. Matches the established pattern used by VS Code, Firefox, and Chrome; clearly signals that both Worker Plugins and Gateway Plugins *extend* mdk-core.

### 4.2 Closed — Client name stays as Client

> **Status: ✅ Resolved** — 2026-06-25.

**Decision:** keep **`Client`** / `@tetherto/mdk-client`. Scoped unambiguously by the package name; no rename needed.

### 4.3 Closed — React Components package name → mdk-react-components

> **Status: ✅ Resolved** — 2026-06-25.

**Decision:** rename `@tetherto/mdk-react-devkit` to **`@tetherto/mdk-react-components`**, display name **MDK React Components**. Directly mirrors the Material Components pattern — the name alone tells you what's inside.

### 4.4 Closed — Client and Gateway cannot be merged

> **Status: ✅ Resolved** — raised by Gio; decision made they must remain separate (2026-06-22).

- **Client** is a *library* — a multi-language transport SDK embeddable in any custom backend, no Gateway required.
- **Gateway** is a *deployable server* — the authenticated boundary (JWT/RBAC, MCP, plugin host) that uses Client internally.

They serve different roles: Client is a dependency; Gateway is an application. Merging would force every custom backend to carry the full auth/MCP surface and would block multi-language Client support.

### 4.5 Closed — UI Core name → UI Foundation

> **Status: ✅ Resolved** — 2026-07-06.

**Decision:** rename `@tetherto/mdk-ui-core` to **`@tetherto/mdk-ui-foundation`**, display name **UI Foundation**. "Core" clashed with the mdk-core tier; "Foundation" clearly signals it is the base layer that all framework adapters build on.


