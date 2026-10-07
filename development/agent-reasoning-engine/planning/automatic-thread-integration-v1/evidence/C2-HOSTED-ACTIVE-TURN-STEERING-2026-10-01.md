# C2 hosted active-turn steering boundary

Status: bounded construction, local fixtures, and disposable installed-CLI
canary evidence. Authority effect: none.
The TUI is discontinued; this slice belongs to the hosted client and future
Companion/dashboard path.

## Result

The hosted client now accepts `POST /api/turns/steer` only for a loaded,
rejoined thread with a locally retained accepted-turn receipt and an exact
currently active host turn ID. It accepts only the four expected request
fields, a bounded text correction, and a stable request key. It serializes
with turn starts, honors model-entry pauses, and uses the same fresh MCP
catalog and hook-trust preflight as turn start where configured. It signs the
exact steering parameters as hosted input when attestation is available.

The shared wrapper refuses unverified hosted steering before host dispatch.
The restricted gateway consumes a fresh per-thread MCP catalog for steering,
including keyed replay handling. An accepted response must identify the exact
expected turn; this endpoint does not infer acceptance from transport delivery
alone.

The gateway now binds each new durable steering acceptance to the stable
request-key digest and exact request binding, while preserving older
content-free observations as legacy evidence only. A read-only outcome query
can report `settled-accepted` only when that keyed acceptance and the
completed response agree on the expected turn. It distinguishes a still
unknown outcome from a host acceptance that ARE has not reconciled, without
redispatch. The hosted client exposes this as a bounded, owned-thread status
endpoint that remains available after the active turn ends.

## Verification

`node --test test/hosted-input-attestation.test.mjs test/wrapper.test.mjs
test/windows-client-host.test.mjs test/gateway.test.mjs
test/gateway-session-store.test.mjs` passed 366/366 in
`implementation/agent-reasoning-engine/packages/codex-app-server-wrapper`.
Fixtures cover signature binding, unverified input denial, wrong or terminal
turn denial, client policy-override denial, exact parameters and stable key,
and missing restricted catalog.

The selected WSL/Linux `codex-cli 0.155.0-alpha.16.4` also passed the
disposable managed canary with `--steering`, both with and without
`--requirement-tracking` (the tracked mode passed again after adding an exact
gateway-journal assertion). The private provider held the first response while
the hosted API submitted a correction to the active turn. The API returned the
same turn ID, the gateway durably recorded `steer-accepted` for the matching
hashed thread and turn, and the turn then completed. A managed restart
rejoined that thread, rejected a conflicting receipt replay, and completed a
second turn on the same objective. The tracked run retained its explicit
requirement seed. Each run used three local model calls and zero external
model calls; disposable state was removed afterward.
The later tracked run also replayed the same correction key while the provider
was held and observed only one host acceptance receipt; its read-only outcome
was `settled-accepted` both before and after the managed restart.

```sh
node scripts/managed-objective-restart-canary.mjs /absolute/path/to/codex --steering
node scripts/managed-objective-restart-canary.mjs /absolute/path/to/codex --requirement-tracking --steering
```

Run from `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper`.

The owned hosted browser now exposes a separate **Steer active turn** action.
Before calling the existing guarded endpoint it saves the exact thread, turn,
request key, and a SHA-256 text digest in tab-local storage, never the guidance
text. A lost HTTP response triggers only the keyed read-only status query; no
automatic steer retry occurs. `unrecorded`, pending, host-accepted-but-unreconciled,
unknown, and unverified outcomes keep new sends and steers blocked. A later
`settled-accepted` or definite rejection clears only the matching local key.
The browser's ordinary Send and active-turn Interrupt remain distinct from
Steer. The explicit hosted asset allowlist now serves the new checkpoint module;
without that entry the browser stayed at Connecting.

A real Chromium fixture lost the steer HTTP response and first status read,
reloaded the page, observed an `unrecorded` hold with exactly one upstream
steer, and then cleared the hold through a manually requested exact-key
`settled-accepted` read. The reloaded browser also refreshed the host's active
turn state before re-enabling Steer. No guidance was resent, and the stored marker
contained no guidance text. The full wrapper suite passed 720/727 tests with
seven platform-specific skips; the product doctor reported PASS. This is a
browser fixture and source-level construction check, not a native Windows
WebView2 or installed-package proof.

