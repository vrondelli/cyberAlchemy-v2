# Schema-bound terminal submission

Status: selected candidate plan; implementation and experiment are not frozen.
Authority effect none. Continuity: [round5-continuity.json](round5-continuity.json).

## Objective, gap, and question

The enduring objective remains better reusable ARE reasoning, continuity,
recovery, correctness, and completed outcomes within cumulative model input plus
output tokens. The initial practical objective remains GLM-5.3-flash
qualification, small windows first. The current milestone remains the unchanged
[ContextBench acceptance contract](acceptance.json); SWE-bench is excluded.

[Round four](round4-closeout.json) completed all 16 frozen 8K development cells
with 783,054 known model tokens, zero unknown usage, 17 delivered deferrals, zero
context-budget stops, and 13 native scores. Only five of eight pairs were
complete. Their macro span-F1 gain was 0.000819, below the fixed 0.05 target, and
file F1 decreased 0.01333. Two missing outcomes were malformed terminal JSON;
one selected invalid source provenance after its bounded correction.

Question: can a schema-bound, no-effect terminal submission improve valid
completion without changing source delivery, repository effects, tasks, context,
or cumulative model-token caps?

## Competing hypotheses and selection

[Typed hypotheses](hypotheses-round5.json) retain three explanations:

- H9: a `submit_context_selection` action with a closed argument schema removes
  avoidable terminal serialization failures. Its successful tool-call response
  is itself terminal; the runtime performs no tool effect and asks for no free
  acknowledgement.
- H10: the main constraint is one correction opportunity, so a second correction
  would help more than structured submission.
- H0-R5: failures are semantic or provenance failures; changing the wire shape
  will reproduce the same invalid choices.

Select H9 because two of three failures are specifically invalid JSON. H10 also
changes retry count and recovery allocation. H0 stays active because the Go
provenance failure may remain unchanged. H1 is not rerun unchanged; its
[reviewed decision](round4-selected-hypothesis-review.json) requires revision.
H7 remains a common candidate instrument under its narrow
[learning decision](round4-instrument-learning.json), not a general causal claim.

## Work DAG

| Task | Depends on | Completion evidence |
| --- | --- | --- |
| R5-P | Round-four reviewed decisions | Exact objective/method continuity, H9/H10/H0, selection, falsifiers, predecessor counterevidence. |
| R5-I | R5-P | Opt-in terminal action with closed schema; exact receipt binding; no call to repository executor; free-form/default behavior unchanged. |
| R5-E | R5-I | Offline tests for valid submission, malformed/free-form correction, provenance feedback, mixed/ordinary tools, finalization, token denial, and native export. |
| R5-D | R5-E | Six-cell matched development diagnostic: the three failed round-four task/arm identities, each under free-form control and structured treatment, equal 8K/96K envelopes and one correction. |
| R5-F | R5-D | Exact matrix, tokenizer allowance, preflight, source closure, D03/D07/D08 bindings, continuity review, and freeze. |
| R5-R | R5-F | Run every frozen cell once; retain all outcomes without replacements or within-round changes. |
| R5-L | R5-R | Reviewed H9 decision, token/outcome comparison, retained H10/H0, and successor contribution to H1/ContextBench. |

The research chain is: objective → terminal-completion gap → bounded question →
H9/H10/H0 → H9 selection → implementation and matched experiment → results →
typed observations → reviewed decision → successor. A task DAG does not replace
the research records.

## Experiment and claim boundaries

Use the exact three exposed failures: Go baseline, Python baseline, and TypeScript
index from round four. Each receives a fresh free-form control and structured
treatment at 8K context, 7K recycling, 96K cumulative model tokens, 2,048 output
cap, and the same repository tools, source pin, deferral policy, correction count,
provider profile, and scorer. Deterministically alternate order by task. This is
a development diagnostic, not confirmation.

Primary instrument criterion: structured treatment produces at least two valid
native-scoreable completions and at least one more than matched control. It must
produce zero repository effects from terminal submission, zero false source
credit, zero unknown model usage, and no larger per-cell token cap. Report actual
cumulative tokens for every cell. Native span/file metrics remain outcomes, not
proof of repair correctness or semantic retention. A valid tool envelope alone
does not count as improvement.

If H9 passes, retain structured terminal submission as common candidate
instrument and return to a newly frozen H1/state-representation experiment. If
it fails, use the matched diagnostics to distinguish H10 from H0 and create a new
versioned plan. Do not rerun unchanged, lower thresholds, replace failed cells,
or touch reserved confirmation. Full ContextBench still requires all 1,136 task
identities, 8K/10K/12K, all token tiers, and two reserved confirmation repetitions.

## Open Questions

- Does GLM reliably choose the terminal action when it is available alongside
  repository tools, or only during tools-restricted finalization?
- Can the existing whole-envelope provenance diagnostic guide a structured retry
  without allowing repository effects after finalization begins?
- Should a valid early terminal submission end exploration immediately? H9 says
  yes; its exact response already consumes model tokens and needs no acknowledgement.
- If H9 fixes JSON but not provenance, does H10 merit a separate experiment, or
  does the next question concern evidence-version choice rather than retry count?
