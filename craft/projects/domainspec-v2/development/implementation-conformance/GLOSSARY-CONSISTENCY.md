# Glossary Consistency Report

## Verdict

Pass for package-local Design vocabulary; no canonical promotion performed.

| Term | Consistency result | Action |
| --- | --- | --- |
| Rule | reuses existing DS-D1 kind and formation owner | reference only |
| Operation / Query | reuse existing semantic kinds; “use case” is implementation language only | do not mint `UseCase` |
| State Machine | reuses existing DS-D1 kind; current profile admission gap retained | owner route required |
| `enforces` | preserves Rule to Operation direction | no `uses_rule` edge |
| `transitions` | preserves Event to State Machine direction | runtime transition stays nested data |
| `Obligation` / `RuleSet` | reuse derivation-owner records | owner approval for any widening |
| `ImplementationConformanceProfile` | package-local proposed configuration | no second admission registry |
| `ImplementationBinding` | package-local reconciled projection | code tag remains intended mapping owner |
| `StateMachineRuntimeContract` | package-local fixture contract | not a new ontology kind or runtime owner |
| `EvaluationReceipt` | generated evidence record | never authority |
| `ExceptionRecord` | deferred reference shape | no accepted-with-exception result |
| `NativeEvaluationBundle` | package-local adapter transport | no tool authority |

## Collision Checks

- No `RuleDefinition`, `UseCase`, `uses_rule`, `contains_transition`,
  `EnforcementRuleSet`, or authority-bearing `Violation` was introduced.
- Language realization, module constraints, evaluator references, findings,
  migration rows, and runtime transitions remain nested records.
- CAV2 authority kinds were not extended or redefined.
- “Architecture pattern” refers to owner-held findings or bounded precedent,
  not a newly claimed ontology.
