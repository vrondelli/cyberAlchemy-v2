# Bound repeated recovery from fully accounted incomplete output

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round17-continuity.json` under policy v4.

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

Round 16 supported the repaired shared-prefix boundary offline and in four live
branches. One control and two state branches completed. The second control used
the one allowed concise-action correction and its next response again ended at
the 2,048-token output cap. All 59,632 model tokens were accounted. The frozen
sequence stopped, leaving the semantic study incomplete.

Gap: one fully accounted correction does not cover a repeated length response,
so a recoverable model behavior can discard an otherwise valid 59,632-token
trajectory before task completion.

Question: does a small, predeclared sequence of concise-action corrections turn
repeated fully accounted length responses into completed trajectories without
relaxing the context limit or cumulative model-token cap?

- H27-R17 (selected): permit at most two corrections, each only after HTTP 200,
  valid usage and `finish_reason: length`; persist every receipt and strengthen
  the second instruction to demand one minimal tool call or terminal submission.
- H28-R17: isolate a failed branch and continue independent frozen cells, while
  retaining the failed repetition as missing rather than rerunning it.
- H25-R17: after the instrument completes, shared-prefix evidence-only state may
  produce a useful causal ContextBench improvement.
- H0-R17: valid repeated shared-prefix evidence may show no reliable state benefit.

Every hypothesis must contain the exact policy-v4 enduring objective, initial
objective, current milestone and research method. Paraphrases fail validation.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R17-C | Close and preserve Round 16 | Round 16 stop | Exact runtime, all five results and the length receipts remain immutable. |
| R17-H | Bind continuity and hypotheses | R17-C | Policy v4 validates canonical objective/method values for every hypothesis. |
| R17-I | Implement bounded correction loop | R17-H | Exactly two fully accounted corrections are possible; all other failures remain poisoned. |
| R17-O | Failure-path oracle | R17-I | Two length responses followed by success complete once with three receipts; a third length response stops. |
| R17-T | Full verification | R17-O | ContextBench, coding runtime and continuity suites pass. |
| R17-D | Freeze matched design | R17-T | Same exposed tasks, shared prefixes, arms, repetitions, order, 8K/7K limits, 2,048 output cap and 96K total cap. |
| R17-R | Run once | R17-D | Every cell runs once; no Round 16 cell resumes or reruns. |
| R17-S | Score | R17-R | Only complete ancestry/exposure/accounting pairs enter causal estimates; failures remain reported. |
| R17-L | Review and select successor | R17-S | H27 is reviewed separately from H25, then the next question is selected. |

## Fixed decision rule

The only proposed episode-policy change is increasing the maximum fully
accounted incomplete-output corrections from one to two and handling them in a
bounded loop. Both arms receive the same policy. Each failed and corrective
model input plus output token counts toward the unchanged 96,000-token trajectory
cap. No provider retry, output-cap increase, context-limit increase, task change,
threshold change, replacement, or favorable rerun is allowed.

H27 passes its instrument test only if the exact synthetic two-length-then-success
path completes, the three-length path stops after exactly two corrections, every
receipt and token remains accounted, restart never replays an uncertain request,
and all regression suites pass. Live support additionally requires at least one
branch to survive a second length response. H25 keeps the unchanged paired native
quality, validity, exposure, integrity and token criteria from Round 16.

## Open questions

- Does the stronger second correction reduce the chance of a third length response?
- Does the extra bounded request improve completed outcomes per cumulative token?
- After instrument completion, is the H25 state effect stable across tasks and repetitions?
- If a branch still fails, should H28 failure isolation be selected next?
