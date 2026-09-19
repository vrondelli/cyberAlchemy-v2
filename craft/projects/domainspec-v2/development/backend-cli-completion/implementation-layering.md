---
title: DomainSpec v2 Backend-Complete CLI Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner
scope: capability
authority_effect: none
---

# DomainSpec v2 Backend-Complete CLI Implementation Layering

This roadmap decomposes the remaining backend work into atomic, dependency-ordered tasks. It distinguishes a statically complete backend CLI, a backend that can execute through the CLI, a durable provider-backed backend, and later formal/release assurance.

The plan does not authorize implementation, accept a new baseline, prove conformance, or authorize publication, release, or deployment.

## Context

- Target: DomainSpec v2 backend-complete CLI.
- Current state: partially implemented brownfield system.
- Primary operator: a developer authoring and executing a DomainSpec backend project.
- Primary constraint: preserve exact source-to-graph-to-generation traceability while replacing placeholder semantics with executable behavior.
- Current denominator: 13 backend meta-types, 39 frozen language realization rows, 17 backend/general relationships, 31 total active relationship signatures, and 45 DS-D8 obligation IDs.
- Current claim ceiling: project-local `@10` formation, generation, and static-conformance baseline with bounded formal and fixture evidence.

Source references:

- `projects/domainspec-v2/development/completeness-audit/2026-09-02-current-state/findings.md`
- `projects/domainspec-v2/impl/cli/src/cli/main.ts`
- `projects/domainspec-v2/impl/cli/src/input/project-model.ts`
- `projects/domainspec-v2/impl/cli/src/meta-types/catalog.ts`
- `projects/domainspec-v2/impl/cli/src/generation/generators.ts`
- `projects/domainspec-v2/impl/cli/src/formalization/projection.ts`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`

Layer-local plans and executable planning surface:

- `layers/L0-semantic-pattern-proof/implementation-layering.md`
- `layers/L0-semantic-pattern-proof/execution-dag.json`
- `layers/L0-semantic-pattern-proof/execution-dag.md`
- `layers/L1-static-backend-completion/implementation-layering.md`
- `layers/L2-cli-runtime/implementation-layering.md`
- `layers/L3-durable-provider-runtime/implementation-layering.md`
- `layers/L4-formal-independent-assurance/implementation-layering.md`
- `orchestration-control/implementation-layering.md`
- `orchestration-control/composite-control-plan.json`
- `orchestration-control/dag-mapping.md`

Every layer preserves the CAV2-D65 sequence: canonical definitions → adopted Product Capability → adopted capability-local business ontology → exact DomainSpec v2 authored source → deterministic compiled graph/system ontology → exact implementation binding → conformance evidence. Baseline `domainspec-meta-types-current-implemented@10` is the immutable predecessor and is never a mutation target.

## Completion Contracts

### Milestone A — Static backend CLI complete

- All 13 backend meta-types have faithful authored semantics.
- All 17 backend relationships enforce every applicable DS-D8 obligation.
- TypeScript, Python, and Rust generation works for every backend type.
- The CLI can author, compile, generate, formalize, and verify a whole backend project.
- One fixture contains all 13 backend types and all 17 backend relationships.
- Positive, hostile, source-sensitivity, native-language, and clean-package tests pass without hidden skips.

### Milestone B — Backend running in CLI

- `domainspec run` compiles and executes the complete backend fixture through a deterministic in-memory provider.
- Every backend meta-type and relationship participates in at least one observed runtime path.
- Runtime receipts remain distinct from static-generation and formalization receipts.
- One independent, non-generated implementation target passes semantic conformance.

### Milestone C — Durable backend complete

- A selected PostgreSQL provider stores state and outbox rows atomically.
- A relay publishes through one selected broker/provider.
- Unknown commit, idempotency, leases, fencing, retries, quarantine, terminal recording, and restart recovery are independently observed.
- The durable provider is selectable through the same CLI runtime surface.

## Layering Method

- Minimum proof: finish Rule first as the smallest formerly-thin source-to-CLI semantic vertical.
- Decision-first: every layer answers one explicit decision question.
- Progressive hardening: later layers preserve earlier formation and generation guarantees.
- Evidence-gated promotion: no downstream task starts before its declared predecessors meet their exit evidence.
- Boundary heuristic: stop a layer when its next unit adds less value to the current decision than starting the next decision layer.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator outcome | Promotion decision |
|---|---|---|---|---|
| L0 | After this layer, we know whether a formerly thin meta-type can become a faithful authored-to-generated CLI vertical. | Rule end to end | `add rule`, compile, generate, and verify | Continue only if the pattern is reusable by the remaining thin types. |
| L1 | After this layer, we know whether all backend semantics and relationships are statically complete through the CLI. | All 13 types, 17 relationships, whole-project build | Complete backend source can be generated and verified | Continue only with a clean aggregate receipt and exhaustive backend obligation coverage. |
| L2 | After this layer, we know whether generated backend semantics execute coherently through the CLI. | In-memory runtime and independent target | `domainspec run` executes a full backend example | Continue only if runtime observations are independent of generator self-checks. |
| L3 | After this layer, we know whether the backend survives durable transaction, delivery, concurrency, and restart failures. | PostgreSQL plus selected publisher | Durable backend execution | Continue only after the failure matrix passes from fresh processes. |
| L4 | After this layer, we know whether compiler/formal/runtime claims have independent assurance. | Checked interchange, Lean refinement, independent conformance | Certified backend candidate | Promotion remains separate from release authorization. |

## Dependency Backbone

```text
B00 backend contract
 └─ B01 clean baseline
     └─ B02 semantic IR framework
         └─ B03 generic authoring framework
             └─ B04 finish Rule
                 ├─ B05 finish Query ───────────┐
                 ├─ B06 finish Calculation ─┐  │
                 └─ B07 finish Mapping ─────┼──┤
                                           │  │
                           B04 + B06 ── B08 finish Policy
                                              │
                 B05 + B07 + B08 + existing deep types
                                              │
                                      B09 complete backend corpus
                                              │
                                      B10–B12 DS-D8 closure
                                              │
                                      B13 compile certificate
                                              │
                                      B14 whole-project generation
                                              │
                                      B15 aggregate CLI verification
                                              │
                                      R01–R05 CLI runtime
                                              │
                                      R06–R16 durable runtime
