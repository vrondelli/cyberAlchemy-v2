---
task_reference: SWU-UIP-002
parent_task: TASK-UIP-MECHANICS
mode: standard
status: pass
created: 2026-07-17
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIP-002

## Task And Output

- Task: port nine accepted UI candidate twins and two representation placement
  contracts into the implementation-owned development profile.
- Output: Page through Binding cards/schemas, Adapter alias and State Indicator
  split contracts, and focused round-trip/mutation/non-collapse tests.
- Authority: development-only. Candidate sources and the repair audit are
  read-only; DS-D1 and DS-D8 remain unchanged.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Preserve each of the nine bounded formation laws and neighbor distinctions. | Candidate `candidates.json`, nine schemas/cards. | covered |
| O2 | Replace meaningful presence-only checks with `attribute-nonempty/v1`. | Repair rule contract; integrated audit; existing validator kernel. | covered |
| O3 | Round-trip generated instances and reject missing, empty, whitespace, wrong fixed, and neighbor mutations. | `instances.ts`; nonempty parity tests; task done criteria. | covered |
| O4 | Keep Adapter an alias of active Mapping and State Indicator a two-branch placement. | Validated UI profile; architecture representation decisions. | covered |
| O5 | Prove pairwise node non-collapse through authority-resolved edges. | Non-collapse core and DS-D8 UI signature slice. | covered |
| O6 | Preserve unresolved relationship endpoints as typed residue. | Task failure modes; work-pack active gap `GAP-UIP-ENDPOINTS`. | covered |
| O7 | Synchronize only after focused and aggregate validation passes. | Task Session contract and work-pack dependency graph. | covered |

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `TASK-UIP-MECHANICS.md` | SWU-UIP-002 algorithm, write scope, done criteria | O1-O7 |
| `profile.yml` | nine formation paths, Adapter target, State branches | O1, O4, O6 |
| candidate `candidates.json` | nine laws, criteria, positives, neighbors, edge sets | O1, O3, O5 |
| candidate `ui/*/*.schema.yml` and cards | exact pre-port twins | O1 |
| repair `attribute-nonempty-v1.yml` | rule semantics and typed outcomes | O2, O3 |
| repair integrated result | 68/68 and DomainSpec 69/69 mechanical baseline | O2 |
| `tools/validate-content.ts` | Markdown criterion support | O2, O3 |
| `tools/instances.ts` | structured generation and validation support | O2, O3 |
| `tools/lib/meta-type-noncollapse.ts` | pairwise witness rules | O5 |
| `relationships.yml` | active UI signature endpoints | O5, O6 |

## Decisions And Assumptions

- Porting changes lifecycle ownership from candidate evidence to the explicit
  development profile; it does not alter the formation laws.
- `attribute-equals` remains for fixed values and already rejects empty and
  whitespace. Every former `attribute-present` UI criterion becomes
  `attribute-nonempty/v1`.
- Adapter and State Indicator receive placement contracts, not formation
  schemas, so instance generation continues to produce exactly nine UI nodes.
- Existing DS-D8 signatures are read for non-collapse only. `shapes` and
  `reflects` reconciliation stays typed owner residue.
- No blocker decision was required.

## Context Builder Summary

- Source groups selected: 10.
- Obligation coverage: 7/7, 100 percent.
- Strict runtime coverage: not applicable; local Task Session.
- Blockers: 0.
