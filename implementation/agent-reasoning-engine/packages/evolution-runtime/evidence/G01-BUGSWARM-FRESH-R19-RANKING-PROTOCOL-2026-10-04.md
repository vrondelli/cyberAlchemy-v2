# G01 fresh r19 — unchanged ARE and graph ranking transfer

Status: fixed before any r19 ranking, evaluator label, or model call. Inputs are r17 failed-code-only result SHA-256 `6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992` and r18 failure-query JSONL SHA-256 `7943e67c8ce84ba43cde47e726ed89b681151a621754e61741871a6ad0e94470`. Recheck 24 one-to-one identities, source tree digests, query hashes, and the private WSL root boundary.

Run the unchanged ARE BM25 file-ranker SHA-256 `52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788` in trace-text mode, one case per process, with a 128 MiB index cap and full tracked-file coverage. Seal all 24 ARE rankings before graph ranking. Then run the unchanged failure-anchored graph-r2 rule SHA-256 `e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0` over the same code files, exact queries, and authenticated failed-job log bodies. Seal all 24 graph rankings and check the path sets match ARE exactly. No parameter, cap, or tie-break change may be inferred from scores.

The r19 source-side gate requires 24 complete ARE and 24 complete graph rankings, exact tree/query/log identities, full file coverage, and no gold or model access. A failure remains in the 24-case denominator; any repair must be separately versioned. This stage cannot report MRR or a superiority claim.

## Open Questions

- Does every source index stay under 128 MiB with complete ranking coverage?
- After these rankings seal, can unchanged r9 acquisition and r10 packets fit the frozen 8K/token/cost bounds?
