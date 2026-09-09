# WLC-015: remove the renderer dependency from chat connection

Status: implementation prototype; no native performance PASS or product approval.
Authority effect: none. Frozen WLC-008 artifacts and WLC-014 run evidence remain
unchanged. This directory contains separate production and WDIO frontend builds.

## Evidence and change

The qualified WLC-014 `runs/unified-QY9JBH` run measured cold handshake 2798 ms,
connect dispatch 111 ms, readiness 2915 ms and delta-to-paint 32 ms. These are
single-session observations, not a statistically qualified population.
Paint detail attributed 30 ms to waiting for the next frame and 2 ms to transport;
projection was 0 ms. This does not prove a compositor or rendering root cause.

Source inspection found that connection explicitly awaited requestAnimationFrame
after the native status response, before issuing chat_connect. A regression test
with a renderer that never delivers frames reproduced the dependency: 1 failed,
4 passed before the change. The connection now proceeds directly from the status
response. The readiness clock, event replay, permissions and paint measurement
remain unchanged. The handshake no longer includes an artificial frame wait;
compare end-to-end readiness as well as handshake when measuring the successor.
No claim is made that this accounts for the entire native startup delay.

## Verification

- Workspace Vitest: 78 passed, 1 failed of 79. The new regression passed.
- Remaining failure: implementation manifest binds predecessor source bytes
  (reported `chat source 4` mismatch). The manifest was not refreshed.
- TypeScript typecheck: passed against existing generated sources.
- WDIO-specific Vite build: passed into `build/wdio`.
- Production Vite build: passed into `build/production`.
- Scoped git diff whitespace check: passed.
- Native successor build: passed; see the separate attempt below.
- Native smoke and differential population: not_evaluable (host rejection).

### Native successor attempt

`build-native.mjs` created a fresh WDIO frontend and native target, using
`cargo build --offline --locked --features wdio -j 2`. Compilation completed in
6m 54s under Node v26.8.1 and Rust 1.94.0. Selected inputs and frontend assets were
verified unchanged after compilation. `native/inputs.json` and
`native/identity.json` bind the selected inputs and executable; this is local
build evidence, not hermetic closure or repaired implementation conformance.

Executable SHA-256:
`e0659212cd37b9d7699392f2ddf998ee0e3b4b223fc7b51e863bbd93c670c77d`.
Input manifest SHA-256:
`7d99450471c2554b9158a1a5574a70867c7791a53ad34d4513fbe14c8e164fa0`.

The new verifier regression passed: exact bytes accepted; changed bytes, empty
input sets, duplicates and traversal paths rejected. All 8 existing WLC-014
report/population tests also passed. The smoke runner checks selected inputs and
binary bytes before and after execution, retains host qualification, uses the
explicit pinned mock fixture, and rejects drift in the existing budget binding.
Research-evidence-harness keeps synthetic, build and native claims separate.

`runs/unified-LMSC4i/result.json` records a prelaunch host rejection. Normalized
load was 0.508–0.531; memory pressure was 12.03–15.83. No desktop was launched by
this attempt and no native timing improvement is claimed. The predecessor and
normal production output remain unchanged.

Retry this same candidate, without rebuilding, when the host qualifies:

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-015/smoke.mjs
```

Source SHA-256 identities:

- `runtime/src/features/chat/are-chat-bridge.ts`:
  `e5eb4433546067fc39214287ef20f865820b86e025c04338dec8d2db1ef64872`
- `runtime/src/features/chat/are-chat-bridge.test.ts`:
  `5ed67eec2a8bda49401f41abd1e8872be0bab149eef6c35989cf674fb95bd132`
- Unchanged `runtime/performance-budgets.candidate.json`:
  `e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf`

## Next construction and operational tasks

Product frontier: measure the separately built native successor's status IPC
versus total readiness on a qualified host, retaining the predecessor identity.
Reconcile the candidate implementation binding without asserting approval.
Then investigate frame delivery and competing UI work without relabeling a DOM
commit as paint or relaxing budgets. Full population collection follows smoke.

Operational prerequisite: test operator owns a qualifying native host window for
the next empirical run. It does not block independent source or fixture work.
Approval, lab reconciliation, commit, publication and release remain deferred,
separate owner decisions. No ambient ontology records were selected or changed.
