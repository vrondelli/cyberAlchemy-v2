# G01 BugSwarm guarded confirmation r50 — untouched result

Status: completed, independently recomputed, and failed the prospective guarded
advancement gate. No superiority claim is supported.

## Cohort and integrity

- 24 previously untouched, repository-distinct BugSwarm 1.3.1 Python cases;
- 24/24 authenticated sources and cross-validated original build logs;
- 24/24 bounded code-only projections and target-existence admissions;
- 24/24 tokenizer admissions and valid one-shot `glm-5.3-flash` selections;
- predictions sealed before evaluator-only targets were opened;
- fixed r44 graph/entity-card treatment and graph-prefix-4 guard unchanged;
- independent score recomputation passed.

Key SHA-256 receipts: r46 log supply
`9fc37dd17929e486e9d2ba347ef66ca9fa37aef80a29b8ee84b384ea1bb9e451`;
r49 target census
`a575284941995a7191c1eb922b33272eafdb9aca2529dafa82bd1d823705ee8b`;
packet seal
`26d2cefae4c2d5496a4332bdbac8cf338230959f4c157081b1441f472619e23c`;
prediction seal
`9406bbf8f6c7fccb1c51f8042d1f39ec7fbfa01816efad1e393b9ecfbfe0b178`;
evaluation
`6c6c054d94cfe5a5691adcddb811f2da4dea19dc223059da482dd843f0eebb7b`;
independent audit
`f95ca0674e46f982feddb0f79548c1be7cefcf136ed7f0083a7eff7736505bf0`.

## Results

| Arm | MRR@8 | Hit@1 | Hit@3 | Reach@30 |
|---|---:|---:|---:|---:|
| Graph prior | 0.60248 | 11/24 | 17/24 | 23/24 |
| Raw GLM rerank | 0.65427 | 14/24 | 15/24 | 23/24 |
| Guarded prefix-4 | 0.59936 | 11/24 | 17/24 | 23/24 |

Primary guarded-minus-graph MRR@8 difference: **−0.00313**, paired bootstrap
95% interval **[−0.02500, +0.01563]**, with 2 wins, 20 ties, and 2 losses.
The guard did not reproduce r44's positive development effect.

Raw-GLM-minus-graph MRR@8 difference: **+0.05179**, paired bootstrap 95%
interval **[−0.05615, +0.17073]**, with 5 wins, 13 ties, and 6 losses. Raw GLM
improved the point estimate and Hit@1, but reduced Hit@3 and its interval crosses
zero; it does not support a directional superiority claim.

Known model use was 68,443 prompt tokens and 1,263 completion tokens. Summed
generation time was 51.779 seconds, additional to local ranking and construction.

## Interpretation and next hypothesis

The fixed prefix guard overfit the earlier development cohort: it neutralized
both beneficial and harmful model moves and slightly reduced untouched MRR. The
useful residual signal is raw GLM's higher Hit@1 and MRR point estimate, but its
heterogeneous 5/6 win/loss pattern is not stable.

The next development branch should not tune prefix length against this score.
It should test order-robust aggregation—prospectively fixed candidate
permutations and consensus—on explicitly exposed data, then transfer a frozen
rule to a new independent dataset such as Defects4J. The current untouched
BugSwarm queue cannot supply another 24-case cohort.

## Open Questions

- Can permutation consensus retain the raw model's additional Hit@1 cases
  without its Hit@3 regressions?
- Which gold-blind features predict beneficial versus harmful model movement?
- Can Defects4J support the same reproducible log-to-file localization contract?
