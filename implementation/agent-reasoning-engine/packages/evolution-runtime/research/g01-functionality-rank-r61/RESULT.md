# G01 r61 fixed functionality-rank result

Status: complete; prospective exposed-development advancement gate passed.  
Population: 48 exposed BugsInPy r1+r2b cases, 24 cohort/repository clusters.  
Claim ceiling: mechanism development only; not fresh confirmation or superiority.

R61 used r60's selected additive candidate pool and a fixed, unweighted
three-channel `RRF(k=60)` over ARE, raw-query chunk BM25, and the completed
functionality-query chunk BM25 ranking. It made no new model or provider calls.
All 48 full rankings were sealed before evaluator-only labels opened.

| Arm | MRR@8 | Hit@3 | recall@20 |
| --- | ---: | ---: | ---: |
| A — unchanged ARE + raw BM25 | 0.26746 | 17/48 | 0.75347 |
| D — expanded pool, fixed three-channel rank | 0.37304 | 26/48 | 0.86458 |

D-minus-A MRR@8 is `+0.10558`, with a 24-cluster bootstrap 95% interval of
`[+0.05670, +0.16178]`; cluster wins/ties/losses are 15/7/2. Every
prospective advancement condition passed: 48 sealed, at least +0.05 MRR,
positive paired lower bound, non-regressing Hit@3 and recall@20, and at least
14 cluster wins.

The measured gain is meaningful on this exposed population, but selection of
the query representation and acquisition arm used earlier exposed development
results. The result must transfer with the same rule to a fresh population
before a bounded comparative claim. It does not establish ContextBench-wide,
end-to-end efficiency, or product superiority. The r57 functionality summaries
were shape-valid; format validity does not establish semantic fidelity, and
one summary included a source-like path from its authenticated failure log.

Private WSL archive evidence: `functionality-rank-r61/source-run/RUN-FREEZE.json`,
`functionality-rank-r61/source-run/SOURCE-SEAL.json`, and
`functionality-rank-r61/EVALUATION.json`.

## Next transfer

Freeze the exact query-generation, full-source chunk BM25, additive candidate
union, completed-rank RRF, cost ceiling, and claim gate on a fresh,
source-disjoint cohort. A new GLM reranker is not needed to test the first
transfer; it remains an option only if ranking fails while candidate reach
holds. License and public-repository pretraining overlap of the previously
tested SweRank model do not apply to r61's model-free ranking stage, but the
GLM-produced query summaries still require provenance and cost disclosure.

## Open questions

- Does the unchanged r61 rule generalize to fresh repositories and failure
  logs without outcome-guided query or candidate changes?
- How much of the gain is candidate reach versus reranking already reachable
  files, and what is the end-to-end query-generation cost?
- Can the remaining five missed cases be addressed without increasing the
  candidate or 8K budget beyond the frozen ceiling?
