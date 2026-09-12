# Retained reasoning accounting candidate

Owner-directed implementation for “plan and implement”. Evidence: [pressure run](../pressure-v1/RESULT.md), [token diagnosis](../pressure-v1/token-diagnosis.json). Authority effect none.

## DAG and D65 construction boundary

Observed reservation miss → request-scoped accounting contract → isolated adapter and offline tests → historical replay → frozen experiment → one controlled-pressure live task → audit and evaluate accepted patch.

Current product frontier: account for retained assistant reasoning without increasing the fixed margin. Runnable construction: exact-message evidence binding, ledger reuse, deterministic loopback tests and captured-request replay. Owner: ARE implementer/evaluator. Exact operational prerequisites for live dispatch: existing secret reference, pinned task image, frozen dependencies and test pass. Serving/default activation, publication, commits and larger cohorts are deferred operational residue, not blockers for this candidate. No admitted runtime or model qualification is asserted.

## Contract

For each valid returned assistant message containing nonempty reasoning, retain a SHA256 of the full message and the provider's reported reasoning-token count. If that count is absent, reserve the reported total output tokens. Store the evidence in the existing integrity-bound transport receipt ledger. Bind the accounting policy into transport identity so old ledgers cannot silently resume with new semantics.

For each measurement, reserve tokenizer input +512 existing margin + sum of evidence-backed reasoning reservations for every included assistant-message occurrence. Match full message identity, not a run-wide cumulative counter. Omitted/archived messages contribute zero; repeated messages count repeatedly. Unknown or modified nonempty reasoning fails before provider measurement. A known zero-token reasoning receipt remains zero; observed input accounting still fails closed if the overall bound is exceeded.

This is conservative relative to the captured retained-reasoning discrepancy, not a universal mathematical guarantee of provider accounting. The tokenizer may already count some reasoning, so double reservation is an accepted cost to measure. Keep response input/output guards, pressure guard, request limits and cleanup unchanged.

## Checks and frozen live boundary

Test unknown/modified messages, duplicates, omissions, missing reasoning usage, invalid receipts and ledger restoration. Use loopback HTTP with the actual transport and recycler to test the formerly failing input gap, transition remeasurement and resumed receipts. Replay four captured external episodes using only messages available before each dispatch, with unknown/unrecoverable evidence reported explicitly. A retrospective bound does not simulate a new model trajectory.

Only after checks pass, run one new episode on the unchanged real Svelte task with the previous labelled synthetic-pressure policy. Limits:12 model/24 tokenizer calls, no retries,60s per model request,720s episode deadline,USD0.05 reserve. Hard context16,384; local threshold12,000; output reservation2,048; margin512. No additional live run is implicit. Evaluate an accepted patch with the unchanged isolated evaluator. A timeout, guard rejection or absent patch remains a recorded failure, not a replacement-run invitation.

## Open Questions

Does provider-reported reasoning usage sufficiently bound retained reasoning under future request conditions? How much avoidable recycling comes from double reservation? Does the corrected adapter allow a complete real-task proposal? Final-submission latency and multi-model qualification remain separate questions.
