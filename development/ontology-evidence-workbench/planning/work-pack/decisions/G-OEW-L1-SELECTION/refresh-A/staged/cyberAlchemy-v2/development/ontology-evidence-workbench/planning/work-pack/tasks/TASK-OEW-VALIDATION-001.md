# TASK-OEW-VALIDATION-001 — Automated Browser and Accessibility Evidence

Layer/wave: L1 / W1
Dependencies: SWU-OEW-013
State: selected L1 frontier; dependency-gated until SWU-OEW-013 passes

## Implementation Detail

Build the overlay from the exact upstream pin, serve the verified Poker adapter
run, and execute scripted Firefox/Chromium journeys. Capture structured results,
screenshots, console/network logs, axe findings, keyboard sequence, view parity,
viewport state, and protected-scope digests. Manual screen-reader/usability
remain separate.

## Smallest Working Units

### SWU-OEW-014 — Produce Automated Workbench Acceptance Receipt

- Primary behavior: independently verify the implemented L1 semantic/browser/
  automated-a11y contract.
- Dependencies: 013.
- Target inventory:
  - `.../contracts/browser-acceptance.schema.json`
  - `.../test/browser/oew.spec.mjs`
  - `.../test/browser/keyboard.spec.mjs`
  - `.../scripts/run-browser-acceptance.mjs`
  - `.../generated/runs/SWU-OEW-014/browser-acceptance.json`
  - `.../generated/runs/SWU-OEW-014/screenshots/desktop.png`
  - `.../generated/runs/SWU-OEW-014/screenshots/tablet.png`
  - `.../generated/runs/SWU-OEW-014/screenshots/mobile.png`
- Done: Poker, parity, token/network/console, responsive, keyboard, axe, reduced
  motion, and protected-scope checks pass; manual fields remain `NOT_RUN`.
- Validation: `npm run test:browser`.
- Expected handle: `oew-browser-acceptance/v1`.
- Execution owner: Task Session local browser fallback.
- Split analysis: this is a closure-only validation behavior over completed L1
  source; it does not add UI semantics. Manual human validation is exempted
  under TASK-OEW-VERIFY.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-014/receipt.json`.
- Handoff: close G-OEW-L1 only; L2 remains unselected and requires permission.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
