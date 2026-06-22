# MDK — Documentation Hierarchy & Standards

> **Version:** 1.0.0  |  **Date:** 2026-06-19  |  **Status:** Stable
>
> Brief for the MDK documentation engineer. Defines canonical naming, the platform package hierarchy, the Diátaxis-based section structure, the left-sidebar information architecture, page-level conventions, and versioning policy for the public documentation website.

---

## 1. Canonical Component Naming

> **Status: names not yet finalised.** The names used throughout this document (**Kernel** and **Gateway**) are working placeholders pending team sign-off. See §1.3 for the open alternatives under consideration.

The following names are **retired**. All pages, nav labels, diagrams, and code examples on the documentation site use the working canonical names until a final decision is made.


| Retired Name        | Working Name | Retired Package          | Working Package         |
| ------------------- | ------------ | ------------------------ | ----------------------- |
| ORK / ORK Kernel    | **Kernel**   | `@tetherto/mdk-ork`      | `@tetherto/mdk-kernel`  |
| App Node / App-Node | **Gateway**  | `@tetherto/mdk-app-node` | `@tetherto/mdk-gateway` |


All other package names are unchanged.

### 1.1 Rationale for working names

- **Kernel** — the protected coordination core that everything depends on. Matches the Kubernetes-inspired design intent. Risk: systems developers may associate this with an OS/Linux kernel, which creates the wrong mental model — ORK is a high-level coordinator, not low-level privileged code.
- **Gateway** — precisely describes the boundary role: the sole authenticated entry point between consumers (UI, AI agents) and the Kernel. "App Node" was too implementation-specific and easily misread by external developers.

### 1.2 Stronger alternatives under consideration

An evaluation of alternatives was done against what each component actually does:

**For ORK / Kernel:**


| Candidate              | Assessment                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Conductor**          | Best fit. A conductor never plays an instrument — initiates every cue, all musicians respond. This precisely describes ORK's pull-only model. Unique and ownable in the mining/IoT space. |
| **Orchestrator** ⭐     | Maximally descriptive, immediately understood. Slightly long (`@tetherto/mdk-orchestrator`) but honest.                                                                                   |
| **Kernel** *(current)* | Usable but risks OS/Linux kernel confusion for systems developers.                                                                                                                        |
| **Controller**         | Kubernetes-adjacent and appropriate, but overloaded — every framework has a controller.                                                                                                   |


**For App Node / Gateway:**


| Candidate                 | Assessment                                                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gateway** *(current)* ⭐ | Accurate entry-point/boundary metaphor. Widely understood in infrastructure. Some overlap with API Gateway products (AWS, Kong) but unambiguous in MDK's context since developers *build* it. |
| **Host**                  | "You host your application logic here." Honest but not memorable.                                                                                                                             |
| **Node**                  | Avoid — `Node.js` collision is too strong; developers will read it as runtime-specific.                                                                                                       |
| **Bridge**                | Implies thin pass-through; App Node does much more (auth, aggregation, plugins).                                                                                                              |


**Top recommendation:** replace **Kernel** with **Conductor** (`@tetherto/mdk-conductor`). Keep **Gateway** as-is. The Conductor metaphor is exact and unique; Kernel carries OS baggage.

**For the mdk-addons tier:**

The name "mdk-addons" is informal. It describes neither the audience (community builders and Tether reference authors) nor the purpose (extending mdk-core with device integrations and custom business logic).


| Candidate                  | Assessment                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **mdk-extensions** ⭐       | The most established pattern — VS Code, Firefox, Chrome all use "extensions" for things that extend a core platform. Both Worker Plugins and Gateway Plugins are extensions of mdk-core. Widely understood by developers. |
| **mdk-integrations**       | Emphasises the purpose: integrating hardware devices and external services. Clear and honest. Slightly narrower connotation than "extensions" but very legible.                                                           |
| **mdk-plugins**            | Consistent with the terminology already used within the tier (Worker Plugins, Gateway Plugins). Risk: could be confused with a single plugin package rather than a tier.                                                  |
| **mdk-addons** *(current)* | Common in browser ecosystems but informal. Slightly undermines the tier's importance as the primary extensibility model.                                                                                                  |


**For Worker Base (`@tetherto/mdk-worker-base`):**

The name "Worker Base" describes what it is in code (an abstract base class) rather than what it does for the developer. It is the SDK a developer uses to build a Worker Plugin.


| Candidate                   | Assessment                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Worker SDK** ⭐            | Most honest. It is an SDK for building workers. `@tetherto/mdk-worker-sdk` is clean and immediately clear to an external integrator.                            |
| **Worker Kit**              | Consistent with the `mdk-ui-devkit` naming pattern already in use. `@tetherto/mdk-worker-kit`.                                                                  |
| **Device SDK**              | Emphasises what you are integrating (a device). `@tetherto/mdk-device-sdk`. Clear but slightly narrows the concept — workers can also wrap non-device services. |
| **Worker Base** *(current)* | Describes the code pattern (base class) rather than the developer's job. Acceptable internally but weak as a public package name.                               |


