# A4 Firefox Defect Receipt — route to A3

## Identity

- Defect: `B-IOLM-A3-FIREFOX-EVENT-TARGET`
- Discovered by: `SWU-IOLM-00C-UI-A4`, real Firefox scenario `PW-BB-04`
- Owning implementation unit: `SWU-IOLM-00C-UI-A3`
- Run: `20260722T160251Z-firefox`
- Result: `BLOCK` for A4; browser acceptance handle not emitted

## Reproduction

1. Start the validated local server on `127.0.0.1:4173`.
2. Open the deep URL in Firefox through the bundled Playwright CLI wrapper.
3. Activate “What does the Player do?” and switch to the Table lens.
4. Click `key-and-door.edge.player-performs-unlock-door` in the Relations table.

Expected: selection changes to the relation and the inspector shows its exact relation provenance.

Actual: selection remains `key-and-door.UnlockDoor` and Firefox logs:

```text
TypeError: target.closest is not a function
at selectFromElement (/assets/app.mjs:56:23)
```

## Cause and repair boundary

The delegated listener passes `event.target` directly to `selectFromElement`.
Firefox may surface the button's text node as that target; a text node has no
`closest()` method. A3 should normalize the event target to an `Element` (or its
`parentElement`) before resolving `[data-stable-id]`, add a regression for the
text-node target path, and return a fresh passing `iolm-interactive-viewer/v1`
receipt. A4 must then replay `PW-BB-01`–`PW-BB-10` from a new run directory.

A4 has not edited `app.mjs` or any A1–A3 implementation file.

## Evidence

- [failed table snapshot](./output/playwright/20260722T160251Z-firefox/pw-bb-04-relation-selected-table.md)
- [failure screenshot](./output/playwright/20260722T160251Z-firefox/pw-bb-04-firefox-text-node-defect.png)
- `.playwright-cli/console-2026-07-22T16-03-14-228Z.log`
- `cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T160251Z-firefox/automated-results.json`
