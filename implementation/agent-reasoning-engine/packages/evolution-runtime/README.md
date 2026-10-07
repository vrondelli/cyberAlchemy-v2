# ARE Evolution Runtime

Command examples require Node 26.8.1 on PATH and run from this package directory.

To validate and durably settle one existing real-evidence exemplar for every
registered cycle kind into a shared local runtime:

```sh
node bin/review-cycle-exemplars.mjs \
  --root /home/vlad_/.local/share/are/evolution-runtime-v1 \
  --report evidence/FIVE-CYCLE-EXEMPLAR-REVIEW.v1.json
```

This review performs no provider/model calls and does not admit the candidate
definitions globally. It content-addresses the selected evidence, applies a
kind-specific validator, settles the five coordinator phases, and verifies
restart and SQLite-loss recovery.

Start with the [evolution lifecycle architecture](EVOLUTION-LIFECYCLE.md) for
the objective-driven model, five cycle kinds, runtime layers, evidence and
receipt flow, cross-cycle handoffs, evolution through use and time, HEN-10
walkthrough, current implementation boundary, and open questions. This README
then provides the implementation history and detailed package surfaces.

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

## Multi-cycle JSON protocol foundation

P1 adds the shared, non-durable protocol foundation for independently defined
evolution cycles. The public boundaries are closed and versioned in
`schemas/protocol-v1.schema.json`, `schemas/cycle-definition-v1.schema.json`,
and `schemas/cycle-policies-v1.schema.json`. They cover commands, results,
events, command receipts, artifact identities, effect envelopes, named phase
admissions, typed handoff offers and acceptances, cycle definitions, and the
five typed policy extensions.

`src/protocol-v1.mjs` provides deterministic materializers and structural
validators. Commands bind an idempotency key, expected event revision, actor or
worker, exact cycle-definition digest, operation, target, and payload digest.
Unknown fields, direct state assignment, stale revisions, malformed hashes,
replay conflicts, and definition substitution fail closed. Accepted and
rejected commands both produce deterministic non-authorizing receipts.

`registry/cycle-definitions.v1.json` contains exactly five candidate entries:
benchmark research, research learning, engine improvement, interaction
learning, and controlled upgrade. Every entry is explicitly `admitted: false`
and `enabled: false`. Registry membership is not admission; only a separate
user decision may admit or enable a definition or its successor.

The P1 protocol by itself does not persist events or reconstruct projections.
The P2 kernel below consumes it; work dispatch, leases, providers, benchmarks,
and upgrade activation remain later construction slices. The deterministic
positive and negative receipt fixture is in
`fixtures/protocol-v1/deterministic-command-receipts.json`.

## Durable kernel and reconstruction

P2 adds `src/durable-kernel-v1.mjs`, a small synchronous runtime that accepts
closed protocol commands and owns all durable state changes. One immutable
commit marker is the atomic visibility point for its command object, ordered
event entries, event payload objects, and command receipt. On the file-ledger
route (Linux), referenced SHA-256 objects and append-only entries are created
and fsynced before the commit marker. On native Windows, the kernel uses
`src/sqlite-ledger-store-v1.mjs`: immutable, SHA-256-checked entries in SQLite
WAL mode with `synchronous=FULL`; one transaction publishes the event entries,
receipt, and commit marker together after the referenced objects are stored.
Interrupted pre-commit objects can remain as diagnostic residue. Both routes
reconstruct committed state after a process crash and reject mixed file/SQLite
ledger roots. The separate `observeDurableEvolution` path reopens the selected
ledger read-only, verifies it, and does not construct a writer.

