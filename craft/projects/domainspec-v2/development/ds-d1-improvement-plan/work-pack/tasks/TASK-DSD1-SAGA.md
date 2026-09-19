---
task_id: TASK-DSD1-SAGA
feature_code: DSD1
layer: L2
status: completed-collapse-migrated
gate_status: collapse-selected-executed-through-sgrm-008
updatedAt: 2026-07-11
---

# TASK-DSD1-SAGA: Resolve Saga Hardening Versus Collapse

## Execution Update: 2026-07-11

The owner selected `collapse`. SWU-DSD1-007 is complete, SWU-DSD1-008 is
cancelled/not-selected, and SWU-DSD1-009 is complete as a routing unit through
the [SGRM migration packet](../../../saga-removal/runs/SWU-SGRM-001/MIGRATION-PACKET.md)
and SGRM-002..008 receipts. The repository-local migration and closeout are
complete; external-consumer uncertainty remains bounded in the final receipt.

The branch descriptions below are retained as historical planning evidence and
are not alternative executable routes.

## Objective

Resolve whether Saga is a distinct DS-D1 category or should be collapsed,
deprecated, or routed through another owner path. The plan must not silently
keep Saga only because it exists in fixtures, and must not silently remove it
because it overlaps Workflow.

## Source Anchors

- `projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md`
- `projects/domainspec-v2/impl/spec/meta-types/saga.schema.yml`
- `projects/domainspec-v2/impl/spec/meta-types/workflow.schema.yml`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`

## Decision Options

| Option | Meaning | Follow-up |
| --- | --- | --- |
| harden | Saga stays first-class and must carry laws Workflow does not. | Run SWU-DSD1-008. |
| collapse | Saga is merged, deprecated, or routed away from DS-D1. | Run SWU-DSD1-009. |

## SWUs

| SWU | Purpose | Write Scope | Gate |
| --- | --- | --- | --- |
| SWU-DSD1-007 | Record Saga fork decision. | Decision record only. | completed: collapse selected |
| SWU-DSD1-008 | Harden Saga/Workflow distinction. | None; branch retained for history. | cancelled/not-selected |
| SWU-DSD1-009 | Prepare collapse/deprecation packet. | SGRM migration packet and receipt route. | completed-collapse-migration |

## Implementation Notes

- If hardening, Saga needs finite witnesses for participant scope,
  compensation, failure residue, temporal ordering, and cross-owner/multi-service
  transaction behavior.
- Workflow should remain an ordered intra-feature or intra-owner process unless
  a later decision changes its category.
- DS-D8 `orchestrates` pressure is relevant, but DS-D8 does not own the DS-D1
  type boundary.

## Acceptance Evidence

- Saga fork decision exists before any Saga schema mutation.
- Hardening branch rejects bad Saga/Workflow cross-label fixtures.
- Collapse branch names affected signatures, fixtures, validators, projections,
  and migration steps.
