import {digest, failure, isRecord, sealed, success, text, uniqueText} from "./canonical.mjs";
import {CORRECTION_CANDIDATE_SCHEMA, INTENT_REFLECTION_SCHEMA, REFLECTION_DISPOSITION_SCHEMA, materializeIntentContract, verifyIntentContract} from "./contracts.mjs";

const CLASSES = new Set(["misinterpretation", "omitted-constraint", "wrong-referent", "unsafe-assumption", "execution-defect", "new-preference", "changed-mind", "environment-drift"]);
const ELIGIBLE = new Set(["misinterpretation", "omitted-constraint", "wrong-referent", "unsafe-assumption"]);
const SCOPES = new Set(["none", "current-interaction", "current-product", "engine-candidate"]);

function inferClass(request) {
  const value = request.toLocaleLowerCase();
  if (/not\s+in\s+the\s+button|wrong (?:place|target)|i meant .* (?:text|narrative)/.test(value)) return "wrong-referent";
  if (/too literal|not what i meant|misunderst|meta.?label/.test(value)) return "misinterpretation";
  if (/forgot|missing|also must|didn.t include/.test(value)) return "omitted-constraint";
  if (/actually|changed my mind|instead now/.test(value)) return "changed-mind";
  if (/server|environment|stale|restarted|not rendering/.test(value)) return "environment-drift";
  return null;
}

export async function detectCorrection(input = {}, provider = null) {
  if (!isRecord(input) || !text(input.request) || !text(input.request_ref) || !isRecord(input.previous_contract)) return failure("correction-detection", ["intent.correction-input-invalid"]);
  const verified = verifyIntentContract(input.previous_contract);
  if (!verified.ok) return failure("correction-detection", verified.reason_codes);
  let classification = inferClass(input.request);
  let providerCalls = 0;
  if (!classification && typeof provider === "function") {
    providerCalls = 1;
    try { classification = await provider(Object.freeze({...input, authority_effect: "none"})); } catch { return failure("correction-detection", ["intent.correction-provider-failed"]); }
  }
  if (classification === null || classification === false || classification === "none") return success("correction-detection", null, {disposition: "not-detected", provider_calls: providerCalls});
  const kind = isRecord(classification) ? classification.kind : classification;
  if (!CLASSES.has(kind)) return failure("correction-detection", ["intent.correction-class-invalid"]);
  const fields = {
    request_ref: input.request_ref.trim(),
    request_digest: digest(input.request),
    previous_intent_contract_digest: input.previous_contract.intent_contract_digest,
    correction_kind: kind,
    evidence: uniqueText(isRecord(classification) ? classification.evidence : [input.request.trim()]),
    rejected_interpretation: isRecord(classification) && text(classification.rejected_interpretation) ? classification.rejected_interpretation.trim() : null,
    corrected_interpretation: isRecord(classification) && text(classification.corrected_interpretation) ? classification.corrected_interpretation.trim() : input.request.trim(),
    confidence: isRecord(classification) && Number.isFinite(classification.confidence) ? classification.confidence : 0.95,
    provider_calls: providerCalls,
  };
  return success("correction-detection", sealed(CORRECTION_CANDIDATE_SCHEMA, fields, "correction_digest"), {disposition: "detected", provider_calls: providerCalls});
}

export function materializeIntentReflection(input = {}) {
  const candidate = input.correction_candidate;
  if (!isRecord(candidate) || candidate.schema_version !== CORRECTION_CANDIDATE_SCHEMA || !text(candidate.correction_digest) || !CLASSES.has(candidate.correction_kind)) throw new TypeError("Valid correction candidate required.");
  const previous = input.previous_contract;
  const corrected = input.corrected_contract;
  if (!verifyIntentContract(previous).ok || !verifyIntentContract(corrected).ok || corrected.predecessor_contract_digest !== previous.intent_contract_digest) throw new TypeError("Reflection requires an exact successor Intent Contract.");
  return sealed(INTENT_REFLECTION_SCHEMA, {
    correction_digest: candidate.correction_digest,
    previous_intent_contract_digest: previous.intent_contract_digest,
    corrected_intent_contract_digest: corrected.intent_contract_digest,
    correction_kind: candidate.correction_kind,
    causal_analysis: uniqueText(input.causal_analysis),
    immediate_repair: input.immediate_repair !== false,
    proposed_scope: SCOPES.has(input.proposed_scope) ? input.proposed_scope : "current-interaction",
    improvement_eligible: ELIGIBLE.has(candidate.correction_kind),
    benchmark_candidate: isRecord(input.benchmark_candidate) ? input.benchmark_candidate : null,
    provenance_refs: uniqueText(input.provenance_refs),
  }, "reflection_digest");
}

export function applyReflectionDisposition(reflection, input = {}) {
  if (reflection?.schema_version !== INTENT_REFLECTION_SCHEMA || !text(reflection?.reflection_digest)) return failure("reflection-disposition", ["intent.reflection-invalid"]);
  const retentionScope = input.retention_scope ?? reflection.proposed_scope;
  if (!SCOPES.has(retentionScope)) return failure("reflection-disposition", ["intent.reflection-retention-invalid"]);
  if (input.benchmark_generation === true && retentionScope !== "engine-candidate") return failure("reflection-disposition", ["intent.benchmark-requires-engine-candidate-scope"]);
  const record = sealed(REFLECTION_DISPOSITION_SCHEMA, {
    reflection_digest: reflection.reflection_digest,
    immediate_repair: input.immediate_repair !== false,
    retention_scope: retentionScope,
    benchmark_generation: input.benchmark_generation === true,
    classification_override: CLASSES.has(input.classification_override) ? input.classification_override : null,
    user_selected: input.user_selected === true,
  }, "disposition_digest");
  return success("reflection-disposition", record);
}

export function toImprovementSignalCandidate(reflection, disposition) {
  if (reflection?.schema_version !== INTENT_REFLECTION_SCHEMA || disposition?.schema_version !== REFLECTION_DISPOSITION_SCHEMA || disposition.reflection_digest !== reflection.reflection_digest) return failure("reflection-improvement-projection", ["intent.reflection-disposition-binding-invalid"]);
  if (!reflection.improvement_eligible || disposition.retention_scope !== "engine-candidate" || disposition.benchmark_generation !== true || disposition.user_selected !== true) return success("reflection-improvement-projection", null, {disposition: "not-selected"});
  return success("reflection-improvement-projection", Object.freeze({kind: `intent.${disposition.classification_override ?? reflection.correction_kind}`, scope: "request-intent-runtime", observed_value: "correction-observed", expected_value: "intent-realization-satisfied", metric: "intent_alignment", provenance_refs: [`intent-reflection:${reflection.reflection_digest}`, `reflection-disposition:${disposition.disposition_digest}`], confidence: 1}));
}

export function createCorrectedIntentContract(previous, overrides = {}) {
  if (!verifyIntentContract(previous).ok) throw new TypeError("Valid predecessor contract required.");
  const {schema_version: _schema, intent_contract_digest: _digest, authority_effect: _authority, ...fields} = previous;
  return materializeIntentContract({...fields, ...overrides, predecessor_contract_digest: previous.intent_contract_digest});
}
