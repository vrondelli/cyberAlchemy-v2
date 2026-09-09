import {createHash} from "node:crypto";

export const INPUT_SCHEMA_VERSION = "intent-route.lineage-input@1";
export const OUTPUT_SCHEMA_VERSION = "reasoning-entry.lineage@1";

const INPUT_FIELDS = new Set([
  "schema_version",
  "intent_route_request_ref",
  "intent_route_disposition_ref",
]);
const REF_FIELDS = new Set(["artifact_ref", "content_digest"]);
const OUTPUT_FIELDS = new Set([
  "schema_version",
  "binding_posture",
  "intent_route_request_ref",
  "intent_route_disposition_ref",
  "authority_effect",
  "lineage_digest",
]);
const SHA256 = /^[0-9a-f]{64}$/;
const REF_SUFFIX = /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const REF_PREFIX = Object.freeze({
  intent_route_request_ref: "artifact://intent-route/request/",
  intent_route_disposition_ref: "artifact://intent-route/disposition/",
});

export class BindingReferenceError extends Error {
  constructor(reasonCode, message) {
    super(message);
    this.name = "BindingReferenceError";
    this.reason_code = reasonCode;
  }
}

function fail(reasonCode, message) {
  throw new BindingReferenceError(reasonCode, message);
}

function hasExactFields(value, fields) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.keys(value).length === fields.size
    && Object.keys(value).every((key) => fields.has(key));
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map(
    (key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
  ).join(",")}}`;
}

function digestValue(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const member of Object.values(value)) deepFreeze(member);
  }
  return value;
}

function admitArtifactRef(value, label) {
  if (!hasExactFields(value, REF_FIELDS)) {
    fail("BINDING_REFERENCE_SHAPE_INVALID", `${label} shape is closed`);
  }
  const artifactRef = value.artifact_ref;
  const prefix = REF_PREFIX[label];
  const suffix = (
    typeof artifactRef === "string" && typeof prefix === "string"
      ? artifactRef.slice(prefix.length)
      : ""
  );
  if (
    typeof artifactRef !== "string"
    || !artifactRef.startsWith(prefix)
    || !REF_SUFFIX.test(suffix)
    || artifactRef.trim() !== artifactRef
    || /[\u0000-\u001f\u007f]/u.test(artifactRef)
  ) {
    fail("BINDING_ARTIFACT_REF_INVALID", `${label}.artifact_ref is invalid`);
  }
  if (typeof value.content_digest !== "string" || !SHA256.test(value.content_digest)) {
    fail("BINDING_CONTENT_DIGEST_INVALID", `${label}.content_digest is invalid`);
  }
  return {
    artifact_ref: artifactRef,
    content_digest: value.content_digest,
  };
}

export function mapIntentRouteLineageReferences(input) {
  if (!hasExactFields(input, INPUT_FIELDS)) {
    fail("BINDING_INPUT_SHAPE_INVALID", "lineage input shape is closed");
  }
  if (input.schema_version !== INPUT_SCHEMA_VERSION) {
    fail("BINDING_VERSION_UNSUPPORTED", "lineage input version is unsupported");
  }
  const unsigned = {
    schema_version: OUTPUT_SCHEMA_VERSION,
    binding_posture: "candidate_local_non_integrated",
    intent_route_request_ref: admitArtifactRef(
      input.intent_route_request_ref,
      "intent_route_request_ref",
    ),
    intent_route_disposition_ref: admitArtifactRef(
      input.intent_route_disposition_ref,
      "intent_route_disposition_ref",
    ),
    authority_effect: "none",
  };
  return deepFreeze({...unsigned, lineage_digest: digestValue(unsigned)});
}

export function verifyIntentRouteLineageDigest(value) {
  if (!hasExactFields(value, OUTPUT_FIELDS)) return false;
  if (
    value.schema_version !== OUTPUT_SCHEMA_VERSION
    || value.binding_posture !== "candidate_local_non_integrated"
    || value.authority_effect !== "none"
    || typeof value.lineage_digest !== "string"
    || !SHA256.test(value.lineage_digest)
  ) return false;
  let requestRef;
  let dispositionRef;
  try {
    requestRef = admitArtifactRef(value.intent_route_request_ref, "intent_route_request_ref");
    dispositionRef = admitArtifactRef(
      value.intent_route_disposition_ref,
      "intent_route_disposition_ref",
    );
  } catch (error) {
    if (error instanceof BindingReferenceError) return false;
    throw error;
  }
  return value.lineage_digest === digestValue({
    schema_version: value.schema_version,
    binding_posture: value.binding_posture,
    intent_route_request_ref: requestRef,
    intent_route_disposition_ref: dispositionRef,
    authority_effect: value.authority_effect,
  });
}
