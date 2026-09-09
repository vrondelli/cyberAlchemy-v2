# TASK-IOLM-003 — Ontology and Craft Witnesses

## Objective and mapping

- Slice/layer/wave: S-003 / L1 / W2.
- Objective: prove the candidate model can traverse an owner-admitted DomainSpec relation unchanged, retain invalid local mappings as typed residue, express a positive feature journey, and preserve five honest Craft claim classes.
- Dependencies: TASK-IOLM-002-A and TASK-IOLM-001.

## Source contracts

- [SPEC — Witnesses](../../SPEC.md#witnesses)
- [UX journeys](../../UX-PLAN.md#journey-j-01-intention-to-residue)
- [AEO SPEC](../../../../../projects/domainspec-v2/impl/spec/features/agent-execution-orchestrator/SPEC.md#feature-concept-graph)
- [Financial Settlement SPEC](../../../../../projects/domainspec-v2/impl/spec/features/financial-settlement/SPEC.md#feature-concept-graph)
- [Craft honesty boundary](../../../../../arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md#the-honesty-boundary)

## SWU-IOLM-003-A — Typed-negative AEO witness

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-002-A pass |
| Source anchors | bound FPR-04 `Sg`; AEO Concept Registry, Feature Concept Graph, and Omitted Source Rows as source/learner anchors only; `EGI-008`, `EGI-010`, `EGI-011` |
| Related context | [mappings witness table](../../mappings.md#witness-mapping) |
| Write scope | `prototype/fixtures/aeo/` and `prototype/tests/witnesses/` |
| Done criteria | traverse the imported admitted relation without reconstructing it; rejected local `enforces` attempt becomes residue/challenge only; missing/empty input fails; local-edge collision fails; all independent retraction mutants fail |
| Acceptance evidence | endpoint receipt plus unchanged imported-edge identity, EGI-008/010/011 receipts, and assertion that rejected relation ID is absent from semantic relation IDs |
| Validation surface | focused witness/schema tests |
| Execution owner | Task Session; DomainSpec witness implementer |
| Handoff | return imported/rejected IDs, exact `Sg` handle, source refs, NOT_RUN runtime posture, and residue routed to existing FPR-04/FPR-05/FPR-07 owners |

## SWU-IOLM-003-B — Positive Financial and Craft learning fixtures

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-003-A pass |
| Source anchors | Financial Concept Registry/Graph; Craft formal model, philosophical horizon, honesty boundary |
| Related context | UX J-01/J-02; glossary SWU warning |
| Write scope | `prototype/fixtures/financial-settlement/`, `prototype/fixtures/craft/`, and witness tests |
| Done criteria | positive relation chain and complete intention-to-residue journey; each Craft card has claim class, proof/verification posture, and no upward proof cast |
| Acceptance evidence | fixture compilation, exact anchor resolution, claim-ladder negative test, documentary/runtime distinction |
| Validation surface | witness suite and serialized view inspection |
| Execution owner | Task Session; learning-content fixture implementer |
| Handoff | return journey IDs, proposition IDs, claim postures, unresolved content terms |

## Synchronization and completion

Execute A then B. AEO and Financial feature tables remain learning/source anchors, not an admitted-relation construction path. Fixed fixture content is evidence scaffolding, not maintained editorial authority. Task completes only when negative information remains visible without contaminating semantic relations or changing the imported `Sg`.
