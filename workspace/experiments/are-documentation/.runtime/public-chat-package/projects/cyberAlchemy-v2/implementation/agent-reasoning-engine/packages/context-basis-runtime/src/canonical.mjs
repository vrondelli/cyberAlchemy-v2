import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  sha256HexText,
} from "../../intent-route-resolver/index.mjs";
import {createHash} from "node:crypto";

export {canonicalJson, canonicalizeJson, deepFreeze, sha256HexText};

export const DIGEST_IMPLEMENTATIONS = Object.freeze(["node-crypto-sha256", "portable-js-sha256"]);

export function supportedDigestImplementation(value) {
  return DIGEST_IMPLEMENTATIONS.includes(value);
}

export function digestValue(value, implementation = "node-crypto-sha256") {
  if (!supportedDigestImplementation(implementation)) throw new TypeError(`Unsupported digest implementation: ${implementation}`);
  const bytes = canonicalJson(canonicalizeJson(value));
  return implementation === "portable-js-sha256"
    ? sha256HexText(bytes)
    : createHash("sha256").update(bytes, "utf8").digest("hex");
}

export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(nonEmptyString).map((item) => item.trim()))].sort();
}

export function fail(stage, reasonCodes, residue = []) {
  return deepFreeze(canonicalizeJson({
    schema_version: "are.context-basis-failure/v1",
    ok: false,
    stage,
    reason_codes: [...new Set(reasonCodes)].sort(),
    residue,
    authority_effect: "none",
    effect_calls: 0,
  }));
}

export function succeed(schemaVersion, value, extras = {}) {
  const canonicalValue = canonicalizeJson(value);
  return deepFreeze(canonicalizeJson({
    schema_version: schemaVersion,
    ok: true,
    value: canonicalValue,
    digest: digestValue(canonicalValue),
    authority_effect: "none",
    ...extras,
  }));
}
