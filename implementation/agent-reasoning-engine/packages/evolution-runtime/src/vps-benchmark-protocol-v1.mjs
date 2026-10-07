import {isAbsolute, normalize} from "node:path";

import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {evolutionProtocolDigest} from "./protocol-v1.mjs";

export const VPS_BENCHMARK_PROTOCOL_VERSION = "are.vps-benchmark-protocol/v1";
export const VPS_EXECUTION_BUNDLE_SCHEMA = "are.vps-execution-bundle/v1";
export const BENCHMARK_CAMPAIGN_SCHEMA = "are.benchmark-campaign/v1";
export const VPS_WORKER_ASSIGNMENT_SCHEMA = "are.vps-worker-assignment/v1";
export const VPS_WORKER_RESULT_SCHEMA = "are.vps-worker-result/v1";
export const VPS_PREFLIGHT_RESULT_SCHEMA = "are.vps-preflight-result/v1";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const FAMILIES = new Set(["contextbench", "are-dsh", "longmemeval"]);
const TERMINAL = new Set(["succeeded", "retryable-failure", "failed", "cancelled"]);
const SECRET = /(authorization\s*:|bearer\s+[A-Za-z0-9._-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|api[_-]?key\s*[=:]\s*[^,}\s]{8,})/i;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const identifier = (value) => text(value) && IDENTIFIER.test(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const unique = (values) => [...new Set(values)].sort();

function result(ok, stage, reasonCodes = [], value = null) {
  return freeze({schema_version: "are.vps-benchmark-validation/v1", ok, stage, reason_codes: unique(reasonCodes), ...(value === null ? {} : {value}), authority_effect: "none"});
}

function exactKeys(value, keys, prefix) {
  if (!object(value)) return [`${prefix}.object-required`];
  const allowed = new Set(keys);
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${prefix}.unknown-field:${key}`);
}

function validPath(value) {
  return text(value) && isAbsolute(value) && normalize(value) === value && !value.split("/").includes("..");
}

function validInstant(value) {
  return text(value) && Number.isFinite(Date.parse(value));
}

function resourceLimits(value) {
  return object(value) && Number.isSafeInteger(value.maximum_workers) && value.maximum_workers > 0 &&
    Number.isSafeInteger(value.maximum_tokens) && value.maximum_tokens > 0 && finite(value.maximum_cost) &&
    Number.isSafeInteger(value.maximum_elapsed_seconds) && value.maximum_elapsed_seconds > 0;
}

function accounting(value) {
  return object(value) && Number.isSafeInteger(value.calls) && value.calls >= 0 && Number.isSafeInteger(value.tokens) && value.tokens >= 0 && finite(value.cost) && finite(value.elapsed_seconds);
}

function secretShaped(value) {
  return SECRET.test(JSON.stringify(value));
}

function seal(input, schemaVersion, digestKey, verify) {
  if (!object(input)) throw new TypeError(`${schemaVersion} input must be an object.`);
  const material = canonicalizeJson({...input, schema_version: schemaVersion, authority_effect: "none"});
  delete material[digestKey];
  const document = freeze({...material, [digestKey]: evolutionProtocolDigest(material)});
  const checked = verify(document);
  if (!checked.ok) throw new TypeError(`${schemaVersion} is invalid: ${checked.reason_codes.join(",")}`);
  return document;
}

function verifySeal(value, schemaVersion, digestKey, allowedKeys, reasons, stage) {
  reasons.push(...exactKeys(value, [...allowedKeys, "schema_version", digestKey, "authority_effect"], stage));
  if (value?.schema_version !== schemaVersion) reasons.push(`${stage}.schema-invalid`);
  if (value?.authority_effect !== "none") reasons.push(`${stage}.authority-invalid`);
  if (object(value)) {
    const material = canonicalizeJson({...value});
    delete material[digestKey];
    if (value[digestKey] !== evolutionProtocolDigest(material)) reasons.push(`${stage}.digest-invalid`);
  }
  if (secretShaped(value)) reasons.push(`${stage}.secret-shaped-data`);
}

export function verifyVpsExecutionBundle(value) {
  const stage = "vps-bundle";
  const reasons = [];
  verifySeal(value, VPS_EXECUTION_BUNDLE_SCHEMA, "bundle_digest", ["bundle_ref", "family", "campaign_ref", "execution_host", "source_hashes", "executable", "roots", "model_ref", "tokenizer_ref", "harness_ref", "scorer_ref", "credential_ref", "resource_limits", "expires_at", "output_contract"], reasons, stage);
  if (!identifier(value?.bundle_ref) || !FAMILIES.has(value?.family) || !identifier(value?.campaign_ref) || value?.execution_host !== "187.77.163.194") reasons.push(`${stage}.identity-invalid`);
  if (!Array.isArray(value?.source_hashes) || value.source_hashes.length === 0 || value.source_hashes.some((item) => exactKeys(item, ["path", "sha256"], `${stage}.source`).length || !text(item.path) || !HASH.test(item.sha256 ?? ""))) reasons.push(`${stage}.source-hashes-invalid`);
  if (exactKeys(value?.executable, ["entrypoint_ref", "arguments"], `${stage}.executable`).length || !identifier(value?.executable?.entrypoint_ref) || !Array.isArray(value?.executable?.arguments) || value.executable.arguments.some((item) => !text(item))) reasons.push(`${stage}.executable-invalid`);
  if (exactKeys(value?.roots, ["runtime_root", "workspace_root", "evidence_root"], `${stage}.roots`).length || Object.values(value?.roots ?? {}).some((path) => !validPath(path))) reasons.push(`${stage}.roots-invalid`);
  if (![value?.model_ref, value?.tokenizer_ref, value?.harness_ref, value?.scorer_ref, value?.credential_ref].every(identifier)) reasons.push(`${stage}.binding-invalid`);
  if (value?.model_ref !== "glm-5.3-flash") reasons.push(`${stage}.model-invalid`);
  if (!resourceLimits(value?.resource_limits) || !validInstant(value?.expires_at)) reasons.push(`${stage}.resource-or-expiry-invalid`);
  if (exactKeys(value?.output_contract, ["artifact_roles", "maximum_diagnostic_bytes"], `${stage}.output`).length || !Array.isArray(value?.output_contract?.artifact_roles) || value.output_contract.artifact_roles.length === 0 || value.output_contract.artifact_roles.some((item) => !identifier(item)) || !Number.isSafeInteger(value?.output_contract?.maximum_diagnostic_bytes) || value.output_contract.maximum_diagnostic_bytes < 0) reasons.push(`${stage}.output-contract-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeVpsExecutionBundle(input) {
  return seal(input, VPS_EXECUTION_BUNDLE_SCHEMA, "bundle_digest", verifyVpsExecutionBundle);
}

export function verifyBenchmarkCampaign(value) {
  const stage = "benchmark-campaign";
  const reasons = [];
  verifySeal(value, BENCHMARK_CAMPAIGN_SCHEMA, "campaign_digest", ["campaign_ref", "family", "model_ref", "work_items", "source_bindings", "budgets", "comparison_posture", "family_policy"], reasons, stage);
  if (!identifier(value?.campaign_ref) || !FAMILIES.has(value?.family) || value?.model_ref !== "glm-5.3-flash") reasons.push(`${stage}.identity-invalid`);
  if (!Array.isArray(value?.work_items) || value.work_items.length === 0 || value.work_items.some((item) => exactKeys(item, ["task_ref", "source_ref"], `${stage}.work-item`).length || !identifier(item.task_ref) || !identifier(item.source_ref))) reasons.push(`${stage}.work-items-invalid`);
  if (!Array.isArray(value?.source_bindings) || value.source_bindings.length === 0 || value.source_bindings.some((item) => exactKeys(item, ["source_ref", "sha256"], `${stage}.source`).length || !identifier(item.source_ref) || !HASH.test(item.sha256 ?? ""))) reasons.push(`${stage}.source-bindings-invalid`);
  if (!resourceLimits(value?.budgets) || !identifier(value?.comparison_posture) || !object(value?.family_policy)) reasons.push(`${stage}.policy-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeBenchmarkCampaign(input) {
  return seal(input, BENCHMARK_CAMPAIGN_SCHEMA, "campaign_digest", verifyBenchmarkCampaign);
}

export function verifyWorkerAssignment(value) {
  const stage = "vps-assignment";
  const reasons = [];
  verifySeal(value, VPS_WORKER_ASSIGNMENT_SCHEMA, "assignment_digest", ["assignment_ref", "bundle_ref", "bundle_digest", "campaign_ref", "campaign_digest", "cycle_ref", "phase", "task_ref", "lease_ref", "fencing_token", "reservation_ref", "worker_ref", "input_artifacts", "expires_at"], reasons, stage);
  if (![value?.assignment_ref, value?.bundle_ref, value?.campaign_ref, value?.cycle_ref, value?.phase, value?.task_ref, value?.lease_ref, value?.reservation_ref, value?.worker_ref].every(identifier) || ![value?.bundle_digest, value?.campaign_digest, value?.fencing_token].every((item) => HASH.test(item ?? ""))) reasons.push(`${stage}.binding-invalid`);
  if (!Array.isArray(value?.input_artifacts) || value.input_artifacts.some((item) => !identifier(item)) || !validInstant(value?.expires_at)) reasons.push(`${stage}.inputs-or-expiry-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeWorkerAssignment(input) {
  return seal(input, VPS_WORKER_ASSIGNMENT_SCHEMA, "assignment_digest", verifyWorkerAssignment);
}

function artifactIdentity(value) {
  return exactKeys(value, ["artifact_id", "sha256", "byte_length", "media_type", "criterion_id"], "vps-result.artifact").length === 0 && value?.artifact_id === `sha256:${value?.sha256}` && HASH.test(value?.sha256 ?? "") && Number.isSafeInteger(value?.byte_length) && value.byte_length >= 0 && text(value?.media_type) && identifier(value?.criterion_id);
}

export function verifyWorkerResult(value) {
  const stage = "vps-result";
  const reasons = [];
  verifySeal(value, VPS_WORKER_RESULT_SCHEMA, "result_digest", ["result_ref", "assignment_ref", "assignment_digest", "bundle_digest", "cycle_ref", "phase", "task_ref", "lease_ref", "fencing_token", "worker_ref", "disposition", "artifacts", "accounting", "window_admission", "scorer_ref", "judge_ref", "completed_at", "diagnostics"], reasons, stage);
  if (![value?.result_ref, value?.assignment_ref, value?.cycle_ref, value?.phase, value?.task_ref, value?.lease_ref, value?.worker_ref, value?.scorer_ref].every(identifier) || ![value?.assignment_digest, value?.bundle_digest, value?.fencing_token].every((item) => HASH.test(item ?? "")) || !TERMINAL.has(value?.disposition)) reasons.push(`${stage}.binding-invalid`);
  if (!Array.isArray(value?.artifacts) || value.artifacts.length === 0 || value.artifacts.some((item) => !artifactIdentity(item))) reasons.push(`${stage}.artifacts-invalid`);
  if (!accounting(value?.accounting)) reasons.push(`${stage}.accounting-invalid`);
  if (exactKeys(value?.window_admission, ["token_count", "context_limit", "admitted"], `${stage}.window`).length || !Number.isSafeInteger(value?.window_admission?.token_count) || !Number.isSafeInteger(value?.window_admission?.context_limit) || typeof value?.window_admission?.admitted !== "boolean") reasons.push(`${stage}.window-invalid`);
  if (value?.judge_ref !== null && value?.judge_ref !== undefined && !identifier(value.judge_ref)) reasons.push(`${stage}.judge-invalid`);
  if (!validInstant(value?.completed_at) || !Array.isArray(value?.diagnostics) || value.diagnostics.some((item) => !text(item) || Buffer.byteLength(item) > 4096)) reasons.push(`${stage}.completion-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeWorkerResult(input) {
  return seal(input, VPS_WORKER_RESULT_SCHEMA, "result_digest", verifyWorkerResult);
}

export function verifyVpsPreflightResult(value) {
  const stage = "vps-preflight";
  const reasons = [];
  verifySeal(value, VPS_PREFLIGHT_RESULT_SCHEMA, "preflight_digest", ["preflight_ref", "execution_host", "container_ref", "runtime_versions", "available_memory_bytes", "available_disk_bytes", "source_present", "evidence_root_writable", "gateway_present", "credential_reference_present", "active_conflicting_workers", "checked_at"], reasons, stage);
  if (!identifier(value?.preflight_ref) || value?.execution_host !== "187.77.163.194" || !identifier(value?.container_ref) || !object(value?.runtime_versions) || Object.values(value.runtime_versions).some((item) => !text(item))) reasons.push(`${stage}.identity-invalid`);
  if (![value?.available_memory_bytes, value?.available_disk_bytes, value?.active_conflicting_workers].every((item) => Number.isSafeInteger(item) && item >= 0) || ![value?.source_present, value?.evidence_root_writable, value?.gateway_present, value?.credential_reference_present].every((item) => typeof item === "boolean") || !validInstant(value?.checked_at)) reasons.push(`${stage}.checks-invalid`);
  return reasons.length ? result(false, stage, reasons) : result(true, stage, [], value);
}

export function materializeVpsPreflightResult(input) {
  return seal(input, VPS_PREFLIGHT_RESULT_SCHEMA, "preflight_digest", verifyVpsPreflightResult);
}
