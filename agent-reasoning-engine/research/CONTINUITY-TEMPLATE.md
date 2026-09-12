# Successor plan and hypothesis continuity template

Status: reusable planning aid; unfilled, not run-ready. Authority effect none.
The [continuity contract](CONTINUITY.md) owns the requirements. Use this as a
companion to existing typed research records; it introduces no new ontology.
Replace every placeholder with evidence or an explicit unresolved binding.

## Purpose and contribution

- `objective_refs`: exact path and version/digest for the enduring
  [ARE objective](tool-state-audit-v1/OBJECTIVE.md),
  [initial GLM goal](../../implementation/agent-reasoning-engine/GLM-FINISH-PLAN.md),
  and [current milestone](tool-state-audit-v1/PLAN.md).
- `objective_contribution`: name the remaining gap and explain how this round
  tests a reusable mechanism for useful state, recovery or task completion.
  Explain its relevance to GLM small-window qualification and ContextBench.
- Preserve cumulative model input plus output as the cost metric. Record
  correctness/completion separately; cheaper abandonment is not improvement.

## Method and ancestry

- `method_refs`: exact research-learning ontology version and selected definition
  IDs; link question-bound work tasks separately from the scientific DAG.
- `predecessor_refs`: exact reviewed decision, observations, results and parent
  question/hypothesis. For a first round, explicitly state why it has no parent.
- `retained_counterevidence`: failed and inconclusive findings, alternative
  explanations, and what changed because of them.
- `question_and_hypotheses`: bounded question; competing mechanisms including
  null; prediction, falsifier, scope and uncertainty for each candidate.

Required chain:
`objective → gap → question → competing hypotheses → selection → experiment/tasks
→ results → observations → reviewed decision → successor`.

## Experiment and decision

- `experiment_and_task_refs`: selection rationale, exact protocol, task IDs,
  dependencies, completion criteria and verifiers. List unresolved bindings.
- `measurement_mapping`: what each metric establishes and cannot establish;
  distinguish native ContextBench scores from post-delivery retention measures.
  Account for all model tokens, including state preparation and correction.
- `acceptance_and_scope`: exact frozen acceptance version, control/treatment,
  context windows, token limits, task exposure, repetitions, stopping rules and
  reserved confirmation. SWE-bench stays outside the active plan.
- `successor_rule`: decide revise/confirm/clear from evidence. Preserve frozen
  history; create new versions after learning. Neither one successful example
  nor a completed round closes the chapter. Do not lower thresholds after failure.

## Continuity review

Record reviewer, reviewed artifact digests, evidence and a separate verdict for:

1. Enduring objective preserved and contribution explained.
2. Initial GLM/small-window objective preserved.
3. Current ContextBench milestone and exclusions preserved.
4. Method, predecessor decision and counterevidence connected to the proposal.
5. Falsifiers, metric limitations and task criteria make the claim testable.
6. All run-critical bindings resolved before freeze or dispatch.

An unchecked box or missing explanation leaves the draft incomplete. A hash
match establishes identity, not relevance. Review at proposal finalization,
experiment freeze and round closeout; retain the remaining goal gap in handoffs.
This template is a review aid used with the installed evolution-runtime
continuity validator. Policy v4 rejects missing or paraphrased objective and
method values before freeze or dispatch; human review still establishes relevance.

## Open Questions

List this round's unresolved questions, responsible task/owner and whether each
blocks freeze, execution or only a later claim. General continuity questions
remain owned by [CONTINUITY.md](CONTINUITY.md#open-questions).
