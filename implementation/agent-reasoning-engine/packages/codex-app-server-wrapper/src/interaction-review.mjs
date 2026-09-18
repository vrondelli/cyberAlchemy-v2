import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {loadRepositoryProfile} from './config.mjs';
import {createCodexAppServerWrapper} from './wrapper.mjs';
import {canonicalJson, digestValue, freezeResult} from './canonical.mjs';
import {acquireReasoningStateWriterLock, recoverReasoningStateLedger} from '../../reasoning-state-runtime/index.mjs';
import {materializeRequirementSnapshot} from '../../request-intent-runtime/index.mjs';
import {OBJECTIVE_CONTEXT_KEY} from './objective-lifecycle.mjs';
import {validateInteractionHostRequest, materializeInteractionHostInput, interactionHostMessage, learningRequestRef} from './interaction-host.mjs';

import {classifyRepresentationRequest, inspectPreferenceOffers, proposePreferenceOffers, applyPreferenceDecision} from './representation-preferences.mjs';

const fail = reason => ({ok: false, disposition: 'blocked', reason_codes: [reason], authority_effect: 'none'});
const HOST_REQUEST = 'interaction-host-request';
const HOST_RESULT = 'interaction-host-result';
const repository = resolve(import.meta.dirname, '../../../../../..');
const profilePath = resolve(import.meta.dirname, '../profiles/repository-v1.json');

