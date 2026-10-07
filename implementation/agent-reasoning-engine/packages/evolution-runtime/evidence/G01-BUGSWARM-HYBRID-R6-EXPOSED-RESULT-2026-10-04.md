# G01 BugSwarm hybrid r6 — exposed development result

Status, 2026-10-04: **24/24 valid one-shot GLM responses, but the frozen r6
advancement gate failed.** The same 24 repositories were already exposed in
r1/r2 and the source-only r3–r5 diagnostics. This is not fresh confirmation,
ContextBench, official RepoMap, live ARE, or product superiority. Original
HTTP log/diff payloads remain transport-provisional.

The [r6 protocol](G01-BUGSWARM-HYBRID-R6-EXPOSED-PROTOCOL.md) was fixed before
tokenizer/generation dispatch at SHA-256
`ee4181e4c848d6195ab061616aace2c153832d6c2f16dd7ffee988b8bed299b3`.
The [source-only packet and acquisition screen](G01-BUGSWARM-JAVA-IMPORT-NEIGHBORHOOD-EXPOSED-R4-R5-2026-10-04.md#r6-hybrid-rank-and-compact-packet--exposed-development)
had 23/24 candidate reach, no lost r2-reachable case, a maximum of 30
candidates, and a maximum of 15,212 prompt bytes. This was a ceiling, not
a model score.

The [same-account tokenizer runner](../research/arb-trace2code-r1/tokenize-bugswarm-hybrid-exposed-r6.mjs)
admitted 24/24 packets: maximum prompt **4,008** tokens plus the fixed
512-token output reserve, and **70,279** summed prompt tokens versus the
frozen **84,615** cap. Private tokenizer freeze/result SHA-256 values are
`47f8f88e1d89f604f2d131df2af6d2c11202df708d4f667f8773ea9eb1051661`
and `890b56ad49b135393615efdb7f1c48243c77014079192cb0650e50be6cbddca4`.
All 26 tokenizer receipts have checksum-identical VPS/WSL copies.

The [r6 GLM runner](../research/arb-trace2code-r1/run-bugswarm-hybrid-rerank-exposed-r6.mjs)
completed **24/24 valid JSON selections**, one low-reasoning GLM-5.3-flash
call per case, zero retries. Private generation freeze/result SHA-256 values
are `14872bcf3d69da268c16584a3940824132b3d1e7a02f517949a763fc43c1c04c`
and `180965a25874db733ee2890189f3bf7d2ad32cf972625f87a0b6a65fb4fd8423`.
All 26 generation receipts have checksum-identical VPS/WSL copies. The
[prediction sealer](../research/arb-trace2code-r1/seal-bugswarm-hybrid-predictions-exposed-r6.mjs)
verified exact requests, usage, response shape, source path selection, and
the 24 response hashes before evaluator access. Its prediction-seal SHA-256
is `386174a416c1e9ceb71bd0ce3d48b0fe357273ec1af3a10ab31f0c7307980751`.

The separate [evaluator-only scorer](../research/arb-trace2code-r1/evaluate-bugswarm-hybrid-rerank-exposed-r6.py)
recomputed the unchanged r1 baselines and scored the sealed selections. Its
private result SHA-256 is
`7c9dd2e731587c44895aa3bcf5c00009799c3459aafc356d8786a8485a1cbae2`.
An independent `jq` arithmetic check reproduced the 24-case macro MRR and
12 ARE wins.

| Same 24 exposed cases | MRR@8 |
| --- | ---: |
| ARE standalone file ranker | 0.19831 |
| Original r1 GLM | 0.24792 |
| Expanded-cue r2 GLM | 0.36215 |
| Hybrid r6 GLM | **0.36811** |

R6-minus-ARE MRR@8 was **+0.16979**, paired repository-unit bootstrap 95%
interval **[+0.07336, +0.27604]**, with **12 wins, 10 ties, 2 losses**.
R6-minus-original-r1 GLM was **+0.12019**, interval
**[+0.02123, +0.22331]**. R6-minus-r2 GLM was only **+0.00595**,
interval **[-0.04405, +0.06538]**, with 4 wins, 15 ties, 5 losses; this
same-exposed-case stochastic comparison is descriptive.

The gate failed on two components: **12/24 ARE wins** versus the required
16, and **0/3** positive MRR cases among newly reachable Java ordinals
16, 17, and 20 versus the required two. The positive mean difference and
token budget do not override those failures. R6 used **70,279 prompt + 985
completion tokens** and **55.970 seconds summed generation-call time**;
these are not all-in episode cost or campaign wall-clock.

The next exposed mechanism must improve the evidence shown for newly
acquired Java files and their selection probability, not merely candidate
reach. Any next policy requires a new frozen source-only packet and gate;
these 24 cases can only diagnose development. A superiority claim still
requires a separately frozen, repository-disjoint, label-screened population
and independent validation of original log/diff transport.

### Source-only presentation diagnosis

A read-only inspection of all twelve r6 Java packets found **319/350**
candidate excerpts beginning with a `package`/`import` line or comment
banner; 172 began with comments and 146 with `package`. The deterministic
260-character cap therefore spent most candidate evidence on preamble rather
than behavior. This observation uses packet text only, not evaluator labels.

One abstention case's sealed short query contained only a Git cleanup tail,
while its original source-only full failure log includes a Maven test error,
`ConstraintViolation`, and `BUILD FAILURE` lines. That is an input-summary
loss, not evidence that the model could not localize the source given a
better summary. The next source-only experiment should (1) extract bounded
failure-bearing log lines before cleanup tails, and (2) present behavior-
bearing Java declarations or query-matching code lines after stripping
license/package/import preamble. First measure packet token cost and
boilerplate reduction without evaluator access; freeze a separate protocol
before any further GLM calls. This mechanism remains hypothetical.

A separately frozen [r7 Java-evidence run](G01-BUGSWARM-JAVA-EVIDENCE-R7-EXPOSED-RESULT-2026-10-04.md)
later tested that presentation rule with twelve new Java calls and twelve
carried Python responses. It improved exposed MRR and one newly reachable
Java case, but also failed its own advancement gate. Do not reinterpret r6
as qualified because of the later diagnostic.

## Open Questions

- Which source-grounded, budgeted Java evidence presentation makes relevant
  import-neighbor files selectable without displacing existing r2 wins?
- Does a different fixed ranking or hierarchical file/class excerpt on
  exposed cases improve at least the three newly reachable Java cases?
- Which fresh BugSwarm cohort can support the unchanged matched-denominator
  test with authenticated or reproducible failure artifacts?
