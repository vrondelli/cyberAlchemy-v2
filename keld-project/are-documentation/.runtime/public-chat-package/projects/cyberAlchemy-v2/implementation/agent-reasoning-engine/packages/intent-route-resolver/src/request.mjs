import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  sha256HexText,
} from "./canonical-json.mjs";

export const REQUEST_SCHEMA_VERSION = "intent-route.request@1";
export const ROUTABLE_INTENT_SCHEMA_VERSION = "routable-intent@1";

const POSTURES = new Set(["declared", "inferred", "unresolved"]);
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

function normalizeStringSet(value, path, reasons) {
  if (!Array.isArray(value)) {
    reasons.push(`${path}.expected-array`);
    return [];
  }
  const normalized = [];
  for (const item of value) {
    if (!nonEmptyString(item)) {
      reasons.push(`${path}.invalid-string`);
      continue;
    }
    normalized.push(item.trim());
  }
  return [...new Set(normalized)].sort();
}

function normalizeRawIntent(value, reasons) {
  if (nonEmptyString(value)) return value;
  if (plainObject(value)) {
    exactKeys(value, new Set(["ref"]), "intent.raw_intent", reasons);
    if (nonEmptyString(value.ref)) return {ref: value.ref.trim()};
  }
  reasons.push("intent.raw_intent.invalid");
  return null;
}

function normalizeField(value, path, reasons) {
  if (!plainObject(value)) {
    reasons.push(`${path}.expected-object`);
    return null;
  }
  exactKeys(
    value,
    new Set(["posture", "value", "evidence_refs", "inference_note"]),
    path,
    reasons,
  );

  if (!POSTURES.has(value.posture)) reasons.push(`${path}.unsupported-posture`);
  const evidenceRefs = normalizeStringSet(value.evidence_refs ?? [], `${path}.evidence_refs`, reasons);
  const inferenceNote = value.inference_note ?? null;

  if (value.posture === "unresolved") {
    if (value.value !== null) reasons.push(`${path}.unresolved-value-must-be-null`);
    if (inferenceNote !== null) reasons.push(`${path}.unresolved-note-must-be-null`);
  } else if (value.posture === "declared") {
    if (evidenceRefs.length === 0) reasons.push(`${path}.declared-evidence-required`);
    if (inferenceNote !== null) reasons.push(`${path}.declared-note-must-be-null`);
  } else if (value.posture === "inferred") {
    if (evidenceRefs.length === 0) reasons.push(`${path}.inferred-evidence-required`);
    if (!nonEmptyString(inferenceNote)) reasons.push(`${path}.inference-note-required`);
  }

  return {
    posture: value.posture,
    value: canonicalizeJson(value.value),
    evidence_refs: evidenceRefs,
    inference_note: inferenceNote === null ? null : String(inferenceNote).trim(),
  };
}

function normalizeIntent(value, reasons) {
  if (!plainObject(value)) {
    reasons.push("intent.expected-object");
    return null;
  }
  exactKeys(
    value,
    new Set([
      "schema_version",
      "source_schema",
      "source_digest",
      "raw_intent",
      "discriminators",
      "constraints",
    ]),
    "intent",
    reasons,
  );

  if (value.schema_version !== ROUTABLE_INTENT_SCHEMA_VERSION) {
    reasons.push("intent.unsupported-version");
  }
  if (!nonEmptyString(value.source_schema)) reasons.push("intent.source_schema.required");
  if (typeof value.source_digest !== "string" || !SHA256.test(value.source_digest)) {
    reasons.push("intent.source_digest.invalid");
  }

  const rawIntent = normalizeRawIntent(value.raw_intent, reasons);
  const discriminators = {};
  if (!plainObject(value.discriminators)) {
    reasons.push("intent.discriminators.expected-object");
  } else {
    const normalizedKeys = new Set();
    for (const sourceKey of Object.keys(value.discriminators).sort()) {
      const key = sourceKey.trim();
      if (!key) {
        reasons.push("intent.discriminators.empty-key");
        continue;
      }
      if (normalizedKeys.has(key)) {
        reasons.push(`intent.discriminators.duplicate-normalized-key:${key}`);
        continue;
      }
      normalizedKeys.add(key);
      discriminators[key] = normalizeField(
        value.discriminators[sourceKey],
        `intent.discriminators.${key}`,
        reasons,
      );
    }
  }

  return {
    schema_version: value.schema_version,
    source_schema: nonEmptyString(value.source_schema) ? value.source_schema.trim() : "",
    source_digest: value.source_digest,
    raw_intent: rawIntent,
    discriminators,
    constraints: normalizeStringSet(value.constraints, "intent.constraints", reasons),
  };
}

function invalid(reasons) {
  return deepFreeze({
    ok: false,
    diagnostic: {
      schema_version: "intent-route.invalid@1",
      subject: "request",
      reason_codes: [...new Set(reasons)].sort(),
    },
  });
}

export function admitRouteRequest(input) {
  const reasons = [];
  try {
    canonicalizeJson(input);
  } catch (error) {
    return invalid([`request.non-json:${error.message}`]);
  }

  if (!plainObject(input)) return invalid(["request.expected-object"]);
  exactKeys(
    input,
    new Set([
      "schema_version",
      "request_id",
      "intent",
      "catalog_snapshot",
      "supersedes_request_id",
    ]),
    "request",
    reasons,
  );

  if (input.schema_version !== REQUEST_SCHEMA_VERSION) reasons.push("request.unsupported-version");
  if (!nonEmptyString(input.request_id)) reasons.push("request.request_id.required");
  if (
    input.supersedes_request_id !== undefined
    && input.supersedes_request_id !== null
    && !nonEmptyString(input.supersedes_request_id)
  ) {
    reasons.push("request.supersedes_request_id.invalid");
  }
  const intent = normalizeIntent(input.intent, reasons);
  if (!plainObject(input.catalog_snapshot)) reasons.push("request.catalog_snapshot.expected-object");

  if (reasons.length > 0) return invalid(reasons);

  const normalized = canonicalizeJson({
    schema_version: REQUEST_SCHEMA_VERSION,
    request_id: input.request_id.trim(),
    intent,
    catalog_snapshot: input.catalog_snapshot,
    ...(input.supersedes_request_id
      ? {supersedes_request_id: input.supersedes_request_id.trim()}
      : {}),
  });
  const bytes = canonicalJson(normalized);
  return deepFreeze({
    ok: true,
    value: normalized,
    bytes,
    digest: sha256HexText(bytes),
  });
}
