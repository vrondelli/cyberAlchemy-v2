# G01 r60 functionality-query acquisition result

Status: complete; additive arm C advanced its acquisition gate.  
Population: 48 exposed BugsInPy r1+r2b cases.  
Claim ceiling: source-only acquisition evidence; no ranking or superiority claim.

All 48 full-repository 120-line chunk BM25 rankings were sealed before labels
opened. The original raw-query rankings were reproduced exactly as an input
identity check. R60 reused r57's 48 existing functionality summaries and made
zero new provider or embedding-model calls. Source-side elapsed time was
187.277 seconds on WSL.

| Arm | At-least-one-gold reach | New vs A | Losses vs A | Mean files | Maximum files |
| --- | ---: | ---: | ---: | ---: | ---: |
| A — ARE top 10 + raw BM25 top 10 | 36/48 | — | — | 15.31 | 19 |
| B — ARE top 10 + functionality BM25 top 10 | 42/48 | 7 | 1 | 16.25 | 20 |
| C — A + functionality BM25 top 10 | 43/48 | 7 | 0 | 20.65 | 26 |

The predeclared gate required at least four new reaches, no losses, all 48
cases, and the arm's candidate cap. C passed every condition. B failed because
it lost one previously reachable case. C's mean gold-file recall rose from
`0.69444` to `0.86458` at its candidate cap.

Decision: C is the selected candidate-acquisition input for a separately
frozen ranking experiment. Do not call this a localization accuracy gain yet:
the extra files must be ordered effectively under the downstream context and
cost budget, then transferred to a fresh cohort before any superiority claim.
The result supports a dual-query retrieval mechanism akin to BLAgent's
complementary query views, but this is an ARE experiment, not a BLAgent
replication.

Private WSL archive evidence: `functionality-acquisition-r60/source-run/RUN-FREEZE.json`,
`functionality-acquisition-r60/source-run/SOURCE-SEAL.json`, and
`functionality-acquisition-r60/EVALUATION.json`.

## Open questions

- Can a fixed three-channel ranking turn the new candidate reach into MRR@8
  and Hit@3 gains without demoting previously correct files?
- If not, can bounded evidence-grounded GLM ranking improve the expanded pool
  inside 8K, with valid response and cost receipts?
- Does the mechanism transfer to a fresh, repository-disjoint population?
