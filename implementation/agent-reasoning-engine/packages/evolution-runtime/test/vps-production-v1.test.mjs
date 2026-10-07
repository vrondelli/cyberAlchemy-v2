import assert from "node:assert/strict";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  createVpsBenchmarkLauncher,
  containerCredentialReferencePresent,
  materializeBenchmarkCampaign,
  materializeProductionAdmissionProposal,
  materializeVpsExecutionBundle,
  materializeVpsLaunchDecision,
  materializeVpsRuntimeConfig,
  materializeWorkerAssignment,
  materializeWorkerResult,
  runVpsOperationalPreflight,
  verifyProductionAdmissionProposal,
  verifyVpsRuntimeConfig,
} from "../vps-benchmark-v1.mjs";

const hash = (character) => character.repeat(64);
const limits = {maximum_workers: 1, maximum_tokens: 1000, maximum_cost: 10, maximum_elapsed_seconds: 1000};

function config(live = false) {
  return materializeVpsRuntimeConfig({config_ref: "config:vps-production", execution_host: "187.77.163.194", roots: {runtime_root: "/opt/are/runtime", workspace_root: "/opt/are/work", evidence_root: "/opt/are/evidence", archive_root: "/opt/are/archive"}, gateway: {container_ref: "container:glm-gateway", endpoint_ref: "gateway:glm", credential_ref: "secret-ref:model-api-key", credential_reference_path: "/run/secrets/model_api_key"}, entrypoints: {contextbench: "runner:contextbench", "are-dsh": "runner:are-dsh", longmemeval: "runner:longmemeval"}, capacity_limits: limits, archive_policy: {hot_days: 7, warm_days: 30, cold_archive_ref: "archive:cold"}, maximum_diagnostic_bytes: 4096, live_dispatch_enabled: live});
}

function campaign() {
  return materializeBenchmarkCampaign({campaign_ref: "campaign:contextbench", family: "contextbench", model_ref: "glm-5.3-flash", work_items: [{task_ref: "task:a", source_ref: "source:a"}], source_bindings: [{source_ref: "source:a", sha256: hash("a")}], budgets: limits, comparison_posture: "prospective", family_policy: {candidate_only: true}});
}

function bundle() {
  return materializeVpsExecutionBundle({bundle_ref: "bundle:contextbench", family: "contextbench", campaign_ref: "campaign:contextbench", execution_host: "187.77.163.194", source_hashes: [{path: "src/runner.mjs", sha256: hash("b")}], executable: {entrypoint_ref: "runner:contextbench", arguments: ["--frozen-task", "task:a"]}, roots: {runtime_root: "/opt/are/runtime", workspace_root: "/opt/are/work", evidence_root: "/opt/are/evidence"}, model_ref: "glm-5.3-flash", tokenizer_ref: "tokenizer:glm", harness_ref: "harness:contextbench", scorer_ref: "scorer:native-span-f1", credential_ref: "secret-ref:model-api-key", resource_limits: limits, expires_at: "2030-01-01T00:00:00.000Z", output_contract: {artifact_roles: ["score"], maximum_diagnostic_bytes: 4096}});
}

function probe(overrides = {}) {
  return {hostIdentity: () => "187.77.163.194", runtimeVersions: () => ({node: "24", python: "3.13", rust: "1.90"}), containerPresent: () => true, availableMemoryBytes: () => 1024, availableDiskBytes: () => 2048, sourcePresent: () => true, withWritableProbe: () => true, credentialReferencePresent: () => true, activeConflictingWorkers: () => 0, ...overrides};
}

function preflight(runtimeConfig = config()) {
  return runVpsOperationalPreflight({config: runtimeConfig, probe: probe(), now: () => "2026-09-25T12:00:00.000Z"});
}

function proposal(runtimeConfig, checked) {
  return materializeProductionAdmissionProposal({proposal_ref: "proposal:vps-production", runtime_config_digest: runtimeConfig.config_digest, cycle_definitions: ["contextbench", "are-dsh", "longmemeval"].map((family, index) => ({family, definition_ref: `benchmark-research/${family}/v1`, definition_digest: hash(String(index + 1))})), dispatcher_source_digest: hash("d"), preflight_digest: checked.preflight_digest, requested_posture: "admit-and-enable", owner_decision_ref: null});
}

