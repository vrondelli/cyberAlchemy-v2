# Safe parser failure diagnostics

The acquisition wrapper now retains a structured `projection_failure` for typed parser failures. An explicit vocabulary of 51 existing static reasons permits the exact known reason and a deterministic code. Unknown reasons produce only `projection.unspecified-failure`; arbitrary exception text, source content, labels, and signed URLs are excluded from this diagnostic.

The projector attaches `source_bytes_read` and `record_index` when the stream parser has started. The byte counter includes binary read-ahead and is not the exact failing character offset. The record counter is one-based while parsing a record, zero before the first record, and the processed count during final checks. Only bounded nonnegative integers are emitted. Cleanup wrappers retain the original parser diagnostic when available.

No parser acceptance condition, source hash, cohort, retry policy, storage floor, timeout, or publication gate changed. Removing the telemetry block and exception annotation restores the previously reviewed projector byte-for-byte (including its original blank-line spacing), SHA-256 `c6699be296300998834104880bd434152ec850cf76a318e75a55f7545f69c794`. Removing the diagnostic import and receipt insertion restores the R3 wrapper, SHA-256 `f7f2b6b410d586a81a7c4b40d27f56a1ad0c902ffe19e7ef54d3b3afc73122cc`.

All 31 synthetic tests passed under a 64 MiB process memory limit. Four new tests cover an actual known parser failure with counters, unknown signed-source error redaction, untyped error redaction, and bounded metadata without formatting unknown arguments. The initial known-reason fixture exceeded the existing scalar ceiling; shortening its invalid role exercised the intended unchanged role guard. No network or provider calls were made. Exact implementation/test hashes and preserved v1/v2 failed-attempt marker hashes are in [FAILURE-DIAGNOSTICS-TEST-RESULTS.json](FAILURE-DIAGNOSTICS-TEST-RESULTS.json).

## Open Questions

The prior v2 parser reason cannot be recovered from its generic receipt. This amendment does not guess that reason or change acceptance to accommodate it. A separately authorized, separately recorded attempt can capture the reason after independent review; this implementation does not start or automatically retry acquisition.
