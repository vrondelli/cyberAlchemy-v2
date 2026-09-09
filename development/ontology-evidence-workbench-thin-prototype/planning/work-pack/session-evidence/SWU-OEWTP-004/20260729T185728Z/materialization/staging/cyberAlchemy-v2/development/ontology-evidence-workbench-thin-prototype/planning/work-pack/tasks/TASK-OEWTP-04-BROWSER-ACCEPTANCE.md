# TASK-OEWTP-04: Poker-Team Browser Acceptance

## Objective

Run the exact OEW Poker-Team journey through the API adjacent to the active
global Playwright CLI and emit a complete browser acceptance receipt at the
fixed one-local-journey claim ceiling.

- Layer/slice: L1 / S-004
- Wave: W4
- SWU: `SWU-OEWTP-004`
- Dependency: SWU-OEWTP-003 pass and owner closeout

## Source contracts

- [UX Plan](../../../design/UX-PLAN.md)
- [Architecture significant behavior scenario](../../../design/ARCHITECTURE.md)
- [Validation strategy](../../VALIDATION-STRATEGY.md)
- exact gateway handle from SWU-OEWTP-003
- current global Playwright resolver evidence in [Plan context](../../PLAN-CONTEXT.md)

## Smallest Working Unit: SWU-OEWTP-004

### Primary behavior

One real Chromium journey produces a complete receipt of named user-visible,
trust, environment, network, console, and teardown assertions.

### Split analysis

Candidate children are browser identity, page navigation, each UI assertion,
request/console observation, and teardown. They cannot independently prove a
browser journey. The acceptance boundary is one receipt whose required fields
are all-or-nothing. The Task Session performs read-only closure review;
independent immutable receipt authority remains a separately owned L2 concern.

### Write scope

- `test/browser-acceptance.test.mjs`
- `contracts/browser-acceptance.schema.json`
- `generated/runs/SWU-OEWTP-004/<attempt-id>/gateway-runtime.json`
- `generated/runs/SWU-OEWTP-004/<attempt-id>/browser-acceptance.json`
- `generated/runs/SWU-OEWTP-004/<attempt-id>/request-ledger.json`
- `generated/runs/SWU-OEWTP-004/<attempt-id>/console-ledger.json`
- `generated/runs/SWU-OEWTP-004/<attempt-id>/browser-witness.png`
- `../../development/ontology-evidence-workbench-thin-prototype/planning/work-pack/session-evidence/SWU-OEWTP-004/<attempt-id>/receipt.json`

The test may write a unique generated run receipt during execution. It must not
edit `package.json`; the existing `test:browser` declaration already points to
the planned test path.

### Runtime admission

Use `../../MUTATION-ADMISSION-CONTRACT.json#SWU-OEWTP-004`.
The browser test and receipt schema are `materialWrites`; the gateway runtime,
browser receipt, request and console ledgers, screenshot, and terminal receipt
are `executionOutputs`. The browser run may create only those predeclared
outputs, must verify teardown and every output digest, and writes the terminal
receipt last.

### Browser binding

1. Resolve the active CLI with `command -v playwright`.
2. Record `playwright --version` and hash the resolved CLI/entrypoint.
3. Resolve the CLI symlink/realpath to `<global-package-root>/cli.js`, verify
   the adjacent `package.json` has `name: playwright` and the same CLI version,
   hash it, then dynamically import the adjacent exported `index.mjs` by
   absolute file URL. Smoke-check `chromium.launch` before starting the gateway.
4. Call `chromium.executablePath()` on that imported API. Require the returned
   absolute path to be executable, launch it through the same imported API, and
   record its browser version and SHA-256. `playwright install --dry-run
   chromium` is an optional diagnostic cross-check, never the resolver.
5. Record the CLI/package/API entry path/version/digests plus browser version,
   executable path, and executable SHA-256.
6. If the CLI, package/API export, smoke import, `executablePath()` result,
   launch, or version is missing/inconsistent, block
   before gateway/browser launch. Do not install or change a package manifest
   inside this SWU.

