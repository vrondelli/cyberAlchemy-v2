# Invoke Refresh Report — BTE L0 Bootstrap Split

## Result

- Mode: `refresh`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `gated-on-explicit-selection`
- Output handle: `dsv2-bte-l0-bootstrap-split/v1`
- Evidence date: `2026-07-23`

The accepted Option 1 is applied. The previous route was circular: it required
the validation owner to freeze cases before their governing schemas and closed
diagnostic registry existed. The refreshed route is:

```text
SWU-BTE-L0A-001 contract publication
  -> exact publication receipt
  -> independent package-local red-manifest freeze
  -> SWU-BTE-L0B-001 semantic execution
  -> non-admitting ValidationReceipt
  -> L1
```

L0A is dependency-ready and remains unselected. Its Task Session requires only
explicit selection and a new strict runtime Context Pack. No red input is
needed or permitted in its write/read scope.

## Applied Delta

- Added `DSV2-BTE-R-AUTH-007` and accepted decision `P-BTE-012`.
- Superseded the proposed circular `SWU-BTE-L0-001` boundary without rewriting
  its historical evidence.
- Defined exact L0A/L0B consumes, emits, writes, stops, validation commands, and
  receipt-type boundaries in the L0 task.
- Inserted W1B while preserving W2–W9 identities and later architecture.
- Moved `GATE-BTE-L0-FREEZE` from pre-L0 to the L0A→L0B handoff.
- Synchronized Plan, layering, work/execution packs, dispatch, Distill,
  contracts, shared ledgers, Craft, Inventory, visibility, transport, and
  observability projections.

## Boundaries

This refresh does not select or execute an SWU, implement BTE, create or freeze
validation inputs, mutate Design/current-v1/consumer/UI/historical receipt
bytes, grant admission, close core, or authorize production.

## Validation

- Context Builder: strict `8/8`, 14 selected sources.
- Dispatch Spec: `pass`, six-step sequential one-SWU route.
- Distill Validate: `pass`; exact publication/freeze/execution recomposition.
- Preserved Design/validation/seed/decision/completed-receipt digests: `pass`.
- Active route stale-reference scan: `pass`; old IDs remain only in historical
  refresh/session evidence and the explicit supersession map.
- Scoped JSON/YAML parsing, exact Inventory target-row/map validation,
  Craft/visibility synchronization, 25 builder/contract/event tests, link
  checks, and `git diff --check`: `pass`.
- Known repository residue: the global Inventory validator remains nonzero on
  15 pre-existing out-of-enum `kind` rows; the refreshed BTE row is valid. The
  full visibility discovery run has three unrelated lab-notification failures
  tied to current pending/declined/terminal notification state; the 25 scoped
  generator, roadmap-contract, and event-contract tests pass.

## Next Route

Explicitly select `SWU-BTE-L0A-001`, build a new strict runtime Context Pack,
and run exactly that Task Session. After its verified publication receipt,
Invoke Refresh routes the validation owner and exposes L0B only when the
matching freeze exists.
