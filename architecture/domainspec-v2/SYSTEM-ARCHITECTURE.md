---
document_id: cav2-domainspec-v2-system-architecture/v1
status: candidate-successor
authority_effect: none
visibility: private
source_snapshot_digest: c9e26cd91b8795ce768e842106c78bec0d180941a86dd2cee612799bba853f35
updated_at: 2026-08-30
---

# DomainSpec v2 System Architecture

## Purpose

DomainSpec is a checked map of a software system and the machinery that keeps that map connected to exact
implementation evidence. The stable architecture separates intent, structure, realization, observation,
evidence, and decision so one cannot impersonate another.

```text
project-owned domain source
  -> closed meta-type and relationship language
  -> selected architecture profile and exact language realization
  -> deterministic instantiation plan
  -> atomic target publication and receipt
  -> independent target reread and bounded conformance
  -> non-inflating evidence
  -> external owner decision
```

## Logical layers

| Layer | Owns | Does not own |
| --- | --- | --- |
| Authority and definitions | Term meaning, source precedence, decision owners | Runtime truth or release by implication |
| Domain source | Project concepts, properties, relationships, and intent | Generated implementation identity |
| Profiles and realizations | Portable properties and exact TypeScript/Python/Rust forms | Project business meaning |
| Instantiation CLI | Decode, select, plan, publish, receipt, and reread | Application runtime or existing-target mutation |
| Conformance | Independent facts and comparison with selected contracts | Unobserved behavior or business acceptance |
| Evidence composition | Claim ceilings, gaps, determinism, provenance | Missing evidence or implicit continuation |
| Owner gate | The explicit next authorized decision | Changing the evidence that supports it |

## Meta-type realization

Each generated artifact binds three identities:

```text
Meta-type identity
  + selected profile and realization row
  + project instance identity
  -> artifact plan and conformance obligations
```

The current closed backend set has 13 meta-types and 39 selected language realizations. DS-D8 relationship
signatures constrain endpoint types, placement, and multiplicity before generation. A generated file that merely
resembles the selected form does not satisfy the contract unless its exact instance, baseline, and observation
bindings agree.

## Operation architecture

An Operation owns one state-changing behavior perimeter. Its selected realization requires:

1. explicit declared read, write, and external-effect sets;
2. guard evaluation before the first state mutation;
3. atomic local state transition and Operation outbox recording;
4. explicit failure continuation rather than an inferred retry;
5. rejection of undeclared effects;
6. stable idempotency/replay identity at the Operation or bound adapter boundary; and
7. typed relationships to Rule, Event, and Workflow through the admitted signatures.

A Rule owns allow/reject meaning and may guard or enforce the Operation according to the exact relationship
registry. An Event records the Operation outcome through the Operation-owned outbox boundary. A Workflow may
orchestrate the Operation but cannot absorb its state/effect authority.

## Workflow and recovery architecture

A Workflow owns ordering, branching, and recovery planning. After partial completion it emits one immutable
Recovery Intent and frozen recovery plan; it does not execute compensation inline. Every forward or recovery
target is an exact ordinary Operation already connected by the admitted `orchestrates` relationship.

```text
Workflow evaluation
  -> Recovery Intent + frozen plan
  -> exact Operation binding preflight
  -> external in-process executor today
  -> ordinary Operation invocation in deterministic order
```

The durable target adds a Recovery Coordination Repository and Unit of Work, version compare-and-set, atomic
dispatch transition plus dispatch outbox, Claim with monotonic fence, time-bounded Lease, Attempts, stable
Invocation Identity, persisted Retry, Terminal Disposition, restart reconciliation, and Operation-owned durable
replay recognition. Delivery is at-least-once invocation with at-most-once semantic application inside the
Operation boundary; the architecture never promises universal exactly-once process execution.

## System integration boundary

D45–D49 keep business semantics, code contracts, metadata bindings, adapters, raw observations, evidence, and
owner decisions distinct. Dependency contracts are responsibility-specific; there is no universal code-level
Port or mandatory DomainSpec Interface. Repository differs from Persistence Binding, Unit of Work differs from
Transaction Guarantee Binding, and Failure Outcome Binding classifies failure without choosing Retry.

The current provider-neutral package validates and generates TypeScript, Python, and Rust formation contracts.
Target projects supply opaque adapter/resource references. No database, ORM, broker, dependency-injection
framework, durable provider, or runtime guarantee is selected or observed.

## Current implementation and claim ceiling

Implemented or boundedly evidenced:

- source decoding and relationship validation;
- exact realization selection for 13 backend meta-types in three languages;
- deterministic contained publication and baseline-bound receipts;
- generated-target reread and bounded static conformance;
- Operation and Workflow generated contracts;
- three-language recovery planning, exact-binding preflight, and in-process execution;
- provider-neutral D45–D49 contract and binding formation.

Designed but not durably implemented:

- coordination-store adapter and provider transaction guarantees;
- Claim/Lease authority, durable Attempt journal, persisted Retry, and Terminal recorder;
- restart reconciler, dispatch outbox publisher, and durable Operation replay ledger;
- provider runtime observation and production operational evidence.

The CLI is private and unreleased. Passing local checks does not publish, deploy, release, or prove production
behavior.

## Source binding and succession

This candidate is bound to `projects/domainspec-v2/ARCHITECTURE.md` at inventoried SHA-256
`c9e26cd91b8795ce768e842106c78bec0d180941a86dd2cee612799bba853f35`. The source file was already modified in
the captured worktree, so migration must preserve its provenance rather than claim these bytes were created by
the migration. See [MIGRATION-CONTRACT.md](MIGRATION-CONTRACT.md).

## Open Questions

- Which accepted successor baseline first makes CyberAlchemy paths authoritative?
- Does executable formalization remain with implementation, or split proof specifications into `specs/`?
- Which independent observer will close provider runtime evidence for durable recovery?
