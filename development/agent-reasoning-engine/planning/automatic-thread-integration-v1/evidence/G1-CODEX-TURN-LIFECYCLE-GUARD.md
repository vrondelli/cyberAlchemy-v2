# G1 Codex turn-lifecycle notification guard

Status: bounded candidate integration evidence, 2026-09-28. No current-task
handover, activation, release, or deployment is claimed.

## Gap and implementation

The pinned Codex App Server catalog already required a `threadId` for
`turn/started` and `turn/completed`, but the gateway accepted either event with
no `turn.id` or a status inconsistent with the event phase. An owned-thread
`turn/completed` could therefore reach the ARE wrapper without a usable turn
identity and be considered by the completion/continuation path.

The Codex gateway's server-method posture now requires a bounded, nonblank
turn ID. `turn/started` requires `inProgress`; `turn/completed` requires
`completed`, `interrupted`, or `failed`. Invalid events produce the
content-free `host.server-turn-lifecycle-invalid` diagnostic and stop that
gateway session before the wrapper sees them. This applies to the pinned
Codex adapter, not the separately declared DSH server-event contract.

The exact installed `codex-cli 0.155.0-alpha.16.4` generated schema defines
`TurnStartedNotification` and `TurnCompletedNotification` with `threadId` and
`turn`, and `Turn` with an ID and status. The semantic phase constraint above
is an ARE gateway requirement, not a claim that the generated schema alone
enforces the phase.

## Verification

- Pure posture tests cover valid started/completed/failed/interrupted cases and
  reject missing or malformed IDs, nonterminal completion, and wrong started
  status.
- A gateway fixture with an owned backend thread proves three malformed
  lifecycle events stop before wrapper delivery and do not echo private item
  content or a private turn ID.
- `node --test test/host-method-policy.test.mjs test/gateway.test.mjs` passed
  85/85. The full wrapper `npm test` passed 451, failed 0, skipped 11.
- The disposable installed-host cross-process canary passed two fixed local
  provider turns, gateway writer-lock rejection, post-close direct resume,
  and teardown on the pinned binary. It made zero external model calls and
  did not touch this task or active host configuration.

## Claim ceiling and open questions

This validates only the named lifecycle event identity/phase boundary and
bounded installed-host compatibility. It does not prove that each lifecycle
turn belongs to a previously accepted gateway request, validate all server
event fields or all 82 notification types, intercept every effect, or transfer
the current desktop task's writer and input path. G1/O1 remain open under the
[session-control contract](../SESSION-CONTROL-CONTRACT.md).

## 2026-09-28 completion-to-accepted-turn binding

The Codex gateway now checks an owned-thread `turn/completed` against a durable
`turn-start-accepted` or host-history `turn-marker-observed` receipt with the
same hashed thread and turn before the event reaches the ARE wrapper. An
unaccepted or different turn stops the session with a content-free
`gateway.turn-completion-unbound` diagnostic; it cannot create a Reasoning
State completion or automatic successor. The guard is Codex-specific, so the
separate generic and DSH adapter contracts are unchanged. Synthetic successor
fixtures now begin with an accepted parent turn instead of relying on an
unbound completion.

The focused gateway suite passed 84/84 and the full wrapper suite passed 458,
skipped 11, failed 0. The disposable installed `codex-cli 0.155.0-alpha.16.4`
canary passed two fixed-provider turns, one gateway-writer lock rejection,
post-close direct resume, and teardown with zero external model calls and no
current-task mutation. This tests ordinary installed-host ordering; a
completion arriving before its acceptance receipt fails closed rather than
being buffered; the pending-response fixture verifies this refusal. `turn/started` and other item notifications are not yet
causally bound to an accepted turn, and this still does not prove desktop
writer handover or universal effect coverage.

## 2026-09-28 native notification-order observation

