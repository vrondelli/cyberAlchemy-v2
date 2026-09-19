# Preflight lifecycle delta review

The four requested local changes are accepted at [preflight.mjs](preflight.mjs) SHA-256 `98d5d561f76b15ae33eb1d7ae633598fcb8142954c659dadf525d4e7a013755d`. Full preparation readiness remains conditional on the separate runner review below.

The timer is created only after the single-use output directory and source-binding file are written. Client-factory construction runs inside the try/finally, so a factory failure clears the timer, aborts the controller and proceeds to the failed-result path. The tokenizer admission counter increments after deadline, call-limit and storage checks; storage rejection no longer inflates it. On successful completion, both preparation bindings and every recorded donor binding are rehashed before eight-row admission. Donor artifact drift therefore prevents an admitted result.

`node --check preflight.mjs` passed. This was read-only inspection and syntax validation, with no network, provider, tokenizer or real preflight calls. The counter measures admitted measurement invocations, not proof of successful remote requests; raw tokenizer receipts remain authoritative.

## Open Questions

The separate `run.mjs` lifecycle review is pending. In the inspected version, `measureNativeWire` can return a successful tokenizer bound despite a later native lifecycle failure, while preflight checks only zero model calls. Full readiness requires rejecting native request errors/lifecycle/persistence failures before accepting that bound, with an offline regression. This delta review does not approve generation or resolve the benchmark objective.

## Runner follow-up: resolved

The previously open native lifecycle finding is resolved by `run.mjs` SHA-256 `af5d99f7284375335b5934b17f56e7ff2080fff0c28b4bbb3059afffe090df8d`, independently verified with `run.test.mjs` SHA-256 `499da8463f163c3cf9495b20561f3ef98bf3d5f17aa024acdfed0163c0d28688`. All 11 runner tests passed offline, including actual native recycler fixtures with intercepted transport; no external network/provider calls occurred.

Post-generation complete-step/close failures preserve observed usage, record lifecycle failure and prevent terminal export/completion. Cleanup attempts remain independent. A health reporter exception is recorded without losing the fixed sixteen slots or observed known/unknown costs; the local stop flag is set before reporting, preventing further admissions. The two already running workers remain subject to the actual dispatch health check.

Wire qualification now rejects lifecycle/persistence failures and arbitrary post-tokenizer errors. It accepts only the native explicit no-dispatch admission denial, or the exact fresh-context-too-large disposition with no admission/dispatch and a measured bound at the recycle threshold. The latter remains an input to deterministic packet backoff, not an admitted wire. Dedicated tests cover tokenizer success followed by close failure and unexpected recycler failure.

These exact lifecycle/health changes are accepted; no blocker remains from this delta review. This is offline component approval only. A complete source freeze, real tokenizer receipts, live authorization and eventual fixed-denominator result audit remain separate. Neither archived-prefix reuse nor this review establishes a fresh trajectory result, full-benchmark perfection, or 15% token savings.
