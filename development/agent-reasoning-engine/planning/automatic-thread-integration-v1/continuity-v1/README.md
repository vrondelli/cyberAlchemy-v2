# ARE continuity prototype

This isolated adapter adds request revisions and revision-bound context recovery
on top of natural-feedback-v2 and the existing ARE lifecycle. It does not install
hooks or activate ARE in the parent conversation.

## Steering

`UserPromptSubmit` begins host turn T at revision 0. A local `Steer` event supplies
T, revision 1 and the new prompt; subsequent steering increments exactly once.
The preceding unfinished revision is recorded as superseded. Its partial answer
never becomes a completed learning episode. Stop or Interrupt must name the
current revision; stale and duplicate events are rejected. Request identities
use JSON pairs so host turn text cannot collide with a revision suffix.

The input prompt is preserved as the revision's request text. The caller must
supply the intended request text; this adapter does not merge arbitrary steering
messages or rewrite the model's conversation. Same-turn native delivery and
acknowledgement are not established by these local events.

## Compaction recovery

A local `ContextRestore` event supplies the current turn, revision, a unique
compaction_id, and the request_digest and context_digest from its projection.
The adapter recovers the ledger, checks that the revision is still current and
unfinished, and requires the projection's lifecycle-state digest to match current
state. It returns that exact bounded guidance in `continuityOutput`.

This restores retained preferences and current-request temporary exceptions;
it does not reconstruct the full task transcript or the model's hidden state.
Summary text is never interpreted as feedback. Restoration creates a recovery
receipt only: no new request, lesson, dispatch or completed episode. A completed,
superseded, mismatched or stale projection fails closed. No guidance is returned
when the saved current projection is empty, including learning-off mode.

`Steer` and `ContextRestore` are explicit internal prototype event names, not
claims about supported native Codex hook names. The host integrator still needs
to establish event mapping, identity provenance, delivery and acknowledgements.
Projection and recovery receipts therefore say delivery is unknown.

## Tests and limits

Tests use fresh adapter subprocesses and disposable real file ledgers. The v2
adapter and interpreter regression tests are retained, adjusting only assertions
for the new JSON-pair identities. New tests cover revision ordering, supersession,
stale completions, recovery binding, summary injection, temporary exceptions,
off mode, duplicate compaction, and pending confirmation across compaction.
See TEST-RECEIPT.json and TEST-OUTPUT.tap for completed results and TEST-SOURCES.json
for the tested source closure. Predecessor package hashes are preserved.

Run from the repository root:

```sh
node --test --test-reporter=tap cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/continuity-v1/adapter.test.mjs cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/continuity-v1/interpreter.test.mjs cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/continuity-v1/continuity.test.mjs
```

Product frontier: locally testable continuity candidate. Next construction work
is a host event-mapping contract and delivery-acknowledgement validation. General
language understanding, capability learning and multi-agent attribution remain
open. No cost or reliability comparison with plain-text summaries was performed.

Operational support owner: host integrator; affected stages: native canary and
later activation. These remain deferred, with no causal blocker to local work.
The previous four Luna turns are exhausted; this package uses zero model calls.
No product approval, activation, publication or installation is claimed.
