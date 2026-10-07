# Cross-OS read-only observation — 2026-09-30

Status: development-only integration proof. TUI is discontinued. This does not
activate ARE for the current desktop task or make Windows hosted effects safe.

## Boundary

The canonical WSL gateway keeps its session-control listener on local IPC.
An explicit `--development-observation-tcp-port` may instead bind the existing
adapter, thread, and decision observation protocol to **127.0.0.1 only**. It
requires `--development-live` and `ARE_ADAPTER_OBSERVATION_TOKEN` of at least
32 bytes. The socket and TCP observation options are mutually exclusive.
Companion's existing read-only CLI bridge accepts a strict
`tcp://127.0.0.1:<port>` observation endpoint; no Rust control command or
hosted-effect path is added. Each read still requires a token and nonce and
checks its schema, freshness, size, and source. Loopback TCP has no TLS and is
not a remote-access contract: other local processes can connect, so use a
fresh private token and shut down the development listener after testing.

## Evidence

- Focused adapter/thread/decision observer tests: 30/30 pass. The added case
  reads all three snapshots from one gateway epoch, rejects wrong tokens and
  non-loopback endpoints, rejects a control-schema frame on the observation
  port, and creates no backend session. The broader gateway/Windows-IPC suite:
  150 pass, 1 platform skip, 0 fail.
- Native Windows Node 26.8.1 read the current WSL source over loopback using
  `adapter-status`, `thread-status`, and `decision-status`; all returned the
  same gateway runtime epoch. The source gateway had no client or backend, so
  the truthful view was gateway running, path not observed, zero threads, and
  zero decisions.
- A temporary local Windows stage paired the retained Companion executable
  with a fresh current-source ARE distribution (808 files; distribution digest
  `36714cd0c42b799f9c2ee95ef9d77f1a2e0bb139022660dedccd14d592ba6b25`).
  Native bundled `doctor` passed with core closure digest
  `d9dff6c6210d2d7326c8c8b1474ec14a1f320510dae03880f3b9c51dfbfca594`;
  the bundled feature probe passed. A native WebView2 journey then opened the
  orb and nonblank seven-panel dashboard and rendered the WSL gateway's
  read-only state, independent product health, and empty Threads/Decisions.
  Its development test mode also exercised skin, placement, keyboard focus,
  and source explanations. No installer was run.
