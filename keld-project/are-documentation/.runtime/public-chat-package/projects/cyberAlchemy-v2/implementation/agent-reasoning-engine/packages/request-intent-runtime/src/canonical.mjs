import {createHash} from "node:crypto";

export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function uniqueText(values = []) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(text).map((value) => value.trim()))].sort();
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function sealed(schemaVersion, fields, digestField) {
  const material = canonicalize({schema_version: schemaVersion, ...fields, authority_effect: "none"});
  return deepFreeze({...material, [digestField]: digest(material)});
}

export function verifyDigest(record, digestField) {
  if (!isRecord(record) || !text(record[digestField])) return false;
  const {[digestField]: _digest, ...material} = record;
  return digest(material) === record[digestField];
}

export function failure(operation, reasonCodes, residue = []) {
  return deepFreeze({ok: false, operation, reason_codes: uniqueText(reasonCodes), residue: canonicalize(residue), authority_effect: "none"});
}

export function success(operation, value, extra = {}) {
  return deepFreeze({ok: true, operation, value, ...canonicalize(extra), authority_effect: "none"});
}
