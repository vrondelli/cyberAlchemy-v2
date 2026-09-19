---
module: ds-d1-improvement-plan
feature_code: DSD1
version: current
status: draft
updatedAt: 2026-07-11
docType: work-pack
---

# WORK-PACK: DS-D1 Improvement Plan

Canonical executable plan for improving DS-D1 after the DS-D1 meta-type
category-boundary findings. This is a planning package only; Task Session owns
execution of any SWU.

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | flag | The Saga decision and repository-local collapse migration are complete through SGRM-008; UI remains owner-gated and backend hardening remains open. |
| complexity | medium | One project, but crosses definitions, schemas, fixtures, validators, projections, Craft, and Inventory. |
| outputMode | split | Task and wave files are under `work-pack/`. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Wave choreography only; SWU contracts remain here and in task files. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 decision boundary. |
| dispatchTechniqueTrace | [ds-d1-improvement.dispatch.json](ds-d1-improvement.dispatch.json) | Full dispatch JSON required because this crosses lifecycle owners. |
| distillValidationStatus | flag | Saga routing is resolved; the UI-11 path remains an owner decision. |
| activeLayerWindow | L1/L2 | Continue the UI owner route or independent backend semantic hardening; the SGRM migration route is closed. |
| readinessProfile | pilot | Internal governed improvement plan, not public release packaging. |

## Objective Summary

Improve DS-D1 by turning the staged-authority research result into executable
work: align maturity status, decide and execute the UI-11 path, harden high-risk
backend type laws, keep DS-D8/DS-D1 ownership separate, and close the read
models after validation.

Primary inputs:

- [DS-D1 findings](../r3-research/ds-d1-metatype-category-boundary/findings.md)
- [Current DS-D1 registry](../../definitions/meta-types/meta-types.yml)
- [Human DS-D1 cards](../../definitions/meta-types/meta-types.md)
- [Formalization work-pack](../meta-type-formalization/WORK-PACK.md)
- [Definitions work-pack](../meta-type-definitions/WORK-PACK.md)
- [DS-D8 relationship authority](../../definitions/relationships/relationships.yml)
- [Craft current state](../../CRAFT.md)

Success condition: all authoritative and planning surfaces distinguish backend
shape candidates from semantic hardening, UI endpoint-use from DS-D1 formation
authority, completed Saga collapse routing, and State Machine high-risk laws from future category-law work.

## Planning Mapping

| Planning Source | Work-Pack Target | Mapping Rule |
| --- | --- | --- |
| DS-D1 findings | All tasks | Convert research verdicts into owner-routed SWUs. |
| Meta-type formalization | TASK-DSD1-VALIDATORS and TASK-DSD1-BACKEND | Reuse existing schema+fixture+validator convention; do not create a parallel format. |
| Meta-type definitions | TASK-DSD1-LEDGER and TASK-DSD1-UI11 | Reconcile candidate approval language with staged authority. |
| Root definitions | TASK-DSD1-SYNC | Root owns DS-D1/DS-D2/DS-D8 cards and indexes. |
| DS-D8 relationships | TASK-DSD1-SAGA and TASK-DSD1-BACKEND | Relationship signatures are evidence pressure, not DS-D1 formation authority. |
| Craft/Inventory | TASK-DSD1-SYNC and TASK-DSD1-VERIFY | Keep continuation state and read models searchable. |

## Delivery Slices

| Slice ID | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-DSD1-001 | Staged authority is explicit everywhere | L0 | [W0](work-pack/waves/W0.md) | none | `validate:docs`; scoped diff review |
| S-DSD1-002 | UI-11 path selected and first formalization slice ready or authority narrowed | L1 | [W1](work-pack/waves/W1.md) | S-DSD1-001 | `validate`, `tools:test`, generated-instance checks if schemas added |
| S-DSD1-003 | Saga/Workflow fork resolved and collapse routed through the SGRM package | L2 | [W2](work-pack/waves/W2.md) | S-DSD1-001 | SGRM-001..008 receipts; repository-local migration complete |
| S-DSD1-004 | High-risk backend semantics hardened with finite witnesses | L2 | [W2](work-pack/waves/W2.md) | S-DSD1-001 | `tools:test`, `validate:content`, `instances:validate` |
| S-DSD1-005 | Closeout, projections, and read models synchronized | L3 | [W3](work-pack/waves/W3.md) | S-DSD1-001..004 as applicable | `validate`, JSON/YAML/JSONL parse, docs links |

