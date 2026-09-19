# Aggregate admission native integration

Status: additive candidate. Six integration tests pass (one transport test and
five prepared-runner tests). No external model or native evaluator ran.

## Implemented path

The V5 transport exposes its existing tokenizer measurement through
measureEnvelope. It uses the same wire body, cached token count, retained
reasoning reservation, margin, output cap and receipt ledger as dispatch. Two
extra tokens preserve the native strict threshold: input plus output must be
less than 7999. The accessor does not dispatch or reserve a model request.

The aggregate native driver archives full outputs through guarded episode
persistence, admits a complete batch, and remembers its projection. Repeated
history cannot regrow a previously shortened read and change its visible bytes.
Previous projected results remain mandatory context. Only the newest complete,
unprojected tool batch can be shortened. Unfit mandatory context still fails.

Additive minimal-history and independent-investigation episodes use this driver.
The independent episode also includes planner-v2. A separate prepared comparison
runner selects them. Frozen sources remain unchanged.

## Verification and limits

The transport test uses the production HTTP adapter and native recycler with a
loopback provider and simulated tokenizer counts. An oversized source batch is
reduced, measured and dispatched below the threshold. All tokenizer receipts
remain durable; native preparation reuses the same measurement cache. An actual
fixture response carrying reasoning verifies its seven-token reservation on the
next measurement. This tests the measurement path, not GLM tokenizer accuracy.

Five prepared-runner tests cover known and unknown provider failures,
persistence failure, healthy twelve-assignment reconciliation, and reproduction
of the original dispatcher mismatch. Minimal and independent candidates use the
new runner; current ARE uses its original runner with the new transport.
These local fixtures establish no benchmark quality or token savings.

## Next work and construction boundary

Runnable product work: apply equivalent admission to current ARE, test its
history/evidence projections, then review and compose the shared successor.
Check archive output bounds and tokenizer-call headroom before launch.
A prospective exact freeze must include all dependencies and all three arms.
The retrieval-first branch still needs its precise experiment and ablation.

Operational owner: benchmark orchestrator. D:/WSL storage admission and exact
launch review precede paid execution. Publication and release remain deferred.
The full perfect-quality, 15% total-model-token savings, complete accounting and
untouched-confirmation requirements remain unchanged.

## Open Questions

Current-ARE integration; fair handling of prior mandatory context; bounded
archive growth and tokenizer-call consumption; candidate review and exact
freeze; immutable retrieval of deferred current-revision bytes; extreme source
lines; retrieval-first experiment registration. Shared research tasks remain in
[the native follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
