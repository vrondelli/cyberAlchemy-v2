# G01 fresh r20 — unchanged candidate-acquisition transfer

Status: prospective, before r20 acquisition, evaluator access, or model calls. Use the 24/24 sealed r19 ARE and graph rankings, r17 failed-code-only roots, r18 queries, and exact authenticated failed-job logs. Do not alter source ordering, replace slots by score, or inspect passing source or evaluator gold.

First transfer the unchanged development test-edge-r3 rule SHA-256 `ae5af4bfc07bb61c0a86eedf9f0e670a078f77e5eb1417ed3227bfecdedbf32e` on the unchanged graph-r2 rule SHA-256 `e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0`. Require 24 full permutations of the same projected path set. Next transfer the unchanged r7 stratified selector rule SHA-256 `72ddfd871b41cfb2cb56daf4d92ee76b526630ffab5097f11328aaefd567aeb1`: preserve the graph/test-edge top-30 union, then bounded failure-line, test-alias, and rare-stem source-only additions, at most 80 unique paths.

Then transfer the r9 failed-test-only BM25 channel using the unchanged ranker SHA-256 `52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788` and 128 MiB per-case index cap. The one missing-test case keeps the prior list. The r9 selector retains the graph/test-edge union, adds at most 20 new non-test channel hits, then fills from the prior stratified additions to the 80-path cap. Seal each stage and all 24 final candidate lists before any evaluator access or GLM call. A failed bound stops this version without shrinking the denominator.

## Open Questions

- Do all 24 test-edge, stratified, and failed-test-channel outputs pass identity, path-set, and candidate-count bounds?
- Can the unchanged r10 packet builder serialize every final list below 24,000 bytes and 8K tokens?
