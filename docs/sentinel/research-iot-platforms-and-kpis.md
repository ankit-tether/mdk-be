# ThingsBoard and Zabbix: lessons and KPIs for Sentinel

> **Version:** 0.1.0  |  **Date:** 2026-11-23  |  **Status:** Draft (research)

## 1. Purpose

ThingsBoard and Zabbix are general platforms: ThingsBoard for IoT applications, Zabbix for
infrastructure monitoring. MDK and Sentinel solve a narrower version of the same problem, for
mining sites. This note does three things:

1. Lists the features of both products that matter to MDK and Sentinel, and says whether we already
   have them, should adopt them, or can skip them (§3, §4)
2. Pulls out the patterns and outcomes their case studies report (§5)
3. Proposes the KPIs that measure Sentinel's performance (§7)

**How this was researched.** About 40 pages were read on thingsboard.io, zabbix.com and
blog.zabbix.com: product and feature pages, docs, 10 ThingsBoard case studies, 3 ThingsBoard
use-case pages and 10 Zabbix case studies. Sources are listed in §9.

**Caveats**

- Every outcome figure is published by the vendor, a partner or the customer. None is independently
  checked, and most give no baseline or method.
- Five Zabbix case studies are PDFs that could not be read. Their figures come from the summaries on
  the listing page and are marked *(listing)*.
- Neither vendor publishes a case study on crypto mining, data-center cooling or ASIC fleets. The
  closest are ThingsBoard's mining fleet-tracking template and a Zabbix mining-company dam case
  *(listing)*.

## 2. Where each product sits

| Layer                          | ThingsBoard                              | Zabbix                                    | MDK / Sentinel                                    |
| ------------------------------ | ---------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Device connectivity            | IoT Gateway, 25+ protocols, MQTT/HTTP/CoAP | Agents, SNMP, Modbus plugin, HTTP checks | Workers and `mdk-contract.json`                   |
| Device model                   | Devices, assets, profiles, relations     | Hosts, templates, low-level discovery     | Kernel device list, contracts, topology graph     |
| Remote sites and offline       | ThingsBoard Edge                         | Proxies with local buffering              | Site box: everything runs on site (R-7)           |
| Detection                      | Rule chains, alarm rules, calculated fields | Triggers, functions, event correlation | Sentinel detector engine (rules, episodes)        |
| Analytics and prediction       | Trendz: forecasts, anomalies, health scores | Baseline, forecast, time-left functions | Planned: anomaly score (N-3), drift rules (D-2)  |
| Diagnosis and root cause       | Alarm propagation along relations        | Cause/symptom, trigger dependencies, service trees | Fault rules, unexplained view, Brain Agent Harness |
| Operator workflow              | Alarm ack/clear, notifications           | Ack, escalations, maintenance, SLA        | Reports, ack/close (O-2)                          |
| AI                             | AI assistant, MCP server, local AI with Ollama | AI assistant that can ack, suppress, close | Operator Agent, MCP, QVAC local model        |

**Takeaway.** ThingsBoard is the nearest match to MDK as a platform: devices, assets, relations,
dashboards, edge. Zabbix is the nearest match to the Sentinel detector engine: triggers,
de-duplication, dependencies, maintenance, escalation. Sentinel's diagnosis and learning go further
than either; neither product names a likely fault or proposes new rules.

## 3. Feature map: detection and diagnosis (Sentinel)

Status: **Have** = designed in a Sentinel HLD · **Adopt** = worth adding · **Partial** = partly
covered · **Skip** = not needed.

