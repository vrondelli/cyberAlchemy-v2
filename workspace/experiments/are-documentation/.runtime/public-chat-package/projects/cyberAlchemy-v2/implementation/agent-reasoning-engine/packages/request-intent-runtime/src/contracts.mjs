import {canonicalize, deepFreeze, digest, failure, isRecord, sealed, success, text, uniqueText, verifyDigest} from "./canonical.mjs";

export const INTENT_CONTRACT_SCHEMA = "are.intent-contract/v1";
export const INTENT_CANDIDATE_SCHEMA = "are.intent-candidate/v1";
export const INTENT_COMPILATION_SCHEMA = "are.intent-compilation/v1";
export const INTENT_REALIZATION_ASSESSMENT_SCHEMA = "are.intent-realization-assessment/v1";
export const CORRECTION_CANDIDATE_SCHEMA = "are.correction-candidate/v1";
export const INTENT_REFLECTION_SCHEMA = "are.intent-reflection/v1";
export const INSPECTION_PROJECTION_SCHEMA = "are.inspection-projection/v1";
export const USER_CONTROL_PROFILE_SCHEMA = "are.user-control-profile/v1";
export const REFLECTION_DISPOSITION_SCHEMA = "are.reflection-disposition/v1";
export const INTENT_CONTROL_RECEIPT_SCHEMA = "are.intent-control-receipt/v1";

const DISPOSITIONS = new Set(["act", "ask", "block", "correct-premise"]);
const DIRECTIVE_POSTURES = new Set(["structural", "surface", "example", "constraint", "reference", "authorization"]);
const MODES = new Set(["quiet", "explain", "inspect", "control"]);
const RETENTION_SCOPES = new Set(["none", "current-interaction", "current-product", "engine-candidate"]);

function normalizeDirective(value) {
  if (!isRecord(value) || !text(value.instruction) || !DIRECTIVE_POSTURES.has(value.posture) || typeof value.render_verbatim !== "boolean") throw new TypeError("Invalid construction directive.");
  return {instruction: value.instruction.trim(), posture: value.posture, render_verbatim: value.render_verbatim, source_ref: text(value.source_ref) ? value.source_ref.trim() : null};
}

function normalizeBindings(value = {}) {
  if (!isRecord(value)) throw new TypeError("Referent bindings must be an object.");
  return Object.fromEntries(Object.entries(value).filter(([key, target]) => text(key) && text(target)).map(([key, target]) => [key.trim(), target.trim()]).sort(([a], [b]) => a.localeCompare(b)));
}

export function materializeIntentContract(input) {
  if (!isRecord(input) || !text(input.request_ref) || !text(input.request_digest) || !text(input.objective) || !text(input.target) || !DISPOSITIONS.has(input.disposition)) throw new TypeError("Intent Contract requires request identity, objective, target, and disposition.");
  const fields = {
    request_ref: input.request_ref.trim(),
    request_digest: input.request_digest.trim(),
    context_envelope_digest: text(input.context_envelope_digest) ? input.context_envelope_digest.trim() : null,
    reasoning_epoch_digest: text(input.reasoning_epoch_digest) ? input.reasoning_epoch_digest.trim() : null,
    objective: input.objective.trim(),
    target: input.target.trim(),
    construction_directives: (input.construction_directives ?? []).map(normalizeDirective).sort((a, b) => `${a.posture}:${a.instruction}`.localeCompare(`${b.posture}:${b.instruction}`)),
    surface_requirements: uniqueText(input.surface_requirements),
    surface_prohibitions: uniqueText(input.surface_prohibitions),
    referent_bindings: normalizeBindings(input.referent_bindings),
    assumptions: uniqueText(input.assumptions),
    unresolved_questions: uniqueText(input.unresolved_questions),
    risk_projections: uniqueText(input.risk_projections),
    disposition: input.disposition,
    route_candidate: text(input.route_candidate) ? input.route_candidate.trim() : null,
    confidence: Number.isFinite(input.confidence) ? input.confidence : null,
    source_refs: uniqueText(input.source_refs),
    predecessor_contract_digest: text(input.predecessor_contract_digest) ? input.predecessor_contract_digest.trim() : null,
  };
  if (fields.disposition === "ask" && fields.unresolved_questions.length === 0) throw new TypeError("Ask disposition requires an unresolved question.");
  return sealed(INTENT_CONTRACT_SCHEMA, fields, "intent_contract_digest");
}