## Task Status Board

| Task ID | Goal | Layer | Complexity | Waves | Source | Gate Status | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [TASK-DSD1-LEDGER](work-pack/tasks/TASK-DSD1-LEDGER.md) | Align DS-D1 maturity/state language | L0 | medium | [W0](work-pack/waves/W0.md) | findings + definitions | swu-001-complete; swu-002-conditional | in-progress |
| [TASK-DSD1-UI11](work-pack/tasks/TASK-DSD1-UI11.md) | Decide and execute UI-11 formation path | L1 | medium | [W1](work-pack/waves/W1.md) | MT5 deferred | blocked-on-ui-decision after SWU-003 | not-started |
| [TASK-DSD1-SAGA](work-pack/tasks/TASK-DSD1-SAGA.md) | Resolve Saga harden-vs-collapse fork | L2 | medium | [W2](work-pack/waves/W2.md) | decision + SGRM receipts | collapse-selected-and-migrated | completed-collapse-migrated |
| [TASK-DSD1-BACKEND](work-pack/tasks/TASK-DSD1-BACKEND.md) | Harden high-risk backend type laws | L2 | medium | [W2](work-pack/waves/W2.md) | per-type verdict matrix | ready-after-ledger | not-started |
| [TASK-DSD1-VALIDATORS](work-pack/tasks/TASK-DSD1-VALIDATORS.md) | Extend criterion/fixture/test support for selected hardening | L2/L3 | medium | [W2](work-pack/waves/W2.md) | validate-content + instances | ready-after-selected-schemas | not-started |
| [TASK-DSD1-SYNC](work-pack/tasks/TASK-DSD1-SYNC.md) | Sync projections, definitions, Craft, Inventory, and observability | L3 | medium | [W3](work-pack/waves/W3.md) | completed SWUs | ready-after-implementation | not-started |
| [TASK-DSD1-VERIFY](work-pack/tasks/TASK-DSD1-VERIFY.md) | Completion verification and recomposition check | L3 | low | [W3](work-pack/waves/W3.md) | all receipts | ready-after-sync | not-started |

## SWU Manifest

