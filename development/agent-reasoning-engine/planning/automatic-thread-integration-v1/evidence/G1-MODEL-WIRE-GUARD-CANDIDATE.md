# G1 model-wire guard candidate — 2026-09-29

Status: bounded construction evidence; authority effect: none. The TUI is
discontinued. No current desktop task, active Codex configuration, external
model provider, installer, or Companion deployment was changed.

## Boundary tested

The [candidate guard](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/model-wire-guard.mjs)
accepts a Codex Responses request on a private loopback listener, removes
non-allowlisted function tools before sending it to a separate loopback
fixture, buffers the entire fixture SSE response, and forwards it to Codex
only after validating the completed output. Unknown events, unsupported
output items, unadvertised function calls, incomplete streams, mismatched
completed items, and oversized bodies fail closed with a 502 response.
The fixture path accepts only an explicit `127.0.0.1` upstream; an additional
untested-live path accepts only `https://api.openai.com/v1/responses` with a
separate bearer token. Neither path is enabled for a normal desktop session.

The [native canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-unadvertised-tool-canary.mjs)
adds opt-in `--probe-view-image --model-wire-guard` and benign control modes.
Its disposable `CODEX_HOME` points the installed host to the guard; the
guard points to the fixed local fixture. The fixture injects `view_image`
even though the guard removed it from the upstream tool catalog. The guard
rejects the complete response before forwarding any SSE bytes to Codex.

