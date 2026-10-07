import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OUTCOMES = new Set(["success", "failure", "indeterminate"]);
const CATEGORIES = new Set(["state_continuity", "scope_transition", "ordering_coordination", "language_clarity", "evidence_completion", "environment_recovery", "execution_error", "none"]);

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const sealed = (material, key) => freeze({...material, [key]: digest(material)});

export const INTERACTION_HYPOTHESIS_SCHEMA = "are.interaction-learning-hypothesis/v1";
export const INTERACTION_OFFLINE_SCREEN_SCHEMA = "are.interaction-learning-offline-screen/v1";
export const INTERACTION_VALIDATION_SCHEMA = "are.interaction-learning-live-validation/v1";
export const INTERACTION_LEARNING_PACKAGE_SCHEMA = "are.interaction-learning-package/v1";
export const INTERACTION_OWNER_DECISION_SCHEMA = "are.interaction-learning-owner-decision/v1";

function validBaseline(value) {
  if (!object(value) || value.schema_version !== "are.interaction-learning-baseline/v1" || value.status !== "BASELINE_MEASURED" || !HASH.test(value.baseline_digest)) return false;
  const {baseline_digest, ...material} = value;
  return digest(material) === baseline_digest && typeof value.overall?.episode_success_rate === "number";
}

export function materializeInteractionHypothesis({cycle_id, baseline, revision = 1, prior_validation = null}) {
  if (typeof cycle_id !== "string" || !validBaseline(baseline)) throw new Error("interaction-hypothesis.input-invalid");
  if (![1, 2, 3, 4].includes(revision) || (revision > 1 && (!object(prior_validation) || prior_validation.schema_version !== INTERACTION_VALIDATION_SCHEMA || prior_validation.disposition !== "candidate-rejected" || !HASH.test(prior_validation.validation_digest)))) throw new Error("interaction-hypothesis.revision-invalid");
  const second = revision === 2;
  const third = revision === 3;
  const fourth = revision === 4;
  const material = {
    schema_version: INTERACTION_HYPOTHESIS_SCHEMA,
    cycle_id,
    hypothesis_id: fourth ? "IL-H04-deterministic-continuity-renderer-v4" : third ? "IL-H03-engine-owned-transition-envelope-v3" : second ? "IL-H02-objective-transition-ledger-v2" : "IL-H01-objective-transition-checkpoint-v1",
    diagnosis: {
      baseline_digest: baseline.baseline_digest,
      baseline_episode_success_rate: baseline.overall.episode_success_rate,
      dominant_failure_category: "scope_transition",
      dominant_failure_count: baseline.diagnostic_counts.scope_transition,
    },
    ...(revision > 1 ? {prior_counterevidence:{hypothesis_id:prior_validation.hypothesis_id, validation_digest:prior_validation.validation_digest, reason_codes:prior_validation.reason_codes}} : {}),
    statement: fourth ? "A deterministic bilingual continuity renderer over an engine-owned envelope will eliminate model re-interpretation at high-risk scope transitions." : third ? "An engine-owned transition envelope with model-authored prose only will preserve workflow identity while retaining useful language generation." : second ? "An engine-supplied typed identity ledger plus explicit response-language and ordering bindings will prevent scope-identity regressions during transitions." : "Binding objective and cycle identity before a scope transition will reduce assistant-caused workflow repair turns.",
    mechanism: fourth ? "Render identity, relationship, next action, clarification, evidence posture, and decision options from closed templates; use unrestricted model prose only outside detected high-risk transitions." : third ? "The objective resolver materializes transition, objective, cycle, relationship, language, next action, and clarification state; the model may author only the response text inside that immutable envelope." : second ? "Project immutable entity kinds and permitted relationships into the checkpoint; the model selects a transition but cannot invent cycle hierarchy, language, or pending-decision order." : "Before responding at a possible transition, materialize the active objective, requested transition, cycle/benchmark relationship, next action, and at most one unresolved clarification.",
    candidate: {
      candidate_ref: fourth ? "deterministic-continuity-renderer/v4" : third ? "engine-owned-transition-envelope/v3" : second ? "objective-transition-ledger/v2" : "objective-transition-checkpoint/v1",
      mutation_surfaces: fourth ? ["objective-resolution-projection", "high-risk-transition-renderer"] : third ? ["objective-resolution-projection", "agent-context-projection", "response-planning"] : ["agent-context-projection", "response-planning"],
      required_fields: revision > 1 ? ["transition", "active_objective", "active_cycle", "relationship_code", "response_language", "next_action", "clarification_needed", "response"] : ["transition", "active_objective", "active_cycle", "relationship", "next_action", "clarification_needed", "response"],
      transition_values: ["continue", "refine", "interrupt", "replace", "new"],
      guardrails: fourth ? ["closed-deterministic-templates", "high-risk-transitions-only", "control-fields-are-engine-owned", "decision-options-required", "evidence-status-is-explicit", "response-language-is-bound", "one-clarification-at-a-time"] : third ? ["control-fields-are-engine-owned", "model-authors-response-only", "typed-cycle-kind-ledger", "response-language-is-bound", "execute-next-pending-decision", "one-clarification-at-a-time", "no-completion-without-evidence"] : second ? ["typed-cycle-kind-ledger", "benchmark-is-artifact-not-cycle-alias", "engine-coordinates-but-is-not-a-cycle", "response-language-is-bound", "execute-next-pending-decision", "one-clarification-at-a-time", "no-completion-without-evidence"] : ["do-not-merge-benchmark-cycle-and-engine", "preserve-user-language", "one-clarification-at-a-time", "no-completion-without-evidence"],
      activation: "recommend-only",
      rollback: fourth ? "Disable the high-risk deterministic renderer and retain the engine-owned envelope as diagnostic state; no serving pointer is changed." : third ? "Remove the engine-owned response envelope adapter and retain the objective resolver state unchanged; no serving pointer is changed." : second ? "Remove the typed identity-ledger projection and restore the rejected v1 checkpoint baseline; no serving pointer is changed." : "Remove the checkpoint from context projection and response planning; no stored objective or serving pointer is changed.",
    },
    experiment: {
      historical_partition_policy: baseline.partition_policy,
      prospective_scenario_count: 20,
      minimum_live_sample: 20,
      numeric_completion_target: 0.75,
      uncertainty_rule: "Wilson 95% lower bound must exceed the historical baseline rate.",
      critical_regression_limit: 0,
      independent_evaluator_required: true,
      control_arm: false,
    },
    falsifier: "Fewer than 20 eligible prospective episodes, success rate below 0.75, Wilson lower bound not above baseline, any critical identity regression, or independent-evaluator rejection.",
    authority_effect: "none",
  };
  return sealed(material, "hypothesis_digest");
}

