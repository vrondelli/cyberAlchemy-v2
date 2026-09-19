---
mode: refresh
phaseStatus: pass
phaseStatusBasis: artifact-complete
mutationMode: apply-approved
handoffStatus: gated-on-explicit-repair-selection
refreshed_at: 2026-07-23
---

# Invoke Refresh Report — BTE L0A Evidence Reconciliation

## Result

The apply-approved refresh is complete. L0A was selected and implemented, its
historical pass receipt remains byte-identical, and current exact-byte proof is
honestly blocked. Planning, Craft, Inventory, and FPR roadmap projections now
name `SWU-BTE-L0A-REPAIR-001` as the sole unselected candidate.

The live deterministic verifier fails closed:

```text
BTE_OUTPUT_OVERWRITE: refusing to replace different bytes at
runs/20260723T020759Z/l0a/contract-publication-receipt.json
```

Eight contract schemas plus `diagnostics.ts` have one narrow drift relation:
the immutable receipt digest equals the current bytes plus one additional LF.
The files already end in LF, so the difference is an additional trailing blank
line. `contract-publication-receipt.v1.schema.json` matches exactly.

Twenty target artifacts were synchronized through two validated material
packages: 15 planning/Craft targets and five Inventory/visibility read models.
Implementation, historical receipts, validation inputs, consumers, admission,
release, production, and public Arcanum were unchanged.

## Phase And Handoff

- Phase status: `pass`
- Phase-status basis: exact apply completed; `0` refresh-authoring blockers
- Mutation mode: `apply-approved`
- Handoff status: `gated-on-explicit-repair-selection`
- Mutation ready: `true` for the completed refresh delta
- Apply authorization: explicit user request received
- Authority package: `dsv2-bte-l0a-evidence-reconciliation-apply-20260723`,
  digest `39bf57ae92880377df1db8e87d3866045a738ded848f8d47bc3adaaa057e92a9`
- Projection package:
  `dsv2-bte-l0a-evidence-reconciliation-projections-20260723`, digest
  `d645c9e1655f0b652e0b9b3ab8c17dbcb14451e0025c38ca79e5c446da4d3135`

Target-lifecycle and audit blockers gate continuation but do not lower the
complete proposal artifact.

## Refresh Signals

| Signal | Type | Claim | Safety |
| --- | --- | --- | --- |
| `BTE-L0AR-001` | `evidence_added` | L0A has a selected passing historical Task Session receipt and implementation handles. | safe |
| `BTE-L0AR-002` | `status_changed` | The prior “L0A candidate unselected” projection is replaced by historical-pass/current-proof-blocked state. | applied |
| `BTE-L0AR-003` | `artifact_drift` | Eight schemas and `diagnostics.ts` differ from exact receipt bytes by one additional LF. | needs repair |
| `BTE-L0AR-004` | `blocker_opened` | Current publication verification fails with `BTE_OUTPUT_OVERWRITE`. | blocking |
| `BTE-L0AR-005` | `route_changed` | The next route is evidence repair, not initial L0A selection. | applied |
| `BTE-L0AR-006` | `blocker_opened` | Independent L0 red-manifest and freeze artifacts are absent; L0B stays blocked. | owner-gated |

## Applied Delta

1. Open `BLK-DSV2-BTE-L0A-RECEIPT-DRIFT-001` in scoped Craft.
2. Preserve historical L0A receipts and expose one unselected
   `SWU-BTE-L0A-REPAIR-001`.
3. Record L0A as implementation-present, historical-pass, and
   current-proof-blocked.
4. Bind the repair unit to exactly the nine mismatching byte surfaces and the
   existing verifier; Invoke did not execute the repair.
5. Index the L0A execution receipt, continuation handoff, publication receipt,
   and this reconciliation in Craft.
6. Synchronize the non-authority Inventory and FPR roadmap read models while
   preserving unrelated concurrent Inventory changes.
7. Keep validation-owner work, L0B, consumers, admission, and production gated.

## Target Inventory

Applied planning/state targets:

- `PLAN.md`
- `IMPLEMENTATION-LAYERING.md`
- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- `EXECUTION-DISPATCH.json`
- `DISTILL-VALIDATION.md`
- `work-pack/shared/{CONTEXT,DECISIONS,GAPS,TRACEABILITY}.md`
- `work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md`
- `work-pack/waves/W1-L0-PROOF-PRIMITIVES.md`
- `work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`

Applied projection targets:

- `.arcanum/inventory/entries/domainspec-v2-bte-full-work-refresh-applied-result.md`
- `.arcanum/inventory/index.md`
- `.arcanum/inventory/index.json`
- FPR visibility `roadmap-data.json` and `roadmap.html`

Task Session repair targets are the eight mismatching contract schemas and
`diagnostics.ts` only.

## Dispatch Technique Trace

Selected techniques:

- `sequence`: inventory → context → proposal → validation → gated apply →
  gated Task Session;
- `frame_handoff` and `handle_handoff`: pass bounded context and owner handles;
- `concrete_path_evidence`: bind every delta to exact repository paths;
- `execution_receipt_handoff`: preserve L0A and require a repair receipt;
- `artifact_contract_bridge`: tie status changes to verifier evidence;
- `owner_boundary_check` and `authority_split_gate`: separate Invoke, Task
  Session, validation-owner, Craft, Inventory, and release authority;
- `residue_ledger`: preserve byte drift, apply, freeze, and audit residue;
- `state_namespace_boundary`: prevent source, receipts, projections, and public
  Arcanum from collapsing;
- `approval_semantics_map`: distinguish proposal completion from apply approval;
- `validation_loop`: require current byte/replay verification;
- `observability_grouping`: group all route events by dispatch ID.

Full dispatch artifact:
`REFRESH-DISPATCH.json`. Subagent strategy is `none`; no delegated execution is
needed or authorized.

## Context Builder

- Mode: `deep`
- Strict coverage: `8/8 pass`
- Selected files: `24`
- Handoff pack: `none`
- Output: `CONTEXT-PACK.md`, `context-pack.json`

## Inventory

- Machine index: `.arcanum/inventory/index.json`
- Validation: `pass`
- Lookup readiness: `ready`
- Projection conformance: `pass`
- Existing BTE read model: verified and synchronized to the applied posture
- Inventory mutations: one BTE entry plus machine/human indexes; no log rewrite

The global Inventory index changed concurrently through unrelated
reasoning-engine/orchestrator work. The projection material package bound those
exact source bytes before apply; the final index preserves them and validates
with lookup readiness `ready` and 72 uncontrolled-tag warnings.

## Distill

Skipped with rationale. This refresh does not redesign the plan or bundle
execution: it exposes one primary behavior with one reviewable acceptance
boundary—restore exact L0A bytes before any L0B work.

## Blockers By Scope

- Refresh authoring: `0`
- Apply authorization: `0`
- Target lifecycle: `2`
  - current L0A receipt/source-byte mismatch;
  - absent validation-owner red-manifest freeze.
- Audit: `1`
  - rerun exact publication verification after repair and prove receipt bytes
    remain unchanged.

## Boundaries

This refresh does not:

- edit implementation or historical receipts;
- select or execute a Task Session SWU;
- author validation-owner inputs;
- execute L0B or later layers;
- mutate consumers, UI, admission, release, or production state;
- copy private DomainSpec content into public Arcanum.

## Next Route

The refresh delta is applied. The next route still requires a separate explicit
Task Session selection:

```text
select SWU-BTE-L0A-REPAIR-001
  -> task-session
  -> invoke refresh receipt synchronization
  -> independent validation-owner freeze
  -> later explicit SWU-BTE-L0B-001 selection
```
