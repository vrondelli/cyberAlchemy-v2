# G03 BEAM 500K IE cross-encoder r7 — 600-character source windows

Status: **private exposed-development protocol fixed before r7 selection**.
This is a separate candidate from r5 and r6, not a repair of their sealed
results or an independent superiority test.

## Objective and fixed mechanism

R6's 900-character top-300 BM25 pool contained cited evidence for eight
questions where r6 selected none. In two, a cited fragment reranked seventh
but fell outside its 5,000-UTF-16-character JSON projection. A further
evaluator-only pool census compared 450, 600, 750 and 900-character windows
on all 60 development IE questions. The 600-, 750- and 900-character
top-300 pools each had an oracle ceiling of **48/60** hit-all and **60/74**
cited turns; 450 fell to **44/60** and **56/74**. The private census SHA-256
is `5840082e57e54cf7487c462778a67e9cc1c7108791d2a5e38605abc48d4c582b`.
These evaluator labels inform the *development hypothesis and cap choice*
only. They must never enter the source-only selector or generation wires.

R7 changes exactly the treatment's lossless source-turn partition from 900
to **600 UTF-16 characters**. It retains r6's pinned quantized MiniLM
cross-encoder, top-300 BM25 fragment candidate pool, 256 pair-token cap,
batch size eight, greedy score-ranked 5K JSON projection, all 30 development
conversations and 60 IE questions. The BM25 control remains the original
2,500-character-fragment selection and must reproduce its sealed SHA-256 for
every question. R7 reads source-only histories and questions, no development
answer/rubric/citation fields, and no reserved 100K population.

Before full selection, run one conversation as a source-only preflight and
check two treatment selections, unchanged controls, finite cross-encoder
scores, 5K projections and elapsed time. Seal all 60 source-only selections
before an evaluator-only citation audit. The audit compares r7 with r6 and
unchanged BM25 on hit-all, hit-any, cited-turn totals and paired reach
wins/losses. No GLM generation follows automatically.

The one-conversation preflight passed two treatment selections and both
unchanged-control checks. It scored 600 pairs in **30.63 seconds**, with
**0/600** inputs at the 256-token cap. Private preflight SHA-256:
`75f6ffce1e3df21db29615a3f85a811c9b3ecb2f2a7edc130ee1d68da1db0329`.
This qualifies throughput and source-only construction, not answer quality.

The **predeclared gate for full 120-wire paired GLM answer spend** is at
least **45/60** hit-all, at least **49/74** cited turns, no more than **two**
question-level cited-turn losses against r6, and full source-only selection
within **1,800 seconds**. Gate failure means zero r7 answer calls. Gate
passage authorizes only a separately pinned matched development answer
protocol and tokenizer preflight; it is not a superiority claim. Even a
positive answer result would require independent population confirmation,
native/compatible scoring and all-in cost disclosure before a broader claim.

## Open Questions

- Does 600-character partitioning improve achieved citation reach enough to
  pass the answer-spend gate without losing important context within each
  evidence fragment?
- If it passes, does the reach change transfer to paired GLM answer quality
  on the whole 60-question IE development population?
- Can any mechanism generalize beyond the repeatedly inspected BEAM 500K IE
  development slice to an independent population and wider BEAM abilities?

## Completed source-only result — 2026-10-03 UTC

R7 sealed **60/60** source-only selections at private SHA-256
`bb1b8ec1695f7913d1dca4773ffd6c8e0c953206c54b1d4f98ceea2103dcaa47`.
It scored **18,000** local cross-encoder pairs in **826.418 seconds**, with
2,169,123 pair tokens after the 256-token cap and only **7/18,000** pair
inputs at that cap. Every BM25 control projection was recomputed and
hash-checked against its original sealed selection. The selector read no
evaluator field and made **zero GLM calls**.

The separately run evaluator-only citation audit is private SHA-256
`6160535be09b538ba0aa91693254f7d9ec4c300b6ea6d449274e3339457f4388`.
R7 reached all cited turns in **42/60** questions, any in **45/60**, and
**47/74** cited turns. R6 was **42/60**, **44/60**, **46/74**; unchanged
BM25 was **31/60**, **31/60**, **33/74**. R7 beat r6 on cited-turn count in
two questions, lost in one, and tied in 57. The 600-character partition
reduced at-cap pair incidence and elapsed CPU time, but did **not** improve
full cited-turn reach over r6.

R7 **failed the predeclared full-answer spend gate**: 42/60 is below 45/60
and 47/74 below 49/74, although its one reach loss and 826.418-second run
met the other two requirements. There were **zero r7 GLM answer calls**.
No answer quality, independent holdout, native BEAM score, or superiority
claim follows. Further shrinking this same window mechanism is not
supported by this result; a materially different source-grounded retrieval
or evidence-selection mechanism would need a new protocol and independent
confirmation.
