---
task: SWU-UIR-010
status: complete
result: PASS
run_id: task-session-20260712T155000Z-swu-uir-010-integrated-audit
completed: 2026-07-12
---

# SWU-UIR-010 Integrated Audit Result

The complete v1 plus successor evidence machinery passes integrated audit.
UI-repair tests pass 68/68, DomainSpec tools pass 69/69, typecheck and aggregate
validation pass, and engine lint is clean. All finite absence, per-candidate
non-pooling, `missing` preservation, packet/decision separation, no-authority-
effect, lineage, replay, overwrite-refusal, and immutable-history assertions
pass.

The bounded package outcome remains `DEFER`. GAP-UIR-005 and GAP-UIR-006 are
real empirical gaps, not mechanical blockers: portability evidence is below
2/2/2 and Form/Action independent positives remain missing. No candidate,
DS-D1, DS-D8, activation, or promotion state changed.
