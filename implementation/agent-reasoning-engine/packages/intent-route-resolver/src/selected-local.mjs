import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  sha256HexText,
} from "./canonical-json.mjs";
import {ROUTABLE_INTENT_SCHEMA_VERSION} from "./request.mjs";

export const SELECTED_LOCAL_RECORD_SCHEMA_VERSION = "intent-record.selected-local@1";
export const SELECTED_LOCAL_MAPPING_SCHEMA_VERSION = "intent-route.selected-local-map@1";

const FIELD_POSTURES = new Set(["declared", "inferred", "unresolved"]);
const RECORD_STATUSES = new Set(["candidate", "selected-local", "superseded"]);
const D39_FIELDS = Object.freeze([
  "constraints",
  "current_output_hypothesis",
  "purpose",
  "revision_route",
  "scope",
  "source",
  "target_pressure",
]);
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
  return [...new Set(result)].sort();
}

function normalizeField(value, path, reasons) {
  if (!plainObject(value)) {
    reasons.push(`${path}.expected-object`);
    return {
      posture: "unresolved",
      value: null,
      evidence_refs: [],
      inference_note: null,
    };
  }
  exactKeys(
    value,
    new Set(["posture", "value", "evidence_refs", "inference_note"]),
    path,
    reasons,
  );
  const evidenceRefs = stringSet(value.evidence_refs, `${path}.evidence_refs`, reasons);
  const posture = value.posture;
  const inferenceNote = value.inference_note ?? null;

  if (!FIELD_POSTURES.has(posture)) reasons.push(`${path}.unsupported-posture`);
  if (posture === "unresolved") {
    if (value.value !== null) reasons.push(`${path}.unresolved-value-must-be-null`);
    if (evidenceRefs.length > 0) reasons.push(`${path}.unresolved-evidence-must-be-empty`);
    if (inferenceNote !== null) reasons.push(`${path}.unresolved-note-must-be-null`);
  } else if (posture === "declared") {
    if (evidenceRefs.length === 0) reasons.push(`${path}.declared-evidence-required`);
    if (inferenceNote !== null) reasons.push(`${path}.declared-note-must-be-null`);
  } else if (posture === "inferred") {
    if (evidenceRefs.length === 0) reasons.push(`${path}.inferred-evidence-required`);
    if (!nonEmptyString(inferenceNote)) reasons.push(`${path}.inference-note-required`);
  }

  return canonicalizeJson({
    posture,
    value: value.value,
    evidence_refs: evidenceRefs,
    inference_note: inferenceNote === null ? null : String(inferenceNote).trim(),
  });
}

function invalid(subject, reasons) {
  return deepFreeze({
    ok: false,
    diagnostic: {
      schema_version: "intent-route.selected-local-invalid@1",
      subject,
      reason_codes: [...new Set(reasons)].sort(),
    },
  });
}

export function admitSelectedLocalRecord(input) {
  const reasons = [];
  try {
    canonicalizeJson(input);
  } catch (error) {
    return invalid("record", [`record.non-json:${error.message}`]);
  }
  if (!plainObject(input)) return invalid("record", ["record.expected-object"]);
  exactKeys(
    input,
    new Set(["intent_id", "record_schema", "record_status", "raw_intent", "intent"]),
    "record",
    reasons,
  );
  if (!nonEmptyString(input.intent_id)) reasons.push("record.intent_id.required");
  if (input.record_schema !== SELECTED_LOCAL_RECORD_SCHEMA_VERSION) {
    reasons.push("record.unsupported-version");
  }
  if (!RECORD_STATUSES.has(input.record_status)) reasons.push("record.record_status.invalid");

  let rawIntent = null;
  if (!plainObject(input.raw_intent)) {
    reasons.push("record.raw_intent.expected-object");
  } else {
    exactKeys(
      input.raw_intent,
      new Set(["text_or_ref", "source_ref", "captured_at"]),
      "record.raw_intent",
      reasons,
    );
    for (const field of ["text_or_ref", "source_ref", "captured_at"]) {
      if (!nonEmptyString(input.raw_intent[field])) {
        reasons.push(`record.raw_intent.${field}.required`);
      }
    }
    rawIntent = {
      text_or_ref: nonEmptyString(input.raw_intent.text_or_ref)
        ? input.raw_intent.text_or_ref
        : "",
      source_ref: nonEmptyString(input.raw_intent.source_ref)
        ? input.raw_intent.source_ref.trim()
        : "",
      captured_at: nonEmptyString(input.raw_intent.captured_at)
        ? input.raw_intent.captured_at.trim()
        : "",
    };
  }

  const intent = {};
  if (!plainObject(input.intent)) {
    reasons.push("record.intent.expected-object");
  } else {
    exactKeys(input.intent, new Set(D39_FIELDS), "record.intent", reasons);
    for (const field of D39_FIELDS) {
      if (!(field in input.intent)) reasons.push(`record.intent.${field}.required`);
      else intent[field] = normalizeField(input.intent[field], `record.intent.${field}`, reasons);
    }
  }

  if (reasons.length > 0) return invalid("record", reasons);
  return deepFreeze({
    ok: true,
    value: canonicalizeJson({
      intent_id: input.intent_id.trim(),
      record_schema: SELECTED_LOCAL_RECORD_SCHEMA_VERSION,
      record_status: input.record_status,
      raw_intent: rawIntent,
      intent,
    }),
  });
}

