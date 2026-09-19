# Independent reference answer-type amendment review

Approved at the exact bindings in [REFERENCE-TYPE-REVIEW.json](REFERENCE-TYPE-REVIEW.json), including one separate evaluator/reference-s-v2 acquisition under the unchanged storage/network guards. The original failed v1 marker remains preserved. This is not generation approval.

The amendment removes the unsupported assumption that every record's answer is a string. It streams strict bounded JSON without materializing full records: strings retain strict Unicode checks; numbers retain lexical spelling in the private projection; booleans/null/arrays/objects retain their types. Depth64,128 object keys, scalar128 characters,1MiB rows/4MiB total, duplicate-key rejection, all identity strings and full pinned SHA/bytes/500records/four IDs remain enforced. Unselected values are discarded, not exposed. The wrapper, source parser and storage bridge are unchanged.

The evaluator explicitly admits supported JSON values and passes their typed values to unchanged native Python rubric formatting. Nonfinite numbers, unsafe integers and negative zero are rejected before scoring. Numeric spelling may normalize through JSON/JavaScript/Python as disclosed; this is not byte-identical rendering of raw numeric lexemes. Exact reference-file hashes and identity hashes remain bound. Receipt type labels are metadata, not answer content.

Independent verification passed22 synthetic Python tests under64MiB and13 evaluator tests, including native formatting for supported types. No actual reference values, network, provider or gold dataset were read. The failed stream prefix establishes its parse failure, not a completed verified object; subsequent publication still requires the full pinned hash.

## Open Questions

Actual same-variant identity binding remains pending. A new stream must use its own destination/attempt marker and current native12GiB host/8GiB guest guard. Scorer/wrapper/reference metadata and exact source closure must receive final review before generation; globally terminal generation precedes gold loading for scoring. No schema bound, cohort, quality requirement or efficiency threshold was relaxed.
