---
title: AlchLang Registry Compiler and Transactional Outbox Generator Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: CyberAlchemy-v2 / AlchLang
scope: capability
route: CA2-ROUTE-PLAN
authority_effect: none
---

# AlchLang Registry Compiler and Transactional Outbox Generator Implementation Layering

This document defines a progressive implementation layering model for a registry compiler, explicit effect semantics, and the first provider-specific `transactional-outbox/sqlite` generator.

Scope note: Layer 0 is the minimum working unit POC that proves deterministic registry compilation. Every later layer must preserve fail-closed availability, explicit provenance, candidate-versus-stable separation, and the absence of inferred effects.

## Context

- Target: compile admitted meta-types, registered integration bindings, generators, and conformance evidence into an AlchLang operation-pattern registry; then add explicit `effect` / `performs` semantics and a concrete SQLite transactional Outbox generator.
- Current state: partially implemented. The CLI lists a manually duplicated static registry containing an available `operation-port` candidate and a blocked `transactional-outbox` candidate.
- Primary user/operator: an AlchLang author who needs to discover which operations can be generated safely and why another operation is blocked.
- Primary constraint: availability must be derived from exact, closed dependencies. Discovery must not imply stability, admission, execution authority, or observed provider guarantees.
- Planning authority: `CA2-ROUTE-PLAN`; this file is a planning candidate only and does not authorize implementation.
- Registration constraint: the current Goals validation posture is blocked, so this plan is not registered as admitted execution state.

### Selected source dependency set

Only these ontology records, selectors, and implementation surfaces define this plan:

| Source | Selected dependency | Current fact used by the plan |
| --- | --- | --- |
| `projects/domainspec-v2/definitions/meta-types/current-implementation.json` | baseline identity, `operation_contract`, `infrastructure_binding_contract`, `product_frontier` | baseline `domainspec-meta-types-current-implemented@10` is `owner-admitted-frozen`; `DS-D1.4` requires declared read/write/effect sets and atomic state-and-outbox; provider runtime remains open |
| `projects/domainspec-v2/impl/system-integration/profiles/provider-neutral-v1/profile.json` | `contract_kinds`, `invariants`, `implementation_state`, `claim_ceiling` | binding formation is supported; provider runtime is unimplemented and its guarantees are unobserved |
| `projects/domainspec-v2/impl/system-integration/contracts/binding-manifest-v1.schema.json` | binding identity, profile digests, canonical bindings, binding digest, runtime-observation flag | a concrete binding manifest must be digest-bound and distinguish formed bindings from observed runtime guarantees |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/generatable-operation-patterns-v1/operation-patterns.json` | current two pattern entries and four prerequisite classes | current inventory is authored data, not compiler output |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/generatable-operation-patterns-v1/product-capability.json` | availability, candidate, stability, and effect policies | all four prerequisites must close; stable maturity remains owner-controlled |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/generatable-operation-patterns-v1/business-ontology.json` | pattern, meta-type, binding, generator, availability, and stability terms and edges | establishes the capability-local business vocabulary to extend rather than replace |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/pattern-registry.ts` | current runtime registry and availability derivation | registry rows are duplicated in TypeScript and therefore can drift from the JSON inventory |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/model.ts` | normalized domain and action shapes | actions have no effect reference and the compilation authority effect is currently `none` |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/parser.ts` | textual section grammar and action-row grammar | neither `effect` sections nor `performs` action rows exist |
| `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/render-typescript.ts` | TypeScript artifact generation | the existing renderer is the later integration point for generator dispatch |

Ambient ontology changes outside this selector set are diagnostic. A changed, missing, or ambiguous selected dependency fails the corresponding compilation closed.

## Intended semantic pipeline

```text
admitted meta-type baseline
  + formed integration-binding manifests
  + explicit pattern intents
  + registered generators
  + executable conformance receipts
      -> registry compiler
      -> candidate architecture-pattern entries with causal blockers
      -> available language entries only when every required dependency closes

explicit AlchLang effect declaration
  + explicit action performs edge
  + available transactional-outbox/sqlite pattern
      -> provider-specific generator
      -> SQLite adapter + migration + worker + executable conformance evidence
```

“New meta-type or binding becomes available through the language” means it becomes discoverable as candidate input. It does not become generatable until an explicit pattern intent, generator, and conformance dependency close. It never becomes `stable` solely because compilation succeeds.

## Layering Method

