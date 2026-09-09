import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {loadRepositoryProfile, REQUEST_CONTEXT_KEY} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {canonicalJson, canonicalizeJson, deepFreeze} from "../../../packages/intent-route-resolver/index.mjs";
import {projectBenchmarkFailuresToHypotheses} from "../../../packages/evolution-runtime/index.mjs";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const repositoryRoot = resolve(packageRoot, "../../../../..");

export function loadRuntime(profile) {
  const path = resolve(packageRoot, profile.wrapper_profile);
  const loaded = loadRepositoryProfile(path, repositoryRoot);
  if (!loaded.ok) throw new Error(`Repository profile failed: ${(loaded.reason_codes ?? []).join(",")}`);
  return loaded;
}

export function requestContext(rawRequest, objectiveKind = null, requestId = "benchmark") {
  return {schema_version: "are.request-context/v1", request_id: requestId, raw_request: rawRequest, objective_kind: objectiveKind, requested_effects: [], target_refs: [], constraints: [], evidence_refs: ["benchmark:fixture"]};
}

export function contextHint(rawRequest, objectiveKind = null) {
  return {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify({schema_version: "are.request-context-hint/v1", raw_request: rawRequest, objective_kind: objectiveKind})}};
}

export function turnMessage(id, threadId, rawRequest, objectiveKind = null) {
  return {jsonrpc: "2.0", id, method: "turn/start", params: {threadId, input: [{type: "text", text: rawRequest}], additionalContext: contextHint(rawRequest, objectiveKind)}};
}

export function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
}

export function timing(fn, warm, iterations) {
  for (let index = 0; index < warm; index += 1) fn(index);
  const values = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now(); fn(index); values.push(performance.now() - start);
  }
  return {iterations, mean_ms: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length), p50_ms: percentile(values, 0.5), p95_ms: percentile(values, 0.95), max_ms: Math.max(0, ...values)};
}

export function sha256(value) { return createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex"); }
export function readProfileBytes(profile) { return readFileSync(resolve(packageRoot, "profile.json"), "utf8"); }
export function ratio(part, total) { return total === 0 ? 1 : part / total; }
export function reasonsFromAction(action) { return action?.to_client?.flatMap((message) => message.error?.data?.reason_codes ?? []) ?? []; }

export function attachImprovementFeedback(result) {
  if (result?.improvement_feedback) return deepFreeze(canonicalizeJson(result));
  const expectedResultDigest = sha256(canonicalJson(canonicalizeJson(result)));
  const projected = projectBenchmarkFailuresToHypotheses({benchmark_result: result, expected_result_digest: expectedResultDigest});
  if (!projected.ok) throw new Error(`Failure-to-hypothesis projection failed: ${projected.reason_codes.join(",")}`);
  return deepFreeze(canonicalizeJson({...result, improvement_feedback: projected.value}));
}

export function resultEnvelope(profile, mode, status, summary, cases, metrics = {}) {
  return attachImprovementFeedback({schema_version: "are.real-reasoning-benchmark-result/v1", benchmark_id: profile.benchmark_id, profile_digest: sha256(readProfileBytes(profile)), mode, status, environment: {node: process.version, platform: process.platform, arch: process.arch}, summary, metrics, cases, authority_effect: "none", claim_limit: profile.claim_limit});
}
