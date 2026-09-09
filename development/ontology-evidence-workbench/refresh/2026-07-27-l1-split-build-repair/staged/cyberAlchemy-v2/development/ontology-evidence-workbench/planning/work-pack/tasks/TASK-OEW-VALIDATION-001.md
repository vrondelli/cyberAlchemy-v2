# TASK-OEW-VALIDATION-001 — Final Build and Automated Acceptance

Layer/wave: L1 / W1
Dependencies: SWU-OEW-013 plus verified SWU-OEW-006P toolchain handle
State: planned; unselected and blocked upstream

## Implementation Detail

First materialize and independently verify the complete 007–013 feature overlay
in a new clean workroot. Browser production then consumes—not rebuilds—that
immutable final build handle, serves the verified Poker adapter run, and
executes scripted Firefox/Chromium journeys. The producer owns exact browser
binaries, minimal environment, loopback ports, child PIDs, network observation,
and `finally` teardown. A separate SWU accepts or rejects the browser producer
receipt. Manual screen-reader/usability remain separate.

## Smallest Working Units

### SWU-OEW-013B — Materialize and Verify the Final L1 Build

- Primary behavior: consume the verified 006P toolchain handle and complete
  007–013 overlay, then produce and independently verify one immutable final
  build handle.
- Dependencies: 013.
- Target inventory:
  - `.../contracts/l1-build-handle.schema.json`
  - `.../contracts/l1-build-verification.schema.json`
  - `.../scripts/materialize-l1-build.mjs`
  - `.../scripts/verify-l1-build.mjs`
  - `.../test/l1-final-build.test.mjs`
  - `.../generated/runs/SWU-OEW-013B/l1-build-handle.json`
  - `.../generated/runs/SWU-OEW-013B/l1-build-verification.json`
- Done: the final overlay manifest/patch bytes bind a fresh digest-named
  workroot; exact toolchain/effective lock/mode pass; patch-once, dashboard
  Vitest, `tsc -b && vite build`, output digest, protected equality, cleanup,
  residue, and distinct-verifier checks pass.
- Negative witnesses: pre-feature handle reuse, overlay drift/reapply, ambient
  workspace/global fallback, tool/lock drift, output tamper, failed cleanup,
  or producer-only acceptance block.
- Validation: `npm run build:l1 && npm run verify:l1-build`.
- Expected handle: `oew-l1-build-verification/v1`.
- Split analysis: final source-to-build temporal closure is independently
  falsifiable from feature semantics and browser behavior.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-013B/receipt.json`.
- Handoff: stop; report 014 eligible without selecting it.

### SWU-OEW-014 — Produce Automated Workbench Acceptance Receipt

- Primary behavior: independently verify the implemented L1 semantic/browser/
  automated-a11y contract.
- Dependencies: 013B.
- Target inventory:
  - `.../contracts/browser-acceptance.schema.json`
  - `.../test/browser/oew.spec.mjs`
  - `.../test/browser/keyboard.spec.mjs`
  - `.../scripts/run-browser-acceptance.mjs`
  - `.../browser/BROWSER.lock.json`
  - `.../generated/runs/SWU-OEW-014/browser-acceptance.json`
  - `.../generated/runs/SWU-OEW-014/screenshots/desktop.png`
  - `.../generated/runs/SWU-OEW-014/screenshots/tablet.png`
  - `.../generated/runs/SWU-OEW-014/screenshots/mobile.png`
- Done: Poker, parity, token/network/console, responsive, keyboard, axe, reduced
  motion, protected-scope checks, exact build-handle binding, owned PID/port
  ledger, outbound observation, `finally` teardown, and port release pass;
  manual fields remain `NOT_RUN`.
- Validation: `npm run test:browser`.
- Expected handle: `oew-browser-acceptance/v1`.
- Execution owner: Task Session local browser fallback.
- Split analysis: this is a closure-only validation behavior over completed L1
  source; it does not add UI semantics. Manual human validation is exempted
  under TASK-OEW-VERIFY.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-014/receipt.json`.
- Handoff: emit a producer receipt only; do not close G-OEW-L1.

### SWU-OEW-014V — Independently Verify L1 Acceptance

- Primary behavior: recompute and accept or reject the final L1 build/browser
  evidence without invoking the producer's verdict path.
- Dependencies: 014.
- Target inventory:
  - `.../contracts/browser-acceptance-verification.schema.json`
  - `.../scripts/verify-browser-acceptance.mjs`
  - `.../test/browser-acceptance-verifier.test.mjs`
  - `.../generated/runs/SWU-OEW-014V/browser-acceptance-verification.json`
- Done: exact build handle, browser/tool lock, semantic results, screenshots and
  logs, protected equality, outbound assertions, owned PIDs/ports, port
  release, cleanup residue, manual `NOT_RUN`, and `authority_effect:none` are
  independently recomputed; tamper/self-acceptance/orphan/residue negatives
  fail.
- Validation: `npm run verify:browser-acceptance`.
- Expected handle: `oew-browser-acceptance-verification/v1`.
- Execution owner: Task Session local independent-verifier fallback, distinct
  from the 014 producer process.
- Split analysis: verification adds no UI/browser behavior and alone may close
  the automated G-OEW-L1 evidence boundary.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-014V/receipt.json`.
- Handoff: stop at G-OEW-L1; L2 remains unselected and requires permission.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
