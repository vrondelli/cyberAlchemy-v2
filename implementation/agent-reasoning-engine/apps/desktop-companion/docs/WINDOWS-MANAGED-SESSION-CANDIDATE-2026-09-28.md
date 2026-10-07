# Windows managed-session candidate — 2026-09-28

Status: unsigned, uninstalled development evidence. TUI is discontinued and
was not used. These checks did not connect to or transfer the current Codex
desktop task, and they do not establish release readiness.

## Package and native UI

The current Companion source was built on native Windows with Node 26.8.1 as
`dist/ARE_Companion_0.1.0_x64-setup-managed-session-20260928.exe` (SHA-256
`b72c8639bc293ca55c8f09340d7c3745c9faebba46cb6e475ef0c4b0845c77ea`,
29,471,957 bytes). The builder emitted a successful package report; its
PowerShell wrapper needed interruption after the artifact and staged binary
were verified, so that wrapper is not counted as a clean exit. The installer
was **not** run. The staged executable remained under the builder's temporary
directory for native tests.

The staged WebView2 UI source test passed 36 named checks: floating orb,
nonblank dashboard, seven panels, Evolution's honest unconfigured state,
Evidence and Appearance, keyboard navigation, skin and saved-corner behavior.
A separate connected-gateway fixture used the installed
`codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
and passed its named UI checks. It showed a live Windows named-pipe adapter,
gateway-thread reasoning frontier, linked Decisions, and independent source
postures. The fixture reported one thread, two decisions, zero external model
calls, and no current desktop-task touch. This is an isolated gateway fixture,
not the managed launcher below.

## Native managed launcher

`scripts/test-managed-session-windows.mjs` invoked the current-source
`are-managed-session.mjs` on native Windows with a fresh private temporary
state directory, isolated Codex home, disabled plugin features, and an unused
loopback no-model provider. It launched the same staged Companion as a
supervised child. The launcher reported a ready gateway, authenticated hosted
client and Companion; the hosted client's `/api/state` returned ready. The
test then terminated only the exact staged Companion child, observed a
`companion` managed-stop record and manager exit, and verified the manager's
direct children were gone. Its final result was
`are.managed-session-windows-ui-smoke/v1`, exit 0, zero model calls and no
installation. No thread or turn was started in this startup-only run.

A joined follow-up used a test-only, random loopback WebView2 debugger port
and an isolated WebView2 profile to inspect **that exact managed Companion
child**. Its floating orb rendered, clicking it opened a nonblank dashboard
with all seven panels, and the Adapters page read the managed gateway as
`running`, backend as `ready`, and client link as `connected`. Desktop-task
control remained `unverified`. The native smoke exited 0 after supervising
the exact Companion exit and cleaning its temporary state. The debugger is
only enabled in this disposable test environment, not normal launch.

## Current-source managed ingress display

A later native Windows build staged the updated Companion at
`D:\are-companion-ingress-9oE1dk\acw-wVURLq\src-tauri\target\release\are-companion.exe`
(SHA-256 `7b15c942583e7be117dcfdcd2b0132d1d2c35063532d4a8fe83712a053d91461`,
9,311,232 bytes) and produced an unsigned, **uninstalled** installer at
`D:\are-companion-ingress-9oE1dk\ARE_Companion_0.1.0_x64-setup-ingress.exe`
(SHA-256 `a095e0f416f66fae9a23392b0d95c4dc44327dfceca6e8180342bb6b22241cff`,
29,475,722 bytes). The build wrapper did not relay the builder's final stdout;
artifact existence, hashes, and the staged executable's native run are the
available evidence, not a claimed clean builder transcript.

The extended `scripts/test-managed-session-windows.mjs` canary exited 0 against
that staged executable and the pinned installed Codex CLI. In the same isolated
managed session, the hosted client `/api/state` returned
`turn_execution.enabled:false` with reason
`windows-client.hook-boundary-unverified`, while the real WebView2 Adapters
page showed gateway `running`, backend `ready`, client `connected`, desktop
task control `unverified`, and managed new-turn ingress `paused`. Overview
showed `Backend connected; turns paused`. The orb, nonblank dashboard, seven
panels, and exact Companion-exit supervision passed. The canary made zero
model calls, installed nothing, and did not transfer this Codex desktop task.
This validates the read-only launch declaration; it does **not** repair the
Windows hook boundary or prove exact host-task control.

A subsequent gateway-level pause now shares the manager's exact reason code.
The manager refuses readiness if the gateway's reported block differs from
the expected Windows pause; the hosted client keeps its independent HTTP
turn-start rejection. Gateway fixtures prove direct model-entry methods are
rejected before durable dispatch intent, a wrapper-produced turn is withheld,
and an automatic successor stops before backend dispatch. Linux gateway and
manager suites passed 136/136. Native Windows Node ran the three named gateway
cases with a mock backend (3/3), and the same staged WebView2 Companion canary
passed again: `gateway_turn_execution_blocked:true`, hosted turn execution
disabled, dashboard ingress `paused`, zero model calls, no installation.
This closes an alternate-client path *within this managed gateway*, not every
Codex tool path or the active desktop task's separate controller.

The earlier `...setup-ingress.exe` predates the gateway-level pause. A fresh
native Windows build now supersedes it with the unsigned, **uninstalled**
`D:\are-companion-ingress-9oE1dk\ARE_Companion_0.1.0_x64-setup-gateway-pause.exe`
(SHA-256 `272a1a53c0fbe698d1d4fd2b5d49759b9e121e99bc380e26eb68cb7da69178a4`,
29,469,255 bytes). The retained staged executable is
`D:\are-companion-ingress-9oE1dk\acw-X8htro\src-tauri\target\release\are-companion.exe`
(SHA-256 `2da7781a2590117081f7f51649d323dbcf13d929d716df94f9186ab5297aede5`,
9,311,232 bytes). The staged bundle's gateway and manager source SHA-256
matched the checkout at build time. Its bundled Node/ARE `doctor --json`
returned `PASS` and closure digest
`381bba4aea8b490f4f1f1f231af104f739301847cd6db0cbf0801ffb3e13db75`.
The managed WebView2 canary passed again against this new staged executable:
both gateway and hosted-client turn execution were blocked, the Adapters panel
showed `paused` ingress beside a connected backend, and no model call occurred.
The Windows build wrapper again did not relay a final builder transcript, so
the claim rests on the retained artifacts, source hashes, bundled doctor, and
native staged run—not on a captured clean build log or installation test.

## Joined owned turn and shutdown

A further native run used the installed pinned Codex CLI, the current-source
managed launcher, the same staged Companion, a fresh isolated Codex home, an
exactly trusted three-hook fixture, and a fixed loopback Responses provider.
The hosted client created one new ARE-owned thread and completed one turn.
The exact managed Companion displayed one Threads row with a verified
completion frontier from the same gateway epoch shown on Adapters; following
that row opened a populated linked Decisions view. The test-only WebView2
debugger and profile existed only in the disposable run. The canary exited 0,
reported two private provider requests, zero external model calls, no active
configuration change, no current desktop-task handover, and no remaining
matching canary process.

The Windows host delivered an `item/commandExecution/requestApproval` request
for the fixture tool. The authenticated hosted client explicitly declined it;
the second provider request contained the denied result, not the command's
success marker. The Windows host listed all three hooks as enabled and
trusted, then emitted `hook/started` and `hook/completed` for prompt, tool,
and Stop. A bounded callback-entry marker showed callback processes did
start, but none received a stdin chunk or recorded a completed ARE callback.
A separate process control using the same quote-free batch command, JSON
input, and UNC working directory received and parsed its stdin. Controls
launched through Windows PowerShell `-Command` in that same directory entered
the callback but received no stdin chunks, even when the command tried
`$input` forwarding or reading its raw standard-input stream. This is
consistent with the installed host selecting PowerShell as its hook shell,
but the exact host child-process ancestry was not captured, so it remains
an inference rather than a proven root cause. The observed gap is at the
native host hook invocation/stream boundary, not the callback parser or UNC
working directory. Host `completed` notifications alone
are not proof of callback delivery. Prompt context on the model wire,
PreToolUse hook denial, and Stop-hook binding are therefore **not** proven on
Windows. They did pass in the separate Linux joined fixture. This remains a
platform integration gap, not a reason to claim universal effect
interception from the passing UI.

A later disposable native run exposed a second outcome for the same pinned
host: the fixture turn completed with two private provider requests, but no
approval server request and no completed ARE callback. The canary rejected that
run with `native.tool-was-neither-hook-blocked-nor-host-approval-declined`;
the second provider request lacked the shell success marker
(`tool_execution_marker_seen:false`), so it did not
establish that the command executed. The earlier explicit
approval decline is therefore not a guaranteed fallback for every tool
attempt. Official [Codex Hooks documentation](https://learn.chatgpt.com/docs/hooks)
documents cases where an unsupported `PreToolUse` output fails the hook but
the tool call continues; hook failure cannot be treated as a universal denial.
The managed Windows path now exposes `turn_execution` as disabled and returns
`windows-client.hook-boundary-unverified` before `turn/start`; its hosted
conversation screen explains the pause. A test-only probe flag, accepted only
with `ARE_INTEGRATION_TEST_MODE=1`, still permits isolated host diagnostics.
This protects new normal Windows hosted turns but does not repair hook delivery
or establish full session control. The shared gateway effect evaluator now uses
the route bound to the accepted turn and rejects missing route bindings in the
hosted gateway, rather than falling back to a generic implementation route.

The first completed Windows turn exposed a lifecycle defect: forceful native
client termination left its private hook connection file behind. The managed
launcher now reclaims that exact file only after the owning client has exited
and only when the file's identity, content, local host, and dead-owner PID
still match. Focused hook-control/launcher tests passed 7/7 on Linux, and
the native joined run confirmed the connection file was removed. The Windows
test runner's generic `node --test` invocation from a UNC path did not locate
the test file, so the native run is the Windows verification for this edge.

The first attempt exposed a test-fixture root mismatch: the repository
profile's `cyberAlchemy-v2/...` source paths are anchored at the parent
projects directory. Correcting the canary root made the profile load. The
manager now preserves bounded source `reason_codes` when a gateway exits
before ready, so such failures remain diagnosable. A later successful launch
initially raced Windows file-handle release during temporary cleanup; the
fixture now disables Codex plugin startup work and retries cleanup. The
final native run exited 0 and removed its disposable state.

## Claim ceiling and open questions

The joined follow-ups prove a completed owned turn's frontier and linked
Decisions in the same Windows managed Companion. Normal Windows hosted turns
are now paused pending a verified tool boundary. These checks do **not** prove
Windows hook delivery, complete effect interception, or that an installed package
locates its bundled ARE/Node runtime,
protects its named pipes and private files with effective ACLs, survives
upgrade/uninstall, meets an idle-resource budget, or controls this already-open
Codex desktop task. Linux has a separate joined managed-session UI/turn proof.

- Capture the installed host's exact hook process ancestry and verify the
  selected shell. If that shell cannot deliver callback input, implement and
  prove a complete host-protocol effect boundary rather than promoting hook
  lifecycle notifications. Keep the explicit hosted approval-decline boundary
  until callback delivery or the replacement boundary is proven.
- Validate an installed package's startup, recovery, cleanup and resource
  behavior before release consideration.