A later bounded construction slice moved the uncertain key across the host
restart boundary. The private recovery record is now v6 and persists one
content-free pending steer identity (owned thread, exact turn, stable request
key, text digest, timestamp) before `turn/steer` dispatch. A v5 record migrates
after gateway rebind without dropping hosted thread bindings. The authenticated
host state exposes only that marker, so a new browser tab or origin can adopt
it without the original tab storage. New sends and steers remain blocked while
it is unresolved. The status endpoint remains a read-only exact-key gateway
query; a separate exact-key acknowledgement endpoint clears the host marker
only after a terminal keyed gateway outcome. A lost acknowledgement can be
queried and acknowledged again without redispatching guidance.

The Chromium fixture now discards the tab-local steer key before reload after
the host has recorded an uncertain dispatch. The browser adopts the host key,
holds on an unrecorded status, then confirms and acknowledges one terminal
outcome with exactly one upstream steer call. Recovery-state fixtures prove the
key survives process restart, wrong-key clearing is refused, and v5 binding
migration is lossless. A reconstructed hosted process with the same private
recovery file exposed the same pending key, acknowledged a terminal gateway
outcome, and reopened with no pending key. A separate host fixture proves
status reads do not clear the marker and that new sends remain blocked until
exact terminal acknowledgement.
The final full wrapper suite passed 724/732 tests with eight platform-specific
skips and no failures on the WSL/Linux fixture host. No TUI work is included.

The read-only Companion Threads view now receives a content-free boolean from
its existing managed-hosted-client observation channel for each owned thread:
whether that hosted client retains a pending steer checkpoint. It shows a
short status on that thread card only while the observation is current; it
does not receive the request key, guidance text, or permission to send or
acknowledge. The existing gateway Reasoning State remains a separate source.
The Companion dashboard suite passed 52/52 and its Rust bridge passed offline
`cargo check` on Linux. This is source-level UI evidence, not a refreshed
Windows installer or WebView2 visual check. This Companion observer requires
the updated hosted-client observation field; an older hosted client is shown
as incompatible rather than falsely implying no pending checkpoint.

The retained Windows Node 26.8.1 runtime then ran exact source copies from an
isolated `D:` test directory. A new native Windows test passed for a
DPAPI-sealed pending steer key across private-record reopen, including
wrong-turn clear refusal and no plaintext key or digest in the sealed file.
Two native hosted-client tests passed: an uncertain key blocks new sends until
exact terminal acknowledgement, and a reconstructed hosted process restores
and clears that key through the private recovery file. These are native
source-level tests, not an installed manager, WebView2, or power-loss proof.

A later native Windows joined canary ran the current standalone development
closure against the retained Windows Codex CLI through the restricted managed
session. It exercised an active-turn steer, completed the held turn, stopped
the manager, rejoined the same objective after restart, and rejected a
duplicate dispatch. The run reported two objective events, three local model
calls, zero external model calls, and no remaining staged manager/CLI process.
The staged product doctor passed. This closes the ordinary successful-response
Windows steer/restart path; it does not exercise a lost steer response or a
pending steer checkpoint through native host restart. The isolated build/test
stage was retained under `D:\are-win-focus-YDTVzk\native-joined-D8Mfun`.

A fresh unsigned Companion Windows build included the native orb and current
standalone ARE closure (820 files; core closure digest
`147a56fd55af855c7168c3f7826301c20cc61a0838aaf5d23c1d357f33642b35`).
The first staged WebView2 run displayed the retained-steer cue but failed the
existing first-viewport assertion: the active thread card began at 558 px in
a 760 px viewport. A bounded layout correction retained the scope warning
before gateway continuity, moved only the secondary hosted-client status below
the thread cards, and compacted the Threads heading and spacing. The rebuilt
staged executable then passed the full orb/dashboard WebView2 journey,
including all seven panels, first-viewport active Reasoning State, the
read-only checkpoint cue, navigation/focus, skin persistence, and loss of the
gateway observation path. Its thread screenshot shows the cue fully visible
without scrolling. The 52 dashboard source tests and 13 native bundled-feature
checks also passed. No TUI was built or tested.