// A text-response host of the existing wrapper, not a second reasoning runtime.
// The configured provider receives the exact verified message and may return
// text. This adapter never executes model tools, starts a successor or retries.
export function createInteractionReview({state_path, participant_ref = 'review:user', product_ref = 'review:are',
  response_provider, objective_provider, provider_timeout_ms = 30000, evolution} = {}) {
  if (typeof state_path !== 'string' || !state_path.trim()) throw Error('interaction-review.state-path-required');
  if (![participant_ref, product_ref].every(v => typeof v === 'string' && v.trim() && v.length <= 256)) throw Error('interaction-review.scope-invalid');
  if (!Number.isSafeInteger(provider_timeout_ms) || provider_timeout_ms < 1 || provider_timeout_ms > 300000) throw Error('interaction-review.timeout-invalid');
  if (response_provider !== undefined && typeof response_provider !== 'function') throw Error('interaction-review.provider-invalid');
  const loaded = loadRepositoryProfile(profilePath, repository);
  if (!loaded.ok) throw Error(`interaction-review.profile-unavailable:${loaded.reason_codes.join(',')}`);
  const path = resolve(state_path), ledgerId = 'are-interaction-review:v1';
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  const acquired = acquireReasoningStateWriterLock({path, owner_id: `${ledgerId}:${process.pid}`});
  if (!acquired.ok) throw Error(`interaction-review.writer-lock:${acquired.reason_codes.join(',')}`);
  let ledger, wrapper, closed = false, busy = false, fault = false, currentRequest = null;
  const binding = {schema_version: 'are.interaction-host-binding/v1', participant_ref, product_ref,
    profile_id: 'are-interaction-review-v1', authority_effect: 'none'};
  function persist(event_kind, key, content) {
    if (fault) throw Error('interaction-review.restart-required');
    const append = ledger.append({event_kind, idempotency_key: key, content, provenance_refs: [key]});
    if (!append.ok) {fault = true; throw Error('interaction-review.append-failed');}
    const epoch = ledger.seal({event_digests: [append.event.event_digest], consumer_ref: participant_ref, request_ref: key});
    const checkpoint = epoch.ok && ledger.checkpoint({checkpoint_kind: 'manual', epoch: epoch.value, subject_digest: digestValue(content)});
    if (!checkpoint?.ok) {fault = true; throw Error('interaction-review.checkpoint-failed');}
  }
  try {
    const recovered = recoverReasoningStateLedger({path, ledger_id: ledgerId});
    if (!recovered.ok) throw Error(`interaction-review.recovery-failed:${recovered.reason_codes.join(',')}`);
    ledger = recovered.ledger;
    const prior = ledger.snapshot().filter(e => e.event_kind === 'interaction-host-binding');
    if (prior.length > 1 || (prior.length && canonicalJson(prior[0].content) !== canonicalJson(binding))) throw Error('interaction-review.scope-binding-conflict');
    if (!prior.length) {
      if (ledger.snapshot().length) throw Error('interaction-review.foreign-ledger');
      persist('interaction-host-binding', 'interaction-host:binding', binding);
    }
    wrapper = createCodexAppServerWrapper({loaded_profile: {...loaded.value, profile_id: binding.profile_id,
      objective_resolution: {enabled: true, requirement_tracking: true, provider_timeout_ms: Math.min(provider_timeout_ms, 30000)},
      interaction_learning: {enabled: true, participant_ref, product_ref, policy: {mode: 'apply-scoped', visibility: 'quiet'}}},
      reasoning_ledger: ledger, decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
      ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot,
      context_source_provider: loaded.context_source_provider, objective_provider, interaction_evolution: evolution,
      interaction_input_provider: ({request, state}) => {
        if (!currentRequest || request !== currentRequest.text) throw Error('interaction-review.host-request-binding-invalid');
        return materializeInteractionHostInput(currentRequest, state);
      },
      requirement_seed_provider: input => {
        if (!currentRequest || input.request !== currentRequest.text.trim() || !Array.isArray(currentRequest.requirements)) throw Error('interaction-review.explicit-requirements-required');
        return materializeRequirementSnapshot({consumer_ref: input.state.consumer_ref, scope_ref: input.state.scope_ref,
          objective_id: input.state.active_objective.objective_id, objective_state_digest: input.state.state_digest,
          requirements: currentRequest.requirements, source_refs: [input.request_ref, `host:${learningRequestRef(currentRequest.thread_id, currentRequest.request_id)}`]});
      }});
  } catch (error) {ledger?.close(); acquired.lock.release(); throw error;}

  function unavailable() {
    return closed ? 'interaction-review.closed' : busy ? 'interaction-review.busy' : fault ? 'interaction-review.restart-required' : null;
  }
  async function submit(input) {
    const unavailableReason = unavailable();
    if (unavailableReason) return fail(unavailableReason);
    if (typeof response_provider !== 'function') return fail('interaction-review.response-provider-required');
    busy = true;
    let request, responseId, forwarded = false, timer;
    try {
      request = validateInteractionHostRequest(input);
      responseId = learningRequestRef(request.thread_id, request.request_id);
      const history = ledger.snapshot().filter(e => e.event_kind === HOST_REQUEST);
      if (history.some(e => e.content.response_id === responseId)) return fail('interaction-review.request-already-recorded');
      if (history.length >= 256) return fail('interaction-review.request-budget-exceeded');
      const learning = wrapper.inspectLearningState({detail: true});
      const preparedRequest = applyPreferenceDecision(request, ledger.snapshot(), learning);
      materializeInteractionHostInput(preparedRequest, learning);
      currentRequest = preparedRequest;
      persist(HOST_REQUEST, `host-request:${responseId}`, {response_id: responseId, request, request_digest: digestValue(request),
        ...(learning.policy?.mode === 'apply-scoped' || !learning.policy ? {preference_observation: classifyRepresentationRequest(request.text)} : {})});
      const actions = await wrapper.processClientMessage(interactionHostMessage(request));
      if (actions.to_server.length !== 1 || actions.to_server[0].method !== 'turn/start') {
        const data = actions.to_client.find(m => m.error)?.error?.data;
        const result = {ok: false, disposition: data?.disposition ?? 'blocked', response_id: responseId,
          reason_codes: data?.reason_codes ?? ['interaction-review.preflight-blocked'], authority_effect: 'none'};
        persist(HOST_RESULT, `host-result:${responseId}`, result); return result;
      }
      const message = actions.to_server[0], turnId = `review:${digestValue(responseId)}`;
      const objective = JSON.parse(message.params.additionalContext[OBJECTIVE_CONTEXT_KEY].value);
      if (request.requirements !== undefined && canonicalJson([...request.requirements].map(r => r.trim()).sort())
        !== canonicalJson(objective.requirement_snapshot.requirements)) {
        const result = {...fail('interaction-review.requirement-seed-not-applied'), response_id: responseId};
        persist(HOST_RESULT, `host-result:${responseId}`, result); return result;
      }
      forwarded = true;
      await wrapper.processServerMessage({jsonrpc: '2.0', id: request.request_id, result: {turn: {id: turnId}}});
      const controller = new AbortController();
      const timeout = new Promise((_, reject) => {timer = setTimeout(() => {
        controller.abort(); reject(Error('interaction-review.provider-timeout'));
      }, provider_timeout_ms);});
      const output = await Promise.race([Promise.resolve().then(() => response_provider(freezeResult(message), {signal: controller.signal})), timeout]);
      clearTimeout(timer);
      if (typeof output !== 'string' || !output.trim() || Buffer.byteLength(output) > 32768) throw Error('interaction-review.provider-output-invalid');
      await wrapper.processServerMessage({jsonrpc: '2.0', method: 'turn/completed', params: {threadId: request.thread_id,
        turn: {id: turnId, status: 'completed', items: [{type: 'agentMessage', text: output}]}}});
      const learningState = wrapper.inspectLearningState({detail: true});
      const turn = learningState.turns[responseId];
      if (!turn?.outcome) throw Error('interaction-review.outcome-not-recorded');
      const result = {ok: true, disposition: 'completed', response_id: responseId, output, objective,
        outcome: turn.outcome, selected_lessons: turn.view.items, lesson_assessments: turn.view.assessments,
        lesson_applications: learningState.applications.filter(a => a.request_ref === responseId && a.outcome_ref),
        dispatch_digest: turn.dispatch_digest, authority_effect: 'none'};
      result.preference_offers = proposePreferenceOffers([...ledger.snapshot(), {event_kind: HOST_RESULT, content: result}], learningState, binding);
      persist(HOST_RESULT, `host-result:${responseId}`, result);
      return freezeResult(result);
    } catch (error) {
      const result = {...fail(error.message), ...(responseId ? {response_id: responseId} : {}),
        disposition: forwarded ? 'delivery-unknown' : 'blocked'};
      if (forwarded && !fault) {
        try {persist(HOST_RESULT, `host-result:${responseId}`, result);} catch {fault = true;}
      }
      return result;
    } finally {clearTimeout(timer); currentRequest = null; busy = false;}
  }
  function inspect() {
    if (closed) return fail('interaction-review.closed');
    const state = wrapper.inspectLearningState({detail: true});
    const events = ledger.snapshot(), results = new Map(events.filter(e => e.event_kind === HOST_RESULT).map(e => [e.content.response_id, e.content]));
    const objectives = new Map();
    for (const e of events.filter(e => e.event_kind === 'objective-transition-resolved')) objectives.set(e.content.thread_id, e.content.resolution.next_state);
    return freezeResult({ok: true, scope: binding, ...wrapper.inspectLearningState(), objectives: [...objectives].map(([thread_id, state]) => ({thread_id, ...state})),
      lessons: Object.values(state.lessons).map(l => ({lesson_id: l.lesson_id, revision: l.revision, predecessor_digest: l.predecessor_digest,
        instruction: l.preference.instruction, ...(l.preference.representation ? {representation: l.preference.representation} : {}), retention_scope: l.preference.retention_scope, conditions: l.preference.conditions,
        exclusions: l.preference.exclusions, disabled: state.disabled.includes(l.lesson_id), source_ref: l.preference.grounding.source.request_ref,
        corrected_response_id: l.episode_ref, expected_checks: l.expected_checks})),
      preference_offers: inspectPreferenceOffers(events, state),
      applications: state.applications,
      turns: events.filter(e => e.event_kind === HOST_REQUEST).map(e => ({response_id: e.content.response_id, request: e.content.request,
        result: results.get(e.content.response_id) ?? {disposition: 'delivery-unknown', authority_effect: 'none'}})), authority_effect: 'none'});
  }
  function control(input) {
    const reason = unavailable(); if (reason) return fail(reason);
    const keys = input?.action === 'set-mode' ? ['action', 'control_id', 'mode'] : ['action', 'control_id', 'lesson_id'];
    if (!input || typeof input !== 'object' || Object.keys(input).some(k => !keys.includes(k))
      || typeof input.control_id !== 'string' || !input.control_id.trim() || input.control_id.length > 256
      || (input.action === 'set-mode' && !['off', 'observe', 'apply-scoped'].includes(input.mode))) return fail('interaction-review.control-invalid');
    return wrapper.controlLearning(input);
  }
  async function runEvolution() {
    const reason = unavailable(); if (reason) return fail(reason);
    busy = true; try {return await wrapper.runLearningEvolution();} finally {busy = false;}
  }
  function close() {
    if (busy) return fail('interaction-review.busy');
    if (closed) return {ok: true, disposition: 'already-closed', authority_effect: 'none'};
    closed = true;
    try {return wrapper.close();} finally {acquired.lock.release();}
  }
  return Object.freeze({submit, inspect, control, runEvolution, close});
}
