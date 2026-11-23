# Site Topology Graph — Authoring and GraphRAG Context (HLD)

> **Version:** 0.4.0  |  **Date:** 2026-11-23  |  **Status:** Draft

---

## 1. Why

The Operator Agent knows each device *type* from its `mdk-contract.json` and can read live telemetry. It does not know how devices relate: which power meter measures which devices, which cooling unit serves which container, what loses power when a breaker opens. So it can't answer correlation questions.

This HLD adds a site topology graph. Operators describe how real devices relate, in one of two authoring modes: a **visual editor** (React Flow) or a **CSV file import**. The result is written to a graph database, and agents query that graph as GraphRAG context. It is the "Site State Model" vision from Gio.

**Ground rules**

1. **One source of truth.** The graph database holds every relationship. No other store keeps
  relationship data.
2. **Nodes are registered devices only.** Every node is a device from the Kernel's device list; no authoring mode creates devices.
3. **Every authoring mode outputs a list of** `source|type|target` **edges**. Nothing else is
  persisted, whichever mode produced it.
4. **Agents read the published graph only**, through fixed tools, and never edit.

---



## 2. Architecture

Operators write the graph through the Gateway, using either authoring mode. Both modes produce the
same edge set and go through the same publish path (§6). The Operator Agent reads the graph over
MCP as GraphRAG context.

```mermaid
flowchart LR
  ED["Mode A: Visual editor<br/>React Flow"] -->|"HTTP"| GW["Gateway"]
  CSV["Mode B: CSV import<br/>source,type,target"] -->|"HTTP"| GW
  GW -->|"publish<br/>source#124;type#124;target"| DB[("Graph database")]
  AG["Operator Agent"] -->|"MCP"| MS["MCP tools"]
  MS -->|"GraphRAG"| DB

  style ED fill:#fff3e0,stroke:#ff9800,color:#000
  style CSV fill:#fff3e0,stroke:#ff9800,color:#000
  style DB fill:#fff3e0,stroke:#ff9800,color:#000
```

---

## 3. Nodes — the real device list

The device list comes from a real-time `GET /devices` call through the Gateway. The Kernel owns
which devices exist; authoring only relates them. The visual editor uses the list to fill its node
dropdown; CSV import uses it to validate every `source` and `target`.

| Field | Content | Example |
| --- | --- | --- |
| `id` | Kernel device name, `family/brand/worker/device` | `miner/whatsminer/whatsminer-a/wm041` |
| `metadata` | Descriptive data about the device: family, device type, brand, container, etc. | `{ "family": "miner", "deviceType": "whatsminer-m56s", "brand": "whatsminer", "container": "c2" }` |

- The node ID is the name RBAC already uses for devices, so `resourceNames` scope the graph with no
  new vocabulary.
- **Metadata is read-only in the graph.** It always comes from the Kernel's device list. The visual
  editor only lets the user pick a device ID, never edit its metadata, so CSV import doesn't take
  metadata either. Both modes author edges only; to change metadata, change the device in the Kernel.

---

## 4. Edge types — configurable

Edge types are app config. The app ships a default set in `mdk-app.yaml`; the operator adds new
types or replaces defaults in `mdk.yaml`, so each site can model itself the way it works. Each type
has only a `description` and `rules`, both written for the agent.

```yaml
# mdk-app.yaml — defaults shipped with the app
config:
  edgeTypes:
    CONTAINS:
      description: B is physically inside A.
      rules:
        - Anything that applies to A applies to everything it contains.
    FEEDS_POWER:
      description: Power flows from A to B.
      rules:
        - If A loses power, B and everything B contains lose power.
    MEASURES:
      description: A's readings describe B.
      rules:
        - Use A's readings to confirm or rule out a problem on B.
    CONTROLS:
      description: A's commands change B's state, e.g. a breaker.
      rules:
        - Check the impact on B before sending any command to A.
    COOLS:
      description: A removes heat from B.
      rules:
        - If most devices cooled by one unit run hot, the cooling unit is the likely cause.
        - If one device is hot while its peers are normal, check that device's fans.
```

