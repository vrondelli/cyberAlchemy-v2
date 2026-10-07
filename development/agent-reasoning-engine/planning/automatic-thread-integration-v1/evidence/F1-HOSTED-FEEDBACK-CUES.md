# F1 hosted feedback-cue candidate

Status: bounded candidate implementation evidence, 2026-09-27. No current-task
activation or general natural-language correction interpreter is claimed.

## Boundary and behavior

The hosted Codex gateway now selects a deterministic feedback provider only for
its `codex:human-chat` consumer in the `interaction-bound` lane when its loaded
profile enables interaction learning. The default profile remains disabled.
The provider accepts three exact, coherent communication corrections about the
last answer (verbosity, technicality, detail), each with an explicit
conversation-long instruction. It attributes the cue to the most recent
completed episode of the same backend thread. It rejects quoted text,
task-specific or one-time language, unsupported combinations, incomplete or
legacy episodes, and other threads. It proposes a `current-interaction`
lesson; it does not silently turn arbitrary messages into preferences.

The correction can accompany a bounded new task sentence. In the canary
profile, the wrapper projects the lesson during preflight, checkpoints it only
after dispatch is admitted, and includes it in outgoing
`additionalContext` for that turn and later turns of the same thread. A real
persistent-gateway transport fixture verified this path through the wrapper
and backend forwarding. The fixture does not establish live Windows-host
readiness, trusted human identity behind the logical gateway consumer, or
exclusive ARE control of this Codex desktop chat.

## Verification

- Focused hosted-cue and interaction-learning suites: 20/20 passed,
  including opt-in, attribution negatives, next-turn application, cross-thread
  isolation, and the rejected correction-only/no-lesson guard.
- `node --test --test-name-pattern='learning-enabled human-chat gateway' implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway.test.mjs`: 1/1 passed through the persistent gateway.
- `node --check implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs`: passed.
- Full wrapper suite including the gateway fixture: 408 passed, 5 skipped,
  0 failed.

## Remaining gaps

- Correction-only messages still fail the ordinary `Send` request-intent
  preflight with `selection.no-match` and leave no lesson behind. The later
  [feedback-only operation](F1-FEEDBACK-ONLY-HOSTED.md) supplies an explicit
  separate action and pending disposition; automatic classification of an
  ordinary chat send remains open.
- The feedback-only path records a pending receipt for unclassified input.
  A later [explicit dismissal path](F1-PENDING-FEEDBACK-DISMISSAL.md) can
  resolve it without learning; application/revision review remains open.
- This is a narrow literal cue set, not a general task-scope, one-time, and
  reusable-preference classifier. It does not establish authenticated
  human-origin provenance from the Windows host.
- The default profile remains disabled. No production activation, host
  handover, or current-chat interception was performed.

## Open Questions

- Should the hosted client submit correction-only feedback as a separate
  governed operation, or should request intent support a feedback-only turn?
- Which verified host/session claim should bind the gateway's logical
  `codex:human-chat` consumer to a particular human-origin message?
