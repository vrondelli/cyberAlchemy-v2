# G03 BEAM 500K IE cross-encoder r5 — top-300 development test

Status: **private exposed-development protocol fixed before r5 selection**.
This candidate was chosen after the evaluator-only pool-depth diagnosis of the
same 60 questions. It cannot yield an unbiased development estimate or an
independent superiority claim.

## Exact change

The [r5 source-only selector](../research/g03-beam-r1/plan-beam-500k-dev-ie-cross-r5.py)
changes only the BM25 candidate pool from the top 100 to the top **300**
fragments per question. It keeps the pinned quantized MiniLM cross-encoder,
256-token pair cap, batch size eight, same 30 disjoint-seed 500K development
conversations and 60 information-extraction questions, same fragmenter,
same greedy 5,000-UTF-16-character JSON projection, and exact unchanged BM25
control. No evaluator answer, rubric, citation, or reference enters the
selector. It must seal all 60 source-only selections before an evaluator-only
citation audit. No GLM requests are included in this selection test.

The top-300 choice follows the *exposed* citation-pool upper-bound audit:
top-100 contained all cited turns for 40/60 development questions, top-300
for 48/60, and top-500 for 49/60. Those numbers are not achieved retrieval
or answer accuracy. R5 can still fail if the cross-encoder ranks answer-bearing
fragments poorly or the 5K packing drops them. The r4 full source-only run
scored 6,000 pairs in 600.753 seconds on WSL; r5 plans up to 18,000 pairs
and must report observed CPU time, token count, and cap hits. The prior r4
model and output receipts remain untouched. A one-conversation throughput
preflight precedes the full run.
The `truncated_pairs` counter reports pairs *at* the 256-token cap; it does
not distinguish exact-cap inputs from pairs actually truncated.

## Completed source-only result — 2026-10-03 UTC

The one-conversation preflight scored 600 pairs in **45.016 seconds** and
sealed two selections, SHA-256
`bd04f6b80c147b9e9e3fee32ebd84605fc7757c9e459d9e7ba63a0cc042d1642`.
The full source-only run sealed **60/60** selections at SHA-256
`92f37609c7a2a4c47b8f0868b59037d9a40642a671752081bf497de4a72ef3bd`:
18,000 scored pairs, 3,656,155 post-cap pair tokens, and **1,283.31
seconds** WSL elapsed time. It made zero GLM requests and read no evaluator
fields. The unchanged BM25 control binding was checked per question before
selection.

The evaluator-only citation audit SHA-256 is
`36be9a2ed373dad33441323660babf3a1a010699491f2accbdf8575c59929558`.
R5 reached all cited turns in **40/60** questions, any in **42/60**, and
**44/74** cited turns, versus r4's **36/60**, **37/60**, **39/74**, and
unchanged BM25's **31/60**, **31/60**, **33/74**. On per-question cited-turn
counts r5 beat r4 in six, lost in one, and tied in 53. This is an
exposed-development retrieval improvement, not answer accuracy.

R5 **failed the predeclared next-spend gate**: 40/60 is below 42/60 and
44/74 is below 45/74, although 1,283.31 seconds is below the 1,800-second
time ceiling. No r5 GLM answer calls were dispatched. The prepared 120-wire
builder and runners remain dormant. The top-300 pool contained all cited
turns for 48/60 questions, leaving eight theoretically reachable questions
lost to reranking and 5K packing. One r4-reached cited turn was lost by r5.
The next source-only work should target fragment truncation and evidence
packing without inferring quality from citation identity alone.

A no-model, evaluator-only window-cap diagnosis then compared exact BM25
top-100/top-300 pool potential at 900, 1,200, 1,600, and 2,500 UTF-16
characters per fragment. Its private receipt SHA-256 is
`03213c7bc3189f9e574009c823a8d115887ddca9ea20927b92d63d55a3ec6b68`.
All four caps had the same **48/60** top-300 cited-turn hit-all ceiling
(60/74 cited turns); the 900-character cap produced about 3,573 fragments
per question versus 1,712 at 2,500. Thus shorter fragments do **not**
improve top-300 source-turn availability on this set. They may still help
because r5's cross-encoder inputs were at the 256-token cap in 12,232/18,000
pairs and shorter units could improve complete-window scoring and 5K packing.
That is a changed selector hypothesis requiring a separate source-only run;
the cap diagnosis is not an achieved retrieval improvement.

After sealing, compare r5 cited-turn hit-all, hit-any, and total reach with
r4 and unchanged BM25 on the same 60 questions. Report paired wins/losses,
not just aggregate totals. Improvement in citation reach alone will not
promote r5 to the reserved population: matched answer quality, source/label
integrity, VPS reproduction, and all-in cost remain separate gates.

The next-spend gate for a full **60-pair** exposed-development GLM answer
test is fixed before the r5 citation audit: r5 must reach at least **42/60**
hit-all questions and **45/74** cited turns, and finish the source-only
selection in at most **1,800 seconds**. This gate only controls whether the
larger answer test is worth its provider cost; it is not a pass threshold for
superiority. If it fails, investigate the source-only ranking/packing misses
and do not dispatch the 120 prepared answer wires merely because they exist.

## Open Questions

- Does tripling candidate depth close a meaningful portion of the r4's
  12-question top-300 theoretical hit-all gap?
- Which remaining misses are packing/ranking failures rather than pool misses?
- Can any answer-quality gain justify the added reranker CPU cost on the VPS?
