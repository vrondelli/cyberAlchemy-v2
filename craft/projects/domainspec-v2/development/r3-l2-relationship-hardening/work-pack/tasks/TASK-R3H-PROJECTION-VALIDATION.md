---
module: r3-l2-relationship-hardening
task_id: TASK-R3H-PROJECTION-VALIDATION
status: draft
updatedAt: 2026-07-02
---

# TASK-R3H-PROJECTION-VALIDATION: Projection And Residue Sync

## Objective

Synchronize human root docs, implementation projection, fixtures, and deferred residue with the hardened
root authority.

## Layer And Slice

- Layer: L2/L3.
- Slices: S-R3H-004 and S-R3H-005.
- Waves: [W2](../waves/W2.md), [W3](../waves/W3.md).

## Source Contracts

- `projects/domainspec-v2/definitions/relationships/relationships.md`
- `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`

## Dependencies

- SWU-R3H-003 through SWU-R3H-007.

## Blocker/Gap State

No blocker. Broader R3 closeout remains in `development/r3-closeout-plan/`.

## Smallest Working Units

### SWU-R3H-008

- Objective: sync root human companion and implementation projection.
- Dependencies: SWU-R3H-003, SWU-R3H-004, SWU-R3H-005.
- Source anchors: human root companion and implementation projection.
- Write scope: `projects/domainspec-v2/definitions/relationships/relationships.md`; `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`.
- Done criteria: docs mention `signature_key`, `authority_effects`, `semantic_kinds`, generated views, and deferred residue without making `impl/` authoritative or reviving the cancelled Saga-law lane.
- Acceptance evidence: docs validate and wording preserves root/implementation boundary.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate:docs`.
- Execution owner: local-fallback.
- Handoff note: projection can summarize fields; it does not need to duplicate full machine records.

### SWU-R3H-009

- Objective: update residue/traceability closeout for deferred candidates.
- Dependencies: SWU-R3H-008.
- Source anchors: root deferred list and research findings.
- Write scope: root definitions docs or R3H closeout receipt path selected during execution.
- Done criteria: `depends-on`, Operation-returned Value Object, Event payload/publisher composite, and category laws have witness criteria and owner routes.
- Acceptance evidence: traceability table maps each research finding to closed or deferred.
- Validation: review check; `npm --prefix projects/domainspec-v2/impl run validate:docs`.
- Execution owner: manual.
- Handoff note: do not promote deferred candidates during this SWU.

## Synchronization Rules

Projection changes wait for root law fields. Residue closeout waits for projection sync.

## Completion Evidence

Task completes when SWU-R3H-008 and SWU-R3H-009 pass.
