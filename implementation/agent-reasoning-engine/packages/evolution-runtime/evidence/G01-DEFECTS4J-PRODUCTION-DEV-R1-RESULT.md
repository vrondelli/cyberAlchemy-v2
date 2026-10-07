# G01 production-aware Defects4J development reader result

Follow-up: [r3 fresh confirmation](G01-DEFECTS4J-32-R3-RESULT.md) scored
27/32 Hit@3 but only five more than stronger fusion, missing the frozen
six-hit criterion. Its composite gate failed despite the strong MRR gain.
The development advancement result below is unchanged.

Status: exposed development advancement screen passed; not confirmation or
superiority. [Frozen reader protocol](G01-DEFECTS4J-PRODUCTION-DEV-R1-PROTOCOL.md).
The [r2 prospective failure](G01-DEFECTS4J-32-R2-RESULT.md) remains unchanged.

All 32 improved source-only packets used the previously sealed production-aware
candidate lists, with no label-dependent candidate or excerpt choice. The same
r2 cases were already exposed before development. All packets admitted under
same-account 8K tokenization and all 32 VPS GLM responses passed the unchanged
decoder. There were zero generation retries. This is a single separately
sealed development run, not a rerun that overwrites r2.

| Arm | MRR@8 | Hit@3 | Gold-file Recall@8 |
| --- | ---: | ---: | ---: |
| Production-filtered ARE | 0.44714 | 17/32 | 0.74740 |
| Original adapted RepoMap | 0.17969 | 8/32 | 0.22917 |
| Stack locator | 0.20313 | 7/32 | 0.18750 |
| Frozen development fusion | 0.43073 | 17/32 | 0.59375 |
| GLM on improved candidates | **0.72396** | **26/32** | **0.75781** |
| Separate production-filtered RepoMap audit | 0.23828 | 9/32 | 0.44271 |
| Separate production-aware fusion audit | 0.42969 | 18/32 | 0.62500 |

The frozen development criteria all passed: MRR delta at least .10 over each
primary comparator, descriptive project sign-flip p<=.05 versus RepoMap and
fusion, at least 24/32 Hit@3, at least six additional successes over the best
primary comparator, and complete label mapping. Against frozen fusion the MRR
delta was +0.29323 and descriptive project p=0.00097656.

The stronger-baseline audit regenerated the entire official RepoMap ranking,
verified its original top20, source projection, revision and candidate counts
against the earlier seal, then applied the same production-path heuristic.
Its fusion uses the same GLM candidate union and production-filtered retrieval
lists. GLM retained +0.29427 MRR over that fusion, descriptive project
p=0.00097656, and eight more Hit@3 successes. The separate audit does not
alter the frozen primary score. These statistics are development diagnostics,
not independent hypothesis-test evidence after policy selection.

Original r2 GLM scored MRR 0.59375 and Hit@3 20/32. The improved policy scored
0.72396 and 26/32 on the same exposed cases. Thus the reader realized much of
the seven-case candidate-reach gain without changing the decoder. The new
denominator includes every case, not only newly reachable ones.

## Cost and receipts

32 tokenizer calls and 32 generation calls; generation used 83,106 prompt
tokens and 1,023 completion tokens. Sum of generation-response elapsed times:
70,279 ms. Candidate acquisition/indexing and tokenizer time are separate;
these measurements do not establish an all-in cost win over model-free arms.
No reasoning records or credentials were archived.

Private WSL root: `/home/vlad_/are-benchmark-archive/defects4j-production-dev-r1/`.
VPS root: `/opt/are-benchmark-runs/g01-defects4j-production-dev-r1/`.
All tokenizer and generation receipts were archived to WSL.

- `PACKETS.jsonl`: SHA-256 `f606d5f33f556f333b614f58b1d2c28c46c47d42a74b3e24115cdcab2dddb8e9`.
- `GENERATION-RESULT.json`: `9c18c181e130a06556c417787716c66bb2ce58288d1dac2cba67b491e442e63a`.
- `PREDICTION-SEAL.json`: `e88625b2ddf936466a8691f1ca8ef53ac5506ff784cb4ab764a89a7aa304ebc2`.
- `SCORE.json`: `73669d6d0a18b935e0a8027109ad8d4bc7d1534a639c651f4a7892107324d50b`.
- `SEALED-PRODUCTION-REPOMAP.json`: `6ac022fadcaa9c8c0cdd2bf87a3063655de98d5487b08e472698b36a6570d2b4`.
- `STRONGER-BASELINE-AUDIT.json`: `86eba373cde209c52eeb5feaab9033ce6b7d45569fd9b4757bf039cd4660f7fc`.

Sources: [packet builder](../research/arb-trace2code-r1/build-defects4j-production-dev-r1.py),
[VPS runner](../research/arb-trace2code-r1/run-defects4j-production-dev-vps-r1.mjs),
[primary scorer](../research/arb-trace2code-r1/score-defects4j-production-dev-r1.py),
[stronger-baseline audit](../research/arb-trace2code-r1/audit-defects4j-production-baselines-r1.py).
Decoder and production-selection tests passed (3/3), runner syntax and Python
script compilation passed. These checks establish functionality, not accuracy.

## Next objective and claim boundary

Freeze the same shortlist, source-window and reader policy for the next two
source-order cases per project, excluding all r1/r2 IDs. Include production-aware
ARE, production-aware RepoMap and production-aware fusion as preregistered
comparators, with original arms retained. Keep the original .10 MRR, p<=.05,
24/32 Hit@3 and six-hit advantage criteria; do not weaken them based on this
result. Seal all predictions before opening fresh modified-class labels.

A passed future result would still concern the adapted public Java file-
localization task, not ContextBench end-to-end Span-F1, official RepoMap's
leaderboard, unseen projects, root-cause proof, cost superiority or ARE-wide
superiority. Stronger symbol-bearing retrieval, live ARE delivery, independent
populations and the G02/G03 campaigns remain separate work.

## Open Questions

- Does the frozen policy preserve its gains on untouched source-order cases?
- Do symbol-bearing retrieval and live ARE episodes retain the advantage?
- Does the production-path heuristic exclude legitimate production classes?
- What all-in quality/cost improvement can the broader benchmark suite verify?
