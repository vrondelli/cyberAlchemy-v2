---
task: SWU-UIR-002
attempt: RETRY-001
status: complete
result: PASS
run_id: task-session-20260711T215947Z-swu-uir-002-nonempty-parity
completed: 2026-07-11T21:59:47Z
---

# SWU-UIR-002 Retry 001 Result

Implemented `attribute-nonempty/v1` atomically in schema preflight,
deterministic generation, Markdown validation, generated-instance validation,
and the total noncollapse classifier.

## Evidence

- Accepted, missing, empty, and whitespace cases have identical outcomes and
  `ui-repair-violations/v1` codes across both validation paths.
- Non-string structured values fail with `NONSTRING-VALUE`.
- Unknown `attribute-nonempty/v2` fails before execution in both paths.
- Existing `attribute-present` behavior is unchanged.
- No candidate schema selects the new rule.

## Validation

Focused tests 57/57; full tools 69/69; typecheck, aggregate validation, and
engine lint pass. Full machine receipt: `receipt.json`.

## Handoff

W0 is complete. SWU-UIR-004 is next for the immutable 165-case mutation base.
