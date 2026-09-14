# Recover terminal validity within the fixed token budget

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round21-continuity.json` under policy v4.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness and completed outcomes within cumulative model input plus output tokens.

Initial GLM objective: finish GLM-5.3-flash qualification, beginning with small
context windows and useful reasoning-state recovery under pressure.

Current milestone: clear the full fixed ContextBench contract through frozen
evidence-led rounds. The immediate development gate remains the accounted
24-pair 8K denominator. ContextBench remains uncleared.

## Research method

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Round 20 accounted all 56 cells with zero unknown model usage. Across the full
24-pair denominator, state minus control was +0.0528348799 span F1, +0.1069444444
file F1, and -107,102 cumulative branch model tokens. It missed the validity gate
19 to 20. All three invalid terminal outcomes had exhausted exactly one
correction. Four state recycle generations also lacked a presentation, and one
prefix ended before treatment exposure; these remain explicit counterevidence.

Gap: one exhaustive terminal correction is insufficient for observed GLM output,
while failed and corrective tokens already remain inside the fixed 96K cap.

Question: can one additional exhaustive terminal correction close the state
valid-completion gap without changing the state treatment or token cap?

- H32-R21 (selected): permit at most two terminal corrections and retain every
  failed/corrective model token and complete validator diagnostic.
- H33-R21: symmetrically score pre-treatment terminal prefixes as zero-effect.
- H25-R21: the unchanged evidence-only state retains a causal quality benefit.
- H0-R21: deterministic state has no criterion-complete causal benefit.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R21-C | Close and preserve Round 20 | Round 20 completion | Exact runtime and all outcomes are immutable. |
| R21-H | Bind continuity and hypotheses | R21-C | Policy v4 validates objectives, method, alternatives, and counterevidence. |
| R21-I | Implement bounded second correction | R21-H | Two corrections can recover; a third invalid response stops. |
| R21-O | Terminal recovery oracle | R21-I | Diagnostics remain exhaustive; provenance recovery and budgets remain valid. |
| R21-T | Full verification | R21-O | ContextBench, coding runtime, continuity, and transport suites pass. |
| R21-D | Freeze matched replication | R21-T | Only maximum terminal corrections changes from one to two. |
| R21-P | Tokenizer-only preflight | R21-D | Eight initial envelopes pass with zero model calls. |
| R21-F | Freeze execution | R21-P | Exact sources, matrix, preflight, and continuity are bound. |
| R21-R | Run once | R21-F | Every identity is accounted once; failures remain in the denominator. |
| R21-S | Score | R21-R | Native quality, validity, exposure, missingness, and physical tokens are reported. |
| R21-L | Review and select successor | R21-S | H32 and H25 are reviewed separately under fixed criteria. |

## Fixed decision rule

The second correction is common to prefix, control, and state episodes. It uses
the existing exhaustive terminal schema/provenance diagnostic. Read-only evidence
recovery remains available where provenance repair requires it. Repository effects
remain forbidden. A third invalid terminal response stops the cell. Every attempt
counts against the unchanged call and 96K cumulative model-token caps.

Task identities, shared-prefix snapshots, branch order, three repetitions, 8K
context limit, 7K recycle boundary, 2,048 output cap, state content/cadence,
tokenizer policy, scorer, and semantic thresholds remain unchanged. Round 20
identities are historical and are not resumed or rerun.

## Open questions

- Does the second correction recover validity at least as often in state as control?
- Does the scheduled span gain remain at least +0.05 with file non-degradation?
- Why did four task-6 recycled generations lack a state presentation?
- How should a pre-treatment terminal prefix contribute to a full causal denominator?
- When can the development result justify untouched reserved confirmation?
