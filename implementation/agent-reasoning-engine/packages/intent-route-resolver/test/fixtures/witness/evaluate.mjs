import {
  canonicalJson,
  canonicalizeJson,
  mapSelectedLocalIntent,
  resolveIntentRoute,
  resolveJson,
  sealCapabilityCatalog,
  sealSelectedLocalMappingProfile,
  sha256HexText,
  verifyDispositionDigest,
} from "../../../index.mjs";

function clone(value) {
  return canonicalizeJson(value);
}

function routeCaseById(document, caseId) {
  const value = document.route_cases.find((item) => item.case_id === caseId);
  if (!value) throw new Error(`unknown route case: ${caseId}`);
  return value;
}

function prepareCatalog(document, fixtureCase) {
  const catalog = clone(document.catalogs[fixtureCase.catalog_ref]);
  if (!catalog) throw new Error(`unknown catalog: ${fixtureCase.catalog_ref}`);

  if (fixtureCase.catalog_mode === "seal-reversed") {
    catalog.routes.reverse();
    return sealCapabilityCatalog(catalog);
  }
  if (fixtureCase.catalog_mode === "invalid-duplicate") {
    catalog.routes[1].route_id = catalog.routes[0].route_id;
    return {...catalog, content_digest: "0".repeat(64)};
  }
  if (fixtureCase.catalog_mode === "invalid-cycle") {
    catalog.routes[1].dominates = [catalog.routes[0].route_id];
    return {...catalog, content_digest: "0".repeat(64)};
  }

  const sealed = sealCapabilityCatalog(catalog);
  if (fixtureCase.catalog_mode === "seal-bad-digest") {
    sealed.content_digest = "0".repeat(64);
  }
  return sealed;
}

function prepareRequest(document, fixtureCase) {
  return canonicalizeJson({
    schema_version: fixtureCase.request_schema ?? "intent-route.request@1",
    request_id: fixtureCase.request_id,
    intent: clone(document.intents[fixtureCase.intent_ref]),
    catalog_snapshot: prepareCatalog(document, fixtureCase),
  });
}

function result(caseId, category, output, pass, observed) {
  const outputBytes = canonicalJson(output);
  return canonicalizeJson({
    case_id: caseId,
    category,
    pass,
    observed,
    output,
    output_bytes: outputBytes,
    output_digest: sha256HexText(outputBytes),
  });
}

function executeRouteCase(document, fixtureCase) {
  const disposition = resolveIntentRoute(prepareRequest(document, fixtureCase));
  const pass = (
    disposition.kind === fixtureCase.expected_kind
    && disposition.authority_effect === "none"
    && verifyDispositionDigest(disposition)
  );
  return result(
    fixtureCase.case_id,
    "route",
    disposition,
    pass,
    {
      authority_effect: disposition.authority_effect,
      disposition_kind: disposition.kind,
      receipt_verified: verifyDispositionDigest(disposition),
    },
  );
}

function executePortCase(document, fixtureCase) {
  let input;
  if (fixtureCase.mode === "literal") {
    input = fixtureCase.json_text;
  } else {
    const source = routeCaseById(document, fixtureCase.route_case_ref);
    const request = prepareRequest(document, source);
    if (fixtureCase.mode === "unknown-version") {
      request.schema_version = "intent-route.request@99";
    }
    input = canonicalJson(request);
  }

  const outputBytes = resolveJson(input);
  const output = JSON.parse(outputBytes);
  const observedKind = output.disposition?.kind ?? null;
  const observedReason = output.transport_diagnostic?.reason_codes?.[0] ?? null;
  const pass = (
    outputBytes === canonicalJson(output)
    && (
      fixtureCase.expected_kind
        ? observedKind === fixtureCase.expected_kind
        : observedReason === fixtureCase.expected_reason
    )
  );
  return canonicalizeJson({
    case_id: fixtureCase.case_id,
    category: "port",
    pass,
    observed: {
      disposition_kind: observedKind,
      reason_code: observedReason,
    },
    output,
    output_bytes: outputBytes,
    output_digest: sha256HexText(outputBytes),
  });
}

function executeMapperCase(document, fixtureCase) {
  const profileSource = clone(document.selected_local.profile);
  if (fixtureCase.mode === "missing-selector") {
    profileSource.mappings = {phase: "phase"};
  }
  const profile = sealSelectedLocalMappingProfile(profileSource);
  const output = mapSelectedLocalIntent(
    clone(document.selected_local.record),
    profile,
  );
  const observed = output.value?.discriminators?.[fixtureCase.expected_discriminator];
  const pass = (
    output.ok === true
    && observed?.posture === fixtureCase.expected_posture
    && output.receipt.authority_effect === "none"
  );
  return result(
    fixtureCase.case_id,
    "mapper",
    output,
    pass,
    {
      authority_effect: output.receipt?.authority_effect ?? null,
      discriminator: fixtureCase.expected_discriminator,
      posture: observed?.posture ?? null,
    },
  );
}

function executeComparison(comparison, byId) {
  const left = byId.get(comparison.left);
  const right = byId.get(comparison.right);
  let pass = false;
  if (comparison.mode === "byte-equality") {
    pass = left.output_bytes === right.output_bytes;
  } else if (comparison.mode === "determinacy-non-increase") {
    const rank = {invalid: 0, "no-match": 1, ambiguous: 2, candidate: 3};
    pass = (
      rank[right.observed.disposition_kind]
      <= rank[left.observed.disposition_kind]
    );
  }
  return canonicalizeJson({
    comparison_id: comparison.comparison_id,
    mode: comparison.mode,
    left: comparison.left,
    right: comparison.right,
    pass,
  });
}

export function executeWitnessCases(document) {
  if (document?.schema_version !== "intent-route.witness-cases@1") {
    throw new TypeError("unsupported witness fixture version");
  }
  const cases = [
    ...document.route_cases.map((item) => executeRouteCase(document, item)),
    ...document.port_cases.map((item) => executePortCase(document, item)),
    ...document.mapper_cases.map((item) => executeMapperCase(document, item)),
  ];
  const byId = new Map(cases.map((item) => [item.case_id, item]));
  const comparisons = document.comparisons.map((item) => executeComparison(item, byId));
  const pass = (
    cases.every((item) => item.pass)
    && comparisons.every((item) => item.pass)
  );
  return canonicalizeJson({
    schema_version: "intent-route.witness-results@1",
    status: pass ? "PASS" : "FAIL",
    case_count: cases.length,
    comparison_count: comparisons.length,
    cases,
    comparisons,
  });
}
