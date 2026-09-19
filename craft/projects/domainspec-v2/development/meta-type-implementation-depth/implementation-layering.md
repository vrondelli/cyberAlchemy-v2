---
title: DomainSpec v2 Backend Meta-Type Implementation Depth
status: planning-candidate
updatedAt: 2026-09-01
owner: DomainSpec v2
scope: capability
route: CA2-ROUTE-PLAN
authority_effect: none
baseline_ref: domainspec-meta-types-current-implemented@10
---

# DomainSpec v2 Backend Meta-Type Implementation Depth

This document plans how to deepen the 13 admitted backend meta-types from
baseline-bound code forms and static generated-target conformance into exact,
executable semantic contracts. It does not redefine DS-D1 or DS-D8, modify the
immutable `@10` baseline, select execution work, admit a successor candidate,
or authorize implementation, publication, release, deployment, or production.

Layer 0 is the smallest end-to-end proof that one non-trivial meta-type can
carry authored meaning through a compiled contract, three native realizations,
formal projection, hostile tests, observation, and a digest-bound receipt.
Every later layer must preserve that chain.

## Context

- Target: semantic implementation depth for the 13 active backend meta-types.
- Current state: all 13 types have 39 admitted TypeScript/Python/Rust
  realization rows; the private CLI performs deterministic instantiation and
  static target observation.
- Primary operator: a DomainSpec author or implementation owner who needs to
  know that generated/native behavior preserves the exact authored contract.
- Primary constraint: do not inflate static code shape into runtime behavior or
  refresh exact-byte evidence without a new reviewed evidence epoch.
- Deferred partition: the 11 UI candidate/supporting types remain outside this
  plan and require their own owner decisions and promotion path.
- Source references:
  - `definitions/meta-types/current-implementation.{md,json}`
  - `definitions/meta-types/meta-types.md`
  - `definitions/relationships/relationships.yml`
  - `impl/cli/src/input/project-model.ts`
  - `impl/cli/src/generation/generators.ts`
  - `impl/cli/src/conformance/observe-target.ts`
  - `formalization/CurrentDomainSpecMetaTypes.lean`

## Entry Gate G0 — Establish One Current Planning Frontier

G0 is a prerequisite, not an implementation layer. No layer becomes selectable
until all four conditions close against one frozen source epoch:

1. The current implementation-state validator passes against the exact live
   system-integration evidence, with semantic versus byte-only changes reviewed.
2. The CLI package owner either defers the new `formalize` surface or admits a
   successor package contract; the frozen package-boundary suite must pass.
3. The stale meta-type enforcement-assets/Craft projection is replaced by a
   source-current projection over baseline `@10`; historical `@2` evidence is
   preserved rather than overwritten.
4. Concurrent formalization work is frozen, independently reviewed, and given
   a source-current validation receipt before its bytes become layer inputs.
5. The owning Product Capability and capability-local business ontology for
   meta-type implementation depth are named and exact-bound. If either is
   absent, L0 remains `not_evaluable` rather than bypassing the D65 chain.

G0 must not manufacture closure by changing only digests, status fields, test
expectations, or Craft prose.

## Per-Meta-Type Vertical Contract

A meta-type is complete for this plan only when one immutable candidate closes
all of these stages:

```text
canonical DS-D1 definition and DS-D8 relationships
  -> owning Product Capability
  -> capability-local business ontology
  -> meta-type-local semantic obligations
  -> closed authored body schema and positive/hostile examples
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and system ontology
  -> exact TypeScript, Python, and Rust bindings
  -> native compile/runtime observations
  -> digest-bound receipt and independent target observation
  -> independent conformance evidence
  -> generated formal projection for the selected obligations
  -> independent review and explicit owner promotion decision
```

Formation, native compilation, runtime observation, formal proof, conformance,
and owner admission remain separate evidence claims.

## Layer Boundary Heuristic

```text
Layer value = decision unlocked + operator-visible outcome + risk reduced
Layer cost = implementation time + verification time + coordination burden
```

A layer ends when its smallest coherent meta-type family answers its decision
question. Adjacent types remain deferred when adding them would not strengthen
that decision enough to justify their semantic and verification cost.

