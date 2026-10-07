import {canonicalJson, canonicalizeJson, deepFreeze, sha256HexText} from "../intent-route-resolver/index.mjs";

export const REASONING_PLAN_CONTEXT_SCHEMA = "are.reasoning-plan-context/v1";
const HEX = /^[0-9a-f]{64}$/;
const STATUS = new Set(["open", "active", "completed", "deferred"]);
const INPUT_KEYS = ["active_slice_id", "feature_obligations", "parent_plan_digest", "parent_plan_ref", "previous_plan_context_digest", "source_refs", "thread_ref", "unresolved_decisions"];
const RECORD_KEYS = [...INPUT_KEYS, "authority_effect", "identity_scope", "plan_context_digest", "schema_version"];

const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const bounded = (value, limit) => typeof value === "string" && value.trim() === value && value.length > 0 && Buffer.byteLength(value, "utf8") <= limit;
const digest = value => sha256HexText(canonicalJson(canonicalizeJson(value)));
const exactKeys = (value, keys) => record(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
const failure = reason_codes => deepFreeze({ok: false, stage: "plan-context", reason_codes: [...new Set(reason_codes)].sort(), authority_effect: "none"});

function shapeReasons(value, keys) {
  const reasons = [];
  if (!exactKeys(value, keys)) reasons.push("reasoning.plan-context-fields-invalid");
  if (!bounded(value?.thread_ref, 256)) reasons.push("reasoning.plan-context-thread-required");
  if (!bounded(value?.parent_plan_ref, 512) || !HEX.test(value?.parent_plan_digest ?? "")) reasons.push("reasoning.plan-context-parent-invalid");
  if (value?.previous_plan_context_digest !== null && !HEX.test(value?.previous_plan_context_digest ?? "")) reasons.push("reasoning.plan-context-predecessor-invalid");
  if (!bounded(value?.active_slice_id, 128)) reasons.push("reasoning.plan-context-active-slice-required");
  if (!Array.isArray(value?.source_refs) || value.source_refs.length < 1 || value.source_refs.length > 16
    || value.source_refs.some(item => !exactKeys(item, ["source_ref", "source_digest"]) || !bounded(item.source_ref, 512) || !HEX.test(item.source_digest ?? ""))
    || (Array.isArray(value.source_refs) && new Set(value.source_refs.map(item => item?.source_ref)).size !== value.source_refs.length)) {
    reasons.push("reasoning.plan-context-sources-invalid");
  }
  if (Array.isArray(value?.source_refs) && !value.source_refs.some(item => item?.source_ref === value.parent_plan_ref && item?.source_digest === value.parent_plan_digest)) {
    reasons.push("reasoning.plan-context-parent-source-missing");
  }
  if (!Array.isArray(value?.feature_obligations) || value.feature_obligations.length < 1 || value.feature_obligations.length > 32
    || value.feature_obligations.some(item => !exactKeys(item, ["obligation_id", "summary", "status"])
      || !bounded(item.obligation_id, 128) || !bounded(item.summary, 320) || !STATUS.has(item.status))
    || (Array.isArray(value.feature_obligations) && new Set(value.feature_obligations.map(item => item?.obligation_id)).size !== value.feature_obligations.length)) {
    reasons.push("reasoning.plan-context-obligations-invalid");
  }
  if (Array.isArray(value?.feature_obligations) && !value.feature_obligations.some(item => item?.obligation_id === value.active_slice_id && item?.status !== "completed")) {
    reasons.push("reasoning.plan-context-active-slice-unbound");
  }
  if (!Array.isArray(value?.unresolved_decisions) || value.unresolved_decisions.length > 32
    || value.unresolved_decisions.some(item => !exactKeys(item, ["decision_id", "question"])
      || !bounded(item.decision_id, 128) || !bounded(item.question, 320))
    || (Array.isArray(value.unresolved_decisions) && new Set(value.unresolved_decisions.map(item => item?.decision_id)).size !== value.unresolved_decisions.length)) {
    reasons.push("reasoning.plan-context-decisions-invalid");
  }
  try {
    if (Buffer.byteLength(canonicalJson(canonicalizeJson(value)), "utf8") > 16_384) reasons.push("reasoning.plan-context-oversize");
  } catch { reasons.push("reasoning.plan-context-noncanonical"); }
  return reasons;
}

export function materializeReasoningPlanContext(input, {expected_thread_ref, source_digests} = {}) {
  const reasons = shapeReasons(input, INPUT_KEYS);
  if (!bounded(expected_thread_ref, 256) || input?.thread_ref !== expected_thread_ref) reasons.push("reasoning.plan-context-thread-mismatch");
  if (!record(source_digests) || !Array.isArray(input?.source_refs)
    || input.source_refs.some(item => !record(item) || !Object.hasOwn(source_digests, item.source_ref) || source_digests[item.source_ref] !== item.source_digest)) {
    reasons.push("reasoning.plan-context-source-unverified");
  }
  if (reasons.length) return failure(reasons);
  const material = canonicalizeJson({...input, schema_version: REASONING_PLAN_CONTEXT_SCHEMA, identity_scope: "backend-thread", authority_effect: "none"});
  const value = deepFreeze({...material, plan_context_digest: digest(material)});
  return deepFreeze({ok: true, value, digest: value.plan_context_digest, authority_effect: "none"});
}

export function verifyReasoningPlanContext(value) {
  const reasons = shapeReasons(value, RECORD_KEYS);
  if (value?.schema_version !== REASONING_PLAN_CONTEXT_SCHEMA || value?.identity_scope !== "backend-thread" || value?.authority_effect !== "none") {
    reasons.push("reasoning.plan-context-schema-invalid");
  }
  if (!HEX.test(value?.plan_context_digest ?? "")) reasons.push("reasoning.plan-context-digest-invalid");
  else {
    const {plan_context_digest: _digest, ...material} = value;
    try { if (digest(material) !== value.plan_context_digest) reasons.push("reasoning.plan-context-digest-invalid"); }
    catch { reasons.push("reasoning.plan-context-digest-invalid"); }
  }
  return reasons.length ? failure(reasons) : deepFreeze({ok: true, value, digest: value.plan_context_digest, authority_effect: "none"});
}
