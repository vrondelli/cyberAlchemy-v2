# Current trusted-input/Auth service successor v1 (candidate)

This sidecar DAG preserves the exact predecessor bytes at
`standard-conformance/authorization-service-binding.json` (v3),
`standard-conformance/trusted-input-evidence.json` (v2), and `d65-chain.json`
(v6). The new v4 service binding updates only the admitted-service Rust source
hash, the new v3 evidence points to that binding and includes the additional
duplicate-route test, and the new v7 D65 chain points to the two new records.
Each sidecar names and hashes its predecessor. These records are current local
technical candidates, not replacement historical records or admission.

The read-only verifier reruns the trusted-input source, Cargo, Rust, generated
Query, lineage, and test-inventory checks; derives the three current records
in memory; rejects every unreviewed predecessor-to-successor delta; and
compares the result byte-for-byte with these files, so downstream SHA links
cannot pass on merely equivalent parsed JSON. The legacy `--write-receipt`
switch is disabled in both the trusted-input and parent Auth validators to
prevent accidental overwrite of the frozen predecessor paths.

Run from the repository root:

```sh
python3 auth-foundation/implementation/scripts/test-current-trusted-input-successor-v1.py
python3 auth-foundation/implementation/scripts/validate-current-trusted-input-successor-v1.py
```

The selected current Auth aggregate uses this verifier for its trusted-input
stage and snapshots all six current/predecessor files before and after its
longer validation run. The separate v5/v6 current-technical bindings remain stale; this
sidecar does not establish their 11-source successor, all-path READY
dominance, semantic admission, F5/EVF satisfaction, deployment, or
`runtime_guarantees_observed`.

## Open Questions

- Which independent controls will qualify the remaining 11-source technical
  baseline and the separate timeout-witness addition?
- Which source-derived all-path and observed-runtime evidence can establish
  the owner-wide no-downstream-call rule?
