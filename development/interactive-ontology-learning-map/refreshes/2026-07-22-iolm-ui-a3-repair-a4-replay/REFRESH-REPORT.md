# Invoke Refresh Report — IOLM UI A3 repair to A4 replay

## Result

- Mode: `refresh`
- Spell: `invoke`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Phase basis: the fresh A3 repair receipt was bound, the exact status/route delta was applied, and no Refresh-authoring blocker remains
- Handoff status: `ready`
- Output handle: `iolm-ui-a3-repair-a4-replay-refresh-applied/v1`
- Evidence date: `2026-07-22`

## Source signals

| ID | Type | Claim | Evidence |
|---|---|---|---|
| RFS-IOLM-UI-901 | `evidence_added` | The bounded A3 repair passed and returned a fresh `iolm-interactive-viewer/v1`. | repair result and machine receipt |
| RFS-IOLM-UI-902 | `blocker_resolved` | `B-IOLM-A3-FIREFOX-EVENT-TARGET` is resolved for the A3 repair lifecycle. | 6/6 focused, 50/50 Node, 8/8 Python, HTTP/syntax/inventory passes |
| RFS-IOLM-UI-903 | `status_changed` | The A3 repair is complete and exactly one new A4 replay is selected; historical A3 and failed A4 evidence remain immutable. | repair receipt, failed A4 receipt, and standing apply authorization |
| RFS-IOLM-UI-904 | `route_changed` | The next route is one bounded A4 Firefox replay in new run/evidence directories. | repair continuation route and synchronized task/wave |

## Applied delta

- Recorded the passing A3 repair and fresh `iolm-interactive-viewer/v1` without claiming rendered-browser acceptance.
- Resolved `B-IOLM-A3-FIREFOX-EVENT-TARGET` only for the A3 repair lifecycle.
- Preserved the original A3 pass and terminal A4 `BLOCK/FAIL` run, receipt, defect, and Playwright evidence.
- Selected exactly one new `SWU-IOLM-00C-UI-A4` Firefox replay.
- Required new generated-run, Playwright-output, and A4 replay-lifecycle directories.
- Synchronized Work-Pack, UI parent task, W0C-UI wave, Dispatch, canonical Craft ledger, machine index, and human view.
- Did not mutate implementation, existing A3/A4 lifecycle evidence, DomainSpec, authority, or public Arcanum.

## Dispatch technique trace

- Existing dispatch: `../../DISPATCH.json`
- Techniques: `sequence`, `handle_handoff`, `execution_receipt_handoff`, `owner_boundary_check`, `state_namespace_boundary`, `residue_ledger`, `validation_loop`, `concrete_path_evidence`, `observability_grouping`
- Concrete effect: the fresh repair receipt resolves only its source defect and opens one immutable A4 replay without upgrading the failed A4 attempt or crossing authority fences.
- Dispatch validation: route references are valid; the validator remains expected `BLOCK` only because the Dispatch intentionally retains the historical A4 block plus unrelated candidate-compile and `Sg` block receipts.
- Distill: skipped because this is an exact status/route delta with no new SWU, write-scope family, or recomposition shape.
- Delegation: one bounded bookkeeping helper applied the refresh; no full subagent dispatch-ledger pair was required.

## Validation

- Strict Context Builder coverage: `8/8`, no fallback exploration.
- Source hashes: pass for A3 repair result/receipt/route and historical A4 receipt/defect.
- Receipt truth: pass; repair `status=pass`, `validation_result=pass`, fresh output handle exact, blockers empty.
- Historical A4 truth: pass; `status=block`, `output_handle=null`, source hashes unchanged.
- JSON and YAML syntax: pass.
- Selection cardinality: pass; exactly one new A4 replay is selected across task, wave, Dispatch, and Craft surfaces.
- Dispatch repair-step binding: pass; no unknown receipt step ID remains.
- Craft parity: pass; ledger/index next moves and index ledger hash agree.
- Six-value fence and private/public boundary: pass.
- Stale A3-repair-selected scan and scoped diff hygiene: pass.

## Blockers and residue

- Refresh-authoring: none.
- Apply authorization: resolved by the standing user authorization for routine continuation refreshes in a helper.
- Target lifecycle: one new A4 Firefox replay remains to be executed by Task Session.
- Audit: resolved for this refresh's exact status, route, source-integrity, and boundary scope.
- Unchanged independent residue: A4 manual runners, 00C-B cross-feature support, 00C-C selection, G-DSV2-SG authority rebind, promotion, and publication.

## Owner receipt and next route

- Owner: private IOLM planning/Craft owner via `invoke:refresh`
- Receipt: `pass`, `iolm-ui-a3-repair-a4-replay-refresh-applied/v1`
- Next target: `task-session:execute:SWU-IOLM-00C-UI-A4` replay
- Write scope: new `generated/runs/<run-id>/**`, new `session-evidence/SWU-IOLM-00C-UI-A4/output/playwright/<run-id>/**`, and new `session-evidence/SWU-IOLM-00C-UI-A4/replays/<run-id>/**` only.
- Read-only: all A1–A3 implementation outside A4, historical A3 receipts, and existing A4 run/lifecycle/Playwright evidence, including `20260722T160251Z-firefox`.
- Expected output: a fresh A4 replay receipt; emit `iolm-browser-acceptance/v1` only if its declared automated acceptance passes, and keep unperformed human checks `NOT_RUN`.
