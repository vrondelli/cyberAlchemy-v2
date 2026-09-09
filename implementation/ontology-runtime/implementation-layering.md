---
title: Ontology Runtime Durable Reconciliation Implementation Layering
status: draft
updatedAt: 2026-08-31
owner: CyberAlchemy v2 Ontology Runtime owner
scope: system
---

# Ontology Runtime Durable Reconciliation Implementation Layering

This model layers a durable ontology runtime from candidate-epoch proof through
recovery and governed activation. Earlier guarantees remain mandatory in every
later layer.

## Context

- Target: durable ontology epoch storage and reconciliation
- Current state: read-only runtime with fail-closed currentness checks
- Primary operator: Ontology Steward
- Primary constraint: stale active registrations must remain blocked without
  preventing construction of a separate successor candidate
- Source references: `CAV2-D52`, `CAV2-D65`, `CAV2-D67`, the Ontology Product,
  and `CAV2-DECISION-ONTOLOGY-RUNTIME-DURABLE-RECONCILIATION-001`

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator outcome | Promotion evidence |
| --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether a stale registration can produce one immutable candidate epoch without rewriting admitted bytes. | Reconciliation preflight plus atomic content-addressed candidate bundle | A blocked ontology has a reviewable successor candidate | deterministic bundle identity, source preservation, immutable predecessor test |
| L1 | After this layer, we know whether candidate creation is repeatable and crash-safe. | Temporary staging, atomic rename, incomplete-write recovery, idempotent replay | Interrupted runs do not corrupt or duplicate epochs | crash injection and two-run replay tests |
| L2 | After this layer, we know whether validation and owner admission remain separate under reconciliation. | Native candidate validation, exact decision binding, activation proposal | Owner can review one exact candidate without implicit switching | verdict-fidelity, stale-decision, and forbidden-switch tests |
| L3 | After this layer, we know whether storage providers can evolve without changing epoch meaning. | Provider interface plus first local-filesystem binding and recovery export | Store can move while logical epoch identity remains stable | cross-provider round-trip and recovery evidence |

## Capability Progression

| Area | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Epoch identity | canonical manifest digest | replay-stable identity | decision-bound identity | provider-independent identity |
| Durability | append-only local bundle | atomic and crash-safe | retention and supersession evidence | portable provider binding |
| Reconciliation | drift observation and staging | idempotent retry | owner-gated activation proposal | multi-provider recovery |
| Authority | no effects | no effects | exact admission only by owner | provider never owns meaning |

## Non-Regression Guardrails

- Existing admitted packages and stored epochs are never rewritten.
- Equal candidate inputs produce equal epoch identity.
- Validation, storage, and recovery never imply admission, promotion, or an
  active-registration switch.
- Every read and write path is repository-contained and symlinks are rejected.
- Native validator verdicts are preserved exactly.

## Recommended Next Layer

Implement L0 only after the revised Product Capability, business ontology,
DomainSpec source, deterministic system ontology, and exact implementation
binding are available. Crash recovery, activation, provider abstraction, and
network storage remain explicitly deferred.
