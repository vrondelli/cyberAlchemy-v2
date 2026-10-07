import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {isAbsolute, resolve} from "node:path";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {createBenchmarkFamilyValidators} from "./vps-benchmark-family-v1.mjs";
import {verifyBenchmarkCampaign} from "./vps-benchmark-protocol-v1.mjs";
import {deriveFamilyPrelaunchState, verifyFamilyPrelaunchState} from "./vps-prelaunch-v1.mjs";
import {evolutionProtocolDigest} from "./protocol-v1.mjs";

export const VPS_FAMILY_PREPARATION_SCHEMA = "are.vps-family-preparation/v1";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const FAMILIES = ["contextbench", "are-dsh", "longmemeval"];
const GATES = Object.freeze({contextbench: "G01", "are-dsh": "G02", longmemeval: "G03"});
const RUNNER_STATUSES = new Set(["missing", "candidate", "verified"]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const identifier = (value) => text(value) && IDENTIFIER.test(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const unique = (values) => [...new Set(values)].sort();

function exactKeys(value, keys, prefix) {
  if (!object(value)) return [`${prefix}.object-required`];
  const allowed = new Set(keys);
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${prefix}.unknown-field:${key}`);
}

function safeRelativePath(value) {
  return text(value) && !isAbsolute(value) && !value.split("/").includes("..") && !value.includes("\\");
}

function limits(value) {
  return object(value) && Number.isSafeInteger(value.maximum_calls) && value.maximum_calls > 0 &&
    Number.isSafeInteger(value.maximum_workers) && value.maximum_workers > 0 &&
    Number.isSafeInteger(value.maximum_tokens) && value.maximum_tokens > 0 &&
    typeof value.maximum_cost === "number" && Number.isFinite(value.maximum_cost) && value.maximum_cost >= 0 &&
    Number.isSafeInteger(value.maximum_elapsed_seconds) && value.maximum_elapsed_seconds > 0;
}

function validateInput(input) {
  const reasons = exactKeys(input, ["preparation_ref", "preflight_digest", "evidence_bindings", "lanes"], "preparation-input");
  if (!identifier(input?.preparation_ref) || !HASH.test(input?.preflight_digest ?? "")) reasons.push("preparation-input.identity-invalid");
  if (!Array.isArray(input?.evidence_bindings) || input.evidence_bindings.length === 0 || input.evidence_bindings.some((binding) =>
    exactKeys(binding, ["family", "role", "path", "sha256"], "preparation-evidence").length ||
    !FAMILIES.includes(binding.family) || !identifier(binding.role) || !safeRelativePath(binding.path) || !HASH.test(binding.sha256 ?? "")
  )) reasons.push("preparation-input.evidence-invalid");
  if (!Array.isArray(input?.lanes) || input.lanes.length !== FAMILIES.length || new Set(input.lanes.map((lane) => lane.family)).size !== FAMILIES.length) reasons.push("preparation-input.lanes-invalid");
  for (const lane of input?.lanes ?? []) {
    if (exactKeys(lane, ["gate_ref", "family", "campaign_ref", "planned_work_items", "campaign", "prerequisites", "evidence_refs", "runner", "proposed_limits"], "preparation-lane").length ||
      GATES[lane.family] !== lane.gate_ref || !identifier(lane.campaign_ref) || !Array.isArray(lane.planned_work_items) || lane.planned_work_items.length === 0 || lane.planned_work_items.some((item) => !identifier(item)) ||
      (lane.campaign !== null && (!verifyBenchmarkCampaign(lane.campaign).ok || lane.campaign.campaign_ref !== lane.campaign_ref)) || !object(lane.prerequisites) ||
      !Array.isArray(lane.evidence_refs) || lane.evidence_refs.some((item) => !safeRelativePath(item)) || (lane.proposed_limits !== null && !limits(lane.proposed_limits))) reasons.push(`preparation-input.lane-invalid:${lane.family ?? "unknown"}`);
    if (exactKeys(lane.runner, ["entrypoint_ref", "status", "source_hashes"], "preparation-runner").length || !identifier(lane.runner?.entrypoint_ref) || !RUNNER_STATUSES.has(lane.runner?.status) ||
      !Array.isArray(lane.runner?.source_hashes) || lane.runner.source_hashes.some((item) => !HASH.test(item))) reasons.push(`preparation-input.runner-invalid:${lane.family ?? "unknown"}`);
  }
  return unique(reasons);
}

export function materializeVpsFamilyPreparation(input) {
  const reasons = validateInput(input);
  if (reasons.length) throw new TypeError(`VPS family preparation input is invalid: ${reasons.join(",")}`);
  const validators = createBenchmarkFamilyValidators();
  const lanes = input.lanes.map((lane) => {
    const familyValidation = lane.campaign === null
      ? freeze({schema_version: "are.benchmark-family-validation/v1", family: lane.family, ok: false, reason_codes: ["benchmark-campaign.not-materialized"], authority_effect: "none"})
      : validators[lane.family](lane.campaign);
    const prelaunchState = deriveFamilyPrelaunchState({family: lane.family, campaign_ref: lane.campaign_ref, prerequisites: lane.prerequisites, evidence_refs: lane.evidence_refs});
    return canonicalizeJson({...lane, family_validation: familyValidation, prelaunch_state: prelaunchState, bundle_preparable: lane.campaign !== null && lane.proposed_limits !== null && familyValidation.ok && prelaunchState.disposition === "provider-free-ready" && lane.runner.status === "verified"});
  });
  const material = canonicalizeJson({schema_version: VPS_FAMILY_PREPARATION_SCHEMA, preparation_ref: input.preparation_ref, preflight_digest: input.preflight_digest, evidence_bindings: input.evidence_bindings, lanes, live_dispatch_admitted: false, authority_effect: "none"});
  const value = freeze({...material, preparation_digest: evolutionProtocolDigest(material)});
  const checked = verifyVpsFamilyPreparation(value);
  if (!checked.ok) throw new TypeError(`VPS family preparation is invalid: ${checked.reason_codes.join(",")}`);
  return value;
}

export function verifyVpsFamilyPreparation(value) {
  const reasons = exactKeys(value, ["schema_version", "preparation_ref", "preflight_digest", "evidence_bindings", "lanes", "live_dispatch_admitted", "authority_effect", "preparation_digest"], "preparation");
  if (value?.schema_version !== VPS_FAMILY_PREPARATION_SCHEMA || value?.authority_effect !== "none" || value?.live_dispatch_admitted !== false) reasons.push("preparation.identity-or-authority-invalid");
  const input = object(value) ? {preparation_ref: value.preparation_ref, preflight_digest: value.preflight_digest, evidence_bindings: value.evidence_bindings, lanes: Array.isArray(value.lanes) ? value.lanes.map(({family_validation: _validation, prelaunch_state: _state, bundle_preparable: _preparable, ...lane}) => lane) : value.lanes} : value;
  reasons.push(...validateInput(input));
  if (Array.isArray(value?.lanes)) {
    const validators = createBenchmarkFamilyValidators();
    for (const lane of value.lanes) {
      const expectedValidation = lane.campaign === null && FAMILIES.includes(lane.family)
        ? freeze({schema_version: "are.benchmark-family-validation/v1", family: lane.family, ok: false, reason_codes: ["benchmark-campaign.not-materialized"], authority_effect: "none"})
        : validators[lane.family]?.(lane.campaign);
      const expectedState = FAMILIES.includes(lane.family) ? deriveFamilyPrelaunchState({family: lane.family, campaign_ref: lane.campaign_ref, prerequisites: lane.prerequisites, evidence_refs: lane.evidence_refs}) : null;
      if (!expectedValidation || canonicalJson(expectedValidation) !== canonicalJson(lane.family_validation)) reasons.push(`preparation.family-validation-invalid:${lane.family ?? "unknown"}`);
      if (!expectedState || !verifyFamilyPrelaunchState(lane.prelaunch_state).ok || canonicalJson(expectedState) !== canonicalJson(lane.prelaunch_state)) reasons.push(`preparation.prelaunch-invalid:${lane.family ?? "unknown"}`);
      const expectedPreparable = lane.campaign !== null && lane.proposed_limits !== null && expectedValidation?.ok === true && expectedState?.disposition === "provider-free-ready" && lane.runner?.status === "verified";
      if (lane.bundle_preparable !== expectedPreparable) reasons.push(`preparation.bundle-posture-invalid:${lane.family ?? "unknown"}`);
    }
  }
  if (object(value)) {
    const material = canonicalizeJson({...value});
    delete material.preparation_digest;
    if (value.preparation_digest !== evolutionProtocolDigest(material)) reasons.push("preparation.digest-invalid");
  }
  return freeze({schema_version: "are.vps-family-preparation-validation/v1", ok: reasons.length === 0, reason_codes: unique(reasons), authority_effect: "none"});
}

export function verifyVpsFamilyPreparationEvidence(value, {root = process.cwd(), readFile = readFileSync} = {}) {
  const checked = verifyVpsFamilyPreparation(value);
  const mismatches = [];
  if (checked.ok) {
    for (const binding of value.evidence_bindings) {
      try {
        const actual = createHash("sha256").update(readFile(resolve(root, binding.path))).digest("hex");
        if (actual !== binding.sha256) mismatches.push({path: binding.path, reason: "sha256-mismatch", expected: binding.sha256, actual});
      } catch {
        mismatches.push({path: binding.path, reason: "source-unreadable", expected: binding.sha256, actual: null});
      }
    }
  }
  return freeze({schema_version: "are.vps-family-preparation-evidence-validation/v1", ok: checked.ok && mismatches.length === 0, preparation_digest: value?.preparation_digest ?? null, mismatches, authority_effect: "none"});
}
