# WLC-018 native connection phase diagnostic

Product construction: build one selected-input successor of WLC-017 with
additive native timing diagnostics, then run a qualified unified Tauri smoke.
Existing budgets remain unchanged. The executable and frontend are retained
outside the reused disposable WLC-017 Cargo cache. Prior identities, evidence,
and retained executables are not overwritten.

Native phase diagnostics distinguish process acquisition, lock wait, and channel
binding from the full frontend round trip. Their sum does not cover IPC ingress,
serialization or response delivery. No causal performance claim precedes a run.
The existing seven bridge tests and seven Rust tests passed before this build;
frontend typecheck also passed. Those tests validate the diagnostic metadata,
not latency improvement or acceptance.

Operational support: test operator maintains a qualified host window after
compilation finishes. A rejected host is not product evidence. Every failed
attempt is retained and investigated; success-only sampling is forbidden.

Construction remains blocked from approval by the unresolved latency failures,
the existing implementation-manifest mismatch, and incomplete complete-candidate
test/differential evidence. Runtime v4 ontology integration has separate missing
coverage. Native phase instrumentation is diagnostic and its overhead remains
unquantified. The chat upstream is a synthetic fixture, not real Codex proof.

Authority effect: none. Product approval, lab reconciliation, publication, merge
and release remain deferred separate decisions. Superseded binary cleanup must
preserve the required differential baseline and failed-run evidence.

## Results

Build completed with selected inputs unchanged. `runs/unified-lyCchx` was
contaminated by memory pressure and cannot qualify as product evidence. Its
summary omitted native details; the smoke whitelist was corrected afterward.
`runs/unified-aTtbNc` was host-qualified, with no drift, and failed budgets.
Connect round trip was 738 ms while native phases totaled 0.030726 ms. Thus
process acquisition/lock/bind do not explain that run's delay. Snapshot reached
52 ms, delta projection 55 ms, and delta paint 142 ms. No latency acceptance or
real-Codex conformance is claimed.
