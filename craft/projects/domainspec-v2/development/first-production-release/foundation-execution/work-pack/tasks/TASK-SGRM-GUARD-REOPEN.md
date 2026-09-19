---
task_id: TASK-SGRM-GUARD-REOPEN
owner_nodes: [SGRM-006, SGRM-007]
layer: L0
status: completed
---

# TASK-SGRM-GUARD-REOPEN: Restore Current Guard Proof

## Objective

Reopen the existing SGRM-006/007 verification boundary against current repository drift while preserving the SGRM-001 frozen manifest and the historical validity of the 2026-07-11 receipts.

## Pre-repair input

After the 006 retry evidence was added, the current guard fails with 213 files, 1,804 whole-word matches, 209 allowed files, and the same four source violations. The retry packet is removal evidence and accounts for the aggregate increase without adding a violation:

| File | Failure | Current matches |
|---|---|---:|
| `development/first-production-release/research/2026-07-12-expanded-capability-frontiers/research.md` | unclassified | 1 |
| `development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md` | manifest count 5, current count 11 | 11 |
| `research/2026-07-14-engine-gap-inventory/findings.md` | unclassified | 4 |
| `research/2026-07-14-engine-gap-inventory/research.md` | unclassified | 8 |

## SWU-SGRM-006-R1: Review and Disposition

- Dependencies: none; completed by the accepted `runs/SWU-SGRM-006/RETRY-001/TASK-SESSION-RESULT.md` receipt.
- Source anchors: live audit output; SGRM-006 current-plan rules; SGRM-007 classification algorithm; frozen manifest; current allowlist; the four violating files.
- Related context: `PLANNING-CONTEXT.md#live-evidence-snapshot`; `EGI-006`.
- Write scope:
  - existing SGRM package `runs/SWU-SGRM-006/RETRY-001/REFERENCE-DISPOSITION.json`
  - existing SGRM package `runs/SWU-SGRM-006/RETRY-001/TASK-SESSION-RESULT.md`
- Done criteria:
  1. every matched line in all four files is enumerated;
  2. each line is classified as historical evidence, reviewed superseded/current-plan evidence, guard-owned/removal evidence, or active violation;
  3. each file has one explicit action: exact exception, source-owner repair, or block;
  4. proposed exceptions include path, current count, reason, and matched-line digest;
  5. the frozen manifest is unchanged.
- Acceptance evidence: disposition JSON plus SGRM plan-owner review recorded in the receipt.
- Validation: JSON parse; recompute match counts/digests; prove every live match has exactly one disposition.
- Execution owner: local Task Session with SGRM plan-owner review.
- Handoff: if any active reference is found, stop and route to the source owner. Otherwise pass the exact exception candidates to SGRM-007-R1.

## SWU-SGRM-007-R1: Repair and Reprove

- Dependencies: accepted `SWU-SGRM-006-R1` receipt; satisfied.
- Selection authority: `work-pack/shared/SGRM-007-ACTIVATION-DECISION.md`, Option 1.
- Source anchors: disposition JSON; guard implementation; allowlist; focused guard tests; historical SGRM-007 receipt.
- Related context: SGRM-007 algorithm and exact exception precedence.
- Write scope:
  - `projects/domainspec-v2/impl/tools/retired-orchestration-reference-allowlist.json`
  - `projects/domainspec-v2/impl/tools/audit-retired-orchestration-references.ts` only if the reviewed disposition cannot be represented by the current exact-exception contract
  - `projects/domainspec-v2/impl/tools/tests/audit-retired-orchestration-references.test.ts`
  - `projects/domainspec-v2/impl/package.json` only if a missing focused command is required
  - existing SGRM package `runs/SWU-SGRM-007/RETRY-001/`
- Done criteria:
  1. clean repository audit has zero violations;
  2. a temporary active implementation reference fails;
  3. a changed reviewed line with the same match count fails digest checking;
  4. missing exception paths and unused exceptions fail;
  5. the frozen SGRM-001 manifest and historical receipts remain byte-unchanged.
- Acceptance evidence: retry report JSON, human summary, focused test output, seeded-failure output, and Task Session result.
- Validation:
  - `npm --prefix projects/domainspec-v2/impl run audit:retired-orchestration`
  - focused guard tests from `impl/package.json`
  - `npm --prefix projects/domainspec-v2/impl run tools:test`
  - `npm --prefix projects/domainspec-v2/impl run typecheck`
  - `git diff --check`
- Execution owner: local Task Session; validation owner reviews exception exactness.
- Handoff: provide the retry receipt to FPR-01. Do not rewrite the original SGRM-007/008 receipt.

## Completion Evidence

Both retry receipts pass. The accepted 007 receipt is `runs/SWU-SGRM-007/RETRY-001/TASK-SESSION-RESULT.md` (`sha256:1d842c5c87286c49ae0d8f3158bd3a629a9266c280732493454d0249c5e78a6b`). A fresh proof-refresh audit on 2026-07-14 reports 215 matching files, 1,946 whole-word matches, 215 allowed files, and zero violations.

Craft and Inventory consumed this evidence through the separately approved W0 proof refresh. This closes the reopened proof boundary; it does not create a new lifecycle or authorize FPR execution.
