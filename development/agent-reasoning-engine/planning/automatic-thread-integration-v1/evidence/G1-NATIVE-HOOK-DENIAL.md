# G1 bounded native PreToolUse denial

Status: opt-in construction evidence, 2026-09-28. No hook registration,
desktop-task handover, release, or universal effect boundary is claimed.

## Exact boundary

The hook-event session and gateway hook client retain their advisory default.
With `enforce_supported_tool_blocks: true`, an exact prompt/turn-bound
`PreToolUse` decision that returns `ok: true` and `kind: "block"` now emits the
Codex `permissionDecision: "deny"` response. A gate emits no permission
decision. The option neither approves effects nor infers an absent binding.

The [official hook contract](https://learn.chatgpt.com/docs/hooks) documents
that this response can deny a supported tool call, but also warns that hosted
tools and specialized paths may skip local hooks. Therefore this is a tested
local-tool guard, not the non-bypassable host effect contract required for G1.

## Verification

- `node --test` for `hook-event-session.test.mjs` and
  `gateway-session-client.test.mjs`: 25 passed, 0 failed. The default-off
  advisory shape, opt-in exact block, gate-without-approval, invalid mode,
  and gateway-client binding paths passed.
- On installed `codex-cli 0.155.0-alpha.16.4` at SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`,
  the disposable `--hook-deny` canary passed. It used a temporary configuration,
  an ephemeral App Server thread, a fixed loopback provider, and a harmless
  shell `printf` whose command text did not contain its contiguous output
  marker. Codex reported `hook/completed.status: blocked`, the returned tool
  output lacked the marker, and subsequent fixed-response turns completed.
  External model calls: zero; active configuration changes: zero.
- The same installed-host canary in default `--events` mode passed and observed
  the ordinary advisory path execute the harmless `printf`. This is a
  differential check on the exact host, not an assertion about other tools.

Two initial gateway-wrapper attempts failed before usable native hook evidence:
the gateway rejected a test-only `thread/start.config` override, and without
that override the disposable hook registration remained untrusted. The
production lifecycle parameter guard was **not** relaxed to make the canary
pass.

The later `--gateway-wrapper-hook-deny` canary passed on the same installed
binary and hash. It passed admitted `thread/start` and `turn/start` parameters
through the actual ARE wrapper and persistent gateway. The disposable host
configuration trusted only the three generated hook definitions at their
discovered hashes; a second `hooks/list` verified all three exact keys and
hashes as trusted. The gateway backend did not use the broad hook-trust bypass
flag or a client-supplied `thread/start.config` override. The prompt callback
ran before the first fixed-provider request, and its exact context appeared on
the wire. ARE returned `continuation.zero-admissible` for the fixture shell
call; the opted-in gateway hook client emitted `permissionDecision: "deny"`;
Codex reported a blocked hook and no tool success marker appeared. Stop and
completion callbacks bound to the turn, and the real wrapper reported one
reasoning frontier. External model calls: zero. Temporary configuration and
host process were removed. This proves the combined gateway/native path for
one supported local shell call, not desktop-task takeover or full effect
coverage. The command is:

```sh
ARE_NATIVE_CANARY_EXPECTED_VERSION='codex-cli 0.155.0-alpha.16.4' \
  node implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs \
  /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex \
  --gateway-wrapper-hook-deny
```

The reusable callback runner passed nine focused runner/bridge tests:
authenticated denial relay, advisory default, unavailable assessment,
bridge loss, forged grant rejection, and non-loopback endpoint rejection.
`--gateway-wrapper-hook-unavailable` injected an `ok: false` ARE effect result
after a correctly bound prompt. On the same pinned installed host and exact
disposable hook trust, the `PreToolUse` runner exited `2` with no JSON stdout;
Codex reported `hook/completed.status: blocked`, and the shell output lacked
the success marker. This is an injected decision failure, not a successful ARE
effect decision. The native `--hook-deny` and advisory `--events` canaries
passed again after the runner change. No external model call or active
configuration change occurred. Reproduce the failure canary with:

```sh
ARE_NATIVE_CANARY_EXPECTED_VERSION='codex-cli 0.155.0-alpha.16.4' \
  node implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs \
  /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex \
  --gateway-wrapper-hook-unavailable
```

## Hosted-client controller follow-up

The ARE-owned hosted client now has an opt-in callback controller on its
**existing** gateway RPC session. Three focused controller tests and one
process-level hosted-client CLI fixture passed: a private exclusive endpoint
was published, an invoked unbound tool call was blocked, gateway loss withdrew
assessment, a callback for another thread was rejected, no second RPC writer
was created, and clean shutdown removed only the controller's exact endpoint
file. The CLI fixture uses a fake gateway and starts no model turns. It now
also creates a thread through the executable's authenticated HTTP API, then
invokes the callback runner for that owned thread: prompt context is produced
and an unrelated shell-tool proposal emits `permissionDecision: "deny"`. A
foreign thread still exits `2` without a grant. The focused bridge, runner,
controller, CLI, and integration-surface suite passed 21/21 on 2026-09-28.

The same controller then passed a separate installed-host canary with the real
ARE wrapper and persistent gateway, exact-hash trust for three disposable
hooks, and `codex-cli 0.155.0-alpha.16.4` at SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The prompt callback reached the first fixed-provider request; ARE bound and
blocked the unrelated shell proposal; Codex reported `hook/completed.status:
blocked`; the tool success marker was absent; Stop and native completion bound
to that turn. The client used one gateway RPC connection and no broad hook
trust bypass. External model calls and active configuration changes: zero.
The disposable process and configuration were removed. Reproduce with:

```sh
ARE_NATIVE_CANARY_EXPECTED_VERSION='codex-cli 0.155.0-alpha.16.4' \
  node implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs \
  /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex \
  --gateway-wrapper-hosted-hook-deny
```

This executes the same controller module used by the hosted-client CLI, but
does not drive the hosted client's browser UI or prove that its CLI launched
the installed Codex backend. The earlier gateway-denial,
injected-unavailability, and advisory event canaries passed again after this
change. The selected Codex desktop application has not registered these hooks
or handed over this chat.

The next disposable canary closes that CLI-launch gap. It starts the real
gateway and `are-codex-windows-client.mjs` executable, creates a thread and
turn through the hosted client's authenticated HTTP API, and invokes the same
installed `codex-cli 0.155.0-alpha.16.4` binary. A separate disposable App
Server process first discovers the three configured hook keys and hashes; the
isolated `CODEX_HOME` trusts only those exact definitions. The first private
provider request includes the prompt-hook context. Its fixed response asks for
one harmless shell `printf`; the bound `PreToolUse` callback returns a deny,
and the second provider request contains no tool success marker. The Stop
callback binds to the same thread and turn. On client shutdown, the private
callback file is removed. The canary passed with two loopback provider
requests, zero external model calls, and no active configuration change:

```sh
ARE_NATIVE_CANARY_EXPECTED_VERSION='codex-cli 0.155.0-alpha.16.4' \
  node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/hosted-hook-denial-canary.mjs \
  /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex
```

This is the hosted-client executable path, not the selected desktop
application or a visual browser test. The latter's current task still has no
verified exclusive writer handover or trusted hook registration.

The installed-host canary now uses the hosted client's authenticated event
stream for its primary completion oracle. Ten consecutive disposable runs
passed with native `hook/completed.status: blocked` and
`turn/completed.status: completed`. An opt-in `--poll-stress` mode retains the
earlier concurrent runtime/history polling as a diagnostic, not the primary
completion proof. That stress exposed a host-history race: an active snapshot
could arrive after a durable terminal snapshot and formerly faulted the
gateway. The hosted client now serializes audit-bearing reads per thread; the
gateway rejects a stale `inProgress` response without recording it or faulting
the session; the client retries only that typed stale read, at most twice.
Different terminal statuses still cause the existing durable session fault.
The gateway, hosted-client, hook-event, callback, and controller regressions
passed 158/158 after these changes.

Aggressive history polling is not yet a passing operational path. In stress
runs, installed Codex sometimes exposed `interrupted` history before the local
provider was contacted and later reported a different status; the gateway
correctly refused to promote the contradiction. A separate early read also
returned `thread/read: list_turns is not supported yet` before the first turn
materialized. These remain host-history readiness/reconciliation gaps. No
result from the event-driven canary should be read as resolving them.

The hosted client now maps that exact early `thread/read` failure to a typed
`409 windows-client.history-unavailable`, without exposing the backend error
detail or treating the thread as idle. A regression verifies that runtime and
history stay unavailable and a send is withheld until an audited read succeeds;
then that same send is accepted once. The diagnostic polling canary retries
only this typed unavailable condition. One polling run before, and three after,
the canary adjustment passed on the pinned installed host. This does not
resolve or waive the separate terminal-status contradiction, and no desktop
task handover or active configuration change occurred.

A subsequent five-run polling series reproduced the independent gap: four
passes, then one durable `gateway.turn-history-status-conflict` session fault.
The faulting run had a verified `interrupted` history observation followed by
a contradictory host snapshot, despite the local provider completing two
requests and all three hook callbacks appearing. ARE stopped the session; it
did not silently reinterpret or replay the turn. Polling is therefore still
diagnostic, not a passing readiness gate.

A later candidate repair now checkpoints an exact, content-free native
`turn/completed` witness before forwarding the notification. For a newly
accepted live turn, a stored terminal snapshot without that witness is
withheld as `gateway.turn-history-unsettled`; a snapshot disagreeing with the
witness is withheld as stale. Neither is durably reconciled or reported as
idle. A matching stored terminal snapshot is still journaled before semantic
reconciliation, and a different terminal snapshot after that durable match
still faults the session. The witness survives session-store compaction;
duplicate native completion with a different status faults the exact session.
The hosted client maps unsettled and stale reads to a sanitized 409 and blocks
new sends. The pinned installed-host canary passed one event-driven run,
sixteen polling runs with the older polling oracle, then four runs with the
stronger oracle requiring both live completion/tool denial and stored-history
reconciliation. The affected gateway, session-store, hosted-client, and browser
suites passed 169 tests with 6 browser tests skipped. These bounded runs do
not prove all hard-crash timing windows or activate this desktop task.

The strict callback runner subsequently gained an additional projection
check: an `ok: true` bridge result for `PreToolUse` must carry a supported ARE
decision kind and matching hook output; a `block` without a deny is treated as
unavailable and exits `2`. Focused bridge/runner tests and the installed-host
hosted-controller canary passed again with this check.

## Open boundaries

- A trusted, selected desktop-client hook registration and complete prompt,
  tool, approval, steer, and completion ingress for this exact task remain
  unverified. No active chat configuration was changed.
- The opt-in callback runner blocks an unavailable assessment only when its
  `PreToolUse` hook is invoked. A skipped hook path is not a proven denial.
  This cannot replace gateway ownership and host effect assessment. The
  ARE-owned hosted client now has an opt-in bridge on its existing gateway RPC
  connection, but no selected desktop host has registered or trusted this
  runner for this task.
- The candidate durable completion witness addresses the reproduced live-turn
  terminal-snapshot race and the first-turn unreadable-history case, but
  broader crash/replay timing and long-run history convergence still need
  verification before treating polling as a release readiness gate.
- The TUI is discontinued and is not a fallback or validation target.

One further strict installed-host polling canary passed on 2026-09-28 after
the early-event ordering and retained-projection changes. It required native
completion, native tool denial, and stored-history reconciliation. This is
disposable fixture evidence, not active desktop control.

A current-source recheck on 2026-09-28 passed nine consecutive disposable
`--poll-stress` runs (one initial run and eight repeats) against the same
installed `codex-cli 0.155.0-alpha.16.4` executable at SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
Each run launched the real hosted-client executable and gateway, observed the
bound native prompt, tool-denial and completion path, and waited for its
concurrent runtime/history read to finish. Each reported two private loopback
provider requests, zero external model calls, no active configuration change,
and removal of its disposable callback file. This repeated check did not
exercise an installed Companion package, a hard crash, long-duration operation,
or handover of the current desktop task; polling remains diagnostic rather
than a release-readiness gate.

## Strict gate and advertised goal-tool follow-up — 2026-09-28

The installed-host hosted-client canary now reports the first provider
request's function-tool names. In its read-only mode, the pinned binary
advertised `create_goal`, `exec_command`, `get_goal`, `request_user_input`,
`update_goal`, `view_image`, and `write_stdin`; it did **not** advertise
`apply_patch`. A local hook-session regression verifies that an
`apply_patch` callback maps to `item/fileChange/requestApproval`, but this
read-only native run cannot prove file-tool delivery.

One disposable `--probe-goal-tool` run used the real hosted-client executable,
gateway, exact-hash trusted hooks, and fixed loopback provider. Its request
for `create_goal` reached one bound `PreToolUse` callback. ARE returned an
exact `block`, the callback emitted `permissionDecision: deny`, and the host
reported a blocked hook before the turn completed. The run reported two
private provider requests, zero external model calls, no active configuration
change, and removal of its private callback file. It did not call `create_goal`
on this desktop task or prove every specialized tool is hook-covered.

A separate source-level probe exposed a real strict-mode gap: an exact
implementation-route `create_goal` proposal returns an ARE `gate`, and the
former hook output had **no** denial. A gate is not an approval, so strict
supported-tool mode now emits a denial for both `block` and unresolved `gate`;
the callback runner accepts either only with `permissionDecision: deny`.
The advisory default remains unchanged. An attempted native gate-mode turn
was stopped by the hosted client's `turn/start: ARE preflight gate` before any
provider request or tool callback. Therefore the native result proves the
no-write `block` path and preflight stop, **not** a live gated-tool callback.

The focused hook-event, callback-runner, hosted-controller, and gateway-client
suite passed 36/36; the wrapper suite passed 516 with 14 skips and zero
failures; the ARE source suite passed 101/101. Both the default shell-tool
and opt-in goal-tool disposable installed-host canaries passed on the pinned
binary. This closes a supported-hook fail-open gate projection in the ARE-owned
hosted path only. Host paths that skip hooks, the desktop client's exact
hook registration, universal effect interception, and current-task handover
remain unverified. The TUI remains discontinued.

## Hosted tool-transport coverage limit — 2026-09-28

The same native canary advertised `write_stdin` alongside `exec_command`.
Codex's [Hooks tool-coverage contract](https://learn.chatgpt.com/docs/hooks#tool-coverage)
states that `write_stdin` sends input to or polls an existing unified-exec
session without a new `PreToolUse` invocation. Therefore a denied
`exec_command` in the disposable no-write canary leaves no approved session
to test, and the one-tool denial result must **not** be generalized to every
later transport operation. No valid-session `write_stdin` probe was run.

The boundary is particularly relevant to an interactive command: subsequent
input may affect its behavior after the initial command was admitted. ARE's
current strict hook adapter cannot assess each such input as a fresh effect.
The hosted path should keep `effect_requests` at unknown/unsupported for
complete host-effect control until an exact host capability or stronger
isolation boundary proves coverage. This is a G1 product gap, not a reason
to reactivate the discontinued TUI or to claim control of this desktop task.

## Native callback-outage denial — 2026-09-28

The disposable installed-host canary now has `--probe-callback-outage`. It
removes only its private callback connection after the bound
`UserPromptSubmit` event, then asks the fixed loopback provider to invoke
one harmless `exec_command`. The real strict callback exits with code 2 on
the missing connection; the pinned Codex host reports its `PreToolUse` run as
blocked. The provider receives a denied tool result, not the command's output.

The outage, normal shell-denial, and `create_goal`-denial modes each passed
against `codex-cli 0.155.0-alpha.16.4`, SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The outage run retained one prompt, one tool, one stop, and a completed native
turn; it made two private provider requests, zero external model calls, and
changed no active configuration. Its private callback file was absent at
shutdown as intended. This verifies one missing-connection failure path for
the installed host's supported `exec_command` hook, not general hook coverage
or current-desktop-task control.

## Native Windows callback ancestry and input recheck — 2026-09-28

The disposable hosted-client canary now records only process names from up to
four ancestors of each callback process. It also retains callback entry,
input-chunk counts, and native hook lifecycle summaries in its **failure**
report, rather than losing those facts during temporary-state cleanup. This
instrumentation does not alter the production callback or host configuration.

Two `--managed-session` runs against the installed Windows
`codex-cli 0.155.0-alpha.16.4` executable at SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`
failed the strict canary because neither a bound hook denial nor a host approval
request was observed. Both completed a disposable turn through the fixed
loopback provider with two private requests; neither observed the harmless
shell success marker. The second run reported three callback entries and zero
stdin chunks. Prompt, PreToolUse, and Stop each had native `hook/started` and
`hook/completed` notifications with `completed` status, while the callback
event ledger stayed empty. The ancestry probe resolved `cmd.exe` as one
callback's immediate parent; the other two parents were already unavailable
by lookup time. That proves a `cmd.exe` parent for one invocation, not the
full host shell chain or why the pipe was empty.

The same run's direct batch control received and parsed the JSON input; its
PowerShell plain, forwarded, and raw-stream controls all entered the callback
without a chunk. The repeatable boundary is missing callback stdin under the
installed host despite lifecycle `completed` notifications. Normal managed
Windows model entry remains paused at both hosted client and gateway; no
general effect boundary or current-desktop-task handover is claimed.

A third run changed only `commandWindows` from the disposable batch wrapper to
the direct `node.exe capture-callback.mjs` command. It reproduced the same
strict failure: three callback entries, zero input chunks, no completed ARE
callback, no approval server request, and no shell success marker. The host
again reported all three hook lifecycles `completed`; one callback observed a
`cmd.exe` parent. Thus the extra batch wrapper is not sufficient to explain
the missing input. The selected host's complete process chain and the exact
point at which stdin closes remain unverified.

A fourth run removed the canary's synchronous ancestry lookup entirely using
the explicit `--managed-session-direct-hook --skip-ancestry` test mode. The
same hash-verified installed Windows binary still completed a disposable turn
with two private loopback-provider requests and no shell success marker. All
three native hook lifecycles reported `completed`, while three callback
processes entered, zero input chunks arrived, no ARE callback event completed,
and no approval server request appeared. The canary failed its strict
tool-boundary assertion as intended. This rules out the diagnostic ancestry
lookup as a sufficient cause of the lost input; it does not identify the
host-side pipe break or establish general effect control. An initial attempt
to disable the lookup through a WSL-only environment variable was inconclusive
because the Windows child still ran that lookup; the explicit argument is the
valid A/B result. No active host configuration or current desktop task was
changed.

The same installed binary's `app-server generate-json-schema --experimental`
output was inspected in a disposable directory. Its `ThreadStartParams`,
`TurnStartParams`, and `ThreadResumeParams` expose approval/sandbox settings,
and `ThreadStartParams` exposes `dynamicTools`, but none exposes a built-in-tool
allowlist, built-in-tool disable switch, or pre-execution callback for all
built-in tools. `strictAutoReview` occurs in
`PermissionsRequestApprovalResponse`, after a permissions approval request;
it is not a thread-start control. This bounds the generated protocol surface
of this exact binary; it does not prove that no other host architecture could
provide the needed boundary. Instructions that merely tell a model not to call
tools would not close the effect-control gap. The Windows hosted-client
model-entry pause therefore remains the correct current behavior.

A fifth A/B run started the same canary under PowerShell `Start-Process` with
native Windows stdout/stderr files, rather than inheriting the WSL interop
launch handles. It retained `--managed-session-direct-hook --skip-ancestry`.
The isolated Windows process exited 1 at the same strict assertion: three
callback entries, zero input chunks, zero completed ARE callback events, no
approval server request, and no shell success marker. All three native hook
lifecycles again reported `completed`; the fixed loopback provider received
two private requests. This rules out the WSL-interoperated parent process as
a sufficient explanation for the missing hook input. It still does not prove
the exact host-internal pipe failure or universal coverage. The test removed
its own redirected output files and changed no active host configuration.

### Windows callback stdin handle diagnostic — 2026-09-28

The same disposable `--managed-session-direct-hook --skip-ancestry` canary was
extended to record only the callback's stdin handle kind and TTY posture,
never its contents. Against the same hash-verified Windows Codex copy, all
three hook callbacks entered with `fstat(0)` reporting a character handle and
`process.stdin.isTTY === true`; each still received zero input chunks. The
host reported Prompt, PreToolUse, and Stop hook lifecycles as `completed`, but
no ARE callback event completed and no host approval request appeared. The
fixed provider made two loopback requests and the shell success marker was
absent. A direct `cmd.exe` control did receive and parse its injected stdin.

The [official OpenAI hook contract](https://learn.chatgpt.com/docs/hooks)
says every command hook receives a JSON object on stdin. These observed
handles do not satisfy that contract for this installed Windows App Server
path. A console/character handle is consistent with stdin inheritance instead
of a JSON pipe, but the precise host-side creation call is not observed; that
mechanism remains an inference. The callback cannot recover a trustworthy
prompt or tool proposal from an empty stream. Windows managed model entry
therefore stays paused. The test changed no active host configuration, touched
no current desktop task, and made zero external model calls.

The same official contract offers structured-input MCP tool hooks, but says
missing servers and hook errors do not block the operation. That path may help
diagnose or observe the Windows transport, but it is not a fail-closed
replacement for the missing command-hook payload on its own. No MCP hook was
registered for this task.

### Open Questions

- Capture the complete host-side shell/process creation path without relying
  on a short-lived parent's later process lookup; the native detached launch
  has already reproduced the missing-input behavior.
- Find and verify a complete host-provided pre-execution boundary, or keep
  Windows hosted turns paused. The generated protocol for this pinned binary
  exposes no built-in-tool allowlist or universal pre-execution callback.
