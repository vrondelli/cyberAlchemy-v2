# G01 reserved confirmation r6 — failure queries and deterministic baselines

Status: prospective source-only rule fixed before r6 query or rank generation. Inputs are the r2 final 24-slot cohort SHA-256 `a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c`, r5 code projection SHA-256 `3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a`, pinned failure-side metadata SHA-256 `5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686`, and authenticated r1/r2 HTTPS log bodies pinned by SHA-256 in their receipts. No passing-commit source, evaluator label, model output, or score is permitted.

Apply the unchanged graph-development r2 query rule: first 256 UTF-8 bytes of failure-side failed-test names, if any, plus ANSI-stripped original-log tail, capped at 1,024 UTF-8 bytes; redact sensitive-looking tokens before serialization. Preserve case identity, query hash/bytes, redaction count, and log source hash. Seal all 24 queries before ranking. Run the unchanged ARE BM25 file-ranker (`ranked-source-acquisition-bm25-r1.mjs`) one case per process with a 128 MiB index cap; require full tracked-file coverage and exact tree/identity match. Then run the unchanged failure-anchored graph-r2 rule over the same files and queries, with each log body verified against the sealed source-side hash. Preserve 24 full rankings and independent seals. No model call is needed for this stage.

The whole r6 source-side gate requires 24 valid queries, 24 complete ARE rankings, 24 complete graph-r2 rankings, and exact count/path/tree identities. Do not inspect evaluator labels or report MRR/Hit while qualifying the source side. A failure remains in the 24-slot denominator and requires a separately versioned repair; it is not a reason to shrink the cohort.

## Open Questions

- Can all 24 query and ranking outputs fit their fixed byte/index bounds?
- Which stratified candidate acquisition and raw-listwise GLM packet should be frozen before treatment dispatch?
- How will end-to-end provider token/time costs and comparator parity be adjudicated after predictions are sealed?