```

## L0 — Semantic Pattern Proof

### B00 — Freeze the backend requirement contract

- Outcome: one current manifest identifies baseline `@10`, 13 backend types, 17 backend relationships, applicable DS-D8 obligations, Node 26.8.1, and deferred UI/runtime scope.
- Exit evidence: no active backend task depends on the stale 4/3, 13/16, `@2`, `@3`, or Node 24 denominators.

### B01 — Restore a clean reproducible baseline

- Depends on: B00.
- Outcome: reconcile the reported 25/847 baseline drift, four formalization bindings, workspace-dependent test discovery, and validator disagreement.
- Exit evidence: baseline, formalization, CLI, clean-package, and native-language checks run from the documented root without hidden duplicates or cancelled tests.

### B02 — Introduce the backend semantic IR

- Depends on: B01.
- Outcome: authored meta-type bodies decode into typed semantic structures shared by validators and generators.
- Exit evidence: generators no longer interpret arbitrary raw body objects independently; malformed and semantically incomplete IR is rejected before generation.

### B03 — Build the generic authoring framework

- Depends on: B02.
- Outcome: `domainspec add <type>` shares deterministic path handling, safe node construction, manifest refresh, atomic publication, and option validation.
- Exit evidence: one generic dispatcher supports pluggable type-specific argument decoders without weakening the current Operation authoring guarantees.

### B04 — Finish Rule end to end

- Depends on: B03.
- Included scope:
  - typed inputs;
  - a deterministic Boolean predicate model;
  - referenced-field and referenced-node validation;
  - TypeScript, Python, and Rust evaluation;
  - `add rule`;
  - positive, invalid-shape, semantic-hostile, and source-sensitivity cases.
- Exit evidence: all three generated languages agree on the same positive and negative rule corpus.
- Promotion decision: use the Rule vertical as the pattern for B05–B08 only if it avoids arbitrary embedded source code and remains source-determined.

## L1 — Static Backend Completion

After B04, B05, B06, and B07 may run in parallel. B08 waits for both B04 and B06.

Every `finish <type>` task must deliver one indivisible vertical:

1. Authored body contract.
2. TypeScript decoder and validator.
3. Typed semantic IR.
4. TypeScript generator.
5. Python generator.
6. Rust generator.
7. `add <type>` CLI support.
8. Positive fixture.
9. Invalid-shape fixture.
10. Semantic hostile fixture.
11. Source-sensitivity test.
12. Cross-language executable equivalence test.
13. Instantiation and receipt verification.

### B05 — Finish Query

- Depends on: B04.
- Semantics: declared source entities, typed inputs, filters, projection, optional ordering/pagination, output shape, and enforced read-only behavior.
- Exit evidence: Query no longer returns an unconditional copy of state; undeclared reads and mutation attempts fail.

### B06 — Finish Calculation

- Depends on: B04.
- Semantics: typed inputs, result type, expression/operator model, numeric and rounding rules, error behavior, and no undeclared state effects.
- Exit evidence: Calculation no longer reduces every numeric list with addition; all three languages agree on edge and error cases.

### B07 — Finish Mapping

- Depends on: B04.
- Semantics: typed source and target, explicit field mapping, conversions, defaults, missing-field behavior, and total/partial status.
- Exit evidence: Mapping no longer wraps or echoes the input generically; incompatible source/target mappings fail before generation.

### B08 — Finish Policy

- Depends on: B04 and B06.
- Semantics: ordered selection conditions, typed strategies, default behavior, referenced Operation or Calculation targets, and deterministic selection evidence.
- Exit evidence: Policy no longer chooses a strategy by caller-supplied numeric index alone; ambiguous and uncovered selections fail closed.

### B09 — Build the complete backend corpus

- Depends on: B05–B08 and non-regression closure for Entity, Value Object, Enum, Operation, Workflow, Interface, Event, and State Machine.
- Outcome: one realistic project contains all 13 backend types and all 17 backend relationships.
- Exit evidence: every type and relationship is reachable from at least one named backend scenario.

### B10 — Generate backend obligation applicability

- Depends on: B09.
- Outcome: derive the exact applicable obligation denominator from the 17 backend signatures rather than a handwritten test list.
- Exit evidence: every declared backend obligation ID is classified as applicable or inapplicable with a source selector and reason.

### B11 — Finish backend relationship enforcement

- Depends on: B10.
- Outcome: executable endpoint, scope, multiplicity, inverse-collapse, projection, duplicate, and deprecation enforcement for every applicable backend obligation.
- Exit evidence: no declared backend obligation is represented only as authority metadata.

### B12 — Add exhaustive relationship hostile tests

- Depends on: B11.
- Outcome: one positive witness and one exact-cause killed mutant per applicable backend obligation.
- Exit evidence: removing or suppressing any enforcement branch makes its named hostile test fail.

### B13 — Emit a compiled-graph certificate

- Depends on: B12.
- Outcome: successful compilation emits a durable certificate containing source-manifest digest, graph digest, node/edge denominators, applicable obligation IDs, witness outcomes, compiler/tool versions, and authority ceiling.
- Exit evidence: certificate suppression, graph omission, or stale-source mutants fail.

### B14 — Add whole-project generation

- Depends on: B13.
- Outcome: `instantiate --all` or `build` generates all backend nodes for one language atomically and emits a project-level receipt.
- Exit evidence: partial publication cannot be reported as success; repeat runs are deterministic.

### B15 — Add aggregate CLI verification

- Depends on: B14.
- Outcome: one command validates source, compiled graph, obligations, generated artifacts, receipts, formalization currentness, and clean-package replay.
- Exit evidence: no required check is skipped, cancelled, fixture-substituted, or inferred from another check.

Milestone A is reached only after B15.

## L2 — Backend Running Through the CLI

### R01 — Define the runtime invocation contract

- Depends on: B15.
- Outcome: stable request, state, result, event, error, clock, identity, and provider interfaces.
- Exit evidence: runtime invocation does not import generator internals as its behavioral oracle.

### R02 — Implement the in-memory reference provider

- Depends on: R01.
- Outcome: deterministic in-process Entity storage, Query, Operation, Event, Workflow, and State Machine execution.
- Exit evidence: the complete backend corpus runs without external infrastructure and produces a runtime receipt.

### R03 — Add `domainspec run`

- Depends on: R02.
- Outcome: accept source root, entry Operation or Query, input JSON, and provider profile; compile, generate/load, execute, and return a runtime receipt.
- Exit evidence: invalid input, unknown entry points, and runtime failures return typed nonzero results.

### R04 — Execute all backend types and relationships

- Depends on: R03.
- Outcome: the complete backend corpus exercises every type and backend relationship at least once.
- Exit evidence: a coverage receipt binds observed runtime cases to the B09 denominator.

### R05 — Adopt one independent non-generated target

- Depends on: R03.
- Outcome: conformance compares DomainSpec behavior with separately written product code rather than the same generator's expected bytes.
- Exit evidence: semantic mutants undetectable by provenance-marker comparison are rejected.

Milestone B is reached only after R04 and R05.

## L3 — Durable Provider Runtime

These tasks remain serial because each consumes the durability guarantee established by its predecessor.

| ID | Atomic outcome | Depends on | Exit evidence |
|---|---|---|---|
| R06 | Select and bind PostgreSQL repository and transaction provider | R05 | Migration, schema, repository, transaction, and provider profile run in integration tests. |
| R07 | Implement atomic state and outbox persistence | R06 | State and outbox commit or roll back in one transaction across crash seams. |
| R08 | Implement outbox relay and selected publisher | R07 | Durable rows are claimed, published, and attempt-recorded without deletion-before-ack. |
| R09 | Implement unknown-commit reconciliation | R08 | Timeout after provider success preserves occurrence identity and converges safely. |
| R10 | Implement idempotency and consumer deduplication | R09 | Duplicate publication or delivery causes one observable consumer effect. |
| R11 | Implement leases and fencing | R10 | Concurrent workers cannot own one item; stale workers are rejected. |
| R12 | Implement persisted retries | R11 | Backoff, next-attempt time, and attempt history survive restart. |
| R13 | Implement quarantine and controlled replay | R12 | Poison work reaches a durable terminal location and replays with traceable identity. |
| R14 | Implement workflow restart recovery | R13 | A fresh process resumes without incorrectly repeating completed effects. |
| R15 | Add provider fault tests | R14 | Crash-before/after-commit, publish timeout, duplicate delivery, lease expiry, stale worker, poison event, and restart all have observed outcomes. |
| R16 | Expose durable provider through `domainspec run` | R15 | The CLI selects `in-memory` or `postgres` and reports only actually observed runtime guarantees. |

Milestone C is reached only after R16.

## L4 — Formal and Independent Assurance

F01 may begin after B13 and can progress in parallel with L3. F06 may begin after B15.

| ID | Atomic outcome | Depends on |
|---|---|---|
| F01 | Define canonical checked compiled-graph interchange | B13 |
| F02 | Decode the interchange independently in Lean | F01 |
| F03 | Prove node, edge, source, and obligation preservation | F02 |
| F04 | Add node, edge, and obligation omission mutants | F03 |
| F05 | Execute Lean through a pinned clean CI toolchain | F04 |
| F06 | Bind frozen provider semantics to generator output | B15 |
| F07 | Close EVF/BTE behavioral and independent-consumer evidence | F05 and F06 |
| F08 | Add runtime parity checks for TypeScript, Python, and Rust | R16 |

## Serial and Parallel Rules

Strictly serial:

1. B00 → B01 → B02 → B03 → B04.
2. B04 + B06 → B08.
3. B09 → B10 → B11 → B12 → B13 → B14 → B15.
4. R01 → R02 → R03.
5. R06 → R07 → R08 → R09 → R10 → R11 → R12 → R13 → R14 → R15 → R16.
6. F01 → F02 → F03 → F04 → F05.

Safe parallelism:

- B05 Query, B06 Calculation, and B07 Mapping after B04.
- Existing deep-type non-regression refresh alongside B05–B08 after B01.
- R04 and R05 after R03.
- F01–F05 alongside the durable-runtime lane after B13.
- F06 alongside R01–R05 after B15.

Required joins:

- B09 waits for B05, B06, B07, B08, and the eight existing deep-type non-regression checks.
- Milestone B waits for R04 and R05.
- F07 waits for both the Lean proof lane and the generator/provider equivalence lane.
- F08 waits for the durable runtime.

## Non-Regression Guardrails

- The source project remains the semantic input; generated artifacts never become silent authority.
- Operation keeps guard-before-mutation, declared read/write/effect sets, explicit failure continuation, and state-plus-outbox intent.
- Workflow keeps dependency closure, deterministic recovery-intent identity, and explicit failure continuation.
- State Machine keeps source-state, guard, transition, and event-intent enforcement.
- All generators remain deterministic for identical source, baseline, language, and integration selection.
- Static, formal, runtime, conformance, and release claims remain separate.
- UI types and relationships cannot enter the backend denominator implicitly.
- No passing focused test may substitute for the aggregate exit evidence of its layer.

## Explicitly Deferred

- UI meta-types and 14 UI/cross-layer relationships.
- Live monitoring, load, fault, canary, deployment, and rollback adapters.
- Stress, soak, capacity, and production-environment admission.
- Body War production pilot.
- Public packaging, release, deployment, and external authorization.

## Recommended Next Move

Execute only B00 through B04 first. Rule is the minimum proof that the new semantic IR and generic authoring framework can replace a placeholder generator without breaking the existing compiler, three-language generation, receipts, or CLI safety. Do not fan out Query, Calculation, or Mapping until Rule supplies a reusable passing pattern.

## Claim Ceiling

This document is a planning candidate. Completion of any task proves only that task's stated exit evidence. Milestone A does not prove runtime behavior; Milestone B does not prove durable recovery; Milestone C does not prove formal refinement or production readiness; L4 does not authorize release.
