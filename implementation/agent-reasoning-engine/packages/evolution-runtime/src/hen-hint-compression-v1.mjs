import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";

export const HEN_HINT_COMPRESSION_VERSION = "are.hen-hint-compression/v1";
export const HEN_HINT_PAYLOAD_SCHEMA = "are.hen-compressed-hints/v1";
export const HEN_HINT_POLICY = deepFreeze({
  policy_id: "hen-balanced-facet-round-robin/v1",
  maximum_payload_bytes: 4096,
  maximum_records: 16,
  maximum_records_per_path: 4,
});

const HASH = /^[a-f0-9]{64}$/;
const FIELD_ORDER = deepFreeze([
  "repository_relative_path",
  "start_line_inclusive",
  "end_line_inclusive",
  "content_sha256",
  "score_units",
  "facet",
]);

const freeze = (value) => deepFreeze(canonicalizeJson(value));
const utf8Compare = (left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
const byteLength = (value) => Buffer.byteLength(canonicalJson(value), "utf8");
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");

function failure(reasonCodes) {
  return freeze({
    schema_version: "are.hen-hint-compression-result/v1",
    ok: false,
    reason_codes: [...new Set(reasonCodes)].sort(),
    authority_effect: "none",
  });
}

function normalizedPath(value) {
  if (typeof value !== "string") return null;
  const path = value.normalize("NFC");
  if (!path || path !== value || Buffer.byteLength(path, "utf8") > 1024 || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return null;
  if (path.split("/").some((part) => part === "" || part === "." || part === "..")) return null;
  return path;
}

function normalizeRecord(value, index) {
  const reasons = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {reasons: [`hen-hints.record-invalid:${index}`]};
  const allowed = new Set(FIELD_ORDER);
  if (Object.keys(value).length !== allowed.size || Object.keys(value).some((key) => !allowed.has(key))) reasons.push(`hen-hints.record-fields-invalid:${index}`);
  const path = normalizedPath(value.repository_relative_path);
  if (path === null) reasons.push(`hen-hints.path-invalid:${index}`);
  if (!Number.isSafeInteger(value.start_line_inclusive) || value.start_line_inclusive < 1) reasons.push(`hen-hints.start-line-invalid:${index}`);
  if (!Number.isSafeInteger(value.end_line_inclusive) || value.end_line_inclusive < value.start_line_inclusive) reasons.push(`hen-hints.end-line-invalid:${index}`);
  if (typeof value.content_sha256 !== "string" || !HASH.test(value.content_sha256)) reasons.push(`hen-hints.content-hash-invalid:${index}`);
  if (!Number.isSafeInteger(value.score_units) || value.score_units < 0) reasons.push(`hen-hints.score-invalid:${index}`);
  if (typeof value.facet !== "string" || !value.facet || value.facet !== value.facet.normalize("NFC") || Buffer.byteLength(value.facet, "utf8") > 128) reasons.push(`hen-hints.facet-invalid:${index}`);
  if (reasons.length) return {reasons};
  return {reasons, value: freeze({
    repository_relative_path: path,
    start_line_inclusive: value.start_line_inclusive,
    end_line_inclusive: value.end_line_inclusive,
    content_sha256: value.content_sha256,
    score_units: value.score_units,
    facet: value.facet,
  })};
}

function compareRecords(left, right) {
  return right.score_units - left.score_units
    || utf8Compare(left.repository_relative_path, right.repository_relative_path)
    || left.start_line_inclusive - right.start_line_inclusive
    || left.end_line_inclusive - right.end_line_inclusive
    || utf8Compare(left.facet, right.facet);
}

function identity(record) {
  return [record.repository_relative_path, record.start_line_inclusive, record.end_line_inclusive, record.content_sha256].join("\0");
}

function tuple(record) {
  return FIELD_ORDER.map((field) => record[field]);
}

function payload(records, accounting) {
  return freeze({
    schema_version: HEN_HINT_PAYLOAD_SCHEMA,
    field_order: FIELD_ORDER,
    policy: HEN_HINT_POLICY,
    accounting,
    records: records.map(tuple),
    claim_ceiling: "Path-and-span references only; no source excerpts, gold-derived locations, token-fit claim, model call, or benchmark result.",
    authority_effect: "none",
  });
}

export function compressHenHints(input) {
  if (!Array.isArray(input) || input.length > 10000) return failure(["hen-hints.input-invalid"]);
  const normalized = input.map(normalizeRecord);
  const reasons = normalized.flatMap((entry) => entry.reasons);
  if (reasons.length) return failure(reasons);

  const bestByIdentity = new Map();
  for (const {value} of normalized) {
    const key = identity(value);
    const current = bestByIdentity.get(key);
    if (!current || compareRecords(value, current) < 0) bestByIdentity.set(key, value);
  }
  const unique = [...bestByIdentity.values()].sort(compareRecords);
  const byFacet = new Map();
  for (const record of unique) {
    if (!byFacet.has(record.facet)) byFacet.set(record.facet, []);
    byFacet.get(record.facet).push(record);
  }
  const facets = [...byFacet.keys()].sort(utf8Compare);
  const balanced = [];
  for (let rank = 0; balanced.length < unique.length; rank += 1) {
    let added = 0;
    for (const facet of facets) {
      const record = byFacet.get(facet)[rank];
      if (record) { balanced.push(record); added += 1; }
    }
    if (added === 0) break;
  }

  const selected = [];
  const pathCounts = new Map();
  let omittedPerPath = 0;
  let omittedRecordLimit = 0;
  for (const record of balanced) {
    const count = pathCounts.get(record.repository_relative_path) ?? 0;
    if (count >= HEN_HINT_POLICY.maximum_records_per_path) { omittedPerPath += 1; continue; }
    if (selected.length >= HEN_HINT_POLICY.maximum_records) { omittedRecordLimit += 1; continue; }
    selected.push(record);
    pathCounts.set(record.repository_relative_path, count + 1);
  }

  let omittedByteLimit = 0;
  let value;
  do {
    const accounting = freeze({
      input_records: input.length,
      unique_records: unique.length,
      selected_records: selected.length,
      omitted_duplicates: input.length - unique.length,
      omitted_per_path: omittedPerPath,
      omitted_record_limit: omittedRecordLimit,
      omitted_byte_limit: omittedByteLimit,
    });
    value = payload(selected, accounting);
    if (byteLength(value) <= HEN_HINT_POLICY.maximum_payload_bytes) break;
    if (selected.length === 0) return failure(["hen-hints.metadata-exceeds-byte-ceiling"]);
    selected.pop();
    omittedByteLimit += 1;
  } while (true);

  return freeze({
    schema_version: "are.hen-hint-compression-result/v1",
    ok: true,
    operation: "compress-hen-hints",
    value,
    payload_bytes: byteLength(value),
    payload_digest: digest(value),
    provider_calls: 0,
    model_calls: 0,
    authority_effect: "none",
  });
}

export function verifyCompressedHenHints(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return failure(["hen-hints.payload-invalid"]);
  const reasons = [];
  if (value.schema_version !== HEN_HINT_PAYLOAD_SCHEMA) reasons.push("hen-hints.payload-schema-invalid");
  if (canonicalJson(value.field_order) !== canonicalJson(FIELD_ORDER)) reasons.push("hen-hints.field-order-invalid");
  if (canonicalJson(value.policy) !== canonicalJson(HEN_HINT_POLICY)) reasons.push("hen-hints.policy-invalid");
  if (!Array.isArray(value.records) || value.records.length > HEN_HINT_POLICY.maximum_records) reasons.push("hen-hints.records-invalid");
  if (value.authority_effect !== "none") reasons.push("hen-hints.authority-invalid");
  if (byteLength(value) > HEN_HINT_POLICY.maximum_payload_bytes) reasons.push("hen-hints.byte-ceiling-exceeded");
  const pathCounts = new Map();
  for (const record of value.records ?? []) {
    if (!Array.isArray(record) || record.length !== FIELD_ORDER.length) { reasons.push("hen-hints.record-tuple-invalid"); continue; }
    const expanded = Object.fromEntries(FIELD_ORDER.map((field, index) => [field, record[index]]));
    if (normalizeRecord(expanded, 0).reasons.length) reasons.push("hen-hints.record-value-invalid");
    const path = expanded.repository_relative_path;
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
  }
  if ([...pathCounts.values()].some((count) => count > HEN_HINT_POLICY.maximum_records_per_path)) reasons.push("hen-hints.per-path-ceiling-exceeded");
  return reasons.length ? failure(reasons) : freeze({schema_version: "are.hen-hint-compression-result/v1", ok: true, operation: "verify-compressed-hen-hints", value, payload_bytes: byteLength(value), payload_digest: digest(value), authority_effect: "none"});
}
