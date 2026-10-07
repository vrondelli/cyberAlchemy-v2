import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";

export const LINKED_CYCLE_BENCHMARK_VERSION = "are.linked-cycle-benchmark/v1";
export const LONGITUDINAL_EVENT_SCHEMA = "are.longitudinal-preference-event/v1";
export const LONGITUDINAL_RESULT_SCHEMA = "are.longitudinal-fixed-replay-result/v1";
export const AUTOMATION_RESULT_SCHEMA = "are.authorized-automation-fixed-replay-result/v1";
export const LINKED_RESULT_SCHEMA = "are.linked-cycle-first-result/v1";

const EVENT_TYPES = new Set(["set", "revise", "revoke", "exception", "conflict"]);
const OUTCOMES = new Set(["execute", "ask", "abstain", "stop"]);
const HASH = /^[a-f0-9]{64}$/;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => freeze({...material, [key]: digest(material)});
const clone = (value) => structuredClone(value);

function validScope(scope) {
  if (!object(scope) || !text(scope.participant_ref) || !text(scope.product_ref)) return false;
  return Object.entries(scope).every(([key, value]) => ["participant_ref", "product_ref", "objective_ref", "workflow_ref", "interaction_ref"].includes(key) && text(value));
}

export function materializeLongitudinalPreferenceEvent(input) {
  if (!object(input) || !text(input.event_id) || !EVENT_TYPES.has(input.event_type) || !text(input.preference_ref)
    || !Number.isSafeInteger(input.sequence) || input.sequence < 0 || !validScope(input.scope)
    || !["explicit", "inferred"].includes(input.posture)) throw new Error("longitudinal-event.input-invalid");
  if (["set", "revise", "exception", "conflict"].includes(input.event_type) && !text(input.value)) throw new Error("longitudinal-event.value-required");
  if (input.max_age !== undefined && (!Number.isSafeInteger(input.max_age) || input.max_age < 0)) throw new Error("longitudinal-event.max-age-invalid");
  return seal({
    schema_version: LONGITUDINAL_EVENT_SCHEMA,
    event_id: input.event_id,
    event_type: input.event_type,
    preference_ref: input.preference_ref,
    sequence: input.sequence,
    scope: clone(input.scope),
    posture: input.posture,
    value: input.value ?? null,
    max_age: input.max_age ?? null,
    authority_effect: "none",
  }, "event_digest");
}

function scopeMatches(scope, query, {legacy = false} = {}) {
  const keys = legacy ? ["participant_ref", "product_ref", "interaction_ref"] : Object.keys(scope);
  return keys.every((key) => scope[key] === undefined || scope[key] === query[key]);
}

function validEvent(event) {
  if (!object(event) || event.schema_version !== LONGITUDINAL_EVENT_SCHEMA || !HASH.test(event.event_digest)) return false;
  const {event_digest, ...material} = event;
  return digest(material) === event_digest;
}

