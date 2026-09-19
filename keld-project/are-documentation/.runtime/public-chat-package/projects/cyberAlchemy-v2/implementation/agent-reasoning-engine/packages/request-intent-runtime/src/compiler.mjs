import {digest, failure, isRecord, sealed, success, text, uniqueText} from "./canonical.mjs";
import {INTENT_CANDIDATE_SCHEMA, INTENT_COMPILATION_SCHEMA, materializeIntentContract} from "./contracts.mjs";

function phrase(request, expression) {
  return expression.test(request.toLocaleLowerCase());
}

function fastCandidate(input) {
  const request = input.request.trim();
  const lower = request.toLocaleLowerCase();
  const explicitlyVisibleLabels = phrase(request, /(?:visible|visibly|render|show|display).{0,30}(?:label|section|heading)|(?:label(?:led)?|named)\s+(?:definition|example|deeper)/);
  const rhetoricalSequence = phrase(request, /start\s+with\s+(?:a\s+)?definition.{0,80}(?:then\s+)?(?:an?\s+)?example.{0,80}(?:deeper|technical|detail)/);
  const copyContext = phrase(request, /copy|copywriting|narrative|homepage|interface|ux|whole text/);
  const structural = rhetoricalSequence && copyContext && !explicitlyVisibleLabels;
  const wrongAttachmentCorrection = phrase(request, /not\s+in\s+the\s+button.{0,60}(?:in|inside|part\s+of)\s+the\s+(?:text|narrative)/);
  const correction = phrase(request, /too literal|not what i meant|misunderst|remove (?:those|the) labels?|not in the button/);
  const directives = [];
  if (rhetoricalSequence || explicitlyVisibleLabels) directives.push({instruction: "definition, example, deeper look", posture: structural ? "structural" : "surface", render_verbatim: !structural, source_ref: input.request_ref});
  const surfaceRequirements = [];
  const surfaceProhibitions = [];
  const risks = [];
  if (structural) {
    surfaceRequirements.push("continuous natural narrative");
    surfaceProhibitions.push("Definition", "Example", "Deeper look");
    risks.push("content-clustering", "hierarchy-collision", "meta-instruction-leakage", "repetition");
  }
  if (wrongAttachmentCorrection) surfaceRequirements.push("Knowledge Expansion Protocol appears as an inline narrative link");
  const referents = wrongAttachmentCorrection ? {"the button": "primary exchange action", "the text": "homepage narrative", "it": "Knowledge Expansion Protocol phrase"} : {};
  let target = text(input.target_hint) ? input.target_hint.trim() : (copyContext ? "user-facing narrative" : "requested work product");
  let objective = text(input.objective_hint) ? input.objective_hint.trim() : request.split(/[.!?\n]/).find(text)?.trim() ?? request;
  if (wrongAttachmentCorrection) {
    target = "homepage narrative";
    objective = "Place the requested protocol link in the narrative while preserving the button";
  }
  return {
    schema_version: INTENT_CANDIDATE_SCHEMA,
    objective,
    target,
    construction_directives: directives,
    surface_requirements: surfaceRequirements,
    surface_prohibitions: surfaceProhibitions,
    referent_bindings: referents,
    assumptions: [],
    unresolved_questions: [],
    risk_projections: risks,
    disposition: "act",
    route_candidate: text(input.route_candidate) ? input.route_candidate.trim() : null,
    confidence: structural || explicitlyVisibleLabels || wrongAttachmentCorrection ? 0.98 : 0.65,
    source_refs: uniqueText(input.source_refs),
    correction_signal: correction,
    authority_effect: "none",
  };
}

function candidateValid(candidate) {
  return isRecord(candidate) && text(candidate.objective) && text(candidate.target) && ["act", "ask", "block", "correct-premise"].includes(candidate.disposition);
}

export async function compileRequestIntent(input = {}, provider = null) {
  if (!isRecord(input) || !text(input.request) || !text(input.request_ref)) return failure("intent-compilation", ["intent.request-and-ref-required"]);
  const requestDigest = digest(input.request);
  let candidate;
  let providerCalls = 0;
  let path = "deterministic-fast-path";
  if (typeof provider === "function") {
    providerCalls = 1;
    path = "structured-provider";
    try { candidate = await provider(Object.freeze({...input, request_digest: requestDigest, authority_effect: "none"})); }
    catch { return failure("intent-compilation", ["intent.provider-failed"]); }
    if (!candidateValid(candidate)) return failure("intent-compilation", ["intent.provider-candidate-invalid"]);
  } else candidate = fastCandidate(input);
  let contract;
  try {
    contract = materializeIntentContract({...candidate, request_ref: input.request_ref, request_digest: requestDigest, context_envelope_digest: input.context_envelope_digest, reasoning_epoch_digest: input.reasoning_epoch_digest, predecessor_contract_digest: input.predecessor_contract_digest});
  } catch {
    return failure("intent-compilation", ["intent.candidate-materialization-failed"]);
  }
  const compilation = sealed(INTENT_COMPILATION_SCHEMA, {request_ref: input.request_ref.trim(), request_digest: requestDigest, contract, path, provider_calls: providerCalls}, "compilation_digest");
  return success("intent-compilation", compilation, {candidate_signal: candidate.correction_signal === true});
}
