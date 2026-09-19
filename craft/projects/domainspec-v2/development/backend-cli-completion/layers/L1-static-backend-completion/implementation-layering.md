---
title: L1 Static Backend Completion Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner
scope: capability-layer
authority_effect: none
---

# L1 Static Backend Completion

## Decision and Boundary

After this layer, we know whether all 13 backend meta-types and all 17 backend relationships are statically complete through one deterministic CLI pipeline.

- Minimum working unit: Query, Calculation, Mapping, and Policy completed from the L0 pattern, followed by a whole-backend corpus and DS-D8 closure.
- Operator outcome: author, compile, generate, formalize, and verify a complete backend project.
- Risk reduced: thin meta-types and relationship metadata can no longer masquerade as executable semantic coverage.
- Main costs: four complete semantic verticals, whole-project fixtures, exhaustive obligation applicability/enforcement, certificate emission, and aggregate verification.
- Boundary: actual runtime execution remains L2.

## CAV2-D65 Chain Accounting

| D65 stage | L1 requirement |
|---|---|
| Canonical definitions | Freeze exact DS-D1 selectors for 13 types and DS-D8 selectors for 17 backend relationships. |
| Product Capability | Reuse adopted `domainspec.meta-type-semantic-enforcement`; stop if requested behavior exceeds its scope. |
| Business ontology | Map each type and obligation to the adopted ontology chain; missing semantic facts remain `not_evaluable`. |
| Authored source | Add exact bodies and fixtures for Query, Calculation, Mapping, and Policy; preserve the eight deep types and L0 Rule. |
| Compiled graph/system ontology | Derive applicability for every backend obligation, enforce it, and emit a graph certificate. |
| Exact implementation binding | Treat each materially revised type/language binding candidate as a bounded one-helper authoring unit, followed by parent join and independent evidence. |
| Conformance evidence | Require per-obligation killed mutants, cross-language equivalence, aggregate CLI verification, and clean-package replay. |

Baseline `@10` remains an immutable predecessor, not the write target. Any successor is a separately identified candidate.

## Included Scope

- B05 Query, B06 Calculation, and B07 Mapping may execute in parallel only after L0 passes.
- B08 Policy waits for Rule and Calculation semantics.
- B09 whole-backend corpus; B10 applicability; B11 enforcement; B12 hostile closure.
- B13 compiled-graph certificate; B14 atomic whole-project generation; B15 aggregate CLI verification.

## Deferred Scope

- Runtime execution and providers.
- Durable transactions, outbox relay, concurrency, retries, and recovery.
- Full compiler-to-Lean refinement and release decisions.

## Exit Evidence and Promotion

- All 13 types and 17 relationships are reachable in the corpus.
- Every applicable obligation has an ID, predicate, positive witness, and exact-cause hostile witness.
- Every generated target is deterministic and executable; aggregate verification has no hidden skips.
- Promote to L2 only when B15 passes on one frozen candidate epoch. Otherwise remediate within L1.
