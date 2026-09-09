# CC005 product-test result: native smoke failed

Exact candidate: `739f85156574987fb0cb2721fa701d0540d16c6857aa408f1a81bcb874c4772f`.
Current tests passed: 48 candidate/harness tests, 78 frontend tests, TypeScript,
four desktop Rust tests and 14 runtime Rust tests. The temporary Vitest adapter
selects CC005 explicitly and preserves the existing test assertions. Fresh
WDIO-specific Vite assets and a fresh Rust WDIO executable were built successfully.

Ordinary unified native smoke failed on the first failed budget, snapshot 51 ms
versus 50 ms. Its full retained report also shows these overruns:

| Metric | Smoke observation (ms) | Existing limit (ms) |
| --- | ---: | ---: |
| Snapshot | 51 | 50 |
| Cold chat IPC handshake | 1015 | 1000 |
| Chat connect dispatch | 288 | 50 |
| Chat connect to ready | 1326 | 1000 |
| Chat delta to paint | 19 | 16.7 |

These are the smoke suite's per-session measurements, not campaign population
p95. Host observations passed the configured protocol thresholds with no coverage
rejections. That is measured qualification, not proof of zero outside contention
or visibility into all WSL host activity. No compilation or concurrent test jobs
were launched during the native observation window. Snapshot margin is small;
the substantially larger connect-dispatch overrun is a useful diagnostic target.
No causal attribution is established by this test alone.

The selected candidate and binary identities passed before and after the session.
Native testing used real Tauri IPC with a fixed mock provider and preview-only
protocol tolerance; it does not establish live-provider conformance. Measurement
mode was disabled, so the original latency assertions remained active.

Evidence is in PRODUCT-TEST.json, including raw arrays, host telemetry, pre/post
checks, executable/asset hashes and log hashes. Raw stdout/stderr, screenshots,
SQLite and receipt output remain at
`/tmp/cav2-cc005-native.Os7i0a/smoke-0HBAHX/`.
Normal `cargo build --locked` restoration passed. Production frontend assets were
never replaced, the test process exited, and driver port 4445 is free.

Construction frontier: diagnose snapshot and chat-startup/dispatch latency under
the same fixed limits, then implement a bounded repair in a successor test epoch
if warranted. This validation turn did not change product or harness source.
Qualified measurement population and previous-candidate differential are
not_evaluable because the required smoke prerequisite failed. No retries or
measurement campaign were launched after failure. Product approval remains
not-requested; CC005 bytes and all budgets are unchanged.

Operational support completed: current agent prepared isolated builds/storage and
restored the ordinary build configuration for the product-test stage. Temporary
evidence is retained. Publication, merge and release remain deferred and separate.