The focused durable-kernel and SQLite-store tests pass 24/26 on Linux (two
Windows-only skips), and the native Windows durable-kernel tests pass 21/21,
including write, read-only observation, CLI observation, exact replay,
corruption rejection, mixed-root rejection, and fault recovery. The full
Evolution suite remains red in eight unrelated H-EN benchmark-source drift
cases (183 pass, 8 fail, 2 skip on Linux). SQLite WAL/FULL is the storage
design basis; process-crash and injected-fault recovery are tested, but physical
power-loss durability has not been tested. The historical
[Windows development probe](../../apps/desktop-companion/docs/WINDOWS-SOURCE-DIAGNOSTICS-TEST-2026-09-26.md)
records the earlier directory-`fsync` failure; it is not a current-source
writer verdict. This kernel binding does not by itself validate a rebuilt
Companion package, installed Windows UI, or live Evolution execution.

The global object store is content addressed. Event and receipt ledgers are
create-only. Aggregate-cycle, subordinate-record, and executable-work views
are derived from the same verified commit chain. SQLite is a transactional,
disposable operational index: deleting or corrupting it cannot change state,
and `recover()` rebuilds it from durable inputs. Missing, changed,
non-canonical, contradictory, secret-bearing, or revision-inconsistent durable
evidence blocks recovery.

`bin/kernel.mjs --root PATH` is the minimal JSON-stdin boundary with `process`,
`inspect`, `diagnose`, `recover`, and `put-artifact` operations. The trusted
launcher fixes the storage root outside agent-controlled JSON. Its production default
requires an enabled cycle definition, so all five candidate definitions remain
non-runnable. The accepted-command tests use an explicit construction-only
override without changing registry bytes. The runtime performs no work
dispatch and no model, provider, benchmark, network, Docker, activation, or
external effect.

The deterministic three-layer inspection fixture is
`fixtures/durable-kernel-v1/three-layer-snapshot.json`. Recovery is explicit:
a stale writer lock blocks new work until `recover` verifies that its process
is gone; a live or unreadable lock is never stolen.

## Bounded work coordination and handoffs

P3 adds `src/coordination-protocol-v1.mjs` and `src/coordination-v1.mjs`. The
coordination protocol has closed, versioned command, event, receipt, result, and
projection documents. Coordination commits use the same P2 commit chain,
object store, event and receipt ledgers, expected cycle revision, writer lock,
recovery path, and disposable SQLite rebuild. There is no second journal,
cursor, DAG executor, or RWO runtime dependency.

The coordinator accepts an immutable Research Work Plan and enabled effect
envelope only after its exact cycle-kind validator and every task validator are
available. It derives ready work from accepted settlements, lets an agent select
one ready task with rationale and resource request, and issues a time-bounded
lease with a fencing token. Settlement requires the live lease, exact fence,
bounded accounting, and criterion-complete validator-approved evidence.
Retryable attempts preserve lineage and remain bounded by the envelope.

Expired leases block redispatch until explicit coordination recovery records
their expiry. Concurrency, attempts, tokens, cost, elapsed time, effect classes,
and envelope expiry fail closed. `external-dispatch` remains disabled in this
slice even if named by an envelope. Typed handoff offers transfer immutable
artifact and claim references only; the receiving cycle binds the exact derived
offer digest and receives its own durable acceptance receipt.

`bin/coordinate.mjs --root PATH` is the JSON-stdin control surface. It exposes
only `inspect`, `admit-phase`, `lease-work`, `settle-work`, `recover`,
`offer-handoff`, and `accept-handoff`; callers cannot submit event drafts or
projection state. Production mode still requires an admitted and enabled cycle
definition, so the five candidate definitions remain non-runnable. The
`--construction-disabled-definitions` option exists only for bounded local
construction tests.

RWO remains reference and conformance evidence only. P3 reuses its one-root
authority, deterministic replay, compare-bound acceptance, and separation
principles without importing its Rust DAG, accepted-history stores, shell
executor, or transports.