The retained unsigned NSIS artifact is
`D:\are-win-focus-YDTVzk\ARE_Companion_steer_checkpoint_layout_20261001_x64-setup.exe`
(SHA-256 `c365c4100f74a94f808ba223c0d9112f2e567b3032a32cb6704b65400c29cff7`).
This older artifact is superseded: its retained incremental input stage may
have included an extra test executable under the bundled `resources` tree.
Do not promote or install it as the current candidate.
The WebView run used the rebuilt staged executable and adjacent staged ARE/Node
resources, not an installed or extracted copy of that NSIS payload. The
retained screenshot is
`D:\are-win-focus-YDTVzk\steer-checkpoint-threads-pass-20261001.png`.

## Lost successful HTTP response across managed restart

The first host-owned steer checkpoint implementation had a real loss window:
after an exact `turn/steer` RPC success, the hosted server cleared its durable
key before writing the HTTP response. A lost HTTP response plus a replaced
browser could therefore leave no host-owned key for reconciliation. The hosted
server now retains that content-free key after RPC success and clears it only
on the separate exact-key acknowledgement, which itself requires a terminal
gateway outcome. The browser performs the same status-and-ack sequence after
an ordinary successful response; a failed status or acknowledgement leaves
both keys in place and blocks new sends/steers. No guidance is resent.

The native Windows joined canary now forwards one steer through a disposable
loopback HTTP proxy, waits for the hosted server's `202` response, and destroys
the proxy's client response without delivering it. It observes one durable
gateway acceptance, completes the held turn, cleanly restarts the guarded
manager and selected Codex CLI, finds the exact pending key in the recovered
host, rejects both a new turn and a steer replay, reads `settled-accepted`,
and acknowledges the exact key. The same objective then continues for a
second turn. The run reported two objective events, three local model calls,
zero external model calls, and `current_desktop_task_control:false`. The
ordinary successful-response Windows canary also passed after the new ack
boundary. No staged manager or CLI process remained after either run.

The full wrapper suite passed 709/733 with 24 platform/environment skips and
no failures. All 17 rendered hosted-browser tests passed in an isolated
Playwright container, including both an unknown gateway response and a
successful hosted response lost at the HTTP edge. The focused hosted-client
test proves the read-only per-thread observation remains true after `202` and
becomes false only after exact acknowledgement. The updated standalone
development closure (820 files; digest
`82bc8b722bf73e926a864fedabfc6922dd162f0e7265a09efb45b579b6e011bb`)
passed native Windows product doctor. This is a deterministic clean-restart
and lost-HTTP-response proof, not an abrupt power-loss or unknown-gateway-
delivery proof.

The refreshed unsigned NSIS artifact is
`D:\are-win-focus-YDTVzk\ARE_Companion_steer_ack_20261001_x64-setup.exe`
(SHA-256 `85d718a24264fc37ed7d7d4335b7d615f0d0885e7f68709c75dafb8e559f3850`).
Before bundling, the retained stage's resource top level was exactly `are`,
`cross-os-development`, `native-orb`, and `node`; the accidental test executable
was outside that input. The refreshed staged ARE closure passed native Windows
doctor with core source digest
`5fef5ef4472488b422a84ac8db652917cf159082ace41887d31398cf9f63adf8`.
Its 13 native bundled-feature checks passed, as did a staged WebView2 orb and
dashboard journey with the read-only checkpoint visible in the active thread's
first viewport. The temporary WebView test executable was moved back out of
`resources` afterward. This tests the same built executable with adjacent
resources, not extracted installer contents or an installed lifecycle.

## Gateway-to-hosted-client response-loss fixtures

A joined gateway/RPC fixture now forwards one exact-key `turn/steer` to a fake
Codex host, receives its matching accepted response, and discards only the
gateway's successful RPC delivery before the client observes it. The client's
request times out, while a separate exact-key gateway status read returns
`settled-accepted`; the upstream dispatch count remains one. A separate
file-backed hosted-client fixture makes its steer RPC fail after dispatch,
reconstructs the host from its private recovery file, and proves the same key
blocks new turns and steer replay while gateway status is `outcome-unknown`.
Only after the fixture changes the gateway response to `settled-accepted` does
an exact acknowledgement clear the host key. That second fixture stubs the
gateway status; the first uses the real gateway and RPC transport. Together
they cover the two local boundaries, not an abrupt native multi-process loss.
The wrapper suite passed 711/735 with 24 platform/environment skips and zero
failures; focused gateway and hosted-client suites passed 153/153 and 93/93.

