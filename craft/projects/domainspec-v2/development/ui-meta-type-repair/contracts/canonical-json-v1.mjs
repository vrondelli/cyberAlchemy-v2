import { createHash } from "node:crypto";

export const CANONICALIZATION = "canonical-json-v1";
export const DIGEST_ALGORITHM = "sha256-v1";

export function canonicalize(value) {
  return JSON.stringify(normalize(value, "$"));
}

export function semanticProjection(record, semanticFields) {
  assertPlainObject(record, "record");
  if (!Array.isArray(semanticFields) || semanticFields.length === 0) {
    throw new TypeError("semantic fields must be a non-empty array");
  }
  const seen = new Set();
  const projection = {};
  for (const field of semanticFields) {
    if (typeof field !== "string" || field.length === 0 || seen.has(field)) {
      throw new TypeError("semantic fields must be unique non-empty strings");
    }
    seen.add(field);
    if (Object.hasOwn(record, field)) projection[field] = record[field];
  }
  return projection;
}

export function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalize(value), "utf8").digest("hex")}`;
}

export function contentDigest(record, semanticFields) {
  return sha256Canonical(semanticProjection(record, semanticFields));
}

export function deriveRecordId({ contractId, contractVersion, contentDigest: digest }) {
  requireString(contractId, "contractId");
  requireString(contractVersion, "contractVersion");
  requireDigest(digest, "contentDigest", "sha256");
  return `record:${sha256Canonical({ contract_id: contractId, contract_version: contractVersion, content_digest: digest })}`;
}

export function deriveGenerationId({ recordId, predecessorGenerationId = null, inputHandles = [] }) {
  requireDigest(recordId, "recordId", "record:sha256");
  if (predecessorGenerationId !== null) {
    requireDigest(predecessorGenerationId, "predecessorGenerationId", "generation:sha256");
  }
  assertSortedUniqueHandles(inputHandles);
  return `generation:${sha256Canonical({ input_handles: inputHandles, predecessor_generation_id: predecessorGenerationId, record_id: recordId })}`;
}

export function buildEnvelope({
  contractId,
  contractVersion,
  semanticFields,
  record,
  status = "valid",
  predecessorGenerationId = null,
  inputHandles = [],
  createdAt,
  storagePath,
  invalidationReason,
}) {
  const semantic = semanticProjection(record, semanticFields);
  const digest = sha256Canonical(semantic);
  const recordId = deriveRecordId({ contractId, contractVersion, contentDigest: digest });
  const generationId = deriveGenerationId({ recordId, predecessorGenerationId, inputHandles });
  const envelope = {
    schema_version: "ui-repair.record-envelope.v1",
    contract_id: contractId,
    contract_version: contractVersion,
    record_id: recordId,
    canonicalization: CANONICALIZATION,
    digest_algorithm: DIGEST_ALGORITHM,
    content_digest: digest,
    generation_id: generationId,
    predecessor_generation_id: predecessorGenerationId,
    input_handles: [...inputHandles],
    status,
    semantic,
  };
  if (createdAt !== undefined) envelope.created_at = createdAt;
  if (storagePath !== undefined) envelope.storage_path = storagePath;
  if (invalidationReason !== undefined) envelope.invalidation_reason = invalidationReason;
  return envelope;
}

export function validateEnvelope(envelope, semanticFields) {
  assertPlainObject(envelope, "envelope");
  if (envelope.schema_version !== "ui-repair.record-envelope.v1") throw new TypeError("unsupported envelope schema");
  if (envelope.canonicalization !== CANONICALIZATION) throw new TypeError("unsupported canonicalization");
  if (envelope.digest_algorithm !== DIGEST_ALGORITHM) throw new TypeError("unsupported digest algorithm");
  assertSortedUniqueHandles(envelope.input_handles);
  const expectedDigest = contentDigest(envelope.semantic, semanticFields);
  if (envelope.content_digest !== expectedDigest) throw new TypeError("content digest mismatch");
  const expectedRecordId = deriveRecordId({ contractId: envelope.contract_id, contractVersion: envelope.contract_version, contentDigest: expectedDigest });
  if (envelope.record_id !== expectedRecordId) throw new TypeError("record id mismatch");
  const expectedGenerationId = deriveGenerationId({ recordId: expectedRecordId, predecessorGenerationId: envelope.predecessor_generation_id, inputHandles: envelope.input_handles });
  if (envelope.generation_id !== expectedGenerationId) throw new TypeError("generation id mismatch");
  return true;
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
  const output = {};
  for (const key of Object.keys(value).sort()) output[key] = normalize(value[key], `${path}.${key}`);
  return output;
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label}: plain object required`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label}: plain object required`);
}

function assertSortedUniqueHandles(handles) {
  if (!Array.isArray(handles)) throw new TypeError("inputHandles must be an array");
  const sorted = [...handles].sort();
  for (let index = 0; index < handles.length; index += 1) {
    requireString(handles[index], `inputHandles[${index}]`);
    if (handles[index] !== sorted[index] || (index > 0 && handles[index] === handles[index - 1])) {
      throw new TypeError("inputHandles must be sorted and unique");
    }
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
