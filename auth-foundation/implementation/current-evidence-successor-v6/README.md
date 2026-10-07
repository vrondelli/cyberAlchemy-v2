# Current Auth technical-evidence successor v6 (candidate)

This successor preserves the stale v5 binding byte-for-byte. It reruns v5's
selected-source, Cargo-closure, lineage, and compile controls and accepts
exactly one change to the resulting object: the SHA-256 of the formatted
test-only `authorization-api/src/http_api_tests.rs`. The receipt pins the old
v5 file hash, both test-source hashes, and a sorted-key compact-JSON digest of
the complete recomputed technical object. It also pins the v6 verifier,
hostile tests, and this README. A second source, path-set, closure,
result, claim, or predecessor change fails closed.

The new test witnesses that an HTTP timeout response can precede completion
of a blocking mock worker. It does not test production SQLite decision paths
or prove a runtime no-call guarantee.

From the checkout root:

```sh
python3 auth-foundation/implementation/scripts/test-current-evidence-successor-v6.py
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v6.py
```

## Open Questions

- Which source-bound all-path proof and independent runtime observation can
  justify `runtime_guarantees_observed` for the selected Auth composition?
