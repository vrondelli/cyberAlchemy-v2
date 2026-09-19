---
work_pack_id: WP-UIR-001
status: complete-defer
next_owner: empirical-review
next_swu: none
mutation_authority: selected SWU only
complexity: high
output_mode: split
active_layer_window: closed
approved_plan_source: refresh/2026-07-12-decision-closure/REFRESH-REPORT.md
---

# UI Evidence Repair Work Pack

## Objective

Extend the completed evidence architecture with versioned successor records for
DEC-UIR-007 through DEC-UIR-010, then run the integrated audit without changing
candidate status, DS-D1, DS-D8, accepted UIF evidence, or generation 001.

## Planning Boundary

The original design baseline remains approved for S1-S7. The successor design
delta is the user-approved
`refresh/2026-07-12-decision-closure/REFRESH-REPORT.md`. Plan mode does not
silently edit `SPEC.md`, `ARCHITECTURE.md`, or `EVIDENCE-CONTRACTS.md`; requested
upstream prose deltas are recorded in `PLAN-UPSTREAM-PATCH-REQUEST.md`.
The historical `INVOKE-TRANSPORT.md` remains immutable planning evidence; the
current handoff is `INVOKE-SUCCESSOR-TRANSPORT.md`.

## Task Board

| Task | Layer | State | SWUs |
| --- | --- | --- | --- |
| [TASK-UIR-CONTRACTS](work-pack/tasks/TASK-UIR-CONTRACTS.md) | historical L0 | complete | 001-003 |
| [TASK-UIR-MECHANICAL](work-pack/tasks/TASK-UIR-MECHANICAL.md) | historical L1 | complete | 004 |
| [TASK-UIR-EVIDENCE](work-pack/tasks/TASK-UIR-EVIDENCE.md) | historical L1 | complete | 005-007 |
| [TASK-UIR-ADJUDICATION](work-pack/tasks/TASK-UIR-ADJUDICATION.md) | historical L2 | complete | 008-009 |
| [TASK-UIR-ABSENCE](work-pack/tasks/TASK-UIR-ABSENCE.md) | L0S-L1S | complete | 011-012 |
| [TASK-UIR-DOSSIER-POLICY](work-pack/tasks/TASK-UIR-DOSSIER-POLICY.md) | L1S | complete | 013 |
| [TASK-UIR-RELATIONSHIP-DECISION](work-pack/tasks/TASK-UIR-RELATIONSHIP-DECISION.md) | L1S | complete | 014 |
| [TASK-UIR-SUCCESSOR-COMPOSITION](work-pack/tasks/TASK-UIR-SUCCESSOR-COMPOSITION.md) | L2S | complete | 015 |
| [TASK-UIR-VERIFY](work-pack/tasks/TASK-UIR-VERIFY.md) | L3 | complete | 010 |

## SWU Manifest

