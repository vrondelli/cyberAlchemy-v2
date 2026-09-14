# Isolate fully accounted local branch failures

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round19-continuity.json` under policy v4.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness and completed outcomes within cumulative model input plus output tokens.

Initial GLM objective: finish GLM-5.3-flash qualification, beginning with small
context windows and useful reasoning-state recovery under pressure.

Current milestone: clear the fixed ContextBench contract through frozen
evidence-led rounds while keeping ContextBench diagnostics distinct from semantic
retention and repair correctness. ContextBench remains uncleared.

## Research method

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Round 18 completed 24/56 cells and nine paired repetitions before one task-4
control branch ended on a zero-byte request-tokenizer deadline. All model usage
is known. The first three tasks have mean state-minus-control span F1 +0.2562,
file F1 +0.2169 and model-token delta -13,296.4 per pair. H29 is supported by
offline retry oracles but was not exercised live; its excluded deadline class
did not falsify it.

Gap: one fully accounted terminal failure local to one branch censors every
later independent cell, discarding potential evidence and wasting the model
tokens already spent on the frozen cohort.

Question: can the dispatcher retain a fully accounted local branch failure as a
failed outcome and continue later independent cells without weakening shared
integrity stops, rerunning identities, or changing the denominator?

- H28-R19 (selected): classify only exact, fully accounted zero-byte terminal
  tokenizer failures as local branch outcomes and continue later cells.
- H30-R19: retry a zero-byte tokenizer deadline once with identical bytes.
- H25-R19: valid complete shared-prefix evidence may support useful ARE state.
- H0-R19: complete valid evidence may show no criterion-complete state benefit.

Every hypothesis carries the exact policy-v4 objective, milestone and method.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R19-C | Close and preserve Round 18 | Round 18 stop | 24 outcomes, 32 unstarted identities and exact runtime are immutable. |
| R19-H | Bind continuity and hypotheses | R19-C | Policy v4 validates objectives, method, counterevidence and alternatives. |
| R19-I | Classify local failures | R19-H | Only fully accounted terminal tokenizer failures permit continuation. |
| R19-O | Failure-scope oracle | R19-I | Local cases continue; unknown usage, model failures and integrity defects stop. |
| R19-T | Full verification | R19-O | ContextBench, coding runtime, continuity and transport suites pass. |
| R19-D | Freeze matched replication | R19-T | Tasks, state, repetitions, order, limits, scorer and criteria match Round 18. |
| R19-R | Run once | R19-D | Every new identity runs once; local failures remain in the denominator. |
| R19-S | Score | R19-R | All outcomes, missingness, native scores and model tokens are reported. |
| R19-L | Review and select successor | R19-S | H28 is reviewed separately from H25 and a policy-v4 successor is selected. |

## Fixed decision rule

A branch failure permits continuation only when completion and result digests,
cell identity and shared-prefix ancestry remain valid; the terminal receipt is a
zero-byte stateless tokenizer `request-failed` or `deadline-exceeded`; and every
dispatched model receipt has known input and output usage. The branch remains
failed. Unknown model usage, model-terminal errors, prefix failures, ancestry or
freeze drift, malformed artifacts, export failures and scoring failures stop the
whole sequence.

The 8K context limit, 7K recycle boundary, 2,048 output cap, 96K cumulative model
input-plus-output cap, two incomplete-output corrections, task cohort, state,
branch order, tokenizer retry policy, native scorer and semantic thresholds are
unchanged. No outcome is rerun, replaced or selected favorably.

H28 passes offline only if local failures continue and all shared failures stop.
Live support requires a local failure followed by a later completed independent
cell. H25 retains macro span-F1 gain at least +0.05, file-F1 and valid-completion
non-degradation, exact shared-prefix identity, treatment after exposure, zero
unknown model usage and full model-token accounting across all 24 pairs.

## Open questions

- Will isolation allow a complete 24-pair denominator despite provider transients?
- Does the positive three-task state effect persist across all eight languages?
- Is a deadline retry useful after local isolation removes cohort-wide censoring?
- Which failure classes can be proven local without weakening evidence integrity?