The 2026-07-29 observed values are advisory, not permanent pass predicates.

### Algorithm

1. Verify the exact gateway handle, build predecessor, adapter identity, and
   closure ownership protocol.
2. Start a fresh gateway instance as an owned child or owned in-process
   resource and obtain the runtime token through a non-durable channel. Write
   its current browser-scoped identity/route/closure record to the pre-bound
   `gateway-runtime.json`; do not pretend SWU-OEWTP-003's closed test instance is
   still live.
3. Launch the resolved Chromium with Playwright using a fresh context, one
   declared desktop viewport, no extensions, and no persisted user data.
4. Subscribe before navigation to:
   - console and page errors;
   - every request/response with normalized host/path/method/status and token
     query/cookie values redacted;
   - browser/context/page close events.
5. Open `http://127.0.0.1:<port>/?oew=1&token=<token>`.
6. Wait on semantic readiness, not an arbitrary sleep.
7. Execute and record all thirteen exact assertions:
   - trust rail visible with source run and `authority_effect: none`;
   - F1 selected at start;
   - grounding trace reaches R1 then D1;
   - D2 remains visible as conflict residue;
   - outline and table preserve selected source ref;
   - inspector shows the admitted Poker-Team path and digest;
   - receipt drawer shows pinned commit and terminal receipt;
   - no edit/accept/promote/publish/deploy action exists;
   - no unexpected console/page error;
   - every request targets the owned loopback origin;
   - teardown conditions close;
   - an unknown deep link visibly recovers to F1;
   - keyboard-only operation opens search, switches view, opens the inspector
     and receipt drawer, and dismisses/recoveries without a pointer.
8. Always capture `browser-witness.png` as review context, bind its digest, and
   never treat it as the sole assertion proof.
9. Construct a canonical receipt with all source/build/current-gateway/browser/assertion
   and log digests. Mark its claim
   `one-local-automated-poker-team-journey`; do not mark it independently
   verified.
10. In `finally`, close page/context/browser and gateway, verify port release,
    remove only the browser temp/profile and browser-scoped gateway scratch
    roots, and record absence. Never delete SWU-OEWTP-002's retained
    `dashboard-dist/` or handle. Cleanup failure makes the receipt result block.

### Failure and recovery

- Missing/invalid bootstrap token must produce HTTP 401/403 with no protected
  body. After valid bootstrap, invalid bundle identity/digest/schema must show
  the in-app fail-closed alert and no graph.
- Unknown deep link must visibly recover to F1.
- Selector ambiguity or UI copy drift blocks with screenshot/DOM evidence; do
  not weaken to a broad text search without updating the contract.
- A local bare-module `import "playwright"` failure is not a reason to add a
  dependency. The required path is the verified global absolute API entry.
- An outbound request includes any host other than the owned loopback origin,
  including redirects, favicon/CDN/fonts, telemetry, or proxying.
- Expected browser closure caused by `finally` is not an error; premature close
  is.

### Done criteria

- browser-acceptance schema covers all mandatory identities and assertions;
- positive journey passes all thirteen validation-strategy assertions;
- negative fail-closed cases prove no graph behind invalid evidence;
- console/outbound counts are zero;
- complete cleanup evidence is present;
- test exits nonzero on any missing assertion or cleanup field;
- `node --test test/browser-acceptance.test.mjs` passes.

### Execution handoff

- Owner: one bounded subagent under Task Session
- Runtime Context Builder must include the UX Plan, validation strategy,
  gateway handle, browser resolver rule, exact source paths, and receipt schema
- Expected result: standard SWU receipt plus bounded browser acceptance path
  and digest
- Closeout: exact `SWU-OEWTP-004` row in
  [CLOSEOUT-SYNC-INVENTORY.json](../../CLOSEOUT-SYNC-INVENTORY.json)
- Successor: no mutation-capable successor; make TASK-OEWTP-VERIFY review-ready
  only after both closeout receipts pass

## Completion evidence

Future result: `../results/SWU-OEWTP-004-RESULT.md`.
