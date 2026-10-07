# Windows current-guard development package — 2026-10-01

Status: unsigned, installer-extracted but uninstalled development candidate.
Authority effect: none.
The TUI is discontinued and is not a product interface, fallback, or parity
target. This package contains the native floating orb and WebView2 dashboard.

## Exact build

- Installer: `D:\are-win-focus-YDTVzk\ARE_Companion_current_guard_20261001_x64-setup.exe`;
  33,760,142 bytes; SHA-256
  `1acf6115769ffea7aaed567696e84bd6cb54979a37bd1b416f4fba3d228be785`.
- Retained build stage: `D:\are-win-focus-YDTVzk\acw-ocSf3q`.
  The builder reported 813 closure files, distribution digest
  `2ea8ab93eb9e8f4a8e35af7cedfd6fe05ff9f31a7e9472b5e6d0d2da58a9bdfd`,
  and Core digest
  `cb7e2cfffc733838b9af6d586976b3fb854ae4a529261e5d7f3cf9adcb597a66`.
  Bundle mode was `development-evolution-observer-and-unregistered-hook-relay`;
  the native orb was a bundled candidate, not an activated integration.
- Staged dashboard executable SHA-256:
  `b7abe1a508ed49b9f2b4426a86527035ea28ab1ecf7256208db5c2e6022fadd3`.
  Staged orb executable SHA-256:
  `d8938eebe6ac72da59d3ae27b5ae5e7af68a28bafbba57d5f90392520eb3d70a`.
- The NSIS archive passed an independent 7-Zip 26.00 integrity test:
  `Everything is Ok`, 824 files. Extraction to
  `D:\are-win-focus-YDTVzk\extract-current-i0pVHDBl` also returned
  `Everything is Ok` for 824 files. 7-Zip came from a temporary extraction of
  Ubuntu's `7zip_26.00+dfsg-1_amd64.deb`; it was not installed on the host.
- The **installer-extracted** dashboard executable SHA-256 is
  `d04b95973e6961eb224de371a3dbf8b18d7ce76cc6a414e73e1c35780994e521`;
  this differs from the stage executable, so the extracted executable was
  tested separately. The extracted orb SHA-256 is
  `d8938eebe6ac72da59d3ae27b5ae5e7af68a28bafbba57d5f90392520eb3d70a`.
  The extracted `model-wire-guard.mjs` SHA-256 is
  `083cf77af29545fd5e77d7aa880d522c0c4a18252eeed173080a301f249044ab`
  and its bytes match the current checkout. A search of extracted ARE resources
  found no `cyberalchemy-tui`, `terminal-ui`, or `tui` path component.

## Validation

- The staged Windows Node 26.8.1 passed all 13 model-wire-guard tests,
  including the strict UTF-8 request boundary.
- The staged Windows feature probe passed 13 checks: bundled Node, cross-OS
  launch resources, product health, direct route/context, bounded plan
  context, backend thread and decision observation, Evolution registry, and
  native SQLite write/reopen/replay. The product reported `0.10.0-rc.1`.
- The dashboard source suite passed 49 checks under both Linux Node and the
  staged Windows Node. The staged executable's dashboard-only WebView2 smoke
  rendered all seven panels with nonblank body text.
- The staged native orb passed the Windows launch/focus/reopen and
  duplicate-window-prevention journey. One ten-second idle observation showed
  3,289,088 private bytes and zero additional CPU seconds; this is a short
  observation, not a sustained resource-budget verdict.
- The staged executable passed the connected-gateway WebView2 fixture journey:
  all seven panels, 40-thread pagination, fresh-snapshot recovery, per-thread
  reasoning-state observation and decision navigation, diagnostics, Evolution
  candidate posture, appearance persistence, keyboard/focus, high contrast,
  reduced motion, and gateway-loss downgrade. The fixture is isolated from
  this live desktop task.
- The installer-extracted Windows Node 26.8.1 independently passed the same
  13 model-wire-guard tests and the 13-check ARE feature probe, including
  direct route/context and Evolution SQLite reopen/replay. The
  installer-extracted dashboard executable passed both dashboard-only and
  connected-gateway WebView2 journeys. The latter again observed the
  40-thread pages, per-thread reasoning state, decision navigation, Evolution,
  diagnostics, appearance, accessibility preferences, and gateway-loss
  downgrade. The nonblank dashboard body had 1,344 visible-text characters.
- The installer-extracted native orb and dashboard passed bundled launch,
  84×84 orb window, repeated-launch duplicate prevention, dashboard
  open/focus/reopen, and owned-dashboard exit. Its ten-second idle sample
  showed 3,268,608 private bytes and zero additional CPU seconds. This is
  still a short observation, not a sustained resource-budget verdict.
