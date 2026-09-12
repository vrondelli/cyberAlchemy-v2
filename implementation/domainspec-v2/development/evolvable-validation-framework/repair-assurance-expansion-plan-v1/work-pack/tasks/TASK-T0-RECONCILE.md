# T0 — Reconcile current state and freeze the L2 contract

Layer/slice: L2/S0. DAG: A, B, C. Complexity: high.

## Objective and sources

Determine the actual partial-knowledge candidate frontier from current bytes and
evidence, then implement the owner decision to exclude Task Session. Compare the
legacy readiness report with `implementation-repair-plan.md` sections 1, 3.2
and 7-13 and current `run.py` behavior. Preserve the completed CRABS replay
freeze.

## SWUs

- SWU-T0-01: inventory implemented R00-R09 behaviors and current tests; record
  each as proved-current, contradicted, missing or not evaluable; remove the
  unconditional Task Session finding/status/next-owner coupling in the
  successor implementation and replace it with technical readiness derived
  from actual checks.
- SWU-T0-02: select the successor candidate identity and freeze the 48/48/2
  property, observations, bounds and negative-control denominator.

Ordered rule: source/code/test evidence outranks stale status prose; owner
decisions outrank inferred fixes; no validation result grants execution.

Edge cases: partially implemented repair plan, stale absolute tool paths,
historical GCC13 unavailable, multiple candidate epochs, or a missing real
technical dependency. Preserve these as explicit outcomes without reintroducing
Task Session.

Write scope: successor audit/decision artifacts and separately authorized
refreshes inside the partial-knowledge package. No historical evidence rewrite.

Done evidence: exact-state matrix, selected candidate digest strategy, reviewed
comparison contract, refreshed readiness candidate and link/digest validation.

## Open Questions

Owned by [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).
