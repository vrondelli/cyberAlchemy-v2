# G01 BugSwarm cue rerank r2 — exposed development result

Status, 2026-10-04: **24/24 valid one-shot GLM responses and scored labels;
the predeclared exposed-development advancement gate failed.** The effect is
substantial *on these already-exposed cases*, but it is not independent
confirmation, original ContextBench, official RepoMap, live ARE, lower cost,
or a product superiority claim. The original BugSwarm log and diff payloads
remain transport-provisional because they came over unauthenticated HTTP.

The [fixed pre-generation protocol](G01-BUGSWARM-CUE-RERANK-EXPOSED-R2-PROTOCOL.md)
(SHA-256 `2fdcb9ae2c0bb47c4a049f66b347529f40d3cbf7c4c95a02bac8978d94795857`)
preserved the original 24-case denominator and packet content, then appended
at most ten sealed source-only full-log filename cues. The [packet builder](../research/arb-trace2code-r1/build-bugswarm-cue-packets-exposed-r1.py)
sealed 24 packets at SHA-256
`ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7`.
The largest packet had 29 candidates and 17,605 bytes. The same-account
[tokenizer-only run](../research/arb-trace2code-r1/tokenize-bugswarm-cue-packets-exposed-r1.mjs)
admitted 24/24; maximum prompt tokens were 4,197 plus the fixed 512-token
output reserve, below the 8,192-token limit. Its result SHA-256 is
`ed64632718e02ec37881e5bc2fc13c3fdb2ec942b3c41a41c1054c371d4bbe9c`.

The [VPS generation runner](../research/arb-trace2code-r1/run-bugswarm-cue-rerank-exposed-r2.mjs)
used GLM-5.3-flash, low reasoning effort, one call per case, zero retries,
and no gold access. An incorrect tokenizer-freeze hash stopped the first
runner attempt **before the generation freeze or any generation call**;
the exact hash was corrected and the remote files rechecked. The subsequent
run completed **24/24 valid JSON selections**. Private `GENERATION-FREEZE.json`
and `GENERATION-RESULT.json` SHA-256 values are
`1b3bfb4bf0e22d909cbc4c7d0f06b182374b412b18ab424d77a3c2f6a836117c`
and `5d168ece82c249ad63ba49a1eb5e3462166eab77af20f9198aaf2cf441ad3ef3`.
All 26 generation files have a checksum-identical private WSL cold copy.

The [prediction sealer](../research/arb-trace2code-r1/seal-bugswarm-cue-predictions-exposed-r2.mjs)
verified request hashes, response structure, provider usage, identities,
and source-only path selection before evaluator access. Its private prediction
seal SHA-256 is
`889219fcfc5f0a9ff3edb62e1d09c577e1a3a427c3758e6af465fbc6708d001b`.
The separate [evaluator-only scorer](../research/arb-trace2code-r1/evaluate-bugswarm-cue-rerank-exposed-r2.py)
reused the unchanged pinned r1 gold and recomputed both r1 baselines from
the original packet before comparing. Its `EVALUATION-R2.json` SHA-256 is
`845b89e244dbe24d08a5271948486b7dd20f01f6df43bb7e5a7d403fc447e877`.
An independent `jq` arithmetic check reproduced the three macro MRR values,
12/10/2 ARE win/tie/loss count, and five newly reachable MRR-positive cases.
All source, run, prediction and evaluator files are private under
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/exposed-cue-packets-r1/`.

| Same 24 exposed cases | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARE standalone file ranker | 0.19831 | 0.20833 | 0.58333 |
| Original r1 GLM packet | 0.24792 | 0.41667 | 0.58333 |
| Expanded-cue r2 GLM packet | **0.36215** | **0.58333** | **0.70833** |

The paired r2-minus-ARE MRR@8 difference was **+0.16384**, with the
predeclared 20,000-draw repository-unit bootstrap 95% interval
**[+0.04960, +0.28264]** and **12 wins, 10 ties, 2 losses**. The paired
r2-minus-original-GLM difference was **+0.11424**, interval
**[+0.01701, +0.21319]**, with 10 wins, 12 ties, 2 losses. Because this
compares two stochastic calls on the same exposed tasks, that second
interval is descriptive, not a clean causal or independent transfer claim.
Five of seven cases newly reachable by the cue packet had positive MRR@8.

Known r2 generation usage was **71,784 prompt + 1,042 completion tokens**
over 24 calls and **59.053 seconds summed call time**. The original r1 GLM
generation used 56,410 prompt + 1,158 completion tokens and 52.962 seconds
summed call time. Thus r2 used about **1.27×** as many prompt tokens; neither
timing figure is campaign wall-clock or all-in episode cost. The extra
quality did not establish efficiency superiority.

The frozen advancement gate failed solely on its **at least 16/24 ARE wins**
component: r2 had 12. All other declared components passed, including 24
valid calls/labels, at least +0.10 MRR over ARE and original GLM, positive
ARE bootstrap lower bound, at least four newly reachable positive cases,
and the 1.5× prompt-token cap. Do not loosen that gate or call r2 qualified
for a fresh confirmation run. Four Java cases (13, 16, 17, 20) remain outside
the source-only candidate packet and were ties at zero; two other cases
(3 and 24) lost MRR against ARE. These are exposed diagnostic targets, not
permission to tune against gold or rerun this cohort as fresh evidence.

## Open Questions

- Can a source-only Java candidate-acquisition rule address the four
  remaining unreachable cases while preserving precision and a bounded
  packet budget, without gold-conditioned tuning?
- Can a subsequent, separately frozen development policy reach the original
  16-win advancement bar without sacrificing the gains already observed?
- Which untouched BugSwarm population has independently authenticated or
  reproducible logs/diffs and supports a prospective 24-repository test?
