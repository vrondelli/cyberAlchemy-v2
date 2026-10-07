import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canonicalJson, digestValue, freezeResult} from './canonical.mjs';
import {materializeLearningPolicy, createInteractionState, reduceInteractionState, projectInteractionContext, assessGrounding,
  materializeScopedLesson, verifyLearningRecord, assessInteractionLearningProgress} from '../../request-intent-runtime/src/learning-loop.mjs';
import {createCorrectedIntentContract} from '../../request-intent-runtime/src/reflection.mjs';

export const LEARNING_CONTEXT_KEY = 'cyberalchemy.are.interaction-learning';
export const LEARNING_PRECEDENCE_CONTEXT_KEY = 'cyberalchemy.are.interaction-learning-precedence';
const EVENT = 'interaction-learning-transition';
const PENDING_FEEDBACK_EVENT = 'interaction-feedback-pending';
const REVIEWED_FEEDBACK_EVENT = 'interaction-feedback-reviewed';
const fail = reason => ({ok: false, reason_codes: [reason], authority_effect: 'none'});
// These literal scope limits contradict a lesson reused for later answers in
// the same interaction. Unknown wording remains unclassified, not inferred.
const EXPLICIT_NARROW_SCOPE = /\b(?:just this once|(?:for )?this answer only|(?:for )?the next answer only|only for this answer|only for the next answer|this task only|only for this task)\b/iu;
const hasExplicitNarrowScope = text => EXPLICIT_NARROW_SCOPE.test(text);
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
  const pendingFeedbacks = new Map();
  const reviewedFeedbacks = new Map();
  const latestCompletedEpisode = new Map();
  function rememberCompletedEpisode(event) {
    if (event.kind !== 'outcome') return;
    const turn = state.turns[event.request_ref];
    if (turn?.completion_status === 'completed' && turn.response_present === true
      && turn.turn_ref && turn.outcome) latestCompletedEpisode.set(turn.interaction_ref, turn.request_ref);
  }
  for (const saved of ledger.snapshot()) {
    if (saved.event_kind === PENDING_FEEDBACK_EVENT && saved.content.binding?.participant_ref === binding.participant_ref
      && saved.content.binding?.product_ref === binding.product_ref) {
      const pending = saved.content;
      if (pendingFeedbacks.has(pending.request_ref)) throw Error('learning.pending-feedback-duplicate-history');
      pendingFeedbacks.set(pending.request_ref, pending);
      continue;
    }
    if (saved.event_kind === REVIEWED_FEEDBACK_EVENT && saved.content.binding?.participant_ref === binding.participant_ref
      && saved.content.binding?.product_ref === binding.product_ref) {
      const reviewed = saved.content;
      const pending = pendingFeedbacks.get(reviewed.request_ref);
      if (!pending || reviewedFeedbacks.has(reviewed.request_ref)
        || reviewed.disposition !== 'dismissed' || pending.interaction_ref !== reviewed.interaction_ref
        || pending.request_digest !== reviewed.request_digest) throw Error('learning.pending-feedback-review-history-invalid');
      pendingFeedbacks.delete(reviewed.request_ref);
      reviewedFeedbacks.set(reviewed.request_ref, reviewed);
      continue;
    }
    if (saved.event_kind !== EVENT || saved.content.binding?.participant_ref !== binding.participant_ref || saved.content.binding?.product_ref !== binding.product_ref) continue;
    const event = saved.content.event;
    if (events.has(event.event_id)) throw Error('learning.duplicate-history');
    const review = event.pending_feedback_review;
    if (review) {
      const pending = pendingFeedbacks.get(review.request_ref);
      const lesson = event.lesson;
      const revision = Object.hasOwn(review, 'revises_lesson_id');
      const expected = lesson && digestValue({episode_ref: lesson.episode_ref,
        quote: lesson.preference?.grounding?.source?.quote, instruction: lesson.preference?.instruction,
        retention_scope: 'current-interaction',
        ...(revision ? {revises_lesson_id: review.revises_lesson_id,
          expected_lesson_digest: review.expected_lesson_digest} : {})});
      const predecessor = revision ? state.lessons[review.revises_lesson_id] : null;
      const episode = state.turns[lesson?.episode_ref];
      if (event.kind !== 'lesson' || !pending || reviewedFeedbacks.has(review.request_ref)
        || !['request_digest,request_ref,review_digest',
          'expected_lesson_digest,request_digest,request_ref,review_digest,revises_lesson_id']
          .includes(Object.keys(review).sort().join(','))
        || pending.request_digest !== review.request_digest
        || lesson.preference?.grounding?.source?.request_ref !== review.request_ref
        || lesson.preference?.retention_scope !== 'current-interaction'
        || (!revision && lesson.predecessor_digest !== null)
        || (revision && (lesson.lesson_id !== review.revises_lesson_id
          || lesson.predecessor_digest !== review.expected_lesson_digest
          || predecessor?.record_digest !== review.expected_lesson_digest
          || predecessor.preference?.interaction_ref !== pending.interaction_ref
          || !episode?.view?.items?.some(item => item.lesson_id === review.revises_lesson_id
            && item.lesson_digest === review.expected_lesson_digest)))
        || review.review_digest !== expected) throw Error('learning.pending-feedback-review-history-invalid');
    }
    state = reduceInteractionState(state, event);
    if (state.record_digest !== saved.content.state_digest) throw Error('learning.replay-drift');
    rememberCompletedEpisode(event);
    events.set(event.event_id, digestValue(event));
    if (review) {
      pendingFeedbacks.delete(review.request_ref);
      reviewedFeedbacks.set(review.request_ref, {request_ref: review.request_ref,
        request_digest: review.request_digest, review_digest: review.review_digest,
        disposition: 'applied', lesson_id: event.lesson.lesson_id,
        lesson_digest: event.lesson.record_digest, episode_ref: event.lesson.episode_ref,
        revision: event.lesson.revision, predecessor_digest: event.lesson.predecessor_digest});
    }
  }
  const policy = () => state.policy ?? defaultPolicy;
  const adapter = enabled && typeof evolution.create_adapter === 'function' ? evolution.create_adapter({implementation_binding: {path: 'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs',
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
      state = next; events.set(event.event_id, digestValue(event)); rememberCompletedEpisode(event);
      return {ok: true, state_digest: state.record_digest};
    } catch (error) {return fail(error.message);}
  }
  function supplyInput(request, request_ref, thread) {
    const supplied = typeof input_provider === 'function'
      ? input_provider(freezeResult({request, request_ref, interaction_ref: thread, state, policy: policy(), authority_effect: 'none'})) : {};
    if (!supplied || typeof supplied !== 'object' || typeof supplied.then === 'function') {
      if (supplied?.then) Promise.resolve(supplied).catch(() => {});
      throw Error('learning.input-adapter-must-be-synchronous');
    }
    return supplied;
  }
  function materializeFeedback(request, request_ref, thread, feedback) {
    const prior = state.turns[feedback.episode_ref];
    // A historical outcome without a checkpointed completion posture is
    // not proof that the episode completed.
    if (!prior?.outcome || prior.completion_status !== 'completed' || prior.interaction_ref !== thread
      || prior.response_present !== true || !prior.turn_ref) {
      throw Error('learning.feedback-attribution-unresolved');
    }
    const grounding = assessGrounding({request, participant_ref: binding.participant_ref, product_ref: binding.product_ref,
      source: {role: 'user', participant_ref: binding.participant_ref, product_ref: binding.product_ref, request_ref,
        request_digest: digestValue(request), quote: feedback.quote, quoted: feedback.quoted === true}});
    const corrected = createCorrectedIntentContract(prior.intent_contract, {request_ref, request_digest: digestValue(request), objective: feedback.instruction});
    return materializeScopedLesson({...feedback, ...binding, interaction_ref: thread, grounding,
      episode_ref: feedback.episode_ref, observation_digest: prior.outcome.observation_digest,
      previous_contract: prior.intent_contract, corrected_contract: corrected,
      predecessor: feedback.revises_lesson_id ? state.lessons[feedback.revises_lesson_id] : undefined});
  }
  function persistPendingFeedback(request_ref, thread, text, reason_codes = ['learning.feedback-unclassified']) {
    if (pendingFeedbacks.size >= 256) return fail('learning.feedback-pending-budget-exceeded');
    // This is a review candidate, not attribution. Only an explicit later
    // review can bind the feedback to this completed, answered episode.
    const candidate_episode_ref = latestCompletedEpisode.get(thread) ?? null;
    const content = {binding, request_ref, interaction_ref: thread, request_digest: digestValue(text),
      candidate_episode_ref, reason_codes, authority_effect: 'none'};
    try {
      const appended = ledger.append({event_kind: PENDING_FEEDBACK_EVENT, idempotency_key: `feedback-pending:${request_ref}`,
        content, provenance_refs: [request_ref]});
      if (!appended.ok) {fault = true; return appended;}
      const epoch = ledger.seal({event_digests: [appended.event.event_digest], consumer_ref: binding.participant_ref, request_ref});
      if (!epoch.ok) {fault = true; return epoch;}
      const checkpoint = ledger.checkpoint({checkpoint_kind: 'manual', epoch: epoch.value, subject_digest: digestValue(content)});
      if (!checkpoint.ok) {fault = true; return checkpoint;}
      pendingFeedbacks.set(request_ref, content);
      return freezeResult({ok: true, disposition: 'pending', feedback_ref: request_ref,
        candidate_episode_ref, reason_codes: content.reason_codes, authority_effect: 'none'});
    } catch (error) {fault = true; return fail(error.message);}
  }
  function prepare(message, {allow_feedback = true} = {}) {
    if (!enabled) return {ok: true, disposition: 'disabled'};
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    const thread = message.params?.threadId;
    const request = (message.params?.input ?? []).filter(i => i?.type === 'text').map(i => i.text).join('\n');
    const request_ref = identity(thread, message.params?.clientUserMessageId ?? message.id);
    if (state.turns[request_ref]) return fail('learning.request-recorded-dispatch-not-retried');
    if (!state.policy) {const pinned = apply({event_id: 'learning-policy:initial', kind: 'policy', policy: defaultPolicy, source_ref: 'host:learning-configuration'}); if (!pinned.ok) return pinned;}
    try {
      let projectedState = state, pendingLesson = null;
      const supplied = allow_feedback ? supplyInput(request, request_ref, thread) : {};
      if (supplied.feedback && !hasExplicitNarrowScope(request) && policy().mode !== 'off') {
        const lesson = materializeFeedback(request, request_ref, thread, supplied.feedback);
        pendingLesson = {event_id: `feedback:${request_ref}`, kind: 'lesson', lesson};
        projectedState = reduceInteractionState(state, pendingLesson);
      }
      const current = {...binding, interaction_ref: thread, request, request_ref, target: supplied.target ?? 'response', representation: supplied.representation, checks: supplied.checks ?? [],
        override_lesson_ids: supplied.override_lesson_ids ?? [], invalidated_refs: supplied.invalidated_refs ?? []};
      const view = projectInteractionContext(projectedState, current, policy());
      return {ok: true, request: current, view, lessons: view.items.map(i => projectedState.lessons[i.lesson_id]),
        pending_lesson: pendingLesson, policy: policy(), rpc_id: message.id};
    } catch (error) {return fail(error.message);}
  }
  function submitFeedback({thread_id, feedback_id, text} = {}) {
    if (!enabled || typeof input_provider !== 'function') return fail('learning.feedback-provider-unavailable');
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    if (typeof thread_id !== 'string' || !thread_id.trim() || thread_id !== thread_id.trim()
      || Buffer.byteLength(thread_id) > 256 || typeof feedback_id !== 'string' || !feedback_id.trim()
      || feedback_id !== feedback_id.trim() || Buffer.byteLength(feedback_id) > 256
      || typeof text !== 'string' || !text.trim() || Buffer.byteLength(text) > 4096) return fail('learning.feedback-input-invalid');
    const request_ref = identity(thread_id, `feedback-only:${feedback_id}`);
    const reviewed = reviewedFeedbacks.get(request_ref);
    if (reviewed) return reviewed.request_digest === digestValue(text)
      ? freezeResult({ok: true, disposition: reviewed.disposition, feedback_ref: request_ref, replayed: true,
        ...(reviewed.disposition === 'applied' ? {episode_ref: reviewed.episode_ref, lesson_id: reviewed.lesson_id,
          lesson_digest: reviewed.lesson_digest, revision: reviewed.revision,
          predecessor_digest: reviewed.predecessor_digest, retention_scope: 'current-interaction'} : {}),
        authority_effect: 'none'}) : fail('learning.feedback-id-conflict');
    const pending = pendingFeedbacks.get(request_ref);
    if (pending) return pending.request_digest === digestValue(text)
      ? freezeResult({ok: true, disposition: 'pending', feedback_ref: request_ref, replayed: true,
        candidate_episode_ref: pending.candidate_episode_ref ?? null,
        reason_codes: pending.reason_codes, authority_effect: 'none'}) : fail('learning.feedback-id-conflict');
    const priorLesson = Object.values(state.lessons).find(lesson => lesson.preference?.grounding?.source?.request_ref === request_ref);
    if (priorLesson) {
      if (priorLesson.preference.grounding.source.request_digest !== digestValue(text)) return fail('learning.feedback-id-conflict');
      return freezeResult({ok: true, disposition: 'replayed', feedback_ref: request_ref,
        episode_ref: priorLesson.episode_ref, lesson_id: priorLesson.lesson_id,
        lesson_digest: priorLesson.record_digest, retention_scope: priorLesson.preference.retention_scope, authority_effect: 'none'});
    }
    if (!state.policy) {const pinned = apply({event_id: 'learning-policy:initial', kind: 'policy', policy: defaultPolicy, source_ref: 'host:learning-configuration'}); if (!pinned.ok) return pinned;}
    if (policy().mode === 'off') return fail('learning.feedback-policy-off');
    if (hasExplicitNarrowScope(text)) return persistPendingFeedback(request_ref, thread_id, text,
      ['learning.feedback-scope-conflict']);
    try {
      const supplied = supplyInput(text, request_ref, thread_id);
      if (!supplied.feedback) return persistPendingFeedback(request_ref, thread_id, text);
      const lesson = materializeFeedback(text, request_ref, thread_id, supplied.feedback);
      const equivalent = !supplied.feedback.revises_lesson_id && Object.values(state.lessons).find(existing =>
        existing.episode_ref === lesson.episode_ref
        && existing.preference.interaction_ref === thread_id
        && existing.preference.target === lesson.preference.target
        && existing.preference.instruction === lesson.preference.instruction
        && existing.preference.retention_scope === lesson.preference.retention_scope
        && existing.preference.posture === lesson.preference.posture);
      if (equivalent) return freezeResult({ok: true, disposition: 'already-applied', feedback_ref: request_ref,
        episode_ref: equivalent.episode_ref, lesson_id: equivalent.lesson_id,
        lesson_digest: equivalent.record_digest, retention_scope: equivalent.preference.retention_scope, authority_effect: 'none'});
      const stored = apply({event_id: `feedback:${request_ref}`, kind: 'lesson', lesson});
      if (!stored.ok) return stored;
      return freezeResult({ok: true, disposition: 'applied', feedback_ref: request_ref,
        episode_ref: lesson.episode_ref, lesson_id: lesson.lesson_id,
        lesson_digest: lesson.record_digest, retention_scope: lesson.preference.retention_scope, authority_effect: 'none'});
    } catch (error) {return fail(error.message);}
  }
  function applyPendingFeedback({thread_id, feedback_id, text, episode_ref, quote, instruction,
    revises_lesson_id, expected_lesson_digest} = {}) {
    if (!enabled) return fail('learning.disabled');
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    if (typeof thread_id !== 'string' || !thread_id.trim() || thread_id !== thread_id.trim()
      || Buffer.byteLength(thread_id) > 256 || typeof feedback_id !== 'string' || !feedback_id.trim()
      || feedback_id !== feedback_id.trim() || Buffer.byteLength(feedback_id) > 256
      || typeof text !== 'string' || !text.trim() || Buffer.byteLength(text) > 4096
      || typeof episode_ref !== 'string' || !episode_ref.trim() || Buffer.byteLength(episode_ref) > 1024
      || typeof quote !== 'string' || !quote.trim() || Buffer.byteLength(quote) > 256 || !text.includes(quote)
      || typeof instruction !== 'string' || !instruction.trim() || Buffer.byteLength(instruction) > 512) {
      return fail('learning.feedback-review-input-invalid');
    }
    const revision = revises_lesson_id !== undefined || expected_lesson_digest !== undefined;
    if (revision && (typeof revises_lesson_id !== 'string' || !revises_lesson_id.startsWith('lesson:')
      || Buffer.byteLength(revises_lesson_id) > 256 || !/^[0-9a-f]{64}$/.test(expected_lesson_digest ?? ''))) {
      return fail('learning.feedback-review-predecessor-invalid');
    }
    const request_ref = identity(thread_id, `feedback-only:${feedback_id}`);
    const request_digest = digestValue(text);
    const review_digest = digestValue({episode_ref, quote, instruction, retention_scope: 'current-interaction',
      ...(revision ? {revises_lesson_id, expected_lesson_digest} : {})});
    const reviewed = reviewedFeedbacks.get(request_ref);
    if (reviewed) return reviewed.disposition === 'applied' && reviewed.request_digest === request_digest
      && reviewed.review_digest === review_digest
      ? freezeResult({ok: true, disposition: 'applied', feedback_ref: request_ref, replayed: true,
        episode_ref: reviewed.episode_ref, lesson_id: reviewed.lesson_id,
        lesson_digest: reviewed.lesson_digest, revision: reviewed.revision,
        predecessor_digest: reviewed.predecessor_digest,
        retention_scope: 'current-interaction', authority_effect: 'none'})
      : fail('learning.feedback-review-conflict');
    const pending = pendingFeedbacks.get(request_ref);
    if (!pending || pending.interaction_ref !== thread_id) return fail('learning.feedback-pending-not-found');
    if (pending.request_digest !== request_digest) return fail('learning.feedback-id-conflict');
    if (hasExplicitNarrowScope(text)) return fail('learning.feedback-scope-conflict');
    if (policy().mode !== 'apply-scoped') return fail('learning.feedback-policy-not-applying');
    const prior = state.turns[episode_ref];
    if (!prior || prior.interaction_ref !== thread_id || prior.completion_status !== 'completed'
      || prior.response_present !== true || !prior.turn_ref || !prior.outcome) {
      return fail('learning.feedback-attribution-unresolved');
    }
    const predecessor = revision ? state.lessons[revises_lesson_id] : null;
    if (revision && (!predecessor || predecessor.record_digest !== expected_lesson_digest
      || predecessor.preference.interaction_ref !== thread_id
      || predecessor.preference.retention_scope !== 'current-interaction'
      || predecessor.preference.target !== 'response'
      || state.disabled.includes(revises_lesson_id)
      || !prior.view?.items?.some(item => item.lesson_id === revises_lesson_id
        && item.lesson_digest === expected_lesson_digest))) {
      return fail('learning.feedback-predecessor-not-applied');
    }
    try {
      const lesson = materializeFeedback(text, request_ref, thread_id, {episode_ref, quote, instruction,
        target: 'response', posture: 'explicit', retention_scope: 'current-interaction',
        correction_kind: revision ? 'misinterpretation' : 'new-preference', expected_checks: [],
        ...(revision ? {revises_lesson_id} : {})});
      if (!revision && Object.values(state.lessons).some(existing => existing.episode_ref === episode_ref
        && existing.preference.interaction_ref === thread_id
        && existing.preference.target === 'response'
        && existing.preference.instruction === instruction
        && existing.preference.retention_scope === 'current-interaction')) {
        return fail('learning.feedback-equivalent-existing');
      }
      const stored = apply({event_id: `feedback:${request_ref}`, kind: 'lesson', lesson,
        pending_feedback_review: {request_ref, request_digest, review_digest,
          ...(revision ? {revises_lesson_id, expected_lesson_digest} : {})}});
      if (!stored.ok) return stored;
      pendingFeedbacks.delete(request_ref);
      reviewedFeedbacks.set(request_ref, {request_ref, request_digest, review_digest,
        disposition: 'applied', lesson_id: lesson.lesson_id,
        lesson_digest: lesson.record_digest, episode_ref,
        revision: lesson.revision, predecessor_digest: lesson.predecessor_digest});
      return freezeResult({ok: true, disposition: 'applied', feedback_ref: request_ref,
        episode_ref, lesson_id: lesson.lesson_id, lesson_digest: lesson.record_digest,
        revision: lesson.revision, predecessor_digest: lesson.predecessor_digest,
        retention_scope: 'current-interaction', authority_effect: 'none'});
    } catch (error) {return fail(error.message);}
  }
  function dismissPendingFeedback({thread_id, feedback_id, text} = {}) {
    if (!enabled) return fail('learning.disabled');
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    if (typeof thread_id !== 'string' || !thread_id.trim() || thread_id !== thread_id.trim()
      || Buffer.byteLength(thread_id) > 256 || typeof feedback_id !== 'string' || !feedback_id.trim()
      || feedback_id !== feedback_id.trim() || Buffer.byteLength(feedback_id) > 256
      || typeof text !== 'string' || !text.trim() || Buffer.byteLength(text) > 4096) return fail('learning.feedback-input-invalid');
    const request_ref = identity(thread_id, `feedback-only:${feedback_id}`);
    const request_digest = digestValue(text);
    const reviewed = reviewedFeedbacks.get(request_ref);
    if (reviewed?.disposition === 'applied') return fail('learning.feedback-already-applied');
    if (reviewed) return reviewed.request_digest === request_digest
      ? freezeResult({ok: true, disposition: 'dismissed', feedback_ref: request_ref, replayed: true,
        authority_effect: 'none'}) : fail('learning.feedback-id-conflict');
    const pending = pendingFeedbacks.get(request_ref);
    if (!pending || pending.interaction_ref !== thread_id) return fail('learning.feedback-pending-not-found');
    if (pending.request_digest !== request_digest) return fail('learning.feedback-id-conflict');
    const content = {binding, request_ref, interaction_ref: thread_id, request_digest,
      disposition: 'dismissed', authority_effect: 'none'};
    try {
      const appended = ledger.append({event_kind: REVIEWED_FEEDBACK_EVENT,
        idempotency_key: `feedback-reviewed:${request_ref}`, content, provenance_refs: [request_ref]});
      if (appended?.ok !== true) {fault = true; return appended ?? fail('learning.checkpoint-failed-restart-required');}
      const epoch = ledger.seal({event_digests: [appended.event.event_digest],
        consumer_ref: binding.participant_ref, request_ref});
      if (epoch?.ok !== true) {fault = true; return epoch ?? fail('learning.checkpoint-failed-restart-required');}
      const checkpoint = ledger.checkpoint({checkpoint_kind: 'manual', epoch: epoch.value,
        subject_digest: digestValue(content)});
      if (checkpoint?.ok !== true) {fault = true; return checkpoint ?? fail('learning.checkpoint-failed-restart-required');}
      pendingFeedbacks.delete(request_ref);
      reviewedFeedbacks.set(request_ref, content);
      return freezeResult({ok: true, disposition: 'dismissed', feedback_ref: request_ref,
        authority_effect: 'none'});
    } catch (error) {fault = true; return fail(error.message);}
  }
  function listPendingFeedback({thread_id} = {}) {
    if (!enabled) return fail('learning.disabled');
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    if (typeof thread_id !== 'string' || !thread_id.trim() || thread_id !== thread_id.trim()
      || Buffer.byteLength(thread_id) > 256) return fail('learning.feedback-input-invalid');
    const items = [];
    for (const pending of pendingFeedbacks.values()) {
      if (pending.interaction_ref !== thread_id) continue;
      const request_ref = pending.request_ref;
      if (typeof request_ref !== 'string' || !request_ref.startsWith('learning:')) return fail('learning.feedback-pending-identity-invalid');
      let identityParts;
      try {identityParts = JSON.parse(request_ref.slice('learning:'.length));} catch {return fail('learning.feedback-pending-identity-invalid');}
      if (!Array.isArray(identityParts) || identityParts.length !== 2 || identityParts[0] !== thread_id
        || typeof identityParts[1] !== 'string' || !identityParts[1].startsWith('feedback-only:')
        || identity(thread_id, identityParts[1]) !== request_ref) return fail('learning.feedback-pending-identity-invalid');
      items.push({feedback_id: identityParts[1].slice('feedback-only:'.length), text_digest: pending.request_digest,
        candidate_episode_ref: pending.candidate_episode_ref ?? null});
    }
    items.sort((a, b) => a.feedback_id.localeCompare(b.feedback_id));
    return freezeResult({ok: true, schema_version: 'are.pending-feedback-list/v1', thread_id,
      count: items.length, items, authority_effect: 'none'});
  }
  function listCurrentLessons({thread_id} = {}) {
    if (!enabled) return fail('learning.disabled');
    if (fault) return fail('learning.checkpoint-failed-restart-required');
    if (typeof thread_id !== 'string' || !thread_id.trim() || thread_id !== thread_id.trim()
      || Buffer.byteLength(thread_id) > 256) return fail('learning.feedback-input-invalid');
    const items = Object.values(state.lessons).filter(lesson => lesson.preference.interaction_ref === thread_id
      && lesson.preference.retention_scope === 'current-interaction'
      && lesson.preference.target === 'response' && !state.disabled.includes(lesson.lesson_id))
      .map(lesson => ({lesson_id: lesson.lesson_id, lesson_digest: lesson.record_digest,
        revision: lesson.revision, instruction: lesson.preference.instruction}));
    if (items.length > 50 || items.some(item => Buffer.byteLength(item.lesson_id) > 256
      || Buffer.byteLength(item.instruction) > 512)) return fail('learning.lessons-list-budget-exceeded');
    items.sort((a, b) => a.lesson_id.localeCompare(b.lesson_id));
    return freezeResult({ok: true, schema_version: 'are.current-lessons-list/v1', thread_id,
      count: items.length, items, authority_effect: 'none'});
  }
  function dispatch(prepared, dispatch_digest, context_digest, intent_contract) {
    if (!enabled || prepared?.disposition === 'disabled') return {ok: true};
    if (prepared.pending_lesson) {
      const stored = apply(prepared.pending_lesson); if (!stored.ok) return stored;
    }
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
    const completionStatus = completed ? 'completed' : 'noncompleted';
    const boundedOutput = completed && typeof observed === 'string' && Buffer.byteLength(observed) <= 32768 ? observed : null;
    const result = apply({event_id: `outcome:${turn.request_ref}`, kind: 'outcome', request_ref: turn.request_ref, lessons: turn.lessons,
      completion_digest: digestValue(message), completion_status: completionStatus,
      response_present: typeof boundedOutput === 'string' && boundedOutput.trim().length > 0,
      observation: {request_ref: turn.request_ref, turn_ref: key, output: boundedOutput, evidence_ref: `codex:${key}:${completionStatus}`}});
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
  function observeFeedback({thread_id} = {}) {
    if (typeof thread_id !== 'string' || !thread_id.trim() || thread_id !== thread_id.trim()
      || Buffer.byteLength(thread_id) > 256) return fail('learning.feedback-input-invalid');
    const binding_ref = digestValue({participant_ref: binding.participant_ref, product_ref: binding.product_ref,
      interaction_ref: thread_id});
    const emptyCounts = {pending_feedback_count: null, retained_lesson_count: null, disabled_lesson_count: null,
      dispatched_application_count: null, evaluated_application_count: null};
    const project = fields => {
      const value = {schema_version: 'are.learning-feedback-observation/v1', source: 'learning-owner',
        binding_ref, ...fields, authority_effect: 'none'};
      return freezeResult({...value, observation_digest: digestValue(value)});
    };
    const unavailable = () => project({status: 'unavailable', mode: null, durability: null, state_digest: null,
      checkpoint_digest: null, ...emptyCounts});
    if (!enabled) return project({status: 'disabled', mode: null, durability: null, state_digest: null,
      checkpoint_digest: null, ...emptyCounts});
    if (fault) return unavailable();
    try {
      // Reads use the existing owner's retained checkpoints; no synthetic event,
      // provider invocation or Evolution trigger is introduced by observation.
      const owned = ledger.snapshot().filter(saved => [EVENT, PENDING_FEEDBACK_EVENT, REVIEWED_FEEDBACK_EVENT].includes(saved.event_kind)
        && saved.content.binding?.participant_ref === binding.participant_ref
        && saved.content.binding?.product_ref === binding.product_ref);
      const latest = owned.at(-1);
      const checkpoint = latest && ledger.checkpoints?.().find(item => item.head_event_digest === latest.event_digest
        && item.subject_digest === (latest.event_kind === EVENT ? latest.content.state_digest : digestValue(latest.content)));
      if (latest && !checkpoint) return unavailable();
      const lessons = Object.values(state.lessons).filter(lesson => lesson.preference.interaction_ref === thread_id);
      const applications = state.applications.filter(item => state.turns[item.request_ref]?.interaction_ref === thread_id);
      const applicationKey = item => canonicalJson([item.request_ref, item.lesson_id, item.lesson_digest]);
      return project({status: latest ? 'observed' : 'no-records', mode: policy().mode, durability: checkpoint?.durability ?? null,
        state_digest: latest ? state.record_digest : null, checkpoint_digest: checkpoint?.checkpoint_digest ?? null,
        pending_feedback_count: [...pendingFeedbacks.values()].filter(item => item.interaction_ref === thread_id).length,
        retained_lesson_count: lessons.length,
        disabled_lesson_count: lessons.filter(item => state.disabled.includes(item.lesson_id)).length,
        dispatched_application_count: new Set(applications.map(applicationKey)).size,
        evaluated_application_count: new Set(applications.filter(item => item.outcome_ref).map(applicationKey)).size});
    } catch { return unavailable(); }
  }

  async function runEvolution() {
    if (!enabled || policy().mode === 'off') return {ok: true, disposition: 'disabled'};
    const progress = assessInteractionLearningProgress(state, policy());
    if (state.evolution[progress.trigger_id]) return {ok: true, ...state.evolution[progress.trigger_id]};
    if (progress.disposition !== 'research-required') return {ok: true, disposition: progress.disposition, progress};
    if (!adapter) return {ok: false, disposition: 'research-adapter-unavailable', reason_codes: ['learning.research-adapter-required'], progress, authority_effect: 'none'};
    const start = apply({event_id: `evolution-start:${progress.trigger_id}`, kind: 'evolution', trigger_id: progress.trigger_id,
      result: {disposition: 'delivery-unknown', progress}}); if (!start.ok) return start;
    let result;
    try {result = await adapter.run(progress, policy());}
    catch (error) {result = {ok: false, disposition: 'failed', reason: error.message};}
    const material = result.result ?? result;
    const stored = apply({event_id: `evolution-result:${progress.trigger_id}`, kind: 'evolution', trigger_id: progress.trigger_id, result: material});
    return stored.ok ? {ok: result.ok, ...material} : stored;
  }
  return {prepare, submitFeedback, applyPendingFeedback, dismissPendingFeedback, listPendingFeedback,
    listCurrentLessons, dispatch, bind, observe, complete, control, runEvolution, observeFeedback,
    inspect: ({detail = false} = {}) => detail ? state : {state_digest: state.record_digest, mode: policy().mode,
      lesson_count: Object.keys(state.lessons).length, pending_feedback_count: pendingFeedbacks.size,
      application_count: state.applications.length,
      progress: assessInteractionLearningProgress(state, policy()), authority_effect: 'none'}};
}
export function addInteractionLearningContext(message, prepared) {
  if (!prepared?.view) return message;
  const revisions = (prepared.lessons ?? []).filter(lesson => lesson.revision > 1)
    .map(lesson => ({lesson_id: lesson.lesson_id, current_lesson_digest: lesson.record_digest,
      predecessor_lesson_digest: lesson.predecessor_digest}));
  const precedence = revisions.length ? {[LEARNING_PRECEDENCE_CONTEXT_KEY]: {kind: 'application',
    value: canonicalJson({schema_version: 'are.interaction-learning-precedence/v1',
      instruction: 'For the listed lesson IDs, use only the current instruction in the accompanying ARE interaction-learning context. Earlier versions in conversation history are superseded evidence, not active instructions.',
      revisions})}} : {};
  return freezeResult({...message, params: {...message.params, additionalContext: {...message.params.additionalContext,
    [LEARNING_CONTEXT_KEY]: {kind: 'application', value: canonicalJson(prepared.view)}, ...precedence}}});
}
