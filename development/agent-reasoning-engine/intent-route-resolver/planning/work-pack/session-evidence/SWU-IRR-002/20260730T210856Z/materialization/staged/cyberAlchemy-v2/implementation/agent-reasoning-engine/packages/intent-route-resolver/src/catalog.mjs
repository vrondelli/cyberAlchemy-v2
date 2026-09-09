import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  sha256HexText,
} from "./canonical-json.mjs";

export const CATALOG_SCHEMA_VERSION = "intent-route.catalog@1";
export const PREDICATE_OPERATORS = Object.freeze([
  "absent",
  "equals",
  "one-of",
  "present",
]);

const OPERATORS = new Set(PREDICATE_OPERATORS);
const SHA256 = /^[a-f0-9]{64}$/;

function plainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function exactKeys(value, allowed, path, reasons) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) reasons.push(`${path}.unknown-field:${key}`);
  }
}

function stringSet(value, path, reasons) {
  if (!Array.isArray(value)) {
    reasons.push(`${path}.expected-array`);
    return [];
  }
  const result = [];
  for (const item of value) {
    if (!nonEmptyString(item)) reasons.push(`${path}.invalid-string`);
    else result.push(item.trim());
  }
  if (new Set(result).size !== result.length) reasons.push(`${path}.duplicate`);
  return [...new Set(result)].sort();
}

function normalizePredicate(value, path, reasons) {
  if (!plainObject(value)) {
    reasons.push(`${path}.expected-object`);
    return null;
  }
  exactKeys(value, new Set(["key", "operator", "value"]), path, reasons);
  if (!nonEmptyString(value.key)) reasons.push(`${path}.key.required`);
  if (!OPERATORS.has(value.operator)) reasons.push(`${path}.operator.unsupported`);
  if (["equals", "one-of"].includes(value.operator) && !("value" in value)) {
    reasons.push(`${path}.value.required`);
  }
  if (["present", "absent"].includes(value.operator) && "value" in value) {
    reasons.push(`${path}.value.forbidden`);
  }
  if (
    value.operator === "one-of"
    && (!Array.isArray(value.value) || value.value.length === 0)
  ) {
    reasons.push(`${path}.value.non-empty-array-required`);
  }
  return canonicalizeJson({
    key: nonEmptyString(value.key) ? value.key.trim() : "",
    operator: value.operator,
    ...("value" in value ? {value: value.value} : {}),
  });
}

function predicateSet(value, path, reasons) {
  if (!Array.isArray(value)) {
    reasons.push(`${path}.expected-array`);
    return [];
  }
  const result = value.map((item, index) => normalizePredicate(item, `${path}[${index}]`, reasons));
  const encodings = result.map(canonicalJson);
  if (new Set(encodings).size !== encodings.length) reasons.push(`${path}.duplicate`);
  return result.sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));
}

function normalizeRoute(value, index, reasons) {
  const path = `catalog.routes[${index}]`;
  if (!plainObject(value)) {
    reasons.push(`${path}.expected-object`);
    return null;
  }
  exactKeys(
    value,
    new Set([
      "route_id",
      "label",
      "capability_ref",
      "mode",
      "required",
      "exclusions",
      "required_inputs",
      "dominates",
      "owner_ref",
      "contract_refs",
      "forbidden_effects",
    ]),
    path,
    reasons,
  );
  for (const field of ["route_id", "label", "capability_ref", "mode", "owner_ref"]) {
    if (!nonEmptyString(value[field])) reasons.push(`${path}.${field}.required`);
  }
  return {
    route_id: nonEmptyString(value.route_id) ? value.route_id.trim() : "",
    label: nonEmptyString(value.label) ? value.label.trim() : "",
    capability_ref: nonEmptyString(value.capability_ref) ? value.capability_ref.trim() : "",
    mode: nonEmptyString(value.mode) ? value.mode.trim() : "",
    required: predicateSet(value.required, `${path}.required`, reasons),
    exclusions: predicateSet(value.exclusions, `${path}.exclusions`, reasons),
    required_inputs: stringSet(value.required_inputs, `${path}.required_inputs`, reasons),
    dominates: stringSet(value.dominates, `${path}.dominates`, reasons),
    owner_ref: nonEmptyString(value.owner_ref) ? value.owner_ref.trim() : "",
    contract_refs: stringSet(value.contract_refs, `${path}.contract_refs`, reasons),
    forbidden_effects: stringSet(value.forbidden_effects, `${path}.forbidden_effects`, reasons),
  };
}

function normalizePrompts(value, reasons) {
  if (!plainObject(value)) {
    reasons.push("catalog.clarification_prompts.expected-object");
    return {};
  }
  const result = {};
  for (const sourceKey of Object.keys(value).sort()) {
    const key = sourceKey.trim();
    if (!key || !nonEmptyString(value[sourceKey])) {
      reasons.push("catalog.clarification_prompts.invalid");
      continue;
    }
    if (key in result) reasons.push(`catalog.clarification_prompts.duplicate:${key}`);
    result[key] = value[sourceKey].trim();
  }
  return result;
}