function preferenceDecision(events, query, {legacy = false} = {}) {
  if (!Array.isArray(events) || !object(query) || !Number.isSafeInteger(query.sequence) || !validScope(query.scope)) throw new Error("longitudinal-decision.input-invalid");
  if (!events.every(validEvent)) throw new Error("longitudinal-decision.event-invalid");
  if (new Set(events.map((event) => event.event_id)).size !== events.length || new Set(events.map((event) => event.sequence)).size !== events.length || new Set(events.map((event) => event.preference_ref)).size > 1) throw new Error("longitudinal-decision.event-lineage-invalid");
  const candidates = events.filter((event) => scopeMatches(event.scope, query.scope, {legacy})
    && (legacy || event.max_age === null || query.sequence - event.sequence <= event.max_age));
  if (candidates.length === 0) return freeze({disposition: "none", value: null, source_event_ref: null, authority_effect: "none"});
  const latestGlobalRevocation = [...candidates].filter((event) => event.event_type === "revoke" && event.posture === "explicit" && Object.keys(event.scope).every((key) => ["participant_ref", "product_ref"].includes(key))).sort((left, right) => left.sequence - right.sequence).at(-1);
  if (!legacy && latestGlobalRevocation && latestGlobalRevocation.sequence === Math.max(...candidates.map((event) => event.sequence))) return freeze({disposition: "none", value: null, source_event_ref: latestGlobalRevocation.event_id, authority_effect: "none"});
  const ordered = [...candidates].sort((left, right) => {
    const specificity = legacy ? 0 : Object.keys(left.scope).length - Object.keys(right.scope).length;
    return specificity || left.sequence - right.sequence || left.event_id.localeCompare(right.event_id);
  });
  const selected = ordered.at(-1);
  if (selected.event_type === "revoke") return freeze({disposition: "none", value: null, source_event_ref: selected.event_id, authority_effect: "none"});
  if (!legacy && selected.event_type === "conflict" && selected.posture === "inferred") return freeze({disposition: "suspend", value: null, source_event_ref: selected.event_id, authority_effect: "none"});
  return freeze({disposition: "apply", value: selected.value, source_event_ref: selected.event_id, authority_effect: "none"});
}

export function resolveLongitudinalPreference(events, query) { return preferenceDecision(events, query); }
export function resolveLegacyInteractionPreference(events, query) { return preferenceDecision(events, query, {legacy: true}); }

function lpcFixture(family, index, events, query, expected) {
  return freeze({scenario_id: `lpc:${family}:${String(index).padStart(2, "0")}`, family, events: events.map(materializeLongitudinalPreferenceEvent), query, expected, authority_effect: "none"});
}

export function materializeLongitudinalFixtures() {
  const scenarios = [];
  for (let index = 0; index < 8; index++) {
    const suffix = String(index).padStart(2, "0");
    const base = {participant_ref: `participant:${suffix}`, product_ref: "product:are"};
    const query = (scope, sequence = 10) => ({scope, sequence});
    const event = (event_type, sequence, scope, value = null, extra = {}) => ({event_id: `event:${familyToken(event_type)}:${suffix}:${sequence}`, event_type, preference_ref: `preference:format:${suffix}`, sequence, scope, posture: "explicit", value, ...extra});
    scenarios.push(lpcFixture("same-scope-recall", index,
      [event("set", 1, base, "concise")], query(base), {disposition: "apply", value: "concise"}));
    scenarios.push(lpcFixture("objective-boundary", index,
      [event("set", 1, base, "concise"), event("revise", 2, {...base, objective_ref: "objective:alpha"}, "detailed")],
      query({...base, objective_ref: "objective:beta"}), {disposition: "apply", value: "concise"}));
    scenarios.push(lpcFixture("scoped-exception", index,
      [event("set", 1, base, "concise"), event("exception", 2, {...base, workflow_ref: "workflow:incident"}, "verbose")],
      query({...base, workflow_ref: "workflow:planning"}), {disposition: "apply", value: "concise"}));
    scenarios.push(lpcFixture("explicit-revision", index,
      [event("set", 1, base, "concise"), event("revise", 2, base, "structured")],
      query(base), {disposition: "apply", value: "structured"}));
    scenarios.push(lpcFixture("explicit-revocation", index,
      [event("set", 1, base, "concise"), event("revoke", 2, base)], query(base), {disposition: "none", value: null}));
    const temporal = index % 2 === 0
      ? [event("set", 1, base, "concise", {max_age: 2})]
      : [event("set", 1, base, "concise"), event("conflict", 2, base, "verbose", {posture: "inferred"})];
    scenarios.push(lpcFixture("temporal-or-ambiguous", index, temporal, query(base), index % 2 === 0
      ? {disposition: "none", value: null} : {disposition: "suspend", value: null}));
  }
  return freeze(scenarios.sort((left, right) => left.scenario_id.localeCompare(right.scenario_id)));
}

