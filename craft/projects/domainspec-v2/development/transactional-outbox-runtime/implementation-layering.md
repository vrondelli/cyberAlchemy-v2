---
title: DomainSpec Transactional Outbox Runtime Implementation Layering
status: draft-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner
scope: capability
authority_effect: none
---

# DomainSpec Transactional Outbox Runtime Implementation Layering

This document defines a progressive implementation model for turning the
current generated Operation outbox intent into one concrete, observed
transactional-outbox runtime. It is a planning candidate, not implementation
authority or runtime evidence.

## Context

- Target: complete transactional-outbox runtime generation for DomainSpec
  Operations.
- Current state: partially implemented. Operation generators return state plus
  effect-derived outbox intents, while the provider-neutral system-integration
  manifest can describe `commit-state-and-outbox`; it deliberately reports
  `runtime_guarantees_observed: false` and generates no database adapter,
  migration, relay, publisher, retry loop, or runtime observation receipt.
- Primary user/operator: an application team instantiating a DomainSpec project
  and the operator responsible for delivery failures and replay.
- Primary constraint: do not collapse a pure domain Operation, transactional
  persistence, external publication, or observed runtime behavior into one
  unverifiable generated function.
- Reference vertical assumption: TypeScript plus PostgreSQL is the first
  concrete runtime profile. Other languages, databases, and brokers are
  deferred until this vertical proves the contract.
- Source references:
  - `projects/domainspec-v2/impl/cli/src/generation/generators.ts`
  - `projects/domainspec-v2/impl/cli/src/conformance/observe-target.ts`
  - `projects/domainspec-v2/impl/cli/src/system-integration/types.ts`
  - `projects/domainspec-v2/impl/cli/src/system-integration/compiler.ts`
  - `projects/domainspec-v2/impl/cli/fixtures/input-roots/canonical-project/integrations/settle-runtime.json`

## Architectural Decision

Do not introduce an `Outbox Operation` meta-type. Preserve these boundaries:

```text
DomainSpec Operation + Event intent
  -> pure generated operation result {state, outbox intents}
  -> generated application transaction boundary
  -> state update + outbox-row insert in one database transaction
  -> independently running relay claims committed rows
  -> publisher attempts delivery
  -> relay records delivered, retryable, unknown, or terminal outcome
  -> separate runtime observation receipt
```

The first supported delivery contract is **at least once**. Exactly-once
delivery must not be claimed. Every event therefore needs one stable event ID,
and consumers must be able to deduplicate that ID.

## Layer Boundary Heuristic

`Layer value = decision unlocked + operator-visible outcome + risk reduced`.

`Layer cost = implementation time + verification time + coordination burden`.

A layer stops when its next unit does less to answer the current decision than
starting the next decision layer.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator-visible outcome | Promotion decision |
| --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether one generated Operation can atomically persist state and a typed outbox row and recover it after process failure. | One TypeScript Operation, one PostgreSQL transaction adapter, one outbox table, one single-threaded relay, and a capturing publisher. | A committed operation eventually produces one publish attempt after restart; a rolled-back operation produces none. | Continue only if crash-boundary tests pass against a real PostgreSQL instance. |
| L1 | After this layer, we know whether delivery remains safe and repeatable under retries, duplicate publication, poison messages, and concurrent relays. | Stable event IDs, leases/claims, retry schedule, terminal quarantine, consumer deduplication contract, and concurrent relay tests. | Operators can inspect pending, retrying, delivered, and quarantined rows without losing committed work. | Continue only if the fault matrix is deterministic and no row becomes silently stranded. |
| L2 | After this layer, we know whether claimed runtime guarantees are observable rather than inferred from generated source. | Runtime observation command, metrics, structured logs, health/backlog checks, reconciliation, and immutable observation receipt. | Operators can distinguish healthy, delayed, retrying, unknown-commit, and terminal failure states. | Declare the first profile implementation-complete only when the observation suite passes; acceptance remains separate. |
| L3 | After this layer, we know whether the capability can be packaged across additional languages, transports, and database profiles without semantic drift. | Compatibility suite, upgrade/migration protocol, one real broker adapter, then Python/Rust parity or an explicit non-parity record. | Teams can select a supported concrete profile and receive its exact artifacts and evidence boundary. | Add a profile only when it passes the same semantic and failure corpus as the reference profile. |

