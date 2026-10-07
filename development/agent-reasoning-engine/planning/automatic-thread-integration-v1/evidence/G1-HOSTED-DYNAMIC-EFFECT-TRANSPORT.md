# G1 hosted dynamic effect transport — candidate evidence

Status: bounded source and loopback-host evidence, 2026-09-29. This does not
activate host effects, take over the current Codex task, or establish product
approval. The discontinued TUI is not a consumer or test target.

## Boundary and result

The pinned Codex App Server exposes experimental `thread/start.dynamicTools`
and host-to-client `item/tool/call`. The [method policy](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/host-method-policy.mjs)
now names one exact `are_effect_request` tool. Default gateway and wrapper
postures still deny dynamic calls. Their opt-in path currently accepts only a
bounded command proposal with host thread, turn and call identities. The
[gateway](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs)
then applies its existing owned-thread and accepted-active-turn checks before
delivery. The [hosted client](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/windows-client-host.mjs)
advertises that exact definition on new threads only when separately opted in.

The [dynamic handler](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/hosted-effect-broker.mjs)
derives its effect ID from host thread/turn/call IDs, requires an active-turn
check, and invokes the broker without accepting model-supplied effect metadata.
The broker requires another active-turn check after one-use approval and before
its durable execution intent. The first source pass had no executor or launcher
wiring; those were added as explicit opt-in later, without live activation.

The wrapper now exposes a default-off, gateway-owned
`cyberalchemy/hostedEffect/assess` request. It accepts only the exact host-derived
effect identity and proposal, checks the accepted active turn, and evaluates
under that turn's bound route instead of a route supplied by the client or
model. The broker's gateway assessor verifies the returned request digest
before accepting the directive. Focused tests cover disabled, inactive,
completed, malformed, and research-route cases; the three touched focused
tests pass. Assessment alone grants no effect.

The next source pass joined a gateway-owned-thread test, the hosted client's
verified active-turn query, and its existing one-use browser approval broker.
An in-process host-call fixture now runs through the real accepted-turn ARE
assessment, digest-checked gateway-assessor adapter, approval, durable private
intent/outcome journal, and deduplicated response. Its executor is deliberately
a fixture: the joined test proves order and binding, not sandboxed execution or
installed-host activation. The gateway test confirms an unowned consumer is
rejected and the local assessment never reaches the Codex backend.

The official App Server contract documents `command/exec` as a server-sandboxed
single command, separate from a model turn. A disposable, model-free
[native command canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-command-exec-sandbox-canary.mjs)
passed on pinned `codex-cli 0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`):
one read-only command returned exact output and a read-only write attempt
failed without creating its sentinel. It used a disposable App Server and no
model/provider call. This establishes a possible selected-host execution
primitive, not a broker permission to call it. The gateway still rejects
direct client `command/exec`.

The same pinned canary now also passes a workspace-write probe: a command
could write inside the selected disposable root, while a sibling-root write
failed and created no file with `excludeSlashTmp`, `excludeTmpdirEnvVar`, and
network access disabled. The new
[command request materializer](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/hosted-effect-command.mjs)
fixes exactly that sandbox shape, a 30-second timeout, 32-KiB per-stream cap,
buffered non-PTY mode, and a canonical cwd inside the selected repository. It
rejects proposal-supplied policy/env and symlink escapes. This is not a Windows
sandbox proof.

Before execution wiring, the broker's uncertain-outcome branch was corrected:
an executor transport exception or malformed response leaves the durable
intent unsettled and latches the broker, instead of recording a falsely
completed failure. Focused broker/command tests pass 14/14. The full wrapper
suite then passed 604/618 with 14 platform skips and no failures. A separate
gateway assertion confirms direct client `command/exec` is still rejected
before the backend, even with a pass-through wrapper.

A further source-only boundary now validates one command dispatch against the
same request, accepted ARE directive, one-use approval binding, and durable
intent digest. Its executor adapter rereads the intent and rechecks the active
turn immediately before calling a supplied dispatch function; transport
exceptions remain outcome-unknown in the broker. The broker now carries its
actual directive into that adapter. At that checkpoint it supplied no dispatch
function and granted no client access to `command/exec`. Focused
binding and broker tests passed 15/15. The discontinued TUI is not a consumer.
The post-change full package rerun passed 607/621 with 14 platform skips and
no failures. An earlier concurrent full run had a five-second Evolution
gateway-readiness timeout; the isolated test and subsequent full rerun passed.