The disposable installed-host canary now reports content-free notification
method order around the gateway `turn/start` request-promise boundary. On one
run against exact `codex-cli 0.155.0-alpha.16.4` (binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`),
no turn or item notification reached the gateway client before the
`turn/start` request resolved. The observed sequence through completion was
`turn/started`, `item/started`, `item/completed`, `item/started`,
`item/completed`, `turn/completed`. The canary passed with two fixed local
provider calls, zero external model calls, no active-task or configuration
mutation, and scratch teardown.

This is one observed gateway-client sequence, not a host transport ordering
guarantee. The official App Server lifecycle documentation names these events
but does not promise response-before-notification ordering. A future causal
guard for `turn/started` and item events therefore needs a bounded early-event
handling rule or an explicit fail-closed compatibility choice; this observation
alone is not a reason to assume all host versions will order them identically.

## 2026-09-28 pinned turn-scoped notification binding

The gateway now requires a matching durable `turn-start-accepted` or
`turn-marker-observed` receipt before forwarding any Codex `turn/*` or `item/*`
server notification to the ARE wrapper. The pinned method catalog contains 19
such notification methods. Lifecycle events use `params.turn.id`; the other
turn-scoped events use `params.turnId`. The ID must be nonblank, trimmed and at
most 256 UTF-8 bytes. The receipt must match both the hashed owned thread and
the hashed turn. A missing, mismatched or pre-acceptance event produces a
content-free diagnostic and closes that gateway session. The earlier specific
completion and completed-compaction diagnostic codes remain intact. The guard
does not apply to server requests or to the generic/DSH adapter contracts.

The pinned installed-host experimental schemas require `turnId` for the item,
delta, diff, plan and moderation notification shapes inspected here. The
selected compatibility rule was deliberately fail-closed: early notifications
were not inferred from a pending `turn/start` and were not buffered for replay.
The later bounded replay rule below supersedes this pre-acceptance behavior
without relaxing the accepted-turn identity check.
The disposable host observation found response-before-notification order, but
one run is not a transport guarantee; the bounded early-event handling later
added for this catalog is described below.

At that stage, gateway fixtures rejected an unaccepted `turn/started`, a start
before the host acceptance response, a mismatched item, a missing item turn ID
and a mismatched turn update before wrapper delivery, without echoing private
event content. The later bounded queue changes only the pre-acceptance case.
An accepted start/item/delta/completion/update sequence reaches the wrapper in
order. The durable streamed-delivery restart fixture now begins with a real
accepted turn before replaying its unacknowledged delta. The focused gateway
and policy suites passed 98/98; the full wrapper suite passed 464, skipped 11,
failed 0. The exact installed `codex-cli 0.155.0-alpha.16.4` disposable
two-turn canary passed again with two fixed local provider calls, zero
external model calls, no current-task or active-configuration mutation and
scratch teardown.

This closes the named pinned turn-scoped notification acceptance-identity gap,
not full per-item ordering, replay semantics, the entire server-event schema,
or the effect boundary. It does not release the desktop client's writer,
transfer this chat's ingress to ARE, or activate the session-control contract.

## Bounded pre-acceptance replay follow-up

The current gateway can withhold early Codex `turn/*` and `item/*`
notifications only when exactly one `turn/start` request is pending for their
owned thread and their thread and turn IDs are bounded. The queue has the
gateway's configured message limit. A successful host response first records
the exact durable `turn-start-accepted` observation; only notifications whose
turn hash matches that receipt are then released to the wrapper in arrival
order. A rejected or mismatched response cannot turn an early event into
acceptance. This is a same-process compatibility rule, not restart replay of
unacknowledged host notifications.

A new gateway fixture sends `turn/started`, a completed
`contextCompaction` item, and `turn/completed` before the host's `turn/start`
response. Before acceptance, the wrapper receives none and the store has no
host observation. After acceptance, the wrapper receives the response and
three notifications in order; the durable observations are acceptance,
compaction completion, and terminal completion. The existing mismatch fixture
still stops the gateway without echoing private turn content. A separate
rejected-start fixture verifies that an early compaction event is never
released or recorded if the host rejects `turn/start`; the session stops
without echoing its private item or turn ID. Both focused new tests passed;
the full wrapper suite passed 516, failed 0, and skipped 14. This does not
prove every installed-host event ordering,
hard-crash survival of a pending queue, full per-item causal semantics, or
current desktop-task handover.

## 2026-09-28 schema-wide turn-bearing notification binding

The exact installed `codex-cli 0.155.0-alpha.16.4` server-notification schema
(binary SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
requires `turnId` on 26 notification methods, including `error`, token usage,
strict review, compaction, model and auth-recovery events outside `turn/*` and
`item/*`. It permits nullable `turnId` on `thread/goal/updated`, `hook/started`
and `hook/completed`. The pinned catalog and its live-schema verifier now bind
both exact method lists. For the Codex gateway, every required-turn event and
each optional event carrying a non-null turn ID must match an accepted or
history-observed turn on its owned thread before reaching the wrapper. A null
or absent optional turn ID retains thread-only handling. The existing bounded
pre-acceptance queue also withholds these events until an exact durable
`turn-start-accepted` receipt; a mismatch or rejected start fails closed.
This rule does not change generic or DSH adapter postures.

Focused gateway, host-policy and catalog-verification suites passed 126/126,
including mismatched non-`turn/*` events, an optional hook/goal turn mismatch,
accepted delivery and early token-usage replay. The full wrapper suite passed
529, failed 0, skipped 14. The installed-host disposable user-input canary
passed against the pinned binary with two fixed loopback-provider requests,
zero external model calls, no current desktop-task mutation and scratch
teardown. An older `test-native-prompt-hook.mjs --gateway-wrapper` canary was
also attempted but failed at `thread/start` because its fixture parameters no
longer satisfy the current gateway policy; it supplies no positive validation
for this change. The current user-input canary and focused gateway suites do.

This is a version-bound acceptance-identity guard, not full validation of
every field in all 82 server notifications, per-item causal ordering, complete
effect interception, or a live desktop writer/input handover. G1 and O1 remain
open under the session-control contract.
