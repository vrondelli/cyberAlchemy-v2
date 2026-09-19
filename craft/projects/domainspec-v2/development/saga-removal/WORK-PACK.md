---
module: saga-removal
feature_code: SGRM
version: current
status: completed
updatedAt: 2026-07-11
docType: work-pack
---

# WORK-PACK: Remove Active Saga Surfaces

Canonical executable plan for retiring Saga from active DomainSpec v2 authority
and implementation while preserving historical evidence.

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | completed | SGRM-001..008 passed; repository-local migration and read-model closeout are complete. |
| complexity | high | Cross-owner authority migration, destructive file removal, validator rule addition, and broad current-plan sync. |
| outputMode | split | Task and wave contracts live under work-pack/. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Cross-task choreography only. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 boundaries and promotion evidence. |
| dispatchTechniqueTrace | [saga-removal.dispatch.json](saga-removal.dispatch.json) | Validated full dispatch required by owner split and irreversible migration. |
| distillValidationStatus | pass | First SWU is bounded and recomposes into the target state. |
| activeLayerWindow | closed | All planned layers and SWUs are complete. |
| readinessProfile | pilot | Internal authority migration; not release packaging. |

## Objective Summary

Remove Saga from active DS-D1, DS-D8, implementation, validation, projections,
and executable plans. Preserve historical research and superseded decisions.
Workflow absorbs intra-feature and cross-feature orchestration.

Primary inputs:

- [Collapse decision](../ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md)
- [Accepted evidence](../ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md)
- [Implementation plan](IMPLEMENTATION-PLAN.md)
- [Active census](ACTIVE-SURFACE-CENSUS.md)

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-SGRM-001 | Removal contract and live census are frozen. | L0 | [W0](work-pack/waves/W0.md) | none | packet review; path existence; diff guard |
| S-SGRM-002 | Canonical DS-D1/DS-D8 no longer names Saga actively. | L1 | [W1](work-pack/waves/W1.md) | SGRM-001 | YAML parse; validate:rels; stable-ID review |
| S-SGRM-003 | Workflow authoring and validators replace Saga completely. | L2 | [W2](work-pack/waves/W2.md) | SGRM-002 | content, relationship, instance, non-collapse, type tests |
| S-SGRM-004 | Current plans/read models agree and zero active Saga references remain. | L3 | [W3](work-pack/waves/W3.md) | SGRM-003 | classified reference audit; full validate; index parse |

## Task Status Board

| Task | Goal | Layer | Wave | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-SGRM-CONTRACT](work-pack/tasks/TASK-SGRM-CONTRACT.md) | Freeze migration packet and live target manifest. | L0 | W0 | decision accepted | completed |
| [TASK-SGRM-AUTHORITY](work-pack/tasks/TASK-SGRM-AUTHORITY.md) | Remove Saga from canonical DS-D1/DS-D8 and clear its obsolete schema edge projection. | L1 | W1 | SGRM-001 + refresh bridge | completed |
| [TASK-SGRM-IMPLEMENTATION](work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md) | Migrate Workflow schemas, fixtures, tools, and tests. | L1/L2 | W1/W2 | SGRM-001/002 | completed |
| [TASK-SGRM-SYNC](work-pack/tasks/TASK-SGRM-SYNC.md) | Reconcile current docs and contradictory plans. | L3 | W3 | SGRM-005 | completed |
| [TASK-SGRM-VERIFY](work-pack/tasks/TASK-SGRM-VERIFY.md) | Prove zero active surface and close read models. | L3 | W3 | SGRM-006 | completed |

## SWU Manifest