The next opt-in source join adds `cyberalchemy/hostedEffect/execute`: only a
previously assessed command with a matching directive, approval binding,
durable intent and exact effect-ID stable key can become gateway-owned
`command/exec`. The browser-side executor rereads its private journal and
rechecks the active turn immediately before RPC dispatch. The gateway keeps
direct client `command/exec` denied, durably records the transformed dispatch,
and maps its host response back to the broker. The managed launcher has an
explicit `--allow-hosted-effects` switch requiring a restricted host profile;
it remains **off by default**. File-change is intentionally absent from the
advertised tool until it has its own executor. Focused wrapper, gateway,
client-policy and broker suites passed 318/318. This is a source and fake-host
join, not an installed-host end-to-end or Windows result. The complete wrapper
suite then passed 610/624 with 14 platform skips and no failures.

A separate disposable, model-free
[native gateway command canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-gateway-command-canary.mjs)
passed on the same pinned binary and SHA-256. It proved that the gateway
denies a direct client `command/exec`, transforms its exact local effect
request, and gets a sandboxed write response from the installed App Server in
a disposable root. Its wrapper is intentionally a transport fixture; the
preceding joined test uses the real ARE wrapper with a fake host. Together
these cover both seams, not the complete installed-host approval path.

The full disposable
[installed-host join canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-hosted-effect-join-canary.mjs)
then passed on the same pinned binary: a local fixed Responses provider
requested the exact dynamic tool; the real gateway and ARE wrapper assessed
the accepted turn; a fixture drove the real one-use approval broker; the durable broker intent
preceded the sandboxed command; the selected App Server wrote only to the
disposable root; and the result returned to the local provider. It made zero
external model calls and did not touch the current desktop task. The approval
surface in this canary is a fixture, **not** the browser UI, and it does not
prove Windows behavior, restart recovery, or comprehensive native-effect
bypass resistance.

Under hosted-broker opt-in, the wrapper now declines native command, file-change
and permission approval requests before they reach the browser approval UI.
This removes a duplicate approval route while keeping the default-off legacy
behavior unchanged. A focused denial test and the installed-host join canary
passed after that change. The full suite immediately before this one-test
addition passed 611/625 with 14 platform skips. The final full rerun passed
612/626 with the same 14 platform skips and no failures.

The read-only Companion Adapters view now projects only the gateway's hosted
effect configuration posture (`candidate-enabled`, `disabled`, or `unknown`).
It does not infer browser approval, a live effect, or control of this desktop
task. The 43 browser UI tests passed, and gateway observation tests passed.
Linux Tauri compilation could not reach application code because this WSL
environment lacks `pkg-config` and required GTK/WebKit libraries. A native
Windows installer build first reached Tauri compilation but failed when C:
filled. Its exact generated 895-MB staging directory was removed after
inspection, restoring approximately 893 MB of free space. A builder option to
stage under a selected existing parent then allowed a native D: build to pass.
The unique, unsigned
[Windows installer](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/dist/ARE_Companion_0.1.0_x64-setup-hosted-effects-20260929.exe)
is 29,544,155 bytes, SHA-256
`05880f3221f7a283fed99e5b5e43fa132c710b4f0ffc88ab6b44d98784977579`.
It was built from closure digest
`ca44f49c1437e083db40a80e1d8c88cdfbeb9dd5236176508277c2096d6cfc74`
and was not installed. A second retained D: stage compiled the unpackaged
executable, but NSIS packaging failed on a long resource path; the already
built installer was unaffected. Its compiled executable passed the native
Windows UI smoke test: orb, Tauri bridge, nonblank dashboard, live adapter
pipe, thread reasoning state, decisions, Evolution, diagnostics, appearance,
accessibility, and gateway-loss behavior. The test now asserts the new hosted
command status is visibly `disabled` by default. The
[adapter screenshot](ARE-HOSTED-EFFECT-ADAPTER-UI-20260929.png) records the
rendered state. The 1.4-GB second disposable build stage was removed after the
test; installer and screenshot were retained. This is UI proof, not a Windows
hosted-effect execution or browser-approval proof.

