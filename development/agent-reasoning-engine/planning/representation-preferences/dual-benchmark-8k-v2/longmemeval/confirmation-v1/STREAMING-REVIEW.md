# Independent streaming extractor review

Verdict: **the amended projector is ready for a separately reviewed bounded acquisition wrapper**. No remaining blocking parser defect was found in this bounded review. This is not approval of an unreviewed network wrapper, evidence that real S extraction succeeded, target-tokenizer qualification or benchmark readiness. No extraction, network, provider or real gold access occurred in the review.

Reviewed against [FULL-HISTORY-SOURCE.md](FULL-HISTORY-SOURCE.md), [PLAN.md](PLAN.md), [project_stream.py](project_stream.py) and [test_project_stream.py](test_project_stream.py). Implementation edits were made by the implementation helper after findings were reported; this reviewer added only this report and [test_project_stream_review.py](test_project_stream_review.py).

## Findings and resolution

1. **Ignored nested objects initially accepted duplicate keys.** The original `Reader.skip` validated key strings but did not track them, unlike top-level records/messages. The helper added a per-object set of decoded keys with a128-key ceiling. Both literal duplicates and escape-equivalent names now reject before publication. This preserves bounded memory while enforcing the strict duplicate-key contract in discarded annotation subtrees too.
2. **Escaped isolated surrogate code units initially reached source output.** The original parser checked each four-hex-digit escape separately. JSON's grammar may admit such spellings, but isolated UTF-16 units are not Unicode scalar source text and can fail or change during downstream UTF-8 conversion. The helper now requires a high-surrogate escape to be followed immediately by a valid escaped low surrogate and rejects isolated lows/mismatches. Valid pairs preserve their source text. Independent tests cover lone high, lone low, high-high, high followed by literal text, and a valid pair.

Both findings are resolved in the reviewed amended hash below. No implementation mutation was made by this reviewer, and there is no claim that the pre-amendment source passed these independent regressions.

## Evidence checks

- Exact raw bytes enter SHA-256 before strict incremental UTF-8 decoding. The parser consumes through EOF after finding all selected IDs. Publication checks exact byte count, whole-file SHA,500 records in production, unique IDs across all records, and all four required IDs. Production CLI fixes the pinned constants; injected API fixtures are labeled unpinned.
- Late IDs are handled by staging only already-whitelisted fields. Nested messages retain role/content only. Ignored values never enter source output; error messages do not echo offending contents. Source and evaluator fields are not buffered together as a materialized record.
- Strings, escapes, primitive syntax, delimiters, duplicate keys and nesting are validated. Chunk-boundary tests include one-byte reads, escaped pairs and multibyte UTF-8. Unsupported roles, missing fields, invalid dates/cardinality and out-of-order histories reject rather than being silently repaired.
- Reader chunks are64KiB; the output buffer flushes around16KiB. Row/retained-plus-current output bounds apply before writing. Key, scalar, nesting, record, session and turn counts bound parser state. The CLI supplies64MiB `RLIMIT_AS`; an embedding API caller must supply an equivalent isolated process limit.
- Private staging and per-file flush/fsync precede same-parent directory rename. Hash/schema/cancellation/write failures remove staging under ordinary exception handling. Existing destinations are rejected. This is atomic publication under the documented exclusive single-job destination contract, not a claim of atomic no-replace against competing writers or crash-proof cleanup. The acquisition owner must prevent concurrent publication and audit leftovers after abrupt process termination.

## Test results and source bindings

The original10 tests and4 independent regressions pass: **14/14**. The combined suite also passes with a64MiB address-space limit. These are synthetic instrumentation checks, not measured peak memory or proof that every real record fits the row/output caps.

| Source | SHA-256 |
|---|---|
| `project_stream.py` | `4913d17895f3d23917ed53e39794e3883d6728ed4ff4863c15551190b475ce2f` |
| `test_project_stream.py` | `871c022d2d204dbdd4a94d4b1cfe769bd1ad4a682aaf98adf0a70f2c9b10f10e` |
| `test_project_stream_review.py` | `ac9611b3bdfce5d061f347d2f4092121e4212f489749c27934e710ef07afdccf` |

Reproduce the combined suite from repository root:

```sh
python3 -m unittest discover -s development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1 -p 'test_project_stream*.py' -v
```

## Remaining acquisition gates and Open Questions

The network wrapper still needs independent validation of immutable endpoint/redirect handling, exact identity response bytes, one connection/no automatic retries, timeout/cancellation, throughput limit and repeated host-storage guards. The projector's initial disk-floor check alone is not the campaign storage governor. Preserve the license notice and separate evaluator references; this projector deliberately emits no references. Check projector/wrapper hashes before and after acquisition so a source edit during a long stream cannot be mistaken for the code that actually executed.

Real acquisition must still establish the pinned full-file hash, four selected rows, exact question/date compatibility and resource feasibility. Every original history then needs real target-tokenizer qualification above8,000 tokens; cumulative model trajectory usage is a different measurement. Confirmation adapters, common answer policy, complete ingestion/judging budgets and failure accounting remain separate gates. The current verdict authorizes no unsupported claim of full-history success, model quality or token savings.
