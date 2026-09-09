# Invoke Refresh Report — current-generation IOLM A1 to A2 continuation

## Result

- Mode: `refresh`
- Spell: `invoke`
- Mutation mode: `proposal-only`
- Phase status: `pass`
- Phase basis: fresh A1 evidence, the live executable frontier and all twelve target baselines are exact; the proposal is complete with no Refresh-authoring blocker
- Handoff status: `gated`
- Output handle: `iolm-ui-current-a1-a2-refresh-proposed/v1`
- Evidence date: `2026-07-22`

## Frontier result

- The requested batch found zero uncompleted SWUs that were both selected and dependency-ready.
- The fresh A1 rebind had already passed, but the planning/Craft state still selected A1.
- A2-A4 were explicitly unselected; 00C-B was selected but dependency-blocked; all remaining SWUs were blocked or pending dependencies.
- Task Session therefore did not bypass selection ownership. It routed the terminal A1 receipt to this final proposal-only Refresh.

## Source signals

| ID | Type | Claim | Evidence |
|---|---|---|---|
| `RFS-IOLM-UI-1101` | `evidence_added` | The current-generation A1 rebind passed and returned `iolm-fixture-boundary/v1`. | fresh A1 result and machine receipt |
| `RFS-IOLM-UI-1102` | `blocker_resolved` | `B-IOLM-A1-PINNED-FIXTURE-DRIFT` is satisfied for the selected generation. | exact hashes, boundary validation and fresh handle |
| `RFS-IOLM-UI-1103` | `status_changed` | A1 should become complete and A2 alone should become selected. | fresh predecessor pass plus the established A1→A2 route |
| `RFS-IOLM-UI-1104` | `route_changed` | The next executable owner route is A2 preparation and one A2 Task Session, but only after approved apply. | Work-Pack stop contract and Refresh mutation gate |

## Proposed delta

- Bind the fresh current-generation A1 result and receipt across planning and Dispatch evidence.
- Mark A1 complete, resolve its fixture-drift blocker and select A2 only.
- Keep A3 revalidation and A4 replay unselected and gated by fresh predecessor receipts.
- Synchronize Work-Pack, Execution Pack, Implementation Layering, Distill, shared context/gaps, task, wave, root Dispatch and the canonical Craft ledger plus machine/human projections.
- Preserve every independent blocker, historical receipt, implementation/source boundary and eligibility exclusion.
- Exact per-target changes and baseline hashes are in [REFRESH-PATCH-PROPOSAL.md](./REFRESH-PATCH-PROPOSAL.md).

## Applied and skipped changes

- Applied changes: none; mutation mode is proposal-only.
- Skipped target mutation: all twelve targets, pending exact `invoke:refresh:apply-approved` authorization.
- No implementation, DomainSpec, historical lifecycle, authority, public Arcanum, promotion or publication file changed.

## Dispatch technique trace

- Dispatch: [REFRESH-DISPATCH.json](./REFRESH-DISPATCH.json)
- Techniques: `sequence`, `handle_handoff`, `execution_receipt_handoff`, `concrete_path_evidence`, `owner_boundary_check`, `state_namespace_boundary`, `residue_ledger`, `validation_loop`, `observability_grouping`
- Concrete effect: one fresh A1 receipt reaches one proposal owner boundary, exposes one A2 planning transition and cannot execute or promote downstream state.
- Dispatch validation: `pass`; the initial local Inventory metadata flag was repaired before the terminal validation.
- Subagents: none; the proposal is sequential and writes only this dated evidence folder.
- Distill: skipped because the existing two-row status transition changes no SWU, implementation scope or recomposition shape.

## Validation

- Strict Context Builder coverage: `10/10`; eleven selected sources; no fallback exploration.
- Inventory lookup: pass through `.arcanum/inventory/index.json`; non-authority only.
- Fresh A1 result/receipt hashes, pass state, validation and output handle: pass.
- Twelve target baseline hashes: pass.
- Refresh Dispatch Spec: pass after adding explicit repository-local Inventory metadata.
- JSON parse: pass for Context Pack and Dispatch.
- Proposal-only boundary: pass; only this dated Refresh folder was written.
- Apply validation: not run; target mutation is not authorized.

## Blockers and residue

- Refresh-authoring: none.
- Apply authorization: open; exact `invoke:refresh:apply-approved` is required for this proposal and target inventory.
- Target lifecycle: A2 remains unselected in live planning and unexecuted until the approved apply passes.
- Audit: deferred to apply-time syntax, selection, Craft parity, stale-state, source/history boundary and diff validation.
- Independent residue remains unchanged: 00C-B cross-feature support, 00C-C, G-DSV2-SG, manual runners, promotion and publication.

## Owner receipt and next route

- Owner: Invoke Refresh proposal authoring for the private IOLM planning/Craft owner.
- Receipt: `pass`, `iolm-ui-current-a1-a2-refresh-proposed/v1`.
- Next route: exact `invoke:refresh:apply-approved` against [REFRESH-PATCH-PROPOSAL.md](./REFRESH-PATCH-PROPOSAL.md).
- After a passing apply: strict Context Builder and compact Goal for `SWU-IOLM-00C-UI-A2`, then exactly one Task Session; stop at `iolm-demo-snapshot/v1`.