## Layer Decision Table

| Layer | Meta-types | Decision question | Minimum working unit | Operator-visible outcome | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 | State Machine | After this layer, we know whether one non-trivial meta-type can preserve exact authored behavior through compilation, three native runtimes, formal projection, and receipt observation. | One State Machine with typed states, initial state, exact transition records, guard/effect references, and valid/invalid runtime cases. | Generated code permits only declared transitions and reports a causal rejection for every undeclared transition. | Continue only if two materializations are byte-identical and all three runtimes agree on every fixture outcome. |
| L1 | Entity, Value Object, Enum, Event, Interface | After this layer, we know whether DomainSpec can generate reusable typed domain and boundary contracts without collapsing identity, value equality, occurrence, or compatibility semantics. | One connected Entity/Value Object/Enum/Event/Interface example using one canonical field/type vocabulary. | Generated native types expose exact fields, identities, value equality, payload version, and callable boundary signatures. | Continue only if schema evolution and cross-language parity tests discriminate every role. |
| L2 | Query, Calculation, Rule, Policy, Mapping | After this layer, we know whether pure/read/decision behavior can bind exact semantics without generic copy, sum, truthiness, index, or identity defaults. | One selected semantic-carrier contract exercised first by Rule and Calculation, then reused by Query, Policy, and Mapping. | Generated wrappers call or evaluate one exact meaning-bearing binding and preserve purity/result obligations. | Continue only if the family shares one admitted carrier model and hostile tests distinguish all five roles. |
| L3 | Operation | After this layer, we know whether an effectful business action can compose exact Rules, reads, writes, creation targets, and Events without undeclared behavior. | One Operation whose Rule, Entity, Event, transaction, and outbox bindings are resolved from the compiled graph. | Generated code preflights exact bindings, rejects guard bypass and undeclared effects, and produces one atomic outcome contract. | Continue only if native provider evidence and target observation agree across all three profiles. |
| L4 | Workflow | After this layer, we know whether a recovery-required Workflow can survive process failure and resume without losing intent or duplicating an effect. | One reference durable-recovery provider implementing store, fenced claim, lease, retry schedule, terminal record, invocation ledger, and restart reconciliation. | An operator can stop and restart the worker and receive one exact terminal disposition with replay-safe evidence. | Promote only after deterministic fault injection, restart tests, independent conformance, and an explicit provider/adoption decision. |

## Layer Value And Cost

| Layer | Principal risk reduced | Main cost drivers |
| --- | --- | --- |
| L0 | Static state-shaped code being mistaken for enforcement of legal transitions. | Source-schema migration, three native executors, formal generation, hostile runtime fixtures. |
| L1 | Entity/value/occurrence/boundary roles collapsing into generic records. | Portable type vocabulary, cross-language type mapping, compatibility and evolution tests. |
| L2 | Generators silently inventing business meaning through generic copy/sum/truthiness/index/identity algorithms. | Semantic-carrier owner decision, exact provider bindings, five-role discriminating corpus. |
| L3 | An Operation passing static checks while bypassing its Rule or performing undeclared effects. | Relationship-driven preflight, transaction/outbox provider evidence, atomicity mutants. |
| L4 | Recovery intent being lost, duplicated, or terminally ambiguous after process failure. | Durable store/provider integration, time and lease control, crash/restart fault injection, independent evidence join. |

## Capability Progression

| Capability | L0 | L1 | L2 | L3 | L4 |
| --- | --- | --- | --- | --- | --- |
| Authored source | Structured State Machine transitions | Canonical typed fields and signatures | Exact semantic carrier/binding | Typed command and outcome | Ordered orchestration and recovery policy |
| Compiler | Transition graph and obligation projection | Domain/boundary type graph | Pure/read/decision binding graph | Complete action composition graph | Recovery-intent and durable-runtime graph |
| Generated code | Legal transition executor | Exact native data/boundary contracts | No generic fallback algorithms | Guarded atomic state/outbox action | Durable worker/reference provider |
| Formalization | Transition closure and illegal-edge rejection | Identity/value/occurrence partition facts | Purity and result-kind obligations | Declared-set and guard-before-effect obligations | Claim/lease/retry/terminal lifecycle invariants |
| Evidence | Three-language valid/invalid fixtures | Schema evolution and parity fixtures | Role-discriminating semantic mutants | Transaction/outbox and relationship mutants | Crash/restart, lease, retry, and replay fault injection |

