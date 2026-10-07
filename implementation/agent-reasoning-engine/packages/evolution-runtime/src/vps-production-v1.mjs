import {isAbsolute, normalize} from "node:path";

import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {evolutionProtocolDigest} from "./protocol-v1.mjs";

export const VPS_RUNTIME_CONFIG_SCHEMA = "are.vps-runtime-config/v1";
export const VPS_PRODUCTION_ADMISSION_PROPOSAL_SCHEMA = "are.vps-production-admission-proposal/v1";
export const VPS_LAUNCH_DECISION_SCHEMA = "are.vps-launch-decision-envelope/v1";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const FAMILIES = ["contextbench", "are-dsh", "longmemeval"];
const SECRET = /(authorization\s*:|bearer\s+[A-Za-z0-9._-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|api[_-]?key\s*[=:]\s*[^,}\s]{8,})/i;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const identifier = (value) => text(value) && IDENTIFIER.test(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const freeze = (value) => deepFreeze(canonicalizeJson(value));

function result(ok, stage, reasons = [], value = null) {
  return freeze({schema_version: "are.vps-production-validation/v1", ok, stage, reason_codes: [...new Set(reasons)].sort(), ...(value === null ? {} : {value}), authority_effect: "none"});
}

function unknown(value, keys, prefix) {
  if (!object(value)) return [`${prefix}.object-required`];
  const allowed = new Set(keys);
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${prefix}.unknown-field:${key}`);
}

function path(value) {
  return text(value) && isAbsolute(value) && normalize(value) === value && !value.split("/").includes("..");
}

function limits(value) {
  return object(value) && Number.isSafeInteger(value.maximum_workers) && value.maximum_workers > 0 && Number.isSafeInteger(value.maximum_tokens) && value.maximum_tokens > 0 && finite(value.maximum_cost) && Number.isSafeInteger(value.maximum_elapsed_seconds) && value.maximum_elapsed_seconds > 0;
}

function validInstant(value) { return text(value) && Number.isFinite(Date.parse(value)); }

function seal(input, schemaVersion, digestKey, verifier) {
  if (!object(input)) throw new TypeError(`${schemaVersion} input must be an object.`);
  const material = canonicalizeJson({...input, schema_version: schemaVersion, authority_effect: "none"});
  delete material[digestKey];
  const value = freeze({...material, [digestKey]: evolutionProtocolDigest(material)});
  const checked = verifier(value);
  if (!checked.ok) throw new TypeError(`${schemaVersion} is invalid: ${checked.reason_codes.join(",")}`);
  return value;
}

function verifySeal(value, schemaVersion, digestKey, keys, stage, reasons) {
  reasons.push(...unknown(value, [...keys, "schema_version", digestKey, "authority_effect"], stage));
  if (value?.schema_version !== schemaVersion || value?.authority_effect !== "none") reasons.push(`${stage}.identity-invalid`);
  if (SECRET.test(JSON.stringify(value))) reasons.push(`${stage}.secret-shaped-data`);
  if (object(value)) { const material = canonicalizeJson({...value}); delete material[digestKey]; if (value[digestKey] !== evolutionProtocolDigest(material)) reasons.push(`${stage}.digest-invalid`); }
}

export function verifyVpsRuntimeConfig(value) {
  const stage = "vps-runtime-config";
  const reasons = [];
  verifySeal(value, VPS_RUNTIME_CONFIG_SCHEMA, "config_digest", ["config_ref", "execution_host", "roots", "gateway", "entrypoints", "capacity_limits", "archive_policy", "maximum_diagnostic_bytes", "live_dispatch_enabled"], stage, reasons);
  if (!identifier(value?.config_ref) || value?.execution_host !== "187.77.163.194") reasons.push(`${stage}.host-binding-invalid`);
  if (unknown(value?.roots, ["runtime_root", "workspace_root", "evidence_root", "archive_root"], `${stage}.roots`).length || Object.values(value?.roots ?? {}).some((item) => !path(item))) reasons.push(`${stage}.roots-invalid`);
  if (unknown(value?.gateway, ["container_ref", "endpoint_ref", "credential_ref", "credential_reference_path"], `${stage}.gateway`).length || ![value?.gateway?.container_ref, value?.gateway?.endpoint_ref, value?.gateway?.credential_ref].every(identifier) || !path(value?.gateway?.credential_reference_path)) reasons.push(`${stage}.gateway-invalid`);
  if (unknown(value?.entrypoints, FAMILIES, `${stage}.entrypoints`).length || FAMILIES.some((family) => !identifier(value?.entrypoints?.[family]))) reasons.push(`${stage}.entrypoints-invalid`);
  if (!limits(value?.capacity_limits)) reasons.push(`${stage}.capacity-invalid`);
  if (unknown(value?.archive_policy, ["hot_days", "warm_days", "cold_archive_ref"], `${stage}.archive`).length || !Number.isSafeInteger(value?.archive_policy?.hot_days) || value.archive_policy.hot_days < 0 || !Number.isSafeInteger(value?.archive_policy?.warm_days) || value.archive_policy.warm_days < value.archive_policy.hot_days || !identifier(value?.archive_policy?.cold_archive_ref)) reasons.push(`${stage}.archive-invalid`);
  if (!Number.isSafeInteger(value?.maximum_diagnostic_bytes) || value.maximum_diagnostic_bytes < 0 || typeof value?.live_dispatch_enabled !== "boolean") reasons.push(`${stage}.diagnostics-or-dispatch-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeVpsRuntimeConfig(input) { return seal(input, VPS_RUNTIME_CONFIG_SCHEMA, "config_digest", verifyVpsRuntimeConfig); }

export function verifyProductionAdmissionProposal(value) {
  const stage = "vps-admission-proposal";
  const reasons = [];
  verifySeal(value, VPS_PRODUCTION_ADMISSION_PROPOSAL_SCHEMA, "proposal_digest", ["proposal_ref", "runtime_config_digest", "cycle_definitions", "dispatcher_source_digest", "preflight_digest", "requested_posture", "owner_decision_ref"], stage, reasons);
  if (!identifier(value?.proposal_ref) || ![value?.runtime_config_digest, value?.dispatcher_source_digest, value?.preflight_digest].every((item) => HASH.test(item ?? "")) || value?.requested_posture !== "admit-and-enable" || value?.owner_decision_ref !== null) reasons.push(`${stage}.binding-invalid`);
  if (!Array.isArray(value?.cycle_definitions) || value.cycle_definitions.length !== FAMILIES.length || value.cycle_definitions.some((item) => unknown(item, ["family", "definition_ref", "definition_digest"], `${stage}.definition`).length || !FAMILIES.includes(item.family) || !identifier(item.definition_ref) || !HASH.test(item.definition_digest ?? "")) || new Set(value.cycle_definitions.map((item) => item.family)).size !== FAMILIES.length) reasons.push(`${stage}.definitions-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeProductionAdmissionProposal(input) { return seal(input, VPS_PRODUCTION_ADMISSION_PROPOSAL_SCHEMA, "proposal_digest", verifyProductionAdmissionProposal); }

export function verifyVpsLaunchDecision(value) {
  const stage = "vps-launch-decision";
  const reasons = [];
  verifySeal(value, VPS_LAUNCH_DECISION_SCHEMA, "decision_digest", ["decision_ref", "family", "admission_proposal_digest", "preflight_digest", "campaign_digest", "bundle_digest", "resource_limits", "expires_at", "authorized", "owner_decision_ref"], stage, reasons);
  if (!identifier(value?.decision_ref) || !FAMILIES.includes(value?.family) || ![value?.admission_proposal_digest, value?.preflight_digest, value?.campaign_digest, value?.bundle_digest].every((item) => HASH.test(item ?? "")) || !limits(value?.resource_limits) || !validInstant(value?.expires_at) || typeof value?.authorized !== "boolean") reasons.push(`${stage}.binding-invalid`);
  if (value?.authorized === true ? !identifier(value?.owner_decision_ref) : value?.owner_decision_ref !== null) reasons.push(`${stage}.owner-decision-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeVpsLaunchDecision(input) { return seal(input, VPS_LAUNCH_DECISION_SCHEMA, "decision_digest", verifyVpsLaunchDecision); }
