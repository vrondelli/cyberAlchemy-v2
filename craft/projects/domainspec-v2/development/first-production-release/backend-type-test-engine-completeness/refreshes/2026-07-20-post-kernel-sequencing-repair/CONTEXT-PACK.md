# Context Pack — Post-kernel sequencing repair

## Task

Produce an exact proposal-only Invoke Refresh that removes the circular continuation state after `SWU-BTE-001` without editing governed BTE planning targets.

## Mode And Boundary

- Context Builder mode: `standard`
- Strict obligation coverage: `pass` (`8/8`)
- Mutation mode: `proposal-only`
- Authorized write surface: this run-local refresh folder only
- Governed target mutation: none
- Subagent dispatch: none

## Selected Evidence

| Source | Selector | Obligation fit |
| --- | --- | --- |
| `.arcanum/inventory/index.json` | BTE/EVF entries and source references | Resolve indexed BTE evidence and expose the missing current continuation entry. |
| `work-pack/session-evidence/SWU-BTE-001/20260720T192338Z-shared-criterion-kernel/execution-receipt.json` | `result`, `validation`, `residue` | Prove `SWU-BTE-001` completed and Invoke owns the package refresh. |
| `work-pack/session-evidence/SWU-BTE-001/20260720T192338Z-shared-criterion-kernel/continuation-route.json` | `selection`, `returned_next_route` | Establish proposal-only Invoke Refresh as the selected continuation. |
| `WORK-PACK.md` | `SWU Manifest`, continuation paragraph, `Distill Validation` | Locate the extra `002` dependency, stale status, and stale next-unit prose. |
| `work-pack/tasks/TASK-BTE-NODE-COVERAGE.md` | `Dependencies and blockers`, `SWU-BTE-003/Algorithm` | Establish the task-owned dependency `003 -> 001` and the bounded adapter contract. |
| `work-pack/waves/W1-SHARED-KERNEL.md` | `Sequence`, `Exit gate`, `Promotion` | Establish the intended W1 sequence `001 -> 003`. |
| `work-pack/waves/W2-ALL-BACKEND-KINDS.md` | `Sequence`, `Entry gate` | Preserve the rule that profile binding waits for W1 kernel-and-adapter evidence. |
| `EXECUTION-PACK.md` | `Wave Board`, `Ordering And Parallelism` | Confirm `003` depends only on `001` and identify the stale W1 state. |
| `IMPLEMENTATION-LAYERING.md` | `Recommended Next Layer` | Identify the stale recommendation that still names completed `001`. |
| `EXECUTION-DISPATCH.json` | `subagent_strategy` | Identify stale route context that still names `001` as next. |
| `PLAN.md` | `Execution Order`, `Dispatch Technique Trace` | Confirm kernel -> adapter -> profile/corpus sequencing. |
| `refreshes/2026-07-20-swu-readiness-continuation/refresh-report.json` | source signals and applied status delta | Explain why `002` is currently blocked and preserve the prior receipt as immutable evidence. |

## Obligation Coverage

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| `O-REF-001` | Prove `SWU-BTE-001` completed. | Terminal Task Session receipt. | covered |
| `O-REF-002` | Determine the intended direct dependency of `SWU-BTE-003`. | Node task, W1, Execution Pack, Plan. | covered |
| `O-REF-003` | Locate the contradictory dependency cell. | Work Pack manifest. | covered |
| `O-REF-004` | Preserve W2's adapter-before-profile entry gate. | W2 wave contract. | covered |
| `O-REF-005` | Name one next ready candidate without selecting it. | W1 order plus Task Session selection boundary. | covered |
| `O-REF-006` | Synchronize every live continuation surface. | Work Pack, Execution Pack, Layering, Dispatch. | covered |
| `O-REF-007` | Bind every delta to a RefreshSignal and target preimage. | Refresh report and patch proposal. | covered |
| `O-REF-008` | Preserve owner and mutation boundaries. | Invoke Refresh contract and proposal-only mode. | covered |

## Inventory Lookup Result

- Machine index: parseable, 191 entries, source coverage `partial`.
- Relevant indexed evidence: BTE/EVF review and re-audit entries resolve the work-pack and accepted planning substrate.
- Gap: no Inventory entry yet represents the `SWU-BTE-001` completion receipt or this post-run continuation state.
- Exclusion: Inventory synchronization is not part of this proposal's mutable target inventory; it remains a separately owned follow-up after an applied refresh.

## Synthesis

The circular state is introduced by one manifest-only dependency. Task-local authority, W1, the Execution Pack, and the Plan all agree that the intended path is `SWU-BTE-001 -> SWU-BTE-003`; W2 then admits `SWU-BTE-002` only after W1 adapter evidence passes. The smallest coherent repair therefore removes `002` from the `SWU-BTE-003` manifest dependency, exposes `003` as the sole `ready-after-selection` candidate, leaves `002` blocked, and updates the continuation read models that still point at `001`.

## Exclusions

- `DISTILL-VALIDATION.md`: retained as the historical validation of the initial plan rather than rewritten as a live continuation board.
- `PLAN.md`, W1, W2, and `TASK-BTE-NODE-COVERAGE.md`: already express the intended order; no patch needed.
- Task Session receipts and prior refresh receipts: immutable evidence.
- Implementation, definitions, authority, Craft, Inventory, and public Arcanum artifacts: outside scope.
