# G01 fresh r19 — unchanged source-only rankings

Status, 2026-10-04: **24/24 complete ARE and 24/24 complete graph-r2 rankings sealed before evaluator access.** The [prospective r19 protocol](G01-BUGSWARM-FRESH-R19-RANKING-PROTOCOL-2026-10-04.md) pins the unchanged ARE BM25 file ranker and unchanged failure-anchored graph-r2 rule. The [ARE cohort runner](../research/arb-trace2code-r1/rank-bugswarm-fresh-r19-are.mjs) rechecked every r17 source-tree digest and r18 query hash, indexed all 14,838 tracked code files under the 128 MiB per-case cap, and wrote 24 full permutations. The independent [ARE seal](../research/arb-trace2code-r1/seal-bugswarm-fresh-r19-are.py) is private `fresh-r11/rankings-r19/are/ARE-SEAL.json` SHA-256 `6fc4500437744b71dd1ac16921b1bbc22df370e68f2b1b82b97a6e9518d57918`; summed ranker time was 39,639 ms.

The [graph cohort runner](../research/arb-trace2code-r1/rank-bugswarm-fresh-r19-graph.py) independently rechecked each original failed-job log body against its source-only receipt, loaded the pinned development graph rule, and ranked the identical file set. The independent [graph seal](../research/arb-trace2code-r1/seal-bugswarm-fresh-r19-graph.py) is private `fresh-r11/rankings-r19/graph/GRAPH-SEAL.json` SHA-256 `44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4`; summed incremental graph time was 14,821 ms. Every ranking covers the full source projection with unique paths, matched identities and tree digests. No evaluator labels, MRR, GLM calls, or VPS source transfer entered r19.

Next: transfer the unchanged test-edge-r3 candidate-acquisition branch, r7 stratified union, r9 failed-test-only channel, and r10 packet builder. Seal all 24 candidate lists and packets before evaluator access. R19 is a source-side gate, not a quality or superiority result.

## Open Questions

- Will the unchanged acquisition chain fit its 80-file candidate and 24,000-byte packet bounds for all 24 fresh cases?
- Will authenticated direct-Git-tree gold paths survive projection after predictions are sealed?
