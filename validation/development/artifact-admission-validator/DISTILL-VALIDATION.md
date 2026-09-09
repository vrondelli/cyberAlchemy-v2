# Distill Validation: Artifact Admission Validator Plan

Status: pass
Date: 2026-07-11

## Verdict

The plan is small enough to start, large enough to preserve C18 semantics, and
navigable to one executable unit: `SWU-AAV-001`.

## Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Smallest coherent unit | pass | Schema/template/receipt contract can be reviewed without parser or CLI mutation. |
| Smallest working unit | pass | `SWU-AAV-001` has one parent task, bounded write scope, acceptance evidence, and verification. |
| Recomposition proof | pass | 001/002 define policy; 003/004 implement it; 005/006 harden evidence; 007 routes owner updates. |
| Hidden acceptance gaps | pass | Candidate authority, Markdown-only registry, override carrier, and CI rollout are explicit gaps. |
| Deferred complexity | pass | Batch scan, CI, machine registry projection, and public reuse remain L3 or owner-routed. |
| Navigation | pass | WORK-PACK -> TASK-AAV-001 -> SWU-AAV-001 is direct. |
| Authority boundary | pass | Validator evidence cannot promote the rule, discipline, kinds, or definitions. |

## Recomposition Proof

```text
admission schema + verdict fixtures
  -> strict policy loader + two-phase evaluator
  -> C7/C14 fixture matrix + stable receipts
  -> validation documentation + owner handoff proposals
  -> candidate deterministic adapter for CAV2-C18
```

Removing the first unit would leave the evaluator without a stable input and
receipt contract. Expanding the first unit to include policy parsing would mix
schema decisions with repository integration. The selected boundary is therefore
the smallest coherent start.

## Residue

- C18 and the discipline remain candidate; promotion is outside execution scope.
- Canonical Kinds remains Markdown authority; a machine projection is not assumed.
- Durability override remains deferred under Canonical Kinds OQ-3.
- L3 automation requires later evidence and owner approval.
