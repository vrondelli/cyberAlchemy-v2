# TASK-IRR-VERIFY — Closure audit

## Smallest working unit exemption

- Reason: closure-only verification task
- Allowed because task ID contains: `VERIFY`

## Objective

Independently verify source scope, all test/fixture receipts, canonical hashes,
zero-call/import boundaries, owner separation, and claim ceiling after
SWU-IRR-007.

## Checks

1. Re-run the complete package suite.
2. Recompute the witness receipt and artifact digests.
3. Inspect imports and test doubles for model, network, filesystem discovery,
   dispatch, orchestration, persistence, and effect calls.
4. Confirm no public Arcanum, canonical authority, parent plan, or ResonantOS
   files changed.
5. Confirm generated evidence claims only the L0 typed-input relation.
6. Confirm `candidate` remains advisory and every ambiguity fixture returns one
   question.
7. Confirm the generic JSON port returns typed failures, the selected-local
   mapper preserves posture/evidence, and the add-on manifest requests no
   permissions.
8. Confirm Node and Chromium conformance output bytes and digests match.

## Result

Return pass, flag, or block plus exact evidence and the next owner route. Pass
routes to a separate L0 owner evaluation; it does not promote L1.

Open questions are owned in
[../../../OPEN-QUESTIONS.md](../../../OPEN-QUESTIONS.md).