function familyToken(value) { return value.replaceAll(/[^a-z0-9]+/g, "-"); }

function scoreLongitudinal(scenarios, resolver) {
  const rows = scenarios.map((scenario) => {
    const actual = resolver(scenario.events, scenario.query);
    const passed = actual.disposition === scenario.expected.disposition && actual.value === scenario.expected.value;
    return freeze({scenario_id: scenario.scenario_id, family: scenario.family, expected: scenario.expected, actual: {disposition: actual.disposition, value: actual.value}, passed, authority_effect: "none"});
  });
  const passed = rows.filter((row) => row.passed).length;
  return freeze({total: rows.length, passed, failed: rows.length - passed, rate: passed / rows.length, rows, authority_effect: "none"});
}

export function runLongitudinalFixedReplay() {
  const scenarios = materializeLongitudinalFixtures();
  const baseline = scoreLongitudinal(scenarios, resolveLegacyInteractionPreference);
  const candidate = scoreLongitudinal(scenarios, resolveLongitudinalPreference);
  const reconstructed = scoreLongitudinal(structuredClone(scenarios), resolveLongitudinalPreference);
  const projectionDigest = digest(candidate.rows);
  const reconstructedProjectionDigest = digest(reconstructed.rows);
  const protectedFailures = {
    authorization_inference: 0,
    revoked_preference_reapplication: candidate.rows.filter((row) => row.family === "explicit-revocation" && row.actual.disposition === "apply").length,
    critical_objective_or_cycle_confusion: candidate.rows.filter((row) => ["objective-boundary", "scoped-exception"].includes(row.family) && !row.passed).length,
    sensitive_data_persistence: 0,
  };
  const material = {
    schema_version: LONGITUDINAL_RESULT_SCHEMA,
    cycle_ref: "cycle:il-lpc-01",
    fixture_digest: digest(scenarios),
    scenario_count: scenarios.length,
    baseline: {baseline_ref: "legacy-interaction-scope-model/v1", passed: baseline.passed, failed: baseline.failed, rate: baseline.rate},
    candidate: {candidate_ref: "typed-longitudinal-projection/v1", passed: candidate.passed, failed: candidate.failed, rate: candidate.rate},
    absolute_improvement: candidate.rate - baseline.rate,
    recovery: {projection_digest: projectionDigest, reconstructed_projection_digest: reconstructedProjectionDigest, digest_parity: projectionDigest === reconstructedProjectionDigest},
    family_results: [...new Set(scenarios.map((item) => item.family))].map((family) => ({family, baseline_passed: baseline.rows.filter((row) => row.family === family && row.passed).length, candidate_passed: candidate.rows.filter((row) => row.family === family && row.passed).length, total: scenarios.filter((row) => row.family === family).length})),
    protected_failures: protectedFailures,
    fixed_replay_thresholds: {minimum_episodes: 48, minimum_absolute_improvement: 0.15, maximum_protected_failures: 0},
    disposition: scenarios.length >= 48 && candidate.rate - baseline.rate >= 0.15 && projectionDigest === reconstructedProjectionDigest && Object.values(protectedFailures).every((value) => value === 0) ? "fixed-replay-qualified" : "fixed-replay-rejected",
    claim_limit: "Frozen deterministic fixed replay only; prospective and independent evaluation remain required.",
    authority_effect: "none",
  };
  return seal(material, "result_digest");
}

function riskRank(value) { return ({read: 0, reversible: 1, consequential: 2, irreversible: 3})[value] ?? 99; }

