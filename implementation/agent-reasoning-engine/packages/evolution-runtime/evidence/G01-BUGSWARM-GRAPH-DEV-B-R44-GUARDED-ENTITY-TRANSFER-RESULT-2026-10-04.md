# G01 BugSwarm cohort-B r44 guarded entity transfer result — 2026-10-04

Status: complete, independently sealed and audited; prospective advancement gate passed  
Population: unchanged 24-case exposed development cohort B  
Claim ceiling: cross-development transfer evidence only

## Result

R44 transferred r43's entity-card construction unchanged to a distinct balanced
development cohort and prospectively applied the fixed graph-prefix-4 guard.
All **24/24** tokenizer requests and **24/24** one-shot GLM generations were
valid. Independent prediction sealing preserved every graph top-`N` candidate
set for both raw and guarded rankings.

| 24-case cohort B | graph-r2 | Raw entity GLM | Guarded entity GLM |
| --- | ---: | ---: | ---: |
| MRR@8 | 0.41667 | **0.58160** | **0.43264** |
| Hit@1 | 7/24 | **13/24** | 7/24 |
| Hit@3 | 12/24 | **15/24** | 12/24 |
| Top-30 reach | 18/24 | 18/24 | 18/24 |

The frozen primary guarded-minus-graph contrast was:

- mean paired RR@8 improvement: **+0.01597**;
- paired 95% bootstrap interval: **[+0.00139, +0.03576]**;
- wins/ties/losses: **4/20/0**.

The guarded treatment therefore passed every prospectively fixed quantitative
condition: valid denominator, exact candidate-set preservation, higher MRR@8,
positive paired lower bound, and non-inferior Hit@3. A separate audit rebuilt
all ranks, metrics, intervals, and gate checks from the sealed predictions,
graph rankings, and evaluator-only labels with zero model or network calls.

Raw entity reranking remains a useful diagnostic, not the admitted treatment.
It improved MRR@8 by **+0.16493** with 8/13/3 wins/ties/losses, but its paired
interval **[-0.02257, +0.35069]** crossed zero and it regressed three cases.

## Language readout

These balanced language subsets are descriptive, not separate claim
populations.

| Language | Cases | Graph MRR@8 | Raw MRR@8 | Guarded MRR@8 |
| --- | ---: | ---: | ---: | ---: |
| Python | 12 | 0.49306 | 0.71875 | 0.51250 |
| Java | 12 | 0.34028 | 0.44444 | 0.35278 |

The conservative guarded gain appears in both language halves, while the raw
gain is larger and less stable.

## Reliability and cost

- tokenizer admissions: 24/24;
- valid generations: 24/24;
- known prompt tokens: 77,747;
- known completion tokens: 1,424;
- summed tokenizer time: 6.908 seconds;
- summed generation time: 59.613 seconds;
- automatic retries and transport failures: zero;
- source or evaluator-gold data transferred to the VPS: none.

## Interpretation

R44 answers the r43 transfer question positively: preserving graph ranks 1–4
eliminated observed losses while retaining a small, statistically positive
MRR@8 gain on a distinct development cohort. This is stronger evidence than
the outcome-selected r43 projection, but it is still development evidence.
The labels retain their recorded provisional BugSwarm HTTP provenance, the
population is exposed, and the effect is deliberately conservative.

The candidate may now be frozen unchanged on a newly admitted untouched
population. R44 itself does not establish product or benchmark superiority.

The separate external-technique review recommends measuring candidate-order
instability and, if necessary, testing permutation consensus. That work must
remain a separately named exposed-development branch; it must not alter the
qualified guarded treatment before confirmation.

## Integrity receipts

- protocol SHA-256:
  `8009f24043f2e8190ad9af707c0b17a81237b15d6e0e962509f1a63d1372c958`
- packet builder SHA-256:
  `380c48b60dfa27d66209c7a254bca4d3e1894bfa6ebff7c84396fd885f862856`
- packets SHA-256:
  `e8050018d1bb3ca956ad2d96487cc314c7fb5f35538d333978f214d44286ae02`
- packet seal SHA-256:
  `6207ed8cbe4b3e812c0becb97b0b2cc2abd12b65cdda34ed8228149b8a068db6`
- VPS runner SHA-256:
  `81272e09bf907ee66fa152ba0a7c079daa1dd954b737e4bb8c03c2784e695c08`
- run result SHA-256:
  `1efdf36c9cb40a818965932b6130950c5cce9e84518242414f3ac9613c10e420`
- tokenizer result SHA-256:
  `1d2476b20b84406409e639f1cb9acafede1f3a80c9a033af4d04d932b9998c56`
- prediction sealer SHA-256:
  `b4b451a6677e09f23d31bc7bcc7a77b898d44490f61866fd2e10f1794985ccad`
- predictions SHA-256:
  `c677e16548ad197272bbdb52284e1b3887b994b11d2091e56de96a5bf057b782`
- prediction seal SHA-256:
  `ef424c31901ed8c316cb59225bdbd5fee85fefb22b26036abb844821b692cd2e`
- evaluator SHA-256:
  `8b3f0d92df8c9ed7540145e91f2f933b9a1f2121383cdedd8e100d44b83bf2ba`
- evaluation SHA-256:
  `04f7af64488a0c9c69c2dfa75df7de0016657124d0d18b74edf1a510d174838a`
- audit script SHA-256:
  `2a701a470c8163aed93fe47931e1a77d9009bb2a39a5f024efba0158c723928c`
- independent audit SHA-256:
  `b23644dfd935e0fcb88ef3371659646b52436c1aa67ea8577fec3521b1985514`

Private WSL evidence:
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2/code-only/entity-r44`

Checksum-identical live receipts remain on the VPS under
`/opt/are-benchmark-runs/g01-graph-dev-b-entity-r44`.

## Next benchmark

Freeze the unchanged entity-card construction plus prefix-4 guard on a new,
repository-disjoint, target-existence-screened population with authenticated
logs, exact failed-source archives, evaluator-isolated direct Git-tree labels,
and the same matched metrics. In parallel only after that freeze, use exposed
r43/r44 packets to diagnose order sensitivity without consuming confirmation
evidence.

## Open questions

- Is a sufficiently large repository-disjoint untouched BugSwarm population
  still available after all prior exclusions?
- Does the small guarded effect reproduce with authenticated direct labels?
- How much raw-reranker instability is caused by candidate serialization order?
- Can permutation consensus retain raw gains without weakening the zero-loss
  behavior of the prefix guard?

