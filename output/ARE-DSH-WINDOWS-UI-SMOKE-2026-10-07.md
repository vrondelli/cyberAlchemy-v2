# ARE Companion: approved disposable DSH Windows smoke test

Status: this bounded smoke passed; the complete integration plan remains incomplete.

## Scope and authorization

User response: `Yes, run DSH UI test`. The authorized action was one extracted
Companion GUI smoke connected to a disposable DSH observer, closing the app afterward.
No installer was executed, Windows settings changed, or current chat taken over.

Tested executable:
`C:\Users\vlad_\AppData\Local\Temp\are-win-prep-correlation-payload-yiuyag\are-companion.exe`.
SHA-256: `066212537c60e13eff88843d727b6fafeceaefbc53ad7fac45019ad60096d42a`.
This is the frozen preparation-correlation build, not a build of the latest
objective-checkpoint UI/native source.

## Verification

- The initial attempt stopped before GUI launch with
  `dsh-web-host.manifest:source.pin-mismatch` (1 passed, 1 failed).
- Exact mismatches were the authorized in-progress queue-remove test, owned
  preparation test, and Host graph-probe fixture. The three manifest files
  were deliberately refreshed to the `owned-objectives6` snapshot with no
  unrelated source or package pins changed. Pin refresh is not test qualification.
- Retried `test/web-host-cli.test.mjs` with both
  `ARE_TEST_WINDOWS_DSH_OBSERVATION=1` and `ARE_TEST_WINDOWS_DSH_UI_EXE` enabled:
  2 passed, 0 failed, 0 cancelled, 0 skipped; duration 179.617 seconds.
- Native Windows read the authenticated loopback observation. The extracted
  app's WebView2 test opened the dashboard from the orb and asserted both
  `dsh-host-agent-activity-visible-without-browser-control-claim` and
  `dsh-agent-thread-state-visible-with-explicit-claim-limit`.
- The observer contained one resumed idle Agent (`native_turn_state: not-started`),
  not an admitted prompt or model request. This does not qualify live model
  activity, hidden reasoning, checkpoint display, or desktop chat control.
- `test/dsh-graph-manifest.test.mjs`: 7 passed, 0 failed, 0 cancelled, 0 skipped;
  duration 181.372 seconds. This covers the current pins, installed package tree,
  disposable graph, and negative drift probes.
- Cleanup: exact-path native Windows process query succeeded and returned zero
  surviving tested Companion processes. The test observer's loopback port
  refused connection (`ECONNREFUSED`), and the disposable Host home was removed.

Commands and assertions are maintained in
[Host CLI test](../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/web-host-cli.test.mjs)
and [Windows UI probe](../implementation/agent-reasoning-engine/apps/desktop-companion/scripts/test-windows-ui.mjs).

## Repeated approved smoke: current source snapshot

A subsequent explicit `Yes, run DSH UI test` authorized one further launch of
the same extracted executable against a disposable DSH observer. With the
`owned-objectives12` source snapshot, the existing Host CLI test ran with
`ARE_TEST_WINDOWS_DSH_OBSERVATION=1` and `ARE_TEST_WINDOWS_DSH_UI_EXE` enabled:
2 passed, 0 failed, 0 cancelled, 0 skipped; duration 78.719 seconds.
The test again opened the dashboard from the floating icon and passed both
DSH Adapters and Threads assertions through the native Windows WebView2 probe.
The observation was one resumed idle Agent, not an active model turn. The app
was closed by the test; a subsequent exact-executable Windows process query
returned no surviving Companion, and the disposable DSH home was absent.
No installer ran and no Windows settings changed. The executable hash remains
the one recorded above; this does not qualify newer source-only checkpoint UI.

## Further explicitly approved smoke: owned-objectives15

The next explicit `Yes, run DSH UI test` authorized one additional launch of
the same extracted executable. The existing Host CLI test ran with
`ARE_TEST_WINDOWS_DSH_OBSERVATION=1` and `ARE_TEST_WINDOWS_DSH_UI_EXE` enabled
against the current `owned-objectives15` source snapshot: 2 passed, 0 failed,
0 cancelled, 0 skipped; duration 94.080 seconds. Its Windows WebView2 assertions
verified the orb-to-dashboard journey and both DSH Adapters and Threads displays.
The disposable observer showed one resumed idle Agent, not a model turn.
The tested executable SHA-256 remains the one recorded above; this does not
qualify newer source-only objective-checkpoint or plan-advancement display work.
The test closed the Companion and stopped both disposable Hosts. A subsequent
exact-executable native Windows process query returned zero surviving Companion
processes, and `/tmp/are-dsh-web-cli-live-yNEheB` was absent. No installer ran,
Windows settings changed, or current chat was taken over.

## Remaining open questions

- A fresh Windows build and separate native smoke are still needed for the
  latest objective-checkpoint display; this older executable cannot qualify it.
- The new owned refinement/interruption/return/replacement regression currently
  has an unresolved preparation-denied failure (focused suite 7 passed, 1 failed).
  This smoke does not resolve or conceal that independent runtime gap.
  Later source work supersedes this diagnostic: the expectation was corrected
  to use accounted requirement add/remove operations and the canonical ordering;
  ten owned-preparation tests now pass. Free-form refinement without a configured
  bounded provider remains explicitly unsupported. See the
  [continuity analysis](../implementation/agent-reasoning-engine/apps/desktop-companion/docs/DSH-OBJECTIVE-CONTINUITY-IMPLEMENTATION-ANALYSIS-2026-10-06.md#owned-transition-and-multi-prompt-dispatch-2026-10-07)
  for the separately repaired owned steering composer and native verification.
- Remaining product work is owned by the
  [whole UI plan](../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WHOLE-UI-IMPLEMENTATION-PLAN.md).
