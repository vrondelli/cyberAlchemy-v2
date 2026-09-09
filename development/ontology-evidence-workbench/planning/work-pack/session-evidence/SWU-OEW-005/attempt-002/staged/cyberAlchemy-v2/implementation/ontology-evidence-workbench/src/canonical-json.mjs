import { createHash } from "node:crypto";

export class CanonicalJsonError extends Error {
  constructor(issue) {
    super(`canonical JSON rejected: ${issue}`);
    this.name = "CanonicalJsonError";
    this.code = "OEW_CANONICAL_JSON_REJECTED";
    this.issue = issue;
  }
}

function normalize(value, path, ancestors) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CanonicalJsonError(`NON_FINITE_NUMBER:${path}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") {
    throw new CanonicalJsonError(`UNSUPPORTED_VALUE:${path}:${typeof value}`);
  }
  if (ancestors.has(value)) {
    throw new CanonicalJsonError(`CYCLE:${path}`);
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const result = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new CanonicalJsonError(`SPARSE_ARRAY:${path}[${index}]`);
        }
        result.push(normalize(value[index], `${path}[${index}]`, ancestors));
      }
      return result;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new CanonicalJsonError(
        `NON_PLAIN_OBJECT:${path}:${prototype?.constructor?.name ?? "unknown"}`,
      );
    }

    const result = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = normalize(value[key], `${path}.${key}`, ancestors);
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJson(value) {
  return `${JSON.stringify(normalize(value, "$", new WeakSet()))}\n`;
}

export function canonicalBytes(value) {
  return Buffer.from(canonicalJson(value), "utf8");
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalSha256(value) {
  return sha256Bytes(canonicalBytes(value));
}
