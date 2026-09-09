import {
  canonicalizeJson,
  deepFreeze,
  digestValue,
  fail,
  isRecord,
  nonEmptyString,
  uniqueStrings,
} from "./canonical.mjs";

const SCHEMA_VERSION = "are.necessary-context-basis/v1";

export function constructNecessaryContextBasis(input) {
  if (!isRecord(input)) return fail("context-basis", ["basis.input-required"]);
  const reasons = [];
  if (!isRecord(input.request_context) || !nonEmptyString(input.request_context_digest)) reasons.push("basis.request-context-required");
  if (!isRecord(input.capability_selection) || input.capability_selection.kind !== "direct" || !isRecord(input.capability_selection.selected)) reasons.push("basis.direct-capability-required");
  if (!isRecord(input.definition_closure) || !nonEmptyString(input.definition_closure_digest)) reasons.push("basis.definition-closure-required");
  if (!isRecord(input.ontology_selector_lock) || !nonEmptyString(input.ontology_selector_lock_digest)) reasons.push("basis.ontology-lock-required");
  if (!nonEmptyString(input.authority_posture)) reasons.push("basis.authority-posture-required");
  if (!nonEmptyString(input.effect_posture)) reasons.push("basis.effect-posture-required");
  if (reasons.length > 0) return fail("context-basis", reasons);

  const value = canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    request: {
      request_id: input.request_context.request_id,
      digest: input.request_context_digest.trim(),
      raw_request: input.request_context.raw_request,
      objective_kind: input.request_context.objective_kind ?? null,
    },
    route_decision: {
      route_id: input.capability_selection.selected.route_id,
      capability_ref: input.capability_selection.selected.capability_ref,
      decision_digest: input.capability_selection.decision_digest,
      decision_profile_digest: input.capability_selection.decision_profile_digest,
    },
    definition_closure: {
      digest: input.definition_closure_digest.trim(),
      value: input.definition_closure,
    },
    ontology_selector_lock: {
      digest: input.ontology_selector_lock_digest.trim(),
      value: input.ontology_selector_lock,
    },
    authority_posture: input.authority_posture.trim(),
    effect_posture: input.effect_posture.trim(),
    constraints: uniqueStrings(input.constraints),
    exclusions: Array.isArray(input.exclusions) ? input.exclusions : [],
    contradictions: Array.isArray(input.contradictions) ? input.contradictions : [],
    gaps: Array.isArray(input.gaps) ? input.gaps : [],
    residue: Array.isArray(input.residue) ? input.residue : [],
    instructions: Array.isArray(input.instructions) ? input.instructions : [],
    supplemental_context_items: Array.isArray(input.supplemental_context_items) ? input.supplemental_context_items : [],
    authority_effect: "none",
  });
  return deepFreeze({schema_version: SCHEMA_VERSION, ok: true, value, digest: digestValue(value), authority_effect: "none"});
}
