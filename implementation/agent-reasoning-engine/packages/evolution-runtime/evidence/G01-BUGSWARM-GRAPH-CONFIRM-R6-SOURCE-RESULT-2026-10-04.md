# G01 reserved confirmation r6 — source-side gate

Status, 2026-10-04: **passed 24/24 source-side qualification; no evaluator label, score, or GLM treatment opened.** This is the repaired, availability-selected reserved confirmation cohort, not the original unmodified 24-slot sample and not ContextBench.

The unchanged development-r2 failure-query rule produced 24 authenticated-log queries in the private WSL archive. The complete `QUERIES.jsonl` SHA-256 is `d570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa`; each query is at most 1,024 UTF-8 bytes. One case had no failed-test-name prefix and none needed sensitive-pattern redaction. The query seal is SHA-256 `9b6844df1ca6da11bed491df955f480a322175d79972848f0efd8bf71b027914`.

The unchanged ARE BM25 file ranker (source SHA-256 `52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788`) ran once per repository over the 24 r5 code-only roots. Every case passed its exact Git tracked-file count, byte total, and source-tree hash check. The independent ARE seal confirms 24 complete, unique full-file rankings, 19,452 candidate files in total, and 43,731 ms summed ranker elapsed time. Its SHA-256 is `45d73843608fdc5f43ceec2328fdfef9c2b41220f86d1d45fb20abb01ce3d736`.

The unchanged failure-anchored graph-r2 ranker (source SHA-256 `e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0`) then ran on the same 24 complete ARE file sets, using the original authenticated failure-log body for each case. Its independent seal confirms matching case/query/log identities, source-tree hashes, identical candidate sets, 24 complete unique rankings, and 26,738 ms summed ranker elapsed time. Graph seal SHA-256: `0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320`.

Private source-only artifacts are under `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4/`: `query-only/`, `code-only/`, and `rankings-r6/{are,graph}/`. The exact adapters and sealers are in `research/arb-trace2code-r1/`. The r6 source-side gate in [the prospective protocol](G01-BUGSWARM-GRAPH-CONFIRM-R6-QUERY-BASELINE-PROTOCOL-2026-10-04.md) is satisfied. No model call or gold read occurred during r6.

Next: freeze the stratified candidate pool and raw-listwise 8K GLM packet using only source-side evidence, dispatch the 24 treatments with complete token/time receipts, seal all predictions, then independently acquire evaluator-only HTTPS Git-tree patch-path labels and score matched ARE/graph/GLM outcomes. A positive result on this availability-selected cohort would still support only a bounded claim with its selection caveat, not broad ARE superiority.

## Open Questions

- Will the frozen candidate pool fit the 8K packet while preserving the development-study reach mechanism without using confirmation labels?
- Can evaluator-only HTTPS patch-path labels be authenticated and cover all 24 cases after predictions are sealed?
- Do matched quality gains survive full model-call and ranker cost accounting?
