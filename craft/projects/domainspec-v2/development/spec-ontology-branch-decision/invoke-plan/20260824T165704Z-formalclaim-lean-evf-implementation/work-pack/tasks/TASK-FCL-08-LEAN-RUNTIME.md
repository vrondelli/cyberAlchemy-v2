# TASK-FCL-08-LEAN-RUNTIME

## SWU-FCL-009 — Lean provider runtime

Implement the exact local build and inspection adapter over existing locked Lean
sources. It emits one total receipt after declaration/type/build/axiom/sorry/
unsafe/currentness checks. The existing `pullback_comp` theorem is a fixture;
no theorem source is edited and no network access is allowed.

Validation: `work-pack/shared/validation-contracts/SWU-FCL-009-VALIDATION.json`.
Successor: `SWU-FCL-010`.