| SWU | Layer | Parent task | Dependencies | State |
| --- | --- | --- | --- | --- |
| SWU-UIR-001 | historical L0 | [contracts](work-pack/tasks/TASK-UIR-CONTRACTS.md) | none | complete |
| SWU-UIR-002 | historical L0 | [contracts](work-pack/tasks/TASK-UIR-CONTRACTS.md) | 001, 003 | complete |
| SWU-UIR-003 | historical L0 | [contracts](work-pack/tasks/TASK-UIR-CONTRACTS.md) | 001 | complete |
| SWU-UIR-004 | historical L1 | [mechanical](work-pack/tasks/TASK-UIR-MECHANICAL.md) | 001, 002, 003 | complete |
| SWU-UIR-005 | historical L1 | [evidence](work-pack/tasks/TASK-UIR-EVIDENCE.md) | 001, 002 | complete |
| SWU-UIR-006 | historical L1 | [evidence](work-pack/tasks/TASK-UIR-EVIDENCE.md) | 001 | complete |
| SWU-UIR-007 | historical L1 | [evidence](work-pack/tasks/TASK-UIR-EVIDENCE.md) | 001 | complete |
| SWU-UIR-008 | historical L2 | [adjudication](work-pack/tasks/TASK-UIR-ADJUDICATION.md) | 004-007 | complete |
| SWU-UIR-009 | historical L2 | [adjudication](work-pack/tasks/TASK-UIR-ADJUDICATION.md) | 001, 004-008 | complete |
| SWU-UIR-011 | L0S | [absence](work-pack/tasks/TASK-UIR-ABSENCE.md) | 001-003, 006, DEC-UIR-007 | complete |
| SWU-UIR-012 | L1S | [absence](work-pack/tasks/TASK-UIR-ABSENCE.md) | 011 | complete |
| SWU-UIR-013 | L1S | [dossier policy](work-pack/tasks/TASK-UIR-DOSSIER-POLICY.md) | 006, 008, DEC-UIR-008/009 | complete |
| SWU-UIR-014 | L1S | [relationship decision](work-pack/tasks/TASK-UIR-RELATIONSHIP-DECISION.md) | 007, DEC-UIR-010 | complete |
| SWU-UIR-015 | L2S | [successor composition](work-pack/tasks/TASK-UIR-SUCCESSOR-COMPOSITION.md) | 009, 012-014 | complete |
| SWU-UIR-010 | L3 | [verify](work-pack/tasks/TASK-UIR-VERIFY.md) | 001-009, 011-015 | complete |

Each SWU has exactly one parent task. Task-local contracts own algorithms,
write scopes, done criteria, validation, and handoff notes.

## Layer-Mapped Waves

- [W0](work-pack/waves/W0.md), [W1](work-pack/waves/W1.md), and
  [W2](work-pack/waves/W2.md): complete historical baseline.
- [W2S-L0](work-pack/waves/W2S-L0.md): bounded-search contract proof.
- [W2S-L1](work-pack/waves/W2S-L1.md): successor producer records.
- [W2S-L2](work-pack/waves/W2S-L2.md): successor dossier/index recomposition.
- [W3](work-pack/waves/W3.md): integrated verification and handoff.

## Validation Strategy

| Slice | Required evidence |
| --- | --- |
| L0S | schema fixtures, total evaluator branches, zero-match and incomplete-search negatives |
| L1S corpus | generation-002 predecessor, bounded-search handle coverage, replay, overwrite refusal |
| L1S policy | per-candidate threshold counts, reviewer independence, typed `missing`, replay |
| L1S relationship | four complete decisions, authority digest binding, no packet mutation, replay |
| L2S | dossier/index v2 schema, conjunct states, handle integrity, predecessor chain, replay |
| L3 | all package tests, aggregate DomainSpec validation, authority boundary and generation immutability audit |

## Global Done Contract

- Declared paths only were changed by each Task Session.
- Every new record has versioned semantics, stable IDs, lineage, and replay.
- Required fixtures include positive, negative, malformed, stale, and replay
  cases appropriate to the slice.
- Generation 001 remains byte-identical and referenced by successor handles.
- No artifact claims candidate identity, replication, activation, authority, or
  promotion.
- A Task Session receipt and observability signal exist for every SWU.

## Active Gaps And Gates

- GAP-UIR-004: finite-search construction and corpus generation 002 are
  implemented by SWU-011/012; absence remains bounded to declared proof scopes.
- GAP-UIR-005: SWU-013 records all nine candidates below threshold; collecting
  threshold-satisfying evidence remains external.
- GAP-UIR-006: SWU-013 records Form/Action independent-positive `missing`;
  witness collection remains external.
- GAP-UIR-007: SWU-014 persists all four owner decisions; Action-source remains
  route-open with no admitted signature.
- Upstream prose drift is non-blocking because the approved refresh report is
  the successor design reference; see `PLAN-UPSTREAM-PATCH-REQUEST.md`.

## Next Route

No planned SWU remains. Mechanical execution is complete with bounded outcome
`DEFER`. Route new evidence for GAP-UIR-005/006 to empirical review and DS-D1
owners under the fixed policy; do not infer promotion from this closeout.
