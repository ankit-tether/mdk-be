# MDK Apps & IVHM Shadow Site — Stories

> **Version:** 0.1.0  |  **Date:** 2026-10-02  |  **Status:** Draft
>
> The stories that deliver four HLDs, in the order to pick them:
> [hld-app-gateway.md](./hld-app-gateway.md), [hld-app-packaging.md](./hld-app-packaging.md),
> [hld-gateway-auth-rbac.md](./hld-gateway-auth-rbac.md) and [hld-ivhm-shadow-site.md](./hld-ivhm-shadow-site.md).

---

## 1. Tracks

- **Track A — Apps platform** comes from the gateway, packaging and auth/RBAC HLDs. Pick its stories
  top to bottom: each phase builds on the one before. A second developer can start the RBAC policy
  library and the token issuer (A9, A10) early; only A10's hook into `mdk app add` waits for Phase 2.
- **Track B — IVHM shadow site** doesn't depend on Track A and runs in parallel with it.

---

## 2. Track A — Apps platform

### Phase 1 — Move apps out of the Gateway process

One shared Gateway and one MCP server, neither running app code, and one runtime process per app.

| #  | Story | HLD | Description |
| -- | ----- | --- | ----------- |
| A1 | App runtime library | [app-gateway §3](./hld-app-gateway.md) | New library that runs one app's controllers and background logic in its own process and serves its handlers over HRPC. It accepts calls only from the Gateway's and the MCP server's keys. Existing plugins run unchanged. |
| A2 | App manifest and `mdk run` | [app-packaging §6.2, §7, §8](./hld-app-packaging.md), [app-gateway §3](./hld-app-gateway.md) | Define and validate `mdk-app.yaml` (id, version, displayName, permissions, config) and the `spec.apps` entry in `mdk.yaml`. `mdk run` starts and supervises one runtime per entry, passing the app's config defaults merged with the operator's overrides; `mdk run app <name>` starts one alone. |
| A3 | Gateway forwards to runtimes | [app-gateway §3](./hld-app-gateway.md) | The Gateway mounts each app's routes from `mdk-plugin.json` under `/apps/<name>/` without loading its code, and forwards each request with the verified user identity over HRPC. |
| A4 | Single MCP endpoint | [app-gateway §3](./hld-app-gateway.md) | One MCP server exposes the tools from every app's route table, namespaced by app ID, and forwards each call with the verified agent identity to that app's runtime over HRPC, like the Gateway. |

### Phase 2 — Packaging and CLI

Apps become npm packages that install with one command. Install writes each app's service account
and its grant into `mdk.yaml`; Phase 3 issues the credentials and enforces the grants.

| #  | Story | HLD | Description |
| -- | ----- | --- | ----------- |
| A5 | App CLI: create, add, status | [app-packaging §7, §8](./hld-app-packaging.md) | `mdk create app` scaffolds an app package. `mdk app add` checks peer dependencies, name and routes, installs an exact version from the npm registry with no scripts, and records the app in `package.json` and `mdk.yaml` with its service account and the grant for its requested permissions. `mdk get apps`, `mdk describe app` and `mdk status` show installed apps, versions, grants and state. |
| A6 | `mdk app validate` | [app-packaging §6, §8](./hld-app-packaging.md) | Pre-publish check for developers and CI: id format, version matches `package.json`, permissions use the RBAC rule shape, route table and UI index are valid. |
| A7 | Shell loads app UIs | [app-packaging §6.3](./hld-app-packaging.md) | Each time it loads, the UI shell reads every installed app's `ui/` index and adds its pages and panels, with no shell rebuild. |
| A8 | Package reference apps | [app-packaging §2, §4.1](./hld-app-packaging.md) | Move our reference apps (Sentinel, the agent app) into the package shape and publish them, with npm provenance where available. |

### Phase 3 — Identity and RBAC

