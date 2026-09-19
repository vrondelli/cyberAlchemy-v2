# Independent live review

Approved for exact freeze `f39d81fda6322960a1520ecdda00c32c08f755097ff4499bdb42a49467c4f7ca`: **four fixed pairs, eight assigned trajectories, one repetition, two workers, maximum 768,000 model input plus output tokens, and an 8,000-token request limit**. This is not campaign or benchmark-target achievement.

All 804 source bindings and native hypothesis/experiment/continuity checks pass. All 59 offline tests were independently run successfully. The final eight real initial-request preflights match exact captured tokenizer request hashes; maximum input plus margin plus output reserve is 4,109. Every preflight has zero model dispatches, source hashes are unchanged from before measurement, and its disposable source clones are removed. Earlier rejected freeze/preflight evidence is preserved separately with zero model dispatches.

The native dispatch health hook, unknown-reservation handling and structured persistence propagation resolve the previous blockers. Known failed costs remain counted; unknown spend stays reserved. Health, capacity, persistence and native storage failures prevent new model work. The unchanged native host/output thresholds and 16-tree slot bound remain active; approval does not waive a later storage failure.

Control and treatment use the same compact representation and terminal review. Treatment alone adds the reviewed history projection, receipt-bound recovery and reminder policy. Both retain full archives, native source reconstruction and the original per-arm call/token budgets. No gold enters generation; pinned deterministic scoring waits until global generation is terminal and unlocked.

The report keeps all eight outcomes and requires valid completion, explicit perfect native metrics, sealed pairs, genuine long trajectories, request admission, complete accounting and at least 15% total savings together. Missing metrics and infrastructure failures cannot silently produce a pass. No observed quality or efficiency outcome is assumed.

## Open questions

Initial preflight does not establish later-request fit or model effectiveness. All later calls must pass native admission. Four exposed tasks and one repetition cannot establish full-benchmark perfection, generalization or component attribution. Untouched confirmation and the LongMemEval campaign requirements remain open under [LIVE-PROTOCOL.md](LIVE-PROTOCOL.md). The freeze binds static source dependencies, not the entire installed host/CommonJS package environment. No provider calls were made by the reviewer.
