import {createHash, createPublicKey, verify} from "node:crypto";

export const REVIEWER_ATTESTATION_SCHEMA = "are.reviewer-attestation-payload/v1";
export const REVIEWER_SIGNATURE_SCHEMA = "are.reviewer-attestation-signature/v1";
export const REVIEWER_TRUST_REGISTRY_SCHEMA = "are.reviewer-trust-registry/v1";
export const REVIEWER_ATTESTATION_DOMAIN_PREFIX = "cyberalchemy/evolution-runtime/reviewer-attestation/v1";
export const REVIEWER_IDS = Object.freeze(["vlad", "dave"]);

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[a-z0-9](?:[a-z0-9._:/-]{0,254}[a-z0-9])?$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const MAX_CANONICAL_BYTES = 64 * 1024;

function plainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, keys) {
  return plainObject(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key));
}

function canonicalValue(value, seen = new Set()) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("reviewer-attestation.canonical-number-invalid");
    return value;
  }
  if (typeof value !== "object" || seen.has(value)) throw new TypeError("reviewer-attestation.canonical-value-invalid");
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map((item) => canonicalValue(item, seen));
  } else {
    if (!plainObject(value)) throw new TypeError("reviewer-attestation.canonical-object-invalid");
    result = {};
    for (const key of Object.keys(value).sort()) {
      if (key.includes("\u0000")) throw new TypeError("reviewer-attestation.canonical-key-invalid");
      result[key] = canonicalValue(value[key], seen);
    }
  }
  seen.delete(value);
  return result;
}