function normalizeCatalog(input, reasons) {
  if (!plainObject(input)) {
    reasons.push("catalog.expected-object");
    return null;
  }
  exactKeys(
    input,
    new Set([
      "schema_version",
      "catalog_id",
      "catalog_version",
      "owner_ref",
      "effective_state",
      "content_digest",
      "clarification_prompts",
      "routes",
    ]),
    "catalog",
    reasons,
  );
  if (input.schema_version !== CATALOG_SCHEMA_VERSION) reasons.push("catalog.unsupported-version");
  for (const field of ["catalog_id", "catalog_version", "owner_ref"]) {
    if (!nonEmptyString(input[field])) reasons.push(`catalog.${field}.required`);
  }

  let effectiveState = null;
  if (!plainObject(input.effective_state)) {
    reasons.push("catalog.effective_state.required");
  } else {
    exactKeys(input.effective_state, new Set(["status", "revision"]), "catalog.effective_state", reasons);
    if (input.effective_state.status !== "effective") {
      reasons.push("catalog.effective_state.not-effective");
    }
    if (!nonEmptyString(input.effective_state.revision)) {
      reasons.push("catalog.effective_state.revision.required");
    }
    effectiveState = {
      status: input.effective_state.status,
      revision: nonEmptyString(input.effective_state.revision)
        ? input.effective_state.revision.trim()
        : "",
    };
  }

  if (!Array.isArray(input.routes) || input.routes.length === 0) {
    reasons.push("catalog.routes.non-empty-array-required");
  }
  const routes = Array.isArray(input.routes)
    ? input.routes.map((route, index) => normalizeRoute(route, index, reasons))
    : [];
  routes.sort((left, right) => left.route_id.localeCompare(right.route_id));
  const routeIds = routes.map((route) => route.route_id);
  if (new Set(routeIds).size !== routeIds.length) reasons.push("catalog.routes.duplicate-id");

  const knownIds = new Set(routeIds);
  for (const route of routes) {
    for (const target of route.dominates) {
      if (target === route.route_id) reasons.push(`catalog.dominance.self:${route.route_id}`);
      else if (!knownIds.has(target)) reasons.push(`catalog.dominance.unknown:${route.route_id}->${target}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(routes.map((route) => [route.route_id, route]));
  function visit(routeId) {
    if (visiting.has(routeId)) {
      reasons.push(`catalog.dominance.cycle:${routeId}`);
      return;
    }
    if (visited.has(routeId)) return;
    visiting.add(routeId);
    for (const child of byId.get(routeId)?.dominates ?? []) {
      if (knownIds.has(child)) visit(child);
    }
    visiting.delete(routeId);
    visited.add(routeId);
  }
  for (const routeId of [...knownIds].sort()) visit(routeId);

  return canonicalizeJson({
    schema_version: CATALOG_SCHEMA_VERSION,
    catalog_id: nonEmptyString(input.catalog_id) ? input.catalog_id.trim() : "",
    catalog_version: nonEmptyString(input.catalog_version) ? input.catalog_version.trim() : "",
    owner_ref: nonEmptyString(input.owner_ref) ? input.owner_ref.trim() : "",
    effective_state: effectiveState,
    clarification_prompts: normalizePrompts(input.clarification_prompts, reasons),
    routes,
  });
}

function invalid(reasons) {
  return deepFreeze({
    ok: false,
    diagnostic: {
      schema_version: "intent-route.invalid@1",
      subject: "catalog",
      reason_codes: [...new Set(reasons)].sort(),
    },
  });
}

export function computeCatalogDigest(input) {
  const reasons = [];
  try {
    canonicalizeJson(input);
  } catch (error) {
    throw new TypeError(`invalid catalog JSON: ${error.message}`);
  }
  const normalized = normalizeCatalog(input, reasons);
  if (reasons.length > 0) {
    throw new TypeError(`invalid catalog: ${[...new Set(reasons)].sort().join(",")}`);
  }
  return sha256HexText(canonicalJson(normalized));
}

export function sealCapabilityCatalog(input) {
  const material = {...input};
  delete material.content_digest;
  return {
    ...canonicalizeJson(material),
    content_digest: computeCatalogDigest(material),
  };
}

export function admitCapabilityCatalog(input) {
  const reasons = [];
  try {
    canonicalizeJson(input);
  } catch (error) {
    return invalid([`catalog.non-json:${error.message}`]);
  }
  const normalized = normalizeCatalog(input, reasons);
  if (typeof input?.content_digest !== "string" || !SHA256.test(input.content_digest)) {
    reasons.push("catalog.content_digest.invalid");
  } else if (normalized && sha256HexText(canonicalJson(normalized)) !== input.content_digest) {
    reasons.push("catalog.content_digest.mismatch");
  }
  if (reasons.length > 0) return invalid(reasons);
  return deepFreeze({
    ok: true,
    value: canonicalizeJson({...normalized, content_digest: input.content_digest}),
    bytes: canonicalJson({...normalized, content_digest: input.content_digest}),
    digest: input.content_digest,
  });
}