| Feature | Seen in | Sentinel today | Status | Note |
| --- | --- | --- | --- | --- |
| Hysteresis: separate problem and recovery conditions | Zabbix triggers | `for`, `clear.for`, `clear.when` | Have | Same idea as D-3 |
| Flapping protection | Zabbix | Episode state machine (pending, clearing) | Have | |
| One active alarm per source and type | ThingsBoard alarms | One episode per rule and key | Have | |
| Severity upgrade on an active alarm | ThingsBoard | New rule, new finding | Adopt | Escalate an open finding instead of opening a second one when a stricter rule fires on the same key |
| Alarm lifecycle: active/cleared × acknowledged | ThingsBoard, Zabbix | Findings: open/closed. Reports: ack/close | Partial | Keep ack on reports, not findings; findings stay engine-owned |
| Propagation along relations | ThingsBoard | `keyBy: upstream(...)`, topology graph | Have | Sentinel goes further: fault rules read child findings |
| Cause/symptom marking | Zabbix | `role: symptom \| fault` | Have | |
| Dependencies that suppress downstream alerts | Zabbix, NTT case | Unexplained view lists only symptoms with no fault | Partial | Add: hide symptoms covered by an open fault from notifications, while keeping them in the log (X-4) |
| Event correlation: dedupe, grouping, caps per kind | Zabbix | Harness grouping by topology ancestor | Partial | Also cap how many notifications one rule can send per hour |
| Maintenance windows and one-click suppression | Zabbix | Not designed | **Adopt** | Needed for D-6 (curtailment, maintenance, firmware updates). Suppressed findings are still recorded and labeled `expected` |
| Baseline anomaly with daily and weekly patterns | Zabbix, Trendz | Rules compare to a rolling mean | **Adopt** | Detector HLD §9.3 found rolling means absorb a sustained fault. Use a frozen or seasonal baseline |
| Forecast and time-left to threshold | Zabbix, Trendz | Not designed | **Adopt** | Directly serves D-4: warn before the failure, e.g. time until chip temp reaches its limit |
| Health score per device against a baseline | Trendz | Not designed | Adopt later | Useful for ranking miners in a container; not a finding |
| Fleet outlier ranking | Trendz | `above_peers` rules | Have | |
| Calculated fields (derived metrics) | ThingsBoard | Computed inside `when` | Partial | Shared derived series (J/TH, hashrate per board ratio) would avoid repeating code across rules |
| Low-code rule chains | ThingsBoard | JS rules via PR; YAML/CEL deferred | Skip for now | Detector HLD rejected it for live rules; revisit for operator-written rules (D-9) |
| Service trees and SLA | Zabbix | Not designed | Adopt later | A container or site "hashrate service" with availability %, feeding M-3 |
| Escalations: repeat, delay, next group | Zabbix | S-4 says priority order only | **Adopt** | Escalate unacknowledged P1 reports after N minutes |
| Auto-remediation scripts | Zabbix | Forbidden without approval (S-1) | Skip | By design |
| AI assistant that acts on problems | Zabbix, ThingsBoard | Brain Agent proposes only | Have (stricter) | |

## 4. Feature map: platform (MDK)

| Feature | Seen in | MDK today | Status | Note |
| --- | --- | --- | --- | --- |
| Gateway for legacy protocols | ThingsBoard Gateway | Workers per device family | Have | |
| Device profiles and templates | Both | `mdk-contract.json` per type | Have | |
| Auto-discovery and auto-registration | Zabbix LLD, ThingsBoard provisioning | Kernel device list | Partial | G-3 asks to notice new, moved and missing devices |
| Asset hierarchy (site, container, rack) | ThingsBoard, 8 of 11 cases | Topology graph `CONTAINS` | Have | |
| CMDB / source of truth import | Zabbix (NetBox in LMT, CMDB in BIND, Prodemge) | Topology CSV import | Have | Repair records and asset registers are the mining equivalent |
| Edge with offline operation and sync | ThingsBoard Edge, Zabbix proxies | Site box only | Partial | Multi-site roll-up isn't designed; each site is standalone |
| HA, active-active servers | Zabbix (KDDI, NTT) | Not designed | Later | One site box is a single point of failure for detection |
| RBAC, multi-tenancy, audit log | Both | Gateway RBAC, `resourceNames` | Have | |
| OTA firmware | ThingsBoard | Not in scope | Skip | Firmware updates matter as an expected cause (D-6) |
| Dashboards, SCADA views, wall screens | Both | MDK UI devkit | Have | Public wall-screen links (dacor case) are a cheap win for control rooms |
| Scheduled PDF reports | Both | Weekly scorecard (M-3) | Partial | |
| Notification channels: email, SMS, Telegram, Slack | Both | Not designed | Adopt | Telegram appears in most small-site cases |
| MCP server for agents | ThingsBoard, Zabbix | MCP tools per app | Have | Both vendors now ship this; it is becoming table stakes |

## 5. What the case studies show

### 5.1 Recurring patterns

