# CC006 snapshot-worker candidate

Product construction: binds the snapshot-worker repair in desktop main.rs; all predecessor apparatus, budgets and smoke assertions remain unchanged. The six binding tests permit only that runtime-source change. Candidate digest: `6416b286213db5f2edd0b64337c55314dc7d3f6353730f58859bff0b9a986fef`.

## Current evidence

See [PRODUCT-TEST.json](PRODUCT-TEST.json) for identities, retained raw logs, host observations and measurements.

Candidate tests 6/6, successor launcher checks 5/5, frontend 78/78, typecheck, Rust 20/20 and WDIO-specific builds pass. The broader historical harness has 41 passes and one expected CC005 live-binding failure; it is not reported as an all-green suite.

Native smoke failed on cold IPC handshake (1185 ms / 1000 ms). Connect dispatch was 474 ms / 50 ms, ready 1674 ms / 1000 ms and delta-to-paint 98 ms / 16.7 ms. The host was rejected for memory pressure. Snapshot samples peaked at 32 ms, but this contaminated observation does not prove a repair benefit. Single-session smoke aggregates are not population p95 evidence.

The repeated campaign and differential bundle remain not evaluable. No automatic retry followed the failed session. Normal desktop build restored; production frontend unchanged.

## Remaining sequence and lanes

Product construction frontier: obtain a qualified ordinary native smoke result for these exact bytes, then run the unchanged fixed-population campaign and identity-bound comparison. Chat latency remains unresolved; do not claim snapshot repair fixes it.

Operational support: test operator owns host qualification for the native product-test stage. Memory pressure is the current measurement blocker, not an approval gate or authorization to terminate unrelated workloads. Static prototype work remains runnable.

Deferred operational residue: product owner approval only after current required evidence passes; lab reconciliation, commit, merge and publication remain separate decisions. Historical CC005 failure and canonical catalog snapshot drift remain open. No approval is inherited.
