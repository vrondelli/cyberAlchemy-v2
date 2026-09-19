# SWU-SGRM-001 Context Pack

## Envelope

- mode: standard-strict
- repository: `domainspec-core`
- project: `projects/domainspec-v2`
- source revision: `7561e08279b4ea3dde6844845f1174d44098f371`
- captured at: `2026-07-11T13:54:07-03:00`
- execution owner: `task-session` local fallback
- mutation boundary: this run may write only under `development/saga-removal/runs/SWU-SGRM-001/`
- runtime delegation: none

## Selected Sources

| Source | Selector | Why selected |
|---|---|---|
| `development/saga-removal/work-pack/tasks/TASK-SGRM-CONTRACT.md` | full task contract | Owns SWU objective, outputs, classification taxonomy, failures, and validation. |
| `development/saga-removal/WORK-PACK.md` | `SWU-SGRM-001`, dependencies, gaps | Establishes sequencing and the non-mutating L1 contract boundary. |
| `development/saga-removal/IMPLEMENTATION-PLAN.md` | target state, migration order, stop conditions | Defines the collapse target and cross-wave constraints. |
| `development/saga-removal/ACTIVE-SURFACE-CENSUS.md` | active and historical surface categories | Supplies the initial census to verify exhaustively. |
| `development/ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md` | accepted decision | Authorizes collapse rather than hardening or keeping Saga. |
| `development/ds-d1-improvement-plan/research/saga-hardening/ACCEPTED-FINDINGS.md` | accepted findings | Establishes build-from-owned as the collapse default and bounds compatibility claims. |
| `definitions/relationships/relationships.yml` | Workflow and Saga `orchestrates` rows | Shows the active DS-D8 edge split that later mutation must collapse into one widened Workflow row. |
| `impl/spec/meta-types/behavioral/workflow.schema.yml` | scope criterion and Saga distinguisher | Shows the active implementation contract that later mutation must widen. |

## Obligation Coverage

| Obligation | Governing evidence | Required SWU-SGRM-001 output |
|---|---|---|
| Classify every case-insensitive whole-word `Saga` match | task contract classification policy | `ACTIVE-REFERENCE-MANIFEST.json` with no unclassified paths. |
| Preserve historical evidence | task failure conditions and implementation plan | Per-path preservation reason and `preserve` action for historical, decision, and receipt classes. |
| Collapse DS-D8 without deleting `orchestrates` | active relationship rows and target-state plan | Frozen transformation to one Workflow row covering same-feature and cross-feature scope. |
| Preserve stable DS-D1 identifiers | implementation plan and task contract | Explicit no-renumber rule after retired `DS-D1.10`. |
| Detect external compatibility obligations | accepted findings and task stop conditions | Consumer scan and a fail-closed external-evidence conclusion. |
| Make execution reversible | task contract | Deletion, rewrite, validation, ownership, rollback, and stop-condition tables. |
| Avoid premature mutation | SWU write scope and dependency order | Packet states planning authority only; all live changes remain assigned to later SWUs. |

## Exclusions

- No live authority, schema, fixture, documentation, decision, inventory, or telemetry mutation.
- No generated artifact refresh.
- No reinterpretation of the accepted collapse decision.
- No broad repository context beyond the named project, except the task-session skill contract already governing this run.

## Coverage Result

All task obligations have at least one selected source and one expected output. No unresolved evidence dependency blocks packet construction.