1. **Noise reduction is the most quoted outcome.** China Pacific Insurance removed 30% of invalid
   alerts; Prodemge had about 20% fewer incidents, mostly false positives; a retailer reports 77%
   better alert accuracy *(listing)*. Alert fatigue, not missed detection, is the usual complaint.
2. **Detection and repair time come next.** Nova Rota cut detection from about 1 hour to under 15
   minutes; T-Systems reports 40% lower MTTR and Selbetti up to 50% *(listing)*; Lumen 30% faster
   incident detection.
3. **Consolidation drives the business case.** NTT went from 12 servers and 3 tools to 1 (about 20%
   cost saving); Telefónica Colombia replaced 20+ tools *(listing)*; Nova Rota saved 85% against its
   legacy tool.
4. **Loss avoided is the clearest value story.** QU!CK cut perishable losses from power outages by
   75%; the mining dam case estimates R$8 million saved a year *(listing)*; Lumen reports 15–20%
   less energy waste.
5. **Remote sites run at the edge.** Energenix (solar plants), Solandtec, CUBA generators and the oil
   and gas template all process and alert locally and keep working through network outages.
6. **Integrators deliver most deployments.** Almost every case was built by a partner. MDK's
   developer skill and app packaging serve the same audience.
7. **Domain KPIs beat generic ones.** Energenix reports performance ratio and capacity utilisation
   for solar; dacor reports utilisation and uptime per machine. Mining needs its own: hashrate
   realisation, J/TH, lost PH·h.
8. **Almost nobody proves impact.** No case reports precision or recall, or compares against a
   control group. Most give before/after numbers with no method.

### 5.2 Cases closest to a mining site

