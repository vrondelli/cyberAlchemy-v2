# Context Pack — IOLM UI A4 block to A3 repair

## Task

Apply the explicitly approved Invoke Refresh delta from terminal A4 Firefox
evidence: record A4 `BLOCK/FAIL` with no acceptance handle, preserve A1/A2 and
the historical A3 source-contract pass, and select only the bounded A3 repair.

## Covered obligations

1. Bind the terminal A4 result, machine receipt, defect receipt, and continuation route.
2. Preserve the exact A1/A2 pass chain and historical A3 `iolm-interactive-viewer/v1` receipt.
3. Record `B-IOLM-A3-FIREFOX-EVENT-TARGET` without rewriting A4 evidence.
4. Mark A4 `BLOCK/FAIL`; do not claim `iolm-browser-acceptance/v1`.
5. Select only the A3 repair iteration.
6. Bound repair writes to `assets/app.mjs`, `assets/selection.mjs`, `tests/selection-inspector.test.mjs`, and new A3 repair lifecycle evidence.
7. Preserve the six-value eligibility fence and private/public boundary.
8. Synchronize only Work-Pack, task, wave, Dispatch, and Craft status surfaces.

Coverage: `8/8`, strict, no fallback exploration.

## Selected evidence

- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A4/RESULT.md`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A4/execution-receipt.json`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A4/DEFECT-RECEIPT.md`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A4/continuation-route.json`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A3/RESULT.md`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A3/execution-receipt.json`
- `../../WORK-PACK.md`, `../../DISPATCH.json`, the UI parent task and W0C-UI wave
- `../../../../.craft/ledger.yml`, its machine index, and `../../../../CRAFT.md`

## Excluded

- `cyberAlchemy-v2/development/iolm-workable-example/**`: implementation belongs to the following Task Session.
- `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/**`: terminal source evidence is immutable.
- A1/A2 and historical A3 lifecycle evidence: source receipts are immutable.
- Execution Pack, Layering, Distill, shared context, traceability, and cross-task gap files: outside this minimal operational status synchronization.
- `projects/domainspec-v2/**`, `cyberAlchemy-v2/authority/**`, and `arcanum/**`: forbidden authority/public scope.

## Handoff

Target: `task-session:repair:SWU-IOLM-00C-UI-A3`.

Write scope: the three implementation files named above plus a new repair
lifecycle directory under
`work-pack/session-evidence/SWU-IOLM-00C-UI-A3/repairs/**`.

Expected receipt: a fresh passing `iolm-interactive-viewer/v1` with a
Firefox text-node event-target regression. A4 replay remains a later, separately
selected Task Session and must use a new run directory.
