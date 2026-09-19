import {createHash} from 'node:crypto';

const states = new WeakMap();
const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
const text = value => typeof value === 'string' && value.trim().length > 0;
const freeze = value => Object.freeze(value);

function stateFor(ledger) {
  const state = states.get(ledger);
  if (!state || state.closed) throw new Error('reasoning-ledger-unavailable');
  return state;
}

export function createReasoningStateLedger({ledger_id}) {
  if (!text(ledger_id)) throw new Error('reasoning-ledger-id-required');
  const state = {ledger_id, sequence: 0, events: new Map(), closed: false};
  const ledger = freeze({
    append({event_kind, content, provenance_refs}) {
      if (!text(event_kind) || !content || typeof content !== 'object' || Array.isArray(content) ||
          !Array.isArray(provenance_refs) || provenance_refs.some(ref => !text(ref))) return freeze({ok: false, reason_codes: ['reasoning.event-invalid']});
      const active = stateFor(ledger); active.sequence++;
      const material = {schema_version: 'are.public-chat-reasoning-event/v1', ledger_id: active.ledger_id, sequence: active.sequence,
        event_kind, content: structuredClone(content), provenance_refs: [...provenance_refs], authority_effect: 'none'};
      const event = freeze({...material, event_digest: hash(material)}); active.events.set(event.event_digest, event);
      return freeze({ok: true, event, authority_effect: 'none'});
    },
    close() {state.closed = true; state.events.clear(); return freeze({ok: true, authority_effect: 'none'});},
  });
  states.set(ledger, state); return ledger;
}

export function sealReasoningStateEpoch(ledger, {request_ref, event_digests, frontier}) {
  const state = stateFor(ledger);
  if (!text(request_ref) || !Array.isArray(event_digests) || event_digests.length < 1 || event_digests.some(item => !state.events.has(item)) ||
      !frontier || typeof frontier !== 'object' || Array.isArray(frontier)) return freeze({ok: false, reason_codes: ['reasoning.epoch-invalid']});
  const material = {schema_version: 'are.public-chat-reasoning-epoch/v1', ledger_id: state.ledger_id, request_ref,
    event_digests: [...event_digests], frontier: structuredClone(frontier), durability: 'process-memory', authority_effect: 'none'};
  const value = freeze({...material, epoch_digest: hash(material)});
  return freeze({ok: true, value, digest: value.epoch_digest, authority_effect: 'none'});
}

export function checkpointReasoningState(ledger, {checkpoint_kind, epoch}) {
  stateFor(ledger);
  if (checkpoint_kind !== 'after-turn-completion' || !epoch || !text(epoch.epoch_digest)) return freeze({ok: false, reason_codes: ['reasoning.checkpoint-invalid']});
  const material = {schema_version: 'are.public-chat-reasoning-checkpoint/v1', ledger_id: epoch.ledger_id, checkpoint_kind,
    epoch_digest: epoch.epoch_digest, durability: 'process-memory', authority_effect: 'none'};
  const value = freeze({...material, checkpoint_digest: hash(material)});
  return freeze({ok: true, value, digest: value.checkpoint_digest, authority_effect: 'none'});
}
