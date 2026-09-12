# Event-derived reasoning-state projection

Status: selected candidate plan; implementation and live experiment are not
frozen. Authority effect none. Continuity is owned by
[round6-continuity.json](round6-continuity.json).

## Objective, initial objective, and milestone

The enduring objective is to improve reusable ARE reasoning, useful continuity,
recovery, correctness, and completed outcomes within cumulative model input plus
output tokens. The initial practical objective remains finishing GLM-5.3-flash
qualification, with small context windows first. The current milestone remains
the unchanged [ContextBench acceptance contract](acceptance.json). ContextBench
retrieval scores, semantic retention, and repair correctness remain distinct;
SWE-bench remains outside the active campaign.

Round five supports structured terminal submission as common candidate
instrumentation: 3/3 structured cells produced valid native-scoreable selections
versus 1/3 free-form, with zero false source credit, zero terminal repository
effects, and 18,778 fewer aggregate model tokens. This repairs measurement loss;
it does not clear the benchmark or establish useful state retention.

The remaining gap is useful reasoning state. In round four, GLM invoked exact
historical recovery 31 times, recovered 46,555 bytes, repeated seven reads, and
the index arm used 77,656 more aggregate model tokens. Its scoreable pairs gained
only 0.000819 macro span F1 and lost 0.01333 file F1. A catalog of source handles
therefore preserved access but did not preserve enough task process to improve
the measured outcome.

Question: after actual local recycling, does a compact deterministic projection
of task objective, evidence, repository changes, and test/search outcomes improve
native evidence selection within the same cumulative model-token cap?

## Competing hypotheses and selection

[Typed hypotheses](hypotheses-round6.json) retain three explanations:

- H11: a receipt and event-derived task-state projection helps GLM resume the
  reasoning process after recycling, beyond rediscovering source handles.
- H12: repeated source recovery is the main avoidable cost; a phase-bound,
  deduplicated handle index can preserve outcomes with fewer tokens.
- H0-R6: the remaining failures are semantic task reasoning failures; neither
  deterministic state projection nor recovery policy improves native outcomes.

Select H11 because H1 already exercised recovery substantially and failed the
fixed development target. H12 retains the observed repetition and token-cost
explanation. H0 prevents successful serialization or mechanical continuity from
being misread as useful semantic improvement.

## Research chain and work DAG

The required chain is: objective → useful-state gap → bounded question → H11,
H12, and H0 → reviewed H11 selection → frozen matched experiment → results →
typed observations → reviewed learning decision → successor.

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R6-C | Validate continuity | Round-five closeout | Exact policy digest; enduring, initial GLM and milestone bindings; competing hypotheses; counterevidence; criterion verdicts. |
| R6-A | Specify state facts | R6-C | Closed allowlist of receipt/event-derived facts, source pointers, ordering, byte/token bounds, and false-fact verifier. |
| R6-I | Implement projection | R6-A | Opt-in deterministic projector and post-recycle presentation; no model summarization, hidden state, source credit, or repository effect. |
| R6-E | Adversarial tests | R6-I | Tests for fabricated facts, stale generations, repeated recovery, no-recycle silence, bounded size, default behavior, and token accounting. |
| R6-D | Freeze experiment design | R6-E | Exposed eight-task 8K matched baseline/treatment design, structured terminal common, identical tools/tasks/provider/caps, fixed criteria and stopping rules. |
| R6-F | Freeze exact run | R6-D | Exact matrix, source closure, tokenizer preflight, D03/D07/D08 bindings, passed freeze-phase continuity validation. |
| R6-R | Run frozen cells | R6-F | Every scheduled outcome retained once; no replacement, threshold change, or within-round tuning. |
| R6-S | Score and verify | R6-R | Independent native scores, total model-token accounting, completion and projection-integrity checks for every scheduled cell. |
| R6-L | Review and select successor | R6-S | Typed observations, reviewed H11 decision, remaining acceptance gap, and method-bound successor. |

## Experiment constraints and decision rule

The proposed development comparison uses the eight exposed round-four tasks at
8K with a 7K recycle threshold and 96K cumulative model-token cap. Both arms use
the same structured terminal submission, truthful output deferral, repository
tools, source pins, provider settings, correction budget, and native scorer. The
control receives no event-derived state projection. The treatment receives the
bounded projection only after a verified local recycle. Exact identities and
order remain unresolved until R6-D and cannot enter freeze yet.

The development target remains at least +0.05 paired macro span F1, with file F1
non-degradation, no loss of valid completion, zero false projected facts, zero
unknown token usage, and unchanged per-cell token caps. Report all actual input
plus output tokens and retain missing outcomes. Passing selects a confirmation
candidate; it does not clear the full contract. Failure revises H11 using the
typed observations and chooses between H12, H0, or a new competing explanation.

Full clearance still requires all 1,136 identities, 8K/10K/12K, all declared
token tiers, paired repository-cluster inference, and two reserved confirmation
repetitions. No other benchmark follows automatically.

## Open Questions

- Which event facts can be projected without inferring unverified model intent?
- Should recovered bytes be represented only by stable handles until explicitly
  requested, or may a bounded exact excerpt enter the state projection?
- How should mutation and test outcomes be compacted when later events supersede
  earlier ones while retaining failure evidence?
- Which exact eight-task order gives a frozen matched comparison without reusing
  any reserved confirmation identity?
