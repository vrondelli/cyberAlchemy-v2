# Full-S evaluator reference acquisition

Status: offline implementation and 20 synthetic Python tests pass under 64 MiB; **no real reference download has occurred**. Independent review is required before a separate single-attempt acquisition. The original source extractor, wrapper, published source package and all historical failure markers are unchanged.

## Purpose and separation

The verified S source and pinned oracle agree on all four question IDs/text/types but disagree on all four question dates. The strict evaluator gate remains unchanged. A second stream of the exact pinned S object is necessary to obtain variant-correct evaluator references; no answer is inferred or copied into generator inputs. No outcome-based selection or task replacement occurs.

`project_references.py` reuses the reviewed streaming `Reader` and `Sink` from `project_stream.py`, including strict UTF-8, surrogate validation, duplicate-key/nesting/scalar bounds and incremental SHA-256. Its separate record whitelist emits only question_id, question_type, question, question_date and answer. Every other field, including full histories, session IDs and nested annotations, is skipped. It preserves exact field strings. A bounded temporary record is removed for unselected IDs; selected reference files are published only after all 500 records, all 277,383,467 bytes and the complete pinned SHA verify. It rejects missing/duplicate selected IDs, malformed reference fields, over-limit output, existing destinations and trailing/hash mismatch. The fixed IDs are unchanged.

The source is `longmemeval_s_cleaned.json` at revision `98d7416c24c778c2fee6e6f3006e7a073259d48f`, SHA `d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442`. Selected files are `reference-<id>.json` and the receipt is `reference-acquisition.json`, with status `verified-evaluator-reference-projection`, evaluator output true and generator reference access false. This package cannot pass the generator's source-only loader. Put the actual destination under the separate private evaluator lane, for example `evaluator/reference-s-v1`, never beneath `source-s-v4` or another generator input directory. Reference file values are private evaluator inputs; terminal receipts, console summaries and the later compact binding manifest expose no values.

## Narrow wrapper ancestry and resource controls

`acquire_references.py` is a narrow descendant of reviewed `acquire_source.py`, leaving the original intact. The changed import targets the evaluator projection; staging names and attribution distinguish evaluator references from source-only history. HTTP endpoint, pinned identity, HTTPS redirect allowlist, no retry, one-attempt marker, <=1 MiB/s stream, 30-second socket limit, hard 900-second main-thread watchdog, storage checks, MIT notice binding, safe diagnostic vocabulary, cleanup/final journal handling and CLI 64 MiB limit are retained. The native guard still enforces 12 GiB host and 8 GiB guest free space before network and periodically/before writes/publication. No raw dataset is retained. Reference rows are bounded to 1 MiB each and 4 MiB retained total, below the source extractor's previous bounds.

The acquisition receipt contains only hashes, paths, counts, fixed IDs and operational metadata; it never contains reference answer strings. A failed attempt keeps its separate attempt marker and cleans staging. Cleanup or journal failure preserves the original failure and in-memory receipt as in the reviewed source wrapper. Existing source acquisition attempts are never retried or overwritten by this separate evaluator lane.

## Tests and integration

`test_project_references.py`: eight synthetic tests verify exact top-level whitelist and no history/annotation leakage, hashes-only receipts, missing/duplicate IDs, full-stream hash failure, type/output bounds, nested duplicate rejection, one-byte UTF-8/escape boundaries, preservation of dates/answer strings, existing-destination refusal, mocked acquisition/attribution, failed markers with no reference values, and storage failure cleanup.

`test_acquire_references.py`: twelve inherited wrapper regressions rerun against the new module, including watchdog/trickle, rate/redirect/response identity, storage rejection/final publication checks, retry refusal and journal/cleanup failure accounting. All 20 pass under 64 MiB. The new wrapper is not executed against the network by these tests.

After independently reviewed acquisition, `openFullSEvaluator` in `evaluate.mjs` loads only the separate verified reference receipt/files, verifies exact same source revision/SHA/bytes/500 records/four IDs and per-file hashes, and compares question/type/date text exactly against the source-only manifest. It then returns a compact hashes-only binding and an isolated scorer closure. Ten evaluator tests pass, including synthetic full-S package binding and reference-file drift rejection. A real successful identity binding remains pending acquisition; the oracle mismatch audit remains preserved.

## Open Questions / next gates

Independent acquisition review must bind the exact new extractor/wrapper and imported parser/native guard dependencies before a single separately named real download. The caller must check current storage and existing process activity and retain all attempt receipts. After acquisition, only metadata/binding hashes may be sent to the coordinator; references stay in the evaluator lane. A successful identity binding, independently reviewed scorer, separate evaluator freeze, terminal generation seal, guarded provider/journal wrapper and 64,000-token judge reservation still precede scoring. No generation/scoring effect is granted by this instrumentation, and no quality or savings outcome is asserted.
