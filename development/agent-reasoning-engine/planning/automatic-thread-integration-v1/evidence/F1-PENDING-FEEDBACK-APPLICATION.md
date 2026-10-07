# F1 explicit pending-feedback application

Status: bounded hosted-client candidate, 2026-09-28. The [integration work-pack](../INTEGRATION-WORK-PACK.md)
owns F1 status. No desktop-task activation, product approval, or default learning
enablement is implied.

## Contract and trade-off

An unclassified feedback submission remains pending; ARE does not turn it into
a lesson automatically. The pending record now carries only the identity of the
most recent completed, answered episode in that thread as a **review candidate**,
or `null`. This is not an attribution decision. The owner must explicitly
resubmit the exact feedback text, select an episode identity, identify a quote
inside that text, and supply the intended response instruction. The reviewed
application is restricted to `current-interaction`; the caller cannot select
product-wide retention or another target. A later bounded extension permits
revision only with an explicit predecessor ID and digest; see
[revision evidence](F1-PENDING-FEEDBACK-REVISION.md).
The selected quote and instruction become durable lesson content; the complete
original feedback text is not retained in the pending/review events.

The wrapper-local `cyberalchemy/learning/applyPendingFeedback` method verifies
the pending digest, same-thread completed episode, answer presence, enabled
`apply-scoped` policy, and exact reviewed input before checkpointing one lesson.
The lesson event binds the pending review atomically for replay. A second
identical review returns the same lesson; changed review fields, a foreign
thread, an unanswered episode, duplicate equivalent lesson, or an attempt to
dismiss an applied review fails closed. The gateway admits the method only for
the authenticated consumer's owned thread. The hosted HTTP endpoint additionally
requires an owned, idle thread and closed request fields; it starts no model
turn.

## Verification

- Focused lifecycle, gateway, and hosted-HTTP suites passed 182/182. They cover
  same-thread review, wrong text/episode, unanswered output, replay, foreign
  consumer denial, current-interaction-only result, and zero model dispatch by
  the review endpoint.
- The final Linux wrapper package suite passed 505, skipped 14, failed zero
  (519 tests); its browser cases are skipped there. The rendered browser suite
  passed 9/9 with Windows Node, installed Chrome, and the local Playwright
  runtime. Syntax and tracked-diff whitespace checks passed.
- The disposable installed-Codex canary on `codex-cli 0.155.0-alpha.16.4`
  submitted pending feedback, obtained its content-free candidate, explicitly
  applied it, restarted gateway/client, replayed the exact review, and verified
  the reviewed instruction alongside the original scoped lesson on the second
  private Responses-provider request. It observed two local model requests,
  zero external model calls, and no current-task handover. Detailed host-history
  failure after restart was test-simulated; the owned-runtime fallback supplied
  that turn's completion proof.

## Remaining boundary

The hosted browser now offers a form for exact text, quote and instruction,
then obtains the content-free suggested episode and submits the explicit
application. Its rendered reload/wrong-text/zero-turn flow passed in the
disposable browser fixture. Possession of that client's token is not
a separately verified human-origin claim. Arbitrary feedback is not classified
automatically, the supplied instruction's semantics are not machine-verified,
one-time/task-wide/product-wide scope and historical revision precedence remain open, and this
desktop conversation is not ARE-controlled. TUI is discontinued.

## Open Questions

- What trusted host identity and episode watermark will bind a reviewer after
  exact desktop handover?
- What separate review contracts should support task-scope and one-time
  correction without silently widening retention?
