---
task: invoke-refresh-bte-009-order-repair
mode: standard
strict: true
status: pass
evidence_kind: invoke-refresh-context
created_at: 2026-07-20
---

# Context Pack — BTE-009 Order Repair

## Objective

Translate the rejected implementation-completion audit into the smallest coherent
artifact delta: preserve `SWU-BTE-009` as the edge/16-signature proof, make that
proof a prerequisite of `verify:bte:core`, and keep IOLM and Body War execution
independently owned after the core gate and before `SWU-BTE-010` composes the
terminal `verify:bte` result.

This pack is refresh evidence. It does not execute a BTE SWU, run a consumer,
select the S1 predicate source, or promote the rejected findings.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| R1 | Bind the final audit rejection and exact failed mapping. | review `audit.md` | covered |
| R2 | Preserve the existing identity and scope of `SWU-BTE-009`. | BTE Work-Pack, edge task, W2 | covered |
| R3 | Make edge/16-signature evidence part of the BTE core prerequisite set. | audit, integration task, Work-Pack | covered |
| R4 | Place actual IOLM and Body War runs after core and outside BTE SWU identity. | audit, consumer task, gaps | covered |
| R5 | Make `SWU-BTE-010` validate fresh external receipts and compose terminal `verify:bte`. | audit, consumer task, verification task | covered |
| R6 | Identify every authored route projection that encodes the affected order. | findings, plan, Work-Pack, execution pack, W4, dispatch | covered |
| R7 | Preserve S1, `DEC-GCP-001`, every other SWU identity, and the original audit evidence. | findings, audit, EVF Work-Pack | covered |
| R8 | Keep this run proposal-only and map every proposed delta to a refresh signal. | Invoke Refresh contract and reports | covered |
| R9 | Record a non-decorative Dispatch Spec technique trace and owner boundaries. | technique catalog and refresh report | covered |
| R10 | Define apply and re-audit validation, including a deliberately refreshed corpus manifest. | patch proposal and machine report | covered |

Coverage: 10/10, 100 percent. Blockers: none for proposal authoring. Runtime
handoff is not requested.

## Selected Evidence

| Source | Selectors | Obligations |
| --- | --- | --- |
| `reviews/2026-07-20-implementation-completion/audit.md` | verdict, failed backend check, residual risks, closure | R1, R3-R5, R7, R10 |
| `reviews/2026-07-20-implementation-completion/findings.md` | ICR-BTE-002R/004/005, backend order, S1 lock | R3-R7 |
| BTE `WORK-PACK.md` | task table, SWU-008/009/010 rows, validation, gaps | R2-R6 |
| BTE `PLAN.md` | implementation sequence and technique trace | R3-R6 |
| `TASK-BTE-EDGE-COVERAGE.md` | objective, positive standard, dependencies, done criteria | R2, R3, R7 |
| `TASK-BTE-INTEGRATION.md` | current mixed core/consumer objective and done criteria | R3, R6 |
| `TASK-BTE-INTEGRATED-CONSUMER-MANIFEST.md` | required handoffs and fail-closed rules | R4-R6 |
| BTE `EXECUTION-PACK.md` | W2/W4 order and closure obligations | R2-R6 |
| `W2-ALL-BACKEND-KINDS.md` | explicit `SWU-BTE-009` edge-proof ownership | R2, R7 |
| `W4-INTEGRATE-VERIFY.md` | current 008 -> 010 -> verify order | R3-R6 |
| `TASK-BTE-VERIFY.md` | independent consumer-receipt verification boundary | R4, R5, R7 |
| `work-pack/shared/TRACEABILITY.md` | BTE-009 edge trace and BTE-010 consumer trace | R2, R5, R7 |
| BTE `EXECUTION-DISPATCH.json` | one-SWU route gates and stop conditions | R3-R6, R9 |
| Inventory entry `domainspec-v2-evf-implementation-completion-review-result` | indexed blocker and bounded next action | R1, R8 |

Files selected: 14. Every selected file closes at least one obligation. Noise
ratio: 0.00.

## Excluded Candidates

- Attacker and verifier transcripts: excluded because the final audit and corrected
  findings preserve the dispositions needed for this one sequencing repair.
- Engine source and tests: excluded because proposal-only refresh does not implement
  S1 or BTE behavior.
- Lean source: excluded because the accepted reuse classification is unaffected.
- UI work: excluded because backend and UI are independent lanes.
- Craft and release projections: excluded because no SWU status, selection, release,
  or production state changes in this refresh.

## Authority And Write Boundary

The rejected audit and its original corpus manifest remain historical evidence.
The proposal's authored files are limited to this dated refresh directory.
Repository-local Invoke observability may append its required non-authority run
record outside that directory. A later `apply-approved` refresh may patch the eight
inventoried authored targets and create a new machine-readable re-audit corpus
manifest; it must not rewrite the original audit or original manifest.

IOLM and Body War own their executions and receipts. BTE consumes stable receipt
handles; it does not execute those consumers under a repurposed BTE SWU.

## Dispatch Technique Selection

- `sequence` defines the corrected edge proof -> core -> external consumers ->
  integrated manifest -> terminal verification order.
- `concrete_path_evidence` binds the audit, target artifacts, and preimage digests.
- `artifact_contract_bridge` maps each refresh signal to exact proposed edits.
- `execution_receipt_handoff` requires fresh IOLM and Body War receipt handles.
- `state_namespace_boundary` separates historical review evidence, authored plans,
  BTE receipts, and consumer-owned receipts.
- `owner_boundary_check` prevents BTE from executing or authoring consumer proof.
- `approval_semantics_map` keeps this run proposal-only.
- `validation_loop` defines apply checks and final re-audit.
- `residue_ledger` preserves apply approval, re-audit, and `DEC-GCP-001` blockers.

A new full dispatch JSON is not required for this proposal: there is no delegated
execution, subagent route, protected-context transfer, or reusable route install.
The existing BTE `EXECUTION-DISPATCH.json` is itself an inventoried patch target so
the applied machine route will receive the same ordering guards.

Distill is skipped because the repair is already the smallest coherent unit. A
smaller change to `findings.md` alone would leave the BTE core task and executable
route projections inconsistent; a larger redesign or new SWU would exceed the
audited problem.
