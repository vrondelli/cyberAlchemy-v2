# ARE ContextBench hypothesis and experiment loop

Revision: execution-v6, 2026-09-16.
Status: 8K milestone released as a candidate snapshot; 10K successor planned.
Owner: ARE product owner; executing agent owns construction and evidence.
Authority effect: none.

## Objective and current scope

The [saved objective](OBJECTIVE.md) remains: improve correctness, useful
reasoning continuity, recovery and completion for the same model within
cumulative input-plus-output token budgets. Tokens are the optimization cost.
Cheaper abandonment is not a benefit.

The GLM-5.3-flash 8K ContextBench context-selection milestone passed a fresh
development canary and an independent confirmation. The
[research report](../contextbench-v1/CONTEXTBENCH-RESEARCH-REPORT.md) explains
the history; the
[release candidate](../contextbench-v1/releases/glm-5.3-flash-8k-v1/README.md)
owns its exact claim and verification.

The full [acceptance contract](../contextbench-v1/acceptance.json) remains open.
It includes all 1,136 pinned tasks, 10K and 12K windows, two confirmation
repetitions, and fixed statistical checks. The historical Round 55
benchmark_cleared field means only that its bounded 8K milestone passed.

**Continue ContextBench before selecting another benchmark.** SWE-bench is not
in the active graph. Completed repair studies remain historical evidence.

## Current frontier

The active work is the
[larger-window plan](../contextbench-v1/larger-window-v1/PLAN.md). Its ordered
frontier is:

1. verify the runtime meaning of the 10K window and preregister its recycling
   threshold;
2. select fresh scoreable identities after excluding every prior matrix;
3. parameterize the unchanged H72 harness for 10K;
4. pass offline parity, mutation, scoring, accounting, regression, and storage
   gates;
5. freeze one finite development canary;
6. execute it once, score it, and make a reviewed learning decision;
7. on pass, freeze fresh 10K confirmation; on valid failure, select an
   observation-led successor; on instrument failure, repair only the instrument;
8. advance unchanged H72 to 12K only after 10K confirmation passes;
9. design the finite full-denominator evaluation only after both transfer
   stages are understood.

The candidate plan is complete but no larger-window live run is authorized or
frozen by this document.

## Research method

Use the [ARE research-learning ontology](../../../implementation/agent-reasoning-engine/packages/evolution-runtime/ontology/research-learning-v1.json)
definitions ARE-RL-D01–D05, D07, and D08:

objective → gap → question → competing hypotheses → selection →
experiment/tasks/criteria → results → observations → reviewed decision →
successor

Scientific ancestry and task dependencies remain separate DAGs. Freeze the
intervention, tasks, budget, criteria, and stopping rules before live outcomes.
Preserve every failed and inconclusive round. Do not rerun unchanged until
favorable or lower thresholds after failure.

Every successor follows the [continuity contract](../CONTINUITY.md), binds the
enduring objective, initial GLM objective, current ContextBench milestone,
predecessor decisions and counterevidence, and maps each metric to the claim it
can support.

## Fixed scope and claim boundaries

Native ContextBench context selection does not prove repair correctness.
Archive integrity does not prove useful recall. Custom post-delivery retention
tests are diagnostics and cannot be relabeled as native scores. A small
development or confirmation cohort cannot satisfy the full 1,136-task
denominator.

Model input and output tokens are the scientific cost. Storage, elapsed time,
latency, and price remain operational concerns. Temporary worktrees are deleted
after scoring; durable receipts, manifests, scores, and commit bindings are
retained.

D65 construction remains in force: candidate research and implementation do not
grant product admission, publication, deployment, or runtime effects.

## Decision rule

At each window, a complete frozen development pass advances to separately
frozen fresh confirmation. A valid semantic failure closes the selected
hypothesis for that cohort and returns to competing explanations. An instrument
failure permits only a bounded instrument repair with mutation/replay proof.
No 12K execution begins before the reviewed 10K confirmation decision.

Full ContextBench clearance is claimed only when every criterion in
../contextbench-v1/acceptance.json is satisfied. No automatic transition to
another benchmark follows.

## Open Questions

- Should 10K recycling preserve the 8K absolute safety margin or pressure ratio?
- How many fresh scoreable identities remain after global prior-use exclusion?
- What finite staged design can account for all 1,136 identities without
  weakening the frozen token and missingness rules?
- Does improved selected context improve completed task correctness?
- Which mechanism transfers to non-code work and another model family?