- Minimum proof: prove deterministic registry compilation with one available and one blocked pattern.
- Decision-first: each layer answers one important question before provider-specific implementation expands.
- Progressive hardening: registry authority, language semantics, and provider behavior are separate improvements.
- Non-regression: later layers retain deterministic output, fail-closed blockers, and candidate/stable separation.
- Evidence-gated promotion: the next layer starts only after current-layer exit evidence exists.

## Layer Boundary Heuristic

A layer ends at the smallest slice that changes what the team can responsibly decide next.

```text
After this layer, we know whether the next semantic or provider-specific commitment is justified by executable evidence.
```

```text
Layer value = decision unlocked + user-visible outcome + risk reduced
Layer cost = implementation time + verification time + coordination burden

Stop the layer when the next unit of work has lower value-per-cost for the current decision than starting the next decision layer.
```

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | User/Operator Outcome | Risk Reduced | Main Cost Drivers | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (POC) | After this layer, we know whether availability can be compiled deterministically from exact dependency records without a handwritten runtime registry. | Compile the existing `operation-port` and `transactional-outbox` intents into one deterministic candidate registry and receipt. | `domainspec patterns` explains the same available/blocked frontier from generated data. | Manual duplication and fail-open status interpretation. | Registry contract, source adapters, digest checks, fixtures, CLI wiring. | Continue if replay is byte-stable and all negative fixtures fail closed; otherwise narrow the source contract. |
| L1 | After this layer, we know whether newly admitted meta-types and newly formed bindings can enter discovery repeatably without becoming automatically available or stable. | Explicit intent, generator, and conformance registries with incremental candidate compilation and ontology projection. | A new eligible source is visible with causal closure or blockers after one registry build. | Hidden coupling, accidental Cartesian pairing, stale receipts, and automatic maturity escalation. | Registry schemas, provenance closure, lifecycle tests, ontology projection, migration from authored rows. | Continue if additions and invalidations are deterministic and stability remains owner-controlled. |
| L2 | After this layer, we know whether authors can express effects and action-to-effect execution intent without semantic inference from names. | Parse, validate, lower, and graph one `effect TransactionalOutbox` plus one `performs` edge, while leaving execution provider-neutral. | Authors can inspect explicit effects, bindings, obligations, and blockers in generated artifacts. | Inferred side effects, undeclared effects, unresolved binding authority, and incomplete traceability. | Grammar, normalized model, schemas, graph edges, diagnostics, compatibility tests. | Continue if explicit effect closure is preserved end to end and legacy inputs do not acquire effects. |
| L3 | After this layer, we know whether generated SQLite code actually guarantees atomic business mutation plus Outbox insertion and bounded delivery behavior under failure. | Generate and execute a SQLite migration, adapter, dispatcher worker, and conformance suite for one operation. | `domainspec build` emits runnable transactional Outbox code whose guarantees and limits are testable. | Split-brain writes, lost events, duplicate processing assumptions, crash/restart ambiguity, and descriptor-only generation. | SQLite binding, code generation, transactions, worker lifecycle, failure injection, executable tests. | Expose `transactional-outbox/sqlite` only if generator and conformance receipts close; otherwise keep it blocked. |

## Capability or Scope Progression

| Capability / Scope Area | L0 (POC Proof) | L1 (First Hardening) | L2 (Explicit Semantics) | L3 (SQLite Provider Proof) |
| --- | --- | --- | --- | --- |
| Registry inputs | Frozen baseline, provider-neutral profile, two explicit intents | Versioned intent, binding, generator, and conformance registries | Effect and `performs` requirements join registry prerequisites | Concrete SQLite binding manifest and runtime guarantee requirements |
| Registry outputs | Deterministic candidate registry and receipt | Incremental candidates, blocker graph, ontology projection | Effect-aware availability and traceability | Available SQLite pattern only after executable closure |
| Language | Existing syntax unchanged | Pattern discovery commands hardened | `effect` section and action `performs` row | `domainspec build` dispatches the closed provider generator |
| Generation | Existing operation-port renderer only | Generator identity and digest resolution | Provider-neutral effect plan/port only | Concrete SQLite adapter, migration, worker, and tests |
| Governance | Candidate/available/stable remain distinct | Owner-controlled stable promotion and stale-evidence invalidation | Undeclared or unresolved effects reject compilation | Observed guarantees remain narrower than formed binding and generated source claims |
| Evidence | Replay, schema, negative fixtures | Add/change/remove lifecycle matrix | Parser/lowering/graph compatibility matrix | Atomicity, rollback, delivery, idempotency, and restart tests |

