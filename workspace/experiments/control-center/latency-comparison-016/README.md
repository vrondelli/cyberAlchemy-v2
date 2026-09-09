# WLC-016: frame and event-loop diagnostic prototype

This profiles the unchanged WLC-015 Linux executable, not a new product candidate.
Authority effect: none. Instrumented observations are not budget PASS evidence.

`probe.mjs` records bounded frame gaps, 20 ms timer gaps, visibility transitions,
available long-task entries, resource timing and existing performance samples.
It does not collect document content. The WDIO configuration preserves a snapshot
before reloadSession and captures another after the test, cleaning up observers
and timers. Coverage starts only when WebDriver attaches; native pre-attachment
startup and backend lock/service times are not observed by this probe. Existing
chat timing samples are context, not a native phase breakdown.

`run.mjs` reuses the unchanged unified smoke spec and WLC-015 executable with
strict host qualification, selected-input verification before/after execution,
unchanged budget binding, isolated state and the pinned synthetic mock backend.
Results are DIAGNOSTIC_COMPLETED or DIAGNOSTIC_FAILED, never product-test PASS.
Instrumentation overhead has not been measured. Unsupported long-task entries
are explicitly marked unsupported, not interpreted as an idle event loop.

Verification: the synthetic probe test passed, covering distinct timer/frame
gaps, unsupported long-task reporting and cleanup. Script syntax check passed.
The native attempt `runs/unified-b511Cz` was rejected before launch because of
memory pressure. No empirical trace was collected; the WDIO hooks remain
unverified in a native session. Frozen WLC-015 identity verification still passed.

## Construction frontier

Run the diagnostic on a qualified host:

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-016/run.mjs
```

Inspect `artifacts/profile-*.json` alongside timing samples. Correlated timer and
frame gaps can motivate further event-loop profiling; frame gaps without timer
gaps motivate rendering/visibility investigation. Neither is causal proof by
itself. Native dispatch phase profiling still requires separate instrumentation
if the attachment window misses the slow connect. Do not optimize or change
metric semantics on the strength of unsupported causal claims.

Operational prerequisite: test operator provides a host window satisfying the
existing policy; no processes are stopped and no limits changed. Independent
probe construction is complete, while native validation remains blocked.
Product approval, reconciliation, publication and release remain deferred.
Research-evidence-harness preserves synthetic versus empirical evidence and
diagnostic versus acceptance boundaries. No ontology selectors were changed.
