---
artifact_id: INVOKE-REFRESH-PATCH-UIR-2026-07-12
mutation_mode: proposal-only
apply_status: not-applied
---

# Refresh Patch Proposal

## Approval Boundary

This document proposes target deltas. It does not authorize editing target
workflow artifacts, executing an SWU, collecting new evidence, or mutating
candidate, DS-D1, or DS-D8 authority.

## Proposed Existing-File Deltas

| Target | Delta | Signals |
| --- | --- | --- |
| `SPEC.md` | Add successor evidence outcomes and ACs for bounded absence, policy evaluation, owner decisions, and versioned recomposition. | UIR-RS-001..004 |
| `ARCHITECTURE.md` | Add bounded-search, dossier-policy, and relationship-decision records plus dossier/index v2 flow. | UIR-RS-001..004, 007 |
| `EVIDENCE-CONTRACTS.md` | Specify construction rules, failure states, prohibited inferences, and predecessor contracts for the three new record families. | UIR-RS-001..004 |
| `IMPLEMENTATION-LAYERING.md` | Add L0S-L2S successor layers and promotion evidence. | UIR-RS-001..005 |
| `EXECUTION-PACK.md` | Add successor choreography and stop conditions. | UIR-RS-001..006 |
| `WORK-PACK.md` | Append SWU-UIR-011 through 015; set the next executable unit only after plan approval. | UIR-RS-001..006 |
| `work-pack/tasks/*` | Add three parent tasks and update TASK-UIR-VERIFY dependencies. | UIR-RS-001..005 |
| `work-pack/waves/*` | Add successor preparation/composition waves and update W3 entry gate. | UIR-RS-001..005 |
| `work-pack/shared/*` | Replace pending-decision language with resolved-policy/evidence-pending routes and extend traceability. | UIR-RS-001..007 |
| `ui-meta-type-repair.dispatch.json` | Version the route with five successor steps, join gates, receipts, and owner boundaries; validate it. | UIR-RS-004..007 |
| `INVOKE-TRANSPORT.md` | Record the refresh source, revised technique trace, high-complexity plan, and Task Session handoff. | UIR-RS-005..007 |
| `DISTILL-VALIDATION.md` | Append the five-SWU successor reduction and recomposition proof. | UIR-RS-001..005 |
| Inventory synthesis | Refresh stale ten-SWU/pending-gate summary after the plan is applied and validated. | UIR-RS-005..007 |

## Proposed New Planning Files

- `work-pack/tasks/TASK-UIR-ABSENCE.md`
- `work-pack/tasks/TASK-UIR-DOSSIER-POLICY.md`
- `work-pack/tasks/TASK-UIR-RELATIONSHIP-DECISION.md`
- `work-pack/tasks/TASK-UIR-SUCCESSOR-COMPOSITION.md`
- successor wave file selected by `invoke plan`

## Proposed New Implementation Surfaces

Exact filenames are owned by `invoke plan`, but the implementation detail must
cover these record families and their focused tests:

- bounded-search receipt and corpus-receipt v2;
- dossier-policy evaluation for DEC-UIR-008/009;
- relationship owner-decision receipt separate from the transport packet;
- formation dossier v2 and orchestration index v2;
- generation builders, immutable outputs, predecessor handles, and replay.

## Proposed Work-Pack Manifest Delta

```text
SWU-UIR-011  L0S  TASK-UIR-ABSENCE
SWU-UIR-012  L1S  TASK-UIR-ABSENCE                 depends 011
SWU-UIR-013  L1S  TASK-UIR-DOSSIER-POLICY          depends 006,008
SWU-UIR-014  L1S  TASK-UIR-RELATIONSHIP-DECISION   depends 007
SWU-UIR-015  L2S  TASK-UIR-SUCCESSOR-COMPOSITION   depends 009,012-014
SWU-UIR-010  L3   TASK-UIR-VERIFY                  depends 001-009,011-015
```

## Apply Validation Requirements

1. Validate JSON/YAML/Markdown structure and links.
2. Validate the revised full dispatch with Dispatch Spec.
3. Run automatic Distill validation over layering, tasks, work-pack, and
   recomposition.
4. Confirm every SWU has one parent, declared write scope, acceptance evidence,
   and focused verification commands.
5. Confirm generation-001 digests remain unchanged.
6. Confirm no candidate, DS-D1, or DS-D8 authority file enters the write scope.
7. Update Inventory only after target plan validation passes.

## Next Route

`invoke plan` consumes this proposal and either applies a coherent high-
complexity successor plan or returns a typed gap. Task Session must not start
before that plan assigns SWU-UIR-011.