- A hash-verified disposable copy of the Codex app's native
  `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
  drove two package-only managed-session smokes. The baseline had gateway,
  backend, hosted client, native orb, and seven-panel dashboard ready; model
  ingress stayed paused. The guarded Plan candidate showed a parent-heartbeat
  model-wire guard and `unelevated` Windows sandbox; the second guarded run
  probed all active backend sandboxes and reported
  `passed-all-active-backends`. Each run stopped its owned processes after an
  isolated Companion exit. Both used package-adjacent resources and private
  state, made zero model calls, were uninstalled, and reported
  `current_desktop_task_control: false`.
- Two further canaries used the **installer-extracted** Node and adjacent ARE
  package with that pinned native Codex binary and a fixed loopback provider.
  `managed-wire-guard-turn` passed one guarded hosted turn:
  `BOUND_AND_FILTERED_ONE_TURN`, an empty model-facing tool catalog, three
  local provider requests, and temporary configuration removal.
  `managed-wire-guard-user-input-turn` passed a Plan-mode user-input turn:
  `BOUND_AND_BROKERED_PLAN_USER_INPUT_ONE_TURN`, an authenticated fixture
  answer returned to the model, only `request_user_input` in the model-facing
  tool catalog, four local provider requests, and temporary configuration
  removal. Both reported no external model calls and no touch of this desktop
  task. These are real backend turns against a fixed local provider, not turns
  in the Companion WebView or a live provider compatibility verdict.
- The opt-in `--fixture-turn` mode added to
  `scripts/test-managed-session-windows.mjs` joined those boundaries in one
  package-only run: the ARE-owned hosted client created an isolated thread and
  completed one text-only turn through the guard against a fixed loopback
  provider; the **same gateway's** read-only Companion Threads panel observed
  one backend thread and its verified completion frontier. A run with the
  Windows active-backend sandbox probe also passed. Each joined run made one
  local provider request, zero external calls, and no current-task mutation;
  the manager stopped its owned processes after Companion exit. The original
  no-turn mode was rerun afterward and still passed with paused ingress and
  zero provider requests. An initial unrouteable fixture prompt was blocked
  before model entry by ARE preflight, then replaced with the existing
  routeable architecture-understanding fixture prompt.
- The same joined package-only mode now also passes with
  `--guarded-plan-input --verify-windows-sandbox
  --probe-windows-hosted-effects --fixture-turn`. A fixed local provider
  requested one `request_user_input` choice. The authenticated ARE-owned
  hosted-client endpoint accepted the fixture answer and returned it to the
  model; the second local provider response completed the Plan turn. The
  read-only Companion observed the same isolated backend thread and verified
  completion frontier. The run reported two local provider requests, zero
  external calls, `passed-all-active-backends`, supervised cleanup, and
  `current_desktop_task_control: false`. This covers authenticated hosted
  input routing, not a physical click in the hosted browser UI.
- An additional `--browser-fixture-turn` run used isolated native headless
  Edge, the **rendered** ARE-owned hosted client, the same installer-extracted
  runtime, and the read-only Companion. The browser created the thread, sent
  the routeable prompt, displayed the Plan question, selected its choice,
  submitted the answer, and rendered the completed model response. The
  Companion again observed one backend thread and its verified completion
  frontier. The run reported two fixed local provider requests, zero external
  calls, `passed-all-active-backends`, and supervised session cleanup. Edge
  opened a blank isolated profile and received the bearer URL only over its
  local DevTools connection, not in a command-line argument or test log; a
  follow-up process query found no test-owned Edge survivor. This is browser
  interaction in a disposable fixture, not an installed or live-provider run.
- An opt-in `--browser-reload-during-plan` extension to that exact browser
  fixture passed after reloading Edge while the Plan question was pending.
  The reloaded client restored the same thread and exactly one matching
  question, submitted the choice, rendered the completed response, and left
  the read-only Companion on the same verified completion frontier. The run
  made two fixed local provider requests and zero external calls. Its first
  attempt reached shutdown but failed a 300 ms direct-child exit assertion;
  the test now waits up to five seconds for owned children to exit, and the
  rerun passed. A subsequent text-only joined-turn regression also passed with
  one fixed local provider request. A process query after both runs found no
  test-owned Node, Codex, Companion, orb, or Edge survivors. This proves
  same-tab reload recovery in disposable state, not installed-app recovery or
  live task handover.
- The opt-in `--browser-restart-during-plan` fixture also passed. It killed
  the test-owned Edge process while the Plan question was pending, launched a
  new Edge process with the same isolated profile, and navigated to the bearer
  URL through DevTools. The fresh process recovered the same thread and
  exactly one pending question; a rendered choice then completed the turn.
  The fixed local provider received two requests, and the Companion observed
  the same verified frontier. This tests browser-process restart while the
  ARE-managed gateway remains alive. It does not test gateway, installer, or
  current Codex desktop task recovery.
- The installer-extracted `native-user-input-canary.mjs` passed on Windows
  with `--guarded-user-input --interrupted-turn-recovery` and the pinned
  native Codex binary. It observed an unanswered Plan request, terminated its
  own backend, recreated the gateway in the canary process, and reconciled the
  exact accepted turn as `interrupted` from host history. Same-key replay did
  not redispatch the provider; an unsafe next turn was blocked until history
  reconciliation, then one new turn completed. The gateway epoch rotated and
  the read-only thread projection showed `recovery-terminal` without a false
  completion frontier. Four fixed loopback provider requests, zero external
  calls, and temporary-configuration cleanup were reported. This is gateway
  recreation inside one canary process, not a hard process crash.
- The installer-extracted two-phase
  `native-gateway-hard-crash-recovery.mjs --active-turn` canary also passed on
  Windows. It killed its own gateway process during pending Plan input, then
  started a fresh process and backend, verified one exact host-history receipt
  with terminal status `interrupted`, preserved the prior completion frontier,
  and completed a new user turn. It reported three loopback provider requests
  before the crash and one after recovery, zero external calls, no current
  desktop-task touch, and temporary-state removal. A process query found no
  test-owned Node, Codex, Companion, orb, or Edge survivor. This is a
  package-only runtime recovery check; the Companion was not joined to the
  hard-crash run, and the installer remains uninstalled.
- The checkout's `test-windows-live-gateway.mjs --interrupted-turn-recovery`
  orchestration passed with the installer-extracted Companion executable,
  bundled Windows Node, and pinned native Codex binary. The runner itself is
  not in the extracted package; its native canary and WebView2 UI-test scripts
  matched the extracted copies byte-for-byte. The Companion displayed one
  completed thread frontier and two decisions before gateway recreation, then
  showed the same thread as an interrupted-turn recovery with three restored
  decisions afterward. Both WebView2 passes rendered the orb, nonblank
  dashboard, thread reasoning state, decision links, and Evolution candidate
  posture. The run reported zero external calls and no current-desktop-task
  touch. This joins the UI to graceful gateway recreation, not to the
  two-process hard-crash canary or to one continuously open Companion window.
- A new `--same-window-interrupted-turn-recovery` path in the checkout's
  Windows live-gateway/UI harness also passed against the extracted Companion
  and bundled Node. One dashboard window remained open while the gateway was
  recreated: stale thread and decision observations were withdrawn under the
  new epoch, then the same window showed the exact `interrupted` host-history
  recovery state and restored decision observations. It reported one backend
  thread, two decisions before recreation, three afterward, zero external
  calls, and no current-desktop-task touch. The pre-existing completed-turn
  same-window path passed again as a regression. These new harness changes
  are in checkout source and are not bytes in the already-built installer;
  the tested UI executable and runtime remain the installer-extracted payload.
- The checkout's managed-session Windows smoke now has an opt-in
  `--crash-gateway` mode. Against the installer-extracted runtime, both the
  paused baseline and guarded Plan startup passed: killing the exact
  manager-owned gateway process caused the supervisor to report gateway stop,
  stop the hosted client and Companion, and reap all recorded direct and
  gateway-owned children. The guarded run included the parent-heartbeat
  model-wire guard, `unelevated` sandbox and all-active-backend sandbox probe.
  Each run made zero model calls and reported no current-desktop-task control;
  a follow-up process query found no test-owned survivor. The ordinary
  Companion-exit smoke passed again after the harness change. The managed contract
  is fail-closed teardown on gateway death, not keeping that Companion window
  alive through a hard crash. These smokes alone do not prove relaunch; a later
  [exact-package completed-turn relaunch canary](WINDOWS-UI-POSTURE-PACKAGE-2026-10-01.md)
  covers that narrower case with a different installer hash.

## Claim ceiling and next gates

NSIS completed, the exact archive passed an independent integrity test, and
its extracted payload passed the checks above. The installer has **not been
installed**, so this does not prove installed-app setup, upgrade/rollback
behavior, or normal-desktop lifecycle. The older
[native-orb package](WINDOWS-NATIVE-ORB-PACKAGE-2026-10-01.md) has different
hashes and must not be conflated with this current-guard build.

The gateway's connected fixture is not proof that this chat is ARE-managed.
The guarded Plan **UI smoke** declared turn execution but dispatched no model
turn; separate fixed-provider canaries and joined package-only runs now
exercise guarded backend and Plan user-input turns, including a rendered
browser choice. Browser automation against a fixed provider does not prove
live-provider compatibility, human acceptance, in-flight turn recovery after
a hard gateway process crash, or complete hosted-effect enforcement. The Windows
hosted-command output-bound gate is distinct from the sandbox probe and remains
unresolved.
For the exact current Codex desktop task, read-only target discovery found no
supported exclusive desktop writer release, account binding, and complete
ingress handover. No attempt was made to resume, intercept, or mutate this
task through a second writer. The
[session-control contract](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md)
remains the authority boundary.

## Open Questions

- Can a supported host boundary deliver exclusive handover and complete
  message, approval, and event coverage for this already-running task?
- Will installed-app tests reproduce these extracted-payload results for this
  exact hash, including setup, cleanup, and rollback?
- A later package proves one completed-turn same-state managed relaunch. Can an
  in-flight turn at hard gateway death be recovered or conservatively held as
  unknown without replaying model or hosted effects? This package's hard-crash
  canary and same-window graceful-recreation UI test do not cover that case.
- What numerical and duration-based resource budget should govern the orb
  and dashboard on both Windows and Linux?
