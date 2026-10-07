import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {evolutionProtocolDigest} from "./protocol-v1.mjs";

export const VPS_FAMILY_PRELAUNCH_SCHEMA = "are.vps-family-prelaunch-state/v1";
const REQUIREMENTS = Object.freeze({
  contextbench: ["candidate_tests", "explicit_new_budgets", "historical_bindings", "independent_review"],
  "are-dsh": ["response_recovery_candidate", "native_subprocess", "glm_profile", "token_boundary", "durable_accounting", "benchmark_adapter"],
  longmemeval: ["full_history_source", "unexposed_cohort", "tokenizer_qualification", "confirmation_adapter", "comparison_decision", "cohort_and_budget_freeze"],
});
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));

export function deriveFamilyPrelaunchState({family, campaign_ref, prerequisites = {}, evidence_refs = []} = {}) {
  const required = REQUIREMENTS[family];
  if (!required || typeof campaign_ref !== "string" || campaign_ref.length === 0 || !object(prerequisites) || !Array.isArray(evidence_refs)) throw new TypeError("Prelaunch state input is invalid.");
  const missing = required.filter((key) => prerequisites[key] !== true);
  const material = canonicalizeJson({schema_version: VPS_FAMILY_PRELAUNCH_SCHEMA, family, campaign_ref, prerequisite_status: Object.fromEntries(required.map((key) => [key, prerequisites[key] === true])), missing_prerequisites: missing, evidence_refs: [...new Set(evidence_refs)].sort(), disposition: missing.length ? "blocked" : "provider-free-ready", live_dispatch_admitted: false, authority_effect: "none"});
  return freeze({...material, state_digest: evolutionProtocolDigest(material)});
}

export function verifyFamilyPrelaunchState(value) {
  const reasons = [];
  const allowed = new Set(["schema_version", "family", "campaign_ref", "prerequisite_status", "missing_prerequisites", "evidence_refs", "disposition", "live_dispatch_admitted", "authority_effect", "state_digest"]);
  if (!object(value) || Object.keys(value).some((key) => !allowed.has(key))) reasons.push("prelaunch.closed-shape-invalid");
  const required = REQUIREMENTS[value?.family];
  if (!required || !object(value?.prerequisite_status) || Object.keys(value.prerequisite_status).sort().join("|") !== [...required ?? []].sort().join("|")) reasons.push("prelaunch.prerequisites-invalid");
  const missing = required?.filter((key) => value.prerequisite_status[key] !== true) ?? [];
  if (JSON.stringify(value?.missing_prerequisites) !== JSON.stringify(missing) || value?.disposition !== (missing.length ? "blocked" : "provider-free-ready")) reasons.push("prelaunch.disposition-invalid");
  if (value?.live_dispatch_admitted !== false || value?.authority_effect !== "none") reasons.push("prelaunch.live-dispatch-must-remain-disabled");
  if (object(value)) { const material = canonicalizeJson({...value}); delete material.state_digest; if (value.state_digest !== evolutionProtocolDigest(material)) reasons.push("prelaunch.digest-invalid"); }
  return freeze({schema_version: "are.vps-prelaunch-validation/v1", ok: reasons.length === 0, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}
