# Research program

This guide explains how ARE research is designed, executed, interpreted, and
advanced. It also inventories the benchmark families and records the roadmap as
of 2026-09-17. Machine records and the linked benchmark owners remain the source
for exact parameters and results.

## Research objective

The [project lighthouse](../../../agent-reasoning-engine/LIGHTHOUSE.md) defines
the enduring objective. Improve ARE and its agents through reusable mechanisms
that preserve useful reasoning, recovery, correctness, and completed outcomes.
Keep the total model input and output within the token budget.

GLM-5.3-Flash and coding tasks are the current experimental setting. A useful
GLM result is one milestone toward a model-neutral reasoning engine. A mechanism
becomes a general ARE capability only after transfer is tested across context
budgets, task families, domains, and models.

The current inquiry treats total model input plus output tokens as cost. Disk,
latency, price, and local processing remain operational measurements and safety
constraints, but they do not substitute for the token objective.

## Research lifecycle

ARE uses an ontology-backed evidence cycle:

~~~mermaid
flowchart LR
    O[Objective] --> G[Observed gap]
    G --> Q[Research question]
    Q --> H[Competing hypotheses]
    H --> S[Selected hypothesis]
    S --> E[Frozen experiment]
    E --> R[Results]
    R --> B[Observations]
    B --> D[Reviewed decision]
    D -->|support| C[Confirmation]
    D -->|counterevidence| N[Successor hypothesis]
    D -->|instrument failure| I[Instrument repair]
    C --> T[Transfer test]
    N --> H
    I --> E
~~~

The scientific record DAG and the work-task DAG are separate. The first connects
questions, hypotheses, experiments, observations, and learning decisions. The
second orders implementation, validation, freeze, execution, scoring, and review.
A completed work task does not establish a scientific claim.

The canonical records are implemented by
[evolution-runtime](../packages/evolution-runtime/README.md):

- **ResearchHypothesis** states a falsifiable mechanism, scope, predictions,
  counterevidence, and metrics.
- **ResearchExperiment** binds control, treatment, tasks, repetitions, budgets,
  stopping rules, and success criteria.
- **HypothesisObservation** connects a result to the tested hypothesis and states
  support, counterevidence, or an inconclusive observation.
- **LearningDecision** records retain, revise, specialize, reject, or continue.
- **Research DAG** preserves ancestry so failed branches cannot disappear when a
  successor is proposed.

These records are candidate research evidence. They do not activate a runtime,
change repository authority, or approve a product.

## Required process

Every new round must complete these stages in order:

1. **Bind continuity.** Cite the lighthouse objective, initial GLM objective,
   current ContextBench milestone, research method, and reviewed predecessor.
2. **State the gap.** Describe the observed failure or missing evidence and link
   the exact result that exposes it.
3. **Generate competing hypotheses.** Include a null or no-benefit explanation,
   an instrument explanation, and plausible mechanism alternatives.
4. **Select one discriminating test.** State why it distinguishes the hypotheses
   and where the result will remain ambiguous.
5. **Preregister the experiment.** Before observing outcomes, freeze the task
   identities, source hashes, control, treatment, model, profile, context window,
   prompts, tool schemas, and scorer. Also freeze the metrics, pass rules, call
   and token caps, stop conditions, and retry policy.
6. **Pass offline gates.** Test schema validation, source and receipt binding,
   token accounting, hidden-data isolation, scorer reconstruction, cleanup, and
   negative controls.
7. **Execute once.** Preserve every scheduled outcome, including timeouts,
   malformed output, infrastructure failures, unknown usage, and unstarted cells.
   Never replace a failed task with a more favorable one.
8. **Score independently.** Keep instrument validity, context selection, task
   correctness, continuity, recovery, latency, and tokens as separate measures.
9. **Review the evidence.** Record limitations and counterevidence before choosing
   support, falsification, specialization, instrument repair, or a successor.
10. **Confirm and transfer.** Use fresh identities for confirmation. Test another
    window, domain, or model before expanding the claim.

An unchanged rerun after a valid failure is not a new hypothesis. A scorer or
runner repair may rerun an exposed cohort only as instrument recovery, with zero
new semantic claims until its contract is valid.

## Evidence and freeze rules

A live research result should bind:

- model, endpoint, provider profile, reasoning setting, and output cap.
- repository, commit, task identity, source snapshot, and dataset revision.
- exact request bodies or content hashes at the transport boundary.
- tool observations and which bytes were actually delivered to the model.
- context window, recycling thresholds, output reserve, and token margin.
- control and treatment bytes, order, repetition, and causal-difference checks.
- all physical model and tokenizer attempts, including failures.
- scorer version, raw predictions, native scores, independent reconstruction,
  and terminal status.
- cleanup receipts for temporary repositories, containers, and caches.

