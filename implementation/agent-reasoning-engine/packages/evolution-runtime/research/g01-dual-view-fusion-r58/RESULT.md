# G01 r58 dual-view fusion result

Status: complete; advancement gate failed  
Population: 48 exposed BugsInPy r1+r2b cases  
Claim ceiling: exposed mechanism evidence only

The fixed four-channel `RRF(k=60)` used the unchanged ARE and chunk-BM25
rankings plus independently sealed raw-query and functionality-query SweRank
rankings. Source rankings for all 48 cases were sealed before the pinned
evaluator labels were opened. R58 made no provider or embedding-model calls.

| Arm | MRR@8 | Hit@3 | recall@20 |
| --- | ---: | ---: | ---: |
| A — ARE + chunk RRF | 0.26746 | 17/48 | 0.75347 |
| B — raw-query SweRank fusion | 0.25047 | 17/48 | 0.75347 |
| C — functionality-query SweRank fusion | 0.29995 | 20/48 | 0.75347 |
| D — dual-view four-channel fusion | 0.26915 | 18/48 | 0.74306 |

D-minus-A MRR@8 was `+0.00169`, with a 24-cluster bootstrap 95% interval
`[-0.05439, +0.05541]` and 10/7/7 cluster wins/ties/losses. D-minus-C was
`-0.03080`, interval `[-0.08170, +0.01059]`, with 6/12/6 wins/ties/losses.
The prospective advancement gate failed on every quality criterion: magnitude,
both positive lower bounds, Hit@3, recall@20, and 14 cluster wins versus A.

Decision: reject equal-weight dual-view fusion as the next G01 treatment. Do
not retune its weights on these exposed labels. The next independent hypothesis
is candidate acquisition: the fixed r56/r57 candidate union omitted all gold
paths in 12/48 cases. External BLAgent and LinuxFL+ methods motivate bounded
structural-query and directory-neighborhood acquisition, respectively, but
their published scores do not transfer to this benchmark.

Private archive evidence: `dual-view-fusion-r58/source-run/RUN-FREEZE.json`,
`dual-view-fusion-r58/source-run/SOURCE-SEAL.json`, and
`dual-view-fusion-r58/EVALUATION.json` under the WSL BugsInPy archive.

## Open questions

- Which source-only acquisition channel adds reachable gold files without
  increasing the downstream candidate budget excessively?
- Can the 48-case exposed mechanism transfer to a fresh repository-disjoint
  population before any superiority claim?
