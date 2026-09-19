---
title: L3 Durable Provider Runtime Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner
scope: capability-layer
authority_effect: none
---

# L3 Durable Provider Runtime

## Decision and Boundary

After this layer, we know whether the CLI backend preserves its declared semantics across transaction, delivery, concurrency, retry, poison-work, and restart failures.

- Minimum working unit: PostgreSQL state plus transactional outbox and one selected publisher, driven through the L2 runtime contract.
- Operator outcome: choose `postgres`, execute the backend, and obtain receipts for observed durable guarantees.
- Risk reduced: state/event divergence, duplicate effects, stale workers, lost retries, and invalid restart claims.
- Main costs: provider selection, schema/migrations, transactional outbox, publisher integration, concurrency controls, recovery machinery, and fresh-process fault tests.
- Boundary: production deployment, scale, and release remain unauthorized and deferred.

## CAV2-D65 Chain Accounting

| D65 stage | L3 requirement |
|---|---|
| Canonical definitions | Resolve exact meanings for transaction, occurrence identity, delivery, idempotency, lease, fencing, retry, quarantine, and recovery before provider implementation. |
| Product Capability | Existing capability includes bounded runtime observation but excludes invented provider behavior. If durable semantics are not uniquely covered, stop for an owner-scoped capability decision. |
| Business ontology | Extend or select ontology records only through their owner; the plan cannot silently treat provider concepts as adopted facts. |
| Authored source | Source declares effect and recovery intent; provider configuration supplies infrastructure selection only. |
| Compiled graph/system ontology | Carry occurrence identity, effect intent, and recovery constraints into the runtime contract deterministically. |
| Exact implementation binding | PostgreSQL/provider, relay, publisher, and recovery candidates obey the exactly-one-helper authoring and parent-join rule per materially revised binding. |
| Conformance evidence | Fresh-process fault matrix with transaction seams, unknown commit, duplicate delivery, lease expiry, stale worker, poison work, retry, and restart. |

## Serial Work

R06 provider selection/binding → R07 atomic state+outbox → R08 relay/publisher → R09 unknown commit → R10 idempotency/deduplication → R11 leases/fencing → R12 persisted retries → R13 quarantine/replay → R14 restart recovery → R15 fault matrix → R16 CLI provider selection.

## Exit Evidence and Promotion

- State and outbox are atomic; rows are never deleted before acknowledgement.
- Duplicate or ambiguous delivery converges on one intended observable effect.
- Stale workers fail, retry state survives restart, poison work is terminal and replayable, and workflows resume correctly.
- L3 completes only after fresh-process R15 and CLI R16 pass. Completion does not establish production readiness.
