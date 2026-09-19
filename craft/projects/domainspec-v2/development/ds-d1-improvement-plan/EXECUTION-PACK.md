---
module: ds-d1-improvement-plan
feature_code: DSD1
status: draft
updatedAt: 2026-07-11
docType: execution-pack
---

# Execution Pack: DS-D1 Improvement Plan

Cross-task choreography for the DS-D1 improvement work-pack. This file orders
waves and parallelization boundaries only. The source-of-truth SWU definitions
remain in [WORK-PACK.md](WORK-PACK.md) and the task files under
`work-pack/tasks/`.

## Execution Rule

Execute one SWU at a time unless the work-pack explicitly marks the write scopes
as parallel-safe. Every execution must return a Task Session receipt before the
work-pack, Craft, or Inventory state is synchronized.

## Wave Order

| Wave | Layer | Tasks | Can Parallelize? | Promotion Gate |
| --- | --- | --- | --- | --- |
| W0 | L0 | TASK-DSD1-LEDGER | no | Staged authority wording is reconciled and docs validate. |
| W1 | L1 | TASK-DSD1-UI11 | partially after decision | UI path selected; add-ui and narrow-claim branches are mutually exclusive. |
| W2 | L2 | TASK-DSD1-BACKEND, TASK-DSD1-VALIDATORS | yes, with disjoint schema/test scopes | Selected backend type laws have fixtures and validator support; Saga collapse stays routed to SGRM. |
| W3 | L3 | TASK-DSD1-SYNC, TASK-DSD1-VERIFY | no | Read models and validation receipts agree. |

## Selected First Unit

`SWU-DSD1-001` completed on 2026-07-11. Its
[Task Session receipt](task-sessions/2026-07-11-swu-dsd1-001/TASK-SESSION-RESULT.md)
proves that staged maturity wording is aligned without validator behavior
changes. `SWU-DSD1-002` remains conditional on projection drift; dependent
decision and hardening SWUs may now evaluate their own gates.

## Parallelization Notes

- `SWU-DSD1-004` and `SWU-DSD1-005` may be split by UI type group after
  `DEC-DSD1-UI11-PATH` selects add-ui.
- `SWU-DSD1-010`, `SWU-DSD1-011`, and `SWU-DSD1-012` can run in parallel only
  if their schema/test write scopes are disjoint and a parent coordinator owns
  validator helper conflicts.
- `SWU-DSD1-013` waits for selected schema changes. It should not invent
  general criterion rules before a selected type law needs them.
- `SWU-DSD1-015` and `SWU-DSD1-016` are closeout units and must run last.

## Receipt Contract

Each Task Session result should include:

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: task-session | local-fallback | subagent
receipt_artifact: <path or none>
files_touched:
  - <path>
validation:
  - <command or review check and result>
blockers:
  - <blocker or none>
residue:
  - <unresolved evidence or none>
reroute: <next owner or none>
handoff_note: <what the coordinator needs next>
```

## Stop Conditions

- Stop if `validate` fails after a mutation SWU and cannot be repaired in that
  SWU's scope.
- Stop if a worker tries to promote UI formation authority from DS-D8 endpoint
  use alone.
- Stop if work reopens Saga hardening or the completed SGRM-001..008
  repository-local migration without new evidence and a governed decision.
- Stop if a schema criterion requires importing private derivation delta-rules.
