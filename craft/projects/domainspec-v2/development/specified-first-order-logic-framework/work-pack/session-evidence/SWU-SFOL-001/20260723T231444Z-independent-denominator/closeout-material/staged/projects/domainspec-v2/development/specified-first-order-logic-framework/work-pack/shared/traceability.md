---
module: specified-first-order-logic-framework
status: current
updatedAt: 2026-07-23
docType: work-pack-traceability
---

# Traceability

| Requirement or Decision | Design Component | SWU Evidence |
| --- | --- | --- |
| Independent exact denominator | denominator | 001 |
| Versioned bounded language | language kernel | 002-004 |
| Exact rational independent evaluation | evaluator | 005 |
| Expected-value-free exact binding | binding resolver | 006 |
| Pure observation, proof join, and replay | cases, pure runner, proof | 007 |
| Typed effect relation | evaluator and effect contracts | 008 |
| Contained effect lifecycle | effect harness SPI | 009 |
| Source-owned fenced authoring | source extractor | 010 |
| Financial Settlement proof | consumer adapter | 011 |
| Independent second-adopter proof | consumer adapter | 012 |
| No residue and replayable closure | proof/replay | TASK-SFOL-VERIFY |

## Set Recomposition

| Set | Producer | Independent Check |
| --- | --- | --- |
| `C_spec` | denominator from owner manifest and source handles | SWU-001 negative corpus |
| `C_parsed` | parser | exact join against `C_spec` |
| `C_typed` | typechecker | exact join against `C_spec` |
| `T_generated` | case derivation | missing/extra/duplicate mutation tests |
| `C_bound` | binding resolver | zero/multiple/stale rejection |
| `O_run` | pure or effect runner | observation identity/digest check |
| `R_evaluated` | independent evaluator | exact proof join and replay |

All set comparisons use stable identities and compatible digests.
