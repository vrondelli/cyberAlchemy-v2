import {canonicalJson, deepFreeze, digest, isRecord, sealed, text, verifyDigest} from './canonical.mjs';
import {materializeIntentReflection} from './reflection.mjs';
import {verifyIntentContract} from './contracts.mjs';

export const LEARNING_MODES = ['off', 'observe', 'apply-scoped'];
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const assert = (condition, reason) => {if (!condition) throw Error(`learning.${reason}`);};
const strings = value => Array.isArray(value) && value.length <= 64 && value.every(text) && new Set(value).size === value.length;
const rec = (kind, fields) => sealed(`are.${kind}/v1`, fields, 'record_digest');
const clone = value => JSON.parse(canonicalJson(value));
export const verifyLearningRecord = (value, kind) => isRecord(value) && value.schema_version === `are.${kind}/v1`
  && value.authority_effect === 'none' && verifyDigest(value, 'record_digest');
export function materializeLearningPolicy(input = {}) {
  assert(LEARNING_MODES.includes(input.mode ?? 'observe'), 'mode-invalid');
  assert(['quiet', 'explain', 'inspect', 'control'].includes(input.visibility ?? 'quiet'), 'visibility-invalid');
  assert(input.max_inline_bytes === undefined || (Number.isSafeInteger(input.max_inline_bytes) && input.max_inline_bytes > 0 && input.max_inline_bytes <= 32768), 'budget-invalid');
  return rec('interaction-learning-policy', {mode: input.mode ?? 'observe', visibility: input.visibility ?? 'quiet',
    max_inline_bytes: input.max_inline_bytes ?? 32768, max_active_records: 50, contradiction_limit: 2,
    application_window: 5, recurrence_limit: 3, episode_window: 20, max_attempts: 3, no_gain_limit: 2,
    max_research_cycles: 1, max_providers: 2, max_results_per_provider: 5, upgrade_mode: 'recommend-only'});
}
export function assessGrounding({request, source, participant_ref, product_ref}) {
  assert(text(request) && isRecord(source), 'source-required');
  assert(source.role === 'user' && source.participant_ref === participant_ref && source.product_ref === product_ref, 'source-scope-invalid');
  assert(text(source.request_ref) && source.request_digest === digest(request) && text(source.quote) && request.includes(source.quote), 'source-span-invalid');
  assert(source.quoted !== true && !/^\s*["'`>]/.test(request), 'quoted-source-not-instruction');
  return rec('grounding-assessment', {source: clone(source), disposition: 'explicit-source-bound', semantic_posture: 'host-attributed-not-semantic-proof'});
}
export function materializeCommunicationPreference(input) {
  assert(isRecord(input) && ['explicit', 'inferred'].includes(input.posture), 'preference-invalid');
  assert([input.participant_ref, input.product_ref, input.interaction_ref, input.target, input.instruction].every(text), 'preference-scope-required');
  assert(strings(input.conditions ?? []) && strings(input.exclusions ?? []), 'preference-conditions-invalid');
  assert(['current-interaction', 'current-product'].includes(input.retention_scope), 'retention-invalid');
  assert(input.retention_scope !== 'current-product' || input.user_selected === true, 'product-retention-not-selected');
  assert(verifyLearningRecord(input.grounding, 'grounding-assessment'), 'grounding-invalid');
  assert(input.grounding.source.participant_ref === input.participant_ref && input.grounding.source.product_ref === input.product_ref, 'grounding-scope-mismatch');
  return rec('communication-preference', {participant_ref: input.participant_ref, product_ref: input.product_ref,
    interaction_ref: input.interaction_ref, target: input.target, instruction: input.instruction,
    conditions: input.conditions ?? [], exclusions: input.exclusions ?? [], posture: input.posture,
    retention_scope: input.retention_scope, user_selected: input.user_selected === true, grounding: input.grounding});
}
export function validateOutcomeChecks(checks) {
  assert(Array.isArray(checks) && checks.length <= 64, 'checks-invalid');
  const ids = new Set();
  for (const check of checks) {
    assert(isRecord(check) && Object.keys(check).every(k => ['check_id', 'kind', 'value'].includes(k))
      && text(check.check_id) && !ids.has(check.check_id) && ['includes', 'excludes'].includes(check.kind)
      && text(check.value) && check.value.length <= 256, 'check-invalid'); ids.add(check.check_id);
  }
  return clone(checks);
}
export function materializeScopedLesson(input) {
  const preference = materializeCommunicationPreference(input);
  assert(verifyIntentContract(input.previous_contract).ok && verifyIntentContract(input.corrected_contract).ok, 'reflection-contract-invalid');
  const correction = sealed('are.correction-candidate/v1', {request_ref: input.grounding.source.request_ref,
    request_digest: input.grounding.source.request_digest, previous_intent_contract_digest: input.previous_contract.intent_contract_digest,
    correction_kind: input.correction_kind, evidence: [input.grounding.source.quote], corrected_interpretation: input.instruction}, 'correction_digest');
  const reflection = materializeIntentReflection({correction_candidate: correction, previous_contract: input.previous_contract,
    corrected_contract: input.corrected_contract, proposed_scope: input.retention_scope,
    causal_analysis: [input.causal_analysis ?? 'Attributed correction; causal benefit remains to be tested.'], provenance_refs: [input.grounding.source.request_ref]});
  assert(text(input.episode_ref) && hash(input.observation_digest), 'feedback-outcome-binding-required');
  assert(input.predecessor === undefined || verifyLearningRecord(input.predecessor, 'scoped-intent-reflection'), 'lesson-predecessor-invalid');
  if (input.predecessor) assert(input.predecessor.preference.participant_ref === preference.participant_ref
    && input.predecessor.preference.product_ref === preference.product_ref && input.predecessor.preference.target === preference.target, 'revision-scope-change');
  return rec('scoped-intent-reflection', {lesson_id: input.predecessor?.lesson_id ?? `lesson:${digest([input.episode_ref, preference.record_digest])}`,
    revision: (input.predecessor?.revision ?? 0) + 1, predecessor_digest: input.predecessor?.record_digest ?? null,
    preference, reflection, episode_ref: input.episode_ref, observation_digest: input.observation_digest,
    expected_checks: validateOutcomeChecks(input.expected_checks), falsifier: input.falsifier ?? 'A later attributable application contradicts the expected checks.'});
}
export function assessPreferenceApplication(lesson, request, policy, disabled = []) {
  assert(verifyLearningRecord(lesson, 'scoped-intent-reflection') && verifyLearningRecord(policy, 'interaction-learning-policy'), 'application-input-invalid');
  const p = lesson.preference;
  let disposition = 'applicable';
  if (disabled.includes(lesson.lesson_id) || policy.mode !== 'apply-scoped') disposition = 'disabled';
  else if (p.participant_ref !== request.participant_ref || p.product_ref !== request.product_ref || p.target !== request.target
    || (p.retention_scope === 'current-interaction' && p.interaction_ref !== request.interaction_ref)
    || p.conditions.some(c => !request.request.toLowerCase().includes(c.toLowerCase()))
    || p.exclusions.some(c => request.request.toLowerCase().includes(c.toLowerCase()))) disposition = 'inapplicable';
  else if ((request.invalidated_refs ?? []).includes(p.grounding.source.request_ref)) disposition = 'unsupported';
  else if ((request.override_lesson_ids ?? []).includes(lesson.lesson_id)
    || (request.checks ?? []).some(c => lesson.expected_checks.some(old => old.value.toLowerCase() === c.value.toLowerCase() && old.kind !== c.kind))) disposition = 'overridden';
  return rec('preference-application-assessment', {lesson_digest: lesson.record_digest, lesson_id: lesson.lesson_id,
    request_ref: request.request_ref, request_digest: digest(request.request), policy_digest: policy.record_digest, disposition});
}
export function projectInteractionContext(state, request, policy) {
  assert(verifyLearningRecord(state, 'interaction-state'), 'state-invalid');
  assert(request.participant_ref === state.participant_ref && request.product_ref === state.product_ref, 'request-scope-invalid');
  validateOutcomeChecks(request.checks ?? []);
  const latest = Object.values(state.lessons);
  const assessments = latest.map(lesson => assessPreferenceApplication(lesson, request, policy, state.disabled));
  const applicable = assessments.filter(a => a.disposition === 'applicable');
  assert(applicable.length <= policy.max_active_records, 'active-record-budget-exceeded');
  // Conflicting lessons require a current explicit override; recency alone cannot choose.
  const selected = applicable.map(a => latest.find(l => l.record_digest === a.lesson_digest));
  assert(!selected.some((a, i) => selected.slice(i + 1).some(b => a.expected_checks.some(x => b.expected_checks.some(y => x.value === y.value && x.kind !== y.kind)))), 'lesson-conflict');
  const view = rec('interaction-context-view', {state_digest: state.record_digest, request_ref: request.request_ref,
    policy_digest: policy.record_digest, items: selected.map(l => ({lesson_id: l.lesson_id, lesson_digest: l.record_digest,
      instruction: l.preference.instruction, target: l.preference.target, source_ref: l.preference.grounding.source.request_ref})), assessments});
  assert(Buffer.byteLength(canonicalJson(view)) <= policy.max_inline_bytes, 'projection-budget-exceeded');
  return view;
}
export function assessInteractionOutcome(turn, observation) {
  assert(text(turn.request_ref) && text(turn.turn_ref) && hash(turn.dispatch_digest), 'turn-binding-invalid');
  const checks = validateOutcomeChecks(turn.checks ?? []);
  assert(isRecord(observation) && observation.request_ref === turn.request_ref && observation.turn_ref === turn.turn_ref
    && text(observation.evidence_ref), 'observation-binding-invalid');
  const available = typeof observation.output === 'string';
  assert(!available || Buffer.byteLength(observation.output) <= 32768, 'observation-budget-exceeded');
  const results = checks.map(check => ({check_id: check.check_id, result: !available ? 'unknown'
    : (observation.output.toLowerCase().includes(check.value.toLowerCase()) === (check.kind === 'includes') ? 'supported' : 'contradicted')}));
  return rec('interaction-outcome', {request_ref: turn.request_ref, turn_ref: turn.turn_ref, dispatch_digest: turn.dispatch_digest,
    observation_digest: digest(observation), evidence_ref: observation.evidence_ref, evaluator_id: 'are.literal-output-checks/v1',
    checks: results, disposition: results.some(r => r.result === 'contradicted') ? 'contradicted'
      : results.length && results.every(r => r.result === 'supported') ? 'supported' : 'inconclusive'});
}
export function assessLessonApplication({lesson, request_ref, context_digest, dispatch_digest, outcome = null}) {
  assert(verifyLearningRecord(lesson, 'scoped-intent-reflection') && text(request_ref) && hash(context_digest), 'lesson-application-invalid');
  assert(dispatch_digest === null || hash(dispatch_digest), 'dispatch-digest-invalid');
  assert(outcome === null || verifyLearningRecord(outcome, 'interaction-outcome') && outcome.request_ref === request_ref
    && outcome.dispatch_digest === dispatch_digest, 'lesson-outcome-binding-invalid');
  return rec('lesson-application-assessment', {lesson_id: lesson.lesson_id, lesson_digest: lesson.record_digest, request_ref,
    context_digest, dispatch_digest, outcome_ref: outcome?.record_digest ?? null,
    disposition: dispatch_digest === null ? 'not-applied' : outcome?.disposition ?? 'dispatched-awaiting-evidence'});
}
export function createInteractionState({participant_ref, product_ref, interaction_ref}) {
  assert([participant_ref, product_ref, interaction_ref].every(text), 'state-scope-required');
  return rec('interaction-state', {participant_ref, product_ref, interaction_ref, lessons: {}, disabled: [], turns: {},
    applications: [], feedback_refs: [], evolution: {}, revision: 0, predecessor_digest: null});
}
export function reduceInteractionState(previous, event) {
  assert(verifyLearningRecord(previous, 'interaction-state') && isRecord(event) && text(event.event_id), 'event-invalid');
  const {schema_version, record_digest, authority_effect, ...state} = clone(previous);
  if (event.kind === 'dispatch') {
    const t = event.turn;
    assert(text(t.request_ref) && !state.turns[t.request_ref] && hash(t.dispatch_digest) && verifyLearningRecord(t.view, 'interaction-context-view')
      && t.view.state_digest === previous.record_digest && t.view.request_ref === t.request_ref, 'dispatch-state-binding-invalid');
    assert(Object.keys(state.turns).length < 256, 'turn-retention-budget-exceeded');
    state.turns[t.request_ref] = clone(t);
    for (const item of t.view.items) {
      const lesson = state.lessons[item.lesson_id]; assert(lesson?.record_digest === item.lesson_digest, 'dispatch-lesson-stale');
      state.applications.push(assessLessonApplication({lesson, request_ref: t.request_ref, context_digest: t.view.record_digest, dispatch_digest: t.dispatch_digest}));
    }
  } else if (event.kind === 'bind') {
    const turn = state.turns[event.request_ref]; assert(turn && text(event.turn_ref) && !turn.turn_ref, 'turn-binding-conflict'); turn.turn_ref = event.turn_ref;
  } else if (event.kind === 'outcome') {
    const turn = state.turns[event.request_ref]; assert(turn && !turn.outcome, 'completion-missing-or-duplicate');
    turn.outcome = assessInteractionOutcome(turn, event.observation);
    for (const item of turn.view.items) {
      const lesson = event.lessons?.find(l => l.record_digest === item.lesson_digest) ?? state.lessons[item.lesson_id];
      assert(lesson?.record_digest === item.lesson_digest, 'outcome-lesson-revision-missing');
      const specific = assessInteractionOutcome({...turn, checks: lesson.expected_checks}, event.observation);
      state.applications.push(assessLessonApplication({lesson, request_ref: turn.request_ref, context_digest: turn.view.record_digest, dispatch_digest: turn.dispatch_digest, outcome: specific}));
      const recent = state.applications.filter(a => a.lesson_digest === lesson.record_digest && ['supported', 'contradicted'].includes(a.disposition)).slice(-5);
      if (lesson.preference.posture === 'inferred' && recent.filter(a => a.disposition === 'contradicted').length >= 2 && !state.disabled.includes(lesson.lesson_id)) state.disabled.push(lesson.lesson_id);
    }
  } else if (event.kind === 'lesson') {
    const lesson = event.lesson, turn = state.turns[lesson?.episode_ref];
    assert(verifyLearningRecord(lesson, 'scoped-intent-reflection') && turn?.outcome
      && turn.outcome.observation_digest === lesson.observation_digest, 'feedback-episode-binding-invalid');
    assert(lesson.preference.participant_ref === state.participant_ref && lesson.preference.product_ref === state.product_ref
      && lesson.preference.interaction_ref === turn.interaction_ref, 'lesson-scope-invalid');
    assert(!state.feedback_refs.includes(lesson.preference.grounding.source.request_ref), 'feedback-already-recorded');
    const old = state.lessons[lesson.lesson_id];
    assert(old ? lesson.predecessor_digest === old.record_digest && lesson.revision === old.revision + 1 : lesson.predecessor_digest === null && lesson.revision === 1, 'lesson-revision-invalid');
    state.lessons[lesson.lesson_id] = lesson; state.feedback_refs.push(lesson.preference.grounding.source.request_ref);
    // A revision is explicit new source evidence, but does not override a prior disable control.
  } else if (event.kind === 'disable-reuse') {
    assert(state.lessons[event.lesson_id] && text(event.source_ref), 'control-target-invalid');
    if (!state.disabled.includes(event.lesson_id)) state.disabled.push(event.lesson_id);
  } else if (event.kind === 'policy') {
    assert(verifyLearningRecord(event.policy, 'interaction-learning-policy') && text(event.source_ref), 'policy-invalid'); state.policy = event.policy;
  } else if (event.kind === 'evolution') {
    assert(text(event.trigger_id) && isRecord(event.result), 'evolution-event-invalid');
    state.evolution[event.trigger_id] = clone(event.result);
  } else throw Error('learning.event-kind-unsupported');
  state.revision++; state.predecessor_digest = previous.record_digest;
  assert(Buffer.byteLength(canonicalJson(state)) <= 4 * 1024 * 1024, 'state-budget-exceeded');
  return rec('interaction-state', state);
}
export function composeInteractionLearningLoop({state, request, policy}) {
  return {state, view: projectInteractionContext(state, request, policy), authority_effect: 'none'};
}
