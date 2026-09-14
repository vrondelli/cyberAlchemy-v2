import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canonicalJson, digestValue, freezeResult} from './canonical.mjs';
import {materializeLearningPolicy, createInteractionState, reduceInteractionState, projectInteractionContext, assessGrounding,
  materializeScopedLesson, verifyLearningRecord} from '../../request-intent-runtime/src/learning-loop.mjs';
import {createCorrectedIntentContract} from '../../request-intent-runtime/src/reflection.mjs';
import {assessInteractionLearningProgress, createInteractionEvolutionAdapter} from '../../evolution-runtime/src/interaction-learning.mjs';

export const LEARNING_CONTEXT_KEY = 'cyberalchemy.are.interaction-learning';
const EVENT = 'interaction-learning-transition';
const fail = reason => ({ok: false, reason_codes: [reason], authority_effect: 'none'});
export function validInteractionLearningConfiguration(config) {
  if (!config || typeof config.enabled !== 'boolean' || Object.keys(config).some(k => !['enabled', 'participant_ref', 'product_ref', 'policy'].includes(k))) return false;
  if (config.enabled && ![config.participant_ref, config.product_ref].every(v => typeof v === 'string' && v.trim())) return false;
  try {materializeLearningPolicy(config.policy); return true;} catch {return false;}
}
export function createInteractionLearningLifecycle({ledger, configuration = {enabled: false}, input_provider, evolution = {}}) {
  if (!validInteractionLearningConfiguration(configuration)) throw Error('learning.configuration-invalid');
  const enabled = configuration.enabled;
  const defaultPolicy = materializeLearningPolicy(configuration.policy);
  const binding = {participant_ref: configuration.participant_ref ?? 'disabled', product_ref: configuration.product_ref ?? 'disabled', interaction_ref: 'product-interactions'};
  let state = createInteractionState(binding), fault = false;
  const events = new Map(), output = new Map();
  for (const saved of ledger.snapshot()) {
    if (saved.event_kind !== EVENT || saved.content.binding?.participant_ref !== binding.participant_ref || saved.content.binding?.product_ref !== binding.product_ref) continue;
    const event = saved.content.event;
    if (events.has(event.event_id)) throw Error('learning.duplicate-history');
    state = reduceInteractionState(state, event);
    if (state.record_digest !== saved.content.state_digest) throw Error('learning.replay-drift');
    events.set(event.event_id, digestValue(event));
  }
  const policy = () => state.policy ?? defaultPolicy;
  const adapter = enabled ? createInteractionEvolutionAdapter({implementation_binding: {path: 'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs',
    sha256: createHash('sha256').update(readFileSync(new URL('../../request-intent-runtime/src/learning-loop.mjs', import.meta.url))).digest('hex')}, ...evolution}) : null;
  const identity = (thread, id) => `learning:${canonicalJson([thread, id])}`;
  function apply(event) {
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    if (events.has(event.event_id)) return events.get(event.event_id) === digestValue(event) ? {ok: true, disposition: 'replayed'} : fail('learning.event-identity-conflict');
    try {
      const next = reduceInteractionState(state, event);
      const appended = ledger.append({event_kind: EVENT, idempotency_key: event.event_id,
        content: {binding, event, state_digest: next.record_digest}, provenance_refs: [event.event_id]});
      if (!appended.ok) {fault = true; return appended;}
      const epoch = ledger.seal({event_digests: [appended.event.event_digest], consumer_ref: binding.participant_ref, request_ref: event.event_id});
      if (!epoch.ok) {fault = true; return epoch;}
      const checkpoint = ledger.checkpoint({checkpoint_kind: 'manual', epoch: epoch.value, subject_digest: next.record_digest});
      if (!checkpoint.ok) {fault = true; return checkpoint;}
      state = next; events.set(event.event_id, digestValue(event)); return {ok: true, state_digest: state.record_digest};
    } catch (error) {return fail(error.message);}
  }
  function prepare(message) {
    if (!enabled) return {ok: true, disposition: 'disabled'};
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    const thread = message.params?.threadId;
    const request = (message.params?.input ?? []).filter(i => i?.type === 'text').map(i => i.text).join('\n');
    const request_ref = identity(thread, message.params?.clientUserMessageId ?? message.id);
    if (state.turns[request_ref]) return fail('learning.request-recorded-dispatch-not-retried');
    if (!state.policy) {const pinned = apply({event_id: 'learning-policy:initial', kind: 'policy', policy: defaultPolicy, source_ref: 'host:learning-configuration'}); if (!pinned.ok) return pinned;}
    let supplied = {};
    try {
      if (typeof input_provider === 'function') supplied = input_provider(freezeResult({request, request_ref, interaction_ref: thread, state, policy: policy(), authority_effect: 'none'}));
      if (!supplied || typeof supplied !== 'object' || typeof supplied.then === 'function') { if (supplied?.then) Promise.resolve(supplied).catch(() => {}); return fail('learning.input-adapter-must-be-synchronous'); }
      if (supplied.feedback && policy().mode !== 'off') {
        const feedback = supplied.feedback, prior = state.turns[feedback.episode_ref];
        if (!prior?.outcome || prior.interaction_ref !== thread) return fail('learning.feedback-attribution-unresolved');
        const grounding = assessGrounding({request, participant_ref: binding.participant_ref, product_ref: binding.product_ref,
          source: {role: 'user', participant_ref: binding.participant_ref, product_ref: binding.product_ref, request_ref,
            request_digest: digestValue(request), quote: feedback.quote, quoted: feedback.quoted === true}});
        const corrected = createCorrectedIntentContract(prior.intent_contract, {request_ref, request_digest: digestValue(request), objective: feedback.instruction});
        const lesson = materializeScopedLesson({...feedback, ...binding, interaction_ref: thread, grounding,
          episode_ref: feedback.episode_ref, observation_digest: prior.outcome.observation_digest,
          previous_contract: prior.intent_contract, corrected_contract: corrected,
          predecessor: feedback.revises_lesson_id ? state.lessons[feedback.revises_lesson_id] : undefined});
        const stored = apply({event_id: `feedback:${request_ref}`, kind: 'lesson', lesson}); if (!stored.ok) return stored;
      }
      const current = {...binding, interaction_ref: thread, request, request_ref, target: supplied.target ?? 'response', checks: supplied.checks ?? [],
        override_lesson_ids: supplied.override_lesson_ids ?? [], invalidated_refs: supplied.invalidated_refs ?? []};
      const view = projectInteractionContext(state, current, policy());
      return {ok: true, request: current, view, lessons: view.items.map(i => state.lessons[i.lesson_id]), policy: policy(), rpc_id: message.id};
    } catch (error) {return fail(error.message);}
  }
  function dispatch(prepared, dispatch_digest, context_digest, intent_contract) {
    if (!enabled || prepared?.disposition === 'disabled') return {ok: true};
    return apply({event_id: `dispatch:${prepared.request.request_ref}`, kind: 'dispatch', turn: {
      request_ref: prepared.request.request_ref, request_digest: digestValue(prepared.request.request), interaction_ref: prepared.request.interaction_ref,
      rpc_id: prepared.rpc_id, turn_ref: null, dispatch_digest, context_digest, intent_contract,
      checks: prepared.request.checks, view: prepared.view, lessons: prepared.lessons}});
  }
  function bind(rpcId, thread, turnId) {
    if (!enabled) return {ok: true};
    const turn = Object.values(state.turns).find(t => String(t.rpc_id) === String(rpcId) && t.interaction_ref === thread);
    if (!turn) return fail('learning.dispatched-turn-missing');
    if (turn.turn_ref === identity(thread, turnId)) return {ok: true};
    return apply({event_id: `bind:${turn.request_ref}`, kind: 'bind', request_ref: turn.request_ref, turn_ref: identity(thread, turnId)});
  }
  function observe(message) {
    if (!enabled) return;
    const params = message.params ?? {}, thread = params.threadId, turnId = params.turnId ?? params.turn?.id;
    if (!thread || !turnId) return;
    const key = identity(thread, turnId);
    const current = output.get(key) ?? new Map();
    if (message.method === 'item/agentMessage/delta' && typeof params.delta === 'string') {
      const id = params.itemId ?? 'message'; current.set(id, (current.get(id) ?? '') + params.delta);
    }
    if (message.method === 'item/completed' && params.item?.type === 'agentMessage') current.set(params.item.id, params.item.text ?? '');
    if (!current.has('overflow') && Buffer.byteLength([...current.values()].join('')) <= 32768) output.set(key, current); else output.set(key, new Map([['overflow', null]]));
  }
  function complete(message) {
    if (!enabled) return {ok: true};
    const thread = message.params?.threadId, turnId = message.params?.turn?.id ?? message.params?.turnId;
    if (!thread || !turnId) return fail('learning.completion-identity-invalid');
    const key = identity(thread, turnId), turn = Object.values(state.turns).find(t => t.turn_ref === key);
    if (!turn) return fail('learning.completion-turn-missing');
    if (turn.outcome) return turn.completion_digest === digestValue(message) ? {ok: true, disposition: 'replayed'} : fail('learning.completion-identity-conflict');
    if (!thread || !turnId) return fail('learning.completion-identity-invalid');
    const items = message.params?.turn?.items?.filter(i => i.type === 'agentMessage');
    const chunks = output.get(key); const observed = items?.length ? items.map(i => i.text).join('\n')
      : chunks?.size && !chunks.has('overflow') ? [...chunks.values()].join('\n') : null;
    // A failed/interrupted turn may contain partial text. It cannot establish a
    // supported application even if that text happens to pass a literal check.
    // Undefined status preserves the historical v1 host completion contract.
    const status = message.params?.turn?.status;
    const completed = status === undefined || status === 'completed';
    const boundedOutput = completed && typeof observed === 'string' && Buffer.byteLength(observed) <= 32768 ? observed : null;
    const result = apply({event_id: `outcome:${turn.request_ref}`, kind: 'outcome', request_ref: turn.request_ref, lessons: turn.lessons, completion_digest: digestValue(message),
      observation: {request_ref: turn.request_ref, turn_ref: key, output: boundedOutput, evidence_ref: `codex:${key}:completed`}});
    if (result.ok) output.delete(key);
    return result;
  }
  function control(input) {
    if (!enabled) return fail('learning.disabled');
    if (!input || typeof input.control_id !== 'string' || !input.control_id.trim() || !['set-mode', 'disable-reuse'].includes(input.action)) return fail('learning.control-invalid');
    if (input.action === 'set-mode') {
      let next; try {next = materializeLearningPolicy({...policy(), mode: input.mode});} catch (error) {return fail(error.message);}
      return apply({event_id: `control:${input.control_id}`, kind: 'policy', policy: next, source_ref: input.control_id});
    }
    return apply({event_id: `control:${input.control_id}`, kind: 'disable-reuse', lesson_id: input.lesson_id, source_ref: input.control_id});
  }
  async function runEvolution() {
    if (!enabled || policy().mode === 'off') return {ok: true, disposition: 'disabled'};
    const progress = assessInteractionLearningProgress(state, policy());
    if (state.evolution[progress.trigger_id]) return {ok: true, ...state.evolution[progress.trigger_id]};
    if (progress.disposition !== 'research-required') return {ok: true, disposition: progress.disposition, progress};
    const start = apply({event_id: `evolution-start:${progress.trigger_id}`, kind: 'evolution', trigger_id: progress.trigger_id,
      result: {disposition: 'delivery-unknown', progress}}); if (!start.ok) return start;
    let result;
    try {result = await adapter.run(progress, policy());}
    catch (error) {result = {ok: false, disposition: 'failed', reason: error.message};}
    const material = result.result ?? result;
    const stored = apply({event_id: `evolution-result:${progress.trigger_id}`, kind: 'evolution', trigger_id: progress.trigger_id, result: material});
    return stored.ok ? {ok: result.ok, ...material} : stored;
  }
  return {prepare, dispatch, bind, observe, complete, control, runEvolution,
    inspect: ({detail = false} = {}) => detail ? state : {state_digest: state.record_digest, mode: policy().mode,
      lesson_count: Object.keys(state.lessons).length, application_count: state.applications.length,
      progress: assessInteractionLearningProgress(state, policy()), authority_effect: 'none'}};
}
export function addInteractionLearningContext(message, prepared) {
  if (!prepared?.view) return message;
  return freezeResult({...message, params: {...message.params, additionalContext: {...message.params.additionalContext,
    [LEARNING_CONTEXT_KEY]: {kind: 'application', value: canonicalJson(prepared.view)}}}});
}
