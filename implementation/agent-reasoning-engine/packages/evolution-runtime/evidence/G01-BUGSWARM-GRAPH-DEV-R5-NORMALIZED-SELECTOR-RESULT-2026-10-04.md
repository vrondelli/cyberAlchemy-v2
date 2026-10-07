# G01 BugSwarm graph development r5 — normalized selector result

Status, 2026-10-04: **24/24 valid one-shot GLM selections, but the frozen
advancement gate failed by one case win.** This is private development on the
same exposed 24-case cohort, not independent confirmation, ContextBench,
live ARE, or product superiority. The reserved confirmation partition was
not opened.

The [r5 protocol](G01-BUGSWARM-GRAPH-DEV-R5-NORMALIZED-SELECTOR-PROTOCOL-2026-10-04.md)
was fixed before r5 provider calls and evaluator access at SHA-256
`8265d321d814ff2d71b4b3984e943f623f02d87996aa8a1ddcc4f14b52bd6325`.
It reused r4's exact 24 source-only packets and 24/24 same-account tokenizer
admissions. The only changed rule was strict conversion of integer IDs,
canonical decimal-string IDs, or exact listed candidate paths to unique
candidate IDs; no fuzzy matching or retry. The [VPS runner](../research/arb-trace2code-r1/run-bugswarm-graph-dev-r5-normalized-vps.mjs)
made 24 new one-shot `glm-5.3-flash` calls: **24/24 HTTP 200 and 24/24 valid**.
Summed prompt tokens were **52,511**, completion tokens **1,616**, and
summed generation elapsed time **78.141 seconds**. The WSL and VPS receipt
copies match for the terminal result SHA-256
`ebb2b4d2fa93b8f0bf8880fe567b5e68de9954ee0e9f59ad01d9e6b4b77d50f2`
and the aggregate hash of all 24 response-file checksums
`cf31dab38803ae5d3a6cf55891cbca66df87953781d02a4b00d228d316472efd`.

The [source-only sealer](../research/arb-trace2code-r1/seal-bugswarm-graph-dev-r5-predictions.py)
bound all 24 raw responses and complete file rankings before evaluator
access. Prediction SHA-256 is
`f008f4fbeef4530e00c597f23df45ad0834c77a7a5a5ba63768e806ee41d2919`;
prediction-seal SHA-256 is
`7a5d0ec9359fca2f52d9cff23ca308d6c11b63b597e5e429967519e998c7b330`.
The separate [evaluator](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-r5-predictions.py)
verified 24 case identities, source/gold projection, complete file coverage,
response hashes, and provider usage before scoring. Its private receipt
SHA-256 is `59f4f40ee45e41e95f8a9309919cb8e496d3b4bfe217367d9495703e639ab25b`.
Independent `jq` aggregation reproduced the macro MRR, reach, and win/loss
counts.

| Same 24 exposed development cases | ARE | Graph r2 | GLM union r5 |
| --- | ---: | ---: | ---: |
| MRR@8 | 0.21875 | 0.43234 | **0.46667** |
| Hit@3 | 7/24 | 10/24 | **16/24** |
| Top-30 gold reach | 16/24 | 17/24 | **20/24** |

R5-minus-ARE MRR@8 was **+0.24792** with a repository-unit 20,000-draw
paired bootstrap 95% interval **[+0.09653, +0.39931]**, but only **15 wins,
7 ties, 2 losses**. The frozen gate demanded **16 wins**, so it failed even
though validity, MRR, reach, interval, and cost components passed. R5-minus-r2
was **+0.03433**, interval **[-0.14831, +0.22669]**, with **7 wins, 9 ties,
8 losses**; this is not a demonstrated r2 superiority gain. Six of eight
r2 losses demoted a correct r2 rank-1 file. That is a diagnostic pattern,
not a retrospectively authorized ranking repair.

The next hypothesis should compare a GLM-proposed top candidate against the
r2 top candidate using additional source-grounded evidence before replacing
the strong r2 prior. A rule must be separately frozen and tested; tuning it
on these exposed scores is exploratory only. The reserved confirmation cohort
remains closed pending a qualifying rule and independent source-provenance
admission. Original logs/diffs remain HTTP-transport-provisional.

## Open Questions

- Can a source-grounded comparison preserve r2's correct rank-1 cases without
  suppressing r5's genuine new-candidate wins?
- Can a separate, repository-disjoint development cohort be admitted before
  further selector tuning on the same 24 exposed cases?
- How can HTTP-provisional logs and diffs be authenticated or reproduced?