| SWU ID | Parent Task | Source Anchors | Dependencies | Write Scope | Done Criteria | Acceptance Evidence | Validation Surface | Execution Owner | Handoff Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-DSD1-001 | [TASK-DSD1-LEDGER](work-pack/tasks/TASK-DSD1-LEDGER.md) | `findings.md`; `definitions/meta-types/`; `development/meta-type-definitions/`; `CRAFT.md` | none | DS-D1 status/read-model docs only | At execution time, surfaces consistently stated backend 14 shape candidates and 11 formation-deferred UI labels; SGRM receipts now supersede the backend count to 13. | [Task Session receipt](task-sessions/2026-07-11-swu-dsd1-001/TASK-SESSION-RESULT.md); no schema/validator mutation. | `validate:docs`; YAML/count checks; `git diff --check` | local-fallback | completed 2026-07-11; count superseded by SGRM |
| SWU-DSD1-002 | [TASK-DSD1-LEDGER](work-pack/tasks/TASK-DSD1-LEDGER.md) | `TAXONOMY.md`; `LEARNING-ORDER.md`; impl projections | SWU-DSD1-001 | projection docs only | Reading aids no longer imply UI DS-D1 formation authority or semantic proof for backend shapes. | Projection drift note exists; root authority remains definitions/. | `validate:docs`; review check | local-fallback | ready-after-001 |
| SWU-DSD1-003 | [TASK-DSD1-UI11](work-pack/tasks/TASK-DSD1-UI11.md) | findings UI row; `CANDIDATES.md`; DS-D8 UI signatures | SWU-DSD1-001 | decision record only | Owner chooses add UI schemas now, narrow 25-type claim, or defer with explicit acceptance. | Decision record names selected route and blocked alternatives. | manual owner review + `validate:docs` | manual | owner-decision |
| SWU-DSD1-004 | [TASK-DSD1-UI11](work-pack/tasks/TASK-DSD1-UI11.md) | UI 11 decision; existing schema+md convention | SWU-DSD1-003 if add-ui | `impl/spec/meta-types/ui/`; tests/fixtures for Page, Layout, Component, View Model | First UI slice has cards, schemas, pos/neg fixtures, and tests. | `schemas` count increases; fixtures discriminate; generated instances validate if supported. | `tools:test`; `validate:content`; `instances:generate`; `instances:validate` | subagent | conditional-ready |
| SWU-DSD1-005 | [TASK-DSD1-UI11](work-pack/tasks/TASK-DSD1-UI11.md) | UI 11 decision; DS-D8 UI signatures | SWU-DSD1-004 if add-ui | remaining UI schemas/fixtures/tests | Hook, Form, Action, Guard, Binding, Adapter, State Indicator are formalized or explicitly deferred. | Each selected type has correction contract and fixtures; unselected labels stay formation-deferred. | `tools:test`; `validate`; `instances:validate` | subagent | conditional-ready |
| SWU-DSD1-006 | [TASK-DSD1-UI11](work-pack/tasks/TASK-DSD1-UI11.md) | UI decision; definitions/meta-types registry | SWU-DSD1-003 | definitions/projection docs | If UI is not formalized now, the 25-type claim is narrowed or marked staged everywhere. | No surface claims UI DS-D1 authority from DS-D8 endpoint use. | `validate:docs`; review check | local-fallback | conditional-ready |
| SWU-DSD1-007 | [TASK-DSD1-SAGA](work-pack/tasks/TASK-DSD1-SAGA.md) | findings Saga fork; governing decision | SWU-DSD1-001 | decision record only | Owner chooses harden or collapse. | `DEC-DSD1-SAGA-FORK` selects collapse and names migration requirements. | manual owner review | manual | completed-collapse-selected |
| SWU-DSD1-008 | [TASK-DSD1-SAGA](work-pack/tasks/TASK-DSD1-SAGA.md) | rejected hardening branch | SWU-DSD1-007 if harden | none | Hardening branch is not executed after collapse selection. | Governing decision plus SGRM routing. | status review | none | cancelled-not-selected |
| SWU-DSD1-009 | [TASK-DSD1-SAGA](work-pack/tasks/TASK-DSD1-SAGA.md) | collapse decision; SGRM migration package | SWU-DSD1-007 | SGRM planning and receipt links | Collapse is routed through relationship authority, compatibility, projection, and validation work. | [SGRM migration packet](../saga-removal/runs/SWU-SGRM-001/MIGRATION-PACKET.md) and [SGRM-008 final receipt](../saga-removal/runs/SWU-SGRM-008/TASK-SESSION-RESULT.md). | receipt review; `validate:docs` | manual | completed-collapse-migration |
| SWU-DSD1-010 | [TASK-DSD1-BACKEND](work-pack/tasks/TASK-DSD1-BACKEND.md) | State Machine verdict; Enum schema | SWU-DSD1-001 | State Machine/Enum schemas, fixtures, docs, tests | State Machine requires finite state set and transition relation or weak cases collapse to Enum. | Invalid transition or no-transition State Machine fixture rejects. | `tools:test`; `validate:content`; `instances:validate` | subagent | ready-after-001 |
| SWU-DSD1-011 | [TASK-DSD1-BACKEND](work-pack/tasks/TASK-DSD1-BACKEND.md) | Operation/Event and Rule/Policy verdicts | SWU-DSD1-001 | selected schemas, fixtures, docs, tests | Operation/Event and Rule/Policy distinctions gain finite correction witnesses beyond one attribute where feasible. | Mislabel fixtures reject; `Operation --[emits]--> Event` and `Rule --[applies]--> Operation` stay rejected. | `tools:test`; `validate`; relationship tests | subagent | ready-after-001 |
| SWU-DSD1-012 | [TASK-DSD1-BACKEND](work-pack/tasks/TASK-DSD1-BACKEND.md) | Entity/VO verdicts; `owns`/`belongs-to` | SWU-DSD1-001 | Entity/VO docs/fixtures/tests; relationship examples | Entity ownership/membership and VO equality get finite examples, non-examples, and correction routes. | `owns` vs `belongs-to` examples are not collapsed; VO identity fixture rejects. | `tools:test`; `validate:docs`; review check | subagent | ready-after-001 |
| SWU-DSD1-013 | [TASK-DSD1-VALIDATORS](work-pack/tasks/TASK-DSD1-VALIDATORS.md) | selected hardening SWUs; validator rule kinds | selected schema SWUs | validator rule support and tests | Only rule kinds needed by selected schemas are added; unsupported semantic claims stay deferred. | New rule kinds have black-box CLI tests and generated-instance support where applicable. | `tools:test`; `instances:validate`; `typecheck` | local-fallback | ready-after-selected-schemas |
| SWU-DSD1-014 | [TASK-DSD1-VALIDATORS](work-pack/tasks/TASK-DSD1-VALIDATORS.md) | full selected schema set | SWU-DSD1-013 | validation wiring/docs | Aggregate validation covers selected DS-D1 improvements without importing private delta-rules. | `validate` green; seeded failures fail in focused tests. | `npm --prefix projects/domainspec-v2/impl run validate`; `typecheck` | local-fallback | ready-after-013 |
| SWU-DSD1-015 | [TASK-DSD1-SYNC](work-pack/tasks/TASK-DSD1-SYNC.md) | completed SWU receipts; definitions index; Craft | executed SWUs | definitions indexes, drift audit, Craft, Inventory, observability | Read models and continuation state reflect exactly what was promoted, deferred, rejected, or routed. | Index rows and Craft state agree; JSON/YAML/JSONL parse. | `validate:docs`; JSON/YAML/JSONL parse; `git diff --check` | local-fallback | ready-after-implementation |
| SWU-DSD1-016 | [TASK-DSD1-VERIFY](work-pack/tasks/TASK-DSD1-VERIFY.md) | all receipts | SWU-DSD1-015 | result artifact only | Final result separates completed Saga collapse routing from deferred UI/category-law residue and open backend hardening. | Command suite passes; work-pack status synchronized. | `validate`; `engine:test`; `typecheck`; docs/JSON checks | local-fallback | ready-after-sync |

