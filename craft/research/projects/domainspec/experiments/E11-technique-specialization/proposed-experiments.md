# E11 Follow-on Portfolio (Value-Oriented)

Objective: prioritize next experiments that maximize evidence gain for core research claims with bounded effort.

## Ranking Method

Value score heuristic:

`value_score = claim_impact*0.45 + risk_reduction*0.35 + feasibility*0.20`

Scale for each factor: 1 (low) to 5 (high).

## Proposed Experiments

| Rank | Experiment ID | Focus | Primary Claims | Effort | Value Score | Why it matters |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | E11 | Reproducibility-first techniques/specializations audit | C2, MARS-C2 | medium | 4.6 | Directly addresses E9 construct-validity risk and highest evidence gap |
| 2 | E11.1 | Traceability provenance from symptom -> technique -> governance decision | C1, MARS-C1 | medium | 4.1 | Improves decision-flow evidence without requiring a full new domain wave |
| 3 | E11.2 | External generalization across non-DDD-heavy domains | C2, MARS-C2 | high | 3.9 | Reduces external-validity bias currently concentrated in DDD-style sources |
| 4 | E11.3 | Counterfactual baseline (catalog on/off) for token/cost and quality deltas | C2, C1 | medium | 3.7 | Quantifies whether specialization catalog adds real value vs process overhead |
| 5 | E11.4 | Gate-intervention variant (with/without governance gate checks) | C3, MARS-C3 | high | 3.0 | Useful but lower immediate value because C2 evidence gap is still larger |

## Recommended Execution Order

1. Run E11 first (highest gain-per-cost, closes immediate C2 risk).
2. Run E11.1 next (traceability uplift for C1 with shared artifacts).
3. Run E11.3 before E11.2 if budget is constrained (cheap value validation).
4. Run E11.2 when source/inventory capacity is ready for broad external acquisition.
5. Defer E11.4 until C2 confidence reaches at least moderate-high.

## Minimum Artifacts Required Per Follow-on

- `protocol.md` with measurable SCs and claim mapping
- `sources.md` with source quality and pin evidence
- `data/*.jsonl` with required metadata fields
- `results/*-results.md` with full-tier analysis
- Claim adjudication table with explicit status deltas

## Dependencies

- E11.1 depends on E11 catalog and adjudication schema.
- E11.2 depends on expanded source and inventory coverage.
- E11.3 depends on fixed baseline protocol hash from E11.
- E11.4 depends on stable gate instrumentation from E11 and E11.1.

## Stop Conditions

Pause the portfolio if either condition holds:

1. E11 fails SC-TS-1 or SC-TS-5 by more than 10 percentage points.
2. Median token overhead exceeds 0.35 without measurable claim-strength increase.
