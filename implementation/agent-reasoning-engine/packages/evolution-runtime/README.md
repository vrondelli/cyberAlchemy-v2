# ARE Evolution Runtime

Command examples require Node 26.8.1 on PATH and run from this package directory.

This package implements the Agent Reasoning Engine improvement loop as
immutable records stored through the existing append-only Reasoning State
ledger.

It turns measured results into improvement signals and targets, preserves
research and reproduction evidence, identifies content-addressed engine
variants, compares them with an exact baseline, and emits recommend-only
upgrade decisions by default.

Completed optimizations can be retained as `are.improvement-retention/v1`
records. A retention binds one candidate identity to exact implementation and
evidence digests plus its observed comparison. JSON implementation bindings may
select one JSON Pointer so unrelated fields do not invalidate the retained
candidate. Currentness is recomputed from every selected binding: only a current
`implemented-and-verified` record can suppress rediscovery of that exact
candidate. Missing or changed selected bytes make the record stale and return
the candidate to the experiment frontier.

Its research-learning ontology adds a feedback loop before technique creation:

```text
benchmark anomaly
  -> ResearchHypothesis
  -> HypothesisObservation
  -> ResearchExperiment
  -> LearningDecision
  -> existing TechniqueCandidate and variant comparison path
```

The ontology is machine-readable at `ontology/research-learning-v1.json`. Each
hypothesis is falsifiable and includes its experiment template. Observations
are append-only and preserve supporting, inconclusive, and counterevidence
postures. A deterministic learning decision asks for replication, a controlled
experiment, hypothesis revision, or technique materialization.

`projectBenchmarkFailuresToHypotheses` closes the deterministic feedback edge.
It accepts only an exact-digest-bound benchmark result, rejects inconsistent
PASS/FAIL evidence, and turns each failed check into an Improvement Signal and
a content-addressed Research Hypothesis. The hypothesis names a concrete code
pattern, exact replay scenarios, success criteria, and a falsifier. A passing
result produces no hypothesis, grouped scenario cases retain their exact failed
identities, and `NOT_EVALUATED` produces a visible no-hypothesis projection.
Projection never adopts or edits code.

The real-reasoning failure-learning canary exercises the entire retained chain:

```text
legacy stale-reuse FAIL
  -> projected hypothesis
  -> context-bound reuse technique
  -> immutable Engine Variant
  -> deterministic development replay + exact holdout
  -> KEEP or REJECT comparison
  -> experiment observation + Learning Decision
  -> sealed evolution epoch
```

The structural canary cannot observe upstream provider cache behavior. Cache
hits and savings remain a separate, exact projection-bound observation from the
Codex wrapper.

The first registered fixture, `ARE-RH-LEXICAL-001`, captures the Luna finding
that an exact-term scorer can reject a structurally adequate answer when the
literal requested token is absent. The detector recognizes only concept
markers declared in the fixture. Marker presence is a research signal, not an
automatic semantic correctness judgment.

The fixture also records each implementation attempt without rewriting the
hypothesis. The v2 and v3 declared-equivalence scorers are preserved as
separate candidate identities: both retained the v1 quality and safety results
but failed the registered latency ceiling. Their exact report references,
digests, measurements, and next actions remain in
`fixtures/luna-lexical-scoring-hypothesis.json` for the next reversible attempt.
The scorer loop now creates a sealed successor hypothesis after each failed
attempt, binds the next attempt to that successor, and stops creating successors
when a PASS is reached or the attempt bound is exhausted.
The strategy-loop variant rotates through a declared catalog of implementation
patterns and stores the exact function reference on each hypothesis, making
code-pattern learning inspectable rather than only metric-based.
The gain-gated strategy loop adds a measurable-progress trigger: the first
attempt establishes the best value, later attempts must improve the selected
metric while all protected quality and safety checks remain true, and the loop
stops at the configured no-gain bound. Missing metrics and lost protected
checks fail closed. This prevents the improvement loop from spending attempts
without evidence of progress; it remains recommend-only benchmark evidence.
The portfolio runner complements that exploit loop by declaring several
strategy-bound hypotheses up front, screening every branch, allocating full
repetitions only to the best survivors, and preserving every branch outcome.
Full and confirmation stages use independent replications and retain aggregate
median/minimum/maximum evidence. It can optionally evaluate the selected branch
on a disjoint confirmation holdout; otherwise its winner remains explicitly
provisional. A branch that does not improve over its screening aggregate is
rejected before confirmation.

The runtime does not expose model chain-of-thought. It stores inspectable
system records and provenance. Research providers are disabled by default, and
benchmark success does not activate or deploy an engine version.

## Runtime surfaces

