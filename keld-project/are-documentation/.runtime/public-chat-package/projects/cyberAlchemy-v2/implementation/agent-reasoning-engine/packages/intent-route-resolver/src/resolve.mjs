import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  sha256HexText,
} from "./canonical-json.mjs";
import {admitRouteRequest} from "./request.mjs";
import {admitCapabilityCatalog} from "./catalog.mjs";
import {evaluateEligibility} from "./eligibility.mjs";

export const DISPOSITION_SCHEMA_VERSION = "intent-route.disposition@1";

function receiptMaterial(disposition) {
  const material = {...disposition};
  delete material.receipt_digest;
  return canonicalizeJson(material);
}

function finalizeDisposition(material) {
  const normalized = canonicalizeJson(material);
  const receiptDigest = sha256HexText(canonicalJson(normalized));
  return deepFreeze(canonicalizeJson({...normalized, receipt_digest: receiptDigest}));
}

function invalidDisposition(input, diagnostic, requestDigest = null, catalog = null) {
  return finalizeDisposition({
    schema_version: DISPOSITION_SCHEMA_VERSION,
    request_id: typeof input?.request_id === "string" ? input.request_id : null,
    request_digest: requestDigest,
    catalog_id: catalog?.catalog_id ?? input?.catalog_snapshot?.catalog_id ?? null,
    catalog_digest: catalog?.content_digest ?? input?.catalog_snapshot?.content_digest ?? null,
    kind: "invalid",
    authority_effect: "none",
    reason_codes: diagnostic.reason_codes,
    candidates: [],
    evaluated_routes: [],
    ambiguity: null,
    invalid: {
      subject: diagnostic.subject,
      reason_codes: diagnostic.reason_codes,
    },
  });
}

function candidateFor(route, trace) {
  return canonicalizeJson({
    route_id: route.route_id,
    label: route.label,
    capability_ref: route.capability_ref,
    mode: route.mode,
    owner_ref: route.owner_ref,
    contract_refs: route.contract_refs,
    required_inputs: route.required_inputs,
    missing_inputs: route.required_inputs,
    forbidden_effects: route.forbidden_effects,
    posture: trace.posture,
    match_reasons: trace.reason_codes,
  });
}

function differentiatingKeys(routes) {
  const allKeys = [...new Set(routes.flatMap((route) => (
    route.required.map((predicate) => predicate.key)
  )))].sort();
  return allKeys.filter((key) => {
    const signatures = routes.map((route) => {
      const predicates = route.required.filter((predicate) => predicate.key === key);
      return predicates.length === 0 ? "<absent>" : canonicalJson(predicates);
    });
    return new Set(signatures).size > 1;
  });
}

function buildAmbiguity(catalog, candidateRoutes, materialMissing) {
  if (materialMissing.length > 0) {
    const key = materialMissing[0];
    return {
      reason_code: "ambiguity.material-discriminator-unresolved",
      material_discriminators: materialMissing,
      question: catalog.clarification_prompts[key] ?? `Please clarify "${key}".`,
    };
  }
  const keys = differentiatingKeys(candidateRoutes);
  if (keys.length > 0) {
    const key = keys[0];
    return {
      reason_code: "ambiguity.overlapping-routes",
      material_discriminators: [key],
      question: catalog.clarification_prompts[key] ?? `Please clarify "${key}".`,
    };
  }
  const options = candidateRoutes
    .map((route) => `${route.label} (${route.route_id})`)
    .sort()
    .join(", ");
  return {
    reason_code: "ambiguity.route-choice-required",
    material_discriminators: [],
    question: `Which route best fits: ${options}?`,
  };
}

export function resolveIntentRoute(input) {
  const requestAdmission = admitRouteRequest(input);
  if (!requestAdmission.ok) return invalidDisposition(input, requestAdmission.diagnostic);

  const catalogAdmission = admitCapabilityCatalog(requestAdmission.value.catalog_snapshot);
  if (!catalogAdmission.ok) {
    return invalidDisposition(
      input,
      catalogAdmission.diagnostic,
      requestAdmission.digest,
    );
  }

  const request = requestAdmission.value;
  const catalog = catalogAdmission.value;
  const normalizedRequest = canonicalizeJson({
    ...request,
    catalog_snapshot: catalog,
  });
  const normalizedRequestDigest = sha256HexText(canonicalJson(normalizedRequest));
  const evaluation = evaluateEligibility(request, catalog);
  const routeById = new Map(catalog.routes.map((route) => [route.route_id, route]));
  const traceById = new Map(
    evaluation.evaluated_routes.map((trace) => [trace.route_id, trace]),
  );
  const viableIds = [...new Set([
    ...evaluation.non_dominated_route_ids,
    ...evaluation.conditional_route_ids,
  ])].sort();
  const viableRoutes = viableIds.map((routeId) => routeById.get(routeId));
  const viableCandidates = viableIds.map((routeId) => (
    candidateFor(routeById.get(routeId), traceById.get(routeId))
  ));

  let kind;
  let candidates;
  let ambiguity = null;
  let reasonCodes;
  if (evaluation.material_missing_discriminators.length > 0) {
    kind = "ambiguous";
    candidates = viableCandidates;
    ambiguity = buildAmbiguity(
      catalog,
      viableRoutes,
      evaluation.material_missing_discriminators,
    );
    reasonCodes = [ambiguity.reason_code];
  } else if (evaluation.non_dominated_route_ids.length > 1) {
    kind = "ambiguous";
    candidates = evaluation.non_dominated_route_ids.map((routeId) => (
      candidateFor(routeById.get(routeId), traceById.get(routeId))
    ));
    ambiguity = buildAmbiguity(
      catalog,
      evaluation.non_dominated_route_ids.map((routeId) => routeById.get(routeId)),
      [],
    );
    reasonCodes = [ambiguity.reason_code];
  } else if (evaluation.non_dominated_route_ids.length === 1) {
    kind = "candidate";
    const routeId = evaluation.non_dominated_route_ids[0];
    candidates = [candidateFor(routeById.get(routeId), traceById.get(routeId))];
    reasonCodes = ["disposition.unique-non-dominated-candidate"];
  } else {
    kind = "no-match";
    candidates = [];
    reasonCodes = ["disposition.no-eligible-route"];
  }

  return finalizeDisposition({
    schema_version: DISPOSITION_SCHEMA_VERSION,
    request_id: request.request_id,
    request_digest: normalizedRequestDigest,
    catalog_id: catalog.catalog_id,
    catalog_digest: catalog.content_digest,
    kind,
    authority_effect: "none",
    reason_codes: reasonCodes,
    candidates,
    evaluated_routes: evaluation.evaluated_routes,
    ambiguity,
    invalid: null,
  });
}

export function verifyDispositionDigest(disposition) {
  return (
    typeof disposition?.receipt_digest === "string"
    && sha256HexText(canonicalJson(receiptMaterial(disposition))) === disposition.receipt_digest
  );
}
