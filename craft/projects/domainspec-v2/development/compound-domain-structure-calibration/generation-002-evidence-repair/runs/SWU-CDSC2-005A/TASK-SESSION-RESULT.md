---
task_session: SWU-CDSC2-005A
result: PASS
completed: 2026-07-12
runtime: local
adapter: none
next_swu: SWU-CDSC2-005B
---

# Task Session Result: SWU-CDSC2-005A

Implemented `cdsc.adjudication-overlay.v1`, a direct cross-layer validator, and
a pure v1 compatibility materializer. The validator binds exact parent/M1/M2
handles, enforces six explanations by two separate substitutions, maps
structural coverage to adjudication state, rejects outcome-derived targets, and
prevents parent or observation uncertainty from disappearing.

The materializer copies parent `G`, `A`, `Q01-Q05`, and their cells; derives
evaluation Q06/Q07 only from parent permitted/breaking `S`; maps overlay cells;
and emits a deterministic parent-valid v1 receipt. It does not freeze actual
adjudication, run the evaluator, or append generation 2.

Validation: focused 23/23 pass, including 16 negative vectors; combined frozen
parent and generation-2 suites 72/72 pass; generation 1 and exact M1/M2 bytes
protected; schema/direct vocabulary parity pass; compatibility replay identical.

Gate: PASS. Decisions: none. Runtime: local. Adapter: none. Handoff pack: none.
Fallback search: none. Subagents: not used. Experiment harness: not applicable.
Next route: SWU-CDSC2-005B.
