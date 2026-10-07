# G1 accepted-turn receipt for a lost browser acknowledgement

Status: bounded local implementation evidence, updated 2026-09-28. This does not
activate or take over the current Codex desktop task.

The hosted client now persists a single content-free accepted-turn receipt
when the acknowledged gateway returns a valid `turn/start` ID. The private
recovery file atomically replaces `pending_turn` with `last_turn_result`; a
restart therefore observes either the unresolved intent or the accepted
receipt. The receipt binds the owned thread ID, stable request key, message
SHA-256 digest, accepted turn ID, and timestamp. It contains no message text.
Validated v1 and v2 records migrate to v3 only after the same gateway session
rebinds, preserving a v2 pending intent.

If the browser loses the HTTP response but retains its local pending marker,
an exact accepted receipt clears that marker on reload. If the browser also
loses its origin-local storage, the receipt and recent history remain visible
on a new port. Submitting the same key returns the accepted turn ID locally
without gateway or provider dispatch. A new key with identical text is
rejected until the UI presents the prior accepted turn and the user explicitly
chooses **Confirm new turn**. A changed payload with a previously accepted key
is rejected. An invalid `turn/start` response leaves the intent pending.

## Verification

- Focused browser-helper, host, and private-recovery tests passed 34/34. The
  full wrapper suite passed 338 tests with one platform skip. Syntax checks
  passed for the hosted browser and native canary scripts.
- The installed `codex-cli 0.155.0-alpha.16.4` gateway-restart canary passed
  with the loopback Responses fixture, zero external model calls, and no
  contact with the current desktop task. Binary SHA-256:
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  The restarted client exposed the accepted receipt, replayed its turn ID
  locally, and counted no additional provider request.
- A rendered Firefox run against the disposable recovered thread showed the
  accepted turn and recent history. Submitting identical text displayed the
  confirmation action without dispatch. A simulated matching browser marker
  was cleared on reload; the page returned to Ready and the console had zero
  errors. The confirmation button was not pressed, so that run did not create
  an additional turn. Browser shared libraries were staged in a private
  temporary directory and removed after the run.

## Limits and open questions

- A 2026-09-28 follow-up retains up to 256 content-free accepted receipts in
  one gateway-bound hosted recovery record. It migrates the v3 latest receipt
  after the same gateway rebinds, matches an older browser request key after
  newer turns, and replays that older accepted turn without backend dispatch.
  New sends stop before dispatch when the receipt cap is reached. The browser
  now uses per-tab session storage for its pending-send marker and migrates a
  validated legacy shared marker before clearing it. This prevents ordinary
  simultaneous tabs from overwriting one another's local pending marker; a
  conflicting migration blocks sends rather than discarding an intent.
- The follow-up's focused suite passed 77/77 on Linux (four native-Windows
  cases skipped); the full wrapper suite passed 514/514 (14 platform skips).
  Native Windows focused tests passed 69/69 (12 non-Windows cases skipped),
  including sealed recovery, pending restart, and writer-lock recovery.
- Retention is bounded to one gateway session and 256 receipts. A full record
  requires operator recovery or an independently designed archival policy;
  it cannot silently evict accepted evidence. This is not cross-device
  identity, an unbounded history, or proof against every multi-tab race. A
  genuinely unknown gateway/backend outcome remains pending and must not be
  inferred accepted from a receipt.
- Native Windows recovery is now sealed under the selected user's local app
  data. This is a hosted-client flow, not current desktop-task handover or
  full ingress/effect enforcement.
- The browser confirmation path is covered by host tests and a rendered
  confirmation prompt. A rendered click that deliberately starts a second
  identical turn was not part of this bounded canary.
