# Invoke Refresh Report — current-generation IOLM A1 closeout and A2 selection

## Result

- Mode: `refresh`.
- Spell: `invoke`.
- Mutation mode: `apply-approved`.
- Phase status: `pass`.
- Handoff status: `ready`.
- Output handle: `iolm-ui-current-a1-a2-refresh-applied/v1`.
- Material package: `iolm-ui-current-a1-a2-closeout-20260723T034234Z`.
- Package digest: `13736ec8f3b47434ffc4bab468192705a06e4725c51ac4bfa25f02fed455b5e3`.

## Applied delta

- Preserved the already-passing fresh A1 rebind rather than rerunning it.
- Marked the current-generation A1 lifecycle complete and selected exactly `SWU-IOLM-00C-UI-A2` regeneration.
- Kept A3 revalidation and A4 replay unselected and gated.
- Resolved `B-IOLM-A1-PINNED-FIXTURE-DRIFT` for the selected fixture generation.
- Synchronized nine IOLM planning/Dispatch targets and the canonical Craft ledger plus machine and human projections.
- Preserved the newer unrelated BTE frontier and all historical, implementation, source, authority, promotion, and publication boundaries.

## Materialization

- The staged package validated all 12 output refs, 12 exact baseline dependencies, owner scope, authority class, publication class, and approval scope.
- Apply-approved handoff returned `mutationReady: true`.
- A final baseline recheck passed before replacement.
- All 12 live targets equal their validated staged outputs.

## Validation

- Fresh A1 receipt and `iolm-fixture-boundary/v1`: pass.
- Exact current Key-and-Door fixture hashes: pass.
- JSON syntax for Dispatch and Craft index: pass.
- Dispatch JSON Schema: pass.
- New A1 native-stage receipt and A2 strategy frontier: pass.
- Craft ledger, internal next-move index, machine index, and human view parity: pass.
- Craft index ledger digest: pass.
- Stale A1/A4 selection scan: pass.
- Unrelated BTE next move preservation: pass.
- `git diff --check`: pass.
- Full Dispatch semantic validator: expected `block` only for the existing truthful A4 browser-acceptance, 00C-B cross-feature, and G-DSV2-SG receipts; no new route-shape block was introduced.

## Residue and next route

- Closeout blocker: none.
- Selected next unit: `SWU-IOLM-00C-UI-A2`.
- Returned route: strict Context Builder plus compact Goal, then one `task-session:regenerate`.
- Stop condition: fresh `iolm-demo-snapshot/v1`; do not select or execute A3 automatically.
- This closeout does not execute A2.
