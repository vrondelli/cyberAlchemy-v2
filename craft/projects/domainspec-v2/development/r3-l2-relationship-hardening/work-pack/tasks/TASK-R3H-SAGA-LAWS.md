---
module: r3-l2-relationship-hardening
task_id: TASK-R3H-SAGA-LAWS
status: superseded-cancelled
updatedAt: 2026-07-11
---

# TASK-R3H-SAGA-LAWS: Saga Obligation Hardening

## Supersession Notice

The accepted Saga collapse supersedes this task. SWU-R3H-006 and SWU-R3H-007
are cancelled/not-selected and must not be scheduled. The remaining content is
preserved as historical planning evidence for the rejected hardening branch.

## Objective

Make Saga orchestration first-class for structural reasons, not because it is Workflow plus a different
label.

## Layer And Slice

- Layer: L2.
- Slice: S-R3H-003.
- Wave: [W2](../waves/W2.md).

## Source Contracts

- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/development/r3-research/l2-first-class-categories-cross-domain/findings.md`
- Optional supporting source: `projects/domainspec-v2/research/dcb-saga-correctness/PROOF-OBLIGATIONS.md` if present.

## Dependencies

- SWU-R3H-001.

## Blocker/Gap State

Closed by supersession. Full temporal proof remains out of scope.

## Smallest Working Units

### SWU-R3H-006

- Objective: add structural `saga_obligations` to Saga `orchestrates`.
- Dependencies: SWU-R3H-001.
- Source anchors: Saga `orchestrates` signature.
- Write scope: `projects/domainspec-v2/definitions/relationships/relationships.yml`; `projects/domainspec-v2/definitions/relationships/relationships.md`.
- Done criteria: obligations name participant set, ordered operations, compensation mapping, failure residue behavior, temporal safety, and cross-feature owner boundary.
- Acceptance evidence: root review shows the obligations are machine-readable or explicitly review-checkable.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate:rels`; review check.
- Execution owner: local-fallback.
- Handoff note: do not add full TLA/Alloy proof obligations unless already owned by a separate research task.

### SWU-R3H-007

- Objective: test or review-enforce Saga obligation presence.
- Dependencies: SWU-R3H-006.
- Source anchors: validator tests and Saga fixture.
- Write scope: `projects/domainspec-v2/impl/tools/tests/`; optional fixtures.
- Done criteria: valid Saga orchestration still passes and missing Saga obligations fail or block review.
- Acceptance evidence: focused tool test or documented review check.
- Validation: `npm --prefix projects/domainspec-v2/impl run tools:test`; `npm --prefix projects/domainspec-v2/impl run validate:rels`.
- Execution owner: local-fallback.
- Handoff note: endpoint checks alone are not enough for this SWU; obligation presence is the point.

## Synchronization Rules

Root law fields land before projection docs or closeout.

## Completion Evidence

This task is closed as superseded; its former completion condition is retained
only as historical evidence and is not an active promotion gate.