export function canonicalReviewerJson(value) {
  const bytes = Buffer.from(JSON.stringify(canonicalValue(value)), "utf8");
  if (bytes.length > MAX_CANONICAL_BYTES) throw new TypeError("reviewer-attestation.canonical-payload-too-large");
  return bytes;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function reviewerTrustRegistryDigest(registry) {
  return sha256(canonicalReviewerJson(registry));
}

export function reviewerAttestationSigningBytes(payload) {
  if (!plainObject(payload) || typeof payload.domain !== "string" || !IDENTIFIER.test(payload.domain)) {
    throw new TypeError("reviewer-attestation.domain-invalid");
  }
  const prefix = Buffer.from(`${REVIEWER_ATTESTATION_DOMAIN_PREFIX}\u0000${payload.domain}\u0000`, "utf8");
  return Buffer.concat([prefix, canonicalReviewerJson(payload)]);
}

function validTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function validBase64(value, byteLength) {
  if (typeof value !== "string" || !BASE64.test(value)) return false;
  const bytes = Buffer.from(value, "base64");
  return bytes.length === byteLength && bytes.toString("base64") === value;
}

function validateRegistry(registry, nowMs, expectedDigest, reasons) {
  const registryKeys = ["schema_version", "registry_id", "issued_at", "expires_at", "reviewers", "authority_effect"];
  if (!exactKeys(registry, registryKeys)) reasons.push("trust-registry-shape");
  if (registry?.schema_version !== REVIEWER_TRUST_REGISTRY_SCHEMA
    || !IDENTIFIER.test(registry?.registry_id ?? "")
    || registry?.authority_effect !== "none") reasons.push("trust-registry-identity");
  if (!validTimestamp(registry?.issued_at) || !validTimestamp(registry?.expires_at)
    || Date.parse(registry.issued_at) > nowMs || Date.parse(registry.expires_at) <= nowMs
    || Date.parse(registry.issued_at) >= Date.parse(registry.expires_at)) reasons.push("trust-registry-currentness");
  if (!HASH.test(expectedDigest ?? "") || reviewerTrustRegistryDigest(registry) !== expectedDigest) reasons.push("trust-registry-digest");
  if (!exactKeys(registry?.reviewers, REVIEWER_IDS)) reasons.push("trust-registry-reviewers");
  const vlad = registry?.reviewers?.vlad;
  const dave = registry?.reviewers?.dave;
  if (plainObject(vlad) && plainObject(dave)
    && (vlad.key_id === dave.key_id || vlad.public_key_spki_base64 === dave.public_key_spki_base64)) reasons.push("trust-registry-reviewer-key-uniqueness");
}

function validateKeyRecord(record, reviewerId, nowMs, issuedAtMs, reasons) {
  const keys = ["reviewer_id", "key_id", "algorithm", "public_key_spki_base64", "valid_from", "valid_until", "status", "revoked_at"];
  if (!exactKeys(record, keys)) reasons.push("key-record-shape");
  if (record?.reviewer_id !== reviewerId || !IDENTIFIER.test(record?.key_id ?? "") || record?.algorithm !== "Ed25519") reasons.push("key-record-identity");
  if (!validTimestamp(record?.valid_from) || !validTimestamp(record?.valid_until)
    || Date.parse(record.valid_from) > nowMs || Date.parse(record.valid_until) <= nowMs
    || Date.parse(record.valid_from) > issuedAtMs || Date.parse(record.valid_until) <= issuedAtMs) reasons.push("key-not-current");
  if (record?.status !== "active" || record?.revoked_at !== null) reasons.push("key-revoked");
  if (!validBase64(record?.public_key_spki_base64, 44)) reasons.push("public-key-encoding");
}

function validatePayload(payload, expected, nowMs, reasons) {
  const keys = ["schema_version", "domain", "reviewer_id", "decision", "artifact_bindings", "run_id", "issued_at", "expires_at", "nonce", "authority_effect"];
  if (!exactKeys(payload, keys)) reasons.push("payload-shape");
  if (payload?.schema_version !== REVIEWER_ATTESTATION_SCHEMA
    || !REVIEWER_IDS.includes(payload?.reviewer_id)
    || payload?.decision !== "PASS"
    || payload?.authority_effect !== "none") reasons.push("payload-identity");
  if (!IDENTIFIER.test(payload?.domain ?? "") || !IDENTIFIER.test(payload?.run_id ?? "") || !IDENTIFIER.test(payload?.nonce ?? "")) reasons.push("payload-identifiers");
  if (!plainObject(payload?.artifact_bindings) || Object.keys(payload.artifact_bindings).length === 0) reasons.push("artifact-bindings-shape");
  if (!validTimestamp(payload?.issued_at) || !validTimestamp(payload?.expires_at)
    || Date.parse(payload.issued_at) > nowMs || Date.parse(payload.expires_at) <= nowMs
    || Date.parse(payload.issued_at) >= Date.parse(payload.expires_at)) reasons.push("attestation-currentness");
  const expectedKeys = ["domain", "reviewer_id", "decision", "artifact_bindings", "run_id", "expires_at", "nonce"];
  if (!exactKeys(expected, expectedKeys)) reasons.push("expected-bindings-shape");
  else {
    for (const key of expectedKeys) {
      try {
        if (!canonicalReviewerJson(payload?.[key]).equals(canonicalReviewerJson(expected[key]))) reasons.push(`binding-${key.replaceAll("_", "-")}`);
      } catch {
        reasons.push(`binding-${key.replaceAll("_", "-")}`);
      }
    }
  }
}

function validateSignatureRecord(signature, reasons) {
  const keys = ["schema_version", "algorithm", "key_id", "signature_base64"];
  if (!exactKeys(signature, keys)) reasons.push("signature-shape");
  if (signature?.schema_version !== REVIEWER_SIGNATURE_SCHEMA || signature?.algorithm !== "Ed25519" || !IDENTIFIER.test(signature?.key_id ?? "")) reasons.push("signature-identity");
  if (!validBase64(signature?.signature_base64, 64)) reasons.push("signature-encoding");
}

export function verifyReviewerAttestation({trust_registry, trust_registry_sha256, payload, signature, expected, now} = {}) {
  const reasons = [];
  let payloadSha256 = null;
  try {
    if (!validTimestamp(now)) reasons.push("verification-time-invalid");
    const nowMs = validTimestamp(now) ? Date.parse(now) : Number.NaN;
    validateRegistry(trust_registry, nowMs, trust_registry_sha256, reasons);
    validatePayload(payload, expected, nowMs, reasons);
    validateSignatureRecord(signature, reasons);
    const key = plainObject(trust_registry?.reviewers) ? trust_registry.reviewers[payload?.reviewer_id] : null;
    const issuedAtMs = validTimestamp(payload?.issued_at) ? Date.parse(payload.issued_at) : Number.NaN;
    validateKeyRecord(key, payload?.reviewer_id, nowMs, issuedAtMs, reasons);
    if (key?.key_id !== signature?.key_id) reasons.push("signature-key-binding");
    const signingBytes = reviewerAttestationSigningBytes(payload);
    payloadSha256 = sha256(canonicalReviewerJson(payload));
    if (reasons.length === 0) {
      const publicKey = createPublicKey({key: Buffer.from(key.public_key_spki_base64, "base64"), format: "der", type: "spki"});
      if (publicKey.asymmetricKeyType !== "ed25519"
        || publicKey.export({format: "der", type: "spki"}).toString("base64") !== key.public_key_spki_base64) reasons.push("public-key-type");
      else if (!verify(null, signingBytes, publicKey, Buffer.from(signature.signature_base64, "base64"))) reasons.push("signature-invalid");
    }
  } catch {
    reasons.push("verification-failed");
  }
  return Object.freeze({
    ok: reasons.length === 0,
    reason_codes: Object.freeze([...new Set(reasons)].sort()),
    reviewer_id: REVIEWER_IDS.includes(payload?.reviewer_id) ? payload.reviewer_id : null,
    key_id: typeof signature?.key_id === "string" ? signature.key_id : null,
    payload_sha256: payloadSha256,
    trust_registry_sha256: HASH.test(trust_registry_sha256 ?? "") ? trust_registry_sha256 : null,
    authority_effect: "none",
  });
}
