# Traceability

| Obligation | Design source | SWU | Acceptance evidence |
| --- | --- | --- | --- |
| finite frozen envelope | `SPEC.md#Experiment Envelope` | 001 | schema and manifest vectors |
| deterministic subtraction | `ARCHITECTURE.md#Deterministic Evaluation Rules` | 002 | exhaustive evaluator tests |
| F1 evidence receipt | `SPEC.md#Fixtures` | 003 | reviewed F1 receipt |
| F2 closed negative | `SPEC.md#Suite Calibration` | 004 | F2 receipt and control assertion |
| F3 disputed case | `SPEC.md#Fixtures` | 005 | reviewed F3 receipt |
| fixture and suite results | `ARCHITECTURE.md#Decision Flow View` | 006 | generation-1 result and index |
| independent reproducibility | `SPEC.md#Acceptance Criteria` | 007 | replay and final audit |
| no authority mutation | `SPEC.md#Invariants` | 001-007 | path scan and prohibited-inference audit |