export function verifyInteractionHypothesis(value) {
  if (!object(value) || value.schema_version !== INTERACTION_HYPOTHESIS_SCHEMA || !HASH.test(value.hypothesis_digest)) return false;
  const {hypothesis_digest, ...material} = value;
  return digest(material) === hypothesis_digest && value.candidate?.activation === "recommend-only";
}

export function materializeInteractionOfflineScreen({baseline, hypothesis, labels}) {
  if (!validBaseline(baseline) || !verifyInteractionHypothesis(hypothesis) || hypothesis.diagnosis.baseline_digest !== baseline.baseline_digest || !Array.isArray(labels)) throw new Error("interaction-screen.input-invalid");
  const validationRefs = new Set(baseline.partitions?.validation?.episode_refs ?? []);
  const selected = labels.filter((label) => validationRefs.has(label.episode_id));
  if (selected.length !== validationRefs.size || new Set(selected.map((label) => label.episode_id)).size !== selected.length) throw new Error("interaction-screen.partition-coverage-invalid");
  const failures = selected.filter((label) => label.outcome === "failure");
  const targeted = failures.filter((label) => label.primary_category === "scope_transition" || label.contributing_categories?.includes("scope_transition"));
  const prohibited = hypothesis.candidate.mutation_surfaces.some((surface) => ["model-weights", "credentials", "serving-pointer"].includes(surface));
  const reasons = [];
  if (failures.length === 0 || targeted.length !== failures.length) reasons.push("validation-failures-not-covered-by-mechanism");
  if (prohibited || hypothesis.candidate.activation !== "recommend-only") reasons.push("candidate-surface-or-activation-invalid");
  return sealed({
    schema_version: INTERACTION_OFFLINE_SCREEN_SCHEMA,
    cycle_id: hypothesis.cycle_id,
    baseline_digest: baseline.baseline_digest,
    hypothesis_digest: hypothesis.hypothesis_digest,
    partition: "validation",
    episode_count: selected.length,
    eligible_count: selected.filter((label) => label.outcome !== "indeterminate").length,
    failure_count: failures.length,
    mechanism_targeted_failure_count: targeted.length,
    checks: {reversible: typeof hypothesis.candidate.rollback === "string" && hypothesis.candidate.rollback.length > 0, prohibited_surfaces_absent: !prohibited, automatic_activation_absent: hypothesis.candidate.activation === "recommend-only", raw_content_required: false},
    disposition: reasons.length === 0 ? "screen-pass" : "screen-fail",
    reason_codes: reasons,
    claim_limit: "Mechanism and guardrail screen only; no counterfactual historical-improvement claim.",
    authority_effect: "none",
  }, "screen_digest");
}

