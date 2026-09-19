# SWU-SGRM-002 Retry 001 Context Pack

## Envelope

- mode: standard-strict
- task: `SWU-SGRM-002`
- attempt: retry-001
- runtime: local
- delegation: none
- dependency: `SWU-SGRM-001` PASS
- blocker repair: Invoke refresh PASS, option 1 selected
- mutation boundary: canonical DS-D1/DS-D8 authority, named root projections,
  `saga.schema.yml#edge_participation.source_of` only, and retry evidence

## Selected Sources

| Source | Controlling obligation |
|---|---|
| `work-pack/tasks/TASK-SGRM-AUTHORITY.md` | Refreshed transformation, bridge, scope, done criteria, validation. |
| `WORK-PACK.md` | `ready-refreshed` state and dependency/acceptance row. |
| `refreshes/2026-07-11-sgrm-002-validation-cycle/REFRESH-REPORT.md` | Applied repair provenance and boundaries. |
| `runs/SWU-SGRM-002/DECISION-GATE.md` | Accepted minimal bridge decision. |
| `runs/SWU-SGRM-002/TASK-SESSION-RESULT.md` | Preserved first-attempt failure and rollback evidence. |
| `runs/SWU-SGRM-001/MIGRATION-PACKET.md` | Collapse target, stable IDs, history, rollback, and stop rules. |
| `definitions/meta-types/meta-types.yml` and `.md` | Live DS-D1 registry and cards. |
| `definitions/relationships/relationships.yml` and `.md` | Live two-row DS-D8 authority. |
| `definitions/DEFINITIONS.md` and `DEFINITIONS-INDEX.md` | Root projections. |
| `discovery/domainspec-v2-discovery.md` | Stale open-decision projection to reconcile. |
| `impl/spec/meta-types/behavioral/saga.schema.yml` | Exact validator-conflicting field; all other fields protected. |

## Execution Obligations

1. Remove only active `DS-D1.10`; preserve every later identifier.
2. Widen DS-D1 Workflow authority to intra-feature and cross-feature scope.
3. Replace two DS-D8 `orchestrates` rows with one Workflow row retaining
   `Operation`, `one_to_many_ordered`, and both edge scopes.
4. Remove unsupported participant/compensation claims from active authority.
5. Clear only the legacy schema's `edge_participation.source_of` list.
6. Keep schema criterion, companion, fixtures, identity, and file existence
   unchanged for SGRM-004.
7. Reconcile canonical human/index projections and mark discovery OQ-7 resolved.
8. Leave research-description references in the project README untouched.

## Gates And Proof

| Gate | Proof |
|---|---|
| Stable identity | Exact member IDs are `DS-D1.1..9`, `DS-D1.11..14`; no renumbering. |
| One edge row | Structured JSON assertion over root relationships. |
| Bridge boundary | Focused schema before/after assertion; only source-of changes. |
| Root absence | Whole-word active-root scan returns no active type/endpoint reference. |
| Parse | Ruby YAML parse for DS-D1; JSON parse for DS-D8. |
| Repository contracts | `validate:rels` and `validate:docs` pass. |
| Partial promotion | Any failed gate rolls back authority and bridge together. |

## Coverage Result

PASS. The prior contradiction is resolved by an approved, one-field scope
amendment; every mutation and done criterion has a proof surface.
