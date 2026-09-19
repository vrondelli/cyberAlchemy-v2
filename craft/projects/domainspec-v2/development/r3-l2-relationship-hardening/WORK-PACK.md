---
module: r3-l2-relationship-hardening
feature_code: R3H
version: current
status: draft
updatedAt: 2026-07-11
docType: work-pack
observedCapability: invoke
invokeMode: plan
---

# WORK-PACK: R3/L2 Relationship Hardening

## Route Update: 2026-07-11

The accepted Saga collapse supersedes the Saga-law slice. TASK-R3H-SAGA-LAWS
and SWU-R3H-006/007 are cancelled/not-selected and remain only as historical
planning evidence. Active R3H execution covers signature identity, Entity
relationship semantics, projection synchronization, and verification.

Canonical executable plan for addressing the relationship/category research findings. This plan is
non-mutating until a later `task-session` executes one SWU.

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | The first SWU is executable; non-blocking future theory remains deferred. |
| complexity | medium | More than two artifacts and touches root authority, validator, projection, fixtures, and closeout. |
| outputMode | split | Task and wave files exist under `work-pack/`. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Wave choreography only; SWU definitions remain here and in task files. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | Layer governance and promotion decisions. |
| dispatchTechniqueTrace | inline | Full dispatch JSON not required: one straightforward Task Session route, no parallel subagent dispatch now. |
| distillValidationStatus | pass | See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md). |
| activeLayerWindow | L0 | Start with signature identity. |
| lastUpdatedAt | 2026-07-02 | |
| readinessProfile | pilot | R3H hardening evidence, not public release. |

## Objective Summary

- Objective: harden the active R3 relationship authority so research findings become finite root law,
  validator checks, projection guidance, fixtures, and closeout evidence.
- Primary inputs: [DESIGN.md](DESIGN.md), [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md),
  [findings.md](../r3-research/l2-first-class-categories-cross-domain/findings.md), and
  [relationships.yml](../../definitions/relationships/relationships.yml).
- Success condition: active relationship signatures have stable identity; `owns` and `belongs-to`
  obligations have finite machine/human law; deferred candidates remain deferred; validation passes.

## Planning Mapping

| Planning Source | Work-Pack Target | Mapping Rule |
| --- | --- | --- |
| Research findings | Delivery slices and traceability | Every finding maps to a task, explicit deferral, or closeout receipt. |
| Design decisions | Task/SWU write scope | No SWU may contradict R3H-D1..D8. |
| Implementation layering | Waves W0-W3 | Each wave answers one layer question. |
| Root authority | SWU source anchors | Root files are modified before projections. |
| Validator/projection | Validation strategy | Implementation consumes root, never owns relationship law. |
| Distill validation | Gate checks | First executable unit is SWU-R3H-001. |

## Delivery Slices

| Slice ID | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-R3H-001 | Stable signature identity without breaking human edge verbs | L0 | [W0](work-pack/waves/W0.md) | none | `npm --prefix projects/domainspec-v2/impl run tools:test`; focused duplicate-key fixture/review |
| S-R3H-002 | `owns` and `belongs-to` hardened with finite law fields | L1 | [W1](work-pack/waves/W1.md) | S-R3H-001 | `validate:rels`, `tools:test`, review root examples |
| S-R3H-003 | Superseded Saga-law slice retained as historical planning evidence | L2 | [W2](work-pack/waves/W2.md) | none | cancelled/not-selected by accepted collapse |
| S-R3H-004 | Human/projection docs and deferred residue synchronized | L3 | [W3](work-pack/waves/W3.md) | S-R3H-001..002 | `validate:docs`, `validate`, `git diff --check` |
| S-R3H-005 | Final R3H closeout receipt | L3 | [W3](work-pack/waves/W3.md) | S-R3H-004 | command receipts and traceability review |

## Task Status Board

| Task ID | Goal | Layer | Complexity | Waves | Source | Gate Status | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [TASK-R3H-IDENTITY](work-pack/tasks/TASK-R3H-IDENTITY.md) | Add stable machine identity for active signatures | L0 | medium | [W0](work-pack/waves/W0.md) | root relationships, validator loader | ready | not-started |
| [TASK-R3H-ENTITY-SEMANTICS](work-pack/tasks/TASK-R3H-ENTITY-SEMANTICS.md) | Harden `owns` and `belongs-to` without splitting current authoring surface | L1 | medium | [W1](work-pack/waves/W1.md) | research findings, root relations | ready-after-identity | not-started |
| [TASK-R3H-SAGA-LAWS](work-pack/tasks/TASK-R3H-SAGA-LAWS.md) | Retain superseded Saga-law plan as evidence | L2 | medium | [W2](work-pack/waves/W2.md) | accepted collapse decision | closed | superseded-cancelled |
| [TASK-R3H-PROJECTION-VALIDATION](work-pack/tasks/TASK-R3H-PROJECTION-VALIDATION.md) | Sync projection, docs, fixtures, and validation surfaces | L2/L3 | medium | [W2](work-pack/waves/W2.md), [W3](work-pack/waves/W3.md) | implementation projection and tests | ready-after-active-law-fields | not-started |
| [TASK-R3H-VERIFY](work-pack/tasks/TASK-R3H-VERIFY.md) | Complete validation and research closeout receipt | L3 | low | [W3](work-pack/waves/W3.md) | all R3H tasks | ready-after-implementation | not-started |

