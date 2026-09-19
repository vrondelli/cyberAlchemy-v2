---
module: r3-l2-relationship-hardening
task_id: TASK-R3H-IDENTITY
status: draft
updatedAt: 2026-07-02
---

# TASK-R3H-IDENTITY: Stable Signature Identity

## Objective

Add a stable machine identity for active relationship signatures without changing author-facing graph verbs.

## Layer And Slice

- Layer: L0.
- Slice: S-R3H-001.
- Wave: [W0](../waves/W0.md).

## Source Contracts

- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts`
- `projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts`

## Dependencies

None.

## Blocker/Gap State

No blockers. This task is selected first.

## Smallest Working Units

### SWU-R3H-001

- Objective: add `signature_key` to active signatures and validate uniqueness.
- Dependencies: none.
- Source anchors: root relationships file and loader.
- Write scope: `projects/domainspec-v2/definitions/relationships/relationships.yml`; `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts`.
- Done criteria: every active signature has a unique `signature_key`; duplicate/missing keys are rejected or explicitly flagged during migration.
- Acceptance evidence: the two `orchestrates` signatures have different keys while retaining `id: orchestrates`.
- Validation: `npm --prefix projects/domainspec-v2/impl run tools:test`.
- Execution owner: local-fallback.
- Handoff note: preserve `id` as the graph edge; do not require authors to write `signature_key` in spec tables.

### SWU-R3H-002

- Objective: prove identity hardening preserves typed endpoint matching after the Saga collapse.
- Dependencies: SWU-R3H-001.
- Source anchors: relationship fixtures and validator tests.
- Write scope: `projects/domainspec-v2/impl/tools/tests/`; `projects/domainspec-v2/impl/spec/__fixtures__/relationships/`.
- Done criteria: tests cover active typed signatures and distinct `signature_key` values.
- Acceptance evidence: valid Workflow edges pass; an identity collision fixture/review check fails.
- Validation: `npm --prefix projects/domainspec-v2/impl run tools:test`.
- Execution owner: local-fallback.
- Handoff note: if fixture-level key validation is awkward, add a direct unit test for `loadRelationshipAuthority`.

## Synchronization Rules

Update [WORK-PACK.md](../../WORK-PACK.md) after each SWU receipt.

## Completion Evidence

Task completes when SWU-R3H-001 and SWU-R3H-002 pass.
