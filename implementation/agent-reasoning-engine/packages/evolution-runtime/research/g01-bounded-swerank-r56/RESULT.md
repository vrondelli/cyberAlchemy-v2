# G01 bounded semantic reranking r56 result

Status: complete; advancement gate failed  
Population: 48 exposed BugsInPy r1+r2b cases  
Claim ceiling: mechanism evidence only

## Result

The source-side run sealed 48/48 cases before label access. The bounded union
contained 735 case-candidate windows. CodeRankEmbed required 1,164.628 seconds
and SweRankEmbed-Small required 1,248.592 seconds on the WSL CPU runtime.

| Arm | MRR@8 | Hit@3 | recall@20 |
| --- | ---: | ---: | ---: |
| A — ARE + chunk RRF | 0.26746 | 0.35417 | 0.75347 |
| B — A + CodeRank | 0.21138 | 0.33333 | 0.75347 |
| C — A + SweRank | 0.25047 | 0.35417 | 0.75347 |

SweRank improved over CodeRank by `+0.03909` MRR@8. Its 24-cluster bootstrap
interval was `[+0.01230, +0.07788]`, with 10 wins, 13 ties, and one loss.
This establishes that issue-localization fine-tuning transferred better than
generic CodeRank under identical evidence.

SweRank did not improve the raw fusion. C-minus-A was `-0.01699`, interval
`[-0.06939, +0.03299]`, with 8/10/6 cluster wins/ties/losses. Only the
predeclared `C-B >= 0.03` and metric non-regression conditions passed; the
whole advancement gate failed.

## Diagnostic

The bounded candidate union reached at least one gold path in 36/48 cases.
Within that union, standalone SweRank MRR@8 was `0.19680`, versus `0.08857`
for CodeRank. The task-aligned encoder therefore adds genuine relative signal,
but raw failure logs and lexically chosen fixed windows do not make it strong
enough to improve the established ARE/BM25 fusion.

## Decision

Reject direct semantic-channel fusion in this formulation. Preserve SweRank as
the selected semantic encoder for the next exposed representation experiment.
R57 should change only the query representation: convert the authenticated
failure log into a concise failing-functionality description, retain the raw
query as an independent control, reuse the same candidate/window universe, and
freeze a raw fallback for invalid summaries. Structure-aware document context
remains a later separate ablation.

SweRank's CC-BY-NC-4.0 license and plausible public-repository training overlap
continue to cap any later result at private pretrained-component evidence.

## Evidence

- Source seal: `bounded-swerank-r56/source-run-r2/SOURCE-SEAL.json`
- Evaluation: `bounded-swerank-r56/EVALUATION.json`
- Failed loader attempt retained at `bounded-swerank-r56/source-run/`

## Open questions

- Does a functionality-oriented query close the remaining gap to raw fusion?
- Are the twelve unreachable cases primarily candidate-generation failures?
- Can a permissively licensed encoder reproduce SweRank's advantage?