### 1.3 Decision needed

- [ ] Confirm or replace **Kernel** — recommended alternative is **Conductor**
- [ ] Confirm or replace **Gateway** — current proposal stands as the strongest option
- [ ] Confirm or replace **mdk-addons** tier name — recommended alternative is **mdk-extensions**
- [ ] Confirm or replace **Worker Base** — recommended alternative is **Worker SDK** (`@tetherto/mdk-worker-sdk`)

Until decided, this document and the documentation site use **Kernel**, **Gateway**, **mdk-addons**, and **Worker Base** as working names.

---

## 2. Platform Package Hierarchy

MDK is organized into three tiers. This hierarchy drives the documentation site's **product groupings** — each tier gets its own section in the sidebar Reference group (see §4).

```
MDK Platform
│
├── mdk-core          [Built by Tether — invariant foundation]
│   ├── Kernel            @tetherto/mdk-kernel
│   ├── Gateway           @tetherto/mdk-gateway
│   ├── MDK Client        @tetherto/mdk-client
│   └── Worker Base       @tetherto/mdk-worker-base  ⚠️ name pending
│
├── mdk-addons ⚠️     [Built by Tether reference + Community]  ⚠️ name pending
│   ├── Worker Plugins    (subclass mdk-worker-base + mdk-contract.json)
│   └── Gateway Plugins   (plain-JS controllers + mdk-plugin.json)
│
└── mdk-ui-devkit     [Built by Tether — optional frontend layer]
    ├── MDK-UI-Core          @tetherto/mdk-ui-core           ✅ available
    ├── MDK-React-Adapter    @tetherto/mdk-react-adapter     ✅ available
    ├── MDK-React-Components @tetherto/mdk-react-devkit      ✅ available
    ├── MDK-Fonts            @tetherto/mdk-fonts             ✅ available
    ├── MDK-Vue-Adapter      @tetherto/mdk-vue-adapter       🔜 planned
    ├── MDK-Svelte-Adapter   @tetherto/mdk-svelte-adapter    🔜 planned
    └── MDK-WC-Adapter       @tetherto/mdk-wc-adapter        🔜 planned
```

### Tier summaries

**mdk-core** — the invariant foundation published to npm. All other tiers depend on it.


| Component      | Package                        | One-line description                                                                                                      |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Kernel         | `@tetherto/mdk-kernel`         | Orchestration engine: device registry, command routing, telemetry, health monitoring                                      |
| Gateway        | `@tetherto/mdk-gateway`        | API boundary: JWT/RBAC, REST/WebSocket/MCP surface, plugin loader                                                         |
| MDK Client     | `@tetherto/mdk-client`         | Transport SDK over HRPC/IPC; multi-language (Node.js, Python, Go)                                                         |
| Worker Base ⚠️ | `@tetherto/mdk-worker-base` ⚠️ | SDK for building Worker Plugins — provides HRPC/MDK Protocol plumbing, `onTelemetryPull` / `onCommand`. Name pending (§1) |


**mdk-addons** ⚠️ *(name pending — see §1)* — extension layer; built on mdk-core only.

- **Worker Plugins** — integrate a physical device or external service. Subclass `mdk-worker-base`, implement `onTelemetryPull` / `onCommand`, ship an `mdk-contract.json`. Community pattern: `@<org>/mdk-worker-<device>`.
- **Gateway Plugins** — inject custom aggregated HTTP/WebSocket endpoints into the Gateway. Ship an `mdk-plugin.json` manifest and plain-JS controllers. Community pattern: `@<org>/mdk-plugin-<feature>`.

**mdk-ui-devkit** — optional frontend layer for building mining dashboards.


| Component            | Package                        | Status      | One-line description                                                                                 |
| -------------------- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------- |
| MDK-UI-Core          | `@tetherto/mdk-ui-core`        | ✅ Available | Headless state + API client; framework-agnostic. Telemetry buffering, optimistic UI, stale detection |
| MDK-React-Adapter    | `@tetherto/mdk-react-adapter`  | ✅ Available | React hooks (`useTelemetry`, `useCommand`) over mdk-ui-core                                          |
| MDK-React-Components | `@tetherto/mdk-react-devkit`   | ✅ Available | Radix-based React component library; 3-tier CSS customization, no Tailwind dependency                |
| MDK-Fonts            | `@tetherto/mdk-fonts`          | ✅ Available | Shared typeface bundle for MDK UI surfaces                                                           |
| MDK-Vue-Adapter      | `@tetherto/mdk-vue-adapter`    | 🔜 Planned  | Vue reactive bindings over mdk-ui-core                                                               |
| MDK-Svelte-Adapter   | `@tetherto/mdk-svelte-adapter` | 🔜 Planned  | Svelte store bindings over mdk-ui-core                                                               |
| MDK-WC-Adapter       | `@tetherto/mdk-wc-adapter`     | 🔜 Planned  | Web Components bindings over mdk-ui-core                                                             |


