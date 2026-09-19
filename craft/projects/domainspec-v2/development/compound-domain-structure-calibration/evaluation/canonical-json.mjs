import { createHash } from "node:crypto";

export const CANONICALIZATION = "canonical-json-v1";
export const DIGEST_ALGORITHM = "sha256-v1";

export function canonicalize(value) {
  return JSON.stringify(normalize(value, "$"));
}

export function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalize(value), "utf8").digest("hex")}`;
}

export function semanticProjection(record, semanticFields) {
  assertPlainObject(record, "record");
  if (!Array.isArray(semanticFields) || semanticFields.length === 0) {
    throw new TypeError("semantic fields must be a non-empty array");
  }
  const projection = {};
  const seen = new Set();
  for (const field of semanticFields) {
    requireString(field, "semantic field");
    if (seen.has(field)) throw new TypeError("semantic fields must be unique");
    seen.add(field);
    if (Object.hasOwn(record, field)) projection[field] = record[field];
  }
  return projection;
}

export function contentDigest(record, semanticFields = ["semantic", "prohibited_inferences"]) {
  return sha256Canonical(semanticProjection(record, semanticFields));
}

export function deriveRecordId({ contractId, contractVersion, contentDigest: digest }) {
  requireString(contractId, "contractId");
  requireString(contractVersion, "contractVersion");
  requireDigest(digest, "contentDigest", "sha256");
  return `record:${sha256Canonical({
    contract_id: contractId,
    contract_version: contractVersion,
    content_digest: digest,
  })}`;
}

export function deriveGenerationId({ recordId, predecessorGenerationId = null, inputHandles = [] }) {
  requireDigest(recordId, "recordId", "record:sha256");
  if (predecessorGenerationId !== null) {
    requireDigest(predecessorGenerationId, "predecessorGenerationId", "generation:sha256");
  }
  const normalizedHandles = sortedUniqueStrings(inputHandles, "inputHandles");
  return `generation:${sha256Canonical({
    input_handles: normalizedHandles,
    predecessor_generation_id: predecessorGenerationId,
    record_id: recordId,
  })}`;
}

export function buildEnvelope({
  schemaVersion,
  contractId,
  contractVersion = "1.0.0",
  status,
  semantic,
  prohibitedInferences,
  predecessorGenerationId = null,
  inputHandles = [],
  createdAt,
  storagePath,
}) {
  requireString(schemaVersion, "schemaVersion");
  requireString(status, "status");
  assertPlainObject(semantic, "semantic");
  const normalizedHandles = sortedUniqueStrings(inputHandles, "inputHandles");
  const normalizedProhibitions = sortedUniqueStrings(prohibitedInferences, "prohibitedInferences");

  const seed = {
    semantic,
    prohibited_inferences: normalizedProhibitions,
  };
  const digest = contentDigest(seed);
  const recordId = deriveRecordId({ contractId, contractVersion, contentDigest: digest });
  const generationId = deriveGenerationId({ recordId, predecessorGenerationId, inputHandles: normalizedHandles });
  const envelope = {
    schema_version: schemaVersion,
    contract_id: contractId,
    contract_version: contractVersion,
    record_id: recordId,
    canonicalization: CANONICALIZATION,
    digest_algorithm: DIGEST_ALGORITHM,
    content_digest: digest,
    generation_id: generationId,
    predecessor_generation_id: predecessorGenerationId,
    input_handles: normalizedHandles,
    status,
    semantic,
    prohibited_inferences: normalizedProhibitions,
  };
  if (createdAt !== undefined) envelope.created_at = createdAt;
  if (storagePath !== undefined) envelope.storage_path = storagePath;
  return envelope;
}

export function validateEnvelope(
  envelope,
  { schemaVersion, contractId, contractVersion = "1.0.0", semanticFields = ["semantic", "prohibited_inferences"] },
) {
  assertPlainObject(envelope, "envelope");
  if (envelope.schema_version !== schemaVersion) throw new TypeError("unsupported envelope schema");
  if (envelope.contract_id !== contractId) throw new TypeError("unsupported contract id");
  if (envelope.contract_version !== contractVersion) throw new TypeError("unsupported contract version");
  if (envelope.canonicalization !== CANONICALIZATION) throw new TypeError("unsupported canonicalization");
  if (envelope.digest_algorithm !== DIGEST_ALGORITHM) throw new TypeError("unsupported digest algorithm");
  assertUniqueStrings(envelope.input_handles, "input handles");
  assertUniqueStrings(envelope.prohibited_inferences, "prohibited inferences");

  const expectedDigest = contentDigest(envelope, semanticFields);
  if (envelope.content_digest !== expectedDigest) throw new TypeError("content digest mismatch");
  const expectedRecordId = deriveRecordId({
    contractId: envelope.contract_id,
    contractVersion: envelope.contract_version,
    contentDigest: expectedDigest,
  });
  if (envelope.record_id !== expectedRecordId) throw new TypeError("record id mismatch");
  const expectedGenerationId = deriveGenerationId({
    recordId: expectedRecordId,
    predecessorGenerationId: envelope.predecessor_generation_id,
    inputHandles: envelope.input_handles,
  });
  if (envelope.generation_id !== expectedGenerationId) throw new TypeError("generation id mismatch");
  return true;
}

export function sortedUniqueStrings(values, label = "values") {
  if (!Array.isArray(values)) throw new TypeError(`${label} must be an array`);
  const output = [...values];
  for (const value of output) requireString(value, label);
  output.sort();
  for (let index = 1; index < output.length; index += 1) {
    if (output[index] === output[index - 1]) throw new TypeError(`${label} must be unique`);
  }
  return output;
}

function normalize(value, path) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${path}: numbers must be safe integers`);
    return value;
  }
  if (Array.isArray(value)) {
    const output = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) throw new TypeError(`${path}[${index}]: sparse arrays are invalid`);
      output.push(normalize(value[index], `${path}[${index}]`));
    }
    return output;
  }
  assertPlainObject(value, path);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key], `${path}.${key}`)]));
}

function assertUniqueStrings(values, label) {
  if (!Array.isArray(values)) throw new TypeError(`${label} must be an array`);
  for (const value of values) requireString(value, label);
  if (new Set(values).size !== values.length) throw new TypeError(`${label} must be unique`);
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label}: plain object required`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label}: plain object required`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
}

function requireDigest(value, label, prefix) {
  requireString(value, label);
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^${escaped}:[a-f0-9]{64}$`).test(value)) throw new TypeError(`${label} has invalid format`);
}