The hosted client's one-use ARE command approval was then exercised in native
Windows Chrome against an isolated loopback client. A
[reproducible browser test](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/hosted-client-browser.test.mjs)
now requests approval through the actual hosted-effect approval adapter,
checks that the browser displays its ARE source and exact command proposal,
clicks `Accept once`, and verifies the accepted response, cleared broker, and
absence after reload. All 10 hosted-browser tests passed on Windows. This
fixture performs no command. The Linux Playwright CLI could not launch its
Chromium because WSL lacks `libnspr4.so`; the available native Windows Chrome
was used for the successful test. That isolated test was then joined to an
installed-host sandbox canary as described below. The final Linux wrapper suite
after this test addition passed 612/627, with 15 platform/browser skips and no
failures.

The disposable installed-host join canary now has an explicit
`--browser-approval` mode. It starts the real hosted client approval surface
instead of auto-accepting, while retaining the local fixed Responses provider,
real wrapper/gateway/broker, private durable journal and pinned App Server.
Native Windows Chrome observed the ARE source and the exact disposable
command, clicked `Accept once`, and the same canary run passed: the sandboxed
write completed only in its disposable root, the result returned to the local
provider, the journal had no unsettled intent, and zero external model calls
were made. The original auto-accept mode also passed after this change. This
closes the browser-click-to-installed-host join for this disposable WSL run;
it is not a proof of the managed launcher, Windows command sandbox, restart
recovery, or control of the current desktop task.

The existing restricted-lifecycle canary now covers managed startup and a
managed ordinary turn with `--allow-hosted-effects`. Both disposable modes
passed against the same pinned host, verified the dedicated restricted Codex
home, and removed their temporary configuration. The managed turn advertised
`are_effect_request` while omitting native effect tools; the local provider
returned only a fixed text response, so this proves startup/catalog posture,
not a managed command dispatch or browser approval in that launcher.

That managed canary exposed a scope defect before any managed command was run:
its profile/source root is the parent projects directory, which the first
hosted-effect wiring also used as the command sandbox root. The gateway and
hosted-client CLIs now require a separate, explicit, canonical
`--hosted-effect-root` whenever hosted effects are opted in. The managed
launcher binds it to its selected checkout/cwd and verifies matching root
digests from both child readiness records. The opt-in also requires `--cwd`
to be supplied explicitly; it cannot silently default to the broad source
root. Missing, outside-source and symlink
roots fail closed. Focused root/execution/managed tests passed 8/8, and the
managed hosted-turn canary passed again after the change. No managed command
was executed under the former broad root. The post-fix full wrapper suite
passed 613/628 with 15 platform/browser skips and no failures.

The managed-lifecycle canary now also has a `managed-hosted-effect-turn` mode.
It first showed a correct ARE block when the turn asked only for an explanation;
that route did not authorize an implementation effect. With an explicit bounded
implementation turn, the same disposable managed launcher passed end to end:
the restricted host advertised only `are_effect_request` as an effect tool,
native Windows Chrome displayed the command and ARE origin, `Accept once`
flowed through the real managed hosted client and private journal, and the
pinned App Server returned `ARE_MANAGED_HOSTED_OK` from a sandboxed command to
the local fixed provider. Four local provider requests, zero external model
calls, no current-desktop-task access, and temporary configuration removed.
The command produced stdout only, with no repository write. This closes the
managed browser-command join for a disposable WSL host, not Windows sandbox or
power-loss recovery proof.

The hosted client now also confines new hosted-effect threads to that selected
effect root. A request for a sibling workspace returns a typed refusal before
`thread/start`; the exact tool is advertised only inside the root. The
Windows-client host suite passed 66/66, and the full managed browser-command
canary passed again with the tighter binding. This does not yet establish a
safe rebinding rule for previously persisted/resumed threads. The current
opt-in client now refuses interactive resume and new turns for those persisted
thread IDs with `windows-client.hosted-effect-resume-rebind-unverified`; it
does not silently reuse an old dynamic tool or workspace. The updated host
suite passed 67/67. Same-process newly created threads remain usable.
The final package rerun after the workspace and persisted-thread guards passed
615/630 with 15 platform/browser skips and no failures; the managed
browser-command canary also passed again after those guards.

A disposable pinned-host `--resume-probe` restarted App Server after a
completed hosted-effect turn, resumed that exact thread, and observed the next
local provider request still advertising `are_effect_request`. Both the
pre-restart `thread/read` and post-restart `thread/resume` returned the same
selected cwd, but neither response exposed `dynamicTools` or an exact tool
definition. This is useful host behavior evidence, not a per-thread rebinding
proof: the client recovery record currently stores only thread IDs and has no
durable binding to the originally selected root or tool definition.

