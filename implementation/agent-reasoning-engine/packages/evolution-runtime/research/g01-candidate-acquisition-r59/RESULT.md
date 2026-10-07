# G01 r59 bounded acquisition result

Status: complete; neither acquisition arm advanced.  
Population: 48 exposed BugsInPy r1+r2b cases.  
Claim ceiling: source-only acquisition mechanism evidence.

All 48 candidate sets were sealed before evaluator labels opened. No provider,
embedding, or test execution occurred.

| Arm | At-least-one-gold reach | New vs A | Losses vs A | Mean files | Maximum files |
| --- | ---: | ---: | ---: | ---: | ---: |
| A — unchanged top-10/top-10 union | 36/48 | — | — | 15.31 | 19 |
| B — top-15/top-15 union | 39/48 | 3 | 0 | 22.40 | 29 |
| C — A plus directory siblings | 38/48 | 2 | 0 | 28.88 | 30 |

The predeclared gate required at least four newly reachable cases under the
30-file cap, with no reach losses. B and C each failed the improvement count.
Among the 12 A misses, B newly reached `r1/keras/37`, `r1/luigi/19`, and
`r2b/httpie/3`; C newly reached `r1/keras/39` and `r2b/httpie/3`.

Decision: neither simple depth increase nor same-directory expansion is a
qualified candidate-acquisition treatment. Preserve these as controls. Test a
distinct retrieval query over the full source universe, using the already
sealed functionality descriptions, before adding more reranking complexity.

Private WSL archive evidence: `candidate-acquisition-r59/source-run/RUN-FREEZE.json`,
`candidate-acquisition-r59/source-run/SOURCE-SEAL.json`, and
`candidate-acquisition-r59/EVALUATION.json`.

## Open questions

- Does a functionality-oriented full-repository query find files outside both
  raw rankers' top 30?
- Can a candidate union remain within a useful downstream 8K GLM packet budget?
