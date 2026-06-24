# mdk-prv Repo Structure — Decision Record

> Captures the key architectural decisions discussed across the team and the final calls made by Ankit Haldar.

---

## Context

When `mdk-ui` was ported into `mdk-prv`, the repo was set up as an umbrella/polyrepo — three independent codebases (`core`, `workers`, `ui-client`) sitting under a flat `packages/` directory with no shared root workspace, tooling, or lockfile. The `README` described it as a monorepo, which prompted a broader conversation about the right long-term structure. The discussion below records the options considered and the decisions made.

---

## Decision 1 — Workspace Boundary: Federated vs Unified

### Problem
Should backend (`core`, `workers`) and frontend (`ui-client`) share a single npm workspace root, or remain federated with their own independent toolchains?

### Options Considered

| Option | Description | Trade-offs |
|---|---|---|
| **Unified workspace** | One root `package.json` with `workspaces: [...]` spanning all packages | Simplest install; but forces a single lockfile across radically different toolchains (P2P/holepunch native deps vs modern npm FE stack) |
| **Federated (separate roots)** | Each domain owns its own install/lockfile; a thin root layer only delegates commands | Isolated dependency graphs; natural fit for the backend's `npm install --prefix` per-process architecture; no lockfile collisions |

### Decision — **Federated**

> Agreed by Ankit, confirmed by Ikako's spike.

The backend (`packages/core`) uses `workspaces: null` and installs each sub-process (`app-node`, `ork`, `client`, `mdk`, …) separately via `npm install --prefix` — isolated `node_modules` per P2P process with native `holepunch` dependencies. Forcing a single root workspace would fight this architecture. Backend stays federated; UI stays a real npm workspace. The root acts as a thin orchestrator only.

---

## Decision 2 — Repo Layout / Flattening: Variant A vs Variant B

### Problem
The current shape had `packages/ui-client/packages/` — a monorepo nested inside a monorepo, five directory levels to reach leaf packages, and root-level config files (`.gitignore`, `tsconfig.base.json`) that were scoped to one domain but appeared repo-wide. The team agreed to flatten. Two variants were proposed by Ikako.

### Options Considered

**Variant A — Encapsulated `ui/` (Recommended by Ikako)**

```
mdk-prv/
├── ui/          # full UI npm workspace moved up as-is (apps/* + packages/*)
├── backend/     # core + workers, each independent (own lockfiles/install scripts)
├── docs/
└── package.json # thin root: no workspaces, scripts delegate to ui/ and backend/
```

- Near-zero internal rewiring (aliases, vite configs, the agent-ready registry generator are all package-relative).
- UI's ~10 config files (`tsconfig.base`, `turbo.json`, `vite`, `eslint`, `prettier`, …) stay encapsulated inside `ui/`.
- Root is a genuinely thin orchestrator.

**Variant B — UI workspace at repo root**

```
mdk-prv/
├── packages/    # UI leaf packages (react-devkit, ui-core, …) — root IS the workspace
├── apps/demo
├── backend/     # sibling, outside the workspace glob
└── package.json # workspaces: ["packages/","apps/"]
```

- Flattest layout; `npm install` at root bootstraps all UI.
- Cost: UI's ~10 config files move to the repo root where they don't apply to backend (root `tsconfig.base.json` reads as repo-wide but is really UI-only); root `package.json` double-duties as umbrella + UI workspace root.

### Decision — **Variant A**, with `npm` at root (not Turbo)

> Agreed by Ankit.

Go with Variant A. Both variants preserve UI workspaces; Variant A keeps each domain's tooling encapsulated and the root truly thin, which fits a heterogeneous umbrella better and minimises risky file-move steps. Turbo can be introduced at the root later if cross-domain caching becomes worthwhile — for now, plain `npm --prefix` script delegation is sufficient.

---

## Decision 3 — Root Orchestration Tooling: npm scripts vs Turbo

### Problem
How should the root `package.json` forward commands (`install`, `build`, `test`, `lint`) to the sub-domains?

### Options Considered

| Option | Notes |
|---|---|
| **Plain npm script delegation** (`npm --prefix ui run build`) | Zero new tooling; transparent; easy to debug |
| **Root Turbo** (domains as opaque tasks) | Cross-domain caching, parallel execution, single command for everything; more setup, an extra dependency |

### Decision — **npm script delegation now; Turbo later**

> Agreed by Ankit.

Start with plain `npm --prefix <domain> run <script>` delegation at the root. Introduce Turbo at the root level later if cross-domain task caching becomes valuable.

---

## Decision 4 — Docs Location

### Problem
There were two `docs/` directories (repo root and `packages/ui-client/`). Where should documentation live going forward?

### Decision — **Single `docs/` at repo root, plus domain-level docs**

> Agreed by Ankit.

- `mdk-prv/docs/` — high-level overviews, architecture, entry points, cross-cutting guides.
- `ui/docs/` — atomic detail on how to use the UI packages.
- `backend/docs/` — atomic detail on how to use the backend components.

`docs/` is a sibling to `ui/` and `backend/` at the repo root.

---

## Decision 5 — Changesets for Publishing

### Problem
How should package versioning, changelogs, and npm publishing be managed for the packages that eventually publish to npm?

### Options Considered

- **Changesets** (`@changesets/cli`) — independent versioning + changelogs + OSS contributor flow, converged on by most large mixed repos.
- Alternatives not formally evaluated at this stage.

### Decision — **Changesets, but deferred**

> Agreed by Ankit.

Changesets is the right long-term choice. Full adoption waits until packages are actually being published to npm. A POC on the repo to validate the workflow and demonstrate the release/versioning flow end-to-end is valuable in the interim.

---

## Decision 6 — Shared Contracts Package (`@mdk/contracts`)

### Problem
The wire format between UI and backend (RPC method shapes, payloads, ext-data responses) is currently implicit. A shared contracts package would give a single source of truth and compile-time breakage on the FE when the BE changes a shape.

### Proposal (raised by Ikako)

- Author contracts as TypeScript types or Zod schemas in a dedicated package (`@mdk/contracts`).
- FE imports types directly (autocomplete + compile-time safety).
- BE consumes the same package at runtime via Zod for request/response validation; editor type-checking via JSDoc `@type {import('@mdk/contracts')...}` — no TS migration required.

### Decision — **Deferred, needs further analysis**

> Ankit's position.

The idea is compelling, but the current `mdk-contract.json` model is highly dynamic, making strong typing non-trivial. Needs more design thinking before implementation. Revisit when the tooling phase is underway.

---

## Summary Table

| Topic | Decision | Notes |
|---|---|---|
| Workspace boundary | Federated | BE and FE toolchains are too different to unify |
| Repo layout | Variant A — `ui/`, `backend/`, `docs/` as siblings at root | Kill `packages/ui-client/packages/` double-nesting |
| Root orchestration | npm script delegation | Turbo at root deferred |
| Docs | Single `docs/` at root + domain-level docs | `docs/` is sibling to `ui/` and `backend/` |
| Publishing | Changesets — deferred | POC on repo in the interim |
| Shared contracts | Deferred | Dynamic contract model needs more design work |
