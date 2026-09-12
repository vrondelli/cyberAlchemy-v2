# ARE research continuity contract

Status: user-directed planning requirement, 2026-09-10. Authority effect none.
Applies to successor plans, hypotheses, experiment protocols and research handoffs.
The versioned [continuity policy](continuity-policy-v4.json) and evolution-runtime
validator enforce its structural and exact-reference requirements. Human review
still owns semantic relevance.

## Preserve all three levels of purpose

1. **Enduring objective:** improve ARE and agents through reusable mechanisms for
   reasoning, useful continuity, recovery and task completion within cumulative
   model input-plus-output token budgets. Correctness and completion remain
   outcomes; token reduction alone is not success. Source:
   [saved objective](tool-state-audit-v1/OBJECTIVE.md) and [lighthouse](../LIGHTHOUSE.md).
2. **Initial practical work:** tune and finish GLM support, beginning with small
   context windows, and establish whether ARE preserves useful reasoning state
   as context fills. Verify local admission/recycling and evidence recovery;
   archive integrity does not prove useful recall or absence of unobservable
   provider-internal compaction. Source: [GLM finish tracker](../../implementation/agent-reasoning-engine/GLM-FINISH-PLAN.md)
   and the historical scope/evidence cited by the lighthouse.
3. **Current milestone:** clear the declared ContextBench acceptance contract
   through repeated evidence-led hypothesis/experiment rounds. Native ContextBench
   diagnostics and custom post-delivery retention tests are distinct. SWE-bench
   is outside the active plan. Clearing this milestone does not by itself finish
   GLM qualification or prove general reasoning improvement. Source:
   [current plan](tool-state-audit-v1/PLAN.md).

A later user-directed objective change may revise these levels explicitly. An
assistant must not silently replace one with another or reinterpret historical
experiments under new success criteria.

## Required method

Use the [ARE research-learning ontology](../../implementation/agent-reasoning-engine/packages/evolution-runtime/ontology/research-learning-v1.json):
D01 hypothesis, D02 observation, D03 experiment, D04 decision, D05 retention,
D07 versioned DAG and D08 question-bound work plan. Preserve:

`objective → goal gap → question → competing hypotheses → selection → experiment
and work tasks → results → observations → reviewed learning decision → successor`.

Source: [method audit](research-method-audit-v1/AUDIT.md). Reuse existing record
constructors and verifiers; do not equate a task DAG with a verified research DAG.
Only exact selected method dependencies apply; this does not restore mandatory
ontology-runtime enforcement or confer registration/admission.

## Required continuity block in every successor

A plan or handoff must include these fields, inline or through a version-bound
companion record. Typed hypotheses may reference the companion in provenance
rather than adding unsupported fields to the existing closed schema.

| Field | Required content |
| --- | --- |
| objective_refs | Exact paths and versions/digests for enduring objective, initial GLM goal and current milestone. |
| objective_contribution | Concrete explanation of how this work reduces a named remaining goal gap; no generic “improve ARE” placeholder. |
| method_refs | Selected ontology definition IDs and exact source version. |
| predecessor_refs | Reviewed decision, source observations/results and parent hypothesis/question where applicable; explicitly mark a first round rather than invent ancestry. |
| question_and_hypotheses | Bounded question, alternatives/null, mechanism, prediction, falsifier, scope and uncertainty. |
| experiment_and_task_refs | Exact protocol and associated work tasks/criteria/verifier, or explicitly unresolved pre-freeze bindings. |
| measurement_mapping | What each native/custom metric establishes, total-token accounting and what it cannot establish about retention, completion or transfer. |
| acceptance_and_scope | Fixed acceptance version, current exclusions, exposure requirements, stopping rules and reserved confirmation policy. |
| retained_counterevidence | Negative/inconclusive findings, failed candidates and why any proposed change addresses them. |
| successor_rule | Continue/revise/confirm/clear conditions and next unresolved question; no automatic other-benchmark transition. |
| continuity_review | Reviewer, reviewed artifact digests, criterion-by-criterion verdict, unresolved bindings and evidence references. |

Do not copy large source documents into every prompt. Store exact references and
a compact relevant explanation; model-visible preparation/presentation tokens
remain part of the measurement when used in an experiment.

## Checkpoints and failure behavior

- **Before finalizing each new plan or hypothesis:** resolve objective/method refs,
  trace the contribution to the initial goal, retain predecessor counterevidence,
  and check scope. Bind the current policy digest and make every competing typed
  hypothesis cite that continuity binding. Missing requirements return all
  diagnostics to construction in one validation result.
- **Before freezing or dispatching:** resolve all experiment-critical placeholders,
  verify exact source/criterion bindings, exposure and instrument validity, and
  record the continuity review. Run `verifyResearchContinuity` in `freeze` phase;
  an incomplete draft cannot become a ready run.
- **At round closeout and successor creation:** attach actual observations and
  reviewed decision, update remaining gaps, and recheck all three objective levels.
  A completed round is not automatically a completed chapter or product.

Reference/hash checks establish identity, not semantic relevance. The reviewer
must explain the linkage and challenge mismatches. The mechanical validator
enforces structural fields, canonical objective/method values, source identity
and freeze readiness; it cannot replace this scientific review.
Existing user authorization persists; these checks require evidence preparation,
not repeated permission requests for already authorized work.

## Open Questions

Which exact ContextBench metrics/thresholds define this chapter's acceptance?
Which adapter binds current GLM research records to D08 criteria verification?
Those bindings remain tasks C1/G of the current plan; this contract does not
pretend they are already complete. Revisit the objective hierarchy only through
an explicit user-directed change, preserving the previous version.
