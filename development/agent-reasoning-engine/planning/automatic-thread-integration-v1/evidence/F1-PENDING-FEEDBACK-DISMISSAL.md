# F1 explicit pending-feedback dismissal

Status: bounded candidate implementation evidence, 2026-09-28. No current-task handover or broad correction interpreter is claimed.

## Behavior

Unclassified feedback remains a durable, content-free pending receipt. The owned-thread client can now explicitly dismiss one pending receipt by resubmitting its exact feedback ID and text. ARE verifies the stored digest, appends and checkpoints a separate reviewed event, and returns `dismissed`; it creates no lesson and starts no model turn. Changed text, another thread, a missing pending receipt, or an unacknowledged ledger write fails closed. A dismissed ID replays as dismissed after restart and cannot become a lesson when the same submission is retried. Dismissal releases the active pending-count budget but retains the content-free audit history.

The gateway admits the wrapper-local method only on a thread owned by that consumer. The authenticated hosted HTTP client exposes a closed `POST /api/feedback/dismiss` boundary. Its browser retains only ID, thread and text digest when a pending receipt is acknowledged; after reload, the user must re-enter the exact text to dismiss it. Ordinary `Send` remains available during pending review. Forgetting the browser review key is an explicit local action with a warning; it does not dismiss the ARE record.

## Verification

- Focused lifecycle, cue and method-policy suites: 34/34 passed before the file-backed addition; the file-backed pending/dismiss/replay test passed separately.
- Hosted gateway owned-thread and foreign-consumer fixture: passed. Its test buffer was raised from four to twelve unacknowledged messages to accommodate the longer exchange; delivery-limit behavior is tested separately.
- Hosted HTTP and browser-marker suites: 51/51 passed, including closed input, exact ownership, zero model dispatch and digest-only reload.
- Full wrapper package suite: 486 passed, 13 skipped, 0 failed.
- Windows Node with installed Windows Chrome: all 8 rendered hosted-client browser tests passed, including pending review, reload, ordinary Send, wrong-text rejection, exact dismissal and zero uncaught page errors.

## Claim ceiling and open questions

This resolves only the explicit *dismiss* branch. Applying or revising ambiguous feedback still needs a reviewed instruction/episode/scope contract and trusted human-origin binding. A browser that deliberately forgets the review key can leave an ARE pending record without a client recovery list; server-side inspection/adjudication and retention are open. The default learning profile remains disabled, and this desktop task has not been activated under ARE control.
