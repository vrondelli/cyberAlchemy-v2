# E11 Adjudication Subset Manifest (2026-04-22)

- generated_at_utc: 2026-04-22T16:27:27.767841+00:00
- status: frozen
- source_run_file: data/run-2026-04-22-manual.jsonl
- total_rows_in_run: 155
- subset_count: 35
- subset_ratio: 0.226
- minimum_required_ratio: 0.200

## Coverage Summary

- analysis_unit_counts: edge=17, scenario=18
- family_count[Saga orchestration vs choreography]=6
- family_count[Queueing and backpressure]=6
- family_count[Batching and chunking]=6
- family_count[Optimistic vs pessimistic locking]=5
- family_count[Abstraction patterns]=4
- family_count[Retry, idempotency, circuit breaker]=4
- family_count[CQRS and related variants]=4

## Frozen Rows

| row_id | analysis_unit | technique_family | domain_id | symptom_type | selected_technique | source_id |
| --- | --- | --- | --- | --- | --- | --- |
| manual-0005 | edge | Abstraction patterns | D05 | SYM-08 | Anti-corruption layer | SRC-DDD-ACL-EVANS |
| manual-0012 | edge | Abstraction patterns | D12 | SYM-08 | Anti-corruption layer | SRC-DDD-ACL-EVANS |
| manual-0003 | edge | Batching and chunking | D03 | SYM-12 | Chunked processing with checkpoints | SRC-SPRING-BATCH |
| manual-0010 | edge | Batching and chunking | D10 | SYM-12 | Chunked processing with checkpoints | SRC-SPRING-BATCH |
| manual-0017 | edge | Batching and chunking | D05 | SYM-12 | Chunked processing with checkpoints | SRC-SPRING-BATCH |
| manual-0007 | edge | CQRS and related variants | D07 | SYM-06 | Single-store CQRS split | SRC-CQRS-AZURE |
| manual-0014 | edge | CQRS and related variants | D02 | SYM-06 | Single-store CQRS split | SRC-CQRS-AZURE |
| manual-0004 | edge | Optimistic vs pessimistic locking | D04 | SYM-02 | Optimistic locking | SRC-OPTIMISTIC-OFFLINE-LOCK |
| manual-0011 | edge | Optimistic vs pessimistic locking | D11 | SYM-02 | Optimistic locking | SRC-OPTIMISTIC-OFFLINE-LOCK |
| manual-0002 | edge | Queueing and backpressure | D02 | SYM-03 | Queue-based load leveling | SRC-QUEUE-LEVELING-AZURE |
| manual-0009 | edge | Queueing and backpressure | D09 | SYM-03 | Queue-based load leveling | SRC-QUEUE-LEVELING-AZURE |
| manual-0016 | edge | Queueing and backpressure | D04 | SYM-03 | Queue-based load leveling | SRC-QUEUE-LEVELING-AZURE |
| manual-0006 | edge | Retry, idempotency, circuit breaker | D06 | SYM-04 | Retry with jitter | SRC-TIMEOUT-RETRY-JITTER-AWS |
| manual-0013 | edge | Retry, idempotency, circuit breaker | D01 | SYM-04 | Retry with jitter | SRC-TIMEOUT-RETRY-JITTER-AWS |
| manual-0001 | edge | Saga orchestration vs choreography | D01 | SYM-01 | Orchestration-based saga | SRC-SAGA-MICROSERVICESIO |
| manual-0008 | edge | Saga orchestration vs choreography | D08 | SYM-01 | Orchestration-based saga | SRC-SAGA-MICROSERVICESIO |
| manual-0015 | edge | Saga orchestration vs choreography | D03 | SYM-01 | Orchestration-based saga | SRC-SAGA-MICROSERVICESIO |
| manual-0125 | scenario | Abstraction patterns | D09 | SYM-08 | Anti-corruption layer | SRC-DDD-ACL-EVANS |
| manual-0132 | scenario | Abstraction patterns | D11 | SYM-08 | Anti-corruption layer | SRC-DDD-ACL-EVANS |
| manual-0123 | scenario | Batching and chunking | D05 | SYM-12 | Chunked processing with checkpoints | SRC-SPRING-BATCH |
| manual-0130 | scenario | Batching and chunking | D07 | SYM-12 | Chunked processing with checkpoints | SRC-SPRING-BATCH |
| manual-0137 | scenario | Batching and chunking | D09 | SYM-12 | Chunked processing with checkpoints | SRC-SPRING-BATCH |
| manual-0127 | scenario | CQRS and related variants | D01 | SYM-06 | Single-store CQRS split | SRC-CQRS-AZURE |
| manual-0134 | scenario | CQRS and related variants | D03 | SYM-06 | Single-store CQRS split | SRC-CQRS-AZURE |
| manual-0124 | scenario | Optimistic vs pessimistic locking | D07 | SYM-02 | Optimistic locking | SRC-OPTIMISTIC-OFFLINE-LOCK |
| manual-0131 | scenario | Optimistic vs pessimistic locking | D09 | SYM-02 | Optimistic locking | SRC-OPTIMISTIC-OFFLINE-LOCK |
| manual-0138 | scenario | Optimistic vs pessimistic locking | D11 | SYM-02 | Optimistic locking | SRC-OPTIMISTIC-OFFLINE-LOCK |
| manual-0122 | scenario | Queueing and backpressure | D03 | SYM-03 | Queue-based load leveling | SRC-QUEUE-LEVELING-AZURE |
| manual-0129 | scenario | Queueing and backpressure | D05 | SYM-03 | Queue-based load leveling | SRC-QUEUE-LEVELING-AZURE |
| manual-0136 | scenario | Queueing and backpressure | D07 | SYM-03 | Queue-based load leveling | SRC-QUEUE-LEVELING-AZURE |
| manual-0126 | scenario | Retry, idempotency, circuit breaker | D11 | SYM-04 | Retry with jitter | SRC-TIMEOUT-RETRY-JITTER-AWS |
| manual-0133 | scenario | Retry, idempotency, circuit breaker | D01 | SYM-04 | Retry with jitter | SRC-TIMEOUT-RETRY-JITTER-AWS |
| manual-0121 | scenario | Saga orchestration vs choreography | D01 | SYM-01 | Orchestration-based saga | SRC-SAGA-MICROSERVICESIO |
| manual-0128 | scenario | Saga orchestration vs choreography | D03 | SYM-01 | Orchestration-based saga | SRC-SAGA-MICROSERVICESIO |
| manual-0135 | scenario | Saga orchestration vs choreography | D05 | SYM-01 | Orchestration-based saga | SRC-SAGA-MICROSERVICESIO |
