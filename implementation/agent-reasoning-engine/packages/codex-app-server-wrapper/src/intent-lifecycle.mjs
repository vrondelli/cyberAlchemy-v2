import {
  compileRequestIntent,
  detectCorrection,
  materializeIntentReflection,
  materializeUserControlProfile,
  projectIntentInspection,
} from "../../request-intent-runtime/index.mjs";
import {canonicalJson, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const INTENT_CONTEXT_KEY = "cyberalchemy.are.request-intent";
export const CODEX_INTENT_LIFECYCLE_SCHEMA = "are.codex-intent-lifecycle/v1";

function requestText(message) {
  return (Array.isArray(message?.params?.input) ? message.params.input : [])
    .filter((item) => isRecord(item) && item.type === "text" && nonEmptyString(item.text))
    .map((item) => item.text.trim())
    .join("\n");
}

function result(fields) {
  return freezeResult({schema_version: CODEX_INTENT_LIFECYCLE_SCHEMA, ...fields, authority_effect: "none"});
}

export async function prepareCodexIntentLifecycle(input = {}) {
  const configuration = isRecord(input.configuration) ? input.configuration : {enabled: false};
  if (configuration.enabled !== true) return result({ok: true, disposition: "disabled", provider_calls: 0, intent_contract: null, reflection: null, inspection: null});
  const request = requestText(input.message);
  if (!request || !nonEmptyString(input.request_ref)) return result({ok: false, disposition: "blocked", reason_codes: ["intent.codex-request-invalid"], provider_calls: 0, intent_contract: null, reflection: null, inspection: null});
  let correction = null;
  if (isRecord(input.previous_contract)) {
    const detected = await detectCorrection({request, request_ref: input.request_ref, previous_contract: input.previous_contract}, input.correction_provider);
    if (!detected.ok) return result({ok: false, disposition: "blocked", reason_codes: detected.reason_codes, provider_calls: detected.provider_calls ?? 0, intent_contract: null, reflection: null, inspection: null});
    correction = detected.value;
  }
  const compiled = await compileRequestIntent({
    request,
    request_ref: input.request_ref,
    objective_hint: input.objective_resolution?.next_state?.active_objective?.description,
    context_envelope_digest: input.context_envelope_digest,
    reasoning_epoch_digest: input.reasoning_epoch_digest,
    predecessor_contract_digest: correction ? input.previous_contract.intent_contract_digest : null,
    route_candidate: input.route_candidate,
    source_refs: input.source_refs,
  }, input.intent_provider);
  if (!compiled.ok) return result({ok: false, disposition: "blocked", reason_codes: compiled.reason_codes, provider_calls: compiled.provider_calls ?? 0, intent_contract: null, reflection: null, inspection: null});
  if (input.objective_resolution && compiled.value.contract.objective !== input.objective_resolution.next_state.active_objective.description) return result({ok: false, disposition: "blocked", reason_codes: ["intent.resolved-objective-mismatch"], provider_calls: compiled.value.provider_calls, intent_contract: null, reflection: null, inspection: null});
  let reflection = null;
  if (correction) {
    reflection = materializeIntentReflection({
      correction_candidate: correction,
      previous_contract: input.previous_contract,
      corrected_contract: compiled.value.contract,
      causal_analysis: ["The successor request explicitly corrected the preceding interpreted intent."],
      proposed_scope: configuration.control_profile?.correction_retention ?? "current-interaction",
      provenance_refs: [`request:${input.request_ref}`],
    });
  }
  let controlProfile;
  try { controlProfile = materializeUserControlProfile(configuration.control_profile ?? {}); }
  catch { return result({ok: false, disposition: "blocked", reason_codes: ["intent.codex-control-profile-invalid"], provider_calls: compiled.value.provider_calls, intent_contract: null, reflection: null, inspection: null}); }
  const inspected = projectIntentInspection({contract: compiled.value.contract, control_profile: controlProfile, reflection});
  if (!inspected.ok) return result({ok: false, disposition: "blocked", reason_codes: inspected.reason_codes, provider_calls: compiled.value.provider_calls, intent_contract: null, reflection: null, inspection: null});
  return result({ok: true, disposition: correction ? "corrected" : "compiled", provider_calls: compiled.value.provider_calls, intent_contract: compiled.value.contract, reflection, inspection: inspected.value, control_profile_digest: controlProfile.control_profile_digest, reason_codes: []});
}

export function addIntentLifecycleContext(message, lifecycle) {
  if (!lifecycle || lifecycle.disposition === "disabled") return message;
  const params = isRecord(message?.params) ? message.params : {};
  const additionalContext = isRecord(params.additionalContext) ? params.additionalContext : {};
  return freezeResult({...message, params: {...params, additionalContext: {...additionalContext, [INTENT_CONTEXT_KEY]: {kind: "application", value: canonicalJson({schema_version: "are.codex-intent-fragment/v1", intent_contract: lifecycle.intent_contract, inspection: lifecycle.inspection, reflection: lifecycle.reflection, authority_effect: "none"})}}}});
}