- A second joined canary used the pinned WSL `codex-cli 0.155.0-alpha.16.4`
  (SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
  and a disposable, fixed-response local provider. The gateway completed one
  turn and held its authenticated loopback observer open. The same native
  Windows WebView2 journey passed with a ready adapter path, one completed
  Reasoning State row and verified frontier, two Decisions, and a working
  thread-to-decision link. The canary finished PASS after the UI run, with
  zero external model calls, the current desktop task untouched, and its
  temporary configuration and native child removed.
- A same-window recovery run then restarted the WSL gateway on the same
  loopback port. The native Windows dashboard withdrew old-epoch Threads and
  Decisions as stale/source-changed, then refreshed the recovered completed
  thread and decision records without reopening. The gateway canary passed
  durable session rejoin and same-key replay checks with zero external model
  calls; its private test configuration and backend child were removed.
- The managed WSL launcher now has an explicit Linux-only
  `--development-observation-tcp-port` option, requiring a caller-supplied
  32-byte-or-longer observer token in `ARE_ADAPTER_OBSERVATION_TOKEN` and no
  local Companion child. It started one supervised gateway and hosted client,
  verified the observation epoch before ready, and emitted the endpoint and
  transport mode but **not the observer token**. The native Windows dashboard
  passed all seven panels against that managed stack with a ready adapter
  path and no thread/decision records. Supervised stop exited zero, the
  observer port refused a new connection, and the disposable private state
  was removed. Its ready record still carries the hosted client's separate
  tokenized launch URL; this proof does not make stdout a secret-free channel.
- A separate development Windows parent now launches the WSL managed session
  through `wsl.exe`, gives it an ephemeral observer token via `WSLENV` rather
  than command-line arguments, and launches one Companion with that token in
  its child environment. The WSL-side parent strips the hosted client's
  tokenized launch URL from its forwarded ready record. In a native smoke,
  the Windows parent reported one Companion process and one WSL observation
  endpoint, while a separate isolated native WebView2 probe passed all seven
  panels against its managed gateway. The parent then sent a private stop to
  its WSL supervisor, exited zero, and the observer port refused new reads.
  Both runs' disposable private state directories were removed; the retained
  local Windows resource stage was not installed. The test-only timer and
  token override require `ARE_INTEGRATION_TEST_MODE=1`.
- A fresh unsigned NSIS installer was built at
  `D:\are-companion-cross-os-development-20260930.exe` (29,595,291 bytes;
  SHA-256 `1848c036e2fbc9ec67cf7aaf9e6602f5a0cf790200f4c63a1191bbc0bb10d3ba`).
  Its retained Windows release stage contains 809 distribution files (digest
  `bf3ef36e8d9aa72a2932a59c7deabacddff4a98bc1b15cbc4190a0fc93325048`,
  core closure digest
  `0bcf06c476b8c13b0ae2146ad9129be1a24c22803ec792e375c0942e31d05ef0`)
  and the packaged `cross-os-development/run.mjs` launcher. The staged native
  feature probe and default orb/dashboard journey passed. Launching that
  packaged script with a disposable managed WSL state then started one
  Companion and reported one loopback observation endpoint. A separate native
  WebView2 journey passed the seven-panel dashboard against its ready backend:
  product health stayed distinct, Adapters showed `Backend path ready`, and
  Threads/Decisions truthfully showed no records. The staged executable was
  run for testing. The packaged parent then stopped at its test timer and
  exited zero, the observer port refused new connections, and the two exact
  disposable WSL state directories from the packaged checks were removed.
  The installer was **not installed**. This does not verify the installed
  package's lifecycle.
- The new native Windows
  `scripts/test-cross-os-parent-loss-windows.mjs` canary launched that staged
  development parent against an isolated WSL state, verified its Companion
  and `wsl.exe` children plus the live observer, then terminated only the
  Windows parent without cleanup. On this host, the observer closed and both
  children exited. Stale socket/lock pathnames remained in the private state;
  restarting the packaged launcher with the **same state and port** still
  reached ready, and a separate native WebView2 seven-panel journey rendered
  the ready backend. The restarted parent stopped normally, the port closed,
  and the exact disposable state was removed. This is one parent-process-loss
  and immediate-restart sample, not WSL crash, power-loss, persistent-service,
  or installed-package recovery proof. No model turn or current-task handover
  occurred.
- Extending the canary to perform the same-state restart automatically exposed
  a development-launcher shutdown bug: after an early `stop`, its test-only
  120-second timer kept the Windows parent alive despite a closed observer.
  The source launcher now clears that timer in its shutdown path. A fresh
  native-Windows canary against the corrected source passed abrupt parent
  loss, closure of both children and observer, same-state restart, and clean
  stop. The earlier installer still contains the pre-fix test timer until it
  is rebuilt; normal no-timer operation is unaffected. The two private
  follow-up states were removed after the processes stopped.
- The corrected launcher is now bound into a **new** unsigned NSIS installer,
  `D:\are-companion-cross-os-recovery-20260930.exe` (29,598,471 bytes;
  SHA-256 `13164c33eba46369feda27a9dd81be6f689571a0285cae730f34664983ece0fd`).
  The retained stage is `D:\acw-LQ7K1O`; its packaged launcher hash matches
  current source (`2fdc18e88c46a0d9ae9d009b5c649672ebc46e0d2dff75590600806a6357184a`).
  The bundled feature probe passed 13 checks. The staged executable passed
  native unconfigured and connected-fixture seven-panel journeys; the latter
  rendered active Reasoning State, a thread-specific Decision link, and
  gateway-loss withdrawal without claiming desktop-task control. The
  **packaged launcher** passed
  the automated abrupt-parent-loss → observer/child shutdown → same-state
  restart → normal-stop canary. The observer refused new connections after
  stop; its exact private test state was removed. No model turn, current-task
  handover, installer installation, signing, or release occurred.
- The new installer's **actual NSIS payload** was extracted without running
  the installer into `D:\are-nsis-check-gUFPMS\payload`. The archive reported
  818 files; its 809-file ARE distribution compared byte-for-byte with the
  retained release stage. The bundled Node and development launcher hashes
  also matched that stage. NSIS changed only three bytes in the extracted
  Companion executable relative to the staged executable, and the extracted
  executable passed native Windows UI journeys. No TUI path was present in
  the extracted payload.
- Running the extracted payload, not the stage, passed all 13 bundled feature
  checks. Its native default WebView2 journey passed the floating orb and
  nonblank seven-panel dashboard; its connected fixture journey passed
  paged Threads, observed Reasoning State, a thread-specific Decision link,
  and withdrawal of stale gateway data. The first extracted-payload
  parent-loss invocation used an incorrect supervisor path and exited before
  ready with an empty private state. With the correct supervisor entry, the
  extracted launcher passed abrupt Windows-parent loss, owned-child and
  observer shutdown, same-state restart, and clean stop. The observer port
  refused a new connection afterward; the exact private WSL test state was
  removed. These checks still do not execute the NSIS installer or prove
  current desktop-task control.
- A separate native Windows `--package-root` managed-session probe then ran
  the extracted Companion, Node, ARE runtime, and manager with a disposable
  pinned Codex backend. Its first two runs failed a test assertion: opening
  Adapters started a new asynchronous read, but the test accepted the previous
  gateway fields while Overview correctly still said `Reading`. The test now
  waits for the gateway fields **and** Overview claim/detail to agree. Against
  the unchanged extracted payload, both the default paused-turn mode and the
  guarded Plan-input candidate passed. Each rendered the floating orb and
  seven-panel dashboard with a running gateway, ready backend, connected
  client, unverified host-task control, and supervised child shutdown. The
  guarded run showed the parent-heartbeat and Plan-question launch declaration;
  neither run made a private or external model call. Their temporary Windows
  state was cleaned by the probe. This verifies package-adjacent resources,
  not NSIS installation or a live desktop-task handover.
- The Windows development parent now checks the named WSL supervisor,
  repository root, cwd, Codex binary, private state directory, and config
  through a bounded WSL Node file-type probe **before** generating an observer
  token or starting the gateway and Companion. It reports allowlisted reason
  codes without echoing paths or child output. Native negative canaries for a
  missing supervisor and missing state directory passed with no ready record
  or observer; the source parent-loss/same-state-restart canary still passed.
  The exact source was copied into a fresh unsigned NSIS installer at
  `D:\are-companion-cross-os-preflight-20260930.exe` (29,600,075 bytes;
  SHA-256 `8cbb0b9f112a70ed87d205ba68c822707a447d5d8a9b6e2d50decc920c36ae2d`).
  Its extracted payload at `D:\are-nsis-preflight-tQRmot\payload` contains
  818 files; its packaged launcher hash
  `728e8d4f39a247231712bf082a33e0d2916924b5984c4a4cc7be485cb682f2ff`
  matches source. Against these extracted bytes, the negative preflight and
  positive parent-loss/restart canaries, all 13 bundled feature checks, and
  the default and connected-fixture seven-panel native UI journeys passed.
  The connected fixture showed paged backend threads, Reasoning State, a
  thread-specific Decision link, and gateway-loss withdrawal without a
  current-chat-control claim. The observer refused new
  connections after stop and the exact disposable WSL test state was removed.
  No external model call, installation, release, or current-task handover
  occurred. The retained build stage is `D:\acw-ADX8wO`.
- The same newest extracted payload passed a separate package-only native
  Windows managed-session smoke: its adjacent ARE runtime and Node started a
  disposable gateway, hosted client, and Companion; the orb and seven-panel
  dashboard rendered a running gateway, ready backend, connected client, and
  paused model-entry posture. Unexpected Companion exit supervised the other
  children to stop. The probe exited zero after private-state cleanup with
  zero private or external model calls and no current-task control. The
  guarded Plan-input package-only mode was verified on the preceding payload,
  not this newest one.

The initial UI attempt using the WSL UNC source directly timed out on the
product diagnostic. A local Windows resource stage removed that file-access
latency and passed; the UNC timeout remains evidence against using a UNC
runtime path as a deployment strategy.
The first two cross-OS same-window rehearsals timed out in the test's stdin
coordinator despite a successful gateway restart. A development-only signal
file option avoided WSL-to-Windows stdin forwarding; the UI recovery itself
then passed. This is not an app feature or deployment channel.
The first packaged managed-stack UI probe used the test's idle-gateway
expectation against a running backend and timed out waiting for `Path observed`;
the corrected ready-backend probe passed. That failure was a test invocation
mismatch, not a blank-window regression.

## Claim ceiling and next work

A source follow-up binds the Windows parent to the WSL supervisor's explicit
read-only launch posture: unverified model entry, disabled hosted effects,
disabled model-wire guard, disabled guarded input, and no managed gateway turn
pause declaration. The WSL supervisor refuses a managed ready record that
does not match this posture, and the Windows parent refuses a mismatched
supervisor record before launching Companion. The parent also removes inherited
managed-turn and guarded-input declarations, including mixed-case Windows
spellings, from Companion's environment. A native parent-loss canary then
exposed a separate ownership defect: launching the Tauri executable with an
adjacent native orb left an unsupervised orb. The parent now selects the
bundled native orb, waits for its ready marker, and supervises that process;
the revised canary inspects the selected child. Focused launch-boundary tests
passed 3/3 on Linux and native Windows Node. The native Windows canary passed
abrupt parent loss, observer and child closure, same-state restart, and clean
stop with zero external model calls. Its first invocation used the wrong
profile root and stopped before ready; the next exposed the orb defect, after
which the exact orphaned test process was identified and stopped.

The corrected source is in the unsigned NSIS candidate
`D:\are-companion-cross-os-binding-20260930.exe` (33,760,168 bytes; SHA-256
`671f04361d6968a103d52baab2bc2e0a67443785b4d2bac82356ccd0ba626dd8`).
The retained build stage is `D:\acw-jgRptL` (813 distribution files, core
closure `15b541ec18affc95b2f0dcd99a02951d8d2d03d4c4635029b8cd88b59292d680`).
NSIS archive integrity passed and its 824-file payload was extracted without
installation to `D:\are-nsis-binding-oZTaeL`. The extracted Windows launcher,
launch-boundary module, WSL supervisor, and native orb match the staged/current
source or native-orb build hashes. Its bundled feature probe passed 13 checks;
its default native WebView2 journey passed 36 checks across the floating orb,
nonblank seven-panel dashboard, Evolution registry, appearance, keyboard focus,
and independent source states. A separate connected-fixture WebView2 journey
passed with an active Reasoning State row in the first Threads viewport, its
thread-specific Decision link and return focus, plus withdrawal of live claims
on gateway loss; this fixture is not this desktop task. The **extracted**
launcher and WSL supervisor then passed the same parent-loss/restart canary
against disposable private state, again with zero external model calls and no
current-task control. The
same extracted launcher then ran beside a separate native WebView2 probe:
all seven panels rendered against its live WSL managed gateway, Adapters showed
`Backend path ready`, and Threads/Decisions truthfully showed no records.
The first joined invocation was refused before launch because WSL did not
forward the test-mode environment variable; native Windows command execution
then supplied that variable explicitly. The joined launcher stopped at its
bounded test timer with exit code zero, and its observer port and native orb
closed. The three exact disposable WSL states and the temporary extractor were
removed;
the installer, build stage, and extracted payload remain for review. This is
packaged development evidence, not an installed-app, live-turn, or activation
proof.

The dashboard source now refreshes only the visible observation destination on
its existing ten-second timer (Overview/Adapters, Threads, Decisions, Evolution,
or all bounded sources in Evidence). Hidden windows do not poll; inactive
destinations still expire to last-seen state. The focused dashboard suite passed
48/48, and the network-isolated Chromium journey passed, including an inactive
Evolution expiry and a subsequent visible Evolution timer refresh. A fresh
unsigned installer, `D:\are-companion-visible-poll-20260930.exe` (29,595,043
bytes; SHA-256 `f78be9e7f8eca0458b1e66f1a7f4e2e4ca25cba043007de699adef10b`),
retains stage `D:\acw-BJgTti`; staged `ui/app.js` matches source SHA-256
`63410c97bf034c084e708c923d143597f41a43d3dc7148ad8397914d1658bd8c`.
The actual NSIS archive extracted with 7-Zip integrity success to
`D:\are-nsis-visible-poll-RKMQBA\payload` (818 files). Its bundled launcher
matches the stage, and the extracted payload passed all 13 Windows feature
checks plus native default and connected-fixture seven-panel WebView2 journeys.
The connected fixture rendered paged Reasoning State and the exact
thread-to-Decision link without claiming this desktop task. The timed visible
refresh itself was exercised in Chromium against source, not yet in native
WebView2 or an installed application. Product `doctor` is not auto-polled by
this change and can still become stale until the user requests another
diagnostic.

The dashboard now identifies the observer transport independently of backend
readiness. The Tauri adapter snapshot derives `local-ipc` or
`loopback-tcp-development` from its configured read endpoint; Adapters renders
that source-derived posture and Overview names the development-only, read-only
loopback mode without implying an installed integration or control of this
desktop task. A mismatched transport value is rejected; older snapshots show
`Not reported`. The dashboard suite passed 48/48 and the offline Rust bridge
check passed. The standalone Linux Chromium script could not start because
`playwright-core` is not installed in this checkout; no browser verdict is
claimed from that script. The new unsigned Windows build is
`D:\are-companion-transport-20261001.exe` (SHA-256
`f64f4265fee9714b64698472584e9b4a89dad3cd7ee7172d79ab126aae6ceadf`),
with retained stage `D:\acw-M1l8hT`. The staged script matches current source
byte-for-byte, its packaged feature probe passed 13 checks, and the staged
WebView2 executable passed the connected-fixture seven-panel journey.
Its Adapters screenshot at `D:\are-transport-adapters-20261001.png` shows the
new `Local IPC` source label and read-only task-control limit. The native
Windows journey now asserts the transport label and claim limit on both
Overview and Adapters; the local-IPC connected fixture passed again with that
assertion. The **same staged executable** then read a live, authenticated WSL
loopback observer from an isolated no-model Codex home. Its 39-check native
WebView2 journey passed, including the new transport assertion, all seven
destinations, ready backend path, honest zero-record Threads/Decisions, and
unverified desktop-task control. The screenshot at
`D:\are-transport-live-tcp-20261001.png` shows `Local loopback TCP ·
development only` beside the read-only limit. The first invocation failed
before UI launch because WSL did not forward the test token into native
Windows Node; `WSLENV` with Windows export fixed the test invocation. Both
disposable WSL supervisors stopped with exit code zero, their observer ports
refused connections afterward, and their exact private state directories
were moved to system trash. No turn or model call was made. The exact unsigned
NSIS candidate then passed 7-Zip integrity (`Everything is Ok`, 824 files) and
was extracted without installation to `D:\are-nsis-transport-BO44t5`. Its
ARE distribution, Node, cross-OS launcher, and native orb match the build
stage byte-for-byte; NSIS changed only three Tauri bundle-metadata bytes in
the executable. The extracted feature probe passed 13 checks, the default
native WebView2 journey passed 36 checks, and the connected-fixture journey
passed 47 checks including transport provenance, active Reasoning State, and
the thread-specific Decision link. No TUI path was present in the extracted
payload. The installer is still unsigned and uninstalled; the extracted
layout is not installed-app lifecycle, reboot, or activation proof for this
chat.

An extracted-payload parent-loss canary then found a readiness race: after
the same-state restart, the WSL manager emitted its ready record while the
Windows-side observer connection still refused traffic. Its first run failed
with `Recovered observer was not live`; both canary-owned children had stopped
and no observer remained afterward. The Windows development parent now waits
for its **own authenticated `adapter-status` read** through the packaged Node
and ARE CLI before it starts Companion or emits Windows ready. That read must
report the same selected backend, a running gateway, a ready same-session
path, `authority_effect: none`, and unverified desktop-task control. It has a
bounded 20-second deadline and fails closed on a binding mismatch or missing
reachability. Focused boundary tests passed 4/4, and the source launcher
paired with the extracted executable/resources passed the previously failing
abrupt-parent-loss, observer/child closure, same-state restart, and clean-stop
canary with zero model calls. This validates source plus extracted resources;
the older NSIS payload does **not** contain the launcher fix.

The corrected launcher is now bound into a **new** unsigned NSIS candidate at
`D:\are-companion-observer-ready-20261001.exe` (SHA-256
`969847e7541fd817d46537a380688312fa675731b0166f0dd33a74696269884f`),
retained stage `D:\acw-auhIxR`. The staged launcher matches source SHA-256
`013ccb8fec870234cf68986166d6d4b57a398017d646234395d24af59ce6c9f2`.
NSIS integrity reported `Everything is Ok` with 824 files; its payload was
extracted without installation to `D:\are-nsis-observer-ready-xJpX7H`.
The extracted launcher, boundary module, ARE distribution, Node, and native
orb match their staged sources byte-for-byte. NSIS changed only three
bundle-metadata bytes in the executable. The extracted feature probe passed
13 checks; native default and connected-fixture WebView2 journeys passed
36 and 47 checks respectively, including transport provenance, active
Reasoning State, and the thread-specific Decision link. The **extracted
launcher** then passed the same abrupt Windows-parent-loss, observer/child
shutdown, same-state restart, and clean-stop canary against an isolated
no-model Codex home, with zero external model calls and no current-task
control. The observer port refused connections after stop; the exact private
state was moved to system trash. No TUI path is present. The installer has
not been run, signed, released, or activated for this chat. A later unrelated
checkout-level product closure digest differs from this tested build snapshot;
the retained candidate is evidence for its exact packaged bytes, not a claim
that the entire mutable checkout remained frozen.

The [cross-OS live-gateway runner](../scripts/test-cross-os-live-gateway.mjs)
then exercised that **exact extracted executable** and its bundled Windows
Node against a disposable WSL `codex-cli 0.155.0-alpha.16.4` turn. The WSL
canary used a fixed loopback Responses provider, held the turn at hosted user
input, and exposed an authenticated read-only loopback observer. Native
WebView2 passed 44 checks while the turn was active: one backend thread had
no completed frontier, a retained start receipt and linked Decisions were
visible, and Adapters identified the development-only loopback transport.
After the canary answered its fixture prompt, the same extracted Companion
passed 43 completed-phase checks, including the verified Reasoning State
frontier and thread-specific Decision link. The runner verified one endpoint
and token across those phases, one completed backend thread, and two decision
observations. Three consecutive invocations returned `PASS` with zero external
model calls and `current_desktop_task_touched: false`; the later runs exited
normally after a test-runner timer cleanup fix. The canary and UI harness were
current checkout source, while the executable and Windows Node were extracted
package bytes. This is a disposable managed-turn observation proof, not a
claim that the current chat was handed over, that Windows can control the WSL
gateway, or that the unsigned installer was installed. TUI was not used.

This proves a local cross-OS observation path for a disposable completed model
turn, not gateway session control from Windows, current-chat ownership, full host-tool interception,
Windows sandbox sufficiency, installed-package lifecycle, or a product
resource-budget pass. The current Windows build remains unsigned and
uninstalled. The packaged supervisor is development-only, not an
installed lifecycle or proof of abrupt loss/reboot recovery. Portable
localhost-forwarding evidence and an independently reviewed
local-transport threat model are still needed before packaging this as a
supported cross-OS mode.

## Joined adapter and live Evolution UI check — 2026-10-03

The current source `test-cross-os-live-gateway.mjs` accepts an optional
`--evolution-live-root` and checks a disposable WSL gateway and the selected
existing Evolution ledger in one isolated native Windows Companion session.
The runner waits for its own authenticated Windows-side `adapter-status` read
before each UI phase, matching the development parent's reachability gate.
It uses the staged `D:\acw\acw-xgKUfX` executable and bundled Windows Node,
not an installed Companion or this desktop task. The test harness is newer
checkout source, so this is not a current-source package qualification.

The final run passed 51 active-turn UI checks, 50 completed-turn UI checks,
and eight joined adapter/Evolution checks. The joined screen showed a ready
read-only loopback adapter with desktop-task control still unverified, plus
five verified cycles, 33 durable commits, and five admitted phase summaries.
The observer confirmed that the Evolution ledger projection digest did not
change across the UI read. The pinned Codex fixture yielded one backend thread,
two decision observations, zero external model calls, and
`current_desktop_task_touched: false`. Two earlier runs before the additional
Windows-side preflight failed at Overview adapter readiness and empty native
UI output; their exact host-level causes were not isolated. Four later joined
runs passed, including two with the preflight. These bounded results do not
establish boot/VPN/firewall reliability, an installed lifecycle, or exclusive
control of a Codex desktop conversation. No past build or test evidence was
deleted during this check.

## Open Questions

- How should the development parent reattach or rotate its token after a
  Windows or WSL crash without storing credentials in shared files?
- Does Windows-to-WSL localhost forwarding remain available after reboot,
  VPN changes, firewall changes, or WSL networking-mode changes?
- How should a future production transport authenticate the peer and limit
  same-user processes while preserving a single canonical gateway?