Every user, agent and app gets its own identity. After the shared policy library and identity
stories, there is one story per place `spec.rbac` is checked: the Kernel for apps, the Gateway for
users and the MCP server for agents.

| #   | Story | HLD | Description |
| --- | ----- | --- | ----------- |
| A9  | RBAC policy library | [gateway-auth-rbac §2, §4](./hld-gateway-auth-rbac.md) | Validate `spec.rbac` (roles, rules, bindings to User, Group and ServiceAccount; default deny) and load it into Hyperbee at boot. One evaluator, shared by the Gateway, MCP server and Kernel, matches the caller's roles against each request, wildcards included; it fails closed and has no superadmin bypass. |
| A10 | Token issuer and service accounts | [gateway-auth-rbac §3, §4, §5](./hld-gateway-auth-rbac.md) | Issue short-lived access JWTs and rotating refresh tokens, for user login and for service-account credentials. Create a credential for every app's service account when `mdk app add` installs it, and for named AI-agent accounts; credentials are per instance and never ship in a package. |
| A11 | App auth at the Kernel | [gateway-auth-rbac §3, §4](./hld-gateway-auth-rbac.md), [app-gateway §1, §3](./hld-app-gateway.md) | Each runtime calls the Kernel as its own service account, and the Kernel verifies that JWT on every call and checks `devices` rules by `family/brand/worker/device` name. Remove `config.kernelKey` from `buildPluginContext`. |
| A12 | User auth at the Gateway | [gateway-auth-rbac §3, §4, §5](./hld-gateway-auth-rbac.md), [app-gateway §3](./hld-app-gateway.md) | The UI and CLI sign in through the token issuer and refresh the access JWT when it expires. A Fastify plugin on the Gateway verifies the JWT, maps the route to a resource (`<app>/<path>`) and verb, returns 403 when no rule matches, and logs every request with the caller, app, route and decision. |
| A13 | Agent auth at the MCP server | [gateway-auth-rbac §3](./hld-gateway-auth-rbac.md) | The MCP server verifies the agent's service-account JWT and applies the same RBAC as HTTP before forwarding the call to the app's runtime. |

---

## 3. Track B — IVHM shadow site

Independent of Track A. The MDK WhatsMiner worker (HLD §3) is already delivered by the vendor; the
proxy relies on it sending `deviceId` and the caller credential with every request. B1 goes first:
it is the only change to production MOS, and the proxy needs it.

| #  | Story | HLD | Description |
| -- | ----- | --- | ----------- |
| B1 | MOS worker raw-data RPC | [ivhm-shadow-site §5](./hld-ivhm-shadow-site.md) | Behind a flag that is off by default, keep each miner's latest raw poll responses and serve them through a read-only `getThingsRawData(deviceId)` RPC. |
| B2 | Shadow Proxy | [ivhm-shadow-site §4](./hld-ivhm-shadow-site.md) | One TCP server speaking WhatsMiner API v2. It answers each request with `getThingsRawData`, over Hyperswarm RPC, from the MOS rack worker that owns that `deviceId`. Only the MDK worker may call it: pick API key, HMAC-signed requests or mTLS, and enforce it. |
| B3 | Sentinel on shadow data | [ivhm-shadow-site §1](./hld-ivhm-shadow-site.md) | Point Sentinel at the shadow stack so it's built and tested on live device data. |

---

## 4. Not covered

Left by the HLDs to later work or to other HLDs:

- The signed `.mdkapp` bundle — after v1.0 ([app-packaging §5](./hld-app-packaging.md)).
- Upgrading, rolling back and removing an installed app ([app-packaging §2](./hld-app-packaging.md)).
- Production supervision and per-app resource limits — the process sandboxing HLD
  ([app-gateway §5](./hld-app-gateway.md)).
- MCP progressive disclosure — its own HLD ([app-gateway §5](./hld-app-gateway.md)).
- The public app index ([app-packaging §2](./hld-app-packaging.md)).
