# G03 BEAM 500K IE citation-discordant mechanism test r2

Status: **private, exposed-development, label-conditioned protocol fixed
before r2 GLM generation**. This is a mechanism test, not an unbiased sample,
independent confirmation, native BEAM score, or superiority campaign.

The prior 12-pair score-blind answer pilot contained none of the eight
questions whose r4 cross-encoder and BM25 projections differed in cited-turn
reach. That made its near-tie uninformative about the specific citation-gain
mechanism. R2 includes **all eight** such questions from the sealed
60-question development citation audit: seven r4-favoring and one
BM25-favoring, across seven conversations. Selection deliberately uses
evaluator citation counts, but **no evaluator answer or rubric**. This
post-citation-audit conditioning prevents a population-level claim. The
selection rule and receipt are at private SHA-256
`8a41f5a0e84bc7dc9557303a3b305d693e95291a02eec213078ca9cdf93a587e`.

The matched 16 GLM wires are frozen at private SHA-256
`788b0e52bde2597417844573e19008f9c17557edccd25baf79ae63604c8594c1`.
The generation wires contain only the source-only question and arm evidence,
not the citation counts, answer, rubric, or reference. They preserve the prior
common system prompt, 5,000-UTF-16-character projection cap, `glm-5.3-flash`,
thinking enabled, low reasoning effort, `max_tokens: 512`, and 8,192-token
request window. Both arms use the unchanged r4 and BM25 selections. A
same-account tokenizer preflight must admit all exact wires with the 512-token
reserve. If admitted, make at most 16 serial answer calls with zero retries;
preserve every attempted raw receipt and stop on the first invalid call. No
replacement, top-up, or new question selection follows this freeze.

The fixed readout is the paired per-question mean of native rubric criteria
under the same GLM-adapted BEAM judge prompt as the preceding pilot. The eight
development references contain 12 criteria, producing 24 blinded judge wires
and two reversed-order passes (at most 48 judge calls). Accept only JSON scores
0, 0.5, 1 as numbers or canonical decimal strings `0`, `0.0`, `0.5`, `1`,
`1.0`; reject and stop on malformed or incomplete judgments without
imputation. Report each question's paired mean, repeat disagreement, seven
r4-favoring cases separately from the one BM25-favoring case, and all-in
generation/judge usage. Before interpreting quality, inspect whether selected
fragments actually contain the answer-bearing content and whether source
labels are coherent. No 100K reserved evaluator values are accessed.

Even a strong r2 result would show only that differential cited-turn reach
sometimes helps on these *selected exposed development cases*. It cannot be
used to claim overall BEAM or ARE superiority. Advancement requires a new
source-grounded candidate, unbiased development evidence, costed VPS
reproduction, and a separately frozen independent population.

## Open Questions

- Will all 16 exact wires pass same-account 8K admission and yield valid answers?
- Does answer correctness track the seven r4-favoring and one BM25-favoring
  cited-turn differences, or are citation labels a weak proxy here too?
- Which failure mode is most promising for a broadly effective successor
  candidate without relying on evaluator labels at selection time?

## Terminal r2 judge and separate r3 calibration decision

The exact r2 16-wire tokenizer preflight passed with maximum prompt count
1,939 (private result SHA-256
`9d221612a6b1c2656817f110b29d97d2a7dd753998de62b564b0b56c75f4beee`).
All **16/16** GLM answer calls were valid with zero retries, private result
SHA-256 `d399b5f879708c720b9216e73caa68c42c843d6527895d1c896dcdaa5356cf92`.
The blinded rubric packet has 24 wires for 12 criteria, SHA-256
`5f88bb2e13fb15bef76377011dfd289de1192b1af873780b86794cdc56b249df`;
the separate arm map is SHA-256
`1ea5dbcbaef1849b048f4784386bd59f12f0501461824f1e2e09b195f766e982`.