function normalizeMappingProfile(input, reasons) {
  if (!plainObject(input)) {
    reasons.push("profile.expected-object");
    return null;
  }
  exactKeys(
    input,
    new Set(["schema_version", "profile_id", "source_schema", "mappings", "content_digest"]),
    "profile",
    reasons,
  );
  if (input.schema_version !== SELECTED_LOCAL_MAPPING_SCHEMA_VERSION) {
    reasons.push("profile.unsupported-version");
  }
  if (!nonEmptyString(input.profile_id)) reasons.push("profile.profile_id.required");
  if (input.source_schema !== SELECTED_LOCAL_RECORD_SCHEMA_VERSION) {
    reasons.push("profile.source_schema.unsupported");
  }

  const mappings = {};
  if (!plainObject(input.mappings) || Object.keys(input.mappings).length === 0) {
    reasons.push("profile.mappings.non-empty-object-required");
  } else {
    const normalizedKeys = new Set();
    for (const sourceTarget of Object.keys(input.mappings).sort()) {
      const target = sourceTarget.trim();
      const source = input.mappings[sourceTarget];
      if (!target) reasons.push("profile.mappings.empty-target");
      if (!nonEmptyString(source)) reasons.push(`profile.mappings.${target}.source-required`);
      if (normalizedKeys.has(target)) reasons.push(`profile.mappings.duplicate-target:${target}`);
      normalizedKeys.add(target);
      if (target && nonEmptyString(source)) mappings[target] = source.trim();
    }
  }

  return canonicalizeJson({
    schema_version: SELECTED_LOCAL_MAPPING_SCHEMA_VERSION,
    profile_id: nonEmptyString(input.profile_id) ? input.profile_id.trim() : "",
    source_schema: input.source_schema,
    mappings,
  });
}

export function computeSelectedLocalMappingProfileDigest(input) {
  const reasons = [];
  try {
    canonicalizeJson(input);
  } catch (error) {
    throw new TypeError(`invalid mapping profile JSON: ${error.message}`);
  }
  const normalized = normalizeMappingProfile(input, reasons);
  if (reasons.length > 0) {
    throw new TypeError(`invalid mapping profile: ${[...new Set(reasons)].sort().join(",")}`);
  }
  return sha256HexText(canonicalJson(normalized));
}

export function sealSelectedLocalMappingProfile(input) {
  const material = {...input};
  delete material.content_digest;
  return canonicalizeJson({
    ...material,
    content_digest: computeSelectedLocalMappingProfileDigest(material),
  });
}

export function admitSelectedLocalMappingProfile(input) {
  const reasons = [];
  try {
    canonicalizeJson(input);
  } catch (error) {
    return invalid("profile", [`profile.non-json:${error.message}`]);
  }
  const normalized = normalizeMappingProfile(input, reasons);
  if (typeof input?.content_digest !== "string" || !SHA256.test(input.content_digest)) {
    reasons.push("profile.content_digest.invalid");
  } else if (
    normalized
    && sha256HexText(canonicalJson(normalized)) !== input.content_digest
  ) {
    reasons.push("profile.content_digest.mismatch");
  }
  if (reasons.length > 0) return invalid("profile", reasons);
  return deepFreeze({
    ok: true,
    value: canonicalizeJson({...normalized, content_digest: input.content_digest}),
  });
}

export function mapSelectedLocalIntent(recordInput, profileInput) {
  const profile = admitSelectedLocalMappingProfile(profileInput);
  if (!profile.ok) return profile;
  const record = admitSelectedLocalRecord(recordInput);
  if (!record.ok) return record;

  const discriminators = {};
  const mappedSources = new Set();
  for (const target of Object.keys(profile.value.mappings).sort()) {
    const source = profile.value.mappings[target];
    if (Object.hasOwn(record.value.intent, source)) {
      discriminators[target] = record.value.intent[source];
      mappedSources.add(source);
    } else {
      discriminators[target] = {
        posture: "unresolved",
        value: null,
        evidence_refs: [],
        inference_note: null,
      };
    }
  }

  const sourceDigest = sha256HexText(canonicalJson(record.value));
  return deepFreeze(canonicalizeJson({
    ok: true,
    value: {
      schema_version: ROUTABLE_INTENT_SCHEMA_VERSION,
      source_schema: SELECTED_LOCAL_RECORD_SCHEMA_VERSION,
      source_digest: sourceDigest,
      raw_intent: record.value.raw_intent.text_or_ref,
      discriminators,
      constraints: [],
    },
    receipt: {
      profile_id: profile.value.profile_id,
      profile_digest: profile.value.content_digest,
      source_digest: sourceDigest,
      mapped_discriminators: Object.keys(discriminators).sort(),
      unmapped_fields: D39_FIELDS.filter((field) => !mappedSources.has(field)),
      authority_effect: "none",
    },
  }));
}
