---
title: AlchLang SQLite Transactional Outbox Runtime Integration Layering
status: layers-0-through-3-implemented-local-candidate
updatedAt: 2026-09-03
owner: CyberAlchemy-v2 / AlchLang
scope: capability
route: CA2-ROUTE-IMPLEMENT
authority_effect: none
---

# AlchLang SQLite Transactional Outbox Runtime Integration Layering

This plan starts after the registry compiler, explicit `effect` / `performs`
syntax, and concrete SQLite generator have been demonstrated. Its target is the
missing runtime connection between the authored action and the generated
infrastructure pattern.

## Context

- Target: execute one declared AlchLang action through its exact
  `sqlite-transactional-outbox` binding, operate it durably, and consume it
  through an idempotent local integration boundary.
- Current state: L0-L3 are implemented as a local candidate; L4 has technical
  evidence but still requires canonical provider admission and owner review.
- Primary operator: an AlchLang author testing a domain locally.
- Primary constraint: the runtime must not infer provider selection, aggregate
  identity, state, message identity, or payload from names.
- Source references: the admitted DomainSpec Operation and infrastructure
  binding contracts, the candidate AlchLang effect/binding registry, and the
  local compiler runtime.
- Claim ceiling: local candidate execution evidence only; no stable promotion,
  canonical DomainSpec provider admission, publication, deployment, network
  dispatch, or production guarantee.

## Intended Runtime Path

```text
AlchLang action
  -> explicit performs edge
  -> exact effect contract
  -> exact integration-binding resolver
  -> explicit AtomicStateAndOutboxRequest
  -> SQLite business-state + Outbox transaction
  -> lease-owning durable worker
  -> explicitly invoked stdout or confirmed HTTP transport
  -> optional transactional SQLite inbox
```

The effect request is explicit JSON. The runtime never guesses which action
fact is an aggregate ID, message ID, timestamp, state field, or payload field.

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Visible Outcome | Explicitly Deferred |
| --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether an authored action can select its declared binding and commit state plus Outbox atomically through `domainspec run`. | Resolver, SQLite runtime provider, explicit effect request, CLI wiring, rollback and mismatch tests. | One command creates a database containing versioned business state and one pending message. | Worker reliability, network transports, inbox, HA, stable promotion. |
| L1 | After this layer, we know whether pending delivery can be exercised repeatably without hiding at-least-once semantics. | Local stdout transport, explicit dispatch command, stable message identity, retry and inspection tests. | The operator can inspect pending rows, dispatch them, and verify published state. | Claims/leases, backoff, dead letter, parallel workers. |
| L2 | After this layer, we know whether a durable dispatcher remains safe under contention and restart. | Claim/lease, retry schedule, attempt ceiling, dead-letter state, restart/concurrency tests. | Multiple workers cannot intentionally own the same lease concurrently and failed work has an inspectable terminal state. | External brokers, multi-region operation, managed database providers. |
| L3 | After this layer, we know whether a concrete integration can be operated and consumed safely. | One opt-in HTTP or queue transport, consumer inbox/idempotency contract, migration lifecycle, telemetry. | A bounded integration pilot can be observed and replayed. | General marketplace, automatic provider discovery, production release. |
| L4 | After this layer, we know whether the pattern is eligible for governance review as a reusable stable architecture pattern. | Canonical provider package, exact construction binding, independent conformance, owner decision. | A reviewer receives a closed promotion packet. | Automatic stability or admission. |

## Implemented Waves

L0 and L1 form the local atomic-commit vertical. L2 hardens that vertical for
worker contention and restart. L3 adds an explicitly confirmed HTTP transport,
an idempotent SQLite inbox, migration, and telemetry. HTTP dispatch remains a
separate operator command and fails closed unless its origin is allowlisted and
confirmed exactly.

### Included

- `SqliteTransactionalOutbox` reusable runtime provider with migration,
  optimistic aggregate versioning, atomic commit, rollback, pending lookup,
  published/failed marking, and database inspection.
- Fail-closed resolver that checks the action's `performs` edge, effect ID,
  pattern ID, binding ID, guarantee, failure continuation, and authority
  boundary before opening SQLite.
- `domainspec run ... --binding sqlite-transactional-outbox --database ...
  --effect-request-file ...`.
- `domainspec outbox pending|status|requeue-dead --database ...` and
  `domainspec outbox dispatch --database ... --transport stdout --worker-id ...`.
- Lease ownership and expiry/reclaim, retry scheduling, attempt ceilings,
  dead-letter inspection and explicit requeue.
- `domainspec outbox dispatch --transport http` with exact origin allowlist and
  `--confirm-network-dispatch`, plus a stable message-id idempotency header.
- Transactional SQLite inbox deduplication, v1-to-v2 row-preserving migration,
  runtime telemetry, status inspection, and replay reconciliation.
- Product Capability, business ontology, DomainSpec nodes/edges, compiled graph,
  system ontology, exact implementation binding, and conformance evidence.
- Unit tests, generated-provider tests, CLI negative tests, and a real local
  SQLite end-to-end demonstration.

### Still Deferred

- Schema downgrade, online migration, HA, load, deployment, publication, or
  production claims.
- Credentials, external brokers, automatic provider discovery, multi-region
  coordination, and general integration marketplace behavior.
- Promotion of `transactional-outbox` from candidate to stable.

## Exit Evidence

- A matching explicit binding commits state and a pending message atomically.
- A failpoint after state mutation leaves neither state nor message behind.
- Binding, effect, guarantee, failure-continuation, boundary, request shape, and
  event mismatches fail before persistence.
- Reusing a message ID or stale aggregate version fails without partial writes.
- Pending inspection reports the exact message identity and payload.
- A claimed message cannot be claimed by a second worker before lease expiry;
  expiry permits deterministic restart reclaim.
- Failed delivery schedules bounded retry and eventually reaches an inspectable
  dead-letter state; requeue is explicit.
- HTTP carries a stable idempotency key and rejects an unconfirmed or
  non-allowlisted origin; the inbox commits handler work and receipt together.
- Typecheck, build, package-local tests, generated tests, DomainSpec compilation,
  exact-binding validation, and conformance validation all pass under the bound
  Node toolchain.

## Non-Regression Guardrails

- Legacy actions without `performs` continue to use only an explicitly selected
  memory adapter.
- No binding is selected from a pattern name or file name.
- `domainspec build` remains non-effectful and deterministic.
- Dispatch is a separate explicit command; action execution never publishes a
  message directly.
- Availability, stability, admission, execution evidence, release, and
  production remain separate states.

## Promotion Decision

- Submit the L4 technical candidate for owner review only after its exact
  digests and independent conformance dependencies close.
- Pivot if the explicit request envelope cannot bind without domain-specific
  inference; then add governed mapping syntax before expanding providers.
- Stop if runtime code bypasses the action guard, permission, authority boundary,
  effect contract, or exact integration-binding checks.

## Implementation Result

L0 and L1 were implemented on 2026-09-03. The local runtime validation passed
all 11 checks. Aggregate governed conformance remains `not_evaluable` because
the accepted predecessor Work-Pack binds an older digest of the current clean
DomainSpec graph loader. See
`../general-compiler-v1/RUNTIME-INTEGRATION-RESULTS.md` for evidence and exact
test commands.

L2 and L3 were subsequently implemented with lease ownership, restart reclaim,
bounded exponential retry, dead letter/requeue, replay reconciliation,
row-preserving schema upgrade, confirmation-gated HTTP transport, transactional
SQLite inbox, and telemetry. L4 has a technical provider candidate and exact
binding evidence; stable promotion and canonical provider admission remain
human-owner gates.
