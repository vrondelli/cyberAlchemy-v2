import {canonicalJson, deepFreeze, digest, isRecord, sealed, text, uniqueText, verifyDigest} from "./canonical.mjs";
import {assessRequirementChange, materializeRequirementSnapshot, verifyRequirementSnapshot} from "./requirement-change.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";

export const OBJECTIVE_STATE_SCHEMA = "are.objective-state/v1";
export const OBJECTIVE_RESOLUTION_SCHEMA = "are.objective-resolution/v1";
const TRANSITIONS = new Set(["continue", "refine", "replace", "interrupt", "new"]);
const MAX_BYTES = 32 * 1024;
const HASH = /^[0-9a-f]{64}$/;
const closed = (x, keys) => isRecord(x) && Object.keys(x).every(k => keys.includes(k));
const strings = x => Array.isArray(x) && x.every(text);
const bounded = x => Buffer.byteLength(canonicalJson(x)) <= MAX_BYTES;
const clone = x => JSON.parse(canonicalJson(x));
const EMPTY_SEMANTIC_TEXT = createSemanticTextFacade(createModulePort({output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});

function semanticKeyJudgment(request, semanticText, purpose) {
  try {
    const result = (semanticText ?? EMPTY_SEMANTIC_TEXT).semanticKey(request, {
      invocation_id: `${purpose}.${digest(request)}`,
    });
    if (!isRecord(result) || !["available", "unavailable", "blocked"].includes(result.disposition)
      || !Array.isArray(result.reason_codes) || !isRecord(result.receipt)
      || (result.disposition === "available" && typeof result.value?.key !== "string")) {
      return {disposition: "blocked", reason_codes: ["module.semantic-result-invalid"], receipt: null, value: null};
    }
    return result;
  } catch {
    return {disposition: "blocked", reason_codes: ["module.semantic-port-invalid"], receipt: null, value: null};
  }
}

function dependencyEvidence(result) {
  return deepFreeze({
    capability_id: "text.semantic-key/v1",
    disposition: result.disposition,
    module_id: result.module_id ?? null,
    module_version: result.module_version ?? null,
    reason_codes: [...result.reason_codes],
    receipt: result.receipt,
    authority_effect: "none",
  });
}

function objectiveValid(x) {
  return closed(x, ["objective_id", "description", "revision", "request_ref", "request_digest", "target_refs", "completion_criteria", "evidence_refs"])
    && [x.objective_id, x.description, x.request_ref].every(text)
    && HASH.test(x.request_digest) && Number.isSafeInteger(x.revision) && x.revision > 0
    && [x.target_refs, x.completion_criteria, x.evidence_refs].every(strings)
    && x.evidence_refs.length > 0;
}

export function materializeObjectiveState(input = {}) {
  if (!closed(input, ["consumer_ref", "scope_ref", "active_objective", "suspended_objectives", "predecessor_state_digest", "last_request"]) || !text(input.consumer_ref) || !text(input.scope_ref)) throw new TypeError("Objective state requires consumer and scope.");
  const active = input.active_objective ?? null;
  const suspended = input.suspended_objectives ?? [];
  const last = input.last_request ?? null;
  if ((active !== null && !objectiveValid(active)) || !Array.isArray(suspended) || suspended.length > 16 || suspended.some(x => !objectiveValid(x))) throw new TypeError("Invalid objective records or state limit.");
  const ids = [...(active ? [active] : []), ...suspended].map(x => x.objective_id);
  if (new Set(ids).size !== ids.length) throw new TypeError("Objective IDs must be unique.");
  if (input.predecessor_state_digest != null && !HASH.test(input.predecessor_state_digest)) throw new TypeError("Invalid predecessor digest.");
  if (last !== null && (!closed(last, ["request_ref", "request_digest", "transition"]) || !text(last.request_ref) || !HASH.test(last.request_digest) || !TRANSITIONS.has(last.transition))) throw new TypeError("Invalid last request identity.");
  const result = sealed(OBJECTIVE_STATE_SCHEMA, {
    consumer_ref: input.consumer_ref.trim(), scope_ref: input.scope_ref.trim(),
    active_objective: clone(active),
    suspended_objectives: clone(suspended).sort((a, b) => a.objective_id.localeCompare(b.objective_id)),
    predecessor_state_digest: input.predecessor_state_digest ?? null, last_request: clone(last),
  }, "state_digest");
  if (!bounded(result)) throw new TypeError("Objective state exceeds byte budget.");
  return result;
}

export function verifyObjectiveState(state) {
  try {
    if (!closed(state, ["schema_version", "consumer_ref", "scope_ref", "active_objective", "suspended_objectives", "predecessor_state_digest", "last_request", "authority_effect", "state_digest"]) || state.schema_version !== OBJECTIVE_STATE_SCHEMA || state.authority_effect !== "none" || !verifyDigest(state, "state_digest")) return false;
    const {schema_version, authority_effect, state_digest, ...fields} = state;
    return materializeObjectiveState(fields).state_digest === state_digest;
  } catch { return false; }
}

function answer(input, state, disposition, reason, extra = {}) {
  return sealed(OBJECTIVE_RESOLUTION_SCHEMA, {
    disposition, reason_codes: reason ? [reason] : [], request_ref: input.request_ref ?? null,
    request_digest: typeof input.request === "string" ? digest(input.request) : null,
    previous_state_digest: state?.state_digest ?? null,
    previous_objective: state?.active_objective ?? null,
    next_state: state, transition: null, provider_calls: 0,
    classification_basis: "unresolved", evidence_span: null,
    completion_criteria_posture: state?.active_objective?.completion_criteria?.length ? "declared-not-evaluated" : "unknown",
    ...extra,
  }, "resolution_digest");
}

function explicitCandidate(request, state, semanticText) {
  const value = request.trim();
  const semantic = semanticKeyJudgment(value, semanticText, "objective-cue");
  if (semantic.disposition !== "available") return {semantic_dependency: semantic};
  const semanticValue = semantic.value.key;
  if (/^(?:please\s+)?(?:resume|return to)(?:\s+(?:it|(?:the )?previous (?:task|work)))?$/u.test(semanticValue)) {
    if (state.suspended_objectives.length !== 1) return {ask: "objective.resume-target-ambiguous"};
    return {transition: "continue", referent_objective_id: state.suspended_objectives[0].objective_id, evidence_span: {start: 0, end: request.length}};
  }
  if (/^(?:please\s+)?(?:continue(?:\s+implementing|\s+working on)?(?:\s+(?:it|this|that|the work))?|do (?:it|next|the next step)|go ahead|carry on)$/u.test(semanticValue)) {
    if (!state.active_objective) return {ask: "objective.active-reference-missing"};
    return {transition: "continue", referent_objective_id: state.active_objective.objective_id, evidence_span: {start: 0, end: request.length}};
  }
  for (const [transition, expression] of [
    ["interrupt", /^before that\s*[,;:]\s*(.+)$/isu],
    ["replace", /^instead\s*[,;:]?\s+(.+)$/isu],
    ["refine", /^also\s*[,;:]?\s+(.+)$/isu],
    ["new", /^new (?:task|objective)\s*:\s*(.+)$/isu],
  ]) {
    const match = expression.exec(value);
    if (match) return {transition, objective: {description: match[1].trim()}, evidence_span: {start: 0, end: request.length}};
  }
  if (!state.active_objective && /^(?:please\s+)?(?:explain|implement|build|create|start|launch|shape|design|research|review|define|test|describe|compare)\s+\S/u.test(semanticValue)) return {transition: "new", objective: {description: value}, evidence_span: {start: 0, end: request.length}};
  return null;
}

function candidateValid(c, request) {
  if (!closed(c, ["transition", "objective", "referent_objective_id", "evidence_span", "requirement_delta"]) || !TRANSITIONS.has(c.transition)) return false;
  const span = c.evidence_span;
  if (!closed(span, ["start", "end"]) || !Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) || span.start < 0 || span.end <= span.start || span.end > request.length || !text(request.slice(span.start, span.end))) return false;
  if (c.transition === "continue") return c.objective === undefined && text(c.referent_objective_id);
  return c.referent_objective_id === undefined
    && closed(c.objective, ["description", "target_refs", "completion_criteria"])
    && text(c.objective.description)
    && (c.objective.target_refs === undefined || strings(c.objective.target_refs))
    && (c.objective.completion_criteria === undefined || strings(c.objective.completion_criteria));
}

