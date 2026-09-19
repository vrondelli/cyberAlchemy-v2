---
module: r3-l2-relationship-hardening
status: draft
updatedAt: 2026-07-02
docType: traceability
---

# Traceability

> **2026-07-11 supersession:** The accepted Saga collapse cancels every Saga-law
> hardening route in this document. Saga-specific design text below is retained
> as historical planning evidence only; `WORK-PACK.md` owns the active route.


| Research Finding | Plan Response | Task/SWU |
| --- | --- | --- |
| First-class authority requires finite root law, not repeated arrows. | Keep root authority and add machine law fields. | SWU-R3H-001..010 |
| Root definitions own relationships; implementation is projection. | Projection sync waits for root changes. | SWU-R3H-008 |
| `owns` needs observable consequences. | Add `authority_effects`. | SWU-R3H-003, SWU-R3H-005 |
| `belongs-to` is active but flagged as too broad. | Add `semantic_kinds` and split trigger. | SWU-R3H-004, SWU-R3H-005 |
| Workflow and Saga both use `id: orchestrates`; tooling must not collapse them. | Add `signature_key` and uniqueness check. | SWU-R3H-001, SWU-R3H-002 |
| Saga needs participant and compensation laws. | Add `saga_obligations`. | SWU-R3H-006, SWU-R3H-007 |
| `depends-on` lacks witness. | Keep deferred with criteria. | SWU-R3H-009 |
| Operation returns Value Object lacks edge witness. | Keep deferred as property/signature residue. | SWU-R3H-009 |
| Event payload/publisher composite lacks separate behavior beyond endpoint split. | Keep deferred. | SWU-R3H-009 |
| Full category laws are future candidate only. | Explicit deferred category-law route. | SWU-R3H-009, SWU-R3H-010 |
