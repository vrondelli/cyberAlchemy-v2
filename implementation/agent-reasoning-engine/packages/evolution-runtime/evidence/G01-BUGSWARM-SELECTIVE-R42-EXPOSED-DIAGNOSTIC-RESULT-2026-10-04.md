# G01 BugSwarm selective r42 exposed diagnostic result — 2026-10-04

Status: complete and independently recomputed  
Claim ceiling: exposed mechanism diagnosis only; not fresh confirmation or superiority

## Result

R42 scored every one of the 23 r41-admissible cases with the metrics frozen in
r40. Ordinal 15 remains an explicit population exclusion because its target
file does not exist in the failed source.

| Ranker | MRR@8 | Hit@1 | Hit@3 | Top-30 reach |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.18623 | 1/23 | 7/23 | 20/23 |
| graph-r2 | **0.41304** | **5/23** | **12/23** | **22/23** |
| symbol/path | 0.20150 | 2/23 | 5/23 | 15/23 |
| equal-weight RRF | 0.32329 | 4/23 | 10/23 | 21/23 |

Equal-weight fusion improved over ARE by mean RR@8 **+0.13706**, with paired
bootstrap 95% interval **[+0.04824, +0.22836]**. It did not improve over
graph-r2: mean difference **−0.08975**, interval **[−0.23002, +0.06667]**.
Fusion had two top-30 losses relative to graph-r2. Its interval against the
symbol/path channel also crossed zero: **[−0.01475, +0.24488]**.

All four numerical fusion conditions failed. The r40 agreement selector failed
too: fused retrieval missed two of 13 non-all-different cases at top 30 and
missed none of the ten all-different cases. Thus “all views differ” points in
the wrong direction for the proposed deterministic-miss escalation rule on
this population.

## Interpretation

The externally motivated multi-view hypothesis was useful, but equal channel
weight is not the right integration. Graph-r2 is the strongest frozen ranker
on this exposed population. The symbol/path view sometimes repairs weak text
ranking, yet allowing it to vote equally can demote graph evidence and lose
coverage.

The next development candidate should therefore be **graph-first and
coverage-preserving**:

1. preserve graph-r2's top-30 candidates and order as the default spine;
2. use symbol/path and ARE only to add candidates or supply features, never to
   evict graph-r2 top-30 entries;
3. add bounded entity enrichment—containing symbol/signature plus typed
   dependency neighbors—for graph candidates; and
4. qualify a GLM reranker or escalation rule on a distinct, pre-screened
   development population, using rank margins/stability rather than the failed
   all-different rule.

This follows the earlier external research direction while incorporating the
new ablation evidence. It is a candidate architecture, not an implementation
admission or claim.

## Integrity receipts

- protocol SHA-256:
  `c485809b1e4a896539d111a828c670762f02e65883a672f016042e518a4ff649`
- score script SHA-256:
  `08a8fdf5700b741c2af9488ecf62d0b758f06ea0f727b3e8703e643cbf25084e`
- score freeze SHA-256:
  `1afabd6a96ae4f4ffb5b4e62c5ba47bfc540e90d12a41eded4717e2e726ec5eb`
- score result SHA-256:
  `fcc670625a78d8056fbf8c95f944eafc2b1ff9b3bc5b08a837466f5d91db18c4`
- independent audit script SHA-256:
  `ccb470f73a9228f3a8bed5090b4ffc53510b00a0b6dcc7941d2f195698895563`
- audit receipt SHA-256:
  `ba83e2b7b64a0cffbb83ed6c67b7a682d44618a5a16d80ba738bd4d309963f1d`
- private evidence root:
  `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/exposed-diagnostic-r42`

The independent audit rebuilt ranks and all aggregate and paired-bootstrap
metrics from the frozen inputs. It passed without network or model calls.

## Open questions

- Can bounded entity enrichment improve graph-r2 ordering without losing its
  top-30 coverage?
- Which distinct, pre-screened development population should tune graph-first
  fusion or escalation thresholds?
- Do graph score margins or top-set stability predict when a GLM reranker is
  worth its cost?

