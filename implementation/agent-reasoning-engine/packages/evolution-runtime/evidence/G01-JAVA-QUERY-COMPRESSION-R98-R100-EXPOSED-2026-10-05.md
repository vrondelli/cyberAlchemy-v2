# G01 Java failure-query compression, r98–r100 — exposed development

Status, 2026-10-05: **cross-population advancement gate failed**. The intended 24-repository GitBug confirmation block remains unopened. No GLM call, fresh case, or superiority claim was made.

The [r98 source-only rule](../research/g01-gitbug-java-r78/project_query_compression_r98.py) shortens repeated fully qualified failing-test names to bounded class/method references, retains at most eight distinct tests, and keeps a bounded failure-message segment. It uses only the previously redacted failed-side queries, never the fix or evaluator label. This is a deterministic query-reduction hypothesis motivated by [IQLoc](https://arxiv.org/abs/2510.04468) and [Reformulate, Retrieve, Localize](https://arxiv.org/abs/2512.07022); it is **not** a reproduction of either paper's model or reported results. Mean query size was 516 bytes on 12 exposed GitBug cases and 263 bytes on 24 exposed Bears cases. Private r98 query seals are under the corresponding `query-compression-r98/` archive roots.

The [r99 source-only ranker](../research/g01-gitbug-java-r78/rank_query_compression_r99.py) used the same pinned BM25 implementation and exact buggy Java projections as the prior arms. It sealed the original and reduced raw-BM25 rankings, their fusion, original ARE+raw, safeguarded ARE+original+reduced, and a strong original-raw+symbol+reduced comparator before r100 label access. GitBug ranking SHA-256: `8250a6c04ad4f72baff099b246f964d85c43365669789338fbb0b99994112213`; Bears: `7a67b7fb2ff6f5dcbb668103d5ffc109182f359b94df20ff84ef46b9cb5998b4`. The frozen exposed advancement gate required treatment MRR@8 at least +0.03 above the strong matched comparator in **each** population, at least four GitBug and seven Bears wins, and no mean loss versus original ARE+raw.

The separate [r100 evaluator](../research/g01-gitbug-java-r78/audit_query_compression_r100.py) applied the same production-file filter to every arm. Its write-once private receipt is `/home/vlad_/are-benchmark-archive/g01-java-query-compression-r100-20261005/EVALUATION.json`, SHA-256 `bb0e0a85d73d69fce3983b9214cb81f16d46e2e460c925377677cfd61f7e8f39`.

| Exposed population | Original raw BM25 | Reduced raw BM25 | Original ARE+raw | Strong matched raw+symbol+reduced | Safeguarded ARE+raw+reduced |
| --- | ---: | ---: | ---: | ---: | ---: |
| GitBug, 12 repos | 0.40833 | 0.42222 | 0.47083 | **0.60278** | 0.46806 |
| Bears, 24 repos | 0.58026 | 0.55456 | **0.59449** | 0.54836 | 0.56984 |

All values are production-filtered MRR@8. Treatment minus matched comparator was **−0.13472** on GitBug (2 wins, 6 ties, 4 losses; paired bootstrap 95% interval [−0.38472, +0.09167]) and **+0.02148** on Bears (5 wins, 16 ties, 3 losses; interval [−0.08194, +0.12897]). It also fell slightly below original ARE+raw on both populations. Every relevant joint gate failed. The exact deterministic compression and fusion are rejected for confirmation; shorter queries alone did not resolve the test-to-production semantic gap. Do not retune this exposed score into a fresh claim.

## Open Questions

- Which failure-side signal links a named test to the changed production responsibility when its method is absent from the buggy test source?
- Can a source-grounded semantic or relational retrieval rule beat both strong raw+symbol and ARE+raw baselines across *separate* development populations before any confirmation?
- Can the intended GitBug confirmation block pass exact source and label admission under a separately frozen protocol once a development rule qualifies?
