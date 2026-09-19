---
module: specified-first-order-logic-framework
version: 0.2.0
status: approved-for-execution
updatedAt: 2026-07-23
docType: implementation-layering
---

# Implementation Layering: DS-SFOL

## Target and Scope

- Target: bounded semantic test derivation in the private DomainSpec engine
- Scope: framework core plus two consumer-owned adoption proofs
- Current state: brownfield engine with a small expression evaluator and
  structural generation, but without a typed semantic framework or a node
  profile that carries structured logic
- Readiness profile: pilot

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (POC) | After this layer, we know whether independent node-clause accounting and bounded typed evaluation can work end to end. | One adopter-neutral structured node clause, independently denominated, validated, typed, evaluated, and exact-set checked. | Denominator, AST/contracts, structured decoder, typechecker, evaluator, core node-envelope seed. | Bindings, implementation execution, effects, canonical node adapter, adopters. | Negative denominator tests; typed exact-rational evaluation; one corpus clause. | Continue only if the denominator does not depend on generated artifacts and unsupported input fails closed. |
| L1 | After this layer, we know whether pure semantic test derivation is repeatable against real implementation symbols. | Multiple pure clauses with finite cases, exact-one bindings, raw observations, proof receipts, and replay. | Pure case derivation, binding registry, pure runner/emitter, exact proof join. | Effect traces, authoring integration, consumer adoption. | Positive, negative, mutation, and replay corpus results; exact identity equality. | Harden only if bindings contain no expected values and evaluator/target imports are separated. |
| L2 | After this layer, we know whether canonical node projection and effect observation are reliable. | One contained effectful clause projected from a canonical graph/manifest/build proof context. | Effect trace model, harness SPI, node-logic adapter, version/digest/bijection validation, residue reporting. | Cross-feature generality and packaging. | Containment tests; incomplete-trace failures; proof-context projection and stale-digest failures. | Scale only if pure guarantees remain intact, Markdown stays unreachable, and effects cannot exceed declared observation scope. |
| L3 | After this layer, we know whether the framework generalizes beyond one feature. | Financial Settlement and Agent Execution Orchestrator pass the unchanged core contract using a compatible successor node profile. | Two adopter node corpora/adapters, compatibility matrix, full replay and boundary audit. | Full FOL, external solvers, release/promotion, public packaging. | Both adopter reports, no-adopter-core vocabulary check, final verification receipt. | Declare pilot complete, remediate, or defer; do not infer release readiness. |

## Layer Gates

### L0 Entry

No feature-source approval is required. The framework corpus is
adopter-neutral and validation-owned.

### L1 Entry

L0 exact-set, type, evaluator, and negative dependency checks pass with
replayable evidence.

### L2 Entry

L1 proof receipts demonstrate a pure observation without any expected value in
the binding registry.

### L3 Entry

Each adopter source owner approves the clauses and fixture universes entering
its local admission manifest. The canonical node contract must also expose and
the compiler must preserve `domainspec-node-logic/v1`. Missing approval or an
incompatible node proof context blocks only adoption, not completed core
evidence.

## Non-Regression Guardrails

- A later layer cannot weaken exact identity/digest equality.
- The denominator remains unable to import generator or execution outputs.
- The evaluator remains unable to import the target under test.
- Bindings never gain expected values or correctness predicates.
- Effect support cannot redefine pure semantics.
- Core tests and vocabulary remain adopter-neutral.
- Structural BTE and semantic DS-SFOL evidence remain distinct.
- Direct Markdown extraction, direct node traversal, and second-graph
  reconstruction remain forbidden.

## Recommended Next Layer

- Next layer: L0
- Selected unit: `SWU-SFOL-001`
- Decision unlocked: whether a node/build-handle-owned exact denominator can
  expose missing, extra, duplicate, and stale clauses independently
- Major deferred scope: implementation binding, effect observation, feature
  source edits, solver integration, release, and promotion
