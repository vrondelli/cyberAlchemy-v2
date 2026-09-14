# Complete the denominator with typed local outcomes

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round20-continuity.json` under policy v4.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness and completed outcomes within cumulative model input plus output tokens.

Initial GLM objective: finish GLM-5.3-flash qualification, beginning with small
context windows and useful reasoning-state recovery under pressure.

Current milestone: clear the full fixed ContextBench contract through frozen
evidence-led rounds. The immediate development gate is a complete 24-pair 8K
denominator. ContextBench remains uncleared.

## Research method

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Round 19 proved that a fully accounted zero-byte tokenizer timeout can remain a
failed branch while later independent cells continue. It completed 17/56 cells
and four pairs with mean state-minus-control span F1 +0.1874, file F1 +0.0333,
and model-token delta -20,644.5. It then stopped on an HTTP-200 response with
known usage whose `finish_reason` was `tool_calls` but whose tool-call container
was invalid. The earlier accepted local failure was not durably recorded because
the ledger was written only after normal sequence completion.

Gap: local failure semantics are encoded as two tokenizer strings instead of a
closed outcome taxonomy, and accepted failures are not durable before the next
dispatch.

Question: can an explicit, fully accounted local outcome taxonomy plus immediate
durable receipts reach the full exposed denominator without weakening shared
integrity stops?

- H31-R20 (selected): enumerate fully accounted tokenizer-transport and
  model-output-protocol outcomes as local; persist each before continuing.
- H30-R20: retry a zero-byte tokenizer deadline once with identical bytes.
- H25-R20: valid complete shared-prefix evidence may support useful ARE state.
- H0-R20: complete valid evidence may show no criterion-complete state benefit.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R20-C | Close and preserve Round 19 | Round 19 stop | 17 outcomes, 39 unstarted identities and exact runtime are immutable. |
| R20-H | Bind continuity and hypotheses | R20-C | Policy v4 validates the objective hierarchy, method, counterevidence and alternatives. |
| R20-I | Implement typed outcome taxonomy | R20-H | Enumerated fully accounted local outcomes continue; all others stop. |
| R20-P | Persist local receipts | R20-I | Every accepted local failure is atomically recorded before another dispatch. |
| R20-O | Failure-scope oracle | R20-P | Exact Round 19 failure replays locally; unknown usage and shared defects stop. |
| R20-T | Full verification | R20-O | ContextBench, coding runtime, continuity and transport suites pass. |
| R20-D | Freeze matched replication | R20-T | Tasks, state, repetitions, order, limits, scorer and criteria match Round 19. |
| R20-R | Run once | R20-D | Every new identity runs once and every outcome remains in the denominator. |
| R20-S | Score | R20-R | All outcomes, missingness, native scores and physical model tokens are reported. |
| R20-L | Review and select successor | R20-S | H31 and H25 are reviewed separately and a policy-v4 successor is selected. |

## Fixed decision rule

A branch failure permits continuation only when its completion digest, result
digest, cell identity and prefix ancestry remain valid; selection/export are
absent; every dispatched model receipt has known input and output usage; and the
terminal evidence matches one enumerated local family:

- zero-byte tokenizer `request-failed` or `deadline-exceeded`;
- HTTP-200 model output with known usage that fails `message-invalid`,
  `reasoning-invalid`, `incomplete-output`, `finish-reason-unsupported`,
  `tool-calls-invalid`, or `final-text-invalid` validation.

Unknown usage, budget-reservation violations, unrecognized errors, prefix,
ancestry, freeze, source, export, and scoring failures remain global stops. The
failed branch is never rerun, replaced, or converted into a successful score.

The 8K context limit, 7K recycle boundary, 2,048 output cap, 96K cumulative model
input-plus-output cap, two incomplete-output corrections, task cohort, state,
branch order, tokenizer retry policy, native scorer and semantic thresholds are
unchanged.

## Open questions

- Will the closed taxonomy allow all 24 exposed pairs to be accounted for?
- Does the positive state effect persist across all eight tasks and languages?
- After a complete development denominator, does the result justify an untouched
  reserved-confirmation run under the full 1,136-identity acceptance contract?
- Which additional local outcome, if any, can be admitted only from new retained
  evidence rather than anticipated strings?
