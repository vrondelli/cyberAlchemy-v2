# Task: Golden and Hostile Replay Proof

Task ID: `TASK-REPLAY-PROOF`

SWU: `SWU-ORODI-ELIG-003`

Depends on: `TASK-ELIGIBILITY-GATE`

## Outcome

Prove end to end that the two pinned normalizable legacy-v1 shapes remain replay-only and cannot satisfy runtime controls, while forged, drifted, malformed, or live-looking evidence fails closed.

## Write scope

- `projects/domainspec-v2/impl/operational-resilience/fixtures/eligibility/golden/*.json`
- `projects/domainspec-v2/impl/operational-resilience/fixtures/eligibility/hostile/*.json`
- `projects/domainspec-v2/impl/operational-resilience/test/evidence-eligibility.test.ts`
- `projects/domainspec-v2/impl/operational-resilience/README.md`
- Current run validation report files.

## Required proof

- Two golden observations are retained for replay and zero are admitted to runtime evaluation.
- Both receipts have empty eligible-control sets and all six foundational controls ineligible.
- Derived states are exactly C01 `passed`, C05 `missing`, C11 `not-run`, C12 `not-run`, C14 `passed`, and C15 `missing`.
- Every hostile discriminator returns its exact stable finding code and no derived result.
- Forged C05 or C11 passes reject the top-level result.
- All pre-existing operational-resilience tests and all eleven legacy source pins still pass.

## Validation

Run every command in `WORK-PACK.md`, preserve each exit status, and write one consolidated JSON and Markdown report without claiming lifecycle synchronization or live readiness.