## Layer Definitions

| Layer | Objective | Builds On | Included Scope | Explicitly Deferred | Exit Evidence | Value/Cost Notes |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (POC) | Replace runtime registry duplication with deterministic compilation. | Existing candidate pattern capability | Exact source selection, explicit intents, closure evaluator, generated registry, receipt, CLI read path. | New grammar, SQLite code, stable promotion, packaging/publication. | Byte-identical replay; schema PASS; available/blocked CLI snapshots; digest/status negative tests. | It proves the control plane before expanding language or effects. |
| L1 | Make candidate discovery extensible and governance-safe. | L0 | Separate intent/generator/conformance registries, dependency graph, invalidation, candidate ontology entries, lifecycle tests. | Effect execution and any provider runtime. | Add/change/remove fixtures; stale receipt rejection; no Cartesian generation; owner-stability invariant tests. | It validates the “new types/bindings appear safely” product promise. |
| L2 | Add explicit effect intent to AlchLang. | L1 | `effect`, `performs`, normalized references, validators, lowering, graph edges, docs, diagnostics, compatibility. | Concrete persistence library, database I/O, worker execution, retries. | Positive and negative textual fixtures; emitted graph edges; legacy no-effect regression; registry-resolution tests. | It removes semantic inference before any side-effectful generator exists. |
| L3 | Prove one concrete transactional Outbox provider. | L2 | SQLite binding, migration, transactional adapter, worker, deterministic generation, executable failure tests. | PostgreSQL/cloud brokers, exactly-once claims, distributed transactions, deployment, stable promotion. | Real SQLite integration suite; rollback and crash/restart evidence; generated-file snapshot; closed conformance receipt. | A single provider is enough to prove implementation-bearing generation without premature platform scope. |

## Layer 0 - Minimum Working Unit POC

### Goal

Create a deterministic registry compiler that consumes exact selected sources and emits the current two candidate entries without handwritten duplication in `pattern-registry.ts`.

### Proposed artifacts

All paths below are proposed implementation targets, not authorized mutations:

- `extensions/generatable-operation-patterns-v1/registry/pattern-intents.json` — explicit pairings; prevents a meta-type × binding Cartesian product.
- `extensions/generatable-operation-patterns-v1/registry/generators.json` — generator identity, target, entry point, source digest, and status.
- `extensions/generatable-operation-patterns-v1/registry/conformance.json` — evidence identity, subject digest, result, and claim ceiling.
- `extensions/generatable-operation-patterns-v1/registry/registry-compiler.config.json` — exact input refs, selectors, expected digests, and output paths.
- `implementation/src/registry-compiler.ts` — pure normalization, dependency resolution, blocker derivation, ordering, and digest construction.
- `implementation/src/registry-source-adapters.ts` — bounded readers for the admitted baseline, binding manifests, and local registries.
- `extensions/generatable-operation-patterns-v1/generated/operation-patterns.generated.json` — deterministic candidate output.
- `extensions/generatable-operation-patterns-v1/generated/registry-compilation.receipt.json` — source digests, result digest, diagnostics, and authority ceiling.
- `implementation/src/generated/operation-patterns.generated.ts` — build-time TypeScript projection consumed by CLI/package code.
- `implementation/test/registry-compiler.test.ts` — replay, ordering, closure, and fail-closed tests.
- `implementation/test/fixtures/registry-compiler/` — closed, blocked, drifted, duplicated, unknown-status, and stale-evidence fixtures.

### Closure rule

For a pattern intent `p`, generation availability is:

```text
available(p) :=
  admitted_meta_type(p.meta_type_ref)
  AND formed_binding(p.integration_binding_ref)
  AND closed_generator(p.generator_ref, p.input_digests)
  AND passing_conformance(p.conformance_ref, p.generator_digest, p.binding_digest)
```

Any `false`, missing, unknown, digest-mismatched, or ambiguous operand yields `blocked` plus a causal blocker. `architecture_pattern_status` is copied from an owner-controlled record; it is never derived from availability.

### Included Scope

- Consume the admitted meta-type selector and the provider-neutral integration profile through exact configured refs and digests.
- Consume only explicitly paired pattern intents.
- Validate generator and conformance subject digests rather than trusting labels such as `closed` or `PASS` alone.
- Emit sorted JSON and a TypeScript projection from the same normalized in-memory value.
- Make `domainspec patterns`, `--available`, `--blocked`, and `pattern <id>` read the generated registry.
- Keep blocked candidates visible, diagnostic, and non-generatable.