- `createEvolutionRuntime` appends and seals signals, targets, research results,
  retained improvements, technique candidates, reproduction trials, variants,
  comparisons, and upgrade decisions in the Reasoning State ledger.
- `createImprovementRetention` and
  `assessImprovementRetentionCurrentness` preserve a verified optimization and
  compare every selected implementation and evidence dependency before reuse.
- `runResearchScout` calls declared providers only when research is enabled.
- `diagnoseLexicalScoringAnomaly` converts an exact scored case plus declared
  concept markers into a bounded hypothesis observation.
- `runHypothesisLearningCycle` registers the hypothesis and observations,
  creates its reproducible experiment, makes the next learning decision, and
  seals the append-only reasoning epoch.
- `projectBenchmarkFailuresToHypotheses` converts exact failed checks into
  bounded, falsifiable implementation hypotheses without adopting them.
- `createVariantWorkspaceFactory` creates one content-addressed detached Git
  worktree outside the serving repository, enforces one writer, and blocks any
  changed path outside the target mutation allowlist.
- `createEvolutionScheduler` runs one cycle at a time and replays duplicate
  trigger identities without a second cycle call.
- `createServingVersionStore` writes a hash-bound serving pointer atomically.
- `applyUpgradeDecision` leaves recommend-only decisions untouched; controlled
  local activation requires an exact predecessor and an injected canary, and a
  failed canary restores the predecessor.

The package supplies mechanisms, not a background daemon. A caller chooses the
research providers, reproduction runner, variant change, benchmark manifest,
canary, cadence, and whether controlled local activation is enabled.

Run tests with Linux Node v26.8.1:

```sh
node --test test/*.test.mjs
```

Run the first deterministic learning canary:

```sh
npm run hypothesis-canary
```

## Benchmark registration and replay

The `are.research-learning` ontology declares `research-records/` as an instance
collection. `src/benchmark-registration.mjs` verifies and maps the two supported
requirement benchmark formats into existing ResearchHypothesis,
HypothesisObservation, ResearchExperiment and LearningDecision records.
Registrations also bind historical implementation hashes and an open research
question; they retain the complete manifest and result, including raw responses,
limitations and failed gates. These are local ontology instances, not admission
to the separate CyberAlchemy ontology runtime registry.

```text
Hypothesis ← tested by ← Experiment → evaluates → Implementation evidence
                              ↓
                         Observation → motivates → Research question
                              ↓
                        Learning decision
```

`requirement-change-001` is backfilled as supporting evidence requiring further
replication. `requirement-latency-001` retains quality PASS, relative latency FAIL
and wrapper deadline FAIL as counterevidence requiring hypothesis revision.
Hypotheses materialized during backfill are retrospective, not falsely dated
preregistrations. Cases within one run are not independent replications.

From the repository root, with Node v26.8.1, import saved files without a model call:

```sh
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/bin/register-benchmark.mjs EXPERIMENT_ID MANIFEST_PATH RESULT_PATH
```

The latency benchmark now calls `registerRequirementBenchmarkCompletion` after
emitting its result, for both completed and blocked runs. Failed registration
produces `REGISTRATION_FAILED` and a nonzero exit; result output remains available.
No general repository watcher or registration for unsupported benchmarks is implied.

Persistence uses fsynced content-addressed files and atomic create-only linking.
Identical registrations replay; changed evidence gets another record; conflicting
stored bytes block. The loader verifies the full linked record and evidence before
use. Historical implementation hashes are never refreshed to today's code.
These hashes are provenance, not a claim that a transitive closure was captured.

`loadBenchmarkRegistrations()` exposes the verified graph. Call
`replayBenchmarkRegistrations(runtime)` to append its learning records to an
existing evolution runtime's ledger; repeated replay is idempotent. No service,
timer, serving-engine change or automatic experiment dispatch is started.

Construction completed here: mapping, backfill, completion hook, graph validation
and ledger replay. Operational residue: other benchmark adapters and broader
ontology-runtime registration remain with the ARE owner and do not block this
local learning collection. The earlier evidence files remain unchanged.

## Open Questions

- What evidence should establish an explicit cross-iteration dependency before a scheduler consumes it?

- Which remaining benchmark formats should receive explicit adapters next?
- Should independent reruns share a hypothesis identity across protocol revisions?
- Which supported harness inputs can reduce classification latency without losing context?

## Research DAG

The research loop is represented across immutable versions, so feedback remains
acyclic:

```text
Question A → Hypothesis A ─┐
                          ├→ Experiment A → Observation A → Decision A → Question B
Implementation A ─────────┘                                                 │
                                                     ┌─────────────────────┘
                                                     ↓
                                                Hypothesis B → Experiment B → …
```