The shared P3 engine is also construction-tested across every non-benchmark
cycle kind. `research-learning`, `engine-improvement`, `interaction-learning`,
and `controlled-upgrade` each pass phase admission, dependency-ordered leasing,
criterion-complete settlement, bounded accounting, byte-identical restart, and
SQLite-loss reconstruction. Each kind also fails closed without its own cycle
validator, and all four remain non-runnable under production defaults because
their registry definitions are still candidate, unadmitted, and disabled. This
proves the kernel and coordinator are cycle-kind neutral; it does not substitute
generic test validators for production domain semantics. Exact bindings and the
nine-test result are retained in
`evidence/OTHER-CYCLE-KINDS-ENGINE-VALIDATION.v1.json`.

The first real non-activating controlled-upgrade preflight is retained under
`research/ilh04-host-confirmation-v1/`. It validates the IL-H04 notification at
the shared headless RPC host boundary, preserves the disabled repository
profile, and settles its evidence through the same durable coordinator. Its
claim excludes Codex Desktop/Windows UI display and real-user effectiveness.

The missing engine-owned state binding is now implemented and settled as a
separate `engine-improvement` cycle under
`research/ilh04-continuity-provider-v1/`. A closed, digest-bound snapshot feeds
the real wrapper and persistent gateway entrypoints; selector misses fail
closed, the repository default remains disabled, and activation is still a
separate controlled-upgrade decision.

That decision is now represented by the admitted single-cycle instance under
`research/ilh04-headless-activation-v1/`. It proved failed-canary rollback,
passed the real gateway canary, and retained the provider package in a local
evidence-owned serving pointer. The global cycle definition and repository
default profile remain disabled; actual operator-launcher selection is still a
separate operational boundary.

The operational successor under `research/ilh04-headless-operational-v1/` now
closes that boundary. Both real entrypoints consume one closed activation
manifest, the installed Codex protocol was re-observed, and a real app-server
initialize plus the model-neutral continuity canary passed. The local headless
scope is complete; external deployment and Desktop UI remain different scopes.

## H-EN working prototype

P4 adds `src/benchmark-research-v1.mjs` and the exact bounded import manifest at
`registry/hen-frontier-import.v1.json`. The manifest imports only the current
GLM 8K ContextBench H-EN construction frontier: its controlling workflow,
rejected R1 candidate and review, repaired R2 candidate, and supervised R7
offline replay. The complete historical ContextBench campaign, H-L, H-MC,
ARE-DSH rounds 73–78, LongMemEval, credentials, caches, and benchmark execution
remain excluded.

