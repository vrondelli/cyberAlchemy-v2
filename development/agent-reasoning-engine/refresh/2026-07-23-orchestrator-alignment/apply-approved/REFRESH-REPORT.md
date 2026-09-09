# Invoke refresh apply report — orchestrator alignment

## Result

- Operation: `invoke:refresh:apply-approved`
- Phase status: `pass`
- Apply handoff: complete
- Owner packages: Invoke, Craft, Inventory
- Applied targets: 14
- Immediate lifecycle route: explicit `G-ARE-L0` evidence/owner promotion gate
- First post-promotion route: `invoke:design ACI-REASONING-BINDING`

The approved refresh is applied. The define/design surfaces now recognize one
bounded local L0 semantic witness while retaining the whole-engine
non-promotion boundary. The plan and Craft surfaces now expose
`BLK-ARE-ACI-BINDING-001` before affected L1/L2 mutation. Inventory preserves
the frozen historical research snapshots and adds the 2026-07-23 current-state
posture.

## Validation

- All canonical targets are byte-identical to their staged outputs.
- Invoke, Craft, and Inventory material receipts passed with ready handoffs.
- Craft ledger/index/view status and source digest are synchronized.
- Inventory lookup readiness is `ready`: 0 failures and 72 existing
  uncontrolled-tag warnings.
- The L0 semantic evaluator suite remains 16/16.
- `git diff --check` passes.
- No reasoning-engine implementation, external orchestrator checkout, or public
  Arcanum target changed.

## Claim ceiling

One local finite L0 semantic witness exists. This apply does not promote a
whole reasoning engine, authorize another SWU, implement an actor runtime or
real effect, prove ACI compatibility, or establish anti-bias efficacy.

## Receipts

- [`OWNER-RECEIPT.json`](OWNER-RECEIPT.json)
- [`invoke-apply-receipt.json`](invoke-apply-receipt.json)
- [`craft-apply-receipt.json`](craft-apply-receipt.json)
- [`inventory-apply-receipt.json`](inventory-apply-receipt.json)

## Next route

Run the explicit `G-ARE-L0` evidence/owner promotion gate. If it admits
continuation, use Invoke Design for `ACI-REASONING-BINDING`. Do not select
SWU-ARE-002, SWU-ARE-003, or SWU-ARE-006 before that binding contract
dispositions the ownership seam.
