---
task: invoke-refresh-fpr01-003-pass-sync
mode: standard
strict: true
status: pass
evidence_kind: invoke-refresh-context
created_at: 2026-07-17
---

# Context Pack — FPR01-003 PASS Synchronization

## Objective

Translate the verified `SWU-FPR01-003` replay PASS into the smallest coherent
Work-Pack, Craft, and generated-roadmap delta without ratifying FPR-01, executing
`SWU-FPR01-004`, entering FPR-02, or authorizing production.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| R1 | Bind the superseding human and machine replay receipts by digest. | replay receipts | covered |
| R2 | Prove the three recorded FPR01-003 blockers satisfy their closure conditions. | replay dependencies and validation matrix | covered |
| R3 | Inventory every stale planning and continuation projection. | Work-Pack, task, waves, execution pack, layering, Craft | covered |
| R4 | Distinguish canonical roadmap state from generated visibility projections. | `ROADMAP.md`, Craft ledger, roadmap builder contract | covered |
| R5 | Preserve the unratified validation-candidate authority boundary. | replay receipt and FPR-01 contract | covered |
| R6 | Make FPR01-004 only the proposed next selected unit; do not execute it. | FPR-01 task and replay handoff | covered |
| R7 | Default to proposal-only without explicit apply approval. | Invoke Refresh mutation gate | covered |
| R8 | Map every proposed delta to a typed refresh signal. | refresh signal model and patch proposal | covered |
| R9 | Record a Dispatch Spec technique trace and owner boundary. | technique catalog and report trace | covered |
| R10 | Provide executable apply-phase validation. | builder, tests, guard, parse, diff checks | covered |

Coverage: 10/10, 100 percent. Blockers: none for proposal authoring. Fallback
search: one bounded filename lookup after Inventory lacked the current replay entry.

## Selected Evidence

| Source | Selectors | Obligations |
|---|---|---|
| `runs/SWU-FPR01-003/TASK-SESSION-RESULT.md` | outcome, dependency closure, replay evidence, boundary, handoff | R1, R2, R5, R6 |
| `runs/SWU-FPR01-003/replay-result.json` | status, dependency digests, aggregate, authority flags, unsynchronized state | R1, R2, R5-R8 |
| `WORK-PACK.md` | task table, SWU handoff, blockers, gates, change log | R3, R6, R8 |
| `work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md` | FPR01-003/004 contracts and synchronization rule | R3, R5, R6 |
| `work-pack/tasks/TASK-FPR01-003-REMEDIATION.md` | blocker state, child SWUs, completion evidence | R2, R3 |
| `work-pack/waves/W1-AUTHORITY-BASELINE.md` | W1 order, blocker receipt, promotion gate | R3, R6 |
| `work-pack/waves/W1R-FPR01-003-REMEDIATION.md` | entry, child states, exit boundary | R2, R3 |
| `EXECUTION-PACK.md` | planning controls, schedule, current execution state | R3, R6 |
| `IMPLEMENTATION-LAYERING.md` | nested remediation boundary and next layer | R3, R5, R6 |
| `projects/domainspec-v2/.craft/ledger.yml` | active blockers, FPR context, artifacts, next move | R2-R6, R8 |
| `ROADMAP.md` | FPR-01 remains blocked/open pending ratification | R4-R6 |
| prior blocker refresh report | prior synchronized state and projection boundary | R2-R4 |
| visibility builder | Craft/manifest input boundary and deterministic `--check` | R4, R10 |
| visibility Work-Pack | generated-view acceptance and test surface | R4, R10 |

Files selected: 14. Every selected file closes at least one obligation. Noise ratio:
0.00.

## Excluded Candidates

- Guard and sample child receipts: excluded because both are digest-bound and
  summarized by the replay receipts.
- Baseline/schema/validator/fixtures: excluded because the replay proves them
  immutable and the refresh proposes no implementation change.
- Inventory synthesis page: excluded as stale for this exact replay; the lookup gap
  is recorded in the refresh report.
- Whole-session transcript: excluded because receipt selectors are sufficient.

## Authority And Write Boundary

This context pack is session evidence. It authorizes only proposal artifacts under
`refreshes/2026-07-17-fpr01-003-pass-sync-proposal/`.

Target Work-Pack, Craft, roadmap, visibility, authority, implementation, definitions,
and Task Session files remain read-only until a later explicit `apply-approved`
Invoke Refresh.

## Dispatch Technique Selection

- `execution_receipt_handoff` binds the replay receipt to the refresh.
- `concrete_path_evidence` binds exact paths and digests.
- `state_namespace_boundary` separates planning, Craft authority, canonical roadmap,
  and generated views.
- `owner_boundary_check` and `authority_split_gate` prevent ratification or execution.
- `approval_semantics_map` keeps this run proposal-only.
- `artifact_contract_bridge` maps signals to exact file deltas.
- `validation_loop` defines rebuild/check/test evidence.
- `residue_ledger` preserves approval and Inventory freshness residue.

A full dispatch JSON is not required: there is no delegation, parallel execution,
protected-context transfer, or reusable route installation.
