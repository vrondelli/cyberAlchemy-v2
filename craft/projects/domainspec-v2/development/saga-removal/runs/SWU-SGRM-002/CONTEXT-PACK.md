# SWU-SGRM-002 Context Pack

## Envelope

- mode: standard-strict
- task: `SWU-SGRM-002`
- runtime: local
- delegation: none
- dependency: `SWU-SGRM-001` PASS
- mutation boundary: canonical DS-D1/DS-D8 authority and named root projections, plus this run folder

## Selected Sources

| Source | Obligation |
|---|---|
| `development/saga-removal/work-pack/tasks/TASK-SGRM-AUTHORITY.md` | Owns transformation rules, scope, done criteria, and validation. |
| `development/saga-removal/WORK-PACK.md` | Owns dependency order and the no-partial-promotion gate. |
| `development/saga-removal/runs/SWU-SGRM-001/MIGRATION-PACKET.md` | Freezes target rows, stable-ID policy, compatibility, rollback, and stop conditions. |
| `development/saga-removal/runs/SWU-SGRM-001/TASK-SESSION-RESULT.md` | Proves the dependency passed. |
| `definitions/meta-types/meta-types.yml` | Machine DS-D1 registry to remove only `DS-D1.10`. |
| `definitions/meta-types/meta-types.md` | Human DS-D1 cards and maturity ledger. |
| `definitions/relationships/relationships.yml` | Machine DS-D8 authority containing the two active `orchestrates` rows. |
| `definitions/relationships/relationships.md` | Human DS-D8 projection and active signature count. |
| `definitions/DEFINITIONS.md` | Root DS-D8 definition projection. |
| `definitions/DEFINITIONS-INDEX.md` | Root DS-D1 member index. |
| `README.md` | Root project projection; references are research descriptions, not active authority. |
| `discovery/domainspec-v2-discovery.md` | Current discovery projection containing the superseded open merge question. |

## Frozen Obligations

| Obligation | Execution rule | Proof |
|---|---|---|
| Retire DS-D1 member | Delete only the active `DS-D1.10` row/card/index entry. | Active-root scan and YAML parse. |
| Preserve identity | Keep `DS-D1.11+` identifiers unchanged; represent the backend slice with an explicit gap. | Before/after ID comparison. |
| Widen Workflow | Make DS-D1 Workflow cover declared intra-feature and cross-feature scope. | Focused authority diff. |
| Preserve edge verb | Replace two rows with one Workflow `orchestrates` row. | Exactly-one-row assertion. |
| Preserve expressiveness | Keep `Operation`, `one_to_many_ordered`, and both DS-D8 scopes. | Structured row assertions. |
| Remove unsupported claims | Do not carry participant/compensation obligations into the surviving row. | Structured/text scan. |
| Reconcile projections | Update canonical human/root projections and the stale discovery merge status. | Docs validation and active-root scan. |
| Stage safely | Do not touch schemas, fixtures, validators, tests, or generated instances in this SWU. | Scoped changed-path check. |

## Decisions And Gates

- Decision count: zero; collapse and direct migration are already accepted.
- External-consumer gate: clear based on SGRM-001 evidence.
- Shape gate: clear; exactly two expected source rows exist and share target and multiplicity.
- Promotion gate: DS-D1 and DS-D8 changes must validate and be reported together.
- Known staged residue: implementation schemas remain old until SGRM-003/004 and cannot be treated as final recomposition.

## Coverage Result

Strict coverage passes. Every done criterion, write boundary, rollback condition,
and validation command has a selected source and a concrete proof surface.