Import verifies every original path, byte length, and SHA-256 before storing the
bytes in the P2 content-addressed object store. Five durable commands reconstruct
the immutable objective, H-EN hypothesis, R2 candidate, retrospective import
receipt, and HEN-06 independent-review task. The initial derived benchmark
projection shows the candidate as `awaiting-validation`; it does not convert
the pending review into approval or claim the historical work ran inside this
runtime. A separate `advance-hen` operation verifies the closed HEN-07–09
evidence and independent-review record, stores all eleven exact evidence objects,
and appends three durable commands that qualify the successor candidate and make
HEN-10 the only ready task in that retrospective provider-free projection. The
later live HEN-10 execution is separate evidence and still awaits final
coordinator settlement, as documented in
[`EVOLUTION-LIFECYCLE.md`](EVOLUTION-LIFECYCLE.md#hen-10-walkthrough).

`bin/prototype.mjs` is the provider-free JSON stdin surface. Production defaults
still reject the disabled benchmark definition. Local construction requires the
explicit `--construction-disabled-definitions` switch:

```sh
printf '%s\n' '{"schema_version":"are.evolution-prototype-cli-request/v1","operation":"import-hen","input":{"imported_at":"2026-09-22T15:00:00.000Z","actor":{"actor_id":"agent:local-prototype","actor_kind":"agent"}}}' |
  node bin/prototype.mjs --root /tmp/are-evolution-prototype \
    --repository-root ../../../../.. --construction-disabled-definitions
```

The import binds eleven exact artifacts: the five workflow/review/replay records
plus the repaired worker, its two transitive ranking modules, the process-group
supervisor, the R7 analyzer, and the focused 11-test source. `advance-hen` adds
the HEN-06 rereview, immutable HEN-07/08 predecessor, independently accepted
runtime-continuity record, HEN-09 summary, independent reviews, and six frozen
result/receipt objects, bringing the reconstructed projection to twenty-two content-addressed bindings
and eight commits. The same CLI supports `inspect` and
`reconstruction-bundle`. Deleting SQLite and
running kernel recovery reconstructs the byte-identical benchmark projection
from the verified durable chain. No operation dispatches workers, calls a model
or provider, runs a benchmark, or enables a cycle definition.

HEN-07 adds `hen-balanced-facet-round-robin/v1`. It accepts only closed
path-and-span records, deduplicates by path/span/content hash, retains the best
duplicate, and selects by rank across facets under three independent bounds:
4,096 UTF-8 payload bytes, sixteen records total, and four records per path.
The wire payload uses a declared field-order tuple representation to avoid
spending the small context budget on repeated JSON keys.

HEN-08 materializes each result as a distinct digest-bound candidate view with
exact source-query, raw-hint, omitted-hint, selected-hint, payload-byte, model-
call, and provider-call accounting. Both operations are available through the
closed prototype CLI as `compress-hen-hints` and
`build-hen-candidate-view`. The four-task R7 offline replay retains seven of
nine previously missing labeled paths after compression from 320 to 64 hints;
labels are post-hoc evaluation data and are rejected from candidate-view input.
The exact evidence is in
`evidence/HEN-07-08-PROVIDER-FREE-COMPLETION.v1.json`.

HEN-09 is complete at the tokenizer-only qualification ceiling. The first
frozen composition correctly failed with 48 populated-request overflows because
it repeated the full audit view in every request. The accepted successor keeps
that full view in evidence and projects only adaptively admitted path/range
hints to the model. All 4 initial, 85 populated-replay, and 4 representative
terminal requests fit the strict 8K envelope; maxima were 4,544, 7,924, and
3,867 tokens respectively. The rejected and accepted attempts made 93 tokenizer
calls each (186 total); both attempts and all redacted receipts remain under
`evidence/hen-09-tokenizer-qualification-v*/`. HEN-10 registration, independent
launch review, live execution, recovery, and native scoring are now complete.
The selected composite preserves tasks 1–2 from the interrupted v2 run and
uses the fresh v7 recovery for tasks 3–4. All four assigned outcomes are valid,
long-trajectory, reconciled, and verified inside the strict 8K request window.
Native ContextBench scoring reports mean Span-F1 `0.3920897271519605` and mean
File-F1 `0.6627747252747253`; the strict every-task-perfect development target
did not pass, so neither the benchmark nor campaign is cleared. Selected
generation used 86 model calls and 315,839 model tokens; complete all-attempt
accounting, including superseded work and prelaunch diagnostics, is retained.
The authoritative selected scoring result is
`evidence/hen-10-contextbench-live-v7-recovery/score-r4/RESULTS.json`, with the
selection and failed local scorer-attempt lineage summarized by
`evidence/hen-10-contextbench-live-v7-recovery/SCORING-SUMMARY.json`. The
independent post-run review passes the exact denominator, provenance,
settlement, reconciliation, 8K, accounting, and score-integrity checks. The
claim ceiling remains the same four exposed development tasks; confirmation on
an independently frozen cohort is still required before any generalization
claim.

After `import-hen`, advance only through the already accepted milestones with:

```sh
printf '%s\n' '{"schema_version":"are.evolution-prototype-cli-request/v1","operation":"advance-hen","input":{"actor":{"actor_id":"agent:local-prototype","actor_kind":"agent"}}}' |
  node bin/prototype.mjs --root /tmp/are-evolution-prototype \
    --repository-root ../../../../.. --construction-disabled-definitions
```

## Runtime surfaces

### Historical interaction-learning ingestion

`bin/interaction-learning.mjs --root PATH` adds a closed JSON-in/JSON-out
construction surface for the approved historical interaction-learning cycle.
The `scan` operation streams Codex JSONL sources, selects sessions by declared
working-directory markers, and writes a compact `ingestion.json` beneath the
cycle root. It retains record ordinals, timestamps, hashes, counts, language
hints, and correction-signal classes, but never durable message text, tool
arguments or outputs, environment values, encrypted reasoning, or credentials.

The `baseline` operation accepts labels from a separate evaluator, rejects
unknown or multiply assigned turns and causally inconsistent failures, preserves
objective groups in chronological partitions, and writes `baseline.json`.
It never treats correction-keyword matches as final failure labels. `hypothesis`,
`screen`, `assess`, and `package` freeze each subsequent candidate and preserve
both counterevidence and supported learning packages. Version-suffixed operations
retain later hypotheses without overwriting earlier results. `close` accepts only
a valid supported package, records the owner's retention decision, and closes the
objective with `activation: none`.

The first real execution measured a `0.50` historical baseline and evaluated
four candidates. The deterministic high-risk transition renderer, IL-H04,
passed 20/20 prospective episodes with Wilson 95% lower bound `0.8389`, zero
critical regressions, and no provider calls. The owner retained it through
DG-IL-15 and the runtime closed the objective without activating or integrating
the renderer. The coordinator bound 22 experiment artifacts and passed restart
and SQLite-loss reconstruction; the later closure artifact and receipt are also
durable under the cycle root. The complete contract, plan, and bounded result are
in
[`../../benchmarks/real-reasoning-v1/interaction-learning/CYCLE-DEFINITION.md`](../../benchmarks/real-reasoning-v1/interaction-learning/CYCLE-DEFINITION.md),
[`../../benchmarks/real-reasoning-v1/interaction-learning/IMPLEMENTATION-PLAN.md`](../../benchmarks/real-reasoning-v1/interaction-learning/IMPLEMENTATION-PLAN.md),
and
[`../../benchmarks/real-reasoning-v1/interaction-learning/RESULTS.md`](../../benchmarks/real-reasoning-v1/interaction-learning/RESULTS.md).

The retained IL-H04 package now has a separately settled `engine-improvement`
successor under `research/ilh04-engine-improvement-v1/`. It integrates the
renderer at the Codex wrapper's post-objective-resolution boundary, emits a
typed continuity context and client notification when enabled in construction,
and keeps the repository profile disabled. Its deterministic comparison passed
20/20 exact parity cases; activation remains `none`.

The later `ilh04-continuity-provider-v1` engine-improvement cycle closes the
runtime-state gap: both real entrypoints can exact-load an operator-supplied
snapshot and provide deterministic bindings to the renderer. Its gateway
canary and all regressions passed; it recommends the provider variant without
activating it.

Example scan request:

```json
{"schema_version":"are.interaction-learning-cli-request/v1","operation":"scan","cycle_id":"interaction-learning-001","input":{"sources":[{"source_id":"windows-active","root":"/mnt/c/Users/vlad_/.codex/sessions"},{"source_id":"wsl-active","root":"/home/vlad_/.codex/sessions"}],"cwd_markers":["cyberAlchemy-v2","agent-reasoning-engine"]}}
```

This candidate surface produces evidence only. It does not admit the disabled
cycle definition, call an evaluator or provider, activate a lesson, or upgrade
the serving engine.

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
- `createDurableEvolutionKernel` commits command/event/receipt units, stores
  artifacts, reconstructs all three projection layers, diagnoses residue, and
  rebuilds its disposable SQLite index.
- `createEvolutionCoordinator` admits exact work plans, derives ready work,
  controls fenced leases and recovery, settles evidence and accounting, and
  records typed handoffs through the P2 commit chain.
- `createBenchmarkResearchRuntime` verifies and imports the bounded H-EN legacy
  closure, derives its semantic projection, and builds a provider-free
  reconstruction-bundle index.
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
