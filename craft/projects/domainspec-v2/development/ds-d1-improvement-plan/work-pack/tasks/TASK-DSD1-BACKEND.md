---
task_id: TASK-DSD1-BACKEND
feature_code: DSD1
layer: L2
status: not-started
gate_status: ready-after-ledger
updatedAt: 2026-07-03
---

# TASK-DSD1-BACKEND: Harden High-Risk Backend Type Laws

## Objective

Move selected backend DS-D1 types from shape-backed candidates toward stronger
semantic authority by adding finite examples, non-examples, correction routes,
and validator-supported criteria where needed.

## Source Anchors

- `projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`
- `projects/domainspec-v2/impl/spec/meta-types/`
- `projects/domainspec-v2/impl/spec/fixtures/`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`

## SWUs

| SWU | Purpose | Write Scope | Gate |
| --- | --- | --- | --- |
| SWU-DSD1-010 | State Machine vs Enum hardening. | State Machine/Enum schemas, fixtures, docs, tests. | after SWU-DSD1-001 |
| SWU-DSD1-011 | Operation/Event and Rule/Policy hardening. | Selected schemas, fixtures, docs, tests. | after SWU-DSD1-001 |
| SWU-DSD1-012 | Entity/Value Object relation and equality hardening. | Entity/VO docs, fixtures, tests, relationship examples. | after SWU-DSD1-001 |

## Implementation Notes

- Avoid one-attribute identity. A real type boundary needs repeated
  correction behavior: what would be wrong if the user picked the other type?
- Use relation notation in examples where it helps:
  `Operation --[emits]--> Event`,
  `Rule --[applies-to]--> Operation`,
  `Entity --[owns]--> Value Object`,
  `Value Object --[belongs-to]--> Entity`.
- Keep invalid or deprecated DS-D8 signatures rejected unless a separate
  relationship-authority task changes them.

## Acceptance Evidence

- Positive and negative fixtures discriminate selected types.
- Validator output explains the correction path in human-usable language.
- Relationship examples are coherent with DS-D8 authority.
