---
task_id: TASK-DSD1-VALIDATORS
feature_code: DSD1
layer: L2-L3
status: not-started
gate_status: ready-after-selected-schemas
updatedAt: 2026-07-03
---

# TASK-DSD1-VALIDATORS: Extend Criterion And Fixture Support

## Objective

Add only the validator support required by selected DS-D1 hardening SWUs, then
wire aggregate validation so the improvement is machine-checkable.

## Source Anchors

- `projects/domainspec-v2/development/meta-type-formalization/DESIGN.md`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`
- `projects/domainspec-v2/impl/package.json`
- `projects/domainspec-v2/impl/tools/`
- `projects/domainspec-v2/impl/spec/`

## SWUs

| SWU | Purpose | Write Scope | Gate |
| --- | --- | --- | --- |
| SWU-DSD1-013 | Add needed criterion rule support. | Validator rule support and tests. | after selected schemas need it |
| SWU-DSD1-014 | Wire aggregate validation. | Validation wiring/docs. | after SWU-DSD1-013 |

## Implementation Notes

- Do not create a general category-law engine in this task.
- Do not import private derivation delta-rules into public DS-D1 validators.
- Prefer black-box CLI tests for each new rule kind.
- If a criterion cannot be validated finitely, leave it as explanatory guidance
  and record the deferred law in the residue ledger.

## Acceptance Evidence

- `npm --prefix projects/domainspec-v2/impl run tools:test` passes for new rule
  support.
- `npm --prefix projects/domainspec-v2/impl run validate` passes after aggregate
  wiring.
- Seeded bad fixtures fail in focused tests.
