---
swu_id: SWU-SGRM-007
task_id: TASK-SGRM-VERIFY
status: active
createdAt: 2026-07-11
runtime: local-fallback
strict_handoff_coverage: not-applicable
---

# Context Pack: SWU-SGRM-007

## Objective

Install and prove a classified whole-word Saga reference guard. The clean
repository must pass, a seeded active match must fail, and every retained match
must remain reachable through a frozen classification or an exact reviewed
exception.

## Controlling Sources

- `work-pack/tasks/TASK-SGRM-VERIFY.md` owns the guard algorithm, write scope,
  done criteria, and validation surface.
- `WORK-PACK.md` marks SWU-SGRM-007 ready after completed SWU-SGRM-006.
- `runs/SWU-SGRM-001/ACTIVE-REFERENCE-MANIFEST.json` owns the frozen initial
  path classifications and classification reasons.
- `runs/SWU-SGRM-006/CURRENT-PLAN-STATUS.md` owns the reviewed disposition of
  retained current-plan references.
- `runs/SWU-SGRM-006/TASK-SESSION-RESULT.md` proves current-plan synchronization
  and explicitly preserves the negative implementation proof.
- `runs/SWU-SGRM-003/DECISION-GATE-REL-FIXTURE.md` and
  `runs/SWU-SGRM-005/TASK-SESSION-RESULT.md` prove the negative Saga-source
  fixture/test is intentional rejection evidence, not active type support.
- `impl/package.json` and `impl/tools/tests/*.test.ts` own local CLI/test wiring
  conventions.

## Contract Reconciliation

The original guard prose says current-plan, active-implementation, and
unclassified matches fail. Later accepted receipts intentionally retain:

1. current plan files whose matching lines are cancelled, superseded,
   completed-decision, or historical-baseline evidence;
2. one negative relationship fixture and its validator test; and
3. post-manifest research/read-model files created after SGRM-001.

These are not broad path bypasses. Each non-default exception must record an
exact file path, effective allowed disposition, reason, expected whole-word
match count, and SHA-256 digest of normalized matched lines. Any added, removed,
or changed matching line invalidates the exception and fails the audit.

## Write Boundary

Allowed:

- `projects/domainspec-v2/impl/tools/audit-saga-references.ts`;
- `projects/domainspec-v2/impl/tools/tests/audit-saga-references.test.ts`;
- `projects/domainspec-v2/impl/tools/saga-reference-allowlist.json`;
- `projects/domainspec-v2/impl/package.json` audit script wiring;
- `runs/SWU-SGRM-007/` report, summary, and receipt;
- SGRM task/work-pack/wave status after validation;
- Task Session observability after closure.

Read-only:

- canonical definitions and implementation schemas/fixtures beyond the audit
  test's temporary directory;
- historical research, governing decisions, prior refreshes, and receipts;
- current-plan prose synchronized by SGRM-006;
- unrelated IDE extension, CAV2, Arcanum submodule, Inventory, and telemetry
  changes already present in the worktree.

## Guard Rules

1. Scan case-insensitive whole-word `Saga` under `projects/domainspec-v2`,
   excluding `node_modules` and the audit's requested temporary exclusions.
2. Resolve every matching file against the frozen manifest.
3. Allow unchanged manifest entries classified `historical-research`,
   `superseded-decision`, or `telemetry-or-receipt` only when live match count
   still equals the manifest count.
4. Allow the Saga-removal package as the active removal/receipt owner.
5. Require an exact digested exception for reviewed current-plan references,
   post-manifest historical/read-model files, and negative proof.
6. Fail active authority, ordinary active implementation, unclassified,
   missing-manifest paths, stale counts, missing reasons, stale exception
   digests, and unused exception entries.
7. Emit deterministic JSON plus a concise Markdown summary.

## Gates And Decisions

- Dependency gate: PASS; SWU-SGRM-006 receipt and completed status exist.
- New blocker decisions: none.
- Prior decisions consumed: collapse; retain negative Saga rejection proof;
  preserve reviewed historical/cancelled plan evidence.
- Runtime handoff: none; local execution.
- Subagents: none.

## Validation

- focused Node test for clean pass, seeded active failure, changed reviewed line
  failure, and unclassified path failure;
- CLI positive run producing JSON and Markdown reports;
- JSON parse and path existence checks;
- `npm run tools:test` and `npm run typecheck`;
- `git diff --check`.
