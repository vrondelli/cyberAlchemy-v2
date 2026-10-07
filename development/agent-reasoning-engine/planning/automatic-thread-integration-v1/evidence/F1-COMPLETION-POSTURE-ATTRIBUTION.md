# F1 completed-episode attribution boundary

Status: bounded candidate implementation evidence, 2026-09-27. No current-task
activation or automatic feedback interpreter is claimed.

## Change

The opt-in interaction-learning lifecycle now checkpoints a `completed` or
`noncompleted` posture with each new host outcome. It retains an inconclusive
observation for interrupted/failed turns but labels its evidence as
`noncompleted`, not `completed`. A later feedback proposal must name an exact
same-interaction episode with a checkpointed `completed` posture. Historical
outcomes that lack this new field still replay under their prior event shape, but are not
accepted as sources for newly attributed lessons. This is intentionally
fail-closed: an older record cannot prove whether a partial host response was
the final answer.

## Verification

- `node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs`: 17/17 passed. New cases cover interrupted and failed host turns after ledger restart, and a legacy outcome without completion posture.
- `node --test implementation/agent-reasoning-engine/packages/request-intent-runtime/test/*.test.mjs`: 65/65 passed.
- The final full wrapper suite passed 404/409 with five skips and no failures.

This closes one attribution safety prerequisite, not F1 as a whole. The gateway
still has no production user-feedback attribution provider, the default
learning profile is disabled, and no ordinary current Codex desktop message
enters this loop through a verified exclusive ARE writer. A later F1 slice must
bind trusted user ingress, distinguish task correction from one-time request
and reusable preference, and demonstrate a next-turn application receipt and
cross-thread negatives without treating quoted/tool text as user feedback.

## Open Questions

- Which exact authenticated client boundary supplies user-origin and episode
  identity to the learning provider for an ARE-owned conversation?
- Which feedback classes can be resolved deterministically, and which require
  a bounded semantic provider or a focused user decision?
