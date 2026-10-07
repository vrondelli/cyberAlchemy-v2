# ARE Evolution Lifecycle

Status: candidate architecture and implementation guide  
Owner: ARE evolution runtime  
Authority effect: none

This document explains how the Agent Reasoning Engine can improve through use,
interaction, research, and time while keeping changes inspectable, reproducible,
bounded, and reversible. It is the narrative entry point for the evolution
runtime. It does not redefine repository authority, cycle definitions, schemas,
or acceptance policy.

Exact behavior is owned by the [cycle-definition registry](registry/cycle-definitions.v1.json),
the schemas under [`schemas/`](schemas/), the implementation under [`src/`](src/),
and their tests. Repository authority remains with the
[local authority model](../../../../authority/definitions/DEFINITIONS.md)
and routing package. Benchmark claims remain bounded by their exact evidence.

## Purpose

The evolution runtime turns observations from real work into controlled
improvements. An agent submits bounded JSON requests; the runtime owns durable
state, ordering, validation, budgets, leases, receipts, recovery, and handoffs.

The objective is the lifecycle anchor:

> A cycle may investigate and test as many hypotheses as needed until its
> objective is achieved, exhausted, cancelled, or paused.

The runtime does not freely rewrite ARE after each conversation. It accumulates
evidence, tests isolated candidates, and changes a serving version only through
a separately authorized controlled-upgrade decision.

## System shape

```text
use and interaction
        |
        v
observable signals and durable evidence
        |
        v
research questions and hypotheses
        |
        v
isolated techniques and engine variants
        |
        v
frozen benchmarks and independent evaluation
        |
        v
retain / revise / reject / controlled upgrade
        |
        v
continued observation and time-based currentness checks
```

The feedback path is cyclical, but its history is append-only. A later decision
does not erase a rejected hypothesis, failed attempt, superseded result, or
rollback.

## Core concepts

### Objective

An objective states the capability to improve, applicable scope, metrics,
constraints, and stop conditions. It guides target selection and determines
whether another hypothesis is warranted. A metric or feature matters only in
relation to the objective.

The active ContextBench objective is
`objective:glm8k-contextbench-context-selection`.

### Cycle definition

A cycle definition is the versioned contract for one category of evolution. It
declares its cycle kind, command and event vocabulary, derived dispositions,
policy extension, validator bindings, compatibility lineage, and admission
state. Registry membership does not grant execution authority.

The registry contains five candidate definitions:

| Cycle kind | Responsibility | Typical output |
| --- | --- | --- |
| `benchmark-research` | Freeze, execute, score, and evaluate a benchmark experiment | evaluated result and next benchmark decision |
| `research-learning` | Convert bounded observations into falsifiable hypotheses and findings | supported, revised, or inconclusive hypothesis |
| `engine-improvement` | Construct and compare an isolated ARE technique or variant | retained, rejected, or revision-required candidate |
| `interaction-learning` | Derive reusable lessons from user, agent, tool, and runtime interaction | applied, revised, or revoked lesson |
| `controlled-upgrade` | Govern local activation, verification, retention, and rollback | retained current version, activated candidate, or rollback |

The registry is canonical for the exact vocabulary. This table is explanatory.

### Cycle instance

A cycle instance is one execution of a cycle definition for one objective. It
binds the exact definition digest, work plan, effect envelope, evidence,
receipts, event revision, and outcome. Separate instances may share an objective
without sharing mutable state.

### Hypothesis and candidate

A hypothesis contains a claim, mechanism, falsifier, scope, metrics,
provenance, and experiment template. An objective may own many hypotheses.
Rejected and inconclusive hypotheses remain evidence.

A supported hypothesis may produce a technique candidate and an isolated engine
variant. Candidate identity binds exact source and dependency bytes. It is not a
serving-version change.

### Research Work Plan

Before coordination, a cycle supplies an immutable Research Work Plan. Its
tasks form a directed acyclic graph. Every task declares dependencies,
completion criteria, and a validator. The coordinator derives readiness; an
agent cannot assign projection state directly.

### Effect envelope

The effect envelope bounds attempts, concurrency, tokens, cost, elapsed time,
effect classes, and expiration. It binds an authorization reference. A
definition being registered or a task being ready does not expand the envelope.

### Lease, fencing token, and settlement

An agent asks the coordinator for ready work. An accepted lease records the
worker, attempt, rationale, resource reservation, expiration, and fencing token.
Only the live fenced lease can settle the task. Expired leases require explicit
recovery before redispatch.