An edge means logical prerequisite material flows into its dependent. It does
not assert proven causality, historical creation order, or execution permission.
In particular, our backfilled hypotheses are retrospective; the projection never
turns them into preregistrations. The broader ontology remains a semantic graph;
its reverse descriptive relations are not blindly copied into this DAG.

`src/research-dag.mjs` exposes `materializeResearchDag({registrations, lineage})`
and `verifyResearchDag(dag, registrations)`. Each verified registration projects
six nodes: hypothesis, historical implementation evidence, experiment,
observation, learning decision and open question. Failed and inconclusive
observations remain available evidence, not silently discarded branches.

The content-addressed output has typed edges, source digests, deterministic
topological order, dependency layers and a research frontier. Independent nodes
can occupy the same layer, but that alone does not prove resource independence
or safe parallel execution. The frontier lists open questions without declared
successors, not executable jobs. Questions with successors are not automatically
marked answered.

Cross-iteration links are explicit:

```js
const lineage = [{question_ref: previousQuestionId,
  hypothesis_ref: successorHypothesisId, source_ref: "exact-dependency-declaration"}];
```

The link endpoints must already exist in the selected registrations. Cycles,
missing or mistyped endpoints, authority-bearing declarations and changed source
records block. Repeating registrations or permuting source order preserves the
same digest. Adding a successor produces a new DAG; it never rewrites old records.

Current evidence yields two independent branches—there is no registered causal
link between them:

```text
Requirement accounting → supporting result → collect replications → replication question
Compact transport     → counterevidence   → revise hypothesis    → harness-input question
```

Inspect the current projection without writing files or invoking a model:

```sh
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/bin/research-dag.mjs
```

Construction frontier: the model, verified projection, and dependency inspection
are implemented. Operational residue: automatic dispatch, resource arbitration,
new experiment execution and activation remain outside this projection and have
not been enabled. Open questions are listed in the section above.

## Planned research work

`plans/requirement-research-v1.json` declares nine tasks anchored to the exact two
registered research questions. It is separate from historical evidence:

```text
Latency question → inspect inputs → form hypotheses → register comparison → run → assess
Replication question → design replication → register protocol → run → assess
```

Only `latency.inspect` and `replication.design` are initially ready. The remaining
seven tasks are planned. Each task declares its owner, product-construction or
operational-support lane, affected stage, prerequisite task IDs, required evidence
criteria, and verifier reference. Unrelated operational work never creates an
implicit dependency. A failed benchmark can complete the task of running a
benchmark if its declared evidence criteria are met; it does not imply a successful
treatment or activation eligibility.

`src/research-work.mjs` provides:

- `materializeResearchPlan`: validates the source DAG, criteria, task references and acyclicity.
- `replayResearchWork`: derives planned/ready/running/blocked/completed states from events.
- `transitionResearchWork`: checks the expected state digest and returns an immutable successor.

Actions are `start`, `block`, `resume`, and `complete`. Ready is derived, not a
caller-set field. Blocking propagates to descendants while independent work stays
ready. Repeating the same event is idempotent; changing its payload under the same
ID fails. Altered state and stale update digests fail. Events remain in the returned
state for replay; this library does not supply a new durable state store.

Completion requires evidence for every criterion: `{criterion_id, artifact_ref,
artifact_digest}`. The injected synchronous `verify_evidence(binding)` adapter
must resolve the artifact, verify its digest, and evaluate the named criterion.
It returns `{ok: true, binding}` only after those checks; the binding includes the
exact plan, task and validator identities. There is no permissive default. A URL,
status edit, or a result for another task is not sufficient. Replay rechecks
completion evidence and fails closed if verification no longer succeeds.

The configured `are.research-artifact-validator/v1` is an adapter contract, not an
installed general semantic evaluator. A caller must supply its implementation;
this work does not claim to independently validate arbitrary research conclusions.
The module verifies the adapter receipt and identity binding, while the adapter
owns substantive checks. Readiness inspection does not require that adapter.

Inspect the current initial plan without model calls or mutations:

```sh
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/bin/research-work.mjs
```

The inspector reads only the selected registration files and verifies the bound
DAG digest. Changed or missing selected evidence blocks; unrelated new records do
not alter this plan. The plan is visible through the research ontology's
`research_work_plan` binding. The source registrations and historical DAG schema
remain unchanged.

Construction frontier: planning, lifecycle projection and evidence-bound
completion are implemented; the two first research tasks are dependency-ready.
Operational residue: dispatch, durable work-state persistence, and a production
artifact-verifier adapter remain separate owner work. No task has been started
or marked completed by creating this plan.

Open questions: which domain-specific validators should satisfy the declared
criteria, and where should a caller persist work-state events?
