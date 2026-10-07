import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {verifyBenchmarkCampaign} from "./vps-benchmark-protocol-v1.mjs";

const HASH = /^[a-f0-9]{64}$/;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));

function verdict(family, reasons) {
  return freeze({schema_version: "are.benchmark-family-validation/v1", family, ok: reasons.length === 0, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}

function common(campaign, family) {
  const checked = verifyBenchmarkCampaign(campaign);
  const reasons = checked.ok ? [] : checked.reason_codes;
  if (campaign?.family !== family) reasons.push("benchmark-family.family-mismatch");
  return reasons;
}

export function validateContextBenchCampaign(campaign) {
  const reasons = common(campaign, "contextbench");
  const policy = campaign?.family_policy;
  if (!object(policy) || policy.candidate_only !== true || policy.context_window !== 8000) reasons.push("contextbench.posture-invalid");
  if (!Array.isArray(policy?.task_ids) || policy.task_ids.length !== 2 || new Set(policy.task_ids).size !== 2 || policy.task_ids[0] !== 1 || policy.task_ids[1] !== 4) reasons.push("contextbench.tasks-invalid");
  if (!Array.isArray(policy?.historical_comparison_hashes) || policy.historical_comparison_hashes.length === 0 || policy.historical_comparison_hashes.some((hash) => !HASH.test(hash))) reasons.push("contextbench.historical-binding-invalid");
  if (policy?.thresholds?.task_1_span_f1_gt !== 0 || policy?.thresholds?.mean_span_f1_gt !== 0.07327183777122158 || policy?.thresholds?.task_4_span_f1_gte !== 0.12654367554244316) reasons.push("contextbench.thresholds-invalid");
  if (policy?.explicit_new_budgets !== true) reasons.push("contextbench.explicit-budgets-required");
  return verdict("contextbench", reasons);
}

export function validateAreDshCampaign(campaign) {
  const reasons = common(campaign, "are-dsh");
  const policy = campaign?.family_policy;
  const mode = policy?.campaign_mode;
  if (!object(policy) || policy.output_token_cap !== 8192 || policy.executed_tool_call_ceiling !== 8) reasons.push("are-dsh.envelope-invalid");
  if (!["request", "campaign", "arm"].includes(policy?.timer_scope)) reasons.push("are-dsh.timer-scope-invalid");
  if (!["are-only-qualification", "matched-confirmation"].includes(mode)) reasons.push("are-dsh.campaign-mode-invalid");
  if (typeof policy?.response_recovery_candidate !== "boolean") reasons.push("are-dsh.response-recovery-posture-invalid");
  if (mode !== "are-only-qualification" && policy?.benchmark_ready !== true) reasons.push("are-dsh.benchmark-not-ready");
  if (mode === "are-only-qualification") {
    if (policy?.matched_comparison !== false || policy?.benchmark_ready !== false) reasons.push("are-dsh.are-only-posture-invalid");
    if (policy?.response_recovery_candidate !== true) reasons.push("are-dsh.response-recovery-candidate-incomplete");
  }
  if (mode === "matched-confirmation") {
    if (policy?.matched_comparison !== true) reasons.push("are-dsh.matched-comparison-required");
    if (!["native_subprocess", "glm_profile", "token_boundary", "durable_accounting", "benchmark_adapter"].every((key) => policy?.qualifications?.[key] === true)) reasons.push("are-dsh.qualification-incomplete");
    if (policy?.benchmark_ready !== true) reasons.push("are-dsh.benchmark-not-ready");
    if (policy?.response_recovery_candidate !== true) reasons.push("are-dsh.response-recovery-candidate-incomplete");
  }
  return verdict("are-dsh", reasons);
}

export function validateLongMemEvalCampaign(campaign) {
  const reasons = common(campaign, "longmemeval");
  const policy = campaign?.family_policy;
  if (!object(policy) || policy.full_history_source_pinned !== true || policy.source_only_manifest !== true || policy.unexposed_cohort !== true || policy.exposed_ids_excluded !== true) reasons.push("longmemeval.source-boundary-invalid");
  if (policy?.original_history_tokenizer_qualified !== true || policy?.sealed_evaluator !== true || policy?.confirmation_adapter !== true) reasons.push("longmemeval.adapter-or-evaluator-incomplete");
  if (!Number.isSafeInteger(policy?.paired_task_denominator) || policy.paired_task_denominator < 1 || policy?.comparison_decided !== true || policy?.explicit_budgets !== true) reasons.push("longmemeval.comparison-or-budget-incomplete");
  return verdict("longmemeval", reasons);
}

export function createBenchmarkFamilyValidators() {
  return Object.freeze({contextbench: validateContextBenchCampaign, "are-dsh": validateAreDshCampaign, longmemeval: validateLongMemEvalCampaign});
}