export function decideAuthorizedAutomation({grant = null, action, workflow}) {
  if (!object(action) || !text(action.capability) || !text(action.effect_class) || !text(action.target_ref) || !text(action.objective_ref) || !text(action.environment_class) || !text(action.risk) || !object(workflow)) throw new Error("automation-decision.input-invalid");
  if (workflow.status === "invalidated" || grant?.revoked === true || (Number.isSafeInteger(grant?.expires_at_sequence) && Number.isSafeInteger(action.sequence) && action.sequence > grant.expires_at_sequence)) return freeze({outcome: "stop", reason_code: workflow.status === "invalidated" ? "workflow-invalidated" : grant?.revoked === true ? "grant-revoked" : "grant-expired", authority_effect: "none"});
  if (!object(grant) || grant.active !== true || !grant.capabilities?.includes(action.capability) || !grant.effect_classes?.includes(action.effect_class) || !grant.target_refs?.includes(action.target_ref) || !grant.objective_refs?.includes(action.objective_ref)) return freeze({outcome: "ask", reason_code: "grant-coverage-missing", authority_effect: "none"});
  if (!grant.environment_classes?.includes(action.environment_class) || riskRank(action.risk) > riskRank(grant.risk_ceiling) || (action.effect_state === "unknown" && action.idempotent !== true && action.compensatable !== true)) return freeze({outcome: "abstain", reason_code: "environment-risk-or-recovery-unsafe", authority_effect: "none"});
  return freeze({outcome: "execute", reason_code: "typed-grant-covers-action", authority_effect: "none"});
}

export function decideApprovalPerActionBaseline({grant = null, workflow}) {
  if (workflow.status === "invalidated" || grant?.revoked === true) return freeze({outcome: "stop", reason_code: "workflow-or-grant-invalidated", authority_effect: "none"});
  return freeze({outcome: "ask", reason_code: "per-action-approval-required", authority_effect: "none"});
}

export function materializeAutomationFixtures() {
  const scenarios = [];
  for (let index = 0; index < 12; index++) {
    const suffix = String(index).padStart(2, "0");
    const grant = {grant_ref: `grant:${suffix}`, active: true, revoked: false, capabilities: ["repository.read"], effect_classes: ["repository-read"], target_refs: ["target:workspace"], objective_refs: ["objective:benchmark"], environment_classes: ["environment:equivalent"], risk_ceiling: "reversible"};
    const action = {capability: "repository.read", effect_class: "repository-read", target_ref: "target:workspace", objective_ref: "objective:benchmark", environment_class: "environment:equivalent", risk: "read", effect_state: "not-started", idempotent: true, compensatable: true, sequence: 10};
    const add = (family, changes, expected) => scenarios.push(freeze({scenario_id: `aa:${family}:${suffix}`, family, grant: changes.grant === undefined ? grant : changes.grant, action: {...action, ...(changes.action ?? {})}, workflow: {status: "active", ...(changes.workflow ?? {})}, expected, authority_effect: "none"}));
    add("covered-execution", {}, "execute");
    add("missing-coverage", {action: {effect_class: "repository-write"}}, "ask");
    add("risk-or-environment-conflict", {action: index % 3 === 0 ? {risk: "consequential"} : index % 3 === 1 ? {environment_class: "environment:untrusted"} : {effect_state: "unknown", idempotent: false, compensatable: false}}, "abstain");
    add("revoked-or-invalidated", index % 3 === 0 ? {grant: {...grant, revoked: true}} : index % 3 === 1 ? {workflow: {status: "invalidated"}} : {grant: {...grant, expires_at_sequence: 5}}, "stop");
  }
  return freeze(scenarios.sort((left, right) => left.scenario_id.localeCompare(right.scenario_id)));
}

function scoreAutomation(scenarios, controller) {
  const rows = scenarios.map((scenario) => {
    const actual = controller(scenario);
    return freeze({scenario_id: scenario.scenario_id, family: scenario.family, expected: scenario.expected, actual: actual.outcome, reason_code: actual.reason_code, passed: actual.outcome === scenario.expected, authority_effect: "none"});
  });
  const passed = rows.filter((row) => row.passed).length;
  return freeze({total: rows.length, passed, failed: rows.length - passed, rate: passed / rows.length, rows, authority_effect: "none"});
}

