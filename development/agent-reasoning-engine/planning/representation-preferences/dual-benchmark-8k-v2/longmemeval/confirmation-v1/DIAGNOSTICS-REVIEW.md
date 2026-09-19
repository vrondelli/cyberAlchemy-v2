# Independent failure telemetry review

Approved for the narrow diagnostic amendment at the exact hashes below. This review did not execute acquisition, access source records or evaluation references, or change either failed-attempt marker. Approval concerns instrumentation; it does not qualify the real source or authorize a retry by itself.

| Artifact | SHA-256 |
| --- | --- |
| `project_stream.py` | `092e14a5ff652ec23350d348737bc102ccd27f9f9c5903eb6824ec95d504a205` |
| `acquire_source.py` | `205faf6f827e03ef8666a2131f4cb8127f33c8353fb5f11870d9cbb7c46bb4b7` |
| `test_failure_diagnostics.py` | `1c7b162bb6b42cf15395dff438370f0f7c6f6efe815b8eee8a211f86e2b682d9` |

## Acceptance and disclosure

Independently removing only the safe vocabulary/helper and exception annotations reconstructs the previously reviewed projector SHA `c6699be296300998834104880bd434152ec850cf76a318e75a55f7545f69c794`. Removing only the wrapper diagnostic import and receipt attachment reconstructs wrapper SHA `f7f2b6b410d586a81a7c4b40d27f56a1ad0c902ffe19e7ef54d3b3afc73122cc`. Thus parser acceptance, source identity, publication, timeout, storage and no-retry checks are unchanged. Exception annotation does not suppress or convert parser rejection into success.

The diagnostic emits only a static allowlisted reason/code and bounded numeric counters. Unknown typed reasons emit `projection.unspecified-failure`; untyped exceptions emit no projection diagnostic. Arbitrary exception arguments are neither formatted nor retained in this diagnostic. No history, question, label, session identifier or arbitrary/signed URL is added. Existing canonical public source/license URLs in acquisition provenance remain intentional metadata. The original exception can remain in the in-process cause chain; this approval is for serialized diagnostic disclosure, not a claim that exceptions contain no private arguments internally.

`source_bytes_read` counts raw bytes returned into the parser, including read-ahead, and is explicitly not a failing character offset. Its maximum is the pinned source size plus one 65,536-byte read; out-of-range values are omitted. `record_index` is zero before any record, one-based during a record and the processed count during final checks; the bound is 1,000,000 and booleans are rejected. At a record-count ceiling, it can name the attempted next record before its body is parsed. These counters localize a failure coarsely; they do not establish the precise offending byte or field. Cleanup wrappers prefer the attached original parser error when present.

## Verification

Independently ran all 31 Python synthetic tests under a 64 MiB address-space limit: 31 passed, zero failures/errors. Tests include genuine unsupported-role rejection with read-ahead/record counters, unknown signed-URL text redaction, untyped-error exclusion, and bounded metadata without formatting arbitrary exception arguments, alongside the existing parser/acquisition regression suites. No network or provider calls occurred.

All implementation/test hashes in [FAILURE-DIAGNOSTICS-TEST-RESULTS.json](FAILURE-DIAGNOSTICS-TEST-RESULTS.json) were independently verified. Both historical failed-attempt markers remain byte-identical:

- `source-s-v1.attempt.json`: `64bb53f61b59934f7e5e364c96fffadfd97e2ff7d1eef1450935094dbaa4c043`.
- `source-s-v2.attempt.json`: `bd9940cf1d5120bf659d49577808b564986f33cd4857baf62cf5d1559b4efcf2`.

## Open Questions

The preceding generic ProjectionError reason remains unknown; this review supplies no retrospective diagnosis. Non-ProjectionError failures, including decoding or persistence exceptions, can still have only their existing generic category. A separately recorded same-source attempt may expose a safe typed reason but must retain all original failure markers and satisfy the existing runtime storage, timeout, source-hash and publication gates. No acceptance relaxation follows from this review.
