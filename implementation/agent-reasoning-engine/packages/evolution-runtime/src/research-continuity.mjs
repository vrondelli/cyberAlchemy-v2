import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

export const RESEARCH_CONTINUITY_POLICY_SCHEMA = "are.research-continuity-policy/v1";
export const RESEARCH_CONTINUITY_BINDING_SCHEMA = "are.research-continuity-binding/v1";

const REQUIRED_BINDING_FIELDS = [
  "objective_refs", "objective_contribution", "method_refs", "method_definitions",
  "predecessor_refs", "question_and_hypotheses", "experiment_and_task_refs",
  "measurement_mapping", "acceptance_and_scope", "retained_counterevidence",
  "successor_rule", "continuity_review",
];
const REQUIRED_HYPOTHESIS_FIELDS = [
  "statement", "mechanism", "falsifier", "scope", "metrics", "provenance_refs",
  "experiment_template",
];
const text = value => typeof value === "string" && value.trim().length > 0;
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const bindingKey = binding => `${binding?.path ?? ""}@${binding?.sha256 ?? ""}`;

function exactBindings(value, field, reasons) {
  if (!Array.isArray(value) || value.length === 0) {
    reasons.push(`continuity.${field}-required`);
    return [];
  }
  const seen = new Set();
  return value.filter((item, index) => {
    const valid = object(item) && text(item.path) && /^[a-f0-9]{64}$/.test(item.sha256 ?? "");
    if (!valid) reasons.push(`continuity.${field}-invalid:${index}`);
    else if (seen.has(item.path)) reasons.push(`continuity.${field}-duplicate:${item.path}`);
    else seen.add(item.path);
    return valid;
  });
}

function requirePolicyBindings(actual, expected, field, reasons) {
  const keys = new Set(actual.map(bindingKey));
  for (const required of expected ?? []) {
    if (!keys.has(bindingKey(required))) reasons.push(`continuity.${field}-missing-policy-binding:${required.path}`);
  }
}

function verifyFiles(bindings, root, readBytes, field, reasons) {
  for (const binding of bindings) {
    try {
      const bytes = readBytes(resolve(root, binding.path));
      if (sha256(bytes) !== binding.sha256) reasons.push(`continuity.${field}-digest-drift:${binding.path}`);
    } catch {
      reasons.push(`continuity.${field}-unresolved:${binding.path}`);
    }
  }
}

/**
 * Return every continuity defect in one pass. Identity checks are deliberately
 * separate from the required human semantic verdicts in continuity_review.
 */
