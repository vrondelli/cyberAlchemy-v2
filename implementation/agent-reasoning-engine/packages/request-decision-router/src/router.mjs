import {canonicalJson, canonicalizeJson, deepFreeze, sha256HexText} from "../../intent-route-resolver/index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {queryRouteAvailability} from "../../module-port/route-availability.mjs";
import {execute as evaluateCompiledRouteAvailability} from "../generated/route-availability/app/function/behavior.mjs";
import {admitRequestContext} from "./context.mjs";
import {isVerifiedDecisionProfile} from "./verified-profile.mjs";

const EMPTY_MODULE_PORT = createModulePort({output_validators: semanticTextOutputValidators});
const LEXICAL_CACHE_LIMIT = 256;
const lexicalEvidenceCache = new WeakMap();

function invocationId(operation, ...values) {
  return `router:${operation}:${sha256HexText(values.join("\u0000")).slice(0, 24)}`;
}

function dependencyEvidence(modulePort) {
  try {
    const inspection = modulePort.inspect();
    if (inspection?.schema_version !== "are.module-set-inspection/v1") throw new TypeError("module inspection invalid");
    return {inspection, semanticText: createSemanticTextFacade(modulePort, {consumer_id: "request-decision-router"})};
  } catch {
    return {inspection: null, semanticText: null};
  }
}

