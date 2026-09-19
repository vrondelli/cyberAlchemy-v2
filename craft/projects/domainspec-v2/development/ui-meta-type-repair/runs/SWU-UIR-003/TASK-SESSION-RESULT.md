---
task: SWU-UIR-003
status: complete
result: PASS
run_id: task-session-20260711T215427Z-swu-uir-003-registry-preflight
completed: 2026-07-11T21:54:27Z
---

# SWU-UIR-003 Task Session Result

Implemented the normative `ui-repair-violations/v1` registry and shared schema
preflight used by both Markdown and generated-instance tooling.

## Result

- Unknown rules fail before execution with `UNKNOWN-RULE`.
- Raw duplicate keys fail before overwrite with `DUPLICATE-KEY`; both source
  orders produce the same result and no precedence exists.
- Unequal fixed values, fixed-outside-one-of, and disjoint one-of sets fail with
  `CRITERIA-CONFLICT`.
- Compatible presence/equality and overlapping one-of sets remain valid.
- The finite extension manifest has eight unique cases.

## Validation

- Focused tests: 41/41 pass.
- Full tool suite: 61/61 pass.
- TypeScript: pass.
- Aggregate DomainSpec validation and engine lint: pass.
- Candidate, DS-D1, DS-D8, and prior UIF evidence mutation: none.

## Handoff

SWU-UIR-002 is now unblocked and must consume this registry. Full receipt:
`receipt.json`.