- **Overridable in `mdk.yaml`.** The operator can override `edgeTypes` under the app's `config` in
  `mdk.yaml`: the same name replaces a default, a new name adds a type. The merged set is the only set either authoring mode accepts.
- **No structural constraints.** Any device can connect to any device with any type. Neither mode
  restricts family pairs, direction or cycles; the site decides.
- **Rules reach the agent as-is.** The rules of every type crossed during retrieval go into the
  agent's context (§7).

---

## 5. Authoring modes

There are two ways to author the graph. They differ only in how the operator produces the edge
set; validation, publish, storage and agent access (§6–§8) are identical. A site can use either
mode, or both, since they read and write the same graph.

### 5.1 Mode A — Visual editor (React Flow)

Built with React Flow 12 (`@xyflow/react`, MIT) and MDK React Components, in the app's `ui/`.

1. **Add a node.** The user adds a node to the canvas and picks its ID from a dropdown. The dropdown
   lists the devices from the Kernel (`GET /devices`, §3), so every node is a real device.
2. **Connect.** The user drags an edge from one device to another and assigns it a type. The type
   dropdown comes from `GET /edge-types`, which returns the merged edge types from §4.
3. **Publish.** The editor sends the edges as `source|type|target` strings (§6.1). Work in progress
   autosaves in the browser until then.

The React Flow edge `id` is the `source|type|target` string itself, so duplicate edges can't exist
on the canvas.

### 5.2 Mode B — CSV file import

For sites with many devices, or relationships that already live in a spreadsheet or asset
register, the operator uploads a CSV file instead of drawing the graph.

**File format.** One edge per row, with a required header row:

```csv
source,type,target
powermeter/schneider/schneider-a/pm009,MEASURES,miner/whatsminer/whatsminer-a/wm041
powermeter/schneider/schneider-a/pm009,CONTROLS,miner/whatsminer/whatsminer-a/wm041
cooling/acme/cdu-a/cdu-c2a,COOLS,container/acme/container-a/c2
container/acme/container-a/c2,CONTAINS,miner/whatsminer/whatsminer-a/wm041
```

- The header must be exactly `source,type,target`. Values are trimmed; blank lines are skipped.
  An optional `# revision:` line may come before the header (§5.3).
- `source` and `target` are Kernel device IDs (§3); `type` is a merged edge type (§4).
- Duplicate rows collapse into one edge.
- **No metadata columns.** Device metadata comes from the Kernel (§3); a file with any other column
  is rejected.
- **The file is the complete edge set**, the same as an editor publish: edges in the graph but not
  in the file are deleted.

**Flow.**

1. **Start from the current graph.** The operator exports the current edges to CSV (§5.3), edits
   the file, and re-uploads it. The export's revision becomes the import's `baseRevision`. For a
   first load on an empty graph, the operator writes the file from scratch.
2. **Dry run.** The upload goes to `POST /import?dryRun=true`. The app turns each row into a
   `source|type|target` string and runs the same validation as publish (§6.3). The response lists
   errors by row number, plus the diff: edges added, removed and unchanged. Nothing is written.
3. **Confirm.** The operator reviews the diff and re-submits without `dryRun`. The app publishes
   through the same transaction as the editor (§6.3); a stale `baseRevision` gets `409`.

The whole file is rejected if any row fails validation; there is no partial import.

### 5.3 Export to CSV

The published graph can be exported to CSV from either mode: an **Export CSV** button in the
visual editor, and the download step of the import flow. Both call `GET /export?format=csv`.

```csv
# revision: 9f2c1e
source,type,target
container/acme/container-a/c2,CONTAINS,miner/whatsminer/whatsminer-a/wm041
cooling/acme/cdu-a/cdu-c2a,COOLS,container/acme/container-a/c2
powermeter/schneider/schneider-a/pm009,CONTROLS,miner/whatsminer/whatsminer-a/wm041
powermeter/schneider/schneider-a/pm009,MEASURES,miner/whatsminer/whatsminer-a/wm041
```

- **Same format as import.** The exported file can be re-imported unchanged, so export → edit →
  import is a lossless round trip.