## Capability Progression

| Capability | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Authored intent | Operation effects resolve to typed Event selectors and exact `emits` relationships. | Event ID, ordering key, retry and terminal policy are explicit runtime bindings, not inferred domain meaning. | Observation requirements and service-level thresholds are explicit. | Versioned profiles preserve backward-compatible intent or fail closed. |
| Generated operation | Pure result contains immutable typed event intents; no database or publisher access. | Stable event IDs survive every retry. | Trace metadata links operation, transaction, row, and publish attempt. | Equivalent contracts are tested across supported languages. |
| Transaction runtime | One transaction updates state and inserts all outbox rows. | Conflict, rollback, and unknown-commit outcomes are explicit. | Reconciliation detects ambiguous or stranded work. | Additional databases must reproduce the same failure semantics. |
| Relay | Single worker claims committed rows and publishes. | Concurrent workers, leases, retry, quarantine, and duplicate-safe delivery. | Backlog, age, failures, and lease health are observable. | Additional brokers implement the same publisher outcome contract. |
| Evidence | Real database fault tests. | Deterministic concurrency and failure matrix. | Immutable runtime observation receipt. | Cross-profile compatibility and migration evidence. |

## L0 — Minimum Working Unit

### Included scope

1. Extend the compiled Operation/Event contract so every effect closes against
   an authored Event selector and canonical relationship. Generate a common
   event envelope containing at least:
   - `event_id` from an injected deterministic ID provider;
   - `event_type` and positive `event_version` from the Event definition;
   - `operation_id` and subject/partition identity;
   - immutable payload;
   - `occurred_at` from an injected clock.
2. Add one concrete runtime realization profile, provisionally
   `transactional-outbox-postgresql-v1`, separate from
   `provider-neutral-v1`.
3. Generate:
   - the pure Operation core;
   - a transaction application service;
   - PostgreSQL state and outbox repositories;
   - an additive outbox migration;
   - a single-threaded relay;
   - publisher, clock, ID-provider, and transaction contracts;
   - a runtime manifest and candidate receipt.
4. Execute the application boundary as:

```text
BEGIN
  load or lock current state
  evaluate the bound Rule/guard
  run the pure Operation
  persist state
  insert every outbox envelope
COMMIT
```

5. Relay only committed rows. A successful publish attempt records delivery in
   a later transaction. A crash after publish but before marking delivery may
   produce a duplicate with the same `event_id`.

### Explicitly deferred

- multiple databases or languages;
- production broker selection;
- exactly-once claims;
- high-throughput batching and partition tuning;
- multi-region delivery;
- schema registry integration;
- automated destructive migration or deployment.

### Exit evidence

- state update and outbox insert both commit or both roll back;
- crash before commit leaves neither state nor outbox;
- crash after commit but before relay is recovered after restart;
- crash after publish but before acknowledgement reuses the same event ID;
- undeclared Event effects and missing runtime bindings fail before generation;
- generated target and receipt reproduce byte-for-byte;
- `runtime_guarantees_observed` remains false until a separate live observation
  suite succeeds.

## L1 — Reliability Hardening

- Add claim/lease ownership, bounded batches, lease expiry, and concurrent
  worker exclusion.
- Add explicit publisher outcomes: delivered, retryable failure,
  non-retryable failure, and unknown.
- Persist attempt count, next-attempt time, last error class, delivery time, and
  quarantine reason.
- Add deterministic retry/backoff and terminal quarantine policies from the
  runtime binding; do not infer them from Event or Operation meaning.
- Define the consumer deduplication contract keyed by `event_id`.
- Test concurrent workers, lease-holder death, poison events, broker timeout,
  duplicate publication, unknown commit, and unsupported event version.
- Preserve L0 atomic state/outbox commitment and pure Operation isolation.

## L2 — Observation And Reconciliation

- Add structured events and metrics for transaction outcomes, pending backlog,
  oldest-row age, attempts, publishes, duplicates, lease expiry, quarantine,
  and reconciliation.
- Add an operator query/command for row state without allowing arbitrary
  mutation or replay.
