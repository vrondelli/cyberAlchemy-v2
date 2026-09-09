# TASK-OEW-VALIDATION-001 — Final Build and Automated Acceptance

Layer/wave: L1 / W1
Dependencies: SWU-OEW-007T plus verified SWU-OEW-006P/007/008F receipts
State: SWU-OEW-013B blocked awaiting selected SWU-OEW-007T; 014/014V unselected

## Implementation Detail

First materialize and independently verify the complete 007 + 008F feature overlay
in a new clean workroot. Preserve the frozen `--ignore-scripts` install, then
run the exact pinned `pnpm --filter @understand-anything/core build` before
dashboard Vitest and record its command, exit code, output-tree digest, and
required `dist` exports. Browser production then consumes—not rebuilds—that
immutable final build handle, serves the verified Poker adapter run, and
executes scripted Firefox/Chromium journeys. The producer owns exact browser
binaries, minimal environment, loopback ports, child PIDs, network observation,
and `finally` teardown. A separate SWU accepts or rejects the browser producer
receipt. Manual screen-reader/usability remain separate.

## Smallest Working Units

### SWU-OEW-013B — Materialize and Verify the Final L1 Build

- Primary behavior: consume the verified 006P toolchain handle and complete
  007 + 008F overlay, then produce and independently verify one immutable final
  build handle.
- Dependencies: 007T.
- Required immutable input:
  - `.../upstream/L1-BUILD.lock.json`, mutation/binding-owned by 007T while
    retaining 013B as owner, consumer, build owner, and runtime owner.
- Target inventory:
  - `.../contracts/l1-build-handle.schema.json`
  - `.../contracts/l1-build-verification.schema.json`
  - `.../scripts/materialize-l1-build.mjs`
  - `.../scripts/verify-l1-build.mjs`
  - `.../test/l1-final-build.test.mjs`
  - `.../generated/runs/SWU-OEW-013B/l1-build-handle.json`
  - `.../generated/runs/SWU-OEW-013B/l1-build-verification.json`
- Done: the final overlay manifest/patch bytes bind a fresh digest-named
  workroot; exact toolchain/effective lock/mode and pinned root/core/dashboard
  package metadata pass; patch-once, explicit core `tsc` after install and
  before dashboard Vitest, `tsc -b && vite build`, output digests, protected
  equality, cleanup, residue, and distinct-verifier checks pass.
- Negative witnesses: pre-feature handle reuse, overlay drift/reapply, ambient
  workspace/global fallback, tool/lock/core-package drift, missing/drifted/
  skipped/failed/out-of-order core build, missing command/exit/output evidence,
  output tamper, failed cleanup, or producer-only acceptance block.
- Validation: `npm run build:l1 && npm run verify:l1-build`.
- Expected handle: `oew-l1-build-verification/v1`.
- Split analysis: final source-to-build temporal closure is independently
  falsifiable from feature semantics and browser behavior.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-013B/receipt.json`.
- Handoff: stop; report 014 eligible without selecting it.
- Attempt 001 result: BLOCK before material packaging. Registered commands
  require absent `upstream/L1-BUILD.lock.json`, which is outside the selected
  seven-path inventory. Invoke Refresh must add that single private lock target
  and revalidate before a new attempt; no package root or successor is added.
- Repair result: the private build lock is now target eight and binds the exact
  verified 006P toolchain, retained upstream/effective workspace, explicit 007
  bytes, complete 008F manifest file set, entrypoint patch contract, execution
  mode, protected baseline, and expected producer/verifier outputs. The
  existing series reselects 013B for a fresh Task Session preflight; this is not
  build or verifier evidence.
- Attempt 002 result: BLOCK before mutation admission. The repaired lock passes
  preflight, all 61 bindings, syntax, and six staged contract tests. Its frozen
  install, exact feature copy, and patch-once gates pass; dashboard Vitest then
  fails because `--ignore-scripts` suppresses upstream `prepare` while the lock
  does not explicitly build pinned `@understand-anything/core` before tests.
  Invoke Refresh must bind that exact build-order step before 013B can be
  revalidated and reselected. The source BLOCK remains terminal, no successor
  is selected, and 014/014V remain planned.
- Effective-order repair result: the private lock now binds the pinned root
  package prepare script, core package path/digest/size/name, exact `build: tsc`
  script, full `dist` export contract, and the exact command order install →
  core build → dashboard Vitest. The fresh Task Session must record command,
  exit-code, output-tree digest, and required dashboard-import outputs or fail
  closed. The repair reselects 013B only and is not build/verifier evidence.
- Attempt 003 result: BLOCK before mutation admission. All 70 lock checks,
  11 frontier checks, seven staged contract tests, frozen install, exact core
  build with 12/12 required outputs, and dashboard Vitest pass. The exact
  `tsc -b && vite build` then fails with 48 strict errors in the immutable
  completed-007 `loadOewBundle.ts`, `store.ts`, and `types.ts` sources.
  `SWU-OEW-007T` now owns the six-path typed-input repair and is the only
  selected unit. 013B no longer owns lock mutation; it remains the immutable
  lock consumer plus final build/runtime owner. Passing 007T must prove the
  existing focused store test and exact fresh-workroot dashboard
  `tsc -b && vite build`, then stop and report 013B eligible without selection.
  No successor is selected; 014/014V remain planned.

### SWU-OEW-014 — Produce Automated Workbench Acceptance Receipt

- Primary behavior: independently verify the implemented L1 semantic/browser/
  automated-a11y contract.
- Dependencies: 013B.
- Target inventory:
  - `.../contracts/browser-acceptance.schema.json`
  - `.../test/browser-acceptance.test.mjs`
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
