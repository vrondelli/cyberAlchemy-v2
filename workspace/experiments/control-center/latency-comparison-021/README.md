# WLC-021 response-delivery boundary diagnostic

Current retained diagnostic candidate:
`native/artifact/essays-desktop`, SHA-256
`f94b82b05dc7c669a9e7f94075a7b228c59802ce1f555e315aee18d119dca0f5`.
Selected inputs and executable verified after testing and normal production
frontend build restoration. No prior candidate identity was refreshed.

## Construction and evidence

Adds invocation/response wall timestamps to the native monotonic phase timings.
The existing end-to-end durations and every performance budget stay unchanged.
These are diagnostic observations, not a replacement metric. Wall timestamps
are locally comparable but remain subject to clock adjustment; monotonic timing
continues to own the total duration. Instrumentation overhead is unquantified.

`runs/unified-E0XLyq` failed with no source drift, interruption or timeout. The
existing Linux host protocol qualified this run. Connect measured 629 ms:

- Invoke started: 1788683382534 ms Unix time.
- Native entry and bound: 1788683382536 ms Unix time.
- Invoke resolved: 1788683383162 ms Unix time.
- Native monotonic phase sum: 0.027123 ms.

This locates about 626 ms after the native boundary, not in process acquisition
or lock wait. It does not distinguish Tauri, WebKit, renderer scheduling and the
host compositor. Snapshot also failed (66/50 ms) and delta paint failed
(19/16.7 ms). No population p95 or successful differential campaign is claimed.

## Product checks

- Native Rust tests: 7 passed (`cargo test --offline --locked --features wdio
  -j 2` against the desktop manifest).
- Full frontend suite: 90 passed, 1 failed (`vitest run`). The existing
  implementation-manifest chat source 4 mismatch remains visible and unresolved.
- Frontend typecheck: passed (`tsc --noEmit --pretty false`).
- WDIO frontend and native build: passed, exact artifact retained.
- Normal production frontend build: restored with `vite build`, passed.
- Chat visibility assertions passed; WLC-020 screenshot inspection additionally
  confirmed readable completed text and no empty streaming row.

The native runtime uses a synthetic Codex fixture. None of these results proves
real-Codex conformance, product approval, acceptance, merge readiness or release.

## Two-lane frontier and current decision

Product construction: chat visibility fixed; native timing diagnosis available;
preload contention experiment reverted after it did not support a fix. Remaining
construction blockers are failing latency budgets, the exact-source manifest
mismatch, missing v4 ontology integration coverage and incomplete full candidate
differential evidence. No speculative transport replacement is authorized here.

Operational support: this machine is WSL2
(`6.18.33.2-microsoft-standard-WSL2`). The current host protocol reads Linux
`/proc` only. It qualified the Linux side, not Windows/compositor contention.
A separate read-only Windows CPU observation returned 10 percent; it was not
during-run coverage and neither validates nor invalidates the earlier runs.

The user has been asked which finished desktop target is required: current WSL2,
native Linux, or both. That choice bounds the next response-delivery investigation
and any host qualification extension; it cannot be inferred from a single Windows
sample. Existing candidate test failures remain failures regardless of that choice.
Independent source work must not be hidden behind the operational queue.

Cleanup: WLC-018 and WLC-019 retained executables were moved to recoverable desktop
Trash (565,927,824 bytes total). Their identities, logs, screenshots and receipts
remain. WLC-020 stays as immediate comparison and WLC-021 as current; the earlier
differential baseline remains. Trash removal does not reclaim disk capacity.

Authority effect: none. Product approval, lab reconciliation, commit, merge,
publication and release remain deferred separate decisions. The evidence-harness
claim boundary is preserved; diagnostic and fixture evidence is not acceptance.
