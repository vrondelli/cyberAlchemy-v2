# TASK-OEWFR-READINESS: Baseline Freeze

- Layer/slice: L0 / S0
- Type: readiness-only; SWU exemption permitted by task ID.
- Objective: capture exact digests for every future target, confirm the dirty
  worktree belongs to existing work, and reject overlap outside declared scope.
- Write scope: session evidence for the selected Task Session only.
- Checks: current builder/test/patch0004/binding006/findings digests; absence of
  an already-admitted recovery mutation; no active session owns the same files.
- Done: read-only preflight receipt exists and selects no mutation beyond
  SWU-OEWFR-001.
- Failure: block on drift, overlap, missing predecessor, or broadened scope.
