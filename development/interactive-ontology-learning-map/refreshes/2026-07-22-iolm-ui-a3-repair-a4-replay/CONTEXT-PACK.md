# Context Pack — IOLM UI A3 repair to A4 replay

## Task

Apply the standing-approved Invoke Refresh continuation delta from the fresh A3
repair receipt: preserve the historical A3 pass and failed A4 run, record the
repair `PASS` and fresh `iolm-interactive-viewer/v1`, resolve
`B-IOLM-A3-FIREFOX-EVENT-TARGET` for the repair lifecycle, and select exactly
one new A4 Firefox replay.

## Covered obligations

1. Bind the A3 repair result, machine receipt, and continuation route.
2. Preserve the original A3 source-contract result and terminal A4 failure evidence.
3. Record the repaired files, regression proof, and fresh `iolm-interactive-viewer/v1` without claiming browser acceptance.
4. Resolve `B-IOLM-A3-FIREFOX-EVENT-TARGET` only for the A3 repair lifecycle.
5. Select exactly one new `SWU-IOLM-00C-UI-A4` Firefox replay.
6. Require new generated-run, Playwright-output, and replay-lifecycle directories; never overwrite the failed A4 run.
7. Preserve the six-value eligibility fence and private/public boundary.
8. Synchronize only Work-Pack, UI parent task, W0C-UI wave, Dispatch, and Craft status surfaces.

Coverage: `8/8`, strict, no fallback exploration.

## Selected evidence

- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A3/repairs/2026-07-22-firefox-event-target/RESULT.md`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A3/repairs/2026-07-22-firefox-event-target/execution-receipt.json`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A3/repairs/2026-07-22-firefox-event-target/continuation-route.json`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A4/execution-receipt.json`
- `../../work-pack/session-evidence/SWU-IOLM-00C-UI-A4/DEFECT-RECEIPT.md`
- `../../WORK-PACK.md`, `../../DISPATCH.json`, the UI parent task, and W0C-UI wave
- `../../../../.craft/ledger.yml`, its machine index, and `../../../../CRAFT.md`

## Excluded

- `cyberAlchemy-v2/development/iolm-workable-example/**`: Refresh cannot execute or alter implementation/browser work.
- Existing A3 and A4 lifecycle evidence: immutable source receipts and failed-run evidence.
- Execution Pack, Layering, Distill, shared context, traceability, and gap files: outside the minimal operational delta.
- `projects/domainspec-v2/**`, `cyberAlchemy-v2/authority/**`, and `arcanum/**`: forbidden authority/public scope.

## Handoff

Target: `task-session:execute:SWU-IOLM-00C-UI-A4` replay.

Write scope: a new
`cyberAlchemy-v2/development/iolm-workable-example/generated/runs/<new-run-id>/**`,
new `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/output/playwright/<new-run-id>/**`,
and new `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/replays/<new-run-id>/**`.
Existing A4 result, receipt, defect, run `20260722T160251Z-firefox`, and its
Playwright evidence are read-only.

Expected receipt: one fresh A4 replay result binding the repaired viewer. It may
emit `iolm-browser-acceptance/v1` only if its declared automated acceptance
passes; required human checks remain honestly `NOT_RUN` until performed.