- **Revision on the first line.** A `# revision:` comment line carries the revision the export was
  taken at. On import, the app reads it as `baseRevision` unless the caller passes one explicitly.
  It is the only comment line the importer accepts.
- **Sorted** by `source`, then `type`, then `target`, so two exports of the same graph are
  byte-identical and diff cleanly in version control.
- **Published graph only.** Unpublished canvas work isn't exported, and neither is device metadata
  (§3).
- **Scoped by RBAC.** The export contains only edges whose endpoints the caller can see through
  their `devices` `resourceNames`. A user who can't see every device can export but can't import,
  since their file would delete edges they can't see.

### 5.4 Choosing a mode

| | Mode A — Visual editor | Mode B — CSV import |
| --- | --- | --- |
| Best for | Small sites, spot changes, reviewing structure visually | Large sites, bulk changes, initial load from an existing asset register |
| Input | Drag-and-drop on a canvas | `source,type,target` file |
| Device check | Dropdown only offers Kernel devices | Every row validated against `GET /devices` |
| Duplicates | Impossible; edge `id` is the edge string | Collapsed on import |
| Preview before publish | Canvas is the preview | Dry run returns row errors and the diff |
| Device metadata | Read-only, from the Kernel | Not accepted; from the Kernel |
| Export to CSV | **Export CSV** button | Download step of the import flow |
| Output | `source\|type\|target` edge set + `baseRevision` | Same |

---

## 6. Output and storage



### 6.1 Edge set output

Both modes publish the complete edge set as `source|type|target` strings, plus the revision it was
based on. The editor sends this JSON directly; CSV import builds it from the file's rows. Node
positions, viewport and styling are not part of the output.

```json
{
  "baseRevision": "9f2c1e",
  "edges": [
    "powermeter/schneider/schneider-a/pm009|MEASURES|miner/whatsminer/whatsminer-a/wm041",
    "powermeter/schneider/schneider-a/pm009|CONTROLS|miner/whatsminer/whatsminer-a/wm041",
    "cooling/acme/cdu-a/cdu-c2a|COOLS|container/acme/container-a/c2",
    "container/acme/container-a/c2|CONTAINS|miner/whatsminer/whatsminer-a/wm041"
  ]
}
```

- Each string splits on `|` into exactly three parts. Device IDs never contain `|`; validation
rejects anything that doesn't split cleanly.
- The string is also the edge's identity everywhere: in the diff, in the database's uniqueness rule
and in exports.
- Devices that aren't part of any edge aren't sent; a `Device` node exists in the graph only once
  it has a relationship.
- `revision` is a hash of the sorted edge set, computed by the app. It isn't stored.



### 6.2 Graph model

Two things only: device nodes and typed relationships between them.


| Element           | Fields                                               | Rules                                                               |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| **Node** `Device` | `id`, `metadata` (§3)                                | `id` unique; text-searchable on `id` and `metadata`                 |
| **Relationship**  | `type` (one of §4), `updatedBy`, `updatedAt`         | Directed from `source` to `target`; unique per `source\|type\|target` |


Mapping from edge output to storage:


| Edge string part         | Stored as                                                         |
| ------------------------ | ----------------------------------------------------------------- |
| `source`                 | Start node, matched by `Device.id`                                |
| `type`                   | Relationship type                                                 |
| `target`                 | End node, matched by `Device.id`                                  |
| Publishing user and time | `updatedBy`, `updatedAt` on relationships created in that publish |




### 6.3 Publish

The same transaction serves both modes:

1. **Check the revision.** Hash the current edge set; if it doesn't match `baseRevision`, someone
  published first and the caller gets `409`.
2. **Validate.** Every endpoint is a device returned by `GET /devices`; the type is in the merged
   edge-type config (§4); no self-loops.
3. **Apply the diff.** Upsert endpoint `Device` nodes with their `id` and `metadata`. Compare the submitted strings with the stored ones; delete relationships that
  are gone and create new ones with `updatedBy` and `updatedAt`. Unchanged relationships aren't touched.
