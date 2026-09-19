---
task_id: TASK-DSD1-SYNC
feature_code: DSD1
layer: L3
status: not-started
gate_status: ready-after-implementation
updatedAt: 2026-07-03
---

# TASK-DSD1-SYNC: Sync Definitions, Projections, Craft, And Inventory

## Objective

After selected implementation SWUs complete, synchronize the read models so
root authority, implementation views, planning docs, Craft, Inventory, and
observability all describe the same DS-D1 state.

## Source Anchors

- Completed Task Session receipts for SWU-DSD1-001..014 as applicable.
- `projects/domainspec-v2/definitions/meta-types/`
- `projects/domainspec-v2/development/meta-type-definitions/`
- `projects/domainspec-v2/development/meta-type-formalization/`
- `projects/domainspec-v2/CRAFT.md`
- Repository-local inventory/observability surfaces, if present.

## SWUs

| SWU | Purpose | Write Scope | Gate |
| --- | --- | --- | --- |
| SWU-DSD1-015 | Synchronize read models and continuation state. | Definitions indexes, drift audit, Craft, Inventory, observability. | after implementation |

## Implementation Notes

- Root definitions carry authority. Implementation files carry the necessary
  machine views for implementing and validating the authority.
- Sync only what was actually executed. Deferred UI/category-law work remains
  explicit residue; SGRM-001..008 repository-local migration is complete.
- Use receipts as evidence; do not infer completion from planned SWUs.

## Acceptance Evidence

- Index rows, CRAFT state, and plan residue agree.
- JSON, YAML, and JSONL files parse if touched.
- `git diff --check -- projects/domainspec-v2` passes.