## SWU Manifest

| SWU ID | Parent Task | Source Anchors | Related Context | Dependencies | Write Scope | Done Criteria | Acceptance Evidence | Validation Surface | Execution Owner | Handoff Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-R3H-001 | [TASK-R3H-IDENTITY](work-pack/tasks/TASK-R3H-IDENTITY.md) | `definitions/relationships/relationships.yml`; `impl/tools/lib/relationship-signatures.ts` | duplicate `orchestrates` risk | none | `projects/domainspec-v2/definitions/relationships/relationships.yml`; `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts` | Active signatures have unique `signature_key`; `id` still drives authored graph rows. | Loader rejects duplicate/missing keys or review check records migration exception. | `npm --prefix projects/domainspec-v2/impl run tools:test` | local-fallback | selected-first |
| SWU-R3H-002 | [TASK-R3H-IDENTITY](work-pack/tasks/TASK-R3H-IDENTITY.md) | `impl/tools/tests/validate-relationships.test.ts`; relationship fixtures | endpoint matching by typed signature | SWU-R3H-001 | `projects/domainspec-v2/impl/tools/tests/`; `projects/domainspec-v2/impl/spec/__fixtures__/relationships/` | Tests prove active signature identity and reject duplicate keys without relying on a removed type. | Focused positive and negative tests pass. | `npm --prefix projects/domainspec-v2/impl run tools:test` | local-fallback | ready-after-001 |
| SWU-R3H-003 | [TASK-R3H-ENTITY-SEMANTICS](work-pack/tasks/TASK-R3H-ENTITY-SEMANTICS.md) | `relationships.yml` `owns`; `findings.md` attention point 2 | observable ownership consequences | SWU-R3H-001 | `projects/domainspec-v2/definitions/relationships/relationships.yml`; docs if needed | `owns` declares `authority_effects` and examples/non-examples tie to those effects. | Root review shows at least one observable effect and no inverse collapse. | `validate:rels`; metadata review or tool test | local-fallback | ready-after-001 |
| SWU-R3H-004 | [TASK-R3H-ENTITY-SEMANTICS](work-pack/tasks/TASK-R3H-ENTITY-SEMANTICS.md) | `relationships.yml` `belongs-to`; first-class boundary findings | polysemy risk | SWU-R3H-001 | `projects/domainspec-v2/definitions/relationships/relationships.yml`; `relationships.md` | `belongs-to` declares `semantic_kinds` for membership, classification, and home assignment with examples/non-examples. | Docs state split trigger if one law cannot cover the kinds. | `validate:docs`; review check | local-fallback | ready-after-001 |
| SWU-R3H-005 | [TASK-R3H-ENTITY-SEMANTICS](work-pack/tasks/TASK-R3H-ENTITY-SEMANTICS.md) | validator library | metadata obligations | SWU-R3H-003, SWU-R3H-004 | `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts`; tests | Loader/validator reports missing required hardening metadata for targeted signatures. | Seeded fixture or unit test fails before/pass after. | `npm --prefix projects/domainspec-v2/impl run tools:test` | local-fallback | ready-after-003-004 |
| SWU-R3H-006 | [TASK-R3H-SAGA-LAWS](work-pack/tasks/TASK-R3H-SAGA-LAWS.md) | superseded Saga-law proposal | none | none | none | Do not execute after accepted collapse. | Governing decision and SGRM route. | status review | none | cancelled-not-selected |
| SWU-R3H-007 | [TASK-R3H-SAGA-LAWS](work-pack/tasks/TASK-R3H-SAGA-LAWS.md) | superseded Saga-law validation proposal | none | none | none | Do not execute after accepted collapse. | Governing decision and SGRM route. | status review | none | cancelled-not-selected |
| SWU-R3H-008 | [TASK-R3H-PROJECTION-VALIDATION](work-pack/tasks/TASK-R3H-PROJECTION-VALIDATION.md) | `relationships.md`; `impl/spec/RELATIONSHIPS.md` | projection sync | SWU-R3H-003..005 | `projects/domainspec-v2/definitions/relationships/relationships.md`; `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md` | Human root and implementation projection mention identity policy, `owns` effects, `belongs-to` semantic kinds, and deferred residues. | Docs validate and wording does not move authority into `impl/`. | `npm --prefix projects/domainspec-v2/impl run validate:docs` | local-fallback | ready-after-active-law-fields |
| SWU-R3H-009 | [TASK-R3H-PROJECTION-VALIDATION](work-pack/tasks/TASK-R3H-PROJECTION-VALIDATION.md) | deferred list in root and research findings | residue routing | SWU-R3H-008 | `projects/domainspec-v2/definitions/relationships/`; optional R3H closeout note | Deferred candidates record witness criteria and owner route; no deferred edge becomes active. | Traceability table maps each research finding to closed/deferred. | review check; `validate:docs` | manual | ready-after-008 |
| SWU-R3H-010 | [TASK-R3H-VERIFY](work-pack/tasks/TASK-R3H-VERIFY.md) | all active touched files and command surfaces | closeout | SWU-R3H-001..005, SWU-R3H-008..009 | R3H receipt artifact only unless validation fixes needed | Final receipt records files touched, command results, cancelled Saga lane, unresolved gaps, and next route to R3C. | `validate:rels`, `tools:test`, `validate:docs`, `validate`, `git diff --check` pass or blockers recorded. | command suite | local-fallback | ready-after-implementation |

