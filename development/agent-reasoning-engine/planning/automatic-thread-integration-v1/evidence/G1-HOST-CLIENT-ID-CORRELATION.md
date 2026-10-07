# G1 candidate host client-ID correlation for unknown dispatch

Status: candidate protocol evidence plus bounded gateway marker, semantic-state,
and hosted-client receipt reconciliation, 2026-09-27. This is not host
idempotency, desktop-task activation, or release proof.

## Exact observed contract

The installed `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
generated a v2 App Server schema in which `TurnStartParams` accepts optional
`clientUserMessageId`. The `ThreadReadResponse` turn item union declares an
optional `clientId` on a `userMessage` item. `TurnStartResponse` and the turn
summary have no declared request-key or client-message-ID field. This schema
is version-bound; a declared field alone does not prove durable behavior.

The optional `--client-id-probe` in
`implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs`
started one disposable, read-only turn through the current gateway with a
random 128-bit opaque client message ID. After host completion, an owned
`thread/read(includeTurns: true)` returned exactly one matching turn with
exactly one `userMessage.clientId` equal to the sent ID. The gateway stable
request key did not appear in that turn history. Three fixed loopback provider
requests occurred, zero external model calls, the current desktop task was
untouched, and temporary configuration was removed. The first two probe runs
failed before host dispatch because required policy fields and a routable
prompt were absent; adding those normal test preconditions produced the pass.

The additional `--client-id-restart-probe` passed twice on that same pinned
binary with a caller-supplied marker, and passed again after the gateway-owned
marker implementation. In the latter run, the gateway generated a random
128-bit `are-gateway-client:` marker and persisted it in `dispatch-intent`
before forwarding an ordinary unmarked `turn/start`. The test then completed
that turn, closed the Windows client host and gateway,
started a new gateway and Codex App Server backend process, resumed the owned
gateway session, and read full `thread/read(includeTurns: true)` history. The
new backend PID and gateway runtime epoch differed from their predecessors.
Across all returned turns, exactly one `userMessage.clientId` matched the
marker, in the exact completed turn; no fourth provider request occurred.
The local fixture made three fixed loopback provider requests total, zero
external model calls, and left the current desktop task untouched. This is
clean process-restart persistence, not a crash/power-loss or compaction test.

The `--unknown-acceptance-marker-probe` then exercised a different crash
window on that installed binary. Its first fault variant deliberately failed
the durable `turn-start-accepted` write and killed the backend immediately;
the new host process returned no marked turn. That negative result shows this
fault lands too early for positive history correlation and remains safely
unknown. The revised variant withheld only the gateway-facing `turn/start`
response, let the host turn complete, then restarted both gateway and backend.
One `userMessage.clientId` matched the durable intent marker in owned full-turn
history, and one `turn-marker-observed` receipt was persisted. The start
request remained `outcome-unknown`; same-key retry and a distinct new turn
were both rejected, with no extra provider dispatch. Three fixed local
provider requests occurred, zero external model calls, and the current desktop
task was untouched. The temporary configuration was removed. This is an
isolated lost-response test, not a physical crash or exhaustive-history proof.

The wrapper now checkpoints the digest of the original inbound `turn/start`
method and parameters with its prepared semantic state. After a gateway-owned
marker is observed, the gateway first persists the observation and then asks
the wrapper to reconcile the exact request binding and host turn. A recovered
prepared-but-unbound state is bound to that turn; a recovered active state is
checked against the same request digest. A terminal turn becomes a distinct
unassessed recovery checkpoint, without semantic completion, Evolution signal,
or automatic successor. If the wrapper had already checkpointed normal
completion before the lost gateway response, it recognizes that exact bound
completion without writing a second one. Missing or conflicting state fails
closed. A repeated host read reuses the durable marker receipt while checking
that the fresh read agrees on marker, request, turn, and status.

The first installed-host rerun failed with `reasoning.recovery-marker-state-unbound`:
the native turn had already reached normal completion before restart, unlike
the initial pending/bound fixtures. After adding exact-binding recognition for
that state, the same pinned `--unknown-acceptance-marker-probe` passed: one
durable marker receipt, one matching completed host turn, no retry or extra
provider dispatch, zero external model calls, and no current-task access.
The native rerun also found that the read-only Threads projection rejected the
new marker receipt kind. That projection now counts marker observations
separately from accepted-response history, and the Companion labels them as
matches in returned host history. The pinned native canary then passed with
the post-restart Reasoning State still showing its previously checkpointed
completion frontier. The final local wrapper suite passed 395/400 with five
skips; 35 focused thread-observation and dashboard tests passed, and the
desktop Rust bridge passed offline `cargo check`. This is a clean-restart
test, not power-loss durability or an installed Companion proof.

## Implication and limits

The Codex gateway now places a content-free per-request marker in
`clientUserMessageId` for stable client `turn/start` requests that do not
already supply one, durably binds it before forwarding, and retains it across
session-store compaction. The gateway now checks an owned `thread/read` response
for exactly one returned `userMessage.clientId` match when a recovered dispatch
is unknown and no accepted-response receipt exists. It durably records a
content-free `turn-marker-observed` receipt bound to the request, marker,
thread, returned turn, and read response. Missing or duplicate matches record
nothing; a later conflicting turn stops the backend. By itself this is one observed match
in returned history, not a claim that the host provided an exhaustive history
or that ARE recovered the request. A stronger full-history proof could establish
*acceptance of one marked host turn* after a lost response. It does not prove
that the host deduplicates repeated `turn/start` calls; an uncertain request
must never be retried merely because this marker exists. Zero matches are
still unknown, multiple matches are ambiguous, and a different client or
partial history cannot be used to infer non-delivery.

The gateway now exposes a local receipt only after both a durable unique-marker
observation and exact wrapper semantic reconciliation. A hosted client with a
v2 content-free pending intent binds that receipt to its original `turn/start`
parameter digest, durably replaces the intent with a distinct recovered-turn
record, and then confirms the receipt to the gateway. The gateway journals
`dispatch-recovered` before releasing its unknown-outcome write block. A crash
between client settlement and gateway confirmation leaves a durable receipt
that can retry confirmation after restart. An absent or ambiguous marker,
missing semantic proof, changed request binding, or failed confirmation keeps
new sends blocked. The original missing `turn/start` response is **never**
synthesized, and a same-key retry is refused even after recovery.

The browser adopts the host's v2 pending binding and offers a text-free
“Check recovery” action; it does not redispatch that pending message. The
gateway/store/client/browser regression suite passed 407 tests with five
platform skips. The pinned native lost-response canary passed after confirming
the semantic recovery receipt and durable `recovered` status. A second pinned
native mode sent the uncertain turn through the hosted HTTP client, verified
its v2 pending checkpoint, withheld the host response, restarted client,
gateway and backend, and observed automatic client settlement and gateway
confirmation. Replaying the same key returned the client's local recovery
receipt without another provider dispatch. Both modes found exactly one host
marker match and used three fixed local provider requests, zero external model
calls, and no current desktop-task access. These are controlled clean restarts,
not process-kill or power-loss crash proofs. The probes checked same-process history, a clean
backend/gateway restart after completion, and an isolated completed host turn
whose start response was withheld from the gateway. The gateway recovery
event survives session-store compaction in a local file-backed test; the
probes did not prove host-history marker retention after host compaction,
concurrent writers, exhaustive history, or crash/power-loss recovery. The exact
current desktop task has no verified ARE handover.

The next Companion Threads slice projects confirmed gateway dispatch recovery
separately from unresolved dispatches and raw marker observations. The native
hosted-client canary observed one confirmed recovery on the exact hashed
backend-thread row and zero remaining unknown dispatches. The Rust bridge
passed offline `cargo check`; the local Threads/Companion tests passed 36/36;
the full wrapper suite passed 402/407 with five skips. A real Chromium fixture
passed its navigation, narrow layout, and recovery-versus-activation checks
without page errors. A later current-source unsigned Windows build passed the
staged feature check and [WebView2 recovery-projection fixture](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-RECOVERY-PROJECTION-TEST-2026-09-27.md).
A subsequent two-phase staged WebView2 run used that pinned installed-Codex
backend and the hosted pending-intent loss/restart path together. It passed:
one exact host marker, one confirmed recovered dispatch on the backend-thread
row, zero unknown dispatches, and zero process-local Decisions after restart.
The first run exposed a stale test assertion for the no-Decisions phase; the
assertion was corrected and the entire runner passed on rerun. The full wrapper
suite remained 402/407 passed with five skips, and the focused Threads/UI tests
passed 36/36. This still does not install the Companion, activate the current
desktop task, or prove power-loss recovery.

## Dependency chain for implementation

1. Carry the demonstrated version-bound clean-restart behavior into an
   adapter capability contract; test truncated/ambiguous history and crash
   boundaries. Reject unsupported adapters and keep the current write block
   on any incomplete proof.
2. Completed for ordinary stable Codex `turn/start`: generate a content-free
   gateway-owned marker and persist it with request binding and owned thread
   before host dispatch. Client-supplied IDs are not recovery markers. Do not
   treat either marker as a secret approval or host idempotency key.
3. Completed as a bounded observation: verify one returned user item by marker,
   thread, and durable gateway request binding, then checkpoint a distinct
   content-free receipt without synthesizing the missing App Server response.
   Exhaustive-history assurance and recovery beyond the exact terminal,
   gateway-marked, semantically bound case remain open.
4. Implemented for gateway-owned markers and exact durable wrapper state:
   bind a unique recovered prepared state or check an already-bound/completed
   state against the original request digest. Terminal status is recorded as
   unassessed when not already completed; missing proof remains paused. The
   native lost-response canary covered the already-completed variant, while
   pending/bound variants have local file-backed tests only.
5. Implemented and exercised in a native clean restart: the hosted client persists a v2 pending request digest,
   settles only from an exact gateway receipt, confirms the gateway's durable
   recovery, and retains a confirmation-required block across restart. Native
   proof covers the gateway/real-wrapper lost-response and hosted-client
   pending-intent path; a broader native crash matrix remains open for before acceptance,
   after acceptance but before response, after response but before checkpoint,
   duplicate markers, changed payloads, and later distinct user input.

## Durable contradictory-history stop

A later host read can contradict an already checkpointed marker or terminal
history observation. The gateway now writes a content-free `session-fault`
receipt before stopping its backend for either conflict. The receipt binds the
owned thread and request-key digests, the prior and new observation digests,
and a closed reason code; it retains no transcript, raw thread ID, or prompt.
The session store preserves `faulted` through compaction and file reopen,
rejects a fresh `session-started` event for that consumer, and refuses an
authenticated reconnect with `gateway.session-faulted` and the fault digest
without spawning another backend writer. An unauthenticated attempt receives
no fault detail. The two focused gateway/store suites passed 98/98, covering
both conflict kinds, same-process reconnect, restarted gateway refusal, and
file-backed compaction/reopen. The full wrapper suite passed 418/423 with five
platform skips and no failures. These are local fixtures, not a native host
contradiction or proof that a disk failure can always persist a fault.

The RPC transport now retains only the authenticated handshake's validated
fault digest and closed reason code on its startup error. The Windows hosted
client emits those two content-free fields in its structured start-failure
diagnostic; a wrong resume token receives neither field. The focused gateway
case passed and the full wrapper suite again passed 418/423 with five platform
skips. This established client startup visibility before the later in-window
fault view below.

The gateway's read-only Adapters projection now queries a boolean from the
already-open session store: whether any durable session is faulted. It exports
only `observed`, `not-observed`, or `unknown`, never consumer identity, thread
reference, fault digest, or prompt. The Companion bridge and Adapters screen
show that aggregate beside the still-unverified desktop-task-control status.
The marker-conflict fixture observes the fault before and after gateway restart;
focused gateway/observation/dashboard tests passed 108/108, the full wrapper
suite passed 418/423 with five platform skips, and Linux Rust `cargo check
--offline` passed through the repository toolchain. This is source-level UI
and local-test evidence, not a packaged Windows/WebView observation or proof
that the fault belongs to the current desktop task.

The hosted HTTP client now treats a post-initialization gateway transport
failure as a terminal, sanitized state: `/api/state` and authenticated events
remain readable, health reports not ready, and all new turn, feedback,
recovery, approval, and user-input ingress returns `503` without calling the
backend. The browser shows a stop alert, disables controls, and retains that
state across reload. For a validated `gateway.session-faulted` refusal at
startup, the executable serves the same read-only browser instead of exiting
with only a stderr record. It does not initialize RPC, start a backend, retry a
turn, or clear private recovery state. The fault reason and digest are exposed
in the client process's structured startup record and through its
token-authenticated state endpoint as a content-free diagnostic. The client
must have offered a stored resume secret before accepting a fault-shaped
handshake; an unauthorized or unbound attempt opens no fault page and receives
no fault metadata. The stopped page retains the private recovery file without
reading unbound turn state or resuming a thread.

The executable path passed disposable fault, unauthorized-refusal, and
unbound-fault tests; the HTTP host tests passed 37/37; the full wrapper suite
passed 423/430 with seven skips;
and two Windows Edge browser checks passed for both the live transport stop
and startup fault page, including disabled controls and reload behavior. The
socket-refusal test injects a syntactically valid fault frame; it does not
prove the gateway authenticated that fixture or that a real native host
contradiction reached the page. The separate gateway tests cover authenticated
fault versus wrong-token denial. These checks do not install the Companion,
activate the current desktop task, or establish exclusive desktop handover.

A further local end-to-end fixture now begins with the gateway's own
`turn-marker-history-conflict` detection and durable `session-fault` write,
restarts the gateway, then launches the hosted-client executable with a private
recovery token for that same consumer. The executable receives the actual
gateway refusal and serves its read-only stop state with the matching fault
digest and reason. The test confirms `POST /api/turns` returns `503`, no backend
writer is spawned after restart, and the state omits the fixture's private
prompt and raw host identities. The focused case passed, as did the full
wrapper suite (423 passed, 7 skipped, 0 failed out of 430). This joins the
gateway and executable paths without injecting a synthetic refusal frame, but
the contradictory history still comes from a local fake backend; no installed
Codex host, packaged WebView, or current desktop task participates.

The next failure-recovery slice closes a restart hole in the local candidate.
Before forwarding any full-history read for an owned durable turn request, the
gateway now writes a content-free `history-audit-started` receipt. A clean
response writes `history-audit-completed`; a contradictory response writes the
existing `session-fault`. If that fault append is refused, the active backend
stops but the unfinished audit remains in the session journal. An authenticated
reconnect is denied with `gateway.history-audit-incomplete` before any backend
writer starts; an unbound or wrong-token attempt receives no quarantine detail.
The store preserves an unfinished audit through compaction and file reopen and
will not accept a new `session-started` event while one remains. Two concurrent
reads dispatched before the first observation is written are both guarded.
The hosted executable maps an authenticated quarantine denial to a read-only
stop page that retains private recovery state and blocks new turns; it does not
invent a fault digest or retry a turn. A simulated fault-append failure passed
the gateway-to-executable restart test, the full wrapper suite passed 426/434
with eight skips, and Windows Edge passed all three stop-page journeys. This
is a simulated append failure and fake host-history conflict, not a physical
disk/power-loss canary or packaged WebView proof. The quarantine has no
automatic release path; independent host-history review and an owner-approved
recovery procedure are still needed before one can be cleared.

The read-only Companion Adapters path now projects an incomplete audit as a
separate content-free aggregate `session_quarantine` status. It does not
conflate that status with the durable `session_fault` status, expose audit or
session identifiers, or attribute either stop to this desktop task. An older
observation without the field reads `unknown`; an observed stop suppresses the
Overview ready-path headline. A local contradictory-history/fault-write
failure fixture exercised the authenticated observation socket before and
after gateway restart, with no backend writer on denied reconnect. Focused
gateway/observation tests passed 81/81; the Companion UI tests passed 28/28;
the Rust bridge passed offline `cargo check`. This is source-UI validation,
not installed Companion or physical-failure evidence.

## Native host marker after explicit compaction

The direct, disposable native-host canary now has a
`--marker-after-compaction` mode. On the installed WSL
`codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`),
it supplied a synthetic opaque `clientUserMessageId` for the first turn,
read exactly one matching `userMessage.clientId` in that turn, requested
native `thread/compact/start`, observed a completed compaction item, and
read exactly one match in the same original turn afterward. The bound
`SessionStart:compact` hook also delivered the exact plan context on the
subsequent local provider request. The new mode and unchanged manual
checkpointed-context mode both passed on 2026-09-27. The marker run used a
durable thread only inside a temporary `CODEX_HOME`, a fixed loopback
provider, no external model, and no current desktop task; its temporary
state was removed. A first attempt with an ephemeral thread failed before
compaction because this host rejects `thread/read(includeTurns: true)` for
ephemeral threads. This test did not send compaction through the ARE gateway:
that method is intentionally outside the governed gateway profile. It
establishes same-process host-history retention after explicit compaction,
not crash/power-loss durability or gateway recovery after compaction.

The separate `--automatic-marker-after-compaction` mode also passed on the
same installed binary. With the host's effective automatic compaction limit
set to 10 tokens inside that isolated temporary configuration, it observed
one native compaction item after two fixed provider requests, then read
exactly one matching `userMessage.clientId` on the original turn. The compact
hook's exact plan context appeared on the third local provider request. This
is a bounded same-process automatic-compaction result, not a production
token-limit setting.

The `--marker-after-compaction-restart` mode then passed on the same binary:
after the explicit compaction and the next completed turn, it stopped the
disposable backend, launched a new backend process against the same private
`CODEX_HOME`, and read exactly one marker match in the original turn. The
backend PID changed and the provider request count did not increase. This
establishes clean backend-restart history retention after explicit compaction
in the local fixture. The separate
`--automatic-marker-after-compaction-restart` mode also passed: after one
automatic compaction, a new backend process found the marker once on the
original turn and made no new provider request. Neither mode is a
crash/power-loss test, gateway-originated marker test, or proof that an ARE
recovery receipt can be settled from that history. The refactored canary's manual,
automatic-marker, and invalid-ledger modes also passed; one concurrent
default-mode rerun hit `ENOMEM` before validation and passed when rerun alone.
The final tested canary source SHA-256 was
`4fe51acdae3e27c45c79e00d2b7ebdbd97ada08321ab4299d81d1e90486b535c`;
all eight modes passed individually or sequentially after the restart-mode
refactor.

## Joined gateway and installed-host automatic-compaction marker canary

The existing native gateway canary now has a separate
`--gateway-auto-compaction-marker-probe` mode (source SHA-256
`224a1f38a56bbd652e60c4d6591de2c986e5a21c1750efdebeb91965a2c430fc`).
It uses the pinned installed Codex binary above, an isolated persistent ARE
gateway, a hosted client, a temporary `CODEX_HOME` that requests a 10-token
automatic compaction limit, and a fixed loopback provider. The gateway
generated the opaque marker and retained it in its durable dispatch intent
for the first ordinary stable `turn/start`. The host emitted one automatic
`contextCompaction` item. An owned full-history read returned exactly one
matching `userMessage.clientId` on that original turn. After the hosted
client, gateway, and backend were cleanly restarted, the resumed session
completed its versioned backend initialization and a second owned full-history
read returned the same unique turn match. Backend PID and gateway runtime
epoch changed; provider requests stayed at three. The mode passed twice,
made zero external model calls, did not touch this desktop task, and removed
its temporary configuration. The default, client-ID restart, and
unknown-acceptance native canary modes also passed after the addition.

Two initial probe attempts stopped safely: `config/read` is intentionally
ungoverned by this gateway, and a generic synthetic prompt had no ARE route.
The probe now uses the private configuration directly and an existing
routable fixture prompt. A later attempt reached the post-restart read but
was denied until the hosted client performed the normal backend
initialization/version handshake. No production method policy was widened.
This joins marker retention, automatic compaction, and clean gateway/backend
restart for a gateway-originated marker. It does not simulate a lost start
response in the same run, prove crash/power-loss durability or exhaustive
host history, authorize redispatch, or activate this chat.

## Joined automatic-compaction lost-response recovery

The same native gateway canary now has a distinct
`--gateway-auto-compaction-lost-response-probe` mode (source SHA-256
`54f30a62875ae249b49f954faf5a0b155e06ffb3d550dfae35411168352c633c`).
An initial ordinary turn completed without compaction. The gateway then
generated a durable marker for a second turn, but the fixture withheld only
its `turn/start` response from the gateway-facing client. That turn completed
while the installed host emitted one automatic `contextCompaction` item. The
gateway kept the request `outcome-unknown`; both a same-key retry and a
different new turn were rejected without provider dispatch. After a clean
hosted-client, gateway, and backend restart, an owned history read found
exactly one marked original turn. The gateway durably recorded one matching
marker observation, reconciled the original request with wrapper semantic
state, returned a distinct recovery receipt, and durably confirmed
`dispatch-recovered`. The Threads projection showed one recovered dispatch
on that backend-thread row. Replaying the same request key still did not
synthesize the missing host response or dispatch again. The mode passed
twice; the previous joined marker and ordinary unknown-acceptance modes
also passed afterward. Each run used three fixed loopback provider requests,
zero external model calls, a private disposable configuration, and no
current desktop-task access; cleanup passed.

This is a controlled completed-turn lost-response/automatic-compaction
intersection. It does not prove a process kill at every write boundary,
power-loss durability, exhaustive host history, an already-running desktop
client's exclusive handover, or recovery of an active/interrupted turn.

### Staged Companion join after automatic compaction

The canary now exposes its authenticated observation pipe at the recovered
checkpoint for a bounded native Windows Companion journey. The updated canary
(SHA-256 `56f21ea183b389c26764463ae65691ab2185291e9bfa6457470cb028a2c1e4f1`)
passed against the installed WSL Codex CLI. The Windows runner
(SHA-256 `a2a1534fd8a97b4d71b1e62d9fb961856540e40e8c0910ce14fcb62951a2eaf0`)
then passed with a disposable copy of the installed Windows
`codex-cli 0.155.0-alpha.16.4` binary and the retained staged Companion
executable (SHA-256 `8f724ab1ab4c5cb15bc7bf9efe1d5c4a1d9aeeb718371a1a5665cb664048f432`).
The native WebView2 Threads page showed one confirmed gateway dispatch
recovery and the verified completed frontier as distinct facts. It showed
zero process-local Decisions after restart and retained the explicit warning
that this is not desktop-task activation. The run passed all 39 reported UI
checks, used three fixed loopback provider requests, made zero external model
calls, and did not touch this desktop task. The previous two-phase native
gateway-restart mode passed again, as did the 33 Companion dashboard unit tests.
The temporary Windows binary copy was removed after testing; no installer was
run or host configuration changed. This extends the read-only UI observation
proof, not the host handover or crash/power-loss durability claim.

## Open Questions

- The direct-host canary found one `clientId` after both explicit and
  automatic compaction and a subsequent clean backend restart on the pinned
  binary; the joined gateway canary did the same for a gateway-originated
  marker after automatic compaction. Does the marker survive a crash or power
  loss? Is the field always present in a full durable read, including
  histories with truncation? The controlled completed lost-response canary
  reconciled without redispatch after compaction; do the other crash windows,
  active/interrupted turns, and non-exhaustive histories fail closed?
- Gateway generation is implemented for unmarked stable client turns. How
  should existing caller-supplied IDs and generated successor turns be handled
  by a future recovery contract without false correlation or disclosure?
- Can the host offer a documented idempotent lookup/claim API? If not, even a
  successful correlation only proves acceptance; it never authorizes retry.
- A gateway-originated contradictory-history fault reaches the hosted HTTP
  stop page in a local fixture, but not yet a packaged WebView. The Companion
  now has separate aggregate fault and quarantine projections, but no
  exact-task diagnosis. Packaged UI proof, a native contradiction canary, actual
  disk/power-loss testing, and an explicit quarantine-review/release procedure
  remain open.
