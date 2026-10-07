# G01 reserved confirmation r7 — source-only stratified candidate transfer

Status: prospectively fixed before confirmation r7 candidate construction or any confirmation evaluator access. The [r6 source-side gate](G01-BUGSWARM-GRAPH-CONFIRM-R6-SOURCE-RESULT-2026-10-04.md) passed. This protocol transfers the exposed cohort-B r7 acquisition mechanism without reading labels or scores.

Inputs are the 24 complete sealed graph-r2 rankings, the 24 complete sealed test-edge-r3 rankings, exact r5 code-only roots, r6 queries, and original authenticated failed-job logs. Verify exact case, query, log, and source identities. For each case preserve the ordered union of graph-r2 top 30 followed by test-edge-r3 top 30. This union is at most 60 files and may include test files. It must never lose a member. Add only unique non-test source files whose `.py`/`.java` stem matches `[A-Za-z_][A-Za-z0-9_]{5,}` and is unique in that case's full source file set.

Apply the unchanged cohort-B r7 strata to the complete authenticated failure log: (1) exact stem on a failure-context line, at most 12; (2) exact `Test<Stem>`, `<Stem>Test`, `<Stem>Tests`, `<Stem>IT`, or `<Stem>IntegrationTest` alias, at most 10; (3) exact rare stem occurring one to eight times, filling the remaining allowance. Preserve the development rule's ordering and tie breaks. The combined additions are at most `min(31, 80 - union_size)`; no case may exceed 80 files. This cap adjustment is fixed now because source-only union-size inspection found one 50-file union; it does not depend on labels. Do not change the ordering to make a case score better.

Seal all 24 candidate lists and their source-rule hashes before packet construction or GLM access. Then make deterministic query-overlap source excerpts of at most 120 characters per candidate and freeze raw-listwise packets under 24,000 UTF-8 bytes and the same-account 8K tokenizer bound (prompt tokens plus a 512-token output reserve <= 8,192). The GLM treatment is one raw listwise call per case with strict JSON `candidate_ids`; no pairwise guard, based on the exposed development cost/quality finding. Invalid outputs fall back to graph-r2 in the all-case analysis; transport failure stops dispatch. Preserve every attempted call and actual token/time cost. Complete rankings and predictions must be sealed before evaluator-only HTTPS Git-tree patch-path labels are opened.

The source-side qualification gate is 24 complete identity-matched candidate lists, each <=80 unique paths drawn only from the failed-commit source tree, preserving every top-30 union member. The treatment gate and final quality threshold must be frozen separately before provider calls. No source-only outcome is an accuracy score or superiority claim.

## Open Questions

- Will all 24 packets pass the same-account 8K tokenizer without changing candidate selection?
- Can the evaluator-only authenticated label acquisition cover the full 24-case denominator after predictions are sealed?
- Does raw listwise improve matched quality enough to justify its added token/time cost on this selected confirmation cohort?