## Blockers And Gaps

| ID | Scope | Type | Owner | State | Repair Path |
| --- | --- | --- | --- | --- | --- |
| R3H-GAP-BELONGING-KIND | `belongs-to` | non-blocking future design gap | relationship authority owner | deferred | Introduce per-instance `belonging_kind` or split verbs only if flat graph evidence requires it. |
| R3H-GAP-CATEGORY-LAWS | full category law | non-blocking future theory gap | research/definitions-governance | deferred | Separate future research/definitions pass for identity arrows, composition, closure, associativity, and path equations. |
| R3H-GAP-DEPENDS-ON | `depends-on` | deferred candidate | definitions-governance | deferred | Promote only with dependency kind, cycle/order law, and reject/allow witness. |

## Dispatch Technique Trace

| Technique ID | Applied To | Validation Expectation | Status |
| --- | --- | --- | --- |
| sequence | design -> layering -> work-pack -> task-session handoff | Each task consumes prior design/layer decisions. | pass |
| scu_swu_reduction | SWU manifest | SWU-R3H-001 is the first executable unit and every SWU has one parent task. | pass |
| recomposition_proof | R3H unit -> root relationship authority -> R3 closeout | Active tasks recompose after removing the superseded Saga-law lane. | pass |
| validation_loop | every delivery slice | Each slice has command or review evidence. | pass |
| owner_boundary_check | Invoke vs Task Session vs root authority | Invoke authors plan; Task Session executes; root definitions own authority. | pass |
| handle_handoff | next route | Handoff uses artifact paths and SWU IDs, not copied context. | pass |
| residue_ledger | non-blocking future gaps | Deferred candidates and category laws stay visible. | pass |
| execution_receipt_handoff | SWU execution | Expected receipt includes files touched, validation, blockers, residue, and reroute. | pass |

## Distill Validation

See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md).

| Check | Result | Evidence Or Gap |
| --- | --- | --- |
| Smallest coherent unit or SWU boundary | pass | SWU-R3H-001 is small and unlocks every later metadata check. |
| Recomposition proof | pass | Identity, entity semantics, projection sync, and verification recompose after the Saga-law cancellation. |
| Hidden acceptance-critical gaps | pass | `belongs-to` split and full category laws are explicitly deferred, not required for R3H completion. |
| Deferred complexity | pass | No full category law, per-instance graph metadata, or future candidate promotion is pulled into L0-L3. |
| Navigation to first executable unit | pass | Start with [TASK-R3H-IDENTITY](work-pack/tasks/TASK-R3H-IDENTITY.md), SWU-R3H-001. |

## Required Links

- [DESIGN.md](DESIGN.md)
- [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md)
- [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md)
- [EXECUTION-PACK.md](EXECUTION-PACK.md)
- [PLAN-TRANSPORT.md](PLAN-TRANSPORT.md)
- [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md)
- [work-pack/shared/context.md](work-pack/shared/context.md)
- [work-pack/shared/traceability.md](work-pack/shared/traceability.md)
- [work-pack/shared/cross-task-gaps.md](work-pack/shared/cross-task-gaps.md)

## Gate Checks

1. Execute one SWU at a time unless write scopes are disjoint and a merge plan exists.
2. Start with SWU-R3H-001.
3. Do not mutate implementation projection before root authority changes exist.
4. Do not promote `depends-on`, Operation-returned Value Object, Event payload/publisher composite, or category laws in this work-pack.
5. Keep `id` as human edge verb and `signature_key` as machine identity.
6. Work-pack completion requires validation receipts or concrete blockers for every command in SWU-R3H-010.
7. Do not schedule TASK-R3H-SAGA-LAWS or SWU-R3H-006/007; they are superseded historical planning evidence.

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-11 | Cancelled the Saga-law task/SWUs after accepted collapse and removed them from active dependencies and gates. | task-session |
| 2026-07-02 | Initial invoke design and plan package created from R3/L2 relationship research findings. | invoke |
