# G03 BEAM 500K IE r8 — lexical reserve plus semantic evidence

Status: **private exposed-development protocol fixed before r8 selection**.
R7 sealed 60 source-only selections but reached all cited turns in 42/60
questions; its actual 600-character top-300 pool contained all cited turns
for 48/60. An evaluator-only r7 pool audit, private SHA-256
`3b4e8debd2f8af0074bd0cdd830e51f7ed99bd577620c7949e9eb33c4cd647cf`,
found six questions where all citations were pool-available but the final
5K selection was incomplete. This motivates a changed selection policy,
not a new independent population.

## Fixed candidate

Use only the pinned BEAM 500K source-only 30-conversation/60-IE-question
population, r7's sealed 600-character source fragmenter and treatment
identities, unchanged 2,500-character BM25 control, and the pinned quantized
MiniLM cross-encoder. For each question, recompute the 600-character BM25
ranking over the source-only history. Reserve its top **three fragments from
distinct source turns** in the 5,000-UTF-16-character JSON evidence budget.
Re-score **only** r7's already selected treatment fragments with MiniLM,
then greedily fill the remaining budget by descending cross-encoder score
with r7 fragments not already reserved. Preserve chronological order only
in the final serialized evidence. No evaluator answer, rubric, citation ID,
or reserved 100K field may enter this selector. The BM25 control must be
recomputed and hash-match the prior seal for every question.

This is a hybrid lexical-reserve *selection* test, not another 18,000-pair
cross-encoder retrieval run. Before evaluator access, seal all 60 selected
projections and report selected-turn diversity, reserve overlap, local pair
count, elapsed time and zero GLM calls. Then run a separately bound
evaluator-only citation audit against r7 and unchanged control.

The predeclared gate for a full 120-wire paired GLM answer test is at least
**45/60** hit-all, **49/74** cited turns, no more than **two** question-level
cited-turn losses against r7, and source-only selection within **300 seconds**.
If it fails, make **zero r8 GLM answer calls**. Passing this gate would
authorize only a separately pinned matched development-answer protocol and
8K tokenizer preflight, not a superiority claim. Independent population,
answer-quality, compatible scoring, all-in cost and claim review remain
required.

## Open Questions

- Does preserving a small exact-lexical channel improve full cited-turn reach
  without discarding stronger semantic evidence?
- If so, does the reach gain transfer to paired answer quality rather than
  merely changing citation identity?
- Can any successful mechanism generalize beyond this evaluator-exposed IE
  development slice to a reserved cohort and wider BEAM abilities?

## Completed source-only result — 2026-10-03 UTC

R8 sealed **60/60** source-only selections at private SHA-256
`b6f9c498974ef7a428ce8312247e36264b1cd850f59ac75e81f1957954deda85`.
It rescored **655** r7-selected fragment pairs locally in **105.838
seconds**, with zero pair inputs at the 256-token cap, zero evaluator fields
read, and **zero GLM calls**. The three-per-question lexical reserve
overlapped r7's selections in **102/180** reserved fragment positions; the
new projections therefore changed source content, but every unchanged
control projection was independently hash-checked.

The evaluator-only citation audit at private SHA-256
`81d07453bae2bb313931455e41a1755cfa7275e97a578d817b284dce9315b4f2`
found **42/60** hit-all, **45/60** hit-any and **47/74** cited turns,
exactly r7's aggregates. On per-question cited-turn count, r8 had **zero
wins, zero losses and 60 ties** against r7. The simple three-turn BM25
reserve changed evidence but did not recover a single additional cited turn.

R8 **failed** the fixed 45/60 and 49/74 answer-spend thresholds. The
120-wire matched GLM answer path is not dispatched; **zero r8 GLM answer
calls** were made. This rejects this exact lexical-reserve policy as a
development retrieval improvement. It does not establish that all lexical
fusion methods fail, nor measure answer quality, native BEAM score, a
reserved holdout, or superiority.

The next development frontier should change the *answer-bearing evidence*
mechanism and predeclare a matched answer-quality readout. More citation-only
window shrinking or a simple fixed BM25 reserve is not justified by r6–r8.
Any successor must preserve a distinct version, source-only selection seal,
unchanged comparator, bounded VPS GLM wires, and an independent scorer;
it cannot retroactively remove r7/r8's failed spend gates.
