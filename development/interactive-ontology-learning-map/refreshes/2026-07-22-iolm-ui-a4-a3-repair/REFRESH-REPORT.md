# Invoke Refresh Report — IOLM UI A4 block to A3 repair

## Result

- Mode: `refresh`
- Spell: `invoke`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Phase basis: terminal A4 evidence was bound, the exact planning/Craft delta was applied, and no Refresh-authoring blocker remains
- Handoff status: `ready`
- Output handle: `iolm-ui-a4-a3-repair-refresh-applied/v1`
- Evidence date: `2026-07-22`

## Source signals

| ID | Type | Claim | Evidence |
|---|---|---|---|
| RFS-IOLM-UI-801 | `evidence_added` | A4 is terminal `BLOCK/FAIL`; `PW-BB-04` failed and no browser acceptance handle exists. | A4 `RESULT.md` and machine receipt |
| RFS-IOLM-UI-802 | `blocker_opened` | `B-IOLM-A3-FIREFOX-EVENT-TARGET` belongs to A3. | A4 defect receipt and Firefox failure evidence |
| RFS-IOLM-UI-803 | `status_changed` | A4 is blocked and only the A3 repair iteration is selected; A1/A2 and historical A3 passes remain. | terminal A4 receipt plus explicit apply authorization |
| RFS-IOLM-UI-804 | `route_changed` | The next route is one bounded A3 repair Task Session with an exact three-file scope. | A4 continuation route and synchronized parent task/wave |

## Applied delta

- Recorded A4 `BLOCK/FAIL`, `PW-BB-01`–`03` pass, `PW-BB-04` fail, later checks `NOT_RUN`, and no `iolm-browser-acceptance/v1`.
- Preserved A1/A2 passes and the historical A3 `iolm-interactive-viewer/v1` source-contract pass.
- Selected only the A3 repair iteration for `B-IOLM-A3-FIREFOX-EVENT-TARGET`.
- Declared repair writes only to `assets/app.mjs`, `assets/selection.mjs`, `tests/selection-inspector.test.mjs`, and new A3 repair lifecycle evidence.
- Synchronized Work-Pack, parent task, W0C-UI wave, Dispatch, canonical Craft ledger, machine index, and human view.
- Did not mutate implementation, A1–A4 lifecycle evidence, DomainSpec, authority, or public Arcanum surfaces.

## Dispatch technique trace

- Existing dispatch: `../../DISPATCH.json`
- Techniques: `sequence`, `handle_handoff`, `execution_receipt_handoff`, `owner_boundary_check`, `state_namespace_boundary`, `residue_ledger`, `validation_loop`, `concrete_path_evidence`, `observability_grouping`
- Concrete effect: terminal A4 evidence closes only that attempted browser stage as blocked and routes a bounded repair back to A3 without invalidating A3's historical source-contract pass.
- Distill: skipped because this is an exact status/repair-selection delta with no new SWU or recomposition shape.
- Delegation: one bounded bookkeeping helper applied this refresh; no full subagent dispatch ledger pair was required.

## Validation

- Source evidence hashes: pass for A4 result/receipt/defect/route and A3 result/receipt.
- JSON and YAML syntax: pass.
- A4 receipt truth: pass; `status=block`, `validation_result=fail`, `output_handle=null`.
- Selection cardinality: pass; A3 repair only.
- Dispatch UI receipt state: pass; historical A3 `pass`, A4 `block`, A3 repair route explicit.
- Craft parity: pass for both IOLM context next moves and ledger/index hash binding.
- Stale A4-selected route scan: pass across the exact planning/Craft surfaces.
- Six-value fence and private/public boundary: pass.
- Scoped diff hygiene: pass.

## Blockers and residue

- Refresh-authoring: none.
- Apply authorization: resolved by the user's explicit `refresh apply approved` request.
- Target lifecycle: A3 repair remains to be executed by Task Session; A4 replay remains deferred until a fresh viewer receipt exists.
- Audit: resolved for this refresh's exact status and boundary scope.
- Unchanged independent residue: 00C-B cross-feature support, 00C-C selection, G-DSV2-SG authority rebind, and human A4 checks.

## Owner receipt and next route

- Owner: private IOLM planning/Craft owner via `invoke:refresh`
- Receipt: `pass`, `iolm-ui-a4-a3-repair-refresh-applied/v1`
- Next target: `task-session:repair:SWU-IOLM-00C-UI-A3`
- Write scope: `assets/app.mjs`, `assets/selection.mjs`, `tests/selection-inspector.test.mjs`, and a new `work-pack/session-evidence/SWU-IOLM-00C-UI-A3/repairs/**` lifecycle directory.
- Expected output: fresh passing `iolm-interactive-viewer/v1` with a text-node event-target regression; do not replay A4 in the same Task Session.