## Abrupt native hosted-client loss after accepted steer

The disposable native Windows guarded canary now has an explicit
`--abrupt-hosted-client-loss` mode. It first loses the successful hosted HTTP
steer response, observes one durable exact-turn gateway acceptance, lets the
held turn complete, and then kills only the managed launcher's reported
integration-test hosted-client PID before the pending steer is acknowledged.
The launcher stops its remaining children; a new manager rejoins the same
thread and objective, reads `settled-accepted` for the retained exact key,
rejects a new turn and steer replay before acknowledgement, and clears the key
only after the terminal acknowledgement. The run reported two objective
events, three local model calls, zero external calls,
`lost_steer_http_response_recovered:true`,
`abrupt_hosted_client_loss_recovered:true`, and
`current_desktop_task_control:false`. Native staged product doctor passed;
the full wrapper suite remained green at 711/735 with 24 skips and zero
failures. This proves a real hosted-process crash after gateway acceptance and
before acknowledgement, not a crash before the gateway-to-hosted RPC response
or a power failure of the whole machine.

## Native crash before the hosted RPC consumer sees the steer response

A second disposable native Windows mode, `--lost-steer-rpc-response`, is gated
by the managed integration-test marker and requires abrupt hosted-client loss.
The gateway and installed Codex host accept one exact-turn steer, then a
test-only filter in the hosted client withholds that successful response from
its RPC consumer and writes only a content-free held-response marker beside
the private recovery file. While the original hosted HTTP request remains
unanswered, gateway exact-key status reads `settled-accepted` and the host
still exposes the pending key. After the first turn finishes, the canary kills
the exact disposable hosted-client PID. A fresh manager recovers the same
thread, key, and objective, blocks both new turn and steer replay, and clears
the key only after exact terminal acknowledgement. The run reported two
objective events, three local model calls, zero external calls,
`lost_steer_rpc_response_recovered:true`,
`abrupt_hosted_client_loss_recovered:true`, and
`current_desktop_task_control:false`. The ordinary guarded Windows mode also
passed with the filter disabled. A CLI fixture rejects enabling this seam
without the bound managed integration-test environment. The refreshed staged
Windows product doctor passed (source closure digest
`6e2708201b8cc17e4f6eca8b64e0cde0490b077c7fed8e7f99e76cd32677ec4a`),
and the wrapper suite passed 712/736 with 24 platform/environment skips and
zero failures. This is application-level pre-observation loss after gateway
durability, not proof of whole-machine power-loss recovery or of a backend
acceptance for which no terminal durable evidence exists.

## Abrupt native managed-stack loss

The disposable native Windows canary now also supports
`--abrupt-stack-loss`. With the managed integration-test marker, it confirms
the launcher's exact hosted-client PID, then terminates only that disposable
manager process tree. A new manager and hosted client recover the same private
state. The lost-HTTP-response mode first passed with two objective events,
three local model calls, zero external model calls, one exact steer acceptance,
and no duplicate dispatch. An initial combined run also admitted pre-crash
compaction while its steer key remained unacknowledged. That result is
superseded: it exposed an inconsistent hosted admission boundary rather than
proving safe sequencing.

The harder lost-RPC-response mode passed after gateway acceptance but before
the hosted RPC consumer received its response. A first combined run with
pre-crash compaction returned `windows-client.turn-start-pending` only because
the unresolved RPC held the in-memory start slot. The hosted compaction API
now checks the durable pending-steer checkpoint itself, before its in-memory
start slot and idle-turn checks. A focused fixture makes the host turn idle,
proves compaction remains blocked with
`windows-client.pending-steer-recovery-required` and no backend dispatch,
then proves terminal exact-key acknowledgement reopens compaction.

The refreshed native Windows canary asserts that same denial for both lost
HTTP and withheld RPC responses, kills the managed stack, reconciles and
acknowledges the retained steer key after restart, and only then compacts.
Both explicit-requirement, compaction, abrupt-stack runs passed with two
objective events, four local model calls, zero external calls, no duplicate
steer acceptance, and the same objective on the second turn. The hosted-client
suite passed 93/93; the full wrapper suite passed 712/736 with 24 skips and
zero failures. This is disposable process-tree termination, not a machine or
disk power-failure test. The refreshed source and canary were copied into an
isolated Windows test stage; no installer was rebuilt or installed for this
slice. `current_desktop_task_control` remained false.