export function verifyIntentContract(contract) {
  const reasons = [];
  if (!isRecord(contract) || contract.schema_version !== INTENT_CONTRACT_SCHEMA) reasons.push("intent.contract-schema-invalid");
  if (!text(contract?.request_ref) || !text(contract?.request_digest) || !text(contract?.objective) || !text(contract?.target)) reasons.push("intent.contract-fields-invalid");
  if (!DISPOSITIONS.has(contract?.disposition)) reasons.push("intent.contract-disposition-invalid");
  if (!Array.isArray(contract?.construction_directives) || contract.construction_directives.some((value) => {
    try { normalizeDirective(value); return false; } catch { return true; }
  })) reasons.push("intent.contract-directives-invalid");
  for (const key of ["surface_requirements", "surface_prohibitions", "assumptions", "unresolved_questions", "risk_projections", "source_refs"]) if (!Array.isArray(contract?.[key])) reasons.push(`intent.contract-${key.replaceAll("_", "-")}-invalid`);
  if (contract?.authority_effect !== "none") reasons.push("intent.contract-authority-invalid");
  if (!verifyDigest(contract, "intent_contract_digest")) reasons.push("intent.contract-digest-invalid");
  return reasons.length > 0 ? failure("intent-contract-verification", reasons) : success("intent-contract-verification", contract);
}

export function materializeUserControlProfile(input = {}) {
  const visibility = input.visibility ?? "quiet";
  const retention = input.correction_retention ?? "current-interaction";
  if (!MODES.has(visibility) || !RETENTION_SCOPES.has(retention)) throw new TypeError("Invalid user control profile.");
  return sealed(USER_CONTROL_PROFILE_SCHEMA, {
    profile_id: text(input.profile_id) ? input.profile_id.trim() : "are:user-control:default",
    visibility,
    show_route: input.show_route === true,
    show_assumptions: input.show_assumptions ?? "when-material",
    show_context_sources: input.show_context_sources ?? "on-request",
    show_reflections: input.show_reflections ?? "when-correction-detected",
    pause_on: uniqueText(input.pause_on ?? ["consequential-ambiguity", "irreversible-effect"]),
    correction_retention: retention,
    benchmark_generation: input.benchmark_generation ?? "ask",
    automatic_improvement_adoption: false,
  }, "control_profile_digest");
}

export function verifyUserControlProfile(profile) {
  const reasons = [];
  if (profile?.schema_version !== USER_CONTROL_PROFILE_SCHEMA || !MODES.has(profile?.visibility) || !RETENTION_SCOPES.has(profile?.correction_retention)) reasons.push("intent.control-profile-invalid");
  if (profile?.automatic_improvement_adoption !== false || profile?.authority_effect !== "none") reasons.push("intent.control-profile-authority-invalid");
  if (!verifyDigest(profile, "control_profile_digest")) reasons.push("intent.control-profile-digest-invalid");
  return reasons.length ? failure("control-profile-verification", reasons) : success("control-profile-verification", profile);
}

export function assessIntentRealization(contract, observation = {}) {
  const verified = verifyIntentContract(contract);
  if (!verified.ok) return failure("intent-realization-assessment", verified.reason_codes);
  if (!isRecord(observation)) return failure("intent-realization-assessment", ["intent.realization-observation-required"]);
  const surface = typeof observation.surface_text === "string" ? observation.surface_text : "";
  const normalized = surface.toLocaleLowerCase();
  const missing = (observation.required_tokens ?? []).filter((token) => text(token) && !normalized.includes(token.toLocaleLowerCase()));
  const leaked = contract.surface_prohibitions.filter((token) => normalized.includes(token.toLocaleLowerCase()));
  const observedRisks = uniqueText(observation.observed_risks);
  const riskViolations = contract.risk_projections.filter((risk) => observedRisks.includes(risk));
  const violations = [
    ...missing.map((value) => ({kind: "required-surface-missing", value})),
    ...leaked.map((value) => ({kind: "prohibited-surface-observed", value})),
    ...riskViolations.map((value) => ({kind: "projected-risk-realized", value})),
  ];
  const fields = {intent_contract_digest: contract.intent_contract_digest, observation_digest: digest(canonicalize(observation)), disposition: violations.length ? "mismatch" : "satisfied", violations, observed_surface_digest: digest(surface)};
  return success("intent-realization-assessment", sealed(INTENT_REALIZATION_ASSESSMENT_SCHEMA, fields, "assessment_digest"));
}

export const intentEnums = deepFreeze({dispositions: [...DISPOSITIONS], directive_postures: [...DIRECTIVE_POSTURES], modes: [...MODES], retention_scopes: [...RETENTION_SCOPES]});
