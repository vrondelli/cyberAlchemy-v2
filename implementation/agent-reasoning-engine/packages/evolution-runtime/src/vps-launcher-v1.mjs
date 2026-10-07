import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {verifyVpsExecutionBundle, verifyVpsPreflightResult, verifyWorkerAssignment, verifyWorkerResult} from "./vps-benchmark-protocol-v1.mjs";
import {preflightReady} from "./vps-operational-preflight-v1.mjs";
import {verifyVpsLaunchDecision, verifyVpsRuntimeConfig} from "./vps-production-v1.mjs";

export const VPS_BENCHMARK_LAUNCHER_VERSION = "are.vps-benchmark-launcher/v1";
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));

function fail(stage, reasons) {
  return freeze({schema_version: "are.vps-launcher-failure/v1", ok: false, stage, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}

export function createVpsBenchmarkLauncher({config, executor = null, owner_decision_verifier: ownerDecisionVerifier = () => false, now = () => new Date().toISOString()} = {}) {
  const configCheck = verifyVpsRuntimeConfig(config);
  if (!configCheck.ok) throw new TypeError(`Launcher configuration is invalid: ${configCheck.reason_codes.join(",")}`);
  if (executor !== null && typeof executor !== "function") throw new TypeError("Launcher executor must be a function or null.");
  if (typeof ownerDecisionVerifier !== "function" || typeof now !== "function") throw new TypeError("Launcher verifier and clock must be functions.");

  function inspect() {
    return freeze({schema_version: "are.vps-launcher-inspection/v1", ok: true, version: VPS_BENCHMARK_LAUNCHER_VERSION, config_ref: config.config_ref, config_digest: config.config_digest, execution_host: config.execution_host, live_dispatch_enabled: config.live_dispatch_enabled, executor_available: executor !== null, authority_effect: "none"});
  }

  async function dispatch(input) {
    const reasons = [];
    const allowed = new Set(["bundle", "assignment", "decision", "preflight"]);
    if (!object(input) || Object.keys(input).some((key) => !allowed.has(key))) reasons.push("launcher.request-invalid");
    const bundleCheck = verifyVpsExecutionBundle(input?.bundle);
    const assignmentCheck = verifyWorkerAssignment(input?.assignment);
    const decisionCheck = verifyVpsLaunchDecision(input?.decision);
    const preflightCheck = verifyVpsPreflightResult(input?.preflight);
    if (!bundleCheck.ok) reasons.push(...bundleCheck.reason_codes);
    if (!assignmentCheck.ok) reasons.push(...assignmentCheck.reason_codes);
    if (!decisionCheck.ok) reasons.push(...decisionCheck.reason_codes);
    if (!preflightCheck.ok) reasons.push(...preflightCheck.reason_codes);
    if (config.live_dispatch_enabled !== true || executor === null) reasons.push("launcher.dispatch-disabled");
    if (input?.bundle?.execution_host !== config.execution_host || input?.preflight?.execution_host !== config.execution_host) reasons.push("launcher.host-substitution");
    if (input?.bundle?.family !== input?.decision?.family || input?.bundle?.bundle_digest !== input?.decision?.bundle_digest || input?.bundle?.campaign_ref !== input?.assignment?.campaign_ref || input?.bundle?.bundle_digest !== input?.assignment?.bundle_digest || input?.assignment?.campaign_digest !== input?.decision?.campaign_digest) reasons.push("launcher.binding-substitution");
    if (input?.bundle?.roots?.runtime_root !== config.roots.runtime_root || input?.bundle?.roots?.workspace_root !== config.roots.workspace_root || input?.bundle?.roots?.evidence_root !== config.roots.evidence_root || input?.bundle?.credential_ref !== config.gateway.credential_ref || JSON.stringify(input?.bundle?.resource_limits) !== JSON.stringify(input?.decision?.resource_limits)) reasons.push("launcher.config-substitution");
    if (input?.decision?.preflight_digest !== input?.preflight?.preflight_digest || !preflightReady(input?.preflight ?? {})) reasons.push("launcher.preflight-not-ready");
    if (Date.parse(input?.decision?.expires_at ?? "") <= Date.parse(now())) reasons.push("launcher.decision-expired");
    if (Date.parse(input?.bundle?.expires_at ?? "") <= Date.parse(now()) || Date.parse(input?.assignment?.expires_at ?? "") <= Date.parse(now())) reasons.push("launcher.work-expired");
    if (input?.decision?.authorized !== true || !ownerDecisionVerifier(input.decision.owner_decision_ref, structuredClone(input.decision))) reasons.push("launcher.owner-decision-not-verified");
    const expectedEntrypoint = config.entrypoints[input?.bundle?.family];
    if (input?.bundle?.executable?.entrypoint_ref !== expectedEntrypoint) reasons.push("launcher.entrypoint-not-allowed");
    if (reasons.length) return fail("dispatch", reasons);
    let returned;
    try {
      returned = await executor(Object.freeze({entrypoint_ref: expectedEntrypoint, arguments: Object.freeze([...input.bundle.executable.arguments]), bundle: structuredClone(input.bundle), assignment: structuredClone(input.assignment)}));
    } catch (error) {
      return fail("dispatch", ["launcher.executor-failed", `launcher.executor-error:${error?.name ?? "Error"}`]);
    }
    const resultCheck = verifyWorkerResult(returned);
    if (!resultCheck.ok) return fail("dispatch", resultCheck.reason_codes);
    if (returned.assignment_ref !== input.assignment.assignment_ref || returned.assignment_digest !== input.assignment.assignment_digest || returned.bundle_digest !== input.bundle.bundle_digest || returned.lease_ref !== input.assignment.lease_ref || returned.fencing_token !== input.assignment.fencing_token || returned.worker_ref !== input.assignment.worker_ref) return fail("dispatch", ["launcher.result-substitution"]);
    const diagnosticBytes = returned.diagnostics.reduce((sum, item) => sum + Buffer.byteLength(item), 0);
    if (diagnosticBytes > config.maximum_diagnostic_bytes) return fail("dispatch", ["launcher.diagnostics-overflow"]);
    return freeze({schema_version: "are.vps-launcher-result/v1", ok: true, disposition: "completed", result: returned, authority_effect: "none"});
  }

  return Object.freeze({version: VPS_BENCHMARK_LAUNCHER_VERSION, inspect, dispatch});
}