## Layer Definitions

### L0 — State Machine Minimum Semantic Proof

Included scope:

- Replace string-only transitions with closed structured transition records.
- Bind each transition to declared source/target states, optional guard
  references, and declared effect intents.
- Reject duplicate, missing-state, undeclared, and guard-bypassing transitions.
- Generate behaviorally equivalent TypeScript, Python, and Rust transition
  executors.
- Generate Lean from the canonical compiler projection and prove the selected
  finite formation/rejection properties.
- Record exact source, compiled contract, native artifacts, runtime outcomes,
  and formal artifact identities in one non-authoritative receipt graph.

Explicitly deferred:

- persistence, timers, concurrent transitions, distributed coordination;
- UI State Indicator behavior;
- Workflow recovery and production monitoring.

Exit evidence:

- positive, illegal-edge, missing-state, duplicate, and guard-failure fixtures;
- native compilation plus runtime fixture parity in all three languages;
- two-run byte-identical compiler output and receipt material;
- generated Lean compilation and independent projection review;
- independent review of the exact L0 candidate.

### L1 — Typed Domain And Boundary Contracts

Included scope:

- Define one language-neutral `FieldSpec`/`TypeRef` vocabulary.
- Entity: explicit identity and typed mutable state.
- Value Object: no designated identity, typed complete value, structural
  equality, and invariant references.
- Enum: exact finite value use as a field dependency.
- Event: event type/version, occurrence identity, occurred-at policy, and typed
  payload; delivery guarantees remain external.
- Interface: exact exposed Operation/Query signatures, request/result types,
  boundary kind, version, and compatibility direction.

Explicitly deferred:

- database mappings, serialization frameworks, broker delivery, generated SDKs;
- business algorithms and effectful orchestration.

Exit evidence:

- one connected fixture and role-confusion hostile controls;
- cross-language field/type parity and schema-evolution fixtures;
- Value Object equality and Entity identity runtime checks;
- Event and Interface compatibility observations.

### L2 — Exact Pure, Read, And Decision Semantics

Included scope:

- Select one meaning-preserving semantic carrier before implementation. The
  recommended first option is an exact external implementation binding with a
  typed signature and obligation envelope; do not invent a general expression
  language inside the generator by convenience.
- Query: parameters, declared reads, typed result, no writes/effects.
- Calculation: typed inputs/result, determinism and purity binding.
- Rule: exact boolean predicate binding and causal false/error outcomes.
- Policy: conditions-to-strategy selection, kept distinct from boolean Rule.
- Mapping: source/target types, direction, field transforms, defaults,
  validation, and explicitly bounded computed fields.

Explicitly deferred:

- arbitrary user code evaluation, remote query execution, optimizer concerns;
- Operation transaction/outbox behavior.

Exit evidence:

- same-input repeatability and no-effect evidence;
- missing/stale/wrong-kind binding failures;
- role-confusion mutants: Rule versus Policy, Query versus Operation, Mapping
  versus Value Object, Calculation versus Query;
- exact binding and provider identities preserved in receipts.

### L3 — Exact Operation Composition

Included scope:

- Replace an arbitrary guard callback/boolean with exact compiled Rule bindings.
- Bind typed command/result, Entity reads/writes, `creates` targets, emitted
  Events, failure continuation, and provider-neutral transaction/outbox intent.
- Preflight the complete relationship-derived binding set before mutation.
- Preserve guard-before-mutation, declared-set closure, one atomic outcome, and
  instrumentation ownership outside the business core.

Explicitly deferred:

- selecting a database, ORM, broker, or deployment platform;
- durable Workflow dispatch.

Exit evidence:

- three-language native provider observations;
- guard-bypass, undeclared read/write/effect, partial commit, publish-before-
  commit, and stale-binding mutants;