4. **Respond** with the new revision and the diff. The app rebuilds the agent outline (§7) in memory.

**Authoring routes** (under `/apps/topology/`):

| Route | Used by | Purpose |
| --- | --- | --- |
| `GET /edge-types` | Both | Merged edge types (§4) |
| `GET /graph` | Both | Edge strings and revision |
| `POST /validate` | Mode A | Validate an edge set without writing |
| `POST /publish` | Mode A | Publish an edge set (JSON, §6.1) |
| `POST /import` | Mode B | Upload a CSV (`text/csv`); `baseRevision` and `dryRun` as query params |
| `GET /export` | Both | Published edges as JSON, or as CSV with `?format=csv` (§5.3) |

---



## 7. GraphRAG — the graph as agent context

The graph is authored, not extracted by an LLM, so traversals over it give exact, complete answers.
The agent gets it in two layers:

- **Outline**, always in the prompt as a cached prefix: edge types with their rules, device counts
  by family, top-level structure and the revision, in ≤ 2k tokens. The app rebuilds it after each
  publish and on start, and holds it in memory.
- **Subgraph context**, per question through `topology_context`, built in four steps:

1. **Link** names, handles and fuzzy matches ("container two") to device IDs with text search on
   device nodes. The LLM never guesses an ID.
2. **Expand** along the edge types the agent picks from the outline, with hop and node caps. A heat
   question about one device follows `COOLS` and `CONTAINS`:
   - walk up `CONTAINS` (0–3 hops), then back along `COOLS` to find the device's coolers;
   - from each cooler, walk forward along `COOLS` and down `CONTAINS` (0–3 hops) to find up to 200
     peers of the same family.
3. **Enrich** the returned devices with their relevant metrics from the Kernel, fetched at call
   time and never stored in the graph, plus contract hints and the `rules` of every type crossed.
4. **Pack**: rank by distance and anomaly, collapse peers into statistics, stop at the token budget,
   stamp the revision, and use short handles with a name map at the end.

Example, *"Why is wm041 running hot?"* (~150 tokens):

```text
topology rev 9f2c1e · types COOLS, CONTAINS · linked: wm041
wm041 (miner) in c2 · cooled by cdu-c2a (via c2) · measured and controlled by pm009
  temperature_out 91 °C (limit 85) HIGH · temperature_in 44 °C · fans normal
cdu-c2a (cooling) supply_temp 31 °C (normal ≤ 27) HIGH · cools c2 (104 devices)
peers under cdu-c2a (103): temperature_in median 43 °C, 97 above 40 °C
rule [COOLS]: most devices cooled by one unit run hot → the cooling unit is the likely cause
names: wm041=miner/whatsminer/whatsminer-a/wm041 · cdu-c2a=cooling/acme/cdu-a/cdu-c2a · ...
```

---



## 8. MCP tools

The MCP server generates one tool per context route in `mdk-plugin.json`, namespaced by app ID
([hld-app-node-plugins.md](./hld-app-node-plugins.md) §8). Each tool runs a fixed, parameterised
traversal; there is no raw-query tool, so agents, including small local models, never write queries.

| Tool                | Input                                                | Returns                                                |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `topology_outline`  | —                                                    | The outline for the current revision (§7)              |
| `topology_find`     | `query`, `family?`                                   | Matching devices with IDs and metadata                 |
| `topology_context`  | `deviceIds?` or `query?`, `types[]`, `budgetTokens?` | Packed subgraph context (§7)                           |
| `topology_traverse` | `deviceId`, `types[]`, `direction`, `depth?`         | Exact device set by hop, with counts beyond the cap    |
| `topology_impact`   | `deviceId`, `command`                                | Devices affected downstream, checked before any action |

- **Limits:** lists cap at 50 with totals; `budgetTokens` defaults to 1,500, max 4,000.
- **Freshness:** every result carries `topologyRevision`; the agent re-reads the outline when it changes.
- **Access:** agent roles get read access to these routes only. Results are filtered by the
  caller's `devices` `resourceNames`; labels are escaped as data, and rules come only from the
  edge-type config (§4).
