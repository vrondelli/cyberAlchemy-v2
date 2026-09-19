---
swu_id: SWU-SGRM-008
task_id: TASK-SGRM-VERIFY
status: active
createdAt: 2026-07-11
runtime: local-fallback
strict_handoff_coverage: not-applicable
---

# Context Pack: SWU-SGRM-008

## Objective

Recompose SGRM-001..007 into a bounded final removal result, run every named
validation surface, and synchronize DomainSpec Craft, Inventory, observability,
DS-D1 routing, and SGRM status from receipts only.

## Controlling Evidence

- `work-pack/tasks/TASK-SGRM-VERIFY.md` owns ordered closeout rules and
  invariants.
- `WORK-PACK.md` marks SWU-SGRM-008 ready after completed SGRM-007.
- `runs/SWU-SGRM-001/TASK-SESSION-RESULT.md` proves the migration contract,
  manifest, stable-ID policy, and no-evidenced-external-consumer boundary.
- `runs/SWU-SGRM-002/RETRY-001/TASK-SESSION-RESULT.md` is the successful
  authority-migration receipt; the pre-retry blocked result is not completion
  evidence.
- `runs/SWU-SGRM-003..007/TASK-SESSION-RESULT.md` prove Workflow scope support,
  active implementation removal, negative rejection coverage, current-plan
  synchronization, and the classified reference guard.
- `runs/SWU-SGRM-007/ZERO-ACTIVE-SAGA-REPORT.json` owns the machine reference
  audit and exact exception classifications.
- `projects/domainspec-v2/CRAFT.md`, the Saga-removal Inventory entry/indexes,
  DS-D1 current plan, SGRM status surfaces, and Task Session observability are
  the read-model owners to synchronize.

## Derived State Before Validation

- Active DS-D1 backend members: 13, preserving the retired `DS-D1.10` gap.
- Active DS-D8 signatures: 30.
- Active Workflow `orchestrates`: one signature with same-/cross-feature scope.
- Active implementation schemas: 13.
- Negative Saga source fixture/test: retained as rejection proof only.
- SGRM-007 audit: clean repository passes; seeded active and changed reviewed
  references fail.
- UI formation and unrelated backend semantic-hardening work remain outside
  this closeout.

## Write Boundary

Allowed after validation passes:

- `runs/SWU-SGRM-008/` final validation summary, result, and context;
- SGRM work-pack, execution pack, verify task, and W3 status;
- DS-D1 Saga task/status/read-model wording that still says SGRM-008 is open;
- `projects/domainspec-v2/CRAFT.md` stale 14/31 counts and next-state summary;
- Saga-removal Inventory plan entry plus one final-result Inventory entry,
  `index.md`, `index.json`, and `log.md`;
- Task Session observability backfill for SGRM-001..005 plus final SGRM-008
  signal.

Read-only:

- canonical DS-D1/DS-D8 authority and implementation code except generated
  instances produced by the named validation command;
- historical research, governing decisions, prior refreshes, and prior
  receipts;
- unrelated IDE extension, CAV2/business-plan, Arcanum submodule, UI repair,
  and telemetry changes already present in the worktree.

## Ordered Validation

1. `npm run validate`.
2. `npm run engine:test`.
3. `npm run instances:generate` and `npm run instances:validate`.
4. `npm run typecheck`.
5. `npm run audit:retired-orchestration`.
6. Focused Workflow intra-/cross-feature acceptance and negative Saga-source
   rejection assertions.
7. DS-D1 IDs/count, DS-D8 signatures/count, and schema count assertions.
8. JSON/YAML/JSONL parse, Inventory index uniqueness, report path checks, and
   `git diff --check`.

## Gates And Decisions

- Dependency gate: PASS; SGRM-001..007 have successful receipts.
- New blocker decisions: none.
- External consumer boundary: no evidence found; retain as bounded residual
  uncertainty and make no claim outside this repository.
- Runtime handoff: none; local execution.
- Subagents: none.
- Experiment harness: not applicable.

## Synchronization Rules

1. Do not mark completion until every named validation passes.
2. Use the successful SGRM-002 retry receipt, not its earlier blocked attempt.
3. Close only the Saga-removal route; leave UI and backend hardening status
   unchanged.
4. Backfill missing Task Session observability for SGRM-001..005 from receipts,
   then emit SGRM-008; do not invent validation evidence.
5. Inventory must expose a final-result selector and preserve research/history.
6. Final result must separate repository-local completion from external-
   consumer uncertainty.