## Blockers And Gaps

| ID | Scope | Type | Owner | State | Repair Path |
| --- | --- | --- | --- | --- | --- |
| DEC-DSD1-UI11-PATH | TASK-DSD1-UI11 | decision | definitions-governance / owner | blocks UI implementation only | SWU-DSD1-003 |
| DEC-DSD1-SAGA-FORK | TASK-DSD1-SAGA | resolved decision | definitions-governance + relationship authority owner | collapse selected; hardening branch cancelled | SWU-DSD1-007/009; SGRM-001..008 |
| GAP-DSD1-SEMANTIC-DEPTH | TASK-DSD1-BACKEND | evidence gap | DS-D1 owner | active | SWU-DSD1-010..012 |
| GAP-DSD1-CRITERION-RULES | TASK-DSD1-VALIDATORS | tooling gap | validation governance | conditional | SWU-DSD1-013 |
| GAP-DSD1-CATEGORY-LAWS | future route | formalization gap | research / definitions-governance | deferred | keep outside this plan unless separately invoked |

## Dispatch Technique Trace

Full route document: [ds-d1-improvement.dispatch.json](ds-d1-improvement.dispatch.json).

| Technique ID | Applied To | Validation Expectation | Status |
| --- | --- | --- | --- |
| sequence | L0 maturity -> L1 UI -> L2 hardening -> L3 sync | Each layer consumes receipts from the prior layer. | pass |
| scu_swu_reduction | SWU manifest | First unit is SWU-DSD1-001; each SWU has one parent and write scope. | pass |
| recomposition_proof | Distill and verification | DS-D1 improvements recompose into definitions + schemas + validators + read models. | pass |
| validation_loop | each delivery slice | Every mutation-capable SWU has command or review evidence. | pass |
| owner_boundary_check | DS-D1 vs DS-D8 vs implementation projections | Plan does not let DS-D8 promote UI formation authority. | pass |
| authority_split_gate | UI decision and resolved Saga decision | UI remains owner-gated; Saga collapse mutation consumes the recorded owner decision. | pass |
| artifact_contract_bridge | schemas/cards/fixtures/tests | Every selected type law must have machine and human surfaces. | pass |
| execution_receipt_handoff | Task Session | One SWU per execution receipt before work-pack sync. | pass |
| residue_ledger | blockers/gaps | UI path and category laws remain visible; repository-local Saga migration is complete and external-consumer uncertainty remains bounded in SGRM. | pass |

