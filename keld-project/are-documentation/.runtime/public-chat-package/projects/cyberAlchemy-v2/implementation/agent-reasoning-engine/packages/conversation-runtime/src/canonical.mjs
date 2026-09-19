import {createHash} from "node:crypto";

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

export function sealed(schemaVersion, material, digestKey) {
  const base = canonicalize({schema_version: schemaVersion, ...material, authority_effect: "none"});
  return freeze(canonicalize({...base, [digestKey]: digest(base)}));
}

export function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