The r2 judge's 24-wire tokenizer preflight passed, but its generation is
**terminal incomplete**: 24 valid first-pass judgments, then one invalid
first reverse-pass judgment with HTTP 200, `finish_reason: length`, and the
full 256-token completion cap (157 reported reasoning tokens). No retry or
top-up occurred. Its private result SHA-256 is
`0f97fcb803f3e48949ed52f1b626e9716442402abf5a1e4e7fb49444a7aa53e3`.
The first pass alone gives a provisional mean paired difference **+0.3125**
over these eight selected cases (three r4 wins, five ties), but the required
two-pass score is absent and this value is not a campaign result.

Before any r3 judge calls, the separately named calibration is fixed to the
same 24 blinded input wires, same adapted prompt and GLM model, same zero-retry
and stop-on-invalid policy, and two reversed-order passes. The only planned
change is `max_tokens: 512` and corresponding 8K tokenizer reserve. It will
write a fresh freeze and receipts; it will not continue or repair the r2 run.
This cap is chosen after observing r2's truncation and provisional first-pass
scores, so even a completed r3 result remains exposed-development mechanism
evidence only.

## Completed r3 calibration and source review — 2026-10-03 UTC

The separate r3 judge admitted **24/24** exact wires at the 8K tokenizer
boundary and completed **48/48** judgments with zero retries and no score
disagreement between its reversed-order passes. Its private judge result
SHA-256 is
`b42932524a2352a25815266937d96099aa9b08a32a0d0b4a68092e06524e241e`;
the receipt/score audit SHA-256 is
`819d06036741a772ccf6fa4665c926b77f0a263dd290ba4d8a4e972ff3d8780e`.
Private VPS and WSL receipt trees match under checksum dry-run comparison.
The mean per-question GLM-adapted rubric score was **0.8125 r4** versus
**0.5000 BM25**, paired difference **+0.3125**: three r4 wins, zero BM25
wins, and five ties. Among the seven r4-favoring citation cases, the mean
paired difference was **+0.3571**; the single BM25-favoring citation case
was an answer-score tie. This is a strong local signal for the cited-turn
mechanism, **not** a population or product superiority estimate, because
all eight cases were selected *after* their citation differences were known.

A private final-answer/source review found two clear r4-only recoveries of
the asked starting percentage and original function. In a third case, r4
included one of two asked coordinate points but still preferred a later
different pair, earning partial credit. Four r4-favoring citation cases were
answer ties: alternative turns supplied the same fact in both arms in three,
and both arms chose a different sequence example in the two-source case.
The BM25-favoring citation case was also an answer tie because both arms
included the same dataset counts. This shows why citation identity by itself
is neither necessary nor sufficient for answer correctness.

The next source-only diagnosis should measure whether remaining r4 misses
are outside the BM25 top-100 pool or inside it but lost during reranking and
5K-character packing. Any changed selector must be tested score-blind across
the full 60-question exposed-development set before new GLM answer spend.

The evaluator-only, no-model pool diagnosis subsequently found that the exact
BM25 top-100 fragment pool contains all cited turns for **40/60** questions
(51/74 cited turns), versus r4's final **36/60** (39/74). In seven questions,
r4 selected no cited turn despite at least one being in its pool; in four,
the full cited set was available but not fully packed. The diagnosis receipt
SHA-256 is `a42fec6bd0df05bcd2754f28e4acd2ce3134abc0ce8cbf8f7f0395cf8db3b0c0`.
A separately versioned rank-depth diagnosis found top-300 potential
**48/60** hit-all (60/74 cited turns) and top-500 **49/60** (61/74), at
private SHA-256
`5aa1de45aa6d3044b6000b55a4fdd9f843c31b612a4598836ca7f6037f51929e`.
These are *oracle upper bounds on candidate availability*, not achieved
selection or answer quality. The diminishing gain beyond 300 suggests a
bounded top-300 successor is a reasonable next exposed-development test, with
roughly triple the pair-scoring work of r4 and unchanged 5K packing.
