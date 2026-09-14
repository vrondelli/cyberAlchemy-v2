# Unify bounded stateless tokenizer recovery

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round18-continuity.json` under policy v4.

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

Round 17 supported H27 offline and live: a state branch survived two consecutive
fully accounted length responses and completed. Task 1 completed three pairs with
mean state-minus-control span F1 +0.2028, but only two repetitions were positive.
Task 2 state ended with invalid source provenance. Its control then stopped on a
stateless request-tokenizer `request-failed` event with zero response bytes and
zero unknown model usage. The separate index/state tokenizer already had a
same-body two-attempt policy; the request tokenizer did not.

Gap: bounded recovery is attached to one tokenizer caller rather than the shared
stateless tokenizer capability, so a zero-model-token transport failure can waste
an otherwise useful model trajectory and censor every later frozen cell.

Question: does one common, identical-body, at-most-two-attempt policy across both
stateless tokenizer paths eliminate single transient tokenizer censoring without
changing model prompts, model tokens, task semantics, or context admission?

- H29-R18 (selected): apply the proven retry rule to request-token measurement as
  well as index/state measurement, recording both physical attempts under one
  logical measurement and caching only a valid successful response.
- H28-R18: isolate a fully accounted local branch failure and continue later
  independent cells without rerunning or replacing the failed identity.
- H25-R18: after valid instrumentation, shared-prefix evidence-only state may
  produce a useful causal ContextBench improvement.
- H0-R18: valid repeated evidence may show no reliable state benefit.

Every hypothesis contains the exact policy-v4 enduring objective, initial
objective, milestone and research method. Paraphrases fail validation.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R18-C | Close and preserve Round 17 | Round 17 stop | Ten outcomes, 46 unstarted identities and exact runtime remain immutable. |
| R18-H | Bind continuity and hypotheses | R18-C | Policy v4 validates all objective levels, method, counterevidence and alternatives. |
| R18-I | Unify tokenizer recovery | R18-H | Both tokenizer paths use identical-body, at-most-two transport attempts with typed receipts. |
| R18-O | Cross-path failure oracle | R18-I | First-attempt zero-response request failure then success returns one logical count; excluded failures never retry. |
| R18-T | Full verification | R18-O | ContextBench, coding runtime and continuity suites pass. |
| R18-D | Freeze matched replication | R18-T | Same tasks, shared prefixes, arms, repetitions, order, limits, state, scorer and criteria as Round 17. |
| R18-R | Run once | R18-D | Every identity runs once; no Round 17 directory resumes. |
| R18-S | Score | R18-R | Valid pairs enter causal estimates; invalid, failed and missing outcomes remain in denominators. |
| R18-L | Review and select successor | R18-S | Review H29 separately from H25 and select the next unresolved mechanism. |

## Fixed decision rule

The only proposed runtime change is a common maximum of two physical transport
attempts for each stateless tokenizer measurement. A retry is allowed only after
`request-failed` with zero response bytes, uses identical serialized request
bytes, and cannot create a model request. Each physical attempt is recorded; the
logical tokenizer call budget is unchanged. HTTP errors, timeouts, interrupted
responses, credential failures, invalid payloads and nonzero response failures do
not retry. Both experiment arms receive the same policy.

The 8K context limit, 7K recycle boundary, 2,048 model output cap, 96K cumulative
model input plus output cap, two incomplete-output corrections, task cohort,
state projection, repetition order, native scorer and semantic thresholds remain
unchanged. No outcome is rerun, replaced, or selected favorably.

H29 passes offline only if both tokenizer paths satisfy the same exact retry
oracle, cache only success, preserve attempt receipts across failure, and dispatch
zero model calls. Live support requires continuation beyond a single zero-response
tokenizer failure if one occurs. H25 retains the fixed paired quality, validity,
exposure, integrity and model-token criteria.

## Open questions

- Does shared tokenizer recovery remove the last common single-transient censor?
- Is failure isolation still needed after both stateless paths have bounded retry?
- Does H25 remain positive across languages rather than only task 1’s mean?
- Why does task 2 state select source with invalid provenance, and is that state-specific?