### Explicitly Deferred Beyond L0

- Automatic scanning of arbitrary repository files.
- Automatic pairing of every meta-type with every binding.
- `effect` or `performs` grammar.
- SQLite adapter, migration, worker, or runtime execution.
- Stable promotion, ontology admission, publication, deployment, or external effects.

### Exit Evidence

- Two consecutive registry builds from identical inputs produce byte-identical generated registry and result digest.
- The generated registry validates against its closed schema and contains exactly one available and one blocked current candidate.
- Removing or drifting each of meta-type, binding, generator, and conformance inputs blocks the affected entry with the expected causal code.
- Unknown status, duplicate ID, selector ambiguity, stale receipt, and digest mismatch fail closed.
- CLI tests prove it reads generated output; a guard test rejects reintroduction of handwritten registry rows.

### Promotion Decision

- Continue when: exact replay, negative fixtures, and CLI parity all pass and the compiled registry has no hidden runtime fallback.
- Pivot when: upstream sources cannot provide stable selector/digest contracts; narrow L0 to a canonical export adapter before continuing.
- Stop when: availability cannot be decided without inferred semantics or an authority claim absent from the selected sources.

## Layer-by-Layer Improvement Model

### Layer 1 Improvements Over L0

- Added scope: versioned registries and an explicit lifecycle for adding, invalidating, and removing candidate patterns.
- Hardening delta: no Cartesian inference; evidence binds to exact generator and binding digests; stale dependencies regress availability to blocked.
- Verification delta: lifecycle matrix for new meta-type, new binding, generator registration, conformance closure, dependency drift, and removal.
- Prior guarantees preserved: deterministic replay, generated-only CLI source, causal blockers, and owner-controlled stability.
- Ontology delta: add `Pattern Intent`, `Generator Registration`, `Conformance Evidence`, and `Registry Compilation` nodes with typed `pairs`, `requires`, `evaluates`, `blocks`, `emits`, and `governs` edges. Emitted architecture-pattern entries remain candidates.

### Layer 2 Improvements Over L1

- Added scope: textual `effect <EffectId>` sections and `performs <EffectId> [using <BindingId>]` action rows.
- Hardening delta: every effect has a declared kind, read/write/effect obligations, failure continuation, binding requirements, and authority boundary; every `performs` reference resolves explicitly.
- Verification delta: parser, schema, validator, lowering, graph, traceability, unsupported-residue, and backward-compatibility tests.
- Prior guarantees preserved: no availability from names, no undeclared effect, and no generated provider implementation from blocked entries.
- Suggested minimal syntax:

  ```text
  effect PersistOrderWithOutbox:
    pattern transactional-outbox
    binding sqlite-transactional-outbox
    writes Order, OutboxMessage
    emits OrderCommitted
    guarantee atomic-state-and-outbox
    on-failure rollback

  action CommitOrder:
    subject Order
    performs PersistOrderWithOutbox
    boundary order-write-boundary
  ```

- Required compiled edges: `Action --performs--> Effect`, `Effect --instantiates--> GeneratableOperationPattern`, `Effect --uses--> IntegrationBinding`, `Effect --writes--> Entity`, `Effect --emits--> Event`, and `GenerationAvailability --constrains--> Generator`.

### Layer 3 Improvements Over L2

- Added scope: an exact TypeScript/SQLite generator for one explicit transactional Outbox effect.
- Hardening delta: one database transaction contains the business mutation and pending Outbox insert; worker dispatch is separate, retryable, observable, and honest about at-least-once delivery.
- Verification delta: real temporary SQLite database, failure injection before commit and after commit/before acknowledgement, restart recovery, duplicate delivery, idempotent marking, and schema migration tests.
- Prior guarantees preserved: effects stay explicit, blocked patterns emit no implementation, input/output digests stay traceable, and `stable` remains a separate owner decision.
- Required generated artifacts:

  - `domain.outbox.port.ts`
  - `domain.outbox.sqlite.ts`
  - `domain.outbox.migration.sql`
  - `domain.outbox.worker.ts`
  - `domain.outbox.test.ts`
  - `domain.generation-manifest.json`

- Required behavioral boundary: the generator may claim atomic local state-and-outbox persistence when proven. It may not claim exactly-once delivery, successful external publication, deployment, or production behavior.

## Implementation Wave Backbone

