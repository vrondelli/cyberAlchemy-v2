# E11 Manual Adjudication Worklist (2026-04-22)

- Source run anchor: `data/run-2026-04-22-bootstrap.jsonl`
- Purpose: prepare stratified candidate subset for manual evidence-grade adjudication workflow.
- Important: these are bootstrap anchor IDs for planning only; remap each candidate to corresponding non-bootstrap row IDs from the manual full run before adjudication begins.

## Coverage Targets

- Full-run floor reference: 150 rows (120 edge + 30 scenario minimum).
- Required adjudication subset floor: >= 30 rows (20% of 150).
- Candidate rows prepared: 35.
- Analysis units covered: edge, scenario.
- Technique families covered: Abstraction patterns, Batching and chunking, CQRS and related variants, Optimistic vs pessimistic locking, Queueing and backpressure, Retry, idempotency, circuit breaker, Saga orchestration vs choreography.

## Operator Instructions

1. Execute manual non-bootstrap full run and produce canonical row IDs.
2. Remap each `candidate_row_id` below to the corresponding manual row ID in a frozen manifest.
3. Use independent blind ratings for `rater_a_label` and `rater_b_label`.
4. Set `disagreement_flag` to `yes` when labels diverge, otherwise `no`.
5. For disagreements, the third rater sets `third_rater_label`, `rationale_code`, and `final_label`.
6. Keep completed adjudication records in `results/E11-adjudication-log.md` and referenced structured files.

## Candidate Subset Table

| candidate_row_id | analysis_unit | technique_family | domain_id | symptom_type | selected_technique | rater_a_label | rater_b_label | disagreement_flag | third_rater_label | rationale_code | final_label |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| full-0002 | edge | Abstraction patterns | CD2 | SYM-08 | Anti-corruption layer |  |  |  |  |  |  |
| full-0004 | edge | Abstraction patterns | CD4 | SYM-08 | Anti-corruption layer |  |  |  |  |  |  |
| full-0005 | edge | Abstraction patterns | CD5 | SYM-08 | Anti-corruption layer |  |  |  |  |  |  |
| full-0001 | edge | Batching and chunking | CD1 | SYM-12 | Chunked processing with checkpoints |  |  |  |  |  |  |
| full-0008 | edge | Batching and chunking | deal | SYM-12 | Chunked processing with checkpoints |  |  |  |  |  |  |
| full-0016 | edge | Batching and chunking | CD1 | SYM-12 | Chunked processing with checkpoints |  |  |  |  |  |  |
| full-0010 | edge | CQRS and related variants | player-makeup | SYM-06 | Single-store CQRS split |  |  |  |  |  |  |
| full-0023 | edge | CQRS and related variants | financial-settlement | SYM-06 | Single-store CQRS split |  |  |  |  |  |  |
| full-0024 | edge | CQRS and related variants | player-management | SYM-06 | Single-store CQRS split |  |  |  |  |  |  |
| full-0013 | edge | Optimistic vs pessimistic locking | player-stats | SYM-02 | Optimistic locking |  |  |  |  |  |  |
| full-0015 | edge | Optimistic vs pessimistic locking | transaction | SYM-02 | Optimistic locking |  |  |  |  |  |  |
| full-0033 | edge | Optimistic vs pessimistic locking | auth-access-control | SYM-02 | Optimistic locking |  |  |  |  |  |  |
| full-0007 | edge | Queueing and backpressure | auth-access-control | SYM-03 | Queue-based load leveling |  |  |  |  |  |  |
| full-0028 | edge | Queueing and backpressure | CD2 | SYM-03 | Queue-based load leveling |  |  |  |  |  |  |
| full-0038 | edge | Queueing and backpressure | CD2 | SYM-03 | Queue-based load leveling |  |  |  |  |  |  |
| full-0003 | edge | Retry, idempotency, circuit breaker | CD3 | SYM-04 | Retry with jitter |  |  |  |  |  |  |
| full-0011 | edge | Retry, idempotency, circuit breaker | player-management | SYM-04 | Retry with jitter |  |  |  |  |  |  |
| full-0014 | edge | Retry, idempotency, circuit breaker | shared | SYM-04 | Retry with jitter |  |  |  |  |  |  |
| full-0009 | edge | Saga orchestration vs choreography | financial-settlement | SYM-01 | Orchestration-based saga |  |  |  |  |  |  |
| full-0034 | edge | Saga orchestration vs choreography | player-management | SYM-01 | Orchestration-based saga |  |  |  |  |  |  |
| full-0036 | edge | Saga orchestration vs choreography | shared | SYM-01 | Orchestration-based saga |  |  |  |  |  |  |
| full-0125 | scenario | Abstraction patterns | CD5 | SYM-08 | Anti-corruption layer |  |  |  |  |  |  |
| full-0132 | scenario | Abstraction patterns | player-onboarding | SYM-08 | Anti-corruption layer |  |  |  |  |  |  |
| full-0123 | scenario | Batching and chunking | CD3 | SYM-12 | Chunked processing with checkpoints |  |  |  |  |  |  |
| full-0130 | scenario | Batching and chunking | player-makeup | SYM-12 | Chunked processing with checkpoints |  |  |  |  |  |  |
| full-0127 | scenario | CQRS and related variants | auth-access-control | SYM-06 | Single-store CQRS split |  |  |  |  |  |  |
| full-0134 | scenario | CQRS and related variants | shared | SYM-06 | Single-store CQRS split |  |  |  |  |  |  |
| full-0124 | scenario | Optimistic vs pessimistic locking | CD4 | SYM-02 | Optimistic locking |  |  |  |  |  |  |
| full-0131 | scenario | Optimistic vs pessimistic locking | player-management | SYM-02 | Optimistic locking |  |  |  |  |  |  |
| full-0122 | scenario | Queueing and backpressure | CD2 | SYM-03 | Queue-based load leveling |  |  |  |  |  |  |
| full-0129 | scenario | Queueing and backpressure | financial-settlement | SYM-03 | Queue-based load leveling |  |  |  |  |  |  |
| full-0126 | scenario | Retry, idempotency, circuit breaker | CD6 | SYM-04 | Retry with jitter |  |  |  |  |  |  |
| full-0133 | scenario | Retry, idempotency, circuit breaker | player-stats | SYM-04 | Retry with jitter |  |  |  |  |  |  |
| full-0121 | scenario | Saga orchestration vs choreography | CD1 | SYM-01 | Orchestration-based saga |  |  |  |  |  |  |
| full-0128 | scenario | Saga orchestration vs choreography | deal | SYM-01 | Orchestration-based saga |  |  |  |  |  |  |