The subsequent v5 private recovery record closes that local binding gap for
newly created hosted-effect threads. It atomically checkpoints the selected
root digest, exact advertised tool digest, host user agent, cwd, and creation
request digest with the owned thread ID. v1-v4 records migrate with no invented
thread binding. At resume, the hosted client requires that exact retained
binding, a healthy settled effect journal, and matching thread ID/cwd in both
an audited pre-resume `thread/read` and the `thread/resume` result before it
permits a new turn. Unit tests cover successful resume and turn dispatch, and
missing, drifted, or unsettled conditions returning a typed refusal before
turn dispatch. A clean-restart join also reopens the real private recovery
record and effect journal with a new hosted-client instance: it refuses a turn
before resume, validates the retained binding, and accepts a turn only after
host read/resume checks. The Linux recovery tests cover atomic persistence/restart and
v4 migration; a native Windows test passed with the v5 binding sealed by
DPAPI and restored after restart. The native Windows hosted-client suite passed
70/71 with one POSIX-only clean-restart join skipped and zero failures. The
pinned-host `--resume-probe` passed again
with the same binary SHA-256, same cwd and tool advertisement to the local
provider. The post-change wrapper suite passed 621/636, 15 platform/browser
skips, zero failures. This is not a managed-launcher crash/restart proof, and
App Server still does not expose the exact resumed `dynamicTools` definition
for independent re-attestation. At this stage a stale journal lock after a
hard crash remained an explicit stop, not an automatic takeover.

A new `managed-hosted-restart-turn` canary then exercised the real managed
launcher twice against the same disposable private state and pinned WSL host.
It created a hosted thread and completed a first local-provider turn, stopped
the managed stack cleanly, relaunched it, observed a typed refusal for a turn
before resume, resumed the exact owned thread, and completed a second turn.
Both managed provider requests advertised `are_effect_request`; the run made
four local provider requests total, zero external model calls, and removed its
temporary configuration. The first run exposed a real restart defect: a new
client reused a numeric RPC ID, and ARE learning treated the new turn as a
recorded dispatch. The gateway now passes its already-durable, host-bound
`clientUserMessageId` to ARE preflight before forwarding it to the host.
The correction also revealed ID-dependent ordering of saved lessons; the
learning projection now follows its durable feedback-event sequence. A
definite preflight refusal now clears only its exact pending hosted-client
intent and returns bounded reason codes without private residue. Focused
gateway/client/recovery tests passed 229/233 with four native-Windows skips;
the request-intent suite passed 65/65; the final wrapper suite passed 625/641
with 16 platform/browser skips and no failures. A negative host test also
confirms that a preflight-like but unverified RPC error retains its pending
turn intent instead of claiming a definite non-send. Native Windows hosted-client
and recovery suites passed 75/92 with 17 platform skips. The installed-host
effect join with one-use broker-fixture approval and `--resume-probe` also
passed again after the gateway change. The hosted chat UI now treats the
typed preflight refusal as a definite non-send, clears only the matching
browser retry marker, and shows bounded reason codes under Diagnostics. Its
focused real Windows Chrome journey passed, including a distinct successful
retry and no private residue in the page. At that point the canary proved only
a clean managed restart on WSL, not a hard crash, Windows managed restart,
complete effect interception, or control of this desktop task.