| Wave | Target Layer | Goal | Key Artifacts | Verification |
| --- | --- | --- | --- | --- |
| W0 | L0 | Deterministic registry compiler POC | Registry schemas/config, compiler, generated registry/receipt, CLI projection, negative fixtures | Typecheck; registry unit tests; two-build digest comparison; CLI snapshots |
| W1 | L1 | Extensible candidate discovery and ontology projection | Intent/generator/conformance registries, lifecycle compiler, ontology nodes/edges, invalidation receipts | Add/change/remove matrix; stale-digest tests; schema and ontology validation; owner-stability invariant |
| W2 | L2 | Explicit effect semantics from text through compiled graph | Product capability revision, business ontology revision, DomainSpec authored source, parser/model/validator/lowering/renderer changes, fixtures | D65 predecessor validation; grammar and graph tests; legacy regression; unresolved/blocked reference rejection |
| W3 | L3 | Concrete `transactional-outbox/sqlite` generation | SQLite binding manifest, generator, migration, adapter, worker, exact implementation binding candidate, conformance suite | Real SQLite transaction tests; failure injection; deterministic generated bytes; binding and conformance digest closure |

## D65 construction and acceptance gates

Each implementation-bearing wave must respect this predecessor order:

```text
canonical definitions
  -> Product Capability
  -> capability-local business ontology
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and system ontology
  -> exact implementation binding
  -> conformance evidence
```

Gate conditions:

1. W0 cannot claim a registry capability adopted until its Product Capability and ontology predecessors are current for the new compiler semantics.
2. W1 may emit candidate pattern and ontology entries; it cannot admit them or mark them stable.
3. W2 cannot begin implementation until the definitions of `Effect`, `Performs`, `Integration Binding`, and their typed edges are accepted for the authorized scope.
4. W3 requires an exact `sqlite-transactional-outbox` binding manifest and provider-specific contract. A provider-neutral profile alone is insufficient.
5. The W3 exact implementation-binding candidate must be authored and self-validated by exactly one bounded native helper through `CA2-ROUTE-DELEGATE`; the parent must independently join it and own final claims.
6. Closing generator tests does not itself close conformance. Conformance evidence must bind the generated bytes, binding digest, migration, and runtime test surface.
7. Availability can change from `blocked` to `available` after technical closure. Promotion from `candidate` to `stable` requires a separate owner decision and is outside this plan's authority.

## Non-Regression Guardrails

- Never infer an effect, provider, binding, permission, retry policy, or maturity state from an identifier or event name.
- A missing, unknown, stale, digest-mismatched, or ambiguous prerequisite always blocks generation.
- Registry discovery remains visible even for blocked candidates; blocked candidates generate diagnostics, not implementation code.
- Explicit pattern intents prevent accidental meta-type × binding Cartesian expansion.
- Authored sources and compiled outputs live at separate paths; generated artifacts never overwrite their authority inputs.
- Availability, candidate registration, owner acceptance, stable promotion, release, deployment, and execution authority remain distinct states.
- Formed bindings and generated source shapes do not imply observed provider runtime guarantees.
- Legacy AlchLang inputs without `effect` / `performs` remain effect-free.
- Business mutation plus Outbox insertion is atomic locally; external dispatch remains separate and at-least-once unless stronger evidence is introduced later.
- All generated artifacts carry source, generator, binding, and conformance identities or digests sufficient for replay and invalidation.

## Open Decisions

- Canonical home for the integration-binding registry: reuse a DomainSpec v2 binding-manifest index or introduce a bounded AlchLang projection that references it without duplicating authority.
- Exact admitted status vocabulary and machine-checkable owner-decision selector for meta-types and bindings; labels alone are insufficient.
- SQLite library and minimum supported Node runtime; selection must respect the bound construction toolchain and packaging target.
- Transactional Outbox delivery contract: initial recommendation is at-least-once dispatch with stable message identity and consumer idempotency obligations.
- Whether `performs` may omit `using <BindingId>` when exactly one available binding exists; initial recommendation is no implicit provider selection in v1.
- Receipt invalidation policy when conformance passes but any source, generator, binding, or generated-byte digest changes.

## Explicitly out of scope

- Automatic stable architecture-pattern admission.
- Generic generation for arbitrary effects or providers.
- PostgreSQL, cloud queues, Kafka, or distributed transactions.
- Exactly-once delivery claims.
- Production credentials, deployment, external message publication, package publication, or release.
- Retrofitting effects into legacy actions by heuristics.