| SWU | Parent | Goal | Dependencies | Write scope | Done criteria | Acceptance evidence | Validation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-SGRM-001 | [CONTRACT](work-pack/tasks/TASK-SGRM-CONTRACT.md) | Produce owner-reviewed migration packet and refreshed active/historical manifest. | collapse decision | saga-removal run artifacts only | Targets, mapping, compatibility, owners, stop/rollback rules frozen; satisfies SWU-DSD1-009 planning obligation. | MIGRATION-PACKET.md, ACTIVE-REFERENCE-MANIFEST.json, Task Session receipt. | JSON parse; path checks; git diff check | local-fallback | completed |
| SWU-SGRM-002 | [AUTHORITY](work-pack/tasks/TASK-SGRM-AUTHORITY.md) | Remove active Saga authority, widen Workflow orchestrates, and clear the obsolete schema edge projection. | SGRM-001 + applied refresh | definitions/, root projections, saga.schema.yml `edge_participation.source_of` only | DS-D1.10 absent without renumbering; one Workflow orchestrates row covers both scopes; no active root Saga reference; legacy schema source-of is empty. | focused authority/schema-field diff, migration receipt, root parse. | validate:rels; validate:docs; YAML parse | manual | completed |
| SWU-SGRM-003 | [IMPLEMENTATION](work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md) | Add attribute-one-of support end to end and reconcile stale full-suite locks. | SGRM-001 + accepted lock/fixture decisions | validate-content, instances, noncollapse library/CLI, focused tests, positive relationship fixture/test | Both allowed values pass; unknown/missing values fail; generator deterministic; rule classified attestation; current registry expects zero collapse candidates; positive fixture uses Workflow and 30 signatures. | focused/full tool tests and generated-instance evidence. | tools:test; instances round trip; typecheck | local-fallback | completed |
| SWU-SGRM-004 | [IMPLEMENTATION](work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md) | Delete Saga schema/card/fixtures/generated instance and migrate Workflow fixtures/card/schema. | SGRM-002, SGRM-003 | impl/spec/meta-types/behavioral, mt fixtures, generated Workflow/Saga instances | No active Saga file; Workflow has intra/cross positives and invalid-scope negative. | file census, fixture results, content/instance validation. | validate:content; instances round trip; docs | local-fallback | completed |
| SWU-SGRM-005 | [IMPLEMENTATION](work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md) | Migrate relationship/non-collapse fixtures, validators, and acceptance locks. | SGRM-002, SGRM-004 | relationship fixtures; tools and tests | Cross-feature Workflow passes; Saga source fails; no hard-coded Saga merge expectation; generic non-collapse tests remain. | focused test output and full validation receipt. | validate:rels; tools:test; typecheck; validate | local-fallback | completed |
| SWU-SGRM-006 | [SYNC](work-pack/tasks/TASK-SGRM-SYNC.md) | Remove active Saga claims from current docs and cancel contradictory hardening routes. | SGRM-005 | current docs/projections and active development plans only | Current taxonomy/docs use Workflow scope; Saga-hardening SWUs cancelled/superseded; historical artifacts untouched. | [classified status](runs/SWU-SGRM-006/CURRENT-PLAN-STATUS.md) and [receipt](runs/SWU-SGRM-006/TASK-SESSION-RESULT.md). | validate:docs; current-plan scan; git diff check | local-fallback | completed |
| SWU-SGRM-007 | [VERIFY](work-pack/tasks/TASK-SGRM-VERIFY.md) | Add and run zero-active-Saga reference audit. | SGRM-006 | validation script/allowlist and tests | Every Saga match is explicitly historical/evidence-classified; injected active match fails. | [machine report](runs/SWU-SGRM-007/ZERO-ACTIVE-SAGA-REPORT.json), [human summary](runs/SWU-SGRM-007/ZERO-ACTIVE-SAGA-SUMMARY.md), and [receipt](runs/SWU-SGRM-007/TASK-SESSION-RESULT.md). | audit test; JSON/YAML parse | local-fallback | completed |
| SWU-SGRM-008 | [VERIFY](work-pack/tasks/TASK-SGRM-VERIFY.md) | Recompose, sync Craft/Inventory/observability, and close. | SGRM-007 | result receipt and read models | Full suite passes; work-packs, indexes, and receipts agree; authority claim does not exceed execution. | [final Task Session result](runs/SWU-SGRM-008/TASK-SESSION-RESULT.md), [validation summary](runs/SWU-SGRM-008/VALIDATION-SUMMARY.md), and indexed Inventory result. | validate; instances; typecheck; reference audit; index parse | local-fallback | completed |

## Blockers And Gaps

| ID | Type | State | Owner | Repair path |
| --- | --- | --- | --- | --- |
| GAP-SGRM-EXTERNAL-CONSUMERS | bounded residual uncertainty | no evidence in repository-local census | project owner | Reopen compatibility through a decision gate if an external or persisted consumer is later discovered. |
| GAP-SGRM-SCOPE-VOCAB | bounded assumption | accepted for this plan | DS-D1/DS-D8 owners | Preserve intra-feature to same-feature mapping; do not expand scope. |
| GAP-SGRM-HISTORY-CLASSIFICATION | execution gap | resolved | SGRM-001/007 | Exact digested allowlist and seeded active failure pass in SWU-SGRM-007. |
| GAP-SGRM-REL-VALIDATION-CYCLE | execution blocker | resolved-by-refresh | SGRM-002 | Clear only the legacy schema's obsolete source-of projection during the authority mutation; retain SGRM-004 deletion ownership. |
| GAP-SGRM-NONCOLLAPSE-LOCK-ORDER | execution blocker | resolved-option-1 | SGRM-003/005 | SGRM-003 removes only the obsolete pair lock/current-registry baseline; SGRM-005 retains fixtures and generic hardening. |
| GAP-SGRM-REL-FIXTURE-ORDER | execution blocker | resolved-option-1 | SGRM-003/005 | SGRM-003 synchronizes only the positive Workflow fixture/test; SGRM-005 retains the negative Saga-source proof and remaining fixture hardening. |

## Completed Route

SWU-SGRM-001 through SWU-SGRM-008 completed in sequence. The final receipt
closes the repository-local package without claiming knowledge of unobserved
external consumers.

## Gate Checks

1. Never delete historical research, prior decisions, telemetry, or receipts.
2. Never renumber stable DS-D1 IDs after DS-D1.10.
3. Never remove the orchestrates verb; migrate its source authority to Workflow.
4. Stop on any external/persisted Saga consumer evidence.
5. Execute one SWU per Task Session and return the standard receipt shape.
6. Do not synchronize current plans before their corresponding mutation receipt
   exists.