- independent conformance receipt over exact source and generated artifacts.

### L4 — Durable Workflow Runtime

Included scope:

- Preserve the admitted Recovery Intent, Invocation Identity, Claim, Lease,
  Retry, and Terminal Disposition contracts.
- Select one bounded reference-provider profile without making it universal.
- Implement durable coordination store, fenced claiming, lease renewal,
  persisted retry scheduling, attempt journal, Operation-owned invocation
  ledger, terminal recording, restart reconciliation, and telemetry contract.
- Keep external Operations as exact bindings; Workflow remains orchestration,
  not the owner of their business effects.

Explicitly deferred:

- multi-provider portability claims until a second provider reproduces the same
  contract;
- production scale, deployment, SLOs, and release authorization;
- UI workflow types.

Exit evidence:

- crash at every durable state boundary and restart from persisted state;
- stale-lease, duplicate-worker, retry-exhaustion, unknown-outcome, and replay
  controls;
- one terminal disposition and no duplicate successful effect per invocation
  identity;
- independent provider and EVF evidence joins with exact currentness checks.

## Cross-Cutting Formalization And Relationship Rule

Every layer must generate, rather than hand-copy, its formal view from the same
canonical compiler inputs. The formal projection must cover the applicable
subset of all 45 relationship validation obligations, including cardinality,
generated projections, inverse collapse, scope, ordering, and project-wide
closure. A Lean compile proves only the stated proposition over the projected
model; it does not prove native implementation or runtime conformance.

## Implementation Wave Backbone

| Wave | Target | Goal | Required evidence before close |
| --- | --- | --- | --- |
| W0 | G0 | Freeze one current evidence frontier and resolve package-contract posture. | Source-current validators; reviewed contract decision; new immutable evidence projection. |
| W1 | L0 | Complete the State Machine semantic vertical. | Three-language runtime parity, formal projection, two-run determinism, independent review. |
| W2 | L1 | Complete typed domain and boundary contracts. | Connected fixture, role discrimination, schema evolution, cross-language parity. |
| W3 | L2 | Remove generic pure/read/decision behavior defaults. | Admitted semantic carrier, five-role hostile corpus, exact binding receipts. |
| W4 | L3 | Complete exact Operation composition. | Atomicity and declared-set mutants, native provider evidence, conformance review. |
| W5 | L4 | Prove one durable Workflow reference provider. | Crash/restart matrix, replay safety, terminality, independent EVF join. |

## Non-Regression Guardrails

- Baseline `@10` remains immutable; changed baseline-bound realization bytes
  require a successor candidate, review, and owner decision.
- All 31 canonical relationship signatures and 45 validation obligations remain
  fail-closed through source lint, planning, receipts, and observation.
- Generated projections cannot be authored as source facts.
- TypeScript, Python, and Rust profiles retain exact provenance and deterministic
  output; unsupported behavior is explicit, never silently approximated.
- Native compilation, runtime observation, formal proof, conformance, admission,
  publication, and production are reported as separate states.
- Node `26.8.1` remains the execution baseline unless an owner admits a
  successor runtime.
- Concurrent formalization and unrelated dirty bytes remain outside every
  implementation write envelope.

## Open Decisions

1. L2 semantic carrier: exact external implementation binding (recommended for
   the first vertical), a bounded declarative AST, or a separately governed mix.
2. Canonical type vocabulary: portable DomainSpec `TypeRef` identities
   (recommended) versus language-native type strings.
3. State Machine effects: exact Event effect intents only, or a separately
   admitted broader effect model.
4. L4 reference provider and technology profile.
5. Whether a layer changes baseline-bound realization bytes and therefore
   requires a successor baseline, or only changes an external projection.

## Recommended Next Layer

After G0 closes, execute L0 only. State Machine is the smallest high-value
proof because its current generator checks state membership but not the
declared transition table, guards, effects, or invariants. It exercises the
entire source-to-runtime-to-formal-evidence chain without requiring the durable
infrastructure needed by Workflow.

Major deferred scope: durable Workflow infrastructure, the 11 UI types,
packaging, release, deployment, and production adoption.
