# E11 Bootstrap Run Results (Pipeline Execution Run)

- run_id: run-2026-04-22-bootstrap
- purpose: execute Waves 3-6 mechanically using grounded E9-derived data
- disclaimer: this run is not sufficient for claim-strength upgrades; manual non-bootstrap adjudication still required.

## Data Summary

- edge_rows: 120
- scenario_rows: 35
- total_rows: 155
- unique_domains: 15
- adjudication_subset_ratio: 0.213

## Scenario Family Coverage

| Technique Family | Scenario Rows |
| --- | ---: |
| Abstraction patterns | 5 |
| Batching and chunking | 5 |
| CQRS and related variants | 5 |
| Optimistic vs pessimistic locking | 5 |
| Queueing and backpressure | 5 |
| Retry, idempotency, circuit breaker | 5 |
| Saga orchestration vs choreography | 5 |

## Anti-False-Confidence Checks

- protocol_drift_check: pass
- subgroup_contradiction_check: pass (max tradeoff spread by family <= 0.35)
- sensitivity_check: pass (variants={'default': 155})
- reproducibility_check: pass (full vs rerun agreement=1.000)
- triangulation_with_E6_E9: Aligned with E9 composition-derived pattern distribution; E6/E9 consistency is directional only for bootstrap run.

## Gate Outcome Snapshot

- G1: pass
- G2: pass
- G3: pass
- G4: pass (schema validation clean)

## Decision

- D4 status upgrade gate: hold
- reason: bootstrap-emulated adjudication is not accepted as evidence-grade claim proof.
- claim status recommendation: no change in MARS-C2 until manual adjudication run completes.
