---
artifact_id: CDSC2-PLAN-v0.1
status: execution-ready
complexity: medium
output_mode: split
---

# Implementation Plan

## Delivery Boundary

Implement one append-only generation-2 evidence repair inside the parent
calibration namespace. Do not mutate generation 1, fixture repositories, parent
rubric semantics, or canonical governance surfaces.

## Task Map

| Task | Purpose | SWUs | Layer |
| --- | --- | --- | --- |
| `TASK-CDSC2-CONTRACTS` | enforce schema parity and successor envelope rules | 001 | L0 |
| `TASK-CDSC2-HARNESS` | freeze source-derived harness and baseline equivalence | 002 | L0 |
| `TASK-CDSC2-EXPERIMENTS` | execute the permitted and breaking mutations | 003-004 | L1 |
| `TASK-CDSC2-GENERATION` | freeze F3 v2 and append generation 2 | 005-006 | L2 |
| `TASK-CDSC2-VERIFY` | independently replay, audit, and route | 007 | L3 |

## Ordering

```text
001 -> 002 -> (003 || 004) -> 005 -> 006 -> 007
```

003 and 004 may run in parallel only with explicit runtime subagent permission.
All other work is sequential.

## Validation Strategy

| Slice | Evidence |
| --- | --- |
| contracts | positive parent receipts, unknown-kind/class negatives, wrong/null predecessor negatives, generation-1 byte snapshot |
| harness | live source-digest match, frozen manifest validation, exhaustive baseline-vector equality |
| experiments | mutation edit-surface diff, total vector outputs, deterministic rerun, immutable observation receipt |
| generation | F3 receipt validation, fixture/suite outcome tables, predecessor-safe append, duplicate protection |
| audit | fresh-process semantic equality, source cleanliness, uncertainty and prohibited-inference scan |

## Runtime Ownership

Invoke owns this plan only. `task-session` owns one selected SWU at a time.
Subagents are optional for the disjoint mutation SWUs after explicit permission;
local Task Session is the fallback. No runtime handoff may combine 005 and 006
or evaluate evidence before its receipt is frozen.
