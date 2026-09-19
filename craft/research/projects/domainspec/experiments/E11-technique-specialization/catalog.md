# E11 Techniques/Specializations Catalog (Provisional)

Purpose: catalog candidate cross-context techniques and specializations to test in E11 before proposing ontology changes.

Status: provisional, evidence-seeking

## Symptom Taxonomy (Used In E11)

| Symptom ID | Symptom |
| --- | --- |
| SYM-01 | Long-running cross-context workflow with compensations |
| SYM-02 | Lock contention and write conflicts |
| SYM-03 | Queue depth growth and burst-driven overload |
| SYM-04 | Transient downstream failures and timeout cascades |
| SYM-05 | Tight event coupling and fan-out instability |
| SYM-06 | Read-heavy load with stale-read tolerance |
| SYM-07 | Strict consistency and invariant coupling |
| SYM-08 | Legacy boundary translation and semantic mismatch |
| SYM-09 | Partial failure in multi-step transactions |
| SYM-10 | Throughput collapse from synchronous call chains |
| SYM-11 | Duplicate command delivery risk |
| SYM-12 | Token/cost growth from repeated decision cycles |

## Catalog Entries

| ID | Family | Specialization | Primary Symptoms | Benefit Focus | Main Trade-off | Complexity | Token Overhead | Evidence Refs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | Saga | Orchestration-based saga | SYM-01, SYM-09 | Deterministic flow control | Orchestrator coupling | high | medium | `SRC-SAGA-MICROSERVICESIO`, `SRC-SAGA-CAMUNDA` |
| T02 | Saga | Choreography-based saga | SYM-01, SYM-05 | Decentralized ownership | Emergent behavior debugging | high | medium | `SRC-SAGA-MICROSERVICESIO` |
| T03 | Saga | Compensating transaction templates | SYM-01, SYM-09 | Failure containment | Compensation complexity | high | low | `SRC-SAGA-MICROSERVICESIO`, `SRC-SAGA-EVANS-BLUEBOOK` |
| T04 | Event reliability | Transactional outbox | SYM-05, SYM-11 | Atomic state+event publish | Additional relay component | medium | low | `SRC-OUTBOX-MICROSERVICESIO` |
| T05 | CQRS | Single-store CQRS split | SYM-06, SYM-02 | Read/write model clarity | Higher conceptual complexity | medium | medium | `SRC-CQRS-FOWLER`, `SRC-CQRS-AZURE` |
| T06 | CQRS | Dual-store CQRS | SYM-06, SYM-10 | Independent scale paths | Eventual consistency burden | high | medium | `SRC-CQRS-AZURE`, `SRC-EVENTSOURCING-AZURE` |
| T07 | Query optimization | Materialized read model | SYM-06, SYM-10 | Low-latency reads | Projection lag and rebuild costs | medium | low | `SRC-CQRS-AZURE` |
| T08 | Queueing | Competing consumers | SYM-03, SYM-10 | Parallel throughput scaling | Ordering and idempotency constraints | medium | low | `SRC-COMPETING-CONSUMERS-AZURE` |
| T09 | Queueing | Queue-based load leveling | SYM-03, SYM-10 | Burst smoothing | Added async latency | medium | low | `SRC-QUEUE-LEVELING-AZURE` |
| T10 | Backpressure | Load shedding | SYM-03, SYM-04 | Preserve goodput under stress | Controlled rejection surface | medium | low | `SRC-LOAD-SHEDDING-AWS` |
| T11 | Queueing | Priority queueing | SYM-03, SYM-12 | Protect critical workloads | Starvation risk for low priority | medium | low | `SRC-COMPETING-CONSUMERS-AZURE` |
| T12 | Batching | Time-window batching | SYM-03, SYM-12 | Better throughput/cost ratio | Added tail latency | low | low | `SRC-BATCH-EIP`, `SRC-SPRING-BATCH` |
| T13 | Batching | Size-window batching | SYM-03, SYM-10 | Efficient bulk processing | Uneven latency profile | low | low | `SRC-BATCH-EIP`, `SRC-SPRING-BATCH` |
| T14 | Batching | Chunked processing with checkpoints | SYM-03, SYM-09 | Recoverable long jobs | Checkpoint management overhead | medium | low | `SRC-SPRING-BATCH` |
| T15 | Locking | Optimistic locking | SYM-02, SYM-07 | High read concurrency | Retry storms under high conflict | medium | medium | `SRC-OPTIMISTIC-OFFLINE-LOCK` |
| T16 | Locking | Pessimistic locking | SYM-02, SYM-07 | Strong write serialization | Throughput degradation | medium | low | `SRC-PESSIMISTIC-LOCKING-POSTGRES` |
| T17 | Locking | Lease-based lock | SYM-02, SYM-09 | Distributed ownership control | Lease expiry edge cases | high | medium | `SRC-LEASES-ETCD` |
| T18 | Resilience | Retry with jitter | SYM-04, SYM-10 | Transient fault recovery | Cost blow-up without limits | low | medium | `SRC-RETRY-AZURE`, `SRC-TIMEOUT-RETRY-JITTER-AWS` |
| T19 | Resilience | Circuit breaker (closed/open/half-open) | SYM-04, SYM-10 | Stop cascading failures | Threshold tuning complexity | medium | low | `SRC-CIRCUIT-BREAKER-AZURE` |
| T20 | Resilience | Idempotency keys | SYM-11, SYM-04 | Safe retries for command paths | Key lifecycle governance | low | low | `SRC-IDEMPOTENCY-STRIPE` |
| T21 | Resilience | Dead-letter queue with replay policy | SYM-11, SYM-09 | Fault isolation and replayability | Replay governance overhead | medium | low | `SRC-DLQ-AZURE-SB` |
| T22 | Abstraction | Anti-corruption layer | SYM-08, SYM-05 | Semantic isolation across BCs | Mapping maintenance cost | medium | medium | `SRC-DDD-ACL-EVANS` |
| T23 | Abstraction | Strangler facade | SYM-08, SYM-10 | Progressive modernization | Dual-run complexity | high | medium | `SRC-STRANGLER-FOWLER` |
| T24 | Abstraction | Hexagonal ports/adapters boundary | SYM-08, SYM-12 | Stable domain core, replaceable edges | Adapter proliferation | medium | low | `SRC-HEXAGONAL-ALISTAIR` |

## Promotion Rules (Catalog -> Taxonomy Candidate)

A family/specialization may be promoted from provisional catalog to taxonomy proposal only if all conditions hold:

1. SC-TS-1 and SC-TS-5 pass for that family.
2. Dual-rater disagreement is <= 15% after adjudication.
3. Trade-off completeness for the family is >= 0.85.
4. Token overhead median for the family is <= 0.20 vs baseline.
5. At least two independent source categories support the family definition.

## Known Gaps

- Need immutable pin captures for all web references before execution gate pass.
- Need explicit negative-control scenarios where no specialization should be applied.
- Need non-DDD-heavy source additions to reduce external-validity bias.