function lexicalMatch(normalizedText, normalizedSignal, phraseMatched) {
  if (!normalizedSignal || !phraseMatched) return false;
  const searchable = ` ${normalizedText} `;
  const needle = ` ${normalizedSignal} `;
  let offset = 0;
  while (offset <= searchable.length - needle.length) {
    const index = searchable.indexOf(needle, offset);
    if (index < 0) return false;
    const prefix = searchable.slice(Math.max(0, index - 32), index + 1);
    if (!/\b(?:do\s+not|don't|never|without)\s+$/.test(prefix)) return true;
    offset = index + needle.length;
  }
  return false;
}

function evaluateLexicalEvidence(text, profile, modulePort) {
  const signals = [...new Set(profile.routes.flatMap((route) => [...route.signals, ...route.exclusions]))].sort();
  const profileKey = profile.profile_digest ?? sha256HexText(canonicalJson(signals));
  const cacheKey = `${profileKey}\u0000${text}`;
  const cache = modulePort !== null && (typeof modulePort === "object" || typeof modulePort === "function")
    ? lexicalEvidenceCache.get(modulePort)
    : null;
  if (cache?.has(cacheKey)) return cache.get(cacheKey);
  const dependency = dependencyEvidence(modulePort);
  const receipts = [];
  const reasonCodes = new Set();
  let disposition = "evaluated";
  const absorb = (result) => {
    if (result?.receipt?.receipt_digest) receipts.push(result.receipt.receipt_digest);
    for (const reason of result?.reason_codes ?? []) reasonCodes.add(reason);
    if (result?.disposition === "blocked") disposition = "blocked";
    else if (result?.disposition === "unavailable" && disposition !== "blocked") disposition = "unavailable";
    return result;
  };
  if (!dependency.semanticText) {
    disposition = "blocked";
    reasonCodes.add("module.port-invalid");
  }
  const normalizedTextResult = dependency.semanticText
    ? absorb(dependency.semanticText.semanticKey(text, {invocation_id: invocationId("semantic-key", text)}))
    : null;
  const normalizedText = normalizedTextResult?.ok === true ? normalizedTextResult.value.key : null;
  const matches = new Map();
  if (normalizedText !== null) {
    for (const signal of signals) {
      const normalizedSignalResult = absorb(dependency.semanticText.semanticKey(signal, {invocation_id: invocationId("semantic-key", signal)}));
      if (normalizedSignalResult.ok !== true) {
        matches.set(signal, null);
        continue;
      }
      const normalizedSignal = normalizedSignalResult.value.key;
      if (!normalizedSignal) {
        matches.set(signal, false);
        continue;
      }
      const phraseResult = absorb(dependency.semanticText.containsPhrase(normalizedText, normalizedSignal, {
        invocation_id: invocationId("contains-phrase", normalizedText, normalizedSignal),
      }));
      matches.set(signal, phraseResult.ok === true
        ? lexicalMatch(normalizedText, normalizedSignal, phraseResult.value.matched)
        : null);
    }
  }
  const inspection = dependency.inspection;
  const receiptDigests = [...new Set(receipts)].sort();
  const evidence = canonicalizeJson({
    disposition,
    module_set_digest: inspection?.module_set_digest ?? null,
    capability_ids: inspection?.capability_ids ?? [],
    receipt_count: receiptDigests.length,
    receipt_set_digest: sha256HexText(canonicalJson(receiptDigests)),
    reason_codes: [...reasonCodes].sort(),
    dependency_posture: "required-for-judgment",
    authority_effect: "none",
  });
  const evaluated = {matches, evidence};
  if (modulePort !== null && (typeof modulePort === "object" || typeof modulePort === "function")) {
    const target = cache ?? new Map();
    if (!cache) lexicalEvidenceCache.set(modulePort, target);
    if (target.size >= LEXICAL_CACHE_LIMIT) target.delete(target.keys().next().value);
    target.set(cacheKey, evaluated);
  }
  return evaluated;
}

export function routingSignalJudgment(text, signal, modulePort = EMPTY_MODULE_PORT) {
  const profile = {routes: [{signals: [signal], exclusions: []}]};
  const evaluated = evaluateLexicalEvidence(text, profile, modulePort);
  return deepFreeze(canonicalizeJson({
    disposition: evaluated.evidence.disposition,
    matched: evaluated.matches.get(signal) ?? null,
    semantic_evidence: evaluated.evidence,
    authority_effect: "none",
  }));
}

function finalize(material) {
  const normalized = canonicalizeJson(material);
  return deepFreeze(canonicalizeJson({...normalized, decision_digest: sha256HexText(canonicalJson(normalized))}));
}

function evaluateRouteAvailability(route, modulePort) {
  const capabilityRequired = route.availability_capability_id !== null;
  let capabilityResult = null;
  if (capabilityRequired && route.lifecycle_state !== "blocked") {
    try {
      capabilityResult = queryRouteAvailability(modulePort, {
        route_id: route.route_id,
        capability_id: route.availability_capability_id,
        invocation_id: invocationId("route-availability", route.route_id, route.availability_capability_id),
      });
    } catch {
      capabilityResult = {ok: false, disposition: "blocked", value: null, reason_codes: ["module.port-invalid"], receipt: null};
    }
  }
  const capabilityAvailable = capabilityResult?.ok === true
    && capabilityResult.disposition === "available"
    && capabilityResult.value?.available === true;
  const routeIdentityMatches = capabilityAvailable && capabilityResult.value.route_id === route.route_id;
  const compiled = evaluateCompiledRouteAvailability({input: {
    registry_declared: true,
    lifecycle_available: route.lifecycle_state !== "blocked",
    capability_required: capabilityRequired,
    capability_available: capabilityRequired ? capabilityAvailable : false,
    route_identity_matches: capabilityRequired ? routeIdentityMatches : false,
  }});
  const reasonCodes = new Set();
  if (compiled.status === "unavailable") reasonCodes.add(`route.availability-${compiled.repair_focus}`);
  if (compiled.repair_focus === "lifecycle") reasonCodes.add("route.lifecycle-blocked");
  for (const reason of capabilityResult?.reason_codes ?? []) reasonCodes.add(reason);
  for (const reason of capabilityResult?.value?.reason_codes ?? []) reasonCodes.add(reason);
  return canonicalizeJson({
    status: compiled.status,
    source: capabilityRequired ? "module-capability" : "route-registry",
    capability_id: route.availability_capability_id,
    module_id: capabilityResult?.module_id ?? null,
    module_version: capabilityResult?.module_version ?? null,
    module_disposition: capabilityResult?.disposition ?? null,
    receipt_digest: capabilityResult?.receipt?.receipt_digest ?? null,
    repair_focus: compiled.repair_focus,
    reason_codes: [...reasonCodes].sort(),
    authority_effect: "none",
  });
}

export function routeRequest(input, profile, modulePort = EMPTY_MODULE_PORT) {
  const blockedEvidence = (reason) => ({disposition: "blocked", module_set_digest: null, capability_ids: [], receipt_count: 0, receipt_set_digest: sha256HexText(canonicalJson([])), reason_codes: [reason], dependency_posture: "required-for-judgment", authority_effect: "none"});
  if (!isVerifiedDecisionProfile(profile)) return finalize({schema_version: "are.capability-selection/v1", kind: "block", request_id: input?.request_id ?? null, request_context_digest: null, decision_profile_digest: null, selected: null, candidates: [], evaluated_routes: [], semantic_evidence: blockedEvidence("profile.unverified"), provenance: [], reason_codes: ["profile.unverified"], authority_effect: "none"});
  const admitted = admitRequestContext(input);
  if (!admitted.ok) return finalize({schema_version: "are.capability-selection/v1", kind: "block", request_id: input?.request_id ?? null, request_context_digest: null, decision_profile_digest: profile.profile_digest, selected: null, candidates: [], evaluated_routes: [], semantic_evidence: blockedEvidence("request.context-invalid"), provenance: profile.provenance, reason_codes: admitted.reason_codes, authority_effect: "none"});
  const context = admitted.value;
  // Inferred fields help package context, but must not manufacture lexical
  // route evidence or veto the user's own request.
  const routingText = [
    context.raw_request,
    ...(context.field_postures.target_refs === "explicit" ? context.target_refs : []),
    ...(context.field_postures.constraints === "explicit" ? context.constraints : []),
  ].join("\n");
  const lexical = evaluateLexicalEvidence(routingText, profile, modulePort);
  const objectivePosture = context.field_postures.objective_kind;
  const objectiveMaySelect = objectivePosture === "explicit";
  const traces = profile.routes.map((route) => {
    const availability = evaluateRouteAvailability(route, modulePort);
    const lexicalAvailable = lexical.evidence.disposition === "evaluated";
    const excluded = lexicalAvailable ? route.exclusions.filter((signal) => lexical.matches.get(signal) === true) : [];
    const objectiveMatch = context.objective_kind !== null && route.objective_kinds.includes(context.objective_kind);
    const matchedSignals = lexicalAvailable ? route.signals.filter((signal) => lexical.matches.get(signal) === true) : [];
    const matchedEffects = route.effect_classes.filter((effect) => context.requested_effects.includes(effect));
    let posture = "rejected";
    const reasons = [];
    if (availability.status !== "available") reasons.push(...availability.reason_codes);
    else if (excluded.length > 0) reasons.push("route.explicit-exclusion");
    else if (objectiveMatch && objectiveMaySelect) {
      posture = "eligible";
      reasons.push("route.explicit-objective-match");
    } else if (matchedSignals.length > 0) {
      posture = "eligible";
      reasons.push("route.lexical-signal-match");
    } else {
      reasons.push("route.no-match");
      if (objectiveMatch) reasons.push(`route.${objectivePosture}-objective-nonselecting`);
    }
    if (!lexicalAvailable) reasons.push(`route.lexical-evidence-${lexical.evidence.disposition}`);
    return canonicalizeJson({route_id: route.route_id, posture, objective_match: objectiveMatch, objective_posture: objectivePosture, availability, lexical_evidence_disposition: lexical.evidence.disposition, matched_signals: matchedSignals, matched_effects: matchedEffects, matched_exclusions: excluded, reason_codes: reasons});
  }).sort((a, b) => a.route_id.localeCompare(b.route_id));
  const eligible = traces.filter((trace) => trace.posture === "eligible");
  const explicitObjectiveEligible = eligible.filter((trace) => trace.objective_match && trace.objective_posture === "explicit");
  const selectedEligible = explicitObjectiveEligible.length > 0
    ? eligible.filter((trace) => trace.objective_match)
    : eligible;
  const suppressedLexicalCandidates = explicitObjectiveEligible.length > 0
    ? eligible.filter((trace) => !selectedEligible.some((selectedTrace) => selectedTrace.route_id === trace.route_id)).map((trace) => trace.route_id)
    : [];
  const byId = new Map(profile.routes.map((route) => [route.route_id, route]));
  const unavailableExplicit = traces.filter((trace) => trace.objective_match
    && trace.objective_posture === "explicit"
    && trace.availability.capability_id !== null
    && trace.availability.status !== "available");
  const excludedExplicit = traces.filter((trace) => trace.objective_match
    && trace.objective_posture === "explicit"
    && trace.matched_exclusions.length > 0);
  let kind = "block";
  let selected = null;
  let reasons = ["selection.no-match"];
  if (lexical.evidence.disposition === "blocked") {
    reasons = ["route.semantic-capability-blocked", ...lexical.evidence.reason_codes];
  } else if (unavailableExplicit.length > 0) {
    kind = "gate";
    reasons = ["route.explicit-capability-unavailable", ...new Set(unavailableExplicit.flatMap((trace) => trace.availability.reason_codes))];
  } else if (excludedExplicit.length > 0) {
    reasons = ["route.explicit-objective-excluded"];
  } else if (selectedEligible.length === 1) {
    const route = byId.get(selectedEligible[0].route_id);
    const knownEffectClasses = new Set(profile.routes.flatMap((candidate) => candidate.effect_classes));
    const unknownRequestedEffects = context.requested_effects.filter((effect) => !knownEffectClasses.has(effect));
    const forbiddenRequestedEffects = context.requested_effects.filter((effect) => knownEffectClasses.has(effect) && !route.effect_classes.includes(effect));
    selected = canonicalizeJson({route_id: route.route_id, capability_ref: route.capability_ref, label: route.label, owner_gate_ref: route.owner_gate_ref, provenance_ids: route.provenance_ids, execution_mode: route.execution_mode, authority_root: route.authority_root, read_first: route.read_first, requires_user_authorization: route.requires_user_authorization, write_ceiling: route.write_ceiling, blockers: route.blockers,
      permitted_effect_classes: route.effect_classes, requested_effect_assessment: {unknown: unknownRequestedEffects, forbidden: forbiddenRequestedEffects}});
    if (unknownRequestedEffects.length > 0 || forbiddenRequestedEffects.length > 0) {
      kind = "gate";
      reasons = [...(unknownRequestedEffects.length ? ["route.requested-effect-unknown"] : []), ...(forbiddenRequestedEffects.length ? ["route.requested-effect-not-permitted"] : [])];
    } else {
      kind = "direct";
      reasons = suppressedLexicalCandidates.length > 0 ? ["selection.explicit-objective-priority"] : ["selection.unique-capability"];
    }
  } else if (selectedEligible.length > 1) {
    kind = "gate";
    reasons = ["selection.multiple-capabilities"];
  } else if (lexical.evidence.disposition === "unavailable") {
    kind = "gate";
    reasons = ["route.semantic-capability-unavailable", ...lexical.evidence.reason_codes];
  }
  const candidateDetails = selectedEligible.map((trace) => {
    const route = byId.get(trace.route_id);
    return canonicalizeJson({
      route_id: trace.route_id,
      capability_ref: route.capability_ref,
      owner_gate_ref: route.owner_gate_ref,
      reason_codes: trace.reason_codes,
      provenance_ids: route.provenance_ids,
      matched_signals: trace.matched_signals,
      matched_effects: trace.matched_effects,
    });
  });
  return finalize({schema_version: "are.capability-selection/v1", kind, request_id: context.request_id, request_context_digest: admitted.digest, decision_profile_digest: profile.profile_digest, selected, candidates: selectedEligible.map((trace) => trace.route_id), suppressed_lexical_candidates: suppressedLexicalCandidates, candidate_details: candidateDetails, evaluated_routes: traces, evaluated_context_fields: ["raw_request", "objective_kind", "requested_effects", "target_refs", "constraints"], routing_affinity_fields: ["raw_request", "objective_kind", "target_refs", "constraints"], effect_assessment_fields: ["requested_effects"], semantic_evidence: lexical.evidence, provenance: profile.provenance, reason_codes: reasons, authority_effect: "none"});
}