function wilson(success, total) {
  if (total === 0) return {lower: null, upper: null};
  const z = 1.959963984540054;
  const p = success / total;
  const denominator = 1 + z * z / total;
  const centre = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator;
  return {lower: centre - margin, upper: centre + margin};
}

export function materializeInteractionLiveValidation({hypothesis, run_manifest, verdicts}) {
  if (!verifyInteractionHypothesis(hypothesis) || !object(run_manifest) || !HASH.test(run_manifest.run_digest) || !Array.isArray(run_manifest.scenarios) || !Array.isArray(verdicts)) throw new Error("interaction-validation.input-invalid");
  if (run_manifest.hypothesis_digest !== hypothesis.hypothesis_digest || run_manifest.scenarios.length !== hypothesis.experiment.prospective_scenario_count) throw new Error("interaction-validation.run-binding-invalid");
  const scenarioIds = new Set(run_manifest.scenarios.map((entry) => entry.scenario_id));
  if (scenarioIds.size !== run_manifest.scenarios.length || verdicts.length !== scenarioIds.size) throw new Error("interaction-validation.coverage-invalid");
  const seen = new Set();
  for (const verdict of verdicts) {
    if (!object(verdict) || !scenarioIds.has(verdict.scenario_id) || seen.has(verdict.scenario_id) || !OUTCOMES.has(verdict.outcome) || !CATEGORIES.has(verdict.primary_category) || typeof verdict.evaluator_id !== "string" || typeof verdict.evidence_note !== "string") throw new Error("interaction-validation.verdict-invalid");
    seen.add(verdict.scenario_id);
  }
  const eligible = verdicts.filter((entry) => entry.outcome !== "indeterminate");
  const success = eligible.filter((entry) => entry.outcome === "success").length;
  const failure = eligible.length - success;
  const rate = eligible.length ? success / eligible.length : null;
  const interval = wilson(success, eligible.length);
  const criticalRegressions = verdicts.filter((entry) => entry.critical_regression === true).length;
  const reasons = [];
  if (eligible.length < hypothesis.experiment.minimum_live_sample) reasons.push("live-sample-below-minimum");
  if (rate === null || rate < hypothesis.experiment.numeric_completion_target) reasons.push("completion-target-not-met");
  if (interval.lower === null || interval.lower <= hypothesis.diagnosis.baseline_episode_success_rate) reasons.push("uncertainty-does-not-clear-baseline");
  if (criticalRegressions > hypothesis.experiment.critical_regression_limit) reasons.push("critical-regression");
  const material = {
    schema_version: INTERACTION_VALIDATION_SCHEMA,
    cycle_id: hypothesis.cycle_id,
    hypothesis_id: hypothesis.hypothesis_id,
    hypothesis_digest: hypothesis.hypothesis_digest,
    run_digest: run_manifest.run_digest,
    evaluator_ids: [...new Set(verdicts.map((entry) => entry.evaluator_id))].sort(),
    counts: {prospective: verdicts.length, eligible: eligible.length, success, failure, indeterminate: verdicts.length - eligible.length, critical_regressions: criticalRegressions},
    episode_success_rate: rate,
    wilson_95: interval,
    historical_baseline_rate: hypothesis.diagnosis.baseline_episode_success_rate,
    target_rate: hypothesis.experiment.numeric_completion_target,
    disposition: reasons.length === 0 ? "candidate-supported" : "candidate-rejected",
    reason_codes: reasons,
    verdicts: verdicts.map((entry) => freeze(entry)).sort((left, right) => left.scenario_id.localeCompare(right.scenario_id)),
    claim_limit: "Bounded prospective synthetic interactions; no production activation or general-user effectiveness claim.",
    authority_effect: "none",
  };
  return sealed(material, "validation_digest");
}

