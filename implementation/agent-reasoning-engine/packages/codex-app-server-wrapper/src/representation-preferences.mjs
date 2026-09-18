import {digestValue, freezeResult} from './canonical.mjs';

const check = (condition, reason) => {if (!condition) throw Error(`representation.${reason}`);};
const FORMATS = {dag: 'DAG', table: 'a table', checklist: 'a checklist', plain: 'plain text'};
const key = o => JSON.stringify([o.thread_id, o.task, o.format]);
const scopeMatches = (lesson, offer) => lesson.preference.representation?.task === offer.task
  && (lesson.preference.retention_scope === 'current-product' || lesson.preference.interaction_ref === offer.thread_id);

// Deliberately narrow whole-request grammar. Documents, quotations, questions,
// negation, mixed instructions and unsupported languages abstain.
export function classifyRepresentationRequest(text) {
  if (typeof text !== 'string' || text.length > 2048 || /[\n\r"'“”‘’`>?;]|\b(?:not|never|without|don't|no|and|then|also|but|or|explain|compare.*plan|plan.*compare)\b/i.test(text)) return null;
  const normalized = text.trim().replace(/[.!]$/, '');
  const suffix = /\s+(?:in|as|using)\s+(?:a\s+|the\s+)?(dag|table|checklist|plain text)(?:\s+form)?$/i.exec(normalized);
  const subject = suffix ? normalized.slice(0, suffix.index) : normalized;
  const match = /^(?:please\s+)?(?:(?:create|make|prepare)\s+(?:a\s+|the\s+)?)?(plan|compare)(?:\s+([a-z0-9][a-z0-9 _-]*))?$/i.exec(subject);
  if (!match || /\b(dag|table|checklist|plain|as|using|in)\b/i.test(match[2] ?? '')) return null;
  return freezeResult({task: match[1].toLowerCase(), format: suffix?.[1].toLowerCase().replace(' text', '') ?? null});
}
export function validatePreferenceDecision(value) {
  check(value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every(k => ['offer_id', 'action', 'retention_scope'].includes(k))
    && typeof value.offer_id === 'string' && /^offer:[a-f0-9]{64}$/.test(value.offer_id)
    && ['accept', 'decline'].includes(value.action), 'decision-invalid');
  check(value.action === 'accept' ? ['current-interaction', 'current-product'].includes(value.retention_scope)
    : value.retention_scope === undefined, 'decision-scope-invalid');
}
function history(events) {
  const requests = events.filter(e => e.event_kind === 'interaction-host-request').map(e => e.content);
  const results = new Map(events.filter(e => e.event_kind === 'interaction-host-result').map(e => [e.content.response_id, e.content]));
  return {requests, results};
}
export function inspectPreferenceOffers(events, state) {
  if (state.policy?.mode !== 'apply-scoped') return [];
  const {requests, results} = history(events);
  const window = new Set(requests.slice(-20).map(r => r.response_id));
  const lessons = Object.values(state.lessons);
  return [...results.values()].flatMap(r => r.preference_offers ?? []).filter(offer => {
    if (!offer.evidence_refs.every(ref => window.has(ref))) return false;
    if (lessons.some(l => scopeMatches(l, offer) && (l.preference.representation.format === offer.format || !state.disabled.includes(l.lesson_id)))) return false;
    return !requests.some(r => r.request.preference_decision?.offer_id === offer.offer_id
      && (r.request.preference_decision.action === 'decline'
        || lessons.some(l => l.preference.grounding.source.request_ref === r.response_id)));
  });
}
export function proposePreferenceOffers(events, state, binding) {
  if (state.policy?.mode !== 'apply-scoped') return [];
  const {requests, results} = history(events);
  const known = new Set([...results.values()].flatMap(r => r.preference_offers ?? []).map(key));
  const groups = new Map();
  for (const row of requests.slice(-20)) {
    const signal = row.preference_observation;
    if (!signal?.format || row.request.preference_decision || results.get(row.response_id)?.ok !== true) continue;
    const group = {thread_id: row.request.thread_id, task: signal.task, format: signal.format};
    const k = key(group), prior = groups.get(k) ?? {...group, evidence_refs: []};
    if (!prior.evidence_refs.includes(row.response_id)) prior.evidence_refs.push(row.response_id);
    groups.set(k, prior);
  }
  return [...groups.values()].filter(o => o.evidence_refs.length >= 3 && !known.has(key(o))
    && !Object.values(state.lessons).some(l => scopeMatches(l, o) && (l.preference.representation.format === o.format || !state.disabled.includes(l.lesson_id)))).map(o => {
    const identity = {...o, participant_ref: binding.participant_ref, product_ref: binding.product_ref};
    const noun = o.task === 'plan' ? 'plans' : 'comparisons';
    return freezeResult({...identity, offer_id: `offer:${digestValue(identity)}`,
      confirmation_text: `Use ${FORMATS[o.format]} for ${noun}.`,
      prompt: `You requested ${FORMATS[o.format]} for ${noun} repeatedly. Save this preference for this conversation or this product?`,
      authority_effect: 'none'});
  });
}
export function applyPreferenceDecision(request, events, state) {
  if (!request.preference_decision) return request;
  const decision = request.preference_decision;
  validatePreferenceDecision(decision);
  const offer = inspectPreferenceOffers(events, state).find(o => o.offer_id === decision.offer_id);
  check(offer && offer.thread_id === request.thread_id, 'offer-unavailable');
  if (decision.action === 'decline') return request;
  check(request.text === offer.confirmation_text, 'confirmation-mismatch');
  check(!Object.values(state.lessons).some(l => !state.disabled.includes(l.lesson_id) && l.preference.representation?.task === offer.task
    && (decision.retention_scope === 'current-product' || l.preference.retention_scope === 'current-product' || l.preference.interaction_ref === offer.thread_id)), 'existing-preference-requires-revocation');
  return freezeResult({...request, feedback: {response_id: offer.evidence_refs.at(-1),
    instruction_span: {start: 0, end: request.text.length}, instruction: request.text,
    retention_scope: decision.retention_scope, conditions: [], exclusions: [], checks: [],
    representation: {task: offer.task, format: offer.format}, correction_kind: 'new-preference'}});
}