## Pending-steer hosted ingress fence

A follow-up audit found that the browser disabled New thread and feedback
writes while a steer checkpoint was pending, but the authenticated hosted
HTTP API still admitted those routes. A red fixture reproduced a `201`
thread creation before terminal acknowledgement. The hosted API now rejects
new thread creation, feedback submission, pending-feedback dismissal, and
pending-feedback application with
`windows-client.pending-steer-recovery-required` whenever the durable key is
present. This matches the existing new-turn, steer, and compaction fence.
Read-only status, exact-key acknowledgement, Rejoin preflight, exact active
turn interruption, and host approval responses were not blanket-blocked;
they may be needed to diagnose or settle the pending turn.

The focused fixture proves all four writes are denied before backend dispatch
for both a newly retained key and a key reconstructed from private recovery
state. It also proves a feedback write is admitted again after terminal
exact-key acknowledgement. Both disposable native Windows abrupt-stack
canaries now assert the four denials after restart, then acknowledge the
matching key, compact, and complete the next turn on the same objective with
four local model calls and zero external calls. The hosted-client suite passed
93/93; the full wrapper suite passed 712/736 with 24 skips and zero failures.
This does not prove installed-package behavior or exclusive control of the
current desktop task.

## Extracted NSIS payload and same-window checkpoint withdrawal

The unsigned NSIS candidate `ARE_Companion_steer_ack_20261001_x64-setup.exe`
(SHA-256 `85d718a24264fc37ed7d7d4335b7d615f0d0885e7f68709c75dafb8e559f3850`)
was extracted without executing the installer. The extracted payload contains
the Companion executable and exactly the intended `are`,
`cross-os-development`, `native-orb`, and `node` resource trees (plus NSIS
plugin files). All four resource trees matched the retained staging resources
byte-for-byte. The extracted executable has the same size as the staged
executable but differs by three bytes; the native tests below used the
extracted executable itself. Its native Windows bundled-feature check passed
13/13 checks, including the Reasoning State load and read-only Evolution
observer. Its WebView2 journey passed orb/dashboard opening, active-thread
Reasoning State, and the visible hosted steer checkpoint. The expanded journey
then made the still-pending hosted-client observation stale and verified that
the cue disappeared in the same open window while the gateway thread remained
current. It next changed the owned hosted-client observation to acknowledged
and verified that the cue stayed absent with a current hosted observation.
This is extracted-payload validation, not an installer-run or
installed-lifecycle test. It does not prove power-loss recovery or control of
this desktop task.

## Claim boundary

This proves selected WSL/Linux and native Windows CLI fixtures accepted an
in-flight correction through the managed hosted path. The native Windows
manager now retains and reconciles a successful gateway steer whose HTTP
response was lost across clean restart, without a duplicate dispatch. Local
joined fixtures also prove exact-key reconciliation when the gateway's steer
RPC response does not reach the hosted client. Abrupt native hosted-client
loss and separate whole managed-process-tree loss after acceptance and before
acknowledgement passed both when the hosted HTTP response was lost and when a
test-only filter withheld the steer RPC response before its consumer observed
it. Whole-machine power loss, a backend
acceptance without terminal durable evidence, and older installed-client
compatibility remain separate. This does not prove
current desktop-task control, universal effect enforcement, Companion
correction-control UX, or release readiness.

## Open Questions

- Can whole-machine power loss or a backend acceptance with no terminal
  durable evidence be reconciled without redispatch? Native Windows now passed
  lost HTTP and RPC responses across abrupt disposable managed-process-tree
  loss. This does not test power or storage durability. A genuinely unknown backend
  acceptance must remain quarantined unless exact durable evidence later
  makes its outcome terminal.
- Can the installed Windows NSIS lifecycle reproduce the extracted-payload
  result? The extracted native run covered a current cue, withdrawal when its
  pending hosted observation became stale, and continued absence after exact
  acknowledgement. The installer itself was not run.