| Host | Guarded `view_image` call | Benign response |
| --- | --- | --- |
| Pinned WSL `codex-cli 0.155.0-alpha.16.4`, SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520` | One fixture request, guard blocked one response, zero forwarded, Codex turn `failed`, no image result | One fixture request, guard forwarded one response, Codex turn `completed` |
| Pinned native Windows `codex-cli 0.155.0-alpha.16.4`, SHA-256 `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f` | Same blocked response and failed turn | Same forwarded response and completed turn |

All four native modes made zero external model calls and left no live
configuration change. The focused guard suite passed 3/3; the original
unadvertised-exec WSL canary still passed after the extension. The guard's
response buffer ensures that a denied output item is never partly released
to the native host in these fixtures. This is stronger than the fail-open
MCP-hook path for this exact `view_image` probe, but only where every model
request is actually routed through the guard.

## Managed-session binding — 2026-09-29

The opt-in managed launcher starts the guard before launching the gateway,
passes a per-process `model_providers.<id>.base_url` override to the selected
backend, and verifies the effective provider ID and exact guard URL through
the restricted host's `config/read` result. It passes the same override to
the gateway backend process and owns the guard until shutdown. Unexpected
guard termination ends the managed session. The upstream and provider flags
must be paired and require a dedicated restricted host profile. No durable config or live
desktop profile is rewritten.

The pinned WSL and native Windows hosts each passed a disposable
`managed-wire-guard-turn` canary through the actual managed launcher, gateway,
hosted client and fixed loopback model fixture. Each run dispatched one managed
turn to a benign final fixture response; the fixture received an empty
model-facing tool catalog, and the report recorded
`BOUND_AND_FILTERED_ONE_TURN`. The same binaries passed a direct
per-process override probe that asserted the effective selected provider and
guard URL on `config/read`. All these probes made zero external model calls, did not
touch the current desktop task, and removed their temporary configuration.

## Client authentication and HTTPS candidate — 2026-09-29

The launcher now generates a per-session 256-bit guard client token. It supplies
that token only to the gateway/backend process environment and tells the
selected Codex provider to populate `X-ARE-Guard-Token` from that environment
variable. The preflight checks the exact effective `env_http_headers` mapping
alongside provider ID and guard URL. The guard rejects a missing token with
403 before reading or forwarding a request; it never forwards that client
header upstream. The pinned WSL and native Windows binaries each proved the
per-process environment-header mechanism and then passed benign and denied
guard probes plus the actual managed one-turn lifecycle canary. No token value
was printed or written to a repository or temporary config file.

An opt-in `--model-wire-upstream-key-env` flag names an environment variable
whose value remains in the launcher/guard process and is removed from child
environments. The guard permits that bearer token only for the exact OpenAI
HTTPS Responses endpoint, forbids redirects, and constructs a separate
Authorization header; the loopback fixture path forbids an upstream bearer
token. A mock-fetch unit test verified those boundaries without a network
call. [Official Codex configuration](https://learn.chatgpt.com/docs/config-file/config-advanced)
documents per-run provider overrides and environment-backed headers;
[OpenAI's API quickstart](https://developers.openai.com/api/docs/quickstart)
shows bearer authentication for Responses. The focused launcher,
restricted-profile, and guard suite passed 13/13. `OPENAI_API_KEY` was absent
in this test environment, so real-provider authentication and behavior remain
unverified.

## ARE-owned effect brokerage — 2026-09-29

With hosted effects explicitly enabled in the managed launcher, the guard
allows only the exact `are_effect_request` function name from the host's model
tool catalog. It still strips native `view_image`, user-input, MCP, and other
function tools. The pinned WSL and native Windows managed canaries each passed
two fixed-fixture paths through guard, gateway, hosted client, approval queue,
effect broker, and return to the model. In the decline path the fixture
command did not execute; in the accept path its success marker appeared in
the function-call output on the next model request. Both paths received only
`are_effect_request` in the upstream tool catalog and used zero external model
calls. This proves one bounded ARE-owned tool exchange, not arbitrary tool
coverage or user approval in a live session. The approval decisions were made
by the disposable canary, not by this desktop task.
The full wrapper package suite then passed 638 tests with 16 platform skips
and zero failures; the focused guard suite also passed after adding a wrong-token
negative case.

## Same-session continuation and bounded refusal — 2026-09-29

The disposable `managed-wire-guard-two-turn` canary passed on the pinned WSL
and native Windows hosts. Both managed turns reached the local fixture, then
the same owned thread returned to `idle`; the second turn had a distinct turn
ID. The fixture observed an empty model-facing tool catalog on both requests.
Each run reported `BOUND_AND_FILTERED_TWO_TURNS`, four total fixture requests
including the two preceding direct-host baseline requests, zero external model
calls, and no current desktop task or durable configuration change.

The first attempted continuation used an underspecified instruction and ARE
correctly blocked it with `selection.no-match`. That revealed a diagnostic gap:
the hosted client surfaced a verified ARE preflight block as HTTP 500. It now
returns HTTP 409 with a bounded reason-code list, without exposing preflight
residue, and clears only the exact pending turn intent. A focused client test
passed for this behavior. An explicit second objective then passed on both
hosts. This is a candidate test result, not evidence that arbitrary ambiguous
follow-ups can be autonomously resolved. The full wrapper package suite after
this change passed 639 tests, with 16 platform skips and zero failures.

## Clean managed restart — 2026-09-29

The disposable `managed-wire-guard-restart-turn` canary passed on the same
pinned WSL and native Windows hosts. After one guarded turn returned idle, the
managed launcher stopped cleanly without leaving the private hook, effect,
client, or gateway lock files. It then restarted, reported the same fixture
provider and verified loopback guard posture, resumed the owned thread, and
dispatched a second turn. The local fixture saw an empty model-facing tool
catalog before and after restart. Both runs reported
`BOUND_AND_FILTERED_AFTER_CLEAN_RESTART`, zero external model calls, no current
desktop task access, and temporary-state teardown. The test proves fresh
guard binding after a clean restart, not recovery from a crash or a live
provider exchange.

## Settled-turn client crash — 2026-09-29

The disposable `managed-wire-guard-client-crash-turn` canary also passed on
the pinned WSL and native Windows hosts. After the first guarded turn settled,
the test killed only the managed hosted client. The launcher stopped with a
nonzero exit; the client writer lock remained for recovery while the gateway
writer lock was reclaimed and no hosted-effect lock existed. A fresh launcher
recovered the owned thread, resumed it, and sent a second turn through a newly
verified guard with an empty fixture-facing tool catalog. The report recorded
`BOUND_AND_FILTERED_AFTER_CLIENT_CRASH`, zero external model calls, and
temporary-state teardown. This is not an in-flight turn crash, a guard-process
failure, or a live provider test.

## Guard failure stop and rebind — 2026-09-29

The managed launcher now accepts one exact private IPC fault-injection message
only when `ARE_INTEGRATION_TEST_MODE=1`. It closes the local guard for a
disposable canary; this is not a product control surface. The
`managed-wire-guard-fault-turn` canary passed on pinned WSL and native Windows.
After a settled guarded turn, guard closure caused the launcher to identify
`model-wire-guard` as the stopped component, exit nonzero, and clean the private
locks. A fresh launch verified a new guard, resumed the owned thread, and sent
the next turn to the local fixture with an empty tool catalog. Both runs made
zero external model calls and removed temporary state. This verifies a local
guard-closure stop boundary, not mid-request network loss or a real provider.
The full wrapper package suite after this change passed 640 tests, with 16
platform skips and zero failures.

## Guarded unsettled effect at client crash — 2026-09-29

The `managed-wire-guard-inflight-crash-turn` canary passed on pinned WSL and
native Windows. With hosted effects opted in, the guard exposed only
`are_effect_request` to the local fixture. The fixture requested a delayed
command; the canary accepted its approval and verified one durable effect
intent plus one gateway dispatch intent before killing the hosted client.
After restart, ARE recovered the turn identity but did not replay the effect
or make a fourth model request. It refused thread resume because the hosted
effect outcome could not be safely rebound. Both runs made zero external
model calls and removed temporary state. This proves fail-closed handling of
this unsettled brokered effect, not completion or reconciliation of it.

Compaction was a separate integration boundary at this point. The pinned host
catalog named `thread/compact/start`, but the direct wrapper still rejected it.
The later managed gateway candidate and its result are recorded below.

## Direct pinned-host compaction contract — 2026-09-29

The disposable `native-compaction-probe` passed on both pinned WSL and native
Windows hosts with the local fixture provider and zero external model calls.
After two completed fixture turns and a host restart/resume,
`thread/compact/start` acknowledged with `{}`. The host made exactly one more
provider request, with an empty tool catalog, and emitted `item/completed` for
a `contextCompaction` item on a *new* turn. The completed item carried `id`
and `type`, but no `status`; the matching `turn/completed` reported `completed`.
A subsequent ordinary turn completed and restored the pre-compaction tool
catalog. The canary tears down its temporary profile and never touches the
current desktop task.

The wrapper package suite still passed 640 tests with 16 platform skips and
zero failures after the direct probe was added. This result alone did not
admit managed compaction.

This clarified why simply admitting the method would be unsafe: the gateway
then bound compaction observations to an ARE-accepted `turn/start`, while
manual compaction creates a distinct turn without one. It needed its own
durable dispatch/turn binding, guarded provider path, and recovery policy.
The direct-host probe did not exercise those managed paths or certify
live-provider behavior.

## Managed compaction candidate — 2026-09-29

The gateway now admits `thread/compact/start` only for a gateway-owned,
idle, acknowledged-continuity thread with a stable request key. Direct wrapper
access remains rejected. A distinct durable `compaction-turn-accepted`
receipt binds the host's new turn to the exact compact dispatch and `{}`
acknowledgement. The gateway requires the matching `contextCompaction`
item before accepting a successful terminal turn; an unsettled compaction
blocks later backend mutations, including across recovery. The hosted client
has an authenticated local endpoint for this operation, but the first
read-only Companion dashboard does not expose a compaction control.

The first managed WSL probe stopped after receiving a scoped
`thread/tokenUsage/updated` event on the compaction turn. The direct pinned
host probe confirmed that telemetry is part of the actual sequence. The
gateway now forwards only that additional scoped telemetry alongside the
compaction turn and item lifecycle; unknown compaction-turn events remain
fail-closed. The `managed-wire-guard-compaction-turn` canary then passed on
both pinned WSL and native Windows hosts. Each disposable run proved an empty
model-facing tool catalog on the compaction request, a distinct turn with
matching completed item and terminal receipts, and a subsequent ordinary
turn returning idle through the same guarded session. Both runs made zero
external model calls, touched no current desktop task, and removed temporary
configuration. The wrapper package suite passed 647 tests with 16 platform
skips and zero failures after this integration.

The read-only Companion now accepts this new durable receipt in both its
Adapters and Threads projections. Adapters distinguishes accepted compaction
turns from completed items; a Threads row does the same when a Reasoning
State row exists for that backend thread. The UI does not infer that an
accepted turn finished or that the current desktop task is controlled.
The source dashboard suite passed 47/47, the offline Tauri Rust check passed,
and the wrapper suite again passed 647 tests with 16 platform skips after
these projection changes. The existing browser smoke also passed on Windows
Chrome with new acceptance-versus-completion checks in both panels and no
uncaught page errors. A newly packaged or installed Companion has not been
tested for this field.

## Accepted compaction history recovery candidate — 2026-09-29

The pinned WSL and native Windows hosts each returned the exact completed
compaction turn in `thread/read` with `includeTurns: true`, `itemsView: full`,
and one `contextCompaction` item after the terminal notification. Both
disposable probes made zero external model calls. The gateway now uses this
shape only when a durable `compaction-turn-accepted` receipt already binds
the exact request, thread, response, and turn. It writes a separate
content-free `compaction-history-verified` receipt before releasing later
mutations. A missing acceptance, partial history, wrong turn, non-completed
status, absent or ambiguous item, or conflicting native receipt remains
fail-closed. The receipt survives store compaction and reopen; compaction
acceptance is not silently pruned under receipt pressure. Capacity exhaustion
still stops the session and needs a separately designed bounded retention
policy.

Adapters and Threads now display recovered completion separately from native
item notifications. A negative test also exposed and repaired the store's
fault-replay contract for contradictory compaction evidence. The wrapper
suite passed 650 tests with 16 platform skips and zero failures, the dashboard
suite passed 47/47, and the offline Tauri Rust check passed. The current
source dashboard browser smoke passed on Windows Chrome, including recovered
history labels in both panels and no uncaught page errors. This remains
source-level and disposable-host evidence, not an installed Companion or
live-provider claim.

## Opportunistic automatic compaction recovery candidate — 2026-09-29

The durable store deliberately retains hashed thread references, not the raw
backend thread ID needed for `thread/read`. On the next owned mutation with
that exact thread ID, the gateway now holds the mutation and makes a bounded
internal read of the accepted compaction's full history. It dispatches the
original mutation only after the exact completion proof is durably recorded.
An active or incomplete history returns an explicit unsettled result; a later
attempt may retry after a one-second cooldown, up to eight reads per gateway
session. Concurrent and foreign-thread mutations do not launch extra reads.
If the client attachment changes while the read is in flight, the original
mutation is not dispatched and a new request is required.

This internal probe intentionally avoids a generic history-audit marker: it
examines only the unsettled accepted compaction and cannot authorize an effect
before durable proof. A crash during that read therefore leaves the original
mutation undispatched without adding an unrecoverable pending-audit quarantine.
The synthetic recovered-session test covers an active first response and a
completed retry that releases an owned `thread/resume`; it also asserts no
pending audit. The wrapper suite passed 651 tests with 16 platform skips and
zero failures. After this change, the disposable managed-compaction canary
still passed on pinned WSL and native Windows hosts, each with zero external
model calls, distinct compaction turn/item evidence, and a subsequent idle
turn. Those canaries do not simulate a process crash between acknowledgement
and completion.

## Durable compaction fault propagation — 2026-09-29

The recovered-session negative case found a cross-layer mismatch: the store
accepted compaction conflict faults, but reconnecting transport and hosted
Windows client allowed only ordinary turn-fault reasons. The closed fault
schema and reason set now have one shared implementation owner. Both
`gateway.compaction-history-conflict` and
`gateway.compaction-item-history-conflict` are accepted only with an
authenticated resume token and a valid durable fault digest; other reason
strings remain rejected. Tests cover a real gateway conflict followed by
reconnect, the hosted read-only stop view, and the Windows client executable's
stop page. The full wrapper suite passed 652 tests with 16 platform skips and
zero failures after this change.

## Disposable native-history gateway recovery probe — 2026-09-29

The `native-compaction-gateway-recovery-probe` now runs against pinned WSL and
native Windows Codex `0.155.0-alpha.16.4` hosts. It first obtains a real
completed compaction turn with a full `thread/read` history and a
`contextCompaction` item. It then closes that direct host, seeds only the
corresponding accepted-but-unterminated receipt into a disposable file-backed
gateway session, compacts and reopens the store, and resumes the owned thread
through a new gateway instance. Both hosts passed: the gateway durably wrote
the exact `compaction-history-verified` receipt before the held resume
completed, left no pending generic history audit, and caused no additional
model request. Temporary configurations and session stores were removed.

This is stronger than a synthetic host-response test but is **not** a genuine
kill between acknowledgement and terminal notification. The acceptance
receipt is deliberately seeded from real native history, not captured during
a crashed gateway dispatch. Both probe reports explicitly record
`gateway_recovery_seeded_acceptance: true` and
`gateway_recovery_process_kill_tested: false`. The final wrapper suite passed
652 tests, 16 platform skips, and zero failures.

## Actual gateway interruption at compaction acceptance — 2026-09-29

A second disposable mode now creates and runs its test thread through the
gateway, starts a real native compaction, and SIGKILLs only the disposable
gateway child immediately after its file-backed store fsyncs
`compaction-turn-accepted`. Its event loop is held for one second before the
kill, so terminal host events cannot be consumed by that gateway while the
native host can finish. The parent verifies the durable store has exactly one
compaction acceptance and no terminal receipt for that turn, terminates the
old disposable backend, reads the exact completed turn and full
`contextCompaction` item from native history, then starts a fresh gateway and
resumes the same owned thread. Both pinned WSL and Windows hosts passed with
zero external model calls or extra recovery model requests. The reports set
`gateway_recovery_seeded_acceptance: false` and
`gateway_recovery_process_kill_tested: true`; temporary state was removed.

The Windows run exposed a real authenticated-delivery ordering defect. A
fresh host event could overtake two retained deliveries during reconnect,
producing a sequence gap. The gateway now queues new deliveries until the
handshake has been sent and drains retained and new deliveries in sequence.
A focused regression test covers that ordering, and current-attachment stable
request keys remain eligible for delivery. The surviving client carries its
acknowledged cursor and an exact alias for the interrupted compaction request.
The existing restart test was corrected to acknowledge its first response
before asserting that the next response is first after reconnect. The full
wrapper test command exited successfully after this repair; the focused
file-backed session-store suite passed 34/34 and the new replay-order test
passed. Both native crash canaries were rerun after the final gateway change.
This proves a controlled gateway-process kill, not a machine power loss,
simultaneous backend crash, Windows directory-flush durability, live-provider
exchange, or current desktop task takeover.

## In-flight guard cancellation — 2026-09-29

The guard now gives each accepted HTTP request its own abort controller. Closing
the guard aborts all in-flight upstream fetches before closing client sockets;
an unexpected client disconnect aborts only that client's upstream fetch. A
late upstream response is checked against the abort state before validation or
forwarding. The guard reports bounded `model-wire.guard-closed` or
`model-wire.client-disconnected` reasons, including when the native fetch
library returns a different low-level socket error.

Seven focused tests passed under both WSL Node and native Windows Node. They
include mock-fetch cancellation for both paths and a real loopback SSE stream
whose provider-side connection closed during guard shutdown, with zero response
forwarding. The full wrapper test suite exited zero after the final change.
The pinned WSL and native Windows `managed-wire-guard-fault-turn` canaries also
passed again on the final source: each stopped the managed session on a guard
fault, rebound a fresh guard after restart, completed a second disposable turn,
made zero external model calls, and did not touch this desktop task. Those
managed canaries injected the guard fault between settled turns; the mid-stream
proof is at the guard HTTP boundary, not a full managed-turn crash test.

The follow-up `managed-wire-guard-midstream-fault-turn` canary closes that
specific composition gap on both pinned WSL and native Windows hosts. Each
started one ARE-owned managed turn, held its loopback provider SSE stream open
after the first `response.created` frame, and injected a test-only guard fault
through the managed launcher's private IPC. The launcher attributed the stop
to `model-wire-guard` and exited nonzero; the provider-side stream closed,
there was no fourth model request, and all temporary configuration was removed.
Both reports recorded `BOUND_WITH_UPSTREAM_STREAM_OPEN` followed by
`UPSTREAM_CLOSED_AND_SESSION_STOPPED`, zero external model calls, and no touch
of the current desktop task. This does not prove crash-time semantic turn
reconciliation, a real provider's cancellation/billing behavior, or safe
automatic continuation after a mid-request guard loss.

The previously built Windows Companion installer predates this guard change.
Its staged UI checks remain evidence for the prior source snapshot, not for
the newly changed guard bytes. No installer was rebuilt or installed in this
slice.

## Fresh staged Windows Companion package — 2026-09-29

A subsequent, separately bounded UI slice rebuilt an unsigned Windows
installer from the guard-cancellation source. Its retained build stage
contains guard bytes matching the current source SHA-256. The stage passed
native bundled-feature checks, default and live-adapter WebView2 journeys,
and a managed-session startup check that kept Windows hosted turn ingress
paused. The exact artifact, digest, test scope, and limits are recorded in the
[Windows package evidence](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-GUARD-CANCELLATION-PACKAGE-2026-09-29.md).
This does not supersede the prior-slice statement above: the installer was
rebuilt only afterward. Its NSIS payload was not extracted or installed, and
its UI checks did not exercise a real-provider guarded turn.

## Documented refusal-event fixture — 2026-09-29

The [official Responses streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses)
and [streaming event reference](https://platform.openai.com/docs/api-reference/responses-streaming/response/refusal)
include `response.refusal.delta` and `response.refusal.done`. The guard now
admits only those additional text-only event names with bounded item/index
and text-field shapes; it still buffers the full response and validates the
completed output item before forwarding any bytes. A fixture verifies a
completed refusal message, rejects a malformed refusal delta, and confirms
that surrounding an unadvertised `view_image` call with refusal frames does
not bypass the function-call block. Focused guard tests passed 8/8 on WSL
and native Windows Node; the full wrapper suite exited zero. The pinned WSL
`managed-wire-guard-turn` canary also passed after this change with an empty
fixture-facing tool catalog, zero external model calls, and no current-task
access. It used a benign output-text fixture, not a provider refusal.

This is source and fixture compatibility evidence, not a captured provider
event corpus or a live authenticated model exchange. The Windows installer
described immediately above contains the pre-refusal-event guard source; it
was not rebuilt for this later change, and its source-match claim applies to
the build-time snapshot only.

## Complete CRLF stream framing — 2026-09-29

The guard's frame parser already accepted CRLF separators, but its final
completeness check accepted only LF-LF. That inconsistent check now accepts
either complete LF or CRLF SSE framing and still rejects a truncated final
frame. Focused guard tests passed 9/9 on WSL and native Windows Node; the
full wrapper suite exited zero. This remains a parser/fixture result, not a
captured provider stream. The staged Windows installer above predates this
additional source change too.

## Strict UTF-8 response decoding — 2026-09-29

The guard previously parsed `Buffer.toString("utf8")`, which replaces malformed
bytes, but forwarded the original raw SSE bytes after validation. It now uses
fatal UTF-8 decoding and rejects invalid byte sequences before parsing or
forwarding. A regression fixture corrupts the same text byte in added, done,
and completed items, so lossy decoding would still appear internally
consistent; the guard rejects it as `model-wire.response-invalid`. Focused
tests passed 10/10 on WSL and native Windows Node, and the full wrapper suite
exited zero. This closes only the lossy-decoding mismatch, not all provider
event-variant or streaming-UX questions. The retained Windows installer is a
prior-source snapshot and was not rebuilt for this change.

## Strict UTF-8 request decoding — 2026-10-01

The model-wire guard used fatal UTF-8 decoding for responses but lossy
`Buffer.toString("utf8")` for requests. It now rejects malformed request bytes
as `model-wire.request-invalid` before parsing, rewriting the offered tool
catalog, or forwarding anything upstream. The direct regression fixture and
authenticated loopback HTTP test pass; the latter observes no upstream request
for the malformed body. The focused guard suite passed 13/13, and the full
wrapper package regression suite exited zero.

The disposable pinned-WSL installed-host `managed-wire-guard-turn` canary then
passed against `codex-cli 0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`):
one guarded managed turn, an empty model-facing tool catalog, zero external
model calls, no access to this desktop task, and temporary configuration
removed. The canary did not itself send malformed bytes; that case is covered
by the direct and HTTP fixtures. The prior Windows package does not contain
these changed source bytes. Exact current-task handover and real-provider
compatibility remain unverified.

## Opt-in native Windows guarded text-only ingress — 2026-09-29

The managed launcher now offers an explicit `--windows-guarded-text-turns`
candidate. It requires the restricted host profile and verified model-wire
provider override, forbids hosted effects and the test-only hook probe, and
leaves default Windows ingress paused. The gateway and hosted client agree
on the unpaused candidate before readiness; the Companion reports it as a
launch-declared boundary, not proven host-task control. The exact native
fixed-loopback turn, clean restart, parent-loss, default/opt-in WebView2, and
packaging checks are recorded in the
[Windows candidate evidence](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-GUARDED-TEXT-CANDIDATE-2026-09-29.md).
The single-turn and restart canaries passed without the previous test-only
Windows bypass, with an empty model tool catalog, zero external model calls,
and no touch of this desktop task. This is a narrow new candidate, not
complete Windows host-effect coverage or a real-provider result.

## Text-only response-part boundary — 2026-09-29

The guarded text-only candidate previously filtered function tools but accepted
any `message.content` part in a completed model response. It also allowed an
early `response.content_part.added` or `response.output_item.added` to carry a
non-text part before a later text-only completion. Because the guard buffers
the full SSE response before forwarding, these parts can now be rejected
without releasing partial events to Codex.

The guard now accepts completed assistant message parts only as text or textual
refusal, checks early message/content-part frames for the same modality, and
requires text-bearing delta/done fields to be strings. Focused fixtures reject
image, audio, empty/malformed completed content, early image parts, and an
object-valued text delta; a two-part text message and an ordinary text-part
event still pass. The loopback HTTP test confirms that a denied image message
returns 502 without forwarding its image URL.

The focused guard suite passed 12/12; the full wrapper suite passed 663 with
16 platform skips and zero failures. A disposable managed turn on pinned WSL
`codex-cli 0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
then reported `BOUND_AND_FILTERED_ONE_TURN` with an empty model-facing tool
catalog, three fixture model requests, zero external model calls, and no
current-desktop-task access. The Windows installer and native Windows host were
not rebuilt or retested for these changed source bytes. This is a bounded
message-event guard, not a captured live-provider corpus or universal output
schema proof.
The subsequent [current-source Windows package check](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-TEXT-BOUNDARY-CURRENT-2026-09-29.md)
binds these guard bytes to a fresh unsigned stage. Native Windows guard,
Codex denial/benign, seven-panel WebView2, and guarded/default managed-session
fixtures pass; the installer was not extracted or installed.