Development evidence may guide changes. Confirmation evidence must use reserved
or fresh tasks. Once a confirmation result influences a change, that cohort is
exposed and becomes development evidence.

## Benchmark inventory

| Benchmark | Question answered | Main measures | Current status |
| --- | --- | --- | --- |
| [Real Reasoning v1](../benchmarks/real-reasoning-v1/README.md) | Do deterministic ARE contracts preserve routing, context, lifecycle, replay, reuse, and improvement behavior? | Exact checks, protected gates, determinism, local latency | Product verification component. Core and integration fixtures are runnable |
| [GLM fitting v1](../benchmarks/glm-fitting-v1/README.md) | Can the provider adapter, tokenizer accounting, profile corpus, and bounded single-turn QA path run reproducibly? | Contract validity, response class, token use, latency, transport status | Starter corpus and bounded live pilot evidence. Not broad qualification |
| [GLM episodes v1](../benchmarks/glm-episodes-v1/README.md) | Can GLM inspect sources, preserve constraints, submit valid patches, recover after recycling, and pass public/oracle checks? | Initial/final repair, schema validity, continuity, recovery, calls, tokens | Small-window known-fixture gate passed: 28/36 initial, 36/36 final, 9/9 recycled continuity |
| [ContextBench v1](../benchmarks/contextbench-v1/README.md) | Does ARE state improve final source-context selection under context pressure within the token budget? | Span/File coverage, precision and F1. Valid selection. Continuity. Logical tokens | 8K H72 milestone passed. Full benchmark not cleared. 10K remains open |
| [External context v1](../benchmarks/external-context-v1/README.md) | Can an external repository task run through a bounded repair and validation workflow? | Repair checks, staged-patch attribution, public/private validation, pressure behavior | Candidate first-run and diagnostic workflow. Not the active ContextBench acceptance path |
| Agent Retrieval Bench lane in [Real Reasoning v1](../benchmarks/real-reasoning-v1/README.md#external-retrieval-lane) | Can ARE rank useful files and abstain within a hard retrieval budget? | MRR, Recall/Precision/F0.5@20, BCY@8K, selective abstention | Adapter and deterministic producer exist. Real 427-row release quality remains unmeasured |

The benchmark layers answer different questions. Deterministic product tests
verify contracts. GLM episodes measure model behavior and repair. ContextBench
measures selected source context. External repair measures completed code work.
No single score establishes all of them.

## ContextBench measures

| Measure | Meaning |
| --- | --- |
| Span coverage | Fraction of required source spans covered by selected context |
| Span precision | Fraction of selected source spans that belong to required context |
| Span-F1 | Harmonic mean of span coverage and span precision |
| File coverage | Fraction of required files represented in the selection |
| File precision | Fraction of selected files that are required |
| Valid selection | Terminal response is schema-valid and selects only confirmed delivered evidence |
| Continuity | Required facts and evidence remain usable after recycling or recovery |
| Completion | The episode reached its declared terminal boundary with accountable evidence |
| Token difference | Treatment logical input-plus-output tokens minus matched control tokens |

A percentage point is an absolute percentage difference. Moving from 10% to 15%
is a gain of 5 percentage points. A positive F1 change can still fail if coverage,
precision, completion, provenance, exposure, or token gates fail.

ContextBench scores selected context. It does not prove that the resulting patch
is correct. Repair correctness needs an independent task oracle.

## Current evidence

The bounded [8K release](../../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/README.md)
supports H72, a request-local terminal evidence-handle mechanism:

| 8K confirmation metric | Control | Treatment | Difference |
| --- | ---: | ---: | ---: |
| Macro Span-F1 | 2.70% | 15.85% | +13.15 percentage points |
| File coverage | 25.00% | 41.67% | +16.67 percentage points |
| Valid selections | 6/8 | 8/8 | +2 |
| Logical model tokens | 586,770 | 583,202 | -3,568 |

All eight confirmation pairs were complete and causally valid. This clears the
8K milestone only. Absolute treatment Span-F1 remained 15.85%. The fixed full contract still
requires all 1,136 identities, both context windows, two confirmation
repetitions, and statistical checks.

At 10K, unchanged transfer did not establish the required benefit. The latest
reviewed Round 59 hypothesis, **LW-H3a**, activated terminal substitution only
when a prefix exposed at least three handles. Seven pairs were causally valid.
The treatment saved 2,219 logical tokens, but macro Span-F1 changed by -0.21
percentage points and all named coverage/precision measures declined. The
hypothesis was falsified. Four inactive pairs behaved identically to control,
which validates conditional non-activation but does not rescue the treatment.

The selected successor is **LW-H3b**: handle count is an insufficient proxy. The
next question is which prefix-observable displacement or evidence-structure
signal separates useful substitution from harmful substitution. The exact
review is in the
[Round 59 decision](../../../agent-reasoning-engine/research/contextbench-v1/larger-window-v1/round59-reviewed-decision.json).

Separately, the GLM repair program completed five frozen campaigns with 145/180
initial and 172/180 final passes. The latest qualified small-window campaign
reached 28/36 initial and 36/36 final. This shows bounded correction and recovery
on known fixtures. It does not estimate unseen-task initial capability.

## Current roadmap

~~~mermaid
flowchart TD
    A[8K H72 milestone passed] --> B[10K unchanged transfer tested]
    B --> C[Round 59 H3a falsified]
    C --> D[Offline prefix feature analysis]
    D --> E[Register competing LW-H3b signal hypotheses]
    E --> F[Freeze fresh 10K development test]
    F -->|pass| G[Fresh 10K confirmation]
    F -->|valid fail| E
    F -->|instrument fail| R[Bounded instrument repair]
    G -->|pass| H[Unchanged 12K canary]
    G -->|fail| E
    H --> I[Fresh 12K confirmation]
    I --> J[Full 1,136-identity acceptance design]
    J --> K[Two-repetition full acceptance]
    K --> L[GLM product integration and review]
    L --> M[Non-code and cross-model transfer]
~~~

The ordered active work is:

1. Analyze the frozen Round 59 prefixes and selections without fitting a policy
   directly to outcome labels.
2. Register competing, falsifiable displacement and evidence-structure signals,
   including a no-benefit alternative and an instrument alternative.
3. Freeze a fresh 10K development cohort and decision rule before model calls.
4. Run and review the 10K comparison once. Continue with a successor hypothesis
   after a valid failure. Repair only the instrument after an instrument failure.
5. Require fresh 10K confirmation before any 12K model calls.
6. Repeat unchanged transfer at 12K, then design the staged full-denominator run.
7. Complete the remaining [GLM finish milestones](../GLM-FINISH-PLAN.md). These
   are M0 provider contract, M2 context and transport limits, M3 corpus, M4
   profile selection, M5 ARE workflow, M6 acceptance, and M7 product review.
8. After GLM, test retained mechanisms on non-code tasks and another model before
   describing them as general ARE behavior.

SWE-bench is not restored as the objective of the ContextBench loop. External
repair benchmarks remain available as a later completed-outcome test after
context selection is understood. Twelve-kilobyte work remains blocked on a
reviewed 10K confirmation.

## Result interpretation

- A benchmark run can complete successfully as an experiment while its hypothesis
  fails.
- Instrument failure blocks semantic interpretation. It is different from model
  or treatment failure.
- Token savings count only when every protected quality and validity gate passes.
- Final success after correction and initial success answer different questions.
- A conditional metric among valid outputs cannot replace end-to-end accounting.
- Repeated trials on one fixture are clustered evidence, not independent tasks.
- Provider-internal compaction is unobserved unless provider evidence exposes it.
  ARE can prove its own recycling, delivery, selection, and recovery behavior.
- A development pass selects confirmation. It does not activate a product policy.
- Failed and inconclusive runs remain part of the evidence DAG.

## Storage and reproducibility

Retain small immutable artifacts: manifests, source hashes, requests or request
hashes, public responses, ledgers, scores, decisions, and verification receipts.
Delete reconstructible worktrees, repository caches, containers, and downloaded
corpora after scoring when their manifests and upstream identities are preserved.
A disk guard must run before repository preparation and live dispatch.

Never store credentials, provider reasoning content, hidden oracle material in
model-visible inputs, or copied upstream corpora in release evidence. Use a new
result directory for each run. Do not overwrite or reuse a failed row.

Useful entry points include:

~~~sh
node bin/are.mjs benchmark --mode core
node benchmarks/real-reasoning-v1/bin/benchmark.mjs --mode integration
node benchmarks/glm-fitting-v1/cli.mjs validate
node --test benchmarks/glm-episodes-v1/episodes.test.mjs
node ../../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/verify.mjs
~~~

Run commands from implementation/agent-reasoning-engine unless a linked
benchmark says otherwise. Live provider execution requires a separately frozen
experiment, credentials supplied outside evidence, and the exact call budget.

## Ownership and claim boundary

The lighthouse owns the enduring objective. The ContextBench acceptance contract
owns full clearance. The larger-window plan and reviewed decision own the active
10K frontier. GLM-FINISH-PLAN.md owns model completion. Benchmark READMEs own
their run contracts, and immutable result records own observed values.

Research may propose an implementation. Repository governance admits it, product
verification tests it, and the product owner decides activation or release.

## Open Questions

- Which prefix-observable signal can identify harmful evidence substitution before
  a result is scored?
- How should the full 1,136-task run be staged without weakening the fixed
  denominator or consuming unbounded model tokens?
- Which non-code benchmark supplies independently judged outcomes and meaningful
  context pressure?
- Which second model should test whether a retained mechanism is model-neutral?
- What effect size and replication level should justify moving a mechanism from a
  model profile into the common ARE engine?