export function classifyDefineIntake(request, transition, semanticText = EMPTY_SEMANTIC_TEXT) {
  const semantic = semanticKeyJudgment(request, semanticText, "define-intake");
  if (semantic.disposition !== "available") return deepFreeze({
    schema_version: "are.define-intake/v2",
    disposition: semantic.disposition,
    required: null,
    route_id: null,
    process: null,
    purpose: null,
    required_outputs: [],
    language_dimensions: [],
    downstream_posture: "semantic-dependent-judgment-withheld",
    reason_codes: [...semantic.reason_codes],
    dependency_receipt_digest: semantic.receipt?.receipt_digest ?? null,
    authority_effect: "none",
  });
  const semanticRequest = semantic.value.key;
  const greenfield = /\b(?:start|create|build|launch|shape|design)\s+(?:something\s+new|a\s+new|an\s+new|my\s+new|our\s+new)\b/u.test(semanticRequest)
    || /\bnew\s+(?:initiative|product|project|system|capability|workflow|venture)\b/u.test(semanticRequest);
  const required = transition === "new" && greenfield;
  return deepFreeze({
    schema_version: "are.define-intake/v2",
    disposition: "evaluated",
    required,
    route_id: required ? "CA2-ROUTE-DEFINE" : null,
    process: required ? "define" : null,
    purpose: required ? "elicit-and-confirm-user-domain-language" : null,
    required_outputs: required ? ["confirmed-scope", "candidate-domain-language", "open-questions", "authority-envelope"] : [],
    language_dimensions: required ? ["domain", "subject", "context", "desired-outcome", "consumers", "terms", "distinctions", "relationships", "constraints", "owners"] : [],
    downstream_posture: required ? "route-plan-or-implementation-separately-after-user-confirmation" : "unchanged",
    reason_codes: [],
    dependency_receipt_digest: semantic.receipt.receipt_digest,
    authority_effect: "none",
  });
}