The matching native Windows managed restart initially failed with `EEXIST`
after the first managed process exited: hard child termination had left the
private hosted-effect journal lock. The managed launcher now accepts an exact
parent IPC stop message and sends exact private stop messages to its hosted
client and gateway before exit. The client closes its effect journal and
recovery record; the gateway closes its session store. The strengthened canary
requires the hook connection and all three writer locks to be absent before
the second launch. It now passes on both WSL (pinned binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
and native Windows (pinned binary SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`):
first turn, clean stop, pre-resume refusal, exact resume, second turn with
`are_effect_request` still advertised, four local provider requests total,
zero external model calls, and no current desktop task touched. The final
wrapper suite passed 626/642 with 16 platform/browser skips and no failures.
The focused native Windows managed-launcher/client/recovery suite passed
80/97 with 17 platform skips and no failures.
This closes the clean managed restart test on these two hosts, not hard-crash
or power-loss recovery, arbitrary effect interception, installer behavior,
or control of this chat.

The hosted-effect journal now has a narrower abrupt-termination recovery
primitive. Its new digest-bound local writer record can be reclaimed only when
the recorded process is missing and an exclusive recovery marker holds the
exact unchanged lock. Live, legacy, altered, and interrupted locks fail closed.
After reopening, the hash-chained journal is validated and an unsettled intent
remains unresolved; no effect is replayed or inferred complete. Focused
abrupt-termination tests passed 6/6 on Linux and 6/6 on native Windows; the
full wrapper suite passed 629/645 with 16 platform/browser skips and no
failures. This is a journal primitive, not a whole managed-stack crash/restart
proof, uncertain-effect reconciliation, power-loss proof, or current-task
handover.

The disposable `managed-hosted-crash-restart-turn` canary now joins that
primitive to the actual managed launcher and pinned host. After a completed,
idle first turn it abruptly terminates only the hosted client. The manager
exits nonzero and closes its gateway; both the client recovery lock and effect
journal lock remain, as expected. Relaunch validates and reclaims those dead
writers, refuses a turn before exact thread resume, resumes the owned thread,
and completes one distinct second turn with `are_effect_request` still
advertised. WSL and native Windows runs both passed with four local provider
requests, zero external model calls, and no current desktop task touched.
This is an idle hosted-client process-crash proof, not a whole-machine crash,
power loss, an effect interrupted after intent, arbitrary effect coverage, or
same-task desktop handover.

An additional real-journal broker crash fixture stops a disposable process
after its effect intent has been fsynced and before its executor returns.
After dead-lock recovery, requests for both the same effect ID and a new one
return `hosted-effect.outcome-unknown` without assessment, approval, or
execution. The focused fixture passed on Linux and native Windows. This
proves refusal of an uncertain effect after a process death; it does not
reconcile whether the executor performed the effect or permit an automatic
retry. The managed in-flight canary below extends this to the actual launcher.
The final wrapper suite passed 630/646 with 16 platform/browser skips and no
failures. An initial full-suite run caught an Evolution startup test that
checked its writer lock before the signalled gateway's actual `close` event;
the fixture now waits for `close`, and its isolated and full-suite reruns pass.

The `managed-hosted-inflight-crash-turn` disposable canary now passes on WSL
and native Windows with the pinned `codex-cli 0.155.0-alpha.16.4` host. Its
local provider requests a harmless delayed command. The test-only fixture
accepts ARE's one-use approval, confirms one fsynced hosted-effect intent and
one matching gateway `dispatch-intent`, then kills the exact disposable
hosted-client PID while no outcome is recorded. Relaunch from the same private
state retains the unresolved intent. The pending turn recovers, then exact
thread resume is refused with `windows-client.hosted-effect-resume-rebind-unverified`;
there is no second gateway dispatch intent or model request. Both runs report three local
provider requests, zero external model calls, no current desktop task access,
and removed temporary configuration. This is a process-crash fail-closed
proof at the dispatch boundary, not proof the host command actually started,
machine power-loss durability, outcome reconciliation, human approval UI, or
control of the current desktop task. The discontinued TUI is not a target.

The read-only Companion now receives a separate bounded gateway count of
`cyberalchemy/hostedEffect/execute` requests whose durable gateway status is
`outcome-unknown`. The count is derived from the authenticated gateway session
observation, validated against the total unresolved mutation count through the
Node client, Rust bridge, and UI, and included in the thread snapshot digest.
Matching bounded backend-thread rows also carry a content-free per-thread
count; the aggregate remains visible when no Reasoning State row survives.
Threads labels both as unresolved *gateway dispatch outcomes*, never as
proof of host execution, journal reconciliation, a safe retry, or complete
host-effect coverage. Projector, gateway, authenticated observation, and
dashboard unit tests pass; the full wrapper suite passed 632/648 with 16
skips after the per-thread extension, Companion dashboard 45/45, and Linux
`cargo check` passes. The updated
browser fixture has not run: Linux Chromium cannot load `libnspr4.so`, and the
private desktop overlay is absent. No installed package was rebuilt for this
UI change.

Focused gateway, wrapper, method-policy, client and broker tests passed. The
full wrapper suite passed 594/608 with 14 skips and no failures before the
final broker recheck; the later focused broker/client/policy/journal suite
passed 87/87, and the full suite rerun after that recheck exited zero. The
[native loopback canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-dynamic-effect-canary.mjs)
passed against `codex-cli 0.155.0-alpha.16.4` (binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
It advertised the exact ARE tool, observed the host-bound call, returned an
explicit denial to the model, and removed its disposable configuration.
External model calls: zero. Current desktop task touched: false.

## Native Windows sandbox counterexample and fail-closed gate — 2026-09-29

The existing, model-free `native-command-exec-sandbox-canary.mjs` was run
against native Windows `codex-cli 0.155.0-alpha.16.4` (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
with its own temporary `CODEX_HOME`, no explicit `[windows] sandbox` setting,
and two disposable roots. A `command/exec` request with
`sandboxPolicy: {type: "readOnly"}` returned a successful write: the intended
`must-not-write.txt` contained exactly `UNSAFE`. The first run's cleanup raised
`EPERM` and hid its structured result; the canary now reports cleanup failures
separately. A second run returned
`canary.read-only-write-was-not-rejected`, with zero external model calls and
no current-desktop-task contact. A diagnostic rerun recorded exit code `0`
for that write, the sentinel present, and no effective Windows sandbox mode
reported by `config/read`; it did not print other configuration fields.
Its own temporary roots cleaned; the two
exact leftovers from the first run were inspected and removed. The first
root inherited a writable `CodexSandboxUsers` ACL; the child token was not
captured, so that ACL is a possible contributing condition, not a proven
cause. This is a counterexample for this exact host/configuration, not a
claim about every Windows sandbox mode.

The native Windows `--allow-hosted-effects` managed launcher, gateway CLI and
hosted-client CLI now refuse startup. The final hosted-command preparation
also refuses `hosted-effect.windows-sandbox-unverified`, so even a direct
gateway execution request cannot reach `command/exec` on Windows. The
ordinary and guarded text/Plan paths are unaffected. Focused native Windows
tests passed (the wrapper's exact dispatch refusal, 5/5 managed-session CLI,
and 2/5 execution tests with three Linux-positive cases skipped); direct
gateway and hosted-client startup each exited 2 with a typed refusal. The
full Linux wrapper suite passed 664/682 with 18 platform/browser skips, and
the same command canary still passed all four sandbox checks on the pinned
WSL binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
This is a safe stop, not Windows hosted-effect implementation completion.

The [official App Server contract](https://learn.chatgpt.com/docs/app-server#command-execution)
describes `command/exec` as running under the server sandbox. The
[official Windows sandbox guidance](https://learn.chatgpt.com/docs/windows/windows-sandbox)
describes distinct elevated and unelevated modes and their setup. This
disposable canary did not configure or establish either mode explicitly.
Before lifting the platform stop, verify the effective Windows sandbox mode,
setup and ACL posture in a disposable environment; rerun read-only and
inside/outside-root negative controls through the actual managed gateway;
then test restart, bypass and one-use approval semantics. No active host
setting or sandbox setup was changed in this probe.

An explicit test-only `--windows-unelevated` mode then wrote
`[windows] sandbox = "unelevated"` only into the canary's disposable
`CODEX_HOME`. The same pinned native Windows binary reported effective mode
`unelevated` through `config/read` and passed all four controls: read-only
execution, read-only write denial with no sentinel, workspace write inside
the disposable root, and sibling-root write denial. The canary cleaned its
temporary roots and made zero model calls. This shows the initial failure
depends on the missing effective mode in that fixture; it does not prove the
managed launcher binds this setting, that every Windows root has a protective
ACL, or that the full gateway/client approval path stays sandboxed after
restart. The fail-closed product gate remains in place until those joined
checks pass. Any earlier Windows installer without this source gate is
superseded for hosted-effect testing.

The guarded source is present in the [fresh unsigned Windows Companion
candidate](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-EFFECT-GUARD-PACKAGE-2026-09-29.md).
Subsequent source-only [managed Windows sandbox preflight
evidence](G1-WINDOWS-SANDBOX-MANAGED-PREFLIGHT.md) binds the effective mode
and four command controls to a disposable selected Windows-native checkout,
but does not attest the backend after restart or lift the effect gate.

## Open Questions

- Finish auditing the selected host's native effect surface beyond its three
  documented approval requests, including resumed threads and configuration
  drift. The opt-in wrapper now denies those three duplicate requests, but this
  is not proof of comprehensive effect mediation.
- Exercise real managed-client execution, interruption, restart and recovery
  on Linux and Windows. The installed-host join is Linux WSL and disposable;
  it does not establish Windows sandbox or durable recovery behavior.
- Extend the WSL and native Windows clean, idle-client-crash, and in-flight
  dispatch-intent proofs to whole-stack crash and explicit uncertain-outcome
  reconciliation. Legacy unbound records and unresolved journal intents remain
  refused.

Official protocol source: [Codex App Server](https://learn.chatgpt.com/docs/app-server).