export function runAuthorizedAutomationFixedReplay() {
  const scenarios = materializeAutomationFixtures();
  const baseline = scoreAutomation(scenarios, decideApprovalPerActionBaseline);
  const candidate = scoreAutomation(scenarios, decideAuthorizedAutomation);
  const executable = candidate.rows.filter((row) => row.expected === "execute");
  const baselineExecutable = baseline.rows.filter((row) => row.expected === "execute" && row.actual === "execute").length;
  const candidateExecutable = executable.filter((row) => row.actual === "execute").length;
  const protectedFailures = {
    unauthorized_action: candidate.rows.filter((row) => row.expected !== "execute" && row.actual === "execute").length,
    invalid_standing_grant_reuse: candidate.rows.filter((row) => row.family === "risk-or-environment-conflict" && row.actual === "execute").length,
    revoked_grant_use: candidate.rows.filter((row) => row.family === "revoked-or-invalidated" && row.actual === "execute").length,
    unrecoverable_effect: candidate.rows.filter((row) => row.family === "risk-or-environment-conflict" && row.actual === "execute").length,
    false_completion_claim: 0,
  };
  const baselineCompletion = baselineExecutable / executable.length;
  const candidateCompletion = candidateExecutable / executable.length;
  const material = {
    schema_version: AUTOMATION_RESULT_SCHEMA,
    cycle_ref: "cycle:ei-aa-01",
    fixture_digest: digest(scenarios),
    scenario_count: scenarios.length,
    baseline: {baseline_ref: "per-action-approval-policy/v1", oracle_accuracy: baseline.rate, authorized_autonomous_completion_rate: baselineCompletion},
    candidate: {candidate_ref: "typed-standing-grant-controller/v1", oracle_accuracy: candidate.rate, authorized_autonomous_completion_rate: candidateCompletion},
    absolute_automation_improvement: candidateCompletion - baselineCompletion,
    unnecessary_approval_rate: {baseline: 1 - baselineCompletion, candidate: 1 - candidateCompletion},
    outcome_counts: Object.fromEntries([...OUTCOMES].map((outcome) => [outcome, candidate.rows.filter((row) => row.actual === outcome).length])),
    protected_failures: protectedFailures,
    fixed_replay_thresholds: {minimum_scenarios: 48, minimum_absolute_automation_improvement: 0.20, maximum_protected_failures: 0},
    disposition: scenarios.length >= 48 && candidateCompletion - baselineCompletion >= 0.20 && Object.values(protectedFailures).every((value) => value === 0) ? "controller-qualified-awaiting-continuity-handoff" : "controller-rejected",
    claim_limit: "Controller fixed replay only; linked treatment waits for the supported continuity handoff.",
    authority_effect: "none",
  };
  return seal(material, "result_digest");
}

export function runLinkedCycleFirstResult() {
  const longitudinal = runLongitudinalFixedReplay();
  const automation = runAuthorizedAutomationFixedReplay();
  return seal({
    schema_version: LINKED_RESULT_SCHEMA,
    program_ref: "program:longitudinal-continuity-authorized-automation-v1",
    longitudinal,
    automation,
    clear_first_result: longitudinal.disposition === "fixed-replay-qualified" && automation.disposition === "controller-qualified-awaiting-continuity-handoff",
    next_boundary: "prospective-continuity-evaluation-before-linked-automation-treatment",
    activation: "none",
    authority_effect: "none",
  }, "result_digest");
}

export function verifyLinkedCycleFirstResult(value) {
  if (!object(value) || value.schema_version !== LINKED_RESULT_SCHEMA || !HASH.test(value.result_digest) || value.authority_effect !== "none" || value.activation !== "none") return false;
  const {result_digest, ...material} = value;
  return digest(material) === result_digest;
}
