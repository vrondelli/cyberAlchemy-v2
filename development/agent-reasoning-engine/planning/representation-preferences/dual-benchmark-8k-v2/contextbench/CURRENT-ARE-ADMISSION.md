# Shared admission across all comparison arms

Status: additive candidate, 15 offline tests pass. Independent review, capacity
checks and prospective live freeze remain pending.

## Implemented behavior

The shared prompt renderer handles user/system suffixes after the latest tool
batch. Recovery pages, budget reminders, source provenance, and effect results
remain in the measured envelope. Successful recovery-tool outputs are preserved
as opaque, non-reducible results; this layer does not validate their semantics.

The new current-ARE episode and prepared runner use that renderer. The additive
comparison dispatcher composes canonical outcome preservation, current-ARE
admission, and the two candidate runners (including structural planner-v2).
Prior frozen experiments and sources are unchanged.

Current ARE recycles at 7000; the candidate native driver requires requests below
7999. The transport accessor includes two tokens of headroom, so current ARE
supplies an admission limit of recycle_at + 1, capped at 8000. This preserves
both existing policies rather than changing them to make the test pass.

## Regression evidence

The first oversized fixture failed: current ARE accepted a projection under
8000 but above its 7000 threshold; its existing fallback then deferred all source
outputs, leaving no eligible final evidence. The retained failing test transcript
documents this finding. After wiring the exact configured threshold, all twelve
oversized fixture assignments reached final context selection and reconciled.

The final 15-test suite covers eight admission tests, one real transport/native
driver test, and six prepared-runner tests. Tests assert the applicable strict
threshold for every dispatched model request, actual oversized tokenizer
measurements, source-prefix binding, mandatory suffix/recovery preservation,
known and unknown usage, persistence failures, and immutable replay.

All HTTP requests use loopback fixtures with controlled tokenizer responses.
No paid GLM call, native evaluator run, benchmark-quality result or token-savings
claim follows from these tests. Test repositories are removed after completion.
[Source/test evidence](CURRENT-ARE-ADMISSION-TEST-R1.json) is a bounded candidate
binding, not a complete production dependency freeze.

## Next runnable work

Audit capacity before launch: the inherited tokenizer cap is twice the model
call limit (or three times calls plus one in deferral mode), whereas batch
halving can require more measurements. Do not silently raise that cap or erase
attempts. Bound measurement work while retaining full failed-attempt accounting
and explicit inability to fit mandatory context. Check guarded archive growth.

Then review the exact composed candidate and define/register the retrieval-first
screening experiment. Shared repairs serve both competing architectures; they
do not demonstrate either hypothesis. The original perfect native quality,
15% total-model-token savings against fresh controls, full outcome accounting,
long trajectories and untouched-confirmation requirements remain.

Operational owner: benchmark orchestrator. D:/WSL storage admission and exact
live-run review precede paid execution. Publication and release remain deferred.

## Open Questions

Tokenizer headroom and archive limits; independent candidate review; exact
source closure; deferred current-source replay; oversized individual source
lines; retrieval-first treatment/ablation and prospective experiment registration.
The native research chain remains in
[RESEARCH-RESULT-R3.json](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