export function materializeInteractionLearningPackage({baseline, hypothesis, offline_screen, validation}) {
  if (!validBaseline(baseline) || !verifyInteractionHypothesis(hypothesis) || !object(offline_screen) || offline_screen.schema_version !== INTERACTION_OFFLINE_SCREEN_SCHEMA || !HASH.test(offline_screen.screen_digest) || !object(validation) || validation.schema_version !== INTERACTION_VALIDATION_SCHEMA || !HASH.test(validation.validation_digest)) throw new Error("interaction-package.input-invalid");
  const {screen_digest, ...screenMaterial} = offline_screen;
  const {validation_digest, ...validationMaterial} = validation;
  if (digest(screenMaterial) !== screen_digest || offline_screen.disposition !== "screen-pass" || offline_screen.hypothesis_digest !== hypothesis.hypothesis_digest || digest(validationMaterial) !== validation_digest || validation.hypothesis_digest !== hypothesis.hypothesis_digest || hypothesis.diagnosis.baseline_digest !== baseline.baseline_digest) throw new Error("interaction-package.binding-invalid");
  const supported = validation.disposition === "candidate-supported";
  return sealed({
    schema_version: INTERACTION_LEARNING_PACKAGE_SCHEMA,
    cycle_id: hypothesis.cycle_id,
    package_id: `${hypothesis.hypothesis_id}:learning-package-v1`,
    lesson: supported ? "Use an explicit objective-transition checkpoint at ambiguous scope boundaries." : "The objective-transition checkpoint did not clear its prospective acceptance contract.",
    candidate_change: hypothesis.candidate,
    evidence_bundle: {baseline_digest: baseline.baseline_digest, hypothesis_digest: hypothesis.hypothesis_digest, offline_screen_digest: offline_screen.screen_digest, validation_digest: validation.validation_digest, run_digest: validation.run_digest},
    evaluator_verdict: validation.disposition,
    limitations: [validation.claim_limit, "Historical and prospective cohorts are not distribution-identical.", "Owner approval remains required for retention or activation."],
    decision: supported ? "eligible-for-owner-review" : "preserve-negative-result",
    rollback_binding: hypothesis.candidate.rollback,
    activation: "none",
    authority_effect: "none",
  }, "package_digest");
}

export function materializeInteractionOwnerDecision({learning_package, decision_ref}) {
  if (!object(learning_package) || learning_package.schema_version !== INTERACTION_LEARNING_PACKAGE_SCHEMA || !HASH.test(learning_package.package_digest)) throw new Error("interaction-owner-decision.package-invalid");
  const {package_digest, ...packageMaterial} = learning_package;
  if (digest(packageMaterial) !== package_digest || learning_package.decision !== "eligible-for-owner-review" || learning_package.evaluator_verdict !== "candidate-supported" || learning_package.activation !== "none") throw new Error("interaction-owner-decision.package-not-retainable");
  if (typeof decision_ref !== "string" || !/^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/.test(decision_ref)) throw new Error("interaction-owner-decision.ref-invalid");
  return sealed({
    schema_version: INTERACTION_OWNER_DECISION_SCHEMA,
    cycle_id: learning_package.cycle_id,
    decision_gate: "DG-IL-15",
    decision_ref,
    decision: "retain-supported-candidate",
    retained_package_id: learning_package.package_id,
    retained_package_digest: learning_package.package_digest,
    candidate_ref: learning_package.candidate_change.candidate_ref,
    cycle_status: "OBJECTIVE_CLOSED",
    activation: "none",
    successor_requirement: "Serving integration or activation requires a separately authorized engine-improvement or controlled-upgrade cycle.",
    authority_effect: "none",
  }, "decision_digest");
}
