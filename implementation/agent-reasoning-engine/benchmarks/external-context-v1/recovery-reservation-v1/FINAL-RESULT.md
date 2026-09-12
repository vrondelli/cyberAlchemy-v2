# GLM recovery reservation: completed comparison

**The strict checkpoint policy did not improve repairs. Do not adopt this variant.**
Baseline and reserved arms each produced **1/4 repeat-verified repairs**. Across
four paired comparisons there was one reserved win, one baseline win and two ties.
Both passing patches repaired task 16417 and independently passed **1/1 repair
and 6,198/6,198 regression labels twice**, in fresh evaluators.

**The target demonstration was not achieved: task 16542 remains unresolved.**
All eight scheduled episodes are terminal; no outcome was retried, replaced or
excluded. This closes the fixed experiment, not the broader GLM qualification goal.

## Episode results

| Episode | Outcome | Model calls | Checkpoint-exposed calls |
| --- | --- | --- | --- |
| 16417-baseline-r1 | unable_to_repair | 24 | none |
| 16417-reserved-r1 | full pass twice | 11 | none |
| 16542-baseline-r1 | unable_to_repair | 24 | none |
| 16542-reserved-r1 | output budget exhausted | 22 | 11, 15, 16, 17, 18, 19, 20, 21, 22 |
| 16542-reserved-r2 | unable_to_repair | 15 | 11, 15 |
| 16542-baseline-r2 | unable_to_repair | 23 | none |
| 16417-reserved-r2 | output budget exhausted | 16 | 11, 12, 15, 16 |
| 16417-baseline-r2 | full pass twice | 10 | none |

## What the experiment revealed

Three reserved episodes reached a construction checkpoint. None produced an
accepted candidate. The reserved arm's successful patch was staged at call 9,
before either checkpoint, so that success does not demonstrate the mechanism.
Exposure-conditioned results are descriptive, not a randomized causal comparison.

Two episodes received `old_text must match exactly once` with advice to reread
the original source, while their checkpoint withheld source-reading tools. The
policy implemented its specified restriction, but that restriction conflicted
with the recovery action requested by the tool. Reserving calls was insufficient
when those calls could not perform the needed recovery.

In 16542-reserved-r1, six staging calls omitted the required edit `path`, then a
seventh failed exact-text matching; the next output exhausted its limit. In
16417-reserved-r2, a hypothesis-array error was corrected, but the first staging
attempt failed exact-text matching and the next output exhausted its limit.
16542-reserved-r2 exited with the reason `placeholder`: structurally accepted,
but insufficient diagnostic evidence. These are observed agent/harness failures,
not transport outages or proof of an intrinsic model limit.

The predeclared repair/cost retention screen failed on repair gain. The frozen
analyzer reports an inconclusive hypothesis result; the separate mechanism review
records counterevidence and **revise-hypothesis**. This does not establish that
all recovery budgeting is ineffective or that memory loss caused the failures.

## Context, cost and integrity

The [completion audit](completion-audit.json) verified 191 frozen sources, 223
bound result artifacts, all 171 captured phase/tool sets, terminal receipts,
patch attribution, repeated full scores and cleanup. All 26 observed recycling
events passed archive-integrity and mechanical-continuation checks. Peak admitted
bound: **11,984 < 12,000**. Mechanical continuity does not prove perfect semantic
recall; provider-internal compaction remains unobservable.

The cohort used 145 model calls and 171 tokenizer calls. Recorded model list-price
estimate: USD 0.1493917 against a USD 0.80 reserve. This is not an invoice and does
not infer tokenizer/checker billing. The frozen pricing source and date are in
[matrix.json](matrix.json). Reserved used fewer total tokens and model-run elapsed
time, but it did not improve repair success.

## Decision and next research boundary

Preserve the baseline. No core engine feature was activated. Any next experiment
should test whether error-specific recovery actions remain available after a
checkpoint, with schema repair distinguished from code repair. A full-schema
validator can explain a broken request; the workflow must also let the agent
carry out the requested correction. Avoid task-specific field patches or another
live loop without a new discriminating hypothesis and fixed comparison.

[Failure analysis](FAILURE-ANALYSIS.md), [mechanism observations](mechanism-observations.json),
[normalized results](final-summary.json), [typed research review](reviewed-research-result.json)
and [DAG](dag.json) retain the evidence. The legacy `early`/`delayed` pair keys in
[raw closeout](closeout.json) mean reserved/baseline here; final-summary.json uses
the actual policy names. The raw frozen analyzer output is preserved.

## Open Questions

- Would allowing the exact recovery action improve candidate acceptance and final repairs?
- Why did explicit schema feedback fail to correct repeated missing edit paths?
- How should an inability report be checked for useful evidence without fabricating certainty?
- Does task 16542 require better task understanding, evidence retention, or a different budget?
- Would any supported mechanism transfer to fresh tasks, other models and non-coding work?