## Opt-in guarded Plan-mode user input — 2026-09-29

The pinned Codex host advertises `request_user_input`, but a native Windows
managed turn in Default mode returned `request_user_input is unavailable in
Default mode` without presenting a prompt. Merely forwarding the tool through
the model-wire guard was therefore insufficient. The managed launcher now
offers a separate `--windows-guarded-user-input --guarded-plan-model <model>`
option, requiring the existing guarded-text, restricted-profile, and exact
provider binding. The hosted client binds every turn in that opted-in session
to Plan collaboration mode with the explicit model and built-in Plan
instructions. The guard forwards only `request_user_input`; it still removes
all other model tools and buffers/validates full responses before Codex sees
them. Normal guarded-text sessions retain an empty model tool catalog, and
default Windows ingress stays paused.

The pinned WSL Codex `0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
passed the fixed-loopback guarded user-input canary: two guard-forwarded
requests, zero guard blocks, authenticated hosted answer returned to the
fixture model, resolved server request, and completed turn. The pinned native
Windows Codex of the same version (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
passed `managed-wire-guard-user-input-turn`: managed startup, Plan-mode prompt,
authenticated hosted answer, exact model-facing tool catalog
`["request_user_input"]`, four local fixture model requests including the two
restricted-profile baseline turns, and zero external model calls. The native
Windows `managed-wire-guard-turn` control passed with an empty tool catalog;
focused WSL tests passed 94/94 and native Windows launcher tests passed 5/5.
This source change was not copied into the earlier unsigned NSIS artifact,
installed, or tested with a real provider. It does not activate the current
desktop task or permit an effect tool.

## Pinned WSL lifecycle recheck — 2026-10-04

Current source was retested after the desktop restart against the same pinned
WSL `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
Four `restricted-lifecycle-canary.mjs` modes passed: guarded compaction kept
the model-facing tool catalog empty and completed a distinct compaction turn
before a subsequent ordinary turn; guarded effect decline did not execute its
fixed command; guarded effect accept returned that command's result to the
fixture model; and an accepted in-flight effect at client crash retained one
durable intent/dispatch while restart refused unsafe resume without replay.
Each canary reported zero external model calls, no current-desktop-task access,
and removal of its disposable configuration. These are current-source WSL
checks, not a fresh Windows package, live-provider run, full effect-boundary
proof, or handover of this task.