A successful settlement requires criterion-complete evidence, exact validator
acceptance, and bounded accounting. Retryable failures preserve their lineage.

### Evidence, receipt, and projection

Evidence is immutable or exact-digest-bound material supporting a claim.
Receipts record decisions at command, lease, provider, scoring, settlement,
handoff, and upgrade boundaries. Neither evidence nor a receipt grants authority
outside its declared boundary.

The operational projection is derived state. It can be discarded and rebuilt;
it is never canonical merely because it is convenient to query.

## Runtime layers

```text
JSON control surfaces
  kernel / coordinator / bounded prototype
                 |
                 v
closed protocol and cycle-specific validators
                 |
                 v
append-only commands, events, receipts, and commit markers
                 |
                 v
content-addressed evidence objects
                 |
                 v
disposable SQLite operational projection
```

### Protocol

The closed protocol rejects unknown fields, stale revisions, malformed hashes,
definition substitution, replay conflicts, and direct state assignment.
Accepted and rejected commands both receive non-authorizing receipts.

### Durable kernel

The kernel owns durable mutation. A commit marker is the atomic visibility point
for its command object, event entries, payload objects, and receipt. The object
store is content addressed; event and receipt ledgers are create-only.

SQLite is a disposable read model. Deleting it does not delete cycle history.
`recover()` reconstructs it from verified durable inputs. Missing, changed,
contradictory, or secret-bearing material blocks recovery.

### Coordinator

The coordinator exposes these agent-facing operations:

- `inspect`
- `admit-phase`
- `lease-work`
- `settle-work`
- `recover`
- `offer-handoff`
- `accept-handoff`

The agent proposes work and submits evidence. The coordinator owns state
transitions.

### Validators

Two validation levels are required:

- A cycle validator checks the plan, evidence semantics, and policy for one
  cycle kind.
- A task validator checks that one task satisfied all declared completion
  criteria.

Generic validators can test shared construction mechanics, but they do not make
a real domain cycle complete. A real exemplar counts only when its domain
validator accepts actual evidence and the kernel stores the resulting commands,
events, receipts, settlement, and recovery state.

## Lifecycle

```text
objective selected
      |
      v
cycle definition bound and phase admitted
      |
      v
hypotheses registered and work DAG frozen
      |
      v
ready tasks leased and executed
      |
      v
evidence validated and work settled
      |
      v
independent evaluation where required
      |
      v
cycle decision
  |       |        |        |
retain  revise   reject   hand off
                           |
                           v
                    receiving cycle
```

### Admission boundary

Cycle-definition admission is a single user-owned boundary. The current
registry remains candidate-only: all five definitions are `admitted: false` and
`enabled: false`. Explicit construction runs may use a bounded override without
changing those registry bytes or implying production admission.

### Completion boundary

Completion requires evidence and accounting, not an agent assertion. The cycle
may end in success, failure, inconclusive evidence, exhaustion, cancellation,
pause, rejection, retention, or rollback according to its definition.

### Handoffs

Cycles stay separate. They exchange immutable artifact and claim references
through typed offers. The receiving cycle binds the offer digest, selects what
it accepts, and obtains its own receipt and authority boundary.

## How ARE evolves

### Through use

Real tasks produce observations such as quality, failures, retries, context
pressure, tool effectiveness, token use, latency, recovery events, and user
acceptance. These become bounded signals. They do not immediately alter the
engine.

### Through interaction

Interaction learning identifies repeatable lessons about user intent, decision
presentation, agent coordination, tool behavior, and operational recovery. A
lesson progresses from evidence to proposal, validation, application, and
monitoring. It may later be revised or revoked.

Examples from the current work include persistent runtime preflight after a WSL
reset, showing one decision gate at a time, and requiring a separate evaluator
agent for consequential benchmark results.

### Through research

Research learning converts observations into falsifiable hypotheses. Supporting
evidence, counterevidence, and inconclusive observations remain distinct. A
learning decision may request replication, an experiment, hypothesis revision,
or technique construction.

### Through engine improvement

A supported technique is implemented in an isolated, content-bound variant.
The comparison protects quality, performance, safety, determinism, and holdout
criteria. Improving the target metric is insufficient if a protected property
regresses.

### Through benchmark research

Benchmark research freezes the candidate, tasks, model, window, prompts,
budgets, metrics, thresholds, and stop conditions. Provider calls and all
attempts are accounted for. Failed infrastructure attempts are retained but
kept separate from the selected score.

