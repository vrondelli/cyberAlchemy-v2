# Latency diagnosis after WLC-017

Continuation: WLC-018 through WLC-021 were built and measured. See
`latency-comparison-021/README.md` for current results and the desktop-target
decision. This document retains the initial diagnostic plan, not current closure.

Status: diagnostic source prototype; no new frozen candidate or product approval.
Authority effect: none. Existing budgets and retained WLC-017 bytes are unchanged.

## Evidence and bounded change

WLC-017 `runs/unified-3a40wD` failed on a qualified host: editor projection
32 ms against 16.7 ms, connect dispatch 716 ms against 50 ms, and delta-to-paint
234 ms against 16.7 ms. One session is not a cold-session population p95.
Editor input-to-update contributed 31 ms; chat frame wait contributed 231 ms.
Neither observation proves a runtime root cause.

Native connect already uses an async command and a prewarmed process. Its new
additive `nativeTiming` payload partitions command entry through channel binding
into process acquisition, process lock wait, and channel binding. Monotonic Rust
durations exclude IPC ingress, serialization and response delivery. They must
not replace the unchanged frontend round-trip metric or be called pure CPU time.

The frontend validates finite nonnegative additive phases and records observed,
unavailable, or invalid diagnostics beside the end-to-end sample. Old native
responses remain compatible. No native-versus-renderer cause is asserted until
a separately identified diagnostic build is measured. Instrumentation overhead
also remains unquantified; diagnostic results do not establish acceptance.

## Validation

- Bridge unit tests: 7 passed, including valid/invalid metadata and delayed IPC.
- Frontend typecheck: passed.
- Scoped whitespace validation: passed.
- Native tests: 7 passed with `cargo test --offline --locked --features wdio
  -j 2` against the desktop manifest, using the disposable Cargo cache and
  retained WDIO frontend. No desktop smoke or latency improvement is claimed.
- Retained WLC-017 executable SHA-256:
  `5d0ac80ec9f7dcba29a01788104076a1951a853ad3194a66f3a615bc1c429bf6`.

## Construction frontier

Build one separately identified diagnostic successor from these changed inputs;
do not refresh WLC-017's identity to fit new source. Run a host-qualified smoke
to inspect the native phase breakdown. Diagnose editor input handling and frame
delivery independently; do not shift measurement boundaries to remove failures.
Implement only evidence-supported fixes, then run the complete exact-candidate
test gate and repeated differential campaign with unchanged budgets.

## Operational support and deferred residue

Test operator owns host qualification for the native measurement stage. The
known implementation-manifest mismatch remains unresolved; product approval,
lab reconciliation, commit, merge, publication and release remain separate.
Prior WLC-003 executable cleanup is complete and recoverable in Trash. Retain
WLC-008 as baseline and WLC-017 as failed-candidate evidence during diagnosis.

Research-evidence-harness boundary: schema fixtures and unit tests validate
diagnostic capture only; they do not upgrade empirical or acceptance claims.
