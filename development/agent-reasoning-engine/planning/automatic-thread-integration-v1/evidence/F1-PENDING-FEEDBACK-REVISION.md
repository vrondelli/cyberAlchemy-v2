# F1 explicit pending-feedback revision

Status: bounded hosted-client candidate, 2026-09-28. The [integration work-pack](../INTEGRATION-WORK-PACK.md)
owns F1 status. TUI is discontinued and was not changed. No desktop-task
activation, default learning enablement, product approval, or current-chat
control is implied.

## Contract

An owned-thread reviewer may explicitly select a current-interaction response
lesson to revise while applying an otherwise pending feedback receipt. The
request binds the exact feedback text digest, completed answered episode,
quote, new instruction, predecessor lesson ID, and current lesson digest.
ARE requires that exact predecessor digest to have been in the corrected
episode's dispatch view. A stale digest, foreign thread, unanswered episode,
disabled lesson, changed replay, or missing paired revision field fails
closed. A successful revision keeps the lesson ID, increments its revision,
records the predecessor digest, and does not start a model turn.

The authenticated hosted browser exposes a read-only list of current lessons
for its owned thread. Selecting a revision target is optional and explicit;
before submission, the browser re-reads the list and checks the selected ID
and digest. The gateway and hosted endpoint still enforce ownership and a
closed request. The list includes bounded instruction text so a reviewer can
recognize the target; it does not expose another thread's lessons. Pending
feedback discovery remains content-free.

## Attribution defect found and fixed

The latest answered episode was previously selected with
`Object.values(state.turns).at(-1)`. Canonical state object keys are not
completion order: `are-rpc-25` can sort before `are-rpc-6`. In the installed
canary, that selected the first answer even though the second turn had a
checkpointed completed outcome and answer text. The lifecycle now records the
latest eligible episode by outcome-event order and reconstructs that pointer
while replaying the ledger. A focused numeric-ID regression covers both live
selection and restart replay.

## Verification and ceiling

- Lifecycle and hosted-HTTP suites passed 80/80; the gateway's focused
  learning-enabled human-chat test passed 1/1. The complete Linux wrapper
  package suite passed 508, skipped 14, failed zero (522 tests).
- A disposable installed `codex-cli 0.155.0-alpha.16.4` canary used a private
  loopback Responses provider. It observed four completed model turns, an
  explicit revision of a lesson applied to the second answer, the revised
  instruction and an explicit precedence directive in the latest third-turn
  developer context, exact feedback and revision replay after gateway/client
  restart, and the same active revision on a post-restart fourth request. Three
  completions used host-history proof; the fourth used the owned-runtime
  fallback with detailed history deliberately unavailable. The directive is
  charged to the shared context budget. The canary made zero external model
  calls and no current-task handover.
- The rendered Windows Chrome browser suite passed 9/9. Its revision fixture
  exercises reload, exact-text review, explicit target selection, stale-digest
  rejection before apply, exact revision forwarding, and zero
  review-triggered model turns.

The third model request still contains the old instruction in an earlier
developer message from prior conversation history. The latest ARE learning
context contains only the revised instruction and explicitly marks earlier
versions of that lesson as superseded evidence. This reduces ambiguity but is
not proof that a model ignores historical text. A separately validated
host-history precedence or compaction contract is needed before claiming that
superseded instructions cannot influence future answers. The installed canary
checks the latest context, not absence of the old bytes from the entire wire.

## Open Questions

- How should the host explicitly retire or mark superseded historical
  instruction contexts on revision without rewriting unrelated history?
- What trusted host identity and episode watermark will bind a reviewer after
  exact desktop handover?
- What separate contracts should govern one-time and task-scope correction?
