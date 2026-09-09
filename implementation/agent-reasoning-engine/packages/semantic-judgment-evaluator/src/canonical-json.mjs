import { createHash } from "node:crypto";

function normalize(value, path = "$") {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`non-finite number at ${path}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (item === undefined) {
        throw new TypeError(`undefined array item at ${path}[${index}]`);
      }
      return normalize(item, `${path}[${index}]`);
    });
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`non-plain object at ${path}`);
    }
    const result = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) {
        throw new TypeError(`undefined object field at ${path}.${key}`);
      }
      result[key] = normalize(value[key], `${path}.${key}`);
    }
    return result;
  }
  throw new TypeError(`unsupported canonical JSON value at ${path}`);
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

export function canonicalBytes(value) {
  return Buffer.from(canonicalJson(value), "utf8");
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function digestValue(value) {
  return sha256Bytes(canonicalBytes(value));
}

export function omitDigestFields(record) {
  const { digest: _digest, content_digest: _contentDigest, ...payload } = record;
  return payload;
}

export function sealRecord(record) {
  if (record.digest !== undefined || record.content_digest !== undefined) {
    throw new TypeError("record is already sealed");
  }
  const contentDigest = digestValue(record);
  return {
    ...record,
    digest: contentDigest,
    content_digest: contentDigest,
  };
}

export function verifyRecordDigest(record) {
  if (
    typeof record?.digest !== "string" ||
    typeof record?.content_digest !== "string"
  ) {
    return false;
  }
  const expected = digestValue(omitDigestFields(record));
  return record.digest === expected && record.content_digest === expected;
}
