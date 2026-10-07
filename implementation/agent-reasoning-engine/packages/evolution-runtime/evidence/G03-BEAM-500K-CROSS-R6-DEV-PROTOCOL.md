# G03 BEAM 500K IE cross-encoder r6 — complete short windows

Status: **private exposed-development protocol fixed before r6 selection**.
R5's top-300 retriever improved citation reach but failed its fixed gate and
sent no GLM answers. This is a separately versioned candidate, not an r5
repair or an independent superiority test.

## Hypothesis and fixed mechanism

R5's cross-encoder paired a question with up to 2,500 UTF-16 characters of
fragment text, truncated the model pair to 256 tokens, and reported
12,232/18,000 pairs *at* that cap. The ranking may therefore ignore
answer-bearing text later in a fragment. R6 uses the same pinned quantized
MiniLM model, top-300 BM25 candidate depth, 256-token pair cap, batch size
eight, and greedy 5,000-character JSON evidence projection, but partitions
source turns losslessly into **900-UTF-16-character** treatment fragments.
This may let the model score more complete windows and pack more source
locations. The unchanged BM25 control is independently recomputed from the
original 2,500-character fragments and must match its prior sealed binding
for every question. The [r6 selector](../research/g03-beam-r1/plan-beam-500k-dev-ie-cross-r6.py)
reads only source-only histories and questions across the same 30 BEAM 500K
development conversations and 60 information-extraction probes. It does not
read evaluator answers, rubrics, citation IDs, or reserved 100K conversations.

Before a full run, test one conversation for throughput, valid source-only
selections, unchanged control, and the number of pair inputs at the token
cap. The full r6 run must seal all 60 selections before an evaluator-only
audit. Compare r6 with r5, r4, and BM25 on the same 60 questions; report
hit-all, hit-any, cited-turn totals, paired wins/losses, and elapsed CPU time.
The development pool-bound audit gave all tested fragment caps the same
48/60 top-300 citation-availability ceiling; that is only an oracle bound,
not a predicted r6 result.

The one-conversation preflight passed two source-only selections and the
unchanged control check. It scored 600 pairs in **44.735 seconds**; **50/600**
pair inputs were at the 256-token cap versus **466/600** in r5's matched
one-conversation preflight. The private r6 preflight SHA-256 is
`a39c4b9b2527b781444c6a824e7b663207664c6b0500dca147e2148f3512a0be`.
As with r5, “at cap” does not prove which pairs were actually truncated.

The next-spend gate for a full matched GLM answer test is fixed now: r6 must
reach at least **44/60** hit-all, **48/74** cited turns, no more than two
question-level reach losses against r5, and complete source-only selection
within **1,800 seconds**. This threshold controls provider spend, not any
superiority claim. Even if it passes, answer quality, source-label integrity,
VPS cost, and a separately frozen untouched population remain required.

## Open Questions

- Which top-300-available cited turns are still lost to r6's rank-and-pack
  policy, and would retaining them preserve answer-bearing detail?
- Can a further source-only selector raise full cited-turn reach materially
  without adding another expensive full reranking pass?
- Does any development answer gain transfer to an independent 100K cohort?

## Completed source-only result — 2026-10-03 UTC

R6 sealed **60/60** source-only selections at private SHA-256
`228a8fe577266d705cc5708db58facd04cdbf0bcebecdc6d9f7b8c976f4f7e68`.
It scored 18,000 pairs in **1,146.754 seconds**, with 3,055,311 pair tokens
after the 256-token cap and **1,369/18,000** pair inputs at that cap. R5 had
12,232/18,000 at cap and took 1,283.31 seconds. These counts cannot separate
exact-cap inputs from actual truncation. The original BM25 control binding
was checked on every question; no evaluator field or GLM model was read by
the selector.

The evaluator-only citation audit SHA-256 is
`b732fcf2c7a6089b47e1fe5386b33d868f2eddd301a59ca1fb483230033f4891`.
R6 reached all cited turns in **42/60** questions, any in **44/60**, and
**46/74** cited turns. R5 was **40/60**, **42/60**, **44/74**; the unchanged
BM25 control was **31/60**, **31/60**, **33/74**. On cited-turn counts, r6
beat r5 in two questions, lost in zero, and tied in 58. Shorter windows
therefore delivered a modest exposed-development retrieval improvement and
reduced at-cap pair incidence, but no answer quality was measured.

R6 **failed its predeclared full-answer spend gate**: 42/60 is below 44/60
and 46/74 below 48/74, despite zero paired reach losses and elapsed time
below 1,800 seconds. The prepared 120-wire answer path remains dormant;
there were **zero r6 GLM calls**. The top-300 pool's 48/60 hit-all ceiling
leaves six theoretically available questions unserved by r6's rank-and-pack
policy. Further work must improve source-grounded ranking/packing and then
show matched answer-quality gains before an independent cohort or any
superiority claim.

## Post-hoc miss diagnosis — 2026-10-03 UTC

The earlier 48/60 pool ceiling is an aggregate bound, not a per-question
identity match to r6. A separate evaluator-only audit recomputed the **actual
900-character top-300 pool** for all 16 r6 zero-reach questions. Eight had at
least one cited turn in that pool; eight had none. Its private receipt is
`cf628870f613a62aa48b8bea9ea53ca74ae3314d65efb64bdee19ac7d28949a3`.
The earlier receipt `3324101b78281925f3b43b4d0d50637908592781ad976792bcfa6ef7ea87b0ba`
is the same count-only audit, superseded for this question by the version
that also records citation identities in the private archive.

Re-scoring just the eight pool-available misses reproduced every sealed r6
selection exactly (2,400 local cross-encoder pairs, zero GLM calls). The
best cited fragment's rerank positions were **7, 7, 10, 13, 30, 38, 79,
and 298**, while the 5K projection selected **6–8 fragments** per question.
The private rank receipt is
`a7285fefbc7fb80fce419d3fd5c58bea2d6af45b23f35968fa0771d2efb9f364`.
Two near-boundary misses may be packing-sensitive; the other six need a
better source-only ranking or pool mechanism. Citation labels are used only
for post-hoc diagnosis, never to construct a live selector. These results
remain exposed-development evidence, not answer-quality evidence or an
independent superiority claim.