function assignment(frozenBundle, frozenCampaign) {
  return materializeWorkerAssignment({assignment_ref: "assignment:one", bundle_ref: frozenBundle.bundle_ref, bundle_digest: frozenBundle.bundle_digest, campaign_ref: frozenCampaign.campaign_ref, campaign_digest: frozenCampaign.campaign_digest, cycle_ref: "cycle:hen-11", phase: "benchmark", task_ref: "task:a", lease_ref: "lease:one", fencing_token: hash("e"), reservation_ref: "reservation:one", worker_ref: "worker:one", input_artifacts: [], expires_at: "2030-01-01T00:00:00.000Z"});
}

function decision(frozenBundle, frozenCampaign, checked, admission, family = "contextbench") {
  return materializeVpsLaunchDecision({decision_ref: `decision:${family}`, family, admission_proposal_digest: admission.proposal_digest, preflight_digest: checked.preflight_digest, campaign_digest: frozenCampaign.campaign_digest, bundle_digest: frozenBundle.bundle_digest, resource_limits: limits, expires_at: "2030-01-01T00:00:00.000Z", authorized: true, owner_decision_ref: "owner-decision:test-fixture"});
}

function workerResult(frozenBundle, frozenAssignment, diagnostics = ["ok"]) {
  return materializeWorkerResult({result_ref: "result:one", assignment_ref: frozenAssignment.assignment_ref, assignment_digest: frozenAssignment.assignment_digest, bundle_digest: frozenBundle.bundle_digest, cycle_ref: frozenAssignment.cycle_ref, phase: frozenAssignment.phase, task_ref: frozenAssignment.task_ref, lease_ref: frozenAssignment.lease_ref, fencing_token: frozenAssignment.fencing_token, worker_ref: frozenAssignment.worker_ref, disposition: "succeeded", artifacts: [{artifact_id: `sha256:${hash("f")}`, sha256: hash("f"), byte_length: 10, media_type: "application/json", criterion_id: "criterion:a"}], accounting: {calls: 1, tokens: 90, cost: 0.9, elapsed_seconds: 25}, window_admission: {token_count: 8000, context_limit: 8192, admitted: true}, scorer_ref: "scorer:native-span-f1", judge_ref: null, completed_at: "2026-09-25T12:01:00.000Z", diagnostics});
}

test("runtime configuration is closed, fixed-host, reference-only, and disabled by default", () => {
  const value = config();
  assert.equal(verifyVpsRuntimeConfig(value).ok, true);
  assert.equal(value.live_dispatch_enabled, false);
  const {config_digest: _digest, ...unsealed} = value;
  assert.throws(() => materializeVpsRuntimeConfig({...unsealed, execution_host: "127.0.0.1"}), /host-binding-invalid/);
  assert.throws(() => materializeVpsRuntimeConfig({...unsealed, unknown: true}), /unknown-field/);
  assert.throws(() => materializeVpsRuntimeConfig({...unsealed, gateway: {...unsealed.gateway, credential_ref: "Authorization: Bearer abcdefghijklmnop"}}), /secret-shaped-data/);
});

test("operational preflight uses bounded probes and rejects host substitution", () => {
  const value = preflight();
  assert.equal(value.gateway_present, true);
  assert.equal(value.active_conflicting_workers, 0);
  assert.throws(() => runVpsOperationalPreflight({config: config(), probe: probe({hostIdentity: () => "127.0.0.1"})}), /PREFLIGHT_HOST_SUBSTITUTION/);
});

