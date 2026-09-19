---
task: SWU-R3C-002
mode: lean
strict_coverage: pass
created: 2026-07-12
artifact_role: task-session-evidence
---

# Context Pack: SWU-R3C-002

## Objective

Add discriminating code-tag composability tests for active, generated,
deprecated, deferred, and wrong-endpoint DS-D8 behavior after SWU-R3C-001.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O-001 | Preserve an active-edge passing witness. | existing `enforces` and `exposes` tests | covered |
| O-002 | Reject generated `owned-by`. | root generated view; checker CT-COMP-020 | covered |
| O-003 | Reject deprecated `enforces-cross` with replacement guidance. | root deprecated section; checker CT-COMP-021 | covered |
| O-004 | Reject deferred `depends-on` as non-active. | root deferred section; checker CT-COMP-022 | covered |
| O-005 | Reject an active label with wrong endpoints. | root `enforces` signature; checker CT-COMP-023 | covered |
| O-006 | Prove unsupported active semantics are reported, not silently passed. | SWU-R3C-001 coverage-gap payload; checker CT-COMP-024 | covered |
| O-007 | Keep the entire tag suite green. | `npm run tags:test` | covered |

## Selected Sources

1. `WORK-PACK.md` SWU-R3C-002 row.
2. `TASK-R3C-EDGE.md` SWU-R3C-002 contract and edge cases.
3. SWU-R3C-001 receipt and focused JSON report.
4. `check-code-tag-composability.ts` current classification codes.
5. `code-tag-composability.test.ts` current fixture/test harness.
6. Root `relationships.yml` active/generated/deprecated/deferred sections.
7. Relationship-validator negative-fixture precedent.

## Decisions

- Extend the existing temporary extraction harness instead of adding a second
  test runner.
- Use one generic two-concept fixture builder so classification cases differ
  only by edge label and endpoint types.
- Assert exit status and exact CT-COMP class for every negative.
- Add one valid-but-unsupported active signature case (`performs`) that exits
  successfully with an explicit medium coverage gap.
- No production or authority mutation is allowed in this SWU.

## Write Scope

- `impl/governance/tags/tools/tests/code-tag-composability.test.ts`
- optional committed examples under
  `impl/governance/tags/examples/composability/` only if the test harness is
  insufficient
- this task-session evidence directory and work-pack synchronization

## Validation

- focused `node --import tsx --test ...code-tag-composability.test.ts`
- `npm --prefix projects/domainspec-v2/impl run tags:test`
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- `git diff --check` over the SWU scope

## Gate Verdict

PASS. SWU-R3C-001 is complete, every required authority state has current root
evidence, the test harness is available, and no blocker-level choice remains.
