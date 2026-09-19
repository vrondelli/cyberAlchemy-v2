# Offline streaming projection implementation

Status: implemented and tested with synthetic data only. No S dataset download, real-data projection, reference extraction, provider credential access, tokenizer call or model generation occurred. Existing candidate manifests and frozen artifacts remain unchanged. Source provenance and the exact acquisition target remain in [FULL-HISTORY-SOURCE.md](FULL-HISTORY-SOURCE.md).

## Interface and integrity contract

[project_stream.py](project_stream.py) is a dependency-free incremental UTF-8/JSON parser with a binary-stream API and local-file/stdin CLI. It contains no HTTP client or credential discovery. The production CLI fixes the four reserved IDs, expected 500 records, exact 277,383,467 bytes and upstream LFS SHA-256. The API permits injected expectations for offline tests; such receipts explicitly identify an unpinned injected source rather than falsely claiming the upstream revision.

Example for later use by reviewed acquisition orchestration:

```text
python3 project_stream.py /path/to/already-verified-or-streamed-input new-source-directory
python3 project_stream.py - new-source-directory
```

These commands were not run against the upstream dataset. A network stream wrapper, rate limit, timeout and source-response identity verification remain separate work; this module does not acquire the 277 MB object by itself.

Every raw byte contributes to SHA-256 before decoding. Strict parsing continues to EOF even after all four IDs are found. Publication requires exact byte count, SHA, record count, unique IDs across the dataset, all four selected IDs, complete schema validation and no trailing content. The source-only staging directory is renamed into place only after those checks. Existing destinations are rejected; the coordinator must run only one acquisition job for a destination.

Each projected row retains only question ID/type/text/date, dates and sessions. Nested messages retain only `role` and `content`; roles must be user or assistant. Session IDs, answer fields, answer-session IDs, nested annotations and unknown fields are discarded. The parser recognizes the syntax of ignored scalar values but does not emit, retain in source artifacts, log or use their values for selection. It never buffers a complete mixed source/evaluator record. A late question ID is supported by staging the already-whitelisted row until its identifier is known.

Date/session cardinality, nonempty sessions, required source fields, duplicate record/message keys and fixed-width upstream date syntax are checked. Dates preserve exact upstream positional order, including nonmonotonic sequences; selected-row receipts report only the boolean `history_dates_nondecreasing`. See [SCHEMA-ORDER-AMENDMENT.md](SCHEMA-ORDER-AMENDMENT.md). An unsupported date format fails rather than being silently transformed. All source text is preserved semantically, including Unicode and escapes; projection hashes bind the actual output bytes, not the original mixed-record serialization. Positional aliases can be assigned by the later adapter; no answer-linked session identifier is passed through.

## Resource and failure behavior

The reader uses 64 KiB raw chunks and the writer flushes at approximately 16 KiB. Source rows have an 8 MiB ceiling; retained source plus the current staging row must fit 32 MiB. Dataset/field/session/turn/depth/scalar bounds constrain parser state. The production CLI enforces Linux `RLIMIT_AS` at 64 MiB. The embedding API does not alter its caller's process limit; callers must apply an equivalent isolated-process limit. A 128 MiB free-disk floor is checked before staging. The small acquisition receipt is additional metadata, outside the source-output byte counter and inside that disk reserve.

Ordinary exceptions, malformed data, hash failures, output limits, cancellation and injected disk-write failure remove unverified staging. Abrupt process termination or machine failure cannot guarantee in-process cleanup; the coordinator must audit orphan `.unverified-source-*` directories before a new attempt. No partial directory is a valid source package. A validated receipt records code hash, source bindings, counts, selected source hashes and limits, and explicitly leaves target-tokenizer qualification pending.

## Synthetic test report

Ten tests in [test_project_stream.py](test_project_stream.py) pass. They exercise upstream-shaped records with synthetic values only:

- Late IDs, nested annotation removal and isolated source output.
- One-, two-, three-, seven- and 65,536-byte read boundaries, UTF-8, escaped Unicode, quotes, backslashes and control escapes; valid numbers and containers in discarded fields.
- Missing and duplicate IDs, duplicate keys, invalid roles, date mismatch, malformed dates, and preservation of nonmonotonic source order.
- Hash mismatch in an unselected tail, proving that finding four rows does not bypass whole-stream verification.
- Byte limits, row/output ceilings, invalid UTF-8 and trailing content.
- Mid-stream cancellation, injected fsync failure, cleanup and existing-destination preservation.

The suite also passed inside a process constrained to 64 MiB address space. This is a synthetic instrumentation check, not a measurement of real S rows or a claim that upstream extraction has succeeded. Tests can be reproduced with:

```text
python3 -m unittest discover -s development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1 -p 'test_project_stream.py' -v
```

## Remaining gates and open questions

Independent review must validate this custom parser and the bounded acquisition wrapper before using real source data. The wrapper must respect current benchmark bandwidth/disk reservations, read the pinned immutable endpoint, retain the license notice and stop without automatic retries. Real extraction still must prove that the four IDs exist, their full histories fit the resource limits and their question/date bindings match the intended variant comparison.

Evaluation references are deliberately not emitted anywhere by this implementation. A separately reviewed evaluator-only extractor and sealed reference artifact remain required; never extend the generator projection with reference labels to make judging convenient. Source-only extraction can be verified independently before that evaluator lane exists.

After acquisition, measure all four original histories with the actual target tokenizer; no byte count proves >8K eligibility. Freeze a separately versioned S study, compatible memory/control adapters, full generation and judge budgets, exposure audit and failure accounting before any model run. Existing oracle candidate metadata is not amended by merely implementing this extractor.
