---
title: ORODI Ubiquitous-Language Implementation Layering
status: candidate
updatedAt: 2026-09-01
owner: CA2-PROJECT-CRAFT coordination with named semantic, profile, implementation, and conformance owners
scope: capability
---

# ORODI Ubiquitous-Language Implementation Layering

## Context

- Target: bind the ORODI ubiquitous language to DomainSpec and the operational-resilience implementation.
- Current state: brownfield candidate; implementation predates the D65 predecessor chain.
- Primary operator: Craft ORODI and DomainSpec owners reviewing exact successor bytes.
- Primary constraint: preserve immutable candidates and owner authority while removing language-to-code drift.
- Sources: exact Definition Pack, Ubiquitous Language, Product Capability manifest, ontology candidates, DomainSpec source, and implementation digests named in this package.

## Layering method

Each layer ends at the smallest slice that changes what the owners can responsibly decide. Earlier guarantees remain mandatory in every later layer.

## Layer decision table

| Layer | Decision question | Minimum working unit | Outcome | Risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 — successor preparation | After this layer, we know whether the language can be represented without rewriting frozen candidates or collapsing Entity and Value Object. | Exact owner packet, six typed nodes, profile/source amendment, migration contract, validator | Reviewable dependency-closed candidate | Semantic and immutability risk | Continue only on owner decisions bound to exact digests |
| L1 — admitted semantic source | After this layer, we know whether accepted definitions, Product Capabilities, business ontology, and DomainSpec source form one monotonic predecessor chain. | Successor admissions plus two-run graph/system-ontology materialization | Interpretable implementation target | Predecessor and profile ambiguity | Continue only when all predecessor states are admitted |
| L2 — compatibility migration | After this layer, we know whether code can adopt Evaluate/Receipt language without breaking current consumers. | M0 and M1 migration waves, focused and aggregate tests, exact binding | Language-conformant candidate implementation | Compatibility and naming drift | Continue only on independent conformance evidence |
| L3 — operational hardening | After this layer, we know whether the admitted implementation preserves ORODI boundaries under a separately authorized local exercise. | Commissioning envelope, observation, teardown, zero-residual evidence | Bounded runtime evidence | Runtime and restoration risk | Stop unless commissioning owner authorizes exact effects |

## Capability progression

| Area | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Meaning | candidate definitions and language | owner dispositions and admissions | code vocabulary conformance | runtime wording remains non-authoritative |
| DomainSpec | typed amendment nodes | deterministic admitted successor graph | exact code bindings | runtime projection only |
| Implementation | migration contract only | owner-authorized target | compatibility migration and tests | separately authorized exercise |
| Evidence | deterministic preparation receipt | predecessor and build receipts | independent conformance receipt | commissioning and teardown receipts |

## Layer definitions

### L0 — minimum working unit

Included: exact source bindings, identity-based type classification, candidate amendments, owner questions, migration waves, and deterministic validation.

Deferred: canonical definition promotion, capability adoption, ontology/profile admission, graph materialization, TypeScript mutation, conformance acceptance, commissioning, publication, and deployment.

Exit evidence: the successor validator passes twice with equal output and all bound source digests remain current.

### L1 — semantic and DomainSpec successor

Added scope: record independent owner decisions, create definition-complete successor capability and ontology candidates, compile the successor DomainSpec graph twice, and bind exact system-ontology bytes.

Prior guarantees preserved: frozen `001` records remain unchanged; Entity/Value Object do not collapse; all effects remain unauthorized.

### L2 — implementation language migration

Added scope: introduce preferred aliases, successor receipt schema, preferred CLI verb, compatibility tests, exact binding, and independent conformance review.

Prior guarantees preserved: current callers remain functional during the declared transition; evaluation never implies authorization.

### L3 — operational hardening

Added scope: only the exact local commissioning envelope authorized by its owner, including verified teardown and zero residual state.

Prior guarantees preserved: simulation cannot prove deployment, observation cannot actuate, and no local result authorizes production deployment.

## Non-regression guardrails

- Observation never becomes evidence merely by being recorded.
- `passed` never aliases valid, accepted, admitted, authorized, commissioned, or deployed.
- Frozen candidates are superseded, never rewritten.
- Shared spelling across representations never proves shared authority.
- The implementation remains non-actuating unless an exact effect envelope is separately authorized.

## Recommended next layer

Complete L0 validation, then route the exact packet to the named owners. L1 is blocked until their independent digest-bound decisions exist. The most important deferred scope is TypeScript mutation: doing it before L1 would create another brownfield implementation that predates its governing chain.
