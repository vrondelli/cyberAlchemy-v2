# Decisions UX brief

Status: candidate design. Question: **Why did ARE choose that?** A decision
receipt is evidence of evaluation, not proof of authorization or execution.

## User journey

1. Open a decision from a thread or select Decisions to scan recent records.
2. Read a one-line sequence: **question → decision → reason**.
3. Open detail only if needed: type (route, context, effect, continue), scope,
   evidence references, observation time, and explicit effect posture.
4. Return to the originating thread or Overview without losing the filter.

## Minimum effective screen

- A chronological list with plain-language outcome and time, filtered by
  observed thread when entered from Threads.
- One detail panel that distinguishes “evaluated,” “authorization requested,”
  and “effect observed.” Never infer the latter two from a `direct` route.
- Raw identifiers and reason codes behind an expandable technical section.
- No approve/deny, retry, reroute, or replay controls in the first Companion.

The [current Decisions panel](../../ui/dashboard.html) has a bounded, opt-in
read from decisions made by backend threads of currently connected gateway
consumers. A file-backed consumer now checkpoints content-free evaluation
facts in its Reasoning State ledger and can recover the latest 128 after a
wrapper restart; process-memory consumers do not gain that durability. A
current [Threads](THREADS.md) row can open a filter joined by its
gateway consumer, hashed backend-thread reference, and runtime epoch. Back
returns focus to that row; opening Decisions through global navigation clears
the filter. A changed gateway epoch stops the join, and an absent match in a
truncated 32-record snapshot is explicitly inconclusive. Stale thread rows
do not offer a current-decision link. The panel now leads with evaluation
type/outcome, backend-thread scope, event time, and an explicit reminder that
this source does not observe authorization or execution. A native,
keyboard-accessible disclosure contains bounded reason codes and evidence
digests only when requested. It does not show a user question, effect
execution, or complete host history. A disconnected
consumer is outside the current gateway read, even if its ledger survives.
ARE's [decision CLI](../../../../bin/are.mjs)
remains stateless and does not by itself create a history feed. Do not fill
missing scope from unrelated logs or sample receipts. The panel rejects an
already-expired observation and withdraws its current bounded list when
that read ages out; a fresh read is needed before showing current records.

## State contract

| State | User-facing meaning |
| --- | --- |
| Observed | A source-backed record with exact time, type, outcome, and scope. |
| No records | “No backend-thread decisions observed for current gateway consumers”; disconnected consumers and host-task history remain unknown. |
| Stale | State when history was last available; do not imply the list is current. |
| Not configured | Explain that the bounded gateway read is off; complete host history is not exposed here. |
| Unavailable | Explain a read failure; preserve the selected filter for retry. |

## Experience checks

- In a scenario with an effect gate, readers do not interpret the assessment
  as permission to execute.
- A decision opened from a thread returns to that thread, not a global list.
- Missing or expired history is explicitly different from “no decisions.”
- The [browser fixture](../../scripts/test-navigation-browser.mjs) checks the
  exact join, global clearing, return focus, changed epoch, truncated absence,
  failed-refresh focus recovery, narrow-width control visibility, collapsed
  technical evidence, and on-demand reason reveal. The
  extracted unsigned Windows build also passed a native WebView2 run against
  a one-thread/one-decision development gateway fixture, including link,
  filter and return focus. The later [current-source Decisions disclosure check](../DECISIONS-DISCLOSURE-CURRENT-2026-10-02.md)
  adds a fresh staged native WebView2 collapsed/Enter-open pass and an unsigned
  installer that remains uninstalled. Neither is a live host-task test.
- A current-source follow-up preserves an open technical disclosure and its
  keyboard focus when the same exact decision is refreshed from the same
  gateway epoch. It clears that state on a changed epoch, missing decision,
  failed read, or expired observation and moves focus to the Decisions heading
  if the focused detail disappears. The 59-test dashboard suite and isolated
  Chromium journey pass, including the rendered same-source refresh. This is
  source/browser evidence only, not an installed Windows or Linux result.

## Open Questions

- The per-consumer Reasoning State ledger now owns the bounded recovered
  evaluation trace. What explicit retention and deletion policy should govern
  that ledger beyond the existing gateway byte cap and 128-record read window?
- Can the UI link an evaluated effect to independently observed execution,
  or must execution remain “not observed”?
