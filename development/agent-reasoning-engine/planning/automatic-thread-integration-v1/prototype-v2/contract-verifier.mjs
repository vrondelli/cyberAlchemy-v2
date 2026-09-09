// Executable trace contract, not a host adapter or production learning runtime.
import {createHash} from 'node:crypto';
export const digest = text => createHash('sha256').update(text).digest('hex');
export function verifyTrace(contract, trace) {
  const requests = new Map(), changes = new Map(), checkpoints = new Set();
  const projections = new Map(), dispatched = new Set(), outcomes = new Map();
  const disabled = new Set(), seen = new Set();
  let mode = contract.default_mode;
  const need = (condition, reason) => {if (!condition) throw Error(reason);};
  const requestOrder = new Map(), outcomeOrder = new Map();
  const validateLessons = (request, projection) => {
    need(mode === 'apply-scoped' || projection.lesson_ids.length === 0, 'reuse-disabled');
    for (const id of projection.lesson_ids) {
      need(changes.get(id)?.kind === 'lesson' && checkpoints.has(id), 'uncheckpointed-lesson');
      need(!disabled.has(id), 'disabled-lesson-applied');
      need(!(request.override_ids ?? []).includes(id), 'current-request-override-ignored');
    }
  };
  for (const [position, event] of trace.entries()) {
    need(typeof event.id === 'string' && event.id.length > 0 && !seen.has(event.id), 'event-identity-conflict');
    seen.add(event.id);
    for (const key of ['thread_id', 'session_id', 'cwd', 'participant_ref', 'product_ref']) {
      need(event[key] === contract.binding[key], 'scope-mismatch');
    }
    if (event.type === 'request') {
      need(event.origin === 'user' && event.quoted !== true, 'unattributed-input');
      need(typeof event.text === 'string' && event.request_digest === digest(event.text), 'request-digest-mismatch');
      need(typeof event.request_id === 'string' && event.request_id.trim().length > 0, 'invalid-request-identity');
      need(!requests.has(event.request_id), 'request-identity-conflict');
      requestOrder.set(event.request_id, position);
      requests.set(event.request_id, event);
    } else if (event.type === 'change') {
      const source = requests.get(event.source_request_id);
      need(source && event.source_role === 'user' && event.quoted !== true, 'unattributed-feedback');
      need(typeof event.quote === 'string' && event.quote.length > 0 && source.text.includes(event.quote), 'ungrounded-feedback');
      need(['lesson', 'objective', 'control'].includes(event.kind), 'unsupported-change');
      if (event.kind === 'lesson') {
        need(mode !== 'off', 'learning-disabled');
        need(event.posture === 'explicit' || event.confirmed === true, 'inferred-feedback-not-confirmed');
        need(outcomes.get(event.episode_id) === 'completed', 'episode-not-observed');
        need(outcomeOrder.get(event.episode_id) < requestOrder.get(event.source_request_id), 'feedback-precedes-outcome');
        need(event.retention_scope === 'current-thread', 'retention-scope-exceeded');
      }
      if (event.kind === 'control') {
        need(['set-mode', 'disable-reuse'].includes(event.action), 'unknown-control');
        if (event.action === 'set-mode') need(contract.automatic_modes.includes(event.mode), 'invalid-mode');
        else need(changes.get(event.lesson_id)?.kind === 'lesson', 'unknown-lesson');
      }
      changes.set(event.id, event);
    } else if (event.type === 'checkpoint') {
      const change = changes.get(event.change_id);
      need(change && event.durable === true && !checkpoints.has(event.change_id), 'invalid-checkpoint');
      checkpoints.add(event.change_id);
      if (change.kind === 'control') {
        if (change.action === 'set-mode') mode = change.mode;
        else disabled.add(change.lesson_id);
      }
    } else if (event.type === 'projection') {
      const request = requests.get(event.request_id);
      need(request && event.request_digest === request.request_digest, 'projection-request-mismatch');
      need(Number.isSafeInteger(event.context_bytes) && event.context_bytes >= 0 && event.context_bytes <= contract.context_max_bytes, 'context-overflow');
      need(Array.isArray(event.lesson_ids), 'invalid-projection');
      validateLessons(request, event);
      projections.set(event.request_id, event);
    } else if (event.type === 'dispatch') {
      const request = requests.get(event.request_id);
      need(request && event.request_digest === request.request_digest, 'dispatch-request-changed');
      need(projections.has(event.request_id), 'projection-missing');
      need([...changes.keys()].every(id => checkpoints.has(id)), 'checkpoint-missing');
      need(!dispatched.has(event.request_id), 'duplicate-dispatch');
      validateLessons(request, projections.get(event.request_id));
      dispatched.add(event.request_id);
    } else if (event.type === 'outcome') {
      need(dispatched.has(event.request_id) && !outcomes.has(event.request_id), 'outcome-identity-invalid');
      need(['completed', 'interrupted', 'failed', 'delivery-unknown'].includes(event.status), 'invalid-outcome');
      outcomes.set(event.request_id, event.status);
      outcomeOrder.set(event.request_id, position);
    } else if (event.type === 'capability-proposal') {
      need(outcomes.has(event.episode_id) && event.authority_effect === 'none' && event.implementation_changed === false, 'capability-authority-exceeded');
    } else {
      throw Error('unsupported-event');
    }
  }
  need([...changes.keys()].every(id => checkpoints.has(id)), 'incomplete-checkpoint');
  return {status: 'PASS', events: trace.length, dispatches: dispatched.size,
    claim: 'Trace satisfies prototype invariants; no live host or learning quality proved.'};
}