export function verifyResearchContinuity({binding, policy, hypotheses, phase = "final", root = ".", read_bytes = readFileSync} = {}) {
  const reasons = [];
  if (!object(policy) || policy.schema_version !== RESEARCH_CONTINUITY_POLICY_SCHEMA) reasons.push("continuity.policy-schema-invalid");
  if (!object(binding) || binding.schema_version !== RESEARCH_CONTINUITY_BINDING_SCHEMA) reasons.push("continuity.binding-schema-invalid");
  if (reasons.length) return {ok: false, phase, reason_codes: reasons, authority_effect: "none"};

  for (const field of REQUIRED_BINDING_FIELDS) {
    if (!(field in binding) || binding[field] === null || binding[field] === "") reasons.push(`continuity.binding-field-required:${field}`);
  }
  if (binding.authority_effect !== "none") reasons.push("continuity.authority-effect-invalid");
  if (binding.policy_ref !== policy.policy_ref || !/^[a-f0-9]{64}$/.test(binding.policy_sha256 ?? "")) reasons.push("continuity.policy-binding-mismatch");
  else verifyFiles([{path: binding.policy_ref, sha256: binding.policy_sha256}], root, read_bytes, "policy_ref", reasons);

  const objectiveRefs = exactBindings(binding.objective_refs, "objective_refs", reasons);
  const methodRefs = exactBindings(binding.method_refs, "method_refs", reasons);
  const predecessorRefs = exactBindings(binding.predecessor_refs, "predecessor_refs", reasons);
  const requiredObjectives = Object.values(policy.objective_levels ?? {}).flatMap(level => level.refs ?? []);
  requirePolicyBindings(objectiveRefs, requiredObjectives, "objective_refs", reasons);
  requirePolicyBindings(methodRefs, policy.method_refs, "method_refs", reasons);
  verifyFiles([...objectiveRefs, ...methodRefs, ...predecessorRefs], root, read_bytes, "source_ref", reasons);

  if (!text(binding.objective_contribution)) reasons.push("continuity.objective-contribution-required");
  for (const id of policy.required_method_definitions ?? []) {
    if (!binding.method_definitions?.includes(id)) reasons.push(`continuity.method-definition-missing:${id}`);
  }

  const q = binding.question_and_hypotheses;
  if (!object(q) || !text(q.question) || !text(q.records_ref) || !text(q.selected) || !Array.isArray(q.alternatives) || q.alternatives.length === 0) reasons.push("continuity.question-and-competing-hypotheses-invalid");
  if (!object(hypotheses) || !Array.isArray(hypotheses.records) || !object(hypotheses.selection)) reasons.push("continuity.hypotheses-document-invalid");
  else {
    const records = new Map(hypotheses.records.map(record => [record.record_id, record]));
    const selected = hypotheses.selection.selected;
    if (selected !== q?.selected || !records.has(selected)) reasons.push("continuity.selected-hypothesis-invalid");
    const alternatives = hypotheses.selection.alternatives ?? [];
    if (alternatives.length === 0 || alternatives.some(id => !records.has(id)) || alternatives.some(id => !(q?.alternatives ?? []).includes(id))) reasons.push("continuity.competing-hypotheses-invalid");
    for (const [id, record] of records) {
      for (const field of REQUIRED_HYPOTHESIS_FIELDS) {
        const value = record?.[field];
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) reasons.push(`continuity.hypothesis-field-required:${id}:${field}`);
      }
      if (!record?.provenance_refs?.includes(binding.binding_ref)) reasons.push(`continuity.hypothesis-continuity-ref-missing:${id}`);
      for (const term of policy.required_hypothesis_scope_terms ?? []) {
        if (!record?.scope?.includes(term)) reasons.push(`continuity.hypothesis-scope-term-missing:${id}:${term}`);
      }
      const contract = record?.continuity_contract;
      for (const field of policy.required_hypothesis_continuity_fields ?? []) {
        if (!text(contract?.[field])) reasons.push(`continuity.hypothesis-continuity-field-missing:${id}:${field}`);
      }
      const contractText = object(contract) ? Object.values(contract).filter(text).join("\n") : "";
      for (const marker of policy.required_hypothesis_continuity_markers ?? []) {
        if (!contractText.includes(marker)) reasons.push(`continuity.hypothesis-continuity-marker-missing:${id}:${marker}`);
      }
      for (const [field, expected] of Object.entries(policy.required_hypothesis_continuity_values ?? {})) {
        if (!text(expected) || contract?.[field] !== expected) reasons.push(`continuity.hypothesis-continuity-value-mismatch:${id}:${field}`);
      }
    }
  }

  const scope = binding.acceptance_and_scope;
  const acceptance = scope?.acceptance;
  if (!object(acceptance) || bindingKey(acceptance) !== bindingKey(policy.acceptance_ref)) reasons.push("continuity.acceptance-binding-mismatch");
  if (scope?.SWE_bench_in_active_scope !== policy.scope_invariants?.SWE_bench_in_active_scope) reasons.push("continuity.swe-bench-scope-drift");
  if (!text(scope?.window_order) || !/GLM/i.test(scope.window_order) || !/small/i.test(scope.window_order)) reasons.push("continuity.initial-glm-window-order-missing");
  if (!Array.isArray(binding.retained_counterevidence) || binding.retained_counterevidence.length === 0 || binding.retained_counterevidence.some(value => !text(value))) reasons.push("continuity.counterevidence-required");
  if (!text(binding.successor_rule)) reasons.push("continuity.successor-rule-required");
  for (const field of policy.required_measurement_fields ?? []) {
    if (!text(binding.measurement_mapping?.[field])) reasons.push(`continuity.measurement-field-missing:${field}`);
  }
  if (!/input/i.test(binding.measurement_mapping?.tokens ?? "") || !/output/i.test(binding.measurement_mapping?.tokens ?? "")) reasons.push("continuity.total-model-token-accounting-missing");

  const experiment = binding.experiment_and_task_refs;
  if (!object(experiment) || !text(experiment.plan_ref) || !Array.isArray(experiment.tasks) || experiment.tasks.length === 0) reasons.push("continuity.experiment-and-tasks-invalid");
  const reviewed = exactBindings(binding.continuity_review?.reviewed_artifacts, "reviewed_artifacts", reasons);
  const reviewedPlan = experiment?.plan_ref ? reviewed.find(item => item.path.endsWith(experiment.plan_ref)) : null;
  if (experiment?.plan_ref && !reviewedPlan) reasons.push("continuity.plan-not-reviewed");
  if (q?.records_ref && !reviewed.some(item => item.path.endsWith(q.records_ref))) reasons.push("continuity.hypotheses-not-reviewed");
  verifyFiles(reviewed, root, read_bytes, "reviewed_artifact", reasons);
  if (Array.isArray(policy.required_plan_markers) && policy.required_plan_markers.length > 0 && reviewedPlan) {
    let planText = "";
    try { planText = read_bytes(resolve(root, reviewedPlan.path)).toString("utf8"); }
    catch { reasons.push("continuity.plan-content-unresolved"); }
    for (const marker of policy.required_plan_markers) {
      if (!text(marker) || !planText.includes(marker)) reasons.push(`continuity.plan-marker-missing:${marker}`);
    }
  }

  const verdicts = binding.continuity_review?.criterion_verdicts;
  for (const criterion of policy.required_review_criteria ?? []) {
    if (!text(verdicts?.[criterion])) reasons.push(`continuity.review-verdict-missing:${criterion}`);
  }
  if (phase === "freeze") {
    if (binding.continuity_review?.passed_for_candidate_plan !== true && binding.continuity_review?.passed !== true) reasons.push("continuity.review-not-passed");
    if (binding.continuity_review?.run_ready !== true) reasons.push("continuity.run-not-ready");
    if (text(experiment?.unresolved)) reasons.push("continuity.freeze-has-unresolved-bindings");
  }
  return {ok: reasons.length === 0, phase, reason_codes: [...new Set(reasons)].sort(), checked_hypotheses: hypotheses?.records?.length ?? 0, authority_effect: "none"};
}
