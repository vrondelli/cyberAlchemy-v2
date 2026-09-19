---
module: r3-l2-relationship-hardening
task_id: TASK-R3H-ENTITY-SEMANTICS
status: draft
updatedAt: 2026-07-02
---

# TASK-R3H-ENTITY-SEMANTICS: Entity Relation Hardening

## Objective

Harden `owns` and `belongs-to` so they remain intuitive first-class Entity-to-Entity relations without
collapsing into prose or ambiguous inverse navigation.

## Layer And Slice

- Layer: L1.
- Slice: S-R3H-002.
- Wave: [W1](../waves/W1.md).

## Source Contracts

- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/definitions/relationships/relationships.md`
- `projects/domainspec-v2/development/r3-research/l2-first-class-categories-cross-domain/findings.md`

## Dependencies

- SWU-R3H-001.

## Blocker/Gap State

Non-blocking future gap: per-instance `belonging_kind` is deferred because current graph rows are flat.

## Smallest Working Units

### SWU-R3H-003

- Objective: add observable `authority_effects` to `owns`.
- Dependencies: SWU-R3H-001.
- Source anchors: `owns` signature and research attention point "owns needs observable consequences".
- Write scope: `projects/domainspec-v2/definitions/relationships/relationships.yml`; companion docs if needed.
- Done criteria: `owns` names at least one effect such as lifecycle authority, custody, write responsibility, retirement authority, or owner-routed promotion.
- Acceptance evidence: examples/non-examples explain the selected effects.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate:rels`; metadata review or tool test.
- Execution owner: local-fallback.
- Handoff note: keep `owned-by` generated only; do not author reverse edges.

### SWU-R3H-004

- Objective: add `semantic_kinds` to `belongs-to`.
- Dependencies: SWU-R3H-001.
- Source anchors: `belongs-to` signature and research attention point "belongs-to is riskiest".
- Write scope: `projects/domainspec-v2/definitions/relationships/relationships.yml`; `projects/domainspec-v2/definitions/relationships/relationships.md`.
- Done criteria: `belongs-to` declares membership, classification, and home-assignment meanings with examples/non-examples and a split trigger.
- Acceptance evidence: docs state `belongs-to` is not `owns^-1`.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate:docs`; review check.
- Execution owner: local-fallback.
- Handoff note: do not add per-row metadata unless a separate owner decision changes the graph surface.

### SWU-R3H-005

- Objective: add targeted metadata checks for `owns` and `belongs-to`.
- Dependencies: SWU-R3H-003, SWU-R3H-004.
- Source anchors: validator loader and tests.
- Write scope: `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts`; tests.
- Done criteria: missing `authority_effects` for `owns` and missing `semantic_kinds` for `belongs-to` are rejected or flagged.
- Acceptance evidence: seeded test or direct unit check demonstrates the metadata obligation.
- Validation: `npm --prefix projects/domainspec-v2/impl run tools:test`.
- Execution owner: local-fallback.
- Handoff note: keep checks narrow to avoid creating a general schema system before it is needed.

## Synchronization Rules

Update root first, then validator checks, then projection docs.

## Completion Evidence

Task completes when SWU-R3H-003, SWU-R3H-004, and SWU-R3H-005 pass or record a concrete blocker.
