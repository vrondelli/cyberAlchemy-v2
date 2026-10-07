# G1 native interrupted-turn recovery and Companion truth

Status: bounded construction evidence, 2026-09-27. Authority effect: none.
The discontinued TUI was not used. This desktop task was not read, resumed,
interrupted, or handed over. No external model was called.

## Exact scenario

The native Windows canary used the installed desktop app's
`codex-cli 0.155.0-alpha.16.4` binary copied to an isolated temporary test
directory (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
A fixed loopback Responses provider completed one disposable turn and then
held a second hosted-client turn at `item/tool/requestUserInput`. The hosted
client had an accepted-turn receipt. The test terminated only that disposable
backend before answering, then restarted the file-backed gateway and hosted
client, rejoined their owned thread, and read the host's exact stored turn.

The host reported the second turn as `interrupted` and its runtime as idle.
The recovered hosted client replayed the accepted turn ID for the same
request key without another provider request; an unrelated thread remained
outside its ownership. Provider request count was three in total. The gateway
runtime epoch rotated, and its new process had zero current-process decisions.

This exposed a separate projection gap: the recovered ARE wrapper retained an
unsettled semantic turn binding and previously displayed `turn-active`, even
though the host turn was terminal. The wrapper now tags recovered active
bindings as `recovery-unverified`; the gateway observation, read-only client,
Companion Rust bridge, and renderer preserve that phase. This does **not**
fabricate a Reasoning State completion frontier or release an unknown outcome.
The older verified frontier remains visibly historical evidence.

## Follow-up recovery guard and host-history receipt

The restarted wrapper rejects a different `turn/start` or a stale
`turn/steer` for the exact recovered, unsettled turn. At this earlier
checkpoint it resumed new-turn eligibility only after an actual
`turn/completed` notification reached the Reasoning State completion path; a
`thread/read` result was not substituted for that notification. This guard is
scoped to recovered active bindings so it does not change ordinary preflight
behavior for an in-process client. The later terminal-recovery transition
below adds a distinct, non-completion path for exact interrupted/failed turns.

Host-history verification now accepts an already-completed *gateway*
`turn/start` request when its exact acceptance receipt matches the thread and
turn in `thread/read(includeTurns:true)`. The content-free history observation
is fsynced through the gateway session store, but it is separate from semantic
completion and does not release a genuinely unknown dispatch or authorize a
successor. The native interruption canary found exactly one durable
`turn-history-verified` event for the interrupted turn after restart. The
gateway observation still showed `recovery-unverified`, with zero current-
process decisions and three fixture provider requests total.

The hosted client now recognizes the wrapper's definite
`reasoning.prior-turn-unsettled` refusal, durably discards only its matching
pending intent, and returns a visible 409 recovery status. It retains pending
intents for timeouts and other uncertain outcomes. The native canary attempted
one different turn after the interruption: it was refused before provider
dispatch, and the client had no stranded pending intent. No new semantic
completion or automatic successor was inferred.

The focused host-history/store/wrapper suites passed 94/94; gateway suite
passed 68/68; hosted-client/recovery tests passed 36 with four platform skips.
The native Windows interruption canary passed on the same pinned
binary and disposable thread. The full wrapper package run passed 381 tests,
skipped five, and failed one separate representation-preferences test
(`consent survives provider failure once the lesson has been durably saved`);
that same test failed in isolation and is not claimed resolved here. The
Companion binary and installer had not yet been rebuilt at that checkpoint.

## Exact recovered-turn host status in Companion

The gateway now joins a `turn-history-verified` receipt to the hashed turn ID
of the recovered ARE binding, not merely to its thread. The read-only
Companion row shows the exact host status (`interrupted` in this canary) beside
`Recovery unverified` and states that new turns remain paused. An earlier
completed frontier remains historical; a different turn's history cannot
supply this status. No host turn ID, request text, or provider content is
projected.

The focused projection and dashboard suites passed 30/30, Companion Rust
`cargo check --offline` passed, and the native Windows interrupted-turn canary
passed with `exact_recovered_turn_host_status: interrupted`. A fresh unsigned
Windows development installer was built at
`implementation/agent-reasoning-engine/apps/desktop-companion/dist/ARE_Companion_0.1.0_x64-setup-recovery-host-status-20260927.exe`
(SHA-256 `2414d58a4e8e640aa4256db14fb008b592b9e9067272046b55d9932bca7caca6`,
development closure digest
`429497b26e6818bb9493b8d43cb1674848c4e2d474c9f7857663551927c84149`).
Its staged bundled-resource feature check passed. The two-phase native
WebView2 test passed before and after gateway/backend restart, including
visible `Recovery unverified`, exact `interrupted` host history, no current
ARE completion claim, and zero process-local decisions after restart. The
installer was not installed. The exact 1.5 GB build stage and copied test
Codex executable were removed after the tests.
The current full wrapper package run passed 383 tests, skipped five, and
still failed the separate representation-preferences provider-failure test
at `representation-preferences.test.mjs:83`; package-wide green is not claimed.

Follow-up on 2026-09-27: the provider-failure test expected a new turn on the
same thread after an accepted turn with unknown delivery. That expectation
conflicted with the recovered-turn guard. The test now checks the exact
`reasoning.prior-turn-unsettled` refusal and separately verifies that the
durably saved product-scoped preference applies on another thread. The focused
test passed, and the full wrapper package suite passed 384 tests with five
platform skips and zero failures. This changes the test claim only; it does
not settle the interrupted semantic turn or expand the native canary claim.

## Checkpointed terminal recovery and new-user-turn proof

The gateway now calls an internal wrapper recovery operation only after it
has durably verified exact accepted-turn host history. The wrapper independently
checks the gateway request, acceptance receipt, raw host history and recovered
Reasoning State turn binding. For a gateway request already marked `complete`
whose exact host turn is `interrupted` or `failed`, it checkpoints a separate
`semantic-turn-recovery-terminal` event. It creates no `turn/completed`
notification, semantic evaluation, completion frontier, Evolution signal,
automatic successor or retry. The recovered binding is released for a
*different, explicit user request* under normal preflight. A missing or
ambiguous host turn, `inProgress`/`completed` status, unknown gateway-dispatch
outcome, or contradictory durable terminal status does not take this path.
The read-only Threads projection uses `recovery-terminal` with exact host
status; an earlier completion frontier remains historical.

The wrapper, gateway, projection and dashboard tests passed in the full
wrapper package run: 386 passed, five platform skips, zero failed. Offline
Companion Rust `cargo check` passed. The installed Codex binary
`0.155.0-alpha.16.4` (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
was copied into an isolated Windows canary. With a fixed loopback provider and
no external model call, the restarted gateway first rejected a new turn
before host-history verification and cleared that definite client intent.
It then observed one durable exact `interrupted` history receipt, displayed
`recovery-terminal`, preserved the prior frontier digest, and accepted one
distinct subsequent user turn. Four provider requests occurred in total;
the old request was not redispatched. A second native run also verified that
the new turn completed with a new frontier, superseding the temporary
`recovery-terminal` row. The current desktop task was untouched.

A fresh unsigned development installer was built at
`implementation/agent-reasoning-engine/apps/desktop-companion/dist/ARE_Companion_0.1.0_x64-setup-terminal-recovery-20260927.exe`
(SHA-256 `4cb2fa06a6dae78d3191f5f912be66ea4a52e6266aaf3f4851747e41047ea061`,
development closure digest
`51b6d2562013fea30f90fd07e3f8043fa9722e6e17ce4f1f7cac029bb8cb8c87`).
Its staged resource feature check passed. The two-phase native WebView2 test
passed before and after backend/gateway restart: the restored Threads page
showed `Recovered host terminal`, exact `interrupted` history, the historical
frontier, and no current-process Decisions records. All seven destinations,
orb opening, appearance, keyboard/focus and independent source postures
passed. The installer was not installed. The exact 1.5 GB build stage and
306 MB copied-binary directory were removed after validation; those temporary
directories are not recoverable, while the unsigned installer remains.

## Previous validation before exact host-status projection

- Focused Node source suites for wrapper, thread observation, and Companion
  renderer: 100 passed, zero failed.
- Full wrapper package suite: 381 passed, zero failed, five platform skips.
- Companion Rust bridge: `tools/toolchain/run cargo check --offline
  --manifest-path implementation/agent-reasoning-engine/apps/desktop-companion/src-tauri/Cargo.toml`
  passed.
- Native Windows canary `--interrupted-turn-recovery`: passed after a first
  run exposed the observation-client phase validator gap, which was repaired.
  It asserted host-terminal `interrupted`, no duplicate provider dispatch,
  restored owned thread/receipt, and gateway phase `recovery-unverified`.
- New unsigned, uninstalled Windows development installer:
  `implementation/agent-reasoning-engine/apps/desktop-companion/dist/ARE_Companion_0.1.0_x64-setup-interrupted-20260927.exe`,
  SHA-256 `9fc1a1f2c739f6f73ba72a57166df69bb1486774143d00df0dd0aa659e8d29d1`.
  The development closure digest was
  `8257c550438ca31103567346732479ae8e00fe9f0695929c7e180b67ed757b9d`.
- Two-phase native WebView2 run against that build: passed. Before restart,
  the live gateway yielded one completed Reasoning State row, a frontier,
  and two linked decisions. After interruption/restart, the Threads page
  displayed `Recovery unverified`, did not label the turn active, retained
  the earlier verified frontier, and showed no process-local decisions. Its
  orb, seven destinations, navigation, evidence postures, appearance,
  keyboard/focus, contrast, and reduced-motion checks also passed.
- Staged bundled-resource feature check passed. The exact 1.5 GB temporary
  build stage and the copied Codex executable were removed after testing;
  the installer remains uninstalled.

## Claim ceiling

This proves one accepted-turn interruption, exact host-terminal reconciliation
and a distinct later user turn on a disposable native Windows thread. It does
not prove recovery of a genuinely unknown host acceptance, a new ARE
completion frontier for the interrupted turn, universal semantic recovery,
power-loss durability, an installed-app lifecycle, universal effect
interception, or exclusive handover of this desktop chat. Both `Recovery
unverified` and `Recovered host terminal` are bounded recovery observations,
not managed-session activation statuses.

## Open Questions

- What exact additional evidence can reconcile a completed host turn whose
  ARE completion notification was lost, or a genuinely unknown gateway
  dispatch, without fabricating a completion event or repeating an effect?
- How should an operator distinguish a host-terminal but ARE-unsettled turn
  from a genuinely unknown host delivery in the Companion and recovery API?
- Can the selected desktop client relinquish its writer and route all ingress
  and approvals through ARE for this exact task, with a tested rollback?
