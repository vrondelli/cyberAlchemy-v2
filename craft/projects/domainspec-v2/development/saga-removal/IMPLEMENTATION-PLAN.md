---
module: saga-removal
feature_code: SGRM
status: draft
updatedAt: 2026-07-11
docType: implementation-plan
decisionRef: ../ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md
---

# Implementation Plan: Remove Active Saga Surfaces

## Objective

Remove Saga as an active DomainSpec v2 DS-D1 meta-type and DS-D8 endpoint
source, migrate its cross-feature orchestration behavior into Workflow, and
eliminate Saga from current schemas, fixtures, validators, projections, and
execution plans without deleting historical research or decision provenance.

Invoke authors this plan only. Task Session owns every mutation SWU.

## Approved Baseline

- [Collapse decision](../ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md)
  selects Saga -> Workflow plus scope metadata.
- [Accepted evidence](../ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md)
  KILLs the current hardening dossier and preserves a historical re-entry route.
- [Current DS-D8 authority](../../definitions/relationships/relationships.yml)
  has separate Workflow and Saga orchestrates rows.
- [Current DS-D1 schemas](../../impl/spec/meta-types/behavioral/) use
  attribute-equals scope criteria and separate Saga/Workflow files.

## Delivery Boundary

### Remove From Active Surfaces

1. Saga as a registered DS-D1 type and human meta-type card.
2. Saga as a source type in active DS-D8 relationship signatures.
3. Saga schema/card files and Saga positive/negative fixtures.
4. Active validators and tests that special-case Saga or expect
   Saga/Workflow collapse.
5. Current taxonomy, learning, README, discovery, generated projections, and
   executable work-pack claims that Saga is active or pending hardening.
6. Active Saga-hardening tasks and waves that contradict the collapse decision.

### Preserve As Historical Evidence

- research/ trees;
- development research, review, refresh, and completed task-session evidence;
- superseded decisions, including DEC-R3-EDGE-2;
- telemetry, Inventory history, and this removal plan/receipts;
- formal examples whose purpose is historical research rather than current
  DomainSpec v2 authority.

Historical artifacts may gain a superseded/archival pointer only when their
current status could misroute execution. They are not rewritten to erase Saga.

## Target State

### DS-D1

- Saga is absent from the active meta-type registry and projections.
- Stable IDs after DS-D1.10 are not renumbered.
- The removal receipt records DS-D1.10 as retired historical identity.
- Workflow is the only orchestration meta-type.
- Workflow accepts declared scope values intra-feature and cross-feature.

### DS-D8

One active orchestrates row remains:

    id: orchestrates
    source_type: Workflow
    target_type: Operation
    multiplicity: one_to_many_ordered
    feature_scope: [same-feature, cross-feature]

The row preserves ordered-operation behavior and cross-feature expressiveness.
It does not preserve Saga-only participant or compensation claims that lacked a
finite DS-D1 witness.

### Compatibility

This repository has no accepted evidence of a deployed external Saga consumer.
The default is a direct source migration with no permanent Saga alias.

- Existing in-repository Saga fixtures/examples in active surfaces are rewritten
  to Workflow with cross-feature scope or deleted when redundant.
- Historical evidence remains readable.
- If execution discovers an external or persisted consumer contract, stop and
  route a new decision gate before authority mutation.

## Implementation Decisions

### D1 - Widen One Workflow Signature

Use one Workflow orchestrates signature with both same-feature and cross-feature
scope. Do not create two otherwise-identical Workflow rows while signature-key
hardening remains unimplemented.

### D2 - Add A Finite Scope Criterion

Introduce an attribute-one-of criterion:

    rule: attribute-one-of
    key: scope
    values: [intra-feature, cross-feature]

The rule is attestation-reading, not a structural non-collapse witness.

Algorithm:

1. Require an Attribute/Value table.
2. Resolve the requested key case-insensitively.
3. Normalize the actual and allowed tokens.
4. Accept exactly one allowed token.
5. Reject missing keys, empty allowed sets, and unknown values.
6. Instance generation selects the first allowed value deterministically.
7. The non-collapse classifier places attribute-one-of in the attestation set.

### D3 - Preserve Existing Scope Vocabulary Boundary

DS-D1 currently says intra-feature while DS-D8 says same-feature. This plan does
not broaden into a vocabulary migration. The implementation detail must keep the
existing mapping explicit:

- DS-D1 intra-feature -> DS-D8 same-feature
- DS-D1 cross-feature -> DS-D8 cross-feature

### D4 - Historical References Are Allowlisted, Not Purged

A zero-active-reference validation classifies every remaining Saga match as
active or historical. Active matches fail. Historical matches must resolve to
an explicit allowlisted root or file and retain non-authority status.

## Task Decomposition

| Task | Purpose | SWUs |
| --- | --- | --- |
| TASK-SGRM-CONTRACT | Freeze migration packet, exact active corpus, and stop conditions. | SGRM-001 |
| TASK-SGRM-AUTHORITY | Remove Saga from DS-D1 and migrate DS-D8 to Workflow. | SGRM-002 |
| TASK-SGRM-IMPLEMENTATION | Add scope-rule support and migrate schemas, fixtures, validators, and tests. | SGRM-003..005 |
| TASK-SGRM-SYNC | Reconcile current projections and contradictory active plans. | SGRM-006 |
| TASK-SGRM-VERIFY | Install the zero-active guard, sync read models, and verify recomposition. | SGRM-007..008 |

## Validation Strategy

Every mutation SWU runs its focused tests and the full package validation before
promotion. The final gate requires:

- npm --prefix projects/domainspec-v2/impl run validate
- npm --prefix projects/domainspec-v2/impl run instances:generate
- npm --prefix projects/domainspec-v2/impl run instances:validate
- npm --prefix projects/domainspec-v2/impl run typecheck
- the zero-active-Saga reference audit
- JSON/YAML/JSONL parsing for changed read models
- git diff --check

## Failure Modes

| Failure | Response |
| --- | --- |
| A remaining active signature names Saga | Block authority promotion. |
| Workflow cross-feature input is rejected | Repair criterion/relationship migration in the owning SWU. |
| An arbitrary scope value passes | Block; attribute-one-of support is incomplete. |
| Later DS-D1 IDs are renumbered | Block and restore stable IDs. |
| Historical evidence is deleted or rewritten as current truth | Block and restore provenance. |
| An external Saga consumer is discovered | Stop and open a compatibility decision gate. |
| Current plans still schedule Saga hardening | Block closeout and mark those routes superseded/cancelled. |

## Handoff

Execute one SWU per Task Session. Start with SGRM-001. No mutation-capable SWU
may start until its dependency receipt exists and the write scope is rebuilt
from current repository state.
