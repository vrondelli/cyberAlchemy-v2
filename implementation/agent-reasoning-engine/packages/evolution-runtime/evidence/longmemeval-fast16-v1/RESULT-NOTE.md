# G03 LongMemEval 16-question prospective comparison

Status: completed 2026-09-26. This is a fixed-cohort result, not the full
LongMemEval benchmark or proof across ContextBench and ARE×DSH.

## Result

The cohort was the first sixteen eligible source-only questions in the frozen
qualification queue after excluding the prior four G03 questions and the
queue's exposure registry. It covers five question types and one abstention
case. Every task had a fresh counterbalanced control/5K treatment pair; a 10K
treatment comparator ran on the same source-only cohort before references were
opened. GLM-5.3-Flash used a strict 8K request window and at most two generation
workers. Native LongMemEval rubric judging was separate and arm-blinded.

| Arm | Strict correct | Valid judgments | Generation tokens | Judge tokens | All-in tokens | Summed arm + judge time |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sequential retained-note control | 2/16 | 14/16 | 2,225,766 | 3,800 | 2,229,566 | 4,114,386 ms |
| ARE whole-turn projection, 5K characters | 11/16 | 16/16 | 25,535 | 4,252 | 29,787 | 99,354 ms |
| ARE whole-turn projection, 10K characters | 11/16 | 15/16 | 46,573 | 4,394 | 50,967 | 99,052 ms |

The 5K treatment reduced all-in model tokens by **98.664%** and summed
arm-plus-judge elapsed time by **97.585%** against control. These elapsed
figures sum per-task arm and judge durations; they are **not campaign wall
times** and exclude shared source/planning preflight. Excluding that
control-heavy preflight is conservative for the time comparison. The paired
generation used 610 model calls and 2,251,301 known tokens. The 10K comparator
used 16 calls and 46,573 tokens. The scorer used 48 calls; all dispatched
model calls, failures (zero), tokenizer measurements and usage were retained.

The three invalid rubric outputs were exactly `No.` on two control answers and
`Yes.` on one 10K answer. They remain invalid under the frozen exact `yes`/`no`
parser; no response was silently normalized or retried. Even granting both
invalid controls as correct, control reaches at most 4/16 versus the 5K arm's
11/16. Under that control-favoring assignment, the paired table has eight 5K
wins and one loss; the two-sided exact McNemar p-value is `0.0390625`.
This is a sensitivity bound, not a replacement native score. The 5K arm used
41.556% fewer all-in tokens than 10K; their strict correctness counts match,
but 10K's invalid `Yes.` prevents an exact quality-equivalence claim.

## Recovery and evidence

The first paired process completed six tasks, then failed before any model call
on task seven because one whole source turn was too large for the conservative
8K control-ingestion preflight. The failed attempt and its 14 tokenizer
measurements remain preserved. A successor kept all six completed pairs whole,
split that one control turn losslessly at its code-point midpoint, and executed
only the remaining ten assignments. No completed pair was rerun or replaced.
The composite completed 16/16 with no unknown usage. This source-shape repair
is part of the exact result, not hidden from the comparison.

The [source package manifest](SOURCE-MANIFEST.json),
[failed predecessor](PREDECESSOR-RESULT.json),
[recovered paired generation](GENERATION-RESULT.json),
[10K comparator](TEN-K-RESULT.json),
[reference projection manifest](REFERENCE-MANIFEST.json), and
[native score](SCORE-RESULT.json) are retained alongside the
[complete receipts archive](receipts-v1.tar.gz). The archive SHA-256 is
`d4b60e8db5e07c2165525f7818b1da990734ff5a3ff8a1d756b34de3f2b1c29c`.
It contains all source-only cohort rows, gateway events, per-task plans and
outcomes, and generation/scoring results. Reference answer values remain only
in the evaluator-restricted VPS directory
`/opt/are/evolution-runtime/evidence/longmemeval-fast16-v1/reference-v1`;
they are not in the archive or generation package.

Receipt reconciliation verified: predecessor failure had zero model calls on
task seven; the successor bound its predecessor's SHA-256; reference projection
bound the successor result; scoring bound both generation results. The
generation result's 610 call usages sum exactly to its aggregate. The gateway
recorded 229 + 381 paired-generation completions, 16 comparator completions,
and 48 judge completions, with zero failed model or tokenizer calls. The two
generation process spans were 878,665 and 1,428,229 ms; the 10K comparator
took 42,258 ms and scoring 113,910 ms. These spans are operational costs, not
an arm-specific latency comparison.

## Decision and next work

Retain 5K as the leading G03 candidate: it has the cleanest 16/16-valid
rubric set, a large accuracy advantage over the control even under a
control-favoring invalid-judgment bound, and much lower cost than either
control or 10K. The result supports a bounded LongMemEval improvement claim,
not full-S generalization or a blanket claim for all ARE workflows. Continue
the same high-level accuracy/token/efficiency objective by running the G01
ContextBench and G02 large-window branches with equally explicit matched
metrics. A larger LongMemEval replication would strengthen generalization;
do not spend another full control campaign on these already exposed sixteen.

## Open Questions

Does the 5K advantage persist beyond the frozen sixteen-question cohort and
across the full question-type distribution? Will G01 and G02 show accuracy
gains without quality regressions? Can a future judge protocol reduce
punctuation-only invalid outputs without changing the frozen native result?
