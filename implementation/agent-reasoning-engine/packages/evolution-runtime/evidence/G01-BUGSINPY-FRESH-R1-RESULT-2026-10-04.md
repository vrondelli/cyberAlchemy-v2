# G01 BugsInPy fresh trace-to-code r1 result

Status: **the prospectively frozen 24-case, 12-repository source-projected
file-retrieval quality gate passed; no broad ARE-product superiority claim.**
This cohort uses BugsInPy pytest failure logs and exact-commit public source
archives. It does not reuse any of the 101 exposed ARB case labels or their
seven repositories. The [protocol](G01-BUGSINPY-FRESH-R1-PROTOCOL.md) was
fixed before provider dispatch and evaluator opening; the [source screen](G01-BUGSINPY-FRESH-TRACE-COHORT-2026-10-04.md)
owns the acquisition and gold-isolation lineage.

The two source-only arms and the GLM packet were sealed before dispatch:
ARE trace-text rankings SHA-256
`12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2`,
local 120-line chunk-BM25 rankings
`1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c`,
and 24 packets
`5a2ca87c90980017e11ee22e8491a57530e2b8d423eeb6027b44acd4be965296`.
The VPS root is `/opt/are/evolution-runtime/g01-bugsinpy-rerank-r1/`;
its pre-dispatch `FREEZE.json` SHA-256 is
`8d3e9f81df1ebffe3c7f9a6915783d72b035e1800893715389dbeded8824d1cf`.
The full 1.6 MB run has a checksum-identical private WSL cold copy under
`/home/vlad_/are-benchmark-archive/bugsinpy-trace-candidate-20261004/vps-run-r1/`.
Neither gold patches nor source archives were transferred to the VPS.

All **24/24** tokenizer admissions and one-shot GLM-5.3-flash calls were
valid HTTP 200 JSON responses with no automatic retries. The maximum prompt
was 2,787 tokens, below the 8,192 prompt-plus-512 reserve cap. The 24 task
calls used **55,541 prompt + 889 completion tokens** and **47,128 ms**
summed provider-call wall time, excluding readiness and tokenizer checks.
The source-only ARE and chunk-BM25 rankers each took about 19 seconds
summed ranker time on WSL; these are not matched end-to-end episode times.

All model-selected IDs and complete full-file rankings were independently
bound to the exact request hashes *before* gold opening. The private
`SEALED-RANKINGS.jsonl` SHA-256 is
`f72dc04c2d4305c6a2544dcbfe1fe0c4af362833f3349417c5959344100f27e9`.
The evaluator then parsed the 24 `bug_patch.txt` files. All **24/24** had
nonempty changed-file labels within the frozen candidate universe; 20 cases
had one changed file and four had two, with none outside that universe.
The private `EVALUATOR-AUDIT.json` SHA-256 is
`c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0`.
An independent [Git-patch and metric verifier](../research/arb-trace2code-r1/verify-bugsinpy-result-r1.py)
matched all 24 patch paths and all per-case and aggregate metric values.

| Frozen 24-case BugsInPy source-projected set | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| Local chunk BM25 | 0.10496 | 3/24 | 0.41667 |
| ARE trace-text file ranker | 0.19931 | 8/24 | **0.68750** |
| Chunk/file union + GLM rerank | **0.52083** | **13/24** | **0.68750** |

The proposal gained **+0.32153 MRR@8** over ARE and **+0.41587** over
chunk BM25. Twenty-thousand paired repository-cluster bootstrap resamples
give 95% intervals **[+0.19653, +0.44306]** and
**[+0.26339, +0.54950]**, respectively. Against the stronger standalone
ARE arm, nine repositories improved and three tied at zero; none regressed.
All five frozen advancement checks passed: 24 valid calls, 24 valid labels,
at least +0.10 MRR@8, positive repository-cluster lower bounds, and at
least eight repository gains. The candidate union contained a changed file
in only **15/24** cases; the reranker brought all 15 to MRR@8-positive
positions. The nine misses identify an acquisition ceiling, and unchanged
Recall@20 confirms that this result is an ordering gain, not broader source
coverage.

This is a **bounded superiority result over the two named local standalone
rankers on fresh BugsInPy source-projected file retrieval**, at additional
model cost. It is not official ARB RepoMap superiority: the chunk comparator
is a local fixed implementation, and official RepoMap remains unrun. It is
not exact-Git/live ARE workflow superiority, ContextBench Span-F1, lower
cost, or general ARE product superiority. The public dataset may also have
appeared in model training, so “fresh” means unexposed to this research
cycle's selection/scoring process, not guaranteed unseen by GLM. No product
page or published claim has been changed.

## Open Questions

- Can a source-only acquisition mechanism raise the 15/24 candidate-union
  ceiling on a new, untouched cohort without losing the rerank gain?
- How does the frozen mechanism compare with official RepoMap under matched
  query, source universe, and cost accounting?
- Does the gain survive an exact-Git, live ARE episode with actual read
  delivery and complete resource costs, and then the original ContextBench
  campaign? Those are separate claim gates, not consequences of this r1 win.