| Case | Why it is relevant | Lesson for Sentinel |
| --- | --- | --- |
| LMT (Zabbix): Modbus current meters on switch cabinets | Power-feed monitoring, like PDUs and breakers | Power meters belong in the topology graph with `MEASURES` |
| CUBA (ThingsBoard): 100+ backup generators, 74+ parameters each | Readiness of idle equipment; missed test runs | Absence rules (a device that should report and doesn't) catch real faults |
| Solandtec (ThingsBoard): blower motors stopped by phase drops | Phase loss and overcurrent stopping continuous loads | Fault logs with timestamp and duration are what technicians use for forensics, which supports evidence bundles (R-3) |
| QU!CK (Zabbix): outages spoiling refrigerated stock | Power and cooling loss with a direct cost | Express outcomes as money lost, as Sentinel should with hashprice |
| Lumen (ThingsBoard): 1,000+ sensors, 10K points/s, factory > line > machine | Similar data rate to one mining site (≈100 readings/s per detector HLD §3.5, more with per-board metrics) | One on-site process is enough at this scale |
| Site fleet tracking (ThingsBoard): mining template | Mining customer base exists, but for vehicles, not ASICs | ASIC mining is an open niche on both platforms |
| Mining dam monitoring (Zabbix *(listing)*): 48,000+ assets | Mining operators already buy monitoring at scale | Safety-related monitoring is a buying reason (S-3) |

## 6. Where Sentinel is different

These are the things neither product offers, and should lead in positioning:

| Sentinel capability | ThingsBoard / Zabbix equivalent |
| --- | --- |
| Names the likely fault with technician closure labels (X-1) | Alarm names only |
| Fault rules over symptom findings, scoped by topology (§4.3 of the detector HLD) | Propagation and dependencies, without a cause |
| Every finding replayable; rule changes backtested before release (D-8, M-5) | Not offered |
| Evidence bundle kept with each finding after raw retention ends (R-3) | History only for the retention period |
| Reports that merge or supersede instead of duplicating (X-8) | Event grouping only |
| Proposes new rules from what current rules miss (N-1, N-2) | AI builds rules on request, with no backtest |
| Proof of impact by random holdout within each container (M-6) | Before/after claims |
| Runs fully on site with a local model (A-3) | Edge needs a server; AI features assume a cloud model unless set up with Ollama |

## 7. KPIs for Sentinel

The KPIs are grouped by the question they answer. Formulas use the event log, the repair records
(L-1) and the labels (L-3). Targets are first proposals for Phase 1, to be set after the baseline
(M-1) is measured. Benchmarks from §5 are given where one exists; they come from different
industries and are indicative only.

### 7.1 North star

**Hashrate protected**: lost hashrate-hours avoided per week, valued at the day's hashprice.

```text
protected = (lost PH·h per 1,000 miners in the control half − lost PH·h per 1,000 miners in the treated half)
            × miners / 1,000 × hashprice
```

It comes from the random split of M-6, so it measures what Sentinel caused, not what happened at
the same time. It is the mining form of the "loss avoided" outcome that the strongest case studies
report (QU!CK, the dam case). Until the split has run long enough, report it with a confidence
interval.

### 7.2 Detection quality: is Sentinel right?

| KPI | Definition | Proposed Phase 1 target | Requirement |
| --- | --- | --- | --- |
| Precision | Findings labeled `real` / labeled findings | ≥ 70% for P1–P2 | M-2 |
| Recall | Repairs preceded by a matching finding / repairs | ≥ 60% for hardware faults | M-2, L-4 |
| Right-fault rate | Reports whose cause matches the repair's closure label / reports with a repair | ≥ 50% | X-1, M-2 |
| Lead time | Repair report time − finding `openedAt`, median, per fault | > 0 for most faults; track the trend | D-4 |
| Head start | Site's own alert or ticket time − finding `openedAt`, median | Positive | M-2, L-6 |
| False alarms per day | Findings labeled `expected` or not `real`, per 1,000 miners per day | Set from technician capacity | D-5 |
| Expected-cause leakage | Hardware findings during curtailment, maintenance or firmware windows / all findings in those windows | ≤ 5% | D-6 |
| Unexplained ratio | Open symptoms with no open fault / open symptoms | Falling week on week | X-4 |

### 7.3 Noise: can the technicians absorb it?

The case studies show that this, more than missed detection, decides adoption.

| KPI | Definition | Proposed target | Benchmark |
| --- | --- | --- | --- |
| Reports per fault | Reports opened / distinct faults repaired | ≈ 1 | X-7, X-8 |
| Findings per report | Findings in a report, median | Tracked, not targeted | Shows grouping works |
| Duplicate-report rate | Reports later merged or superseded / reports | ≤ 10% | |
| Notifications per technician shift | Notifications sent / technicians on shift | Agreed with site | |
| Flap rate | Findings closed and reopened on the same key within 1 h / findings | ≤ 5% | Zabbix flapping protection |
| Invalid-alert reduction | Drop in invalid alerts against the site's current alerting | ≥ 30% | China Pacific 30%, Prodemge ~20% |

### 7.4 Operations: does the site get better?

From M-1, compared between treated and control halves (M-6), and against the baseline.

| KPI | Definition | Benchmark |
| --- | --- | --- |
| MTTD | Fault start (first abnormal reading in the evidence) → finding opened | Nova Rota −80–85%; Lumen −30% |
| MTTA | Report created → acknowledged | |
| MTTR | Report created → miner back online (L-1) | T-Systems −40%, Selbetti −50% *(listing)* |
| Unplanned downtime | Miner-hours offline outside planned windows, per 1,000 miners | |
| Failures per 1,000 miners | By closure label, per month | M-1 |
| Repeat failure rate | Same miner, same closure label, within 30 days / repairs | |
| No-fault-found rate | Repairs closed as "no fault found" / repairs triggered by Sentinel | Measures wasted technician trips |
| Hashrate realisation | Actual hashrate / nominal hashrate of online miners | Mining form of Energenix's performance ratio |
| Efficiency drift | Change in J/TH per model over time | Early sign of hashboard and cooling decline |

### 7.5 Data and coverage: can Sentinel see the site?

| KPI | Definition | Proposed target | Requirement |
| --- | --- | --- | --- |
| Roster coverage | Miners read in the last hour / miners in the MDK roster | ≥ 99% | T-1 |
| Metric coverage | Required metrics present per miner model / required | 100% of T-2 | T-2 |
| Data-quality rate | `data.*` findings per 1,000 miners per day | Falling | T-6 |
| Detection latency | Reading time → finding event time, p95 | ≤ 2 pull intervals | Detector HLD §3.1 |
| Topology coverage | Miners with a `CONTAINS` and a `COOLS` path / miners | 100% | G-1, G-2 |
| Repair match rate | Repairs matched to an MDK miner ID / repairs | ≥ 95% | L-2 |
| Label rate | Findings labeled within 7 days / findings | ≥ 80% | L-3; precision is unreliable without it |

### 7.6 Agent and reports: can the text be trusted?

| KPI | Definition | Proposed target | Requirement |
| --- | --- | --- | --- |
| Grounding pass rate | Drafts passing the number and ID check first time / drafts | ≥ 95% | A-1 |
| Template fallback rate | Runs ending in a template report / runs | ≤ 5% | |
| Finding-to-report time | Finding opened → report written, p95 | ≤ 5 min | |
| Report usefulness | Reports acknowledged without edit or "not useful" flag / reports | ≥ 70% | O-1 |
| Run cost | Tokens and seconds per run, p95 | Within budget | A-4 |

### 7.7 Learning: does Sentinel improve?

| KPI | Definition | Requirement |
| --- | --- | --- |
| Rule proposals accepted | Accepted / filed, per month | N-1 |
| Backtest uplift | Recall or lead time gained by an accepted rule on past cases | N-2 |
| Coverage of closure labels | Closure labels with at least one fault rule / closure labels | X-1, X-6 |
| Rule churn with regressions | Rule versions whose backtest changed existing findings unexpectedly | D-8 |

### 7.8 System health

| KPI | Definition | Proposed target |
| --- | --- | --- |
| Sentinel availability | Time the engine is current (watermark within 2 intervals) / time | ≥ 99.5% |
| Restart recovery time | Restart → watermark current | ≤ 5 min |
| Disk use | Bytes used / sized budget | ≤ 80% (P-3) |
| Event log backup age | Time since last successful backup | ≤ 24 h (R-5) |

### 7.9 Weekly scorecard

M-3 asks for a weekly scorecard. A short version, in order:

1. Hashrate protected, with its confidence interval
2. Precision, recall and right-fault rate, per fault
3. Lead time and head start, per fault
4. False alarms per 1,000 miners per day, and reports per fault
5. MTTD, MTTR and downtime: treated, control and baseline
6. Coverage and label rate, with a warning when either is too low to trust the rest
7. Best catches, worst false alarms and the week's rule changes (M-4)

## 8. Recommendations

In priority order:

1. **Maintenance and curtailment windows** that suppress and label findings as `expected`. Every
   case study's noise problem starts here, and D-6 requires it.
2. **Forecast and time-left rules** for slow faults (chip temperature, efficiency drift), so that
   flags come before failures (D-4).
3. **Seasonal or frozen baselines** for anomaly rules, to fix the drift problem the proof of concept
   found.
4. **Notification policy**: hide symptoms covered by an open fault, cap notifications per rule, and
   escalate unacknowledged P1 reports.
5. **Label capture in the report workflow**, because precision, recall and the north star all
   depend on it, and none of the case studies measure them.
6. **Lead with proof of impact.** The vendors publish before/after claims with no method. A
   randomised holdout with precision and recall is a clear differentiator.

## 9. Sources

**ThingsBoard** (thingsboard.io)

- Product: `/`, `/products/`, `/products/thingsboard-pe/`, `/products/thingsboard-edge/`,
  `/products/trendz/`, `/products/mobile/`
- Docs: `/docs/iot-gateway/`, `/docs/pe/concepts/data-processing/`,
  `/docs/pe/concepts/alarms-and-notifications/`, `/docs/pe/concepts/digital-twin-model/`,
  `/docs/pe/user-guide/alarms/`, `/docs/pe/user-guide/rule-nodes/`
- Case studies: `/case-studies/` and `energenix`, `cuba-iot-platform`, `solandtec`, `energroup`,
  `lumen`, `dacor`, `comet`, `iona`, `crai`
- Use cases: `/use-cases/`, `site-fleet-tracking`, `scada-oil-and-gas-drilling-system`,
  `smart-energy`

**Zabbix**

- https://www.zabbix.com/case_studies, https://www.zabbix.com/features
- https://www.zabbix.com/case_studies_quick_scan_go, `case_studies_kddi`, `case_studies_ntt`
- blog.zabbix.com: LMT (30834), China Pacific Insurance (30913), London Underground (26924),
  Nova Rota do Oeste (32810), GTD Group (6775), BIND (33358), Prodemge (32612)
- Listing only (PDFs not readable): T-Systems, Selbetti, Telefónica Colombia, EXECON, mining dam
  monitoring
