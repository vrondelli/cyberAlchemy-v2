# F1 explicit narrow-scope feedback guard

Status: bounded ARE-owned hosted-path construction, 2026-09-28. This does not
classify arbitrary feedback or control the current desktop task.

## Problem and boundary

The hosted feedback-only action could save an explicitly one-time or task-only
note as pending, then the review action could materialize it as a
`current-interaction` lesson for later answers. That broadens the user's
literal scope. The browser review form describes the later-answer effect but
had no runtime check against the original feedback text.

The interaction-learning lifecycle now recognizes only a small, explicit
scope-conflict set: `just this once`, `this answer only`, `the next answer
only`, and `this task only` variants. For new feedback-only submissions, it
checkpoints a content-free pending receipt with
`learning.feedback-scope-conflict` before calling the feedback provider.
An exact pending review of that text returns the same reason and creates no
lesson. A normal user turn containing one of those phrases still dispatches
as a user request, but an input provider cannot turn it into an ARE lesson.
The browser explains that one-time/task-only requests belong in Send, not in
an instruction for later answers. Existing applied lesson replay is left
unchanged; the guard does not rewrite prior ledgers.

## Verification and claim ceiling

- Focused interaction-learning suite: 27/27 passed, including four literal
  scope variants, no lesson after explicit review, normal-turn dispatch, and
  pending replay after ledger restart.
- Hosted-cue suite: 5/5 passed; its one-time and task-only negative cases now
  expect the specific scope-conflict reason.
- Full wrapper suite: 531 total, 517 passed, 14 skipped, zero failed.
- The cached local Chromium hosted-browser suite passed 9/9, including the
  rendered scope-conflict guidance and content-free pending-review dismissal
  after reload. No browser installation or active host configuration changed.

This is a fail-closed narrow-scope guard, not a one-time execution feature,
general intent classifier, trusted human-origin proof, or host context-removal
capability. F1 and G1 remain partial; default learning stays disabled.

## Open Questions

- What host mechanism can deliver a one-time directive and prove it is absent
  from later model context?
- How are task boundaries represented and verified independently of a long
  conversation thread?
- What explicit reviewed scope contract should support broader feedback
  without silently upgrading one-time or task-specific text?
