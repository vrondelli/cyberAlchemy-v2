# Evaluator answer-type amendment

The first separately recorded evaluator acquisition failed with `projection.string-required` at record 71 after 38,862,848 parser bytes including read-ahead. Storage admitted and provider calls were zero. The failed stream did not reach full-object SHA verification; its diagnostic alone is not a fully verified statement about the original answer value. The source-only full-object projection had already accepted all question identity fields as strings, making the additional all-answer-string assumption unnecessary and a plausible cause. No field values were inspected or printed to diagnose this.

`project_references.py` now streams a general bounded JSON value for `answer` in every record, including unselected records. It preserves JSON string/number/boolean/null/array/object type and original numeric token spelling in the private output. It does not materialize the whole answer or record in memory. Existing row/total-output bounds, depth 64, object key count 128, captured key/scalar bounds, duplicate-key rejection, strict string/UTF-8/surrogate checks and full stream hash/size/record verification remain. All other identity fields remain strings. Unknown field handling, fixed selected IDs, no sorting and source/reference separation are unchanged. The selected receipt adds only the JSON type label; values remain private.

The evaluator supports the native Python rubric's formatting capability for JSON-typed answer values: strings, finite safe numbers, booleans, null, arrays and objects. It passes the typed value to unchanged `get_anscheck_prompt`, not `String(answer)`. Thus Python formatting naturally yields numeric text, `True`/`False`, `None` and its normal list/dict representation. Raw reference-file hashes bind exact retained JSON bytes/type; the reference binding also records answer JSON type and the normalization contract. The JSON/JavaScript/Python round trip normalizes numeric spelling (for example `3.0` may render `3`), not reference meaning. Nonfinite values, integers outside JavaScript's safe integer range and negative zero are rejected before scoring to avoid unreviewed numeric loss. Strings and exact question/type/date identity are never normalized. No automatic oracle substitution occurs.

The native same-model rubric and the eight fixed slots/budgets are unchanged. This is a schema/serialization correction rather than tuning on model outcomes. The failed attempt marker and all source acquisition artifacts remain untouched; a reviewed subsequent attempt requires a new evaluator-only destination and marker.

## Validation and bindings

22 synthetic Python tests pass under 64 MiB; 13 synthetic evaluator tests pass. New tests cover all JSON answer types in selected and unselected records, arbitrary chunk boundaries, raw numeric exponent spelling, invalid scalars/leading zero/duplicate keys/deep nesting, native Python formatting for each supported type, and rejection of unsafe selected numbers. There were no network/provider calls during the amendment.

| File | SHA-256 |
| --- | --- |
| `project_references.py` | `535f91144bf94a7d1ac9b94a0598f1f6f526d1cb7cef9856a18dce3684820415` |
| `acquire_references.py` | `7befa2839ec2607b2b10807c307e272e3335834cb6236689f4a7fde569f9e271` |
| `test_project_references.py` | `0069e42d4d4ec83c2e02d7adf2aaf7bd4fa852c6938d5db43ba3c7d3f65aee19` |
| `test_acquire_references.py` | `f8dcc4e96bd104b03ff2dc97f1c2de52492e214bfa55c3ab034b9f9217ebb7b9` |
| `evaluate.mjs` | `0289786db73a875815b529ab275ddb26994cec4ff3217d1608ecb1751d0bd0f3` |
| `evaluate.test.mjs` | `ab03cfb74740dca779e09116b0a1a87d15010905228c9e5f87a1f0165e630f4d` |
| `evaluator/reference-s-v1.attempt.json` | `4fcb2a108bbfa97b7d968ac9caaf5fbed2d980c274b9c7b3d42b976c131bb134` |

## Open Questions

Independent review must confirm this exact amendment before a second separately recorded reference stream. It remains unknown whether the rest of the full object satisfies every retained bound; no successful reference binding exists yet. The future full-S identity binding must still match all four source question/type/date fields exactly before any generation/evaluation freeze relying on it. The original failed marker is permanent evidence, not a resumable or retryable attempt.