### Through controlled upgrade

An eligible comparison may recommend or locally activate a candidate only under
an explicit activation boundary. A canary verifies the activated pointer. A
failed canary restores the known predecessor. Recommend-only remains the
default posture.

The IL-H04 successor used a non-activating controlled-upgrade preflight to
confirm the shared headless RPC host surface. It passed 6/6 high-risk cases,
produced zero low-risk or disabled false triggers, rejected tampering, and
suppressed replay after recovery. This does not activate the renderer and does
not establish Codex Desktop/Windows UI support. See
[`research/ilh04-host-confirmation-v1/RESULTS.md`](research/ilh04-host-confirmation-v1/RESULTS.md).

A following `engine-improvement` cycle supplied the missing runtime binding
provider. It exact-loads a closed state snapshot, deterministically maps
objective transitions to IL-H04 bindings, fails closed on selector misses, and
is wired into both real headless entrypoints. The real gateway canary passed
without a provider/model call; the repository profile remains disabled. See
[`research/ilh04-continuity-provider-v1/RESULTS.md`](research/ilh04-continuity-provider-v1/RESULTS.md).

The next owner decision admitted one bounded `controlled-upgrade` instance.
That cycle proved atomic rollback with a failed canary, then passed the real
gateway canary and retained the exact provider package behind an evidence-owned
local pointer. It did not admit the cycle definition globally or enable the
repository-default profile. See
[`research/ilh04-headless-activation-v1/RESULTS.md`](research/ilh04-headless-activation-v1/RESULTS.md).

The final operational successor binds that retained pointer directly into both
real entrypoints through a closed activation manifest. It also re-observes the
installed Codex protocol, passes a real app-server initialization without a
model turn, and passes the model-neutral continuity gateway canary. See
[`research/ilh04-headless-operational-v1/RESULTS.md`](research/ilh04-headless-operational-v1/RESULTS.md).

### Through time

Scheduled currentness checks can detect source drift, dependency changes, model
or tokenizer changes, stale evidence, degraded performance, and lessons that no
longer apply. Unchanged state should replay without external calls. Changed
dependencies return the affected candidate to evaluation rather than silently
retaining it.

## Cross-cycle evolution chain

```text
benchmark-research
  benchmark result and failure evidence
          |
          v
research-learning
  supported or revised hypothesis
          |
          v
engine-improvement
  isolated candidate and comparison
          |
          v
benchmark-research
  confirmation result
          |
          v
controlled-upgrade
  retain / activate / roll back

interaction-learning may receive incidents from any stage and return
validated operational lessons without merging its lifecycle into another cycle.
```

## Storage, retention, and archiving

The storage model separates durable identity from operational convenience:

- Content-addressed objects deduplicate exact bytes.
- Append-only ledgers preserve commands, events, and receipts.
- Selected and superseded attempts remain distinguishable.
- Compact manifests, hashes, decisions, and accounting should remain hot.
- Large raw evidence from old or low-value cycles may move to compressed or
  remote archives while retaining a verifiable restoration manifest.
- SQLite projections are disposable and reconstructable.
- Secrets are rejected from durable command and artifact storage.

Automated evidence aging, tier selection, archive restoration, and deletion
policy are not complete. Until they are, evidence must not be removed merely
because it is old.

## Agent interaction model

Agents interact with the runtime through bounded JSON. A representative request
shape is:

```json
{
  "operation": "lease-work",
  "cycle_ref": "cycle:example",
  "task_ref": "task:example",
  "resource_request": {
    "tokens": 10000,
    "cost": 1,
    "elapsed_seconds": 600
  }
}
```

The trusted launcher fixes the storage root. Callers cannot submit projection
state or draft their own accepted receipts. Provider credentials remain outside
the durable JSON boundary.

## HEN-10 walkthrough

HEN-10 is a `benchmark-research/v1` cycle for the GLM 8K ContextBench objective.
It demonstrates both the current capability and the remaining integration gap.

Completed evidence includes:

- exact task and source freezing;
- GLM-5.3-flash execution with an 8K request limit;
- interrupted-run recovery without rerunning completed tasks;
- selected versus superseded attempt accounting;
- native ContextBench scoring;
- independent post-run evaluation;
- selection of the next H-EN hypothesis.

