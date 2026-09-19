---
swu_id: SWU-SGRM-006
task_id: TASK-SGRM-SYNC
status: active
createdAt: 2026-07-11
runtime: local-fallback
strict_handoff_coverage: not-applicable
---

# Context Pack: SWU-SGRM-006

## Objective

Reconcile current DomainSpec v2 product guidance, execution plans, and Inventory
read models with the accepted Saga-to-scoped-Workflow collapse. Preserve the
historical evidence that explains why the decision was made.

## Controlling Sources

- `work-pack/tasks/TASK-SGRM-SYNC.md` owns reconciliation rules and acceptance.
- `runs/SWU-SGRM-001/ACTIVE-REFERENCE-MANIFEST.json` owns the classified file
  census and identifies current-plan/projection surfaces.
- `runs/SWU-SGRM-001/MIGRATION-PACKET.md` owns the migration contract.
- `runs/SWU-SGRM-002/RETRY-001/TASK-SESSION-RESULT.md` proves canonical DS-D1
  and DS-D8 authority synchronization.
- `runs/SWU-SGRM-003/TASK-SESSION-RESULT.md` proves contract and Workflow scope
  synchronization.
- `runs/SWU-SGRM-004/TASK-SESSION-RESULT.md` proves implementation projection,
  schema, fixture, and generated-instance migration.
- `runs/SWU-SGRM-005/TASK-SESSION-RESULT.md` proves negative Saga relationship
  rejection and generic non-collapse validation.
- `development/ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md` is the
  governing owner decision and remains read-only.

## Derived Current State

- DS-D1 has 13 active backend members and no active `DS-D1.10` member.
- DS-D8 has one Workflow `orchestrates` signature with declared
  `intra-feature` and `cross-feature` scopes.
- Workflow validation accepts both declared scopes.
- Active Saga cards, schemas, positive meta-type fixtures, generated instances,
  and relationship signatures have been removed.
- The bad Saga relationship fixture is intentional negative proof and remains
  active implementation evidence.
- Full migration closeout is not proven until SWU-SGRM-008.

## Write Boundary

Allowed:

- current product and learning projections named by the manifest;
- active DS-D1 improvement-plan status, wave, task, dispatch, and shared route
  views;
- active R3 relationship-hardening status, wave, task, execution, and shared
  route views;
- older current-plan/formalization packages only to add a clear supersession
  notice or replace an executable stale claim;
- Inventory entries and derived indexes needed to prevent future hardening
  routing;
- this SWU's context, status table, and receipt;
- SGRM work-pack status synchronization after validation.

Read-only:

- completed research and reviews;
- governing and superseded decision records;
- refresh reports, prior task-session results, and receipts;
- `development/r3-research/**`, `research/**`, and nested `research/**`;
- the intentional `bad-saga-orchestrates-operation` negative fixture and test;
- unrelated IDE-extension and Arcanum-submodule changes already in the worktree.

## Reconciliation Rules

1. Product language uses Workflow with explicit declared scope.
2. Counts are derived as 13 backend plus 11 formation-deferred UI labels, for
   24 staged labels where a combined learning view is still needed.
3. DS-D1 records SWU-DSD1-007 as decided, SWU-DSD1-008 as
   cancelled/not-selected, and SWU-DSD1-009 as routed through SGRM receipts
   without claiming SGRM-008 closeout.
4. R3 records TASK-R3H-SAGA-LAWS and SWU-R3H-006/007 as
   superseded/cancelled, preserves their files, and removes them from active
   promotion gates.
5. Retained experimental or design mentions must be explicitly marked as
   historical baseline evidence, not current authority or executable work.
6. Inventory must route current continuation to Saga removal/verification, not
   to hardening.

## Gate And Decisions

- Dependency gate: PASS; SWU-SGRM-005 receipt exists and reports PASS.
- Owner decision: already resolved to collapse by `DEC-DSD1-SAGA-FORK`.
- New blocker decisions: none.
- Runtime handoff: none; local execution.
- Subagents: none.

## Validation Surface

- `npm --prefix projects/domainspec-v2/impl run validate:docs`
- classified current-plan Saga scan
- JSON parse for modified dispatch and Inventory indexes
- YAML parse for modified YAML surfaces, if any
- `git diff --check`
- classified diff review proving historical files were not rewritten