---

## 3. Left-Sidebar Information Architecture

The MDK documentation site is structured using the **[Diátaxis](https://diataxis.fr/)** framework. The four quadrants (Tutorials, How-to Guides, Concepts, Reference) form the top-level sidebar groups. All labels use canonical names (Kernel, Gateway).

```
📖 Introduction
   ├─ What is MDK?
   ├─ Architecture at a glance
   └─ Quickstart  ──────────────────────────> (links into Tutorials)

🎓 Tutorials
   ├─ Deploy MDK end-to-end (Gateway + Kernel + Worker)
   ├─ Build your first Worker Plugin
   ├─ Build your first dashboard with the UI Devkit
   └─ Connect your first AI agent

🛠️ How-to Guides
   ├─ Build a Worker Plugin
   ├─ Author an mdk-contract.json
   ├─ Write a Gateway Plugin
   ├─ Aggregate data across workers & sites
   ├─ Connect an AI / MCP agent
   ├─ Customize UI Devkit components (3-tier CSS)
   ├─ Set up a multi-site deployment (parallel Kernels)
   └─ Bootstrap a new instance (create-mdk-instance)

💡 Concepts
   ├─ Architecture overview
   ├─ The MDK Protocol
   ├─ The Kernel
   ├─ The Gateway (API boundary, auth, MCP)
   ├─ Workers & the device-integration model
   ├─ Storage model (Hypercore / Hyperbee)
   ├─ Security & authentication
   ├─ Scaling model (parallel Workers, multi-site)
   └─ Agentic framework (Developer Skill & Operator Agent)

📚 Reference
   ├─ Package index & terminology
   ├─ mdk-core
   │   ├─ @tetherto/mdk-kernel
   │   ├─ @tetherto/mdk-gateway
   │   ├─ @tetherto/mdk-client
   │   └─ @tetherto/mdk-worker-base
   ├─ mdk-ui-devkit
   │   ├─ @tetherto/mdk-ui-core
   │   ├─ @tetherto/mdk-react-adapter
   │   └─ @tetherto/mdk-react-devkit (component catalogue)
   ├─ MDK Protocol (envelope & action set)
   ├─ Schema — mdk-contract.json
   ├─ Schema — mdk-plugin.json
   ├─ Error codes (ERR_*)
   ├─ Release notes
   └─ Glossary
```

**Order rationale:** newcomer-first — a first-time visitor flows top-to-bottom; an experienced developer jumps straight to Reference at the bottom.

---

## Appendix A: Terminology Quick-Reference

Authoritative glossary for all pages and nav labels on the documentation site.


| Term (canonical)         | Retired aliases                   | Package                        | Notes                                                       |
| ------------------------ | --------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| **Kernel**               | ORK, ORK Kernel, mdk-ork          | `@tetherto/mdk-kernel`         | Orchestration engine                                        |
| **Gateway**              | App Node, App-Node, mdk-app-node  | `@tetherto/mdk-gateway`        | API boundary; JWT/RBAC; MCP endpoint                        |
| **MDK Client**           | —                                 | `@tetherto/mdk-client`         | Transport SDK (HRPC / IPC)                                  |
| **Worker Base** ⚠️       | —                                 | `@tetherto/mdk-worker-base` ⚠️ | SDK for building Worker Plugins. Name pending — see §1      |
| **Worker Plugin**        | Worker, device-worker             | `@<org>/mdk-worker-<device>`   | Integrates a device; ships `mdk-contract.json`              |
| **Gateway Plugin**       | App Node Plugin, BE Plugin        | `@<org>/mdk-plugin-<feature>`  | Custom Gateway routes; ships `mdk-plugin.json`              |
| **MDK-UI-Core**          | ui-client, mdk-ui-core            | `@tetherto/mdk-ui-core`        | Headless state + API client                                 |
| **MDK-React-Adapter**    | mdk-react                         | `@tetherto/mdk-react-adapter`  | React hooks over MDK-UI-Core                                |
| **MDK-React-Components** | mdk-react-devkit, ui-devkit-react | `@tetherto/mdk-react-devkit`   | Radix-based component library                               |
| **MDK-Vue-Adapter**      | mdk-vue                           | `@tetherto/mdk-vue-adapter`    | Vue bindings *(planned)*                                    |
| **mdk-contract.json**    | —                                 | —                              | Per-Worker capability + AI context declaration              |
| **mdk-plugin.json**      | —                                 | —                              | Per-Gateway-Plugin route manifest                           |
| **MDK Protocol**         | —                                 | —                              | Shared wire envelope (`id`, `type`, `action`, `payload`, …) |
| **HRPC**                 | —                                 | —                              | Encrypted P2P stream transport (server ↔ server)            |
| **IPC**                  | —                                 | —                              | Local-socket transport (same-host / testing)                |
| **DHT topic**            | —                                 | —                              | Hyperswarm discovery channel Workers join passively         |