test("container credential probe checks reference existence without reading credential bytes", () => {
  let observed = null;
  const present = containerCredentialReferencePresent({
    containerRef: "are-keld-presentation-provider-gateway-1",
    path: "/run/secrets/model_api_key",
    execFile: (...args) => { observed = args; return ""; },
  });
  assert.equal(present, true);
  assert.deepEqual(observed, [
    "docker",
    ["exec", "--user", "65532:65532", "are-keld-presentation-provider-gateway-1", "/nodejs/bin/node", "-e", "require('node:fs').accessSync(process.argv[1])", "/run/secrets/model_api_key"],
    {encoding: "utf8", timeout: 5000},
  ]);
  assert.equal(containerCredentialReferencePresent({containerRef: "missing", path: "/run/secrets/model_api_key", execFile: () => { throw new Error("absent"); }}), false);
});

test("production admission remains a no-effect proposal with no owner decision", () => {
  const runtimeConfig = config();
  const value = proposal(runtimeConfig, preflight(runtimeConfig));
  assert.equal(verifyProductionAdmissionProposal(value).ok, true);
  assert.equal(value.owner_decision_ref, null);
  assert.equal(value.authority_effect, "none");
});

test("launcher is disabled by default and family launch decisions cannot substitute", async () => {
  const runtimeConfig = config();
  const checked = preflight(runtimeConfig);
  const frozenBundle = bundle();
  const frozenCampaign = campaign();
  const admission = proposal(runtimeConfig, checked);
  const frozenAssignment = assignment(frozenBundle, frozenCampaign);
  const launcher = createVpsBenchmarkLauncher({config: runtimeConfig});
  const blocked = await launcher.dispatch({bundle: frozenBundle, assignment: frozenAssignment, decision: decision(frozenBundle, frozenCampaign, checked, admission), preflight: checked});
  assert.ok(blocked.reason_codes.includes("launcher.dispatch-disabled"));
  const wrongFamily = await createVpsBenchmarkLauncher({config: config(true), executor: async () => workerResult(frozenBundle, frozenAssignment), owner_decision_verifier: () => true}).dispatch({bundle: frozenBundle, assignment: frozenAssignment, decision: decision(frozenBundle, frozenCampaign, checked, admission, "are-dsh"), preflight: checked});
  assert.ok(wrongFamily.reason_codes.includes("launcher.binding-substitution"));
});

test("an explicitly enabled launcher calls only the frozen entrypoint and accepts a bound result", async () => {
  const runtimeConfig = config(true);
  const checked = preflight(runtimeConfig);
  const frozenBundle = bundle();
  const frozenCampaign = campaign();
  const admission = proposal(runtimeConfig, checked);
  const frozenAssignment = assignment(frozenBundle, frozenCampaign);
  let observed = null;
  const launcher = createVpsBenchmarkLauncher({config: runtimeConfig, owner_decision_verifier: (ref) => ref === "owner-decision:test-fixture", executor: async (request) => { observed = request; return workerResult(frozenBundle, frozenAssignment); }, now: () => "2026-09-25T12:00:00.000Z"});
  const launched = await launcher.dispatch({bundle: frozenBundle, assignment: frozenAssignment, decision: decision(frozenBundle, frozenCampaign, checked, admission), preflight: checked});
  assert.equal(launched.disposition, "completed");
  assert.equal(observed.entrypoint_ref, "runner:contextbench");
  assert.deepEqual([...observed.arguments], ["--frozen-task", "task:a"]);
});

test("closed CLI inspects configuration and keeps dispatch disabled", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-vps-cli-"));
  try {
    const configPath = resolve(temporary, "config.json");
    writeFileSync(configPath, JSON.stringify(config()));
    const cli = fileURLToPath(new URL("../bin/vps-benchmark.mjs", import.meta.url));
    const inspected = spawnSync(process.execPath, [cli, "--config", configPath], {input: JSON.stringify({schema_version: "are.vps-cli-request/v1", operation: "inspect", input: {}}), encoding: "utf8"});
    assert.equal(inspected.status, 0, inspected.stderr);
    assert.equal(JSON.parse(inspected.stdout).live_dispatch_enabled, false);
    const injected = spawnSync(process.execPath, [cli, "--config", configPath], {input: JSON.stringify({schema_version: "are.vps-cli-request/v1", operation: "inspect", input: {state: "enabled"}}), encoding: "utf8"});
    assert.equal(injected.status, 2);
  } finally { rmSync(temporary, {recursive: true, force: true}); }
});
