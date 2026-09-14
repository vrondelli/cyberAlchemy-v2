# Balance cumulative evidence by source path

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round22-continuity.json` under policy v4.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness and completed outcomes within cumulative model input plus output tokens.

Initial GLM objective: finish GLM-5.3-flash qualification, beginning with small
context windows and useful reasoning-state recovery under pressure.

Current milestone: clear the full fixed ContextBench contract through frozen,
evidence-led rounds. The immediate development gate remains the accounted
24-pair 8K denominator. Reserved confirmation and the full 1,136-identity suite
remain untouched until the development gate passes.

## Research method and gap

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Rounds 20 and 21 account for 48 scheduled pairs. Their combined state-minus-
control gain is +0.0429065152 span F1 and +0.0256944444 file F1, while state
used 257,450 fewer cumulative branch model tokens. The quality estimate remains
below +0.05 and valid state completions were 38 versus 41 control. Effects vary
by task. Receipt-bound auditing proved that every dispatched state prompt
received its state projection.

The strongest new mechanism evidence is internal duplication: 373 of 602
model-facing evidence entries repeated a path already present in that same
projection. Observation frequency can therefore become an accidental relevance
weight even though the state makes no semantic relevance claim.

Question: does a cumulative state containing at most four newest paths and two
newest distinct receipt-bound handles per path preserve recovery while removing
duplicate-path anchoring?

- H35-R22 (selected): path-balanced cumulative evidence improves the fixed
  quality, validity, and model-token gates.
- H34-R22: terminal tool calls and terminal raw JSON are transport-equivalent
  when the identical schema and provenance validator accept both.
- H36-R22: delta-only evidence is better than a cumulative working set.
- H0-R22: deterministic evidence projection has no stable causal benefit.

H34 is a symmetric instrument prerequisite, not the treatment. The 30-second
local secret-resolution deadline is also symmetric and changes no model request,
prompt, task, scorer, or semantic threshold.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R22-C | Close and preserve Round 21 | Round 21 completion | Exact runtime and outcomes remain immutable evidence. |
| R22-H | Repair handoff and bind continuity | R22-C | All four hypotheses cite policy v4 and the Round 22 continuity binding. |
| R22-I | Implement path balance and common reliability controls | R22-H | Deterministic receipt-bound selection, dual-envelope validation, and bounded secret deadline pass adversarial tests. |
| R22-T | Full verification | R22-I | ContextBench, coding runtime, continuity, and transport suites pass. |
| R22-D | Freeze matched replication design | R22-T | Same cohort, pairing, order, budgets, and thresholds; state projection is the only arm difference. |
| R22-P | Tokenizer-only preflight | R22-D | Eight initial envelopes pass with zero model calls. |
| R22-F | Freeze execution | R22-P | Exact sources, sanitized credential-config digest, matrix, preflight, and continuity are bound. |
| R22-R | Run once | R22-F | Every identity is accounted once; failures remain in the denominator. |
| R22-S | Score | R22-R | Native quality, validity, exposure, path bounds, missingness, and physical tokens are reported. |
| R22-L | Review and select successor | R22-S | H35 and instrument effects are reviewed separately; pass triggers untouched confirmation, failure triggers a new hypothesis. |

## Fixed decision rule

Each state projection selects the four paths with the most recent confirmed
observations. Within those paths it retains the two newest distinct delivered
handles, then restores chronological order. Every handle must remain bound to a
successful model receipt. The projection labels the entries observed, never
relevant. Control receives no task state.

Both arms accept either one declared terminal submission tool call or a terminal
raw JSON object only when the same exhaustive schema and source-provenance
validator accepts it. Invalid terminal content receives at most two corrections.
All attempts count inside the unchanged 96,000 cumulative model-token cap.

Task identities, shared-prefix snapshots, branch order, three repetitions, 8K
context limit, 7K recycle boundary, 2,048 output cap, finalization reserve,
tokenizer policy, scorer, and acceptance thresholds remain unchanged. Every
Round 22 identity runs once; no within-round tuning or favorable rerun is allowed.

## Measurement mapping

- Native span and file F1 measure selected-context overlap, not repair correctness.
- Valid completion measures protocol completion, not semantic correctness.
- Receipt-bound exposure and path caps establish that the intended treatment
  reached the model; they do not prove that the model used it.
- Cumulative model input plus output tokens are the only optimized cost.
- A development pass permits untouched confirmation. It does not itself clear
  the full benchmark, larger GLM windows, other models, or other domains.

## Open questions

- Does path balance reach at least +0.05 scheduled span F1 without file or validity degradation?
- Does state retain its cumulative model-token non-increase?
- Which task characteristics explain any remaining negative effects?
- If development passes, does the untouched confirmation cohort reproduce every fixed criterion?
