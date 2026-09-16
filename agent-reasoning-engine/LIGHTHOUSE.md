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

The GLM-5.3-flash 8K ContextBench context-selection milestone is complete. The
H72 request-local terminal evidence-handle mechanism passed a fresh development
canary in Round 52 and an independent eight-pair confirmation in Round 55.
Confirmation improved macro Span-F1 by 13.15 percentage points, increased valid
selections from 6/8 to 8/8, and used 3,568 fewer logical model tokens. The
[release candidate](research/contextbench-v1/releases/glm-5.3-flash-8k-v1/README.md)
defines the exact bounded claim and reproducible evidence set.

This closes the 8K milestone, not the complete ContextBench acceptance contract.
The original contract also names all 1,136 pinned identities, 10K and 12K
windows, two confirmation repetitions, and fixed statistical checks. The raw
Round 55 benchmark_cleared field is therefore interpreted only within its
recorded 8K milestone scope.

The active frontier is the
[larger-window plan](research/contextbench-v1/larger-window-v1/PLAN.md). It first
tests unchanged H72 at 10K so window transfer is not confounded with a new
intervention. A frozen development pass advances to fresh confirmation; a valid
failure returns to competing hypotheses. Only a reviewed 10K confirmation can
advance the same mechanism to 12K. SWE-bench remains outside this research loop.

The research still follows objective → gap → question → competing hypotheses →
selection → experiment/tasks/criteria → results → observations → reviewed
decision → successor. Context-selection improvement remains distinct from
completed-task correctness, non-code transfer, and cross-model transfer.

## Open Questions

- Which existing non-coding workflow offers meaningful, independently judged outcomes?
- Which failure mechanisms recur across domains, models, and context budgets?
- When does evaluator feedback help, distract, or incorrectly reject good work?
- What replication and effect-size thresholds justify a common-engine change?
- How should recovery budgets adapt without forcing premature decisions?
- What evidence would show that a useful intervention should remain specialized?
