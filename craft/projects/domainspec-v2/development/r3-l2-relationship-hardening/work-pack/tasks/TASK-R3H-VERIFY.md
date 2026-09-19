---
module: r3-l2-relationship-hardening
task_id: TASK-R3H-VERIFY
status: draft
updatedAt: 2026-07-02
---

# TASK-R3H-VERIFY: Validation And Closeout

## Objective

Verify the R3H implementation pass and produce a closeout receipt that can be consumed by the broader R3
closeout plan.

## Layer And Slice

- Layer: L3.
- Slice: S-R3H-005.
- Wave: [W3](../waves/W3.md).

## Source Contracts

- [WORK-PACK.md](../../WORK-PACK.md)
- All R3H task receipts.

## Dependencies

- SWU-R3H-001 through SWU-R3H-009.

## Smallest Working Unit Exemption

This is a closure task, but it still has one explicit verification SWU because command evidence is required.

## Smallest Working Units

### SWU-R3H-010

- Objective: run validation and write final R3H receipt.
- Dependencies: SWU-R3H-001 through SWU-R3H-009.
- Source anchors: all touched R3H files and command surfaces.
- Write scope: R3H closeout receipt artifact selected during execution; no source mutation unless validation exposes a concrete fix.
- Done criteria: command receipts are recorded; unresolved gaps are separated from blockers; next route to R3C is named.
- Acceptance evidence: validation output and final receipt.
- Validation:
  - `npm --prefix projects/domainspec-v2/impl run validate:rels`
  - `npm --prefix projects/domainspec-v2/impl run tools:test`
  - `npm --prefix projects/domainspec-v2/impl run validate:docs`
  - `npm --prefix projects/domainspec-v2/impl run validate`
  - `git diff --check -- projects/domainspec-v2`
- Execution owner: local-fallback.
- Handoff note: if any command fails, record exact failing command, affected file, and whether it blocks R3H or broader R3C only.

## Synchronization Rules

Update [WORK-PACK.md](../../WORK-PACK.md) status after command receipts are known.

## Completion Evidence

Task completes when SWU-R3H-010 records pass or a concrete blocker.
