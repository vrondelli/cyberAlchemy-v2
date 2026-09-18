import test from 'node:test';
import assert from 'node:assert/strict';
import {checkpointReasoningState, createReasoningStateLedger, sealReasoningStateEpoch} from './reasoning-state.mjs';

test('memory-only chat evidence seals exact events and clears on close', () => {
  const ledger = createReasoningStateLedger({ledger_id: 'chat:test'});
  const appended = ledger.append({event_kind: 'reply', content: {status: 'done'}, provenance_refs: ['conversation:test']});
  assert.equal(appended.ok, true); assert.match(appended.event.event_digest, /^[a-f0-9]{64}$/);
  const epoch = sealReasoningStateEpoch(ledger, {request_ref: 'turn:test', event_digests: [appended.event.event_digest], frontier: {status: 'replied'}});
  assert.equal(epoch.ok, true); assert.equal(epoch.value.durability, 'process-memory');
  const checkpoint = checkpointReasoningState(ledger, {checkpoint_kind: 'after-turn-completion', epoch: epoch.value});
  assert.equal(checkpoint.ok, true); assert.equal(checkpoint.value.authority_effect, 'none');
  ledger.close(); assert.throws(() => sealReasoningStateEpoch(ledger, {request_ref: 'x', event_digests: [], frontier: {}}));
});
