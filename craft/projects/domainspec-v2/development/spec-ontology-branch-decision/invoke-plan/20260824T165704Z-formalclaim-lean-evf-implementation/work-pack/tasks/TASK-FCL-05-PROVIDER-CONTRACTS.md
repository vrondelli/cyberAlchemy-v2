# TASK-FCL-05-PROVIDER-CONTRACTS

## SWU-FCL-005 — Provider manifest

Create a pinned, nonauthority Lean provider-manifest schema/validator/fixture.
This is contract implementation, not runtime admission.

Validation: `work-pack/shared/validation-contracts/SWU-FCL-005-VALIDATION.json`.

## SWU-FCL-006 — Theorem request and total receipt

Create request/receipt schemas, semantic validator, and fixtures for exact
checked, counterexample-checked, unresolved, and stale outcomes. Reject all
checked-result inflation.

Validation: `work-pack/shared/validation-contracts/SWU-FCL-006-VALIDATION.json`.
Canonical order remains 005 then 006; successor after 006 is `SWU-FCL-007`.