## Claim ceiling and next construction

This does not prove a real authenticated upstream exchange, provider compatibility,
streaming UX, all Responses event variants, multi-turn tool exchange beyond
the single brokered call or two benign turns,
in-flight effect reconciliation, proactive compaction recovery before an
owned client request, recovery without an exact accepted receipt, or a
simultaneous machine/backend failure between compaction acknowledgement and
completion,
guard failure handling during a real model
request, universal host-tool control,
current-task writer handover, or installed Companion integration. The
prototype strips all tools by default. Separate opt-ins admit the tested
ARE-owned effect tool or Plan-mode `request_user_input`; the new user-input
path is not a Default-mode capability and is not in the earlier installer.
Default managed Windows ingress remains paused; the separately bounded
text-only option does not lift the pause for hosted effects or establish
current-task control.

The next implementation boundary is to validate the explicit HTTPS path with
an authorized provider credential and a compatible Responses event corpus,
extend the bounded ARE-owned broker to the required interaction set, and test normal,
resume, compaction failure/restart, and current-task handover paths before reconsidering ingress.
An unguarded alternate provider route must remain blocked.

## Open Questions

- Which supported provider/authentication configuration can route the managed
  Codex host through a local guard while retaining the user's intended model?
- Which Responses event variants must be admitted for real model behavior,
  without allowing an effect-bearing event before complete validation?
- How will the launcher prove that every request on a crash-recovered or
  compacted thread uses the newly bound live guard and reject a missing guard?
- How should guarded Plan-mode user input and the separately opted-in ARE
  hosted effect dynamic tool coexist without weakening either thread/turn
  ownership or approval semantics?
- How should Plan-mode input and its explicit model be displayed and rebound
  after managed-session restart before claiming installed-client readiness?
