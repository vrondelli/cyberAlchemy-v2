# ARE project lighthouse

Status: user-directed guiding objective; planning guidance.
Authority effect: none. This document supplements the product thesis; it does
not redefine canonical terms or register an admitted execution state.

## Enduring objective

Improve ARE and the agents using it by discovering, testing, and applying
reusable mechanisms for reliable problem solving across domains, models, and
context budgets. Preserve continuity, expose uncertainty, and help agents learn
from actionable feedback while correction remains possible. Measure improvement
in correctness, useful reasoning continuity, recovery and completed user outcomes
within total model-token budgets. Input and output tokens are the cost metric;
local processing time, storage, latency and prices are not optimization metrics
for the current inquiry. Avoid unnecessary tokens without rewarding abandonment.

The [saved objective](research/tool-state-audit-v1/OBJECTIVE.md) records the user's
clarification and the distinction between deterministic state capture, state
presentation, workflow policy and final task outcomes.

This direction was requested by the user in the project conversation:
"i think this should be like a lighthouse for this project, we need to make this our objective always"

GLM and coding benchmarks are current experimental settings. Finishing the GLM
work remains a concrete milestone within this broader objective. A local repair
may be useful without establishing a general engine capability.

## Planning compass

Every new research or implementation plan should explicitly connect its proposed
work to this objective and answer:

1. What observed failure or user outcome motivates the work? Link its evidence.
2. What mechanism might explain it, and what competing explanations remain?
3. Which part belongs in the common engine, a domain evaluator, or model-specific
   configuration? Mark that classification as provisional where untested.
4. What controlled comparison and falsifier distinguish those explanations?
5. Where should the benefit transfer, where might it fail, and how will we test
   that boundary beyond the development tasks?
6. What correctness, continuity, recovery, total-token and incorrect-rejection measures decide
   whether to retain, revise, specialize, or stop the intervention?

Every successor plan and hypothesis must pass the
[research continuity contract](research/CONTINUITY.md): bind this enduring
objective, the initial GLM/small-window useful-state goal, the current ContextBench
milestone, the ontology method and the reviewed predecessor evidence. Carry a
concrete contribution and metric-to-claim mapping, not only document links.
Recheck at draft finalization, experiment freeze and each successor decision.
A benchmark pass must not silently replace the original purpose.

Use a research DAG that separates observations, competing hypotheses,
experiments, results, and scoped decisions. Preserve failed and inconclusive
results. Freeze comparisons before observing outcomes; keep subsequent tuning
separate from qualification evidence. Preregister budgets and stopping criteria.

Generalization is an empirical question. Test contrasting domains and models
before claiming transfer across them, including cases with ambiguous correctness
where extra checking may be unhelpful. A deterministic validation result, a
semantic judgment, and a human preference have different evidential limits.

The common engine may coordinate requirements, evidence, evaluator selection,
uncertainty, and recovery. Domain evaluators supply checks appropriate to their
subject. Earlier feedback, retained evidence, and reserved recovery budget are
candidate mechanisms to test separately, not established universal solutions.

## Current evidence and next research frontier

The [feedback-timing round plan](research/feedback-timing-v1/PLAN.md) turns this
direction into competing hypotheses and a 12-episode GLM coding comparison at
the 12K threshold. Finish and audit the small-window chapter first; non-coding
and cross-model experiments remain deferred follow-up work. The fixed comparison
is now complete: [final result](../implementation/agent-reasoning-engine/benchmarks/external-context-v1/feedback-timing-v1/FINAL-RESULT.md),
with six repairs verified twice among 12 attempts and equal 3/6 results per arm.
H1 remains inconclusive because no live candidate had invalid syntax.

The [completed GLM holdout study](../implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/RESULT.md)
and [syntax diagnostic](../implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/syntax-diagnostic/report.json)
support a narrow observation: a parse check detects one retained invalid
JavaScript candidate before a full test. They do not prove improved repair
success, benefits in other domains, or superiority of a context-window size.

The GLM small-window comparison is closed with repair scores, 35 verified
mechanical recycling events, costs and unresolved failures. Its traces identify
late or absent candidate construction, output-budget exhaustion, and a terminal
tool-protocol rejection for future investigation. Select the next hypothesis
from that evidence in a separate plan; no broader experiment starts automatically.
Generalization guides what we learn without replacing concrete milestones.

The subsequent [recovery-reservation comparison](../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/FINAL-RESULT.md)
is also complete: eight episodes, one repeat-verified repair per four attempts in
each arm, and no repair of task 16542. Strict checkpoints conflicted with source
rereads requested by staging-error feedback. This is evidence about a workflow
policy, not a direct test of deterministic state usefulness.

Current frontier: [ContextBench hypothesis and experiment loop](research/tool-state-audit-v1/PLAN.md),
task C1: define the ContextBench acceptance contract and bind research questions.
Tool/data audits and the [research-method audit](research/research-method-audit-v1/AUDIT.md)
are complete. Native ContextBench integration and scoring remain unfinished.

**Keep iterating hypotheses and separately frozen experiments until ContextBench
is cleared against its declared criteria.** The active plan has no SWE-bench
stage or automatic other-benchmark follow-on. Prior repair results stay preserved
as historical evidence. Controlled post-delivery retention experiments support
ContextBench diagnosis; custom metrics are distinct from native scores.

Carry objective → question → competing hypotheses → selection → verified protocol
and question-bound tasks → observations → reviewed learning decision → successor
round. Tool repairs and token accounting are bounded preparation. A negative or
inconclusive result closes its fixed round but leaves this chapter open. Revise
the explanation and intervention, preserve all outcomes, and create new record
versions rather than rerunning unchanged until lucky or lowering acceptance.

Define metric thresholds and scope before live development; verify the scorer,
use finite per-round token budgets, and reserve independent confirmation. Evidence
used to tune becomes development evidence. Clear ContextBench only after verified
confirmation meets the frozen acceptance contract; one passing example or archive
integrity is insufficient. Broader GLM qualification remains separately recorded.

Operational prerequisites, owners, and causal blockers for any live experiment
must be recorded in its own plan. No operational deployment is required to
record this direction. Implementation remains subject to the selected route
and D65 construction boundary; this guidance grants no runtime effects.

## Open Questions

- Which existing non-coding workflow offers meaningful, independently judged outcomes?
- Which failure mechanisms recur across domains, models, and context budgets?
- When does evaluator feedback help, distract, or incorrectly reject good work?
- What replication and effect-size thresholds justify a common-engine change?
- How should recovery budgets adapt without forcing premature decisions?
- What evidence would show that a useful intervention should remain specialized?
