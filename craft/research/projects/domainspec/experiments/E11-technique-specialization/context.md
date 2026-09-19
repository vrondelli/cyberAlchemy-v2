# E11 Context Bundle

Experiment: E11-technique-specialization
Tier: full
Primary claims: C2 (primary), C1 (secondary)

This context bundle operationalizes the multi-source context pattern for E11.

## 1. Scope and Claim Target

- Decision question: which technique specializations are reproducible, symptom-driven, and cost-aware for cross-context composition?
- Primary claim target: C2 deterministic and reproducible derivation decisions under technique specialization pressure.
- Secondary claim target: C1 layered governance traceability under multi-source decision load.

## 2. Source Role Matrix (Representative Subset)

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| SRC-SAGA-MICROSERVICESIO | pattern-catalog | saga baseline semantics | primary | sha256-c42eac...d2f0b3 |
| SRC-CQRS-AZURE | architecture-guide | CQRS decision boundaries | primary | sha256-16dbe1...238e89 |
| SRC-COMPETING-CONSUMERS-AZURE | architecture-guide | queueing scaling patterns | primary | sha256-3adc94...4efc12 |
| SRC-RETRY-AZURE | architecture-guide | retry behavior and failure handling | primary | sha256-090dcc...b2a9a |
| SRC-DDD-ACL-EVANS | book | semantic boundary and ACL rationale | supporting | isbn-0321125215 |
| SRC-VERNON-IDDD | book | specialization boundaries and BC governance | supporting | isbn-0321834577 |

Full source set and pins:
- `sources.md`
- `../../inventory/e11-technique-specialization-sources.md`

## 3. Normalized Terminology Map

| Canonical Term | Aliases In Sources | E11 Operational Meaning |
|---|---|---|
| Technique family | pattern family, architecture pattern | top-level strategy class (Saga, CQRS, Queueing, etc.) |
| Specialization | variant, style, mode | specific implementation variant within a family |
| Symptom | failure signal, stress indicator | observable trigger used for technique selection |
| Trade-off | cost/benefit, downside | explicit multi-dimension consequence profile |
| Applicability confidence | fit score, confidence | model/rater confidence for selected specialization |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| Technique applicability rate (SC-TS-1) | share of rows with acceptable applicability and bounded ambiguity | `applicability_confidence`, adjudication labels |
| Trade-off completeness (SC-TS-2) | proportion of rows with >= 3 quantified trade-off dimensions | `benefit_dimensions`, `cost_dimensions`, `tradeoff_score` |
| Complexity evidence quality (SC-TS-3) | completeness + justification quality for complexity rationale | `complexity_score`, `complexity_axis_breakdown`, `complexity_rationale` |
| Token/cost overhead (SC-TS-4) | relative median overhead vs E9 baseline | token and estimated-cost fields + baseline pin |
| Symptom-to-technique precision (SC-TS-5) | adjudicated precision/F1 for symptom-driven matching | symptom fields + adjudication outputs |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E11-CF-001 | Orchestration vs choreography naming overlap | keep both as Saga specializations with explicit failure-mode distinctions | resolved |
| E11-CF-002 | Source pin mutability for one essay source | keep archive pin marked unresolved and track as risk | open |
| E11-CF-003 | Pattern boundary overlap (retry vs circuit breaker) | classify as distinct resilience specializations and require independent metrics | resolved |

## 6. Open Risks and Follow-Up Actions

1. Replace unresolved archive pin (`SRC-HEXAGONAL-ALISTAIR`) with stronger immutable evidence where possible.
2. Complete human adjudication cycle before claim-status upgrade.
3. Keep context bundle synchronized with source and inventory pin updates.