- Add a separately authorized replay/reconciliation operation with immutable
  audit evidence and idempotency checks.
- Add a live `observe-runtime` validation surface that runs the fault corpus
  against the selected concrete profile and emits a separate immutable receipt.
- Never flip a generated manifest field to manufacture runtime evidence.
- Preserve L0/L1 semantics and require zero silent loss across the fault suite.

## L3 — Portability And Packaging

- Add one real broker publisher after the generic publisher contract is proven.
- Define profile versioning, additive migrations, rollback boundaries, and
  mixed-version relay behavior.
- Run the same semantic/failure corpus for each later Python, Rust, database,
  or broker profile.
- Record deliberate language differences. The current Rust Operation outbox is
  only `Vec<String>` while TypeScript/Python produce structured records; parity
  must be repaired or explicitly rejected before multi-language promotion.
- Package only profiles whose concrete dependencies, generated artifacts,
  observation procedures, and evidence boundaries are closed.

## Implementation Wave Backbone

| Wave | Target | Key artifacts | Verification |
| --- | --- | --- | --- |
| W0 | Contract and source closure | Typed Event-intent projection; concrete runtime-profile schema; hostile schema fixtures. | Compile graph; reject undeclared effects, unresolved Event versions, or missing transaction participants. |
| W1 | L0 generator vertical | Runtime generator, migration, transaction adapter, relay, manifest, receipt, generated integration tests. | Real PostgreSQL crash-boundary suite and two-run determinism. |
| W2 | L1 reliability | Lease/retry/quarantine/dedup contracts and runtime. | Concurrency and injected-failure matrix. |
| W3 | L2 observation | Metrics/logging/reconciliation plus observation receipt. | Live observation suite with collect-all results and causal `not_evaluable` checks. |
| W4 | L3 portability | Broker adapter, versioning, additional language/provider profile. | Same corpus across profiles; independent pre-commit review. |

## Likely Implementation Surfaces

- DomainSpec source and compiler:
  - Operation/Event effect closure and compiled-graph projection;
  - a new concrete runtime-binding schema and decoder.
- CLI:
  - a runtime-profile selector paired with an exact runtime binding;
  - runtime artifact planning/publication;
  - source/target lint and receipt reconstruction;
  - a separate runtime-observation command or harness.
- Generation:
  - typed event envelope;
  - transaction application service;
  - PostgreSQL repository and migration;
  - relay and publisher contract;
  - deterministic configuration and dependency manifest.
- Evidence:
  - generated contract tests;
  - real-database fault and restart tests;
  - runtime observation receipt;
  - independent implementation and operational reviews.

## Non-Regression Guardrails

- The domain Operation remains pure and instrumentation-free.
- Guard evaluation precedes state construction; state and outbox intents are
  formed before the application boundary attempts persistence.
- Database commit does not imply broker delivery.
- A publish acknowledgement does not imply exactly-once consumer processing.
- No runtime profile may claim observed guarantees from source inspection,
  generation, schema validation, or a static receipt.
- Every retry reuses the original event ID and immutable envelope.
- Unknown commit is a first-class reconciliation state, never automatically
  retried as if rollback were known.
- Existing provider-neutral generation remains available and continues to
  report `runtime_guarantees_observed: false`.

## Open Decisions Before Implementation

1. Confirm TypeScript plus PostgreSQL as the first concrete reference profile.
2. Select the first publisher boundary: deterministic capturing transport for
   L0, followed by which real broker in L3.
3. Decide whether payload schemas are compiled directly from Event typed fields
   in the first vertical or carried as opaque immutable JSON with version checks.
4. Select the operation/aggregate subject identity used for ordering and
   reconciliation.
5. Define retention and quarantine ownership without adding destructive cleanup
   to the initial generator.

## Recommended Next Layer

Start with W0, then L0 only. Do not begin relay concurrency, broker packaging,
multi-language parity, or production deployment until one real PostgreSQL fault
suite proves atomic state/outbox persistence and restart recovery.

## Claim Ceiling

This artifact proposes a construction order. It does not select a provider,
admit a runtime profile, authorize implementation, prove conformance, observe a
runtime guarantee, accept generated code, publish, release, deploy, or create an
external effect.
