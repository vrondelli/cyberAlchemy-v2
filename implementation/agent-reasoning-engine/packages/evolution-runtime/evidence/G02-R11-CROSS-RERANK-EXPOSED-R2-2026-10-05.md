# G02 r11 balanced cross-encoder — exposed development r2, 2026-10-05

## Objective and sealed policy

The preceding exposed [r1 reranker](G02-R11-CROSS-RERANK-EXPOSED-2026-10-05.md)
sometimes truncated away its file card. The separately versioned, source-only
[r2 sealer](../research/g02-product-r4/seal-g02-r11-cross-rerank-exposed-r2.py)
retained at most 96 issue tokens, then used the remaining 256-token pair budget
for the unchanged path/source card. It scored the same sealed multi-view top-24
pool with the pinned local MiniLM model and selected at most its top-ranked
file **only if its relevance logit exceeded zero**; otherwise it abstained.
The advancement gate was sealed with the choices: at least three new gold
hits, hits in at least two repositories, at least 50% proposal precision,
and nonnegative mean File-F1 change. No labels, DSH trace, or native scores
entered the sealer.

Private source seal SHA-256:
`f4580195f6c341535403569f1e289084948683d742f7b6456c3987a041d8f408`.
The independent [evaluator](../research/g02-product-r4/audit-g02-r11-cross-rerank-exposed-r2.py)
opened gold only after sealing. Private audit SHA-256:
`439aece71b9e97b98fa09a71a151615fa037335db465674f6129e54d36366282`.

## Result and decision

Across 12 exposed tasks, r2 abstained on 11 and proposed one non-gold file.
It found **0 new gold**, with one false positive; counterfactual ARE mean
File-F1 fell from **0.53597** to **0.52209** (DSH **0.56359**). One task
regressed, none improved. The frozen gate failed. Reject this exact selector;
do not open the fresh G02 population for it.

The balanced token policy removed the obvious r1 pair-budget defect, but the
generic local relevance model still did not discriminate useful additions.
This is not evidence that every semantic model or file representation fails.
Further threshold adjustment on these exposed scores is not independent
development evidence.

## Research relation and open questions

Primary research proposes issue-query reformulation before lexical retrieval
([Caumartin and Melo](https://arxiv.org/abs/2512.07022)), natural-language
hierarchical repository summaries
([Oskooei et al.](https://arxiv.org/abs/2512.05908)), and repository-aware
multi-hop graph paths ([Yang et al.](https://arxiv.org/abs/2503.21710)).
These are *candidate mechanisms*, not demonstrated gains in G02. The existing
r11 development already tried structured query reformulation, compact cards,
and relation-union variants without a precision-qualified rule. Repeating
those broad ideas unchanged is therefore lower priority than a source-only
mechanism that yields a small, verifiable number of new reads per task.

Open questions: Which source-side evidence can distinguish a needed additional
file from a merely related file? Can a bounded selective read policy beat both
ARE's current selection and the stronger DSH comparator on a fresh cohort
without exceeding the provider request budget? No G02 or general superiority
claim is supported by r2.