## Distill Validation

| Check | Result | Evidence Or Gap |
| --- | --- | --- |
| Smallest coherent unit or SWU boundary | pass | SWU-DSD1-001 is small, executable, and unlocks all later work. |
| Recomposition proof | pass | L0-L3 map to definitions, schemas, validators, projections, Craft, and Inventory. |
| Hidden acceptance-critical gaps | flag | UI-11 path still requires an owner decision; Saga no longer blocks this plan. |
| Overbuilt abstraction | pass | Full category laws are explicitly deferred. |
| Navigation to first executable unit | pass | SWU-DSD1-001 is complete; dependent owner-decision and backend-hardening SWUs are now dependency-ready, while SWU-DSD1-002 remains conditional. |

**Verdict: flag.** SWU-DSD1-001 is complete and Saga collapse is selected and
routed through SGRM. UI formalization remains owner-gated; projection drift and
backend semantic hardening remain follow-up work.

## Required Links

- [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md)
- [EXECUTION-PACK.md](EXECUTION-PACK.md)
- [PLAN-TRANSPORT.md](PLAN-TRANSPORT.md)
- [ds-d1-improvement.dispatch.json](ds-d1-improvement.dispatch.json)
- [work-pack/shared/context.md](work-pack/shared/context.md)
- [work-pack/shared/cross-task-gaps.md](work-pack/shared/cross-task-gaps.md)
- [work-pack/shared/traceability.md](work-pack/shared/traceability.md)

## Gate Checks

1. Execute only one selected SWU per Task Session receipt.
2. SWU-DSD1-001 is complete; consume its receipt before dependent work.
3. Do not author UI schemas before `DEC-DSD1-UI11-PATH`.
4. Treat `DEC-DSD1-SAGA-FORK` and SGRM-001..008 as consumed: do not reopen the cancelled hardening branch or completed repository-local migration.
5. Do not promote full category laws in this plan.
6. Do not import private derivation delta-rules into public DS-D1 validators.

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-11 | SGRM-008 completed repository-local migration validation and read-model closeout; UI and backend hardening remain independent open work. | task-session |
| 2026-07-11 | Saga collapse decision consumed; SWU-DSD1-008 cancelled and SWU-DSD1-009 routed through SGRM receipts without claiming final closeout. | task-session |
| 2026-07-11 | SWU-DSD1-001 completed; staged maturity read models aligned and dependent SWUs unlocked. | task-session |
| 2026-07-03 | Initial Invoke plan package created from DS-D1 category-boundary findings. | invoke |