export async function resolveObjectiveTransition(input = {}, provider = null, semanticText = EMPTY_SEMANTIC_TEXT) {
  if (!isRecord(input) || !text(input.request) || !text(input.request_ref) || !text(input.consumer_ref) || !text(input.scope_ref)) return answer({}, null, "block", "objective.request-identity-required");
  try { input = clone(input); } catch { return answer({}, null, "block", "objective.input-invalid"); }
  let state;
  try {
    if (!bounded(input.request)) return answer(input, null, "block", "objective.request-budget-exceeded");
    state = input.state ?? materializeObjectiveState({consumer_ref: input.consumer_ref, scope_ref: input.scope_ref});
    if (!verifyObjectiveState(state)) return answer(input, null, "block", "objective.state-invalid");
    if (state.consumer_ref !== input.consumer_ref || state.scope_ref !== input.scope_ref) return answer(input, null, "block", "objective.state-scope-mismatch");
    if (input.state && input.expected_state_digest !== state.state_digest) return answer(input, state, "block", "objective.state-digest-mismatch");
    state = deepFreeze(clone(state));
    if (input.requirement_snapshot !== undefined) {
      const s = input.requirement_snapshot;
      if (!verifyRequirementSnapshot(s) || s.consumer_ref !== state.consumer_ref || s.scope_ref !== state.scope_ref
        || s.objective_id !== state.active_objective?.objective_id || s.objective_state_digest !== state.state_digest) return answer(input, state, "block", "requirements.snapshot-binding-invalid");
    }
  } catch { return answer(input, null, "block", "objective.input-invalid"); }
  if (state.last_request?.request_ref === input.request_ref) {
    return state.last_request.request_digest === digest(input.request)
      ? answer(input, state, "replayed", null, {transition: state.last_request.transition, classification_basis: "latest-request-replay",
        ...(input.requirement_snapshot ? {requirement_snapshot: input.requirement_snapshot} : {})})
      : answer(input, state, "block", "objective.request-identity-conflict");
  }
  let context;
  try {
    context = input.selected_context ?? [];
    if (!Array.isArray(context) || !bounded(context) || context.some(x => !closed(x, ["source_ref", "content"]) || !text(x.source_ref) || !text(x.content)) || new Set(context.map(x => x.source_ref)).size !== context.length) return answer(input, state, "block", "objective.selected-context-invalid");
    context = clone(context).sort((a, b) => a.source_ref.localeCompare(b.source_ref));
  } catch { return answer(input, state, "block", "objective.selected-context-invalid"); }
  let candidate = input.candidate;
  let basis = candidate === undefined ? "deterministic-cue" : "caller-supplied-candidate";
  let calls = 0;
  if (candidate === undefined) candidate = input.requirement_snapshot && typeof provider === "function" ? null : explicitCandidate(input.request, state, semanticText);
  if (basis === "deterministic-cue" && candidate?.semantic_dependency) {
    const dependency = dependencyEvidence(candidate.semantic_dependency);
    return answer(input, state, candidate.semantic_dependency.disposition === "unavailable" ? "unavailable" : "block",
      candidate.semantic_dependency.reason_codes[0], {classification_basis: "semantic-dependent-judgment-withheld", module_dependency: dependency});
  }
  if (!candidate && typeof provider === "function") {
    const timeout = input.provider_timeout_ms ?? 1000;
    if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 30_000) return answer(input, state, "block", "objective.provider-timeout-invalid");
    const controller = new AbortController();
    let timer;
    calls = 1; basis = "provider-proposal";
    try {
      candidate = await Promise.race([
        Promise.resolve().then(() => provider(deepFreeze({request: input.request, request_ref: input.request_ref, state, selected_context: context,
          ...(input.requirement_snapshot ? {requirement_snapshot: input.requirement_snapshot} : {}), authority_effect: "none"}), {signal: controller.signal})),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("deadline")); }, timeout); }),
      ]);
    } catch { return answer(input, state, "block", controller.signal.aborted ? "objective.provider-timeout" : "objective.provider-failed", {provider_calls: calls}); }
    finally { clearTimeout(timer); }
  }
  if (!candidate && basis === "provider-proposal") return answer(input, state, "block", "objective.candidate-invalid", {provider_calls: calls});
  if (!candidate || (basis === "deterministic-cue" && candidate.ask)) return answer(input, state, "ask", candidate?.ask ?? "objective.transition-evidence-required", {provider_calls: calls});
  try { if (!bounded(candidate) || !candidateValid(candidate, input.request)) return answer(input, state, "block", "objective.candidate-invalid", {provider_calls: calls}); }
  catch { return answer(input, state, "block", "objective.candidate-invalid", {provider_calls: calls}); }
  let requirementChange = null;
  if (input.requirement_snapshot !== undefined || candidate.requirement_delta !== undefined) {
    if (!input.requirement_snapshot) return answer(input, state, "block", "requirements.snapshot-required", {provider_calls: calls});
    const assessed = assessRequirementChange({snapshot: input.requirement_snapshot, delta: candidate.requirement_delta,
      transition: candidate.transition, request: input.request, request_ref: input.request_ref});
    if (!assessed.ok) return answer(input, state, "block", assessed.reason_codes[0], {provider_calls: calls});
    if (candidate.transition === "continue" && candidate.referent_objective_id !== state.active_objective.objective_id) return answer(input, state, "block", "requirements.resume-snapshot-required", {provider_calls: calls});
    requirementChange = assessed.value;
  }
  const active = state.active_objective;
  const suspended = [...state.suspended_objectives];
  let next;
  if (candidate.transition === "continue") {
    next = [active, ...suspended].find(x => x?.objective_id === candidate.referent_objective_id);
    if (!next) return answer(input, state, "ask", "objective.referent-not-in-state", {provider_calls: calls});
    if (next !== active) {
      suspended.splice(suspended.indexOf(next), 1);
      if (active) suspended.push(active);
    }
  } else {
    if (candidate.transition !== "new" && !active) return answer(input, state, "ask", "objective.active-reference-missing", {provider_calls: calls});
    if (basis === "deterministic-cue" && /\b(?:it|this|that|them)\b/iu.test(candidate.objective.description)) return answer(input, state, "ask", "objective.description-referent-unresolved");
    const refine = candidate.transition === "refine";
    next = {
      objective_id: refine ? active.objective_id : `objective:${digest({request_ref: input.request_ref, request: input.request, consumer_ref: input.consumer_ref, scope_ref: input.scope_ref})}`,
      description: refine && basis === "deterministic-cue" ? `${active.description}; ${candidate.objective.description}` : candidate.objective.description.trim(),
      revision: refine ? active.revision + 1 : 1,
      request_ref: input.request_ref, request_digest: digest(input.request),
      target_refs: uniqueText([...(refine ? active.target_refs : []), ...(candidate.objective.target_refs ?? [])]),
      completion_criteria: uniqueText([...(refine ? active.completion_criteria : []), ...(candidate.objective.completion_criteria ?? [])]),
      evidence_refs: uniqueText([...(refine ? active.evidence_refs : []), input.request_ref]),
    };
    if (active && ["new", "interrupt"].includes(candidate.transition)) suspended.push(active);
  }
  try {
    const nextState = materializeObjectiveState({consumer_ref: state.consumer_ref, scope_ref: state.scope_ref, active_objective: next, suspended_objectives: suspended, predecessor_state_digest: state.state_digest, last_request: {request_ref: input.request_ref, request_digest: digest(input.request), transition: candidate.transition}});
    const requirementFields = requirementChange ? {requirement_change: requirementChange, requirement_snapshot: materializeRequirementSnapshot({
      consumer_ref: state.consumer_ref, scope_ref: state.scope_ref, objective_id: next.objective_id, objective_state_digest: nextState.state_digest,
      requirements: requirementChange.resulting_requirements, source_refs: [...new Set([...input.requirement_snapshot.source_refs, input.request_ref])]})} : {};
    return answer(input, state, "resolved", null, {transition: candidate.transition, next_state: nextState, define_intake: classifyDefineIntake(input.request, candidate.transition, semanticText), classification_basis: basis, provider_calls: calls, evidence_span: {...candidate.evidence_span}, completion_criteria_posture: next.completion_criteria.length ? "declared-not-evaluated" : "unknown", selected_context_digest: digest(context), ...requirementFields});
  } catch { return answer(input, state, "block", "objective.successor-state-invalid-or-over-budget", {provider_calls: calls}); }
}