The selected four-task result reports mean Span-F1
`0.3920897271519605` and mean File-F1 `0.6627747252747253`. All four
outcomes are valid and window-verified. The strict every-task-perfect target,
benchmark clearance, and campaign goal did not pass. See the
[selected result](evidence/hen-10-contextbench-live-v7-recovery/score-r4/RESULTS.json),
[independent review](evidence/hen-10-contextbench-live-v7-recovery/INDEPENDENT-POSTRUN-REVIEW.json),
and [scoring summary](evidence/hen-10-contextbench-live-v7-recovery/SCORING-SUMMARY.json).

HEN-10 used a hybrid execution path:

```text
evolution runtime tracked the H-EN frontier through HEN-10 readiness
        |
        v
bounded benchmark scripts performed live dispatch, recovery, and scoring
        |
        v
verified evidence returned to the evolution-runtime evidence tree
        |
        v
final benchmark-research coordinator settlement remains to be implemented
```

HEN-10 is benchmark research by cycle type and scientific purpose. Its original
live execution path remains hybrid, but the verified result, scoring summary,
independent review, and HEN-11 selection are now content-addressed and settled
through the shared coordinator as the `benchmark-research` review exemplar. No
GLM rerun was needed to close that evidence-settlement gap.

The next selected hypothesis is documented in
[`HEN-11-HYPOTHESIS-SELECTION.v1.json`](evidence/HEN-11-HYPOTHESIS-SELECTION.v1.json).

## Implementation status

| Surface | Status |
| --- | --- |
| Closed multi-cycle protocol and candidate registry | Implemented and tested |
| Content-addressed durable kernel and reconstruction | Implemented and tested |
| Coordination, leases, fencing, settlement, recovery, and handoffs | Implemented and tested |
| Provider-free H-EN import and readiness projection | Implemented and tested |
| HEN-10 live generation, recovery, scoring, and independent review | Completed as bounded benchmark evidence |
| Shared coordinator mechanics for all five cycle kinds | Tested; full suite currently 128/128 |
| HEN-10 verified-evidence coordinator settlement | Completed in the five-cycle review runtime |
| Production domain validators for all cycle kinds | Not implemented |
| One real, durably settled review exemplar for every cycle kind | Completed; five phases and 14 evidence tasks |
| Real interaction-learning objective cycle | Closed; 22 experiment artifacts durably settled; IL-H04 retained without activation |
| IL-H04 engine-improvement cycle | Completed construction integration; 5 artifacts durably settled; wrapper variant recommended and disabled |
| IL-H04 continuity-provider cycle | Completed provider integration; 6 artifacts durably settled; real gateway canary passed; disabled |
| IL-H04 headless controlled-upgrade | One cycle instance admitted; rollback proven; 7 artifacts settled; local pointer active; repository default disabled |
| IL-H04 operational headless binding | Complete; both entrypoints consume exact activation manifest; 8 artifacts settled; real Codex initialize passed |
| Production admission or enablement | Not granted |
| Automated evidence aging and archival | Not implemented |

The exact construction-only multi-cycle result is in
[`OTHER-CYCLE-KINDS-ENGINE-VALIDATION.v1.json`](evidence/OTHER-CYCLE-KINDS-ENGINE-VALIDATION.v1.json).
Those tests prove that shared mechanics are cycle-kind neutral; their generic
validators are not substitutes for real domain cycles.

The exact real-evidence review result is in
[`FIVE-CYCLE-EXEMPLAR-REVIEW.v1.json`](evidence/FIVE-CYCLE-EXEMPLAR-REVIEW.v1.json).
It binds one domain-validated cycle for every registered kind into the shared
MCP-visible runtime, preserves 14 content-addressed evidence objects, and passes
restart plus SQLite-loss reconstruction. This is review and settlement of
existing evidence, not a new model/provider experiment or production admission.

## Decision boundaries

- The user admits a cycle definition.
- The coordinator admits a phase only with an exact plan, enabled envelope, and
  available validators.
- The effect envelope bounds execution but does not itself perform effects.
- Task settlement requires exact fenced ownership and validated evidence.
- Independent review is required where the frozen experiment declares it.
- A receiving cycle explicitly accepts a typed handoff.
- Controlled activation requires separate eligibility, authorization, canary,
  and rollback evidence.

## Open Questions

1. When should each candidate cycle definition receive production admission,
   beyond the bounded construction override used by the five-cycle review?
2. What evidence-aging policy determines hot, compressed, archived, and
   deletable material without breaking reconstruction or auditability?
3. Which time-based triggers should run automatically, and which require user
   confirmation before spending provider or compute budget?
4. What confirmation cohort and acceptance threshold are required before an
   H-EN improvement may enter `controlled-upgrade`?
