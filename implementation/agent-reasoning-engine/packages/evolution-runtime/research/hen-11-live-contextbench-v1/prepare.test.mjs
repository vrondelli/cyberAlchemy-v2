import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";
import {prepareHen11} from "./prepare.mjs";

test("prepares the exact development two-task R3 freeze without provider calls", async () => {
  const parent = mkdtempSync(join(tmpdir(), "hen11-prepare-")), outputRoot = join(parent, "candidate"), repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
  try {
    const result = await prepareHen11({repositoryRoot, outputRoot}), freeze = JSON.parse(readFileSync(join(outputRoot, "FREEZE.json"), "utf8"));
    assert.equal(result.tasks, 2); assert.equal(result.provider_calls, 0); assert.equal(result.model_calls, 0); assert.equal(result.dispatch_admitted, true); assert.equal(result.prelaunch_authorization_required, false);
    assert.deepEqual(freeze.task_denominator, ["contextbench-1", "contextbench-4"]); assert.equal(freeze.schedule.assigned_outcomes, 2);
    assert.deepEqual(freeze.schedule.slots.map(slot => slot.task_id), freeze.task_denominator); assert.ok(freeze.schedule.slots.every(slot => slot.arm === "intent-anchor-convergence-r3"));
    assert.equal(freeze.maximum_model_calls, 192); assert.equal(freeze.maximum_model_tokens, 192000); assert.equal(freeze.control_runs, 0); assert.equal(freeze.context_limit, 8000);
    assert.equal(freeze.launch.dispatch_admitted, true); assert.equal(freeze.launch.runner_present, true); assert.equal(freeze.launch.prelaunch_authorization_required, false); assert.equal(freeze.launch.independent_postrun_review_required, true);
    assert.equal(freeze.historical_comparison.results_sha256, "473cfeacf2d466f5e36f26da5553d991bd87867919e1755cbd97253224f845a2");
    assert.ok(freeze.source_bindings.some(binding => binding.path.endsWith("intent-anchor-episode-r3.mjs")));
    assert.ok(freeze.source_bindings.some(binding => binding.path.endsWith("orchestrate-intent-anchor-r3.mjs")));
    assert.ok(freeze.source_bindings.some(binding => binding.path.endsWith("hen-11-live-contextbench-v1/run.mjs")));
    assert.ok(freeze.source_bindings.some(binding => binding.path.endsWith("hen-11-live-contextbench-v1/run-host.mjs")));
    assert.ok(freeze.source_bindings.some(binding => binding.path.endsWith("hen-11-live-contextbench-v1/vps-local-glm-v1.mjs")));
    assert.ok(freeze.source_bindings.some(binding => binding.path.endsWith("hen-11-live-contextbench-v1/launch-vps.mjs")));
    assert.match(freeze.sources.config_sha256, /^[a-f0-9]{64}$/); assert.match(freeze.sources.cohort_sha256, /^[a-f0-9]{64}$/); assert.match(freeze.deployment.deployment_digest, /^[a-f0-9]{64}$/);
    assert.equal(freeze.maximum_campaign_elapsed_seconds, 14400); assert.equal(freeze.execution_host, "187.77.163.194"); assert.match(freeze.source_bindings_sha256, /^[a-f0-9]{64}$/);
    assert.equal(freeze.execution_mode, "development"); assert.equal(freeze.development_execution.cryptographic_signatures_required, false); assert.equal(freeze.development_execution.independent_postrun_review_required, true); assert.equal(freeze.reviewer_authentication, undefined);
  } finally { rmSync(parent, {recursive: true, force: true}); }
});

test("preparation requires no trust registry in development", async () => {
  const parent = mkdtempSync(join(tmpdir(), "hen11-no-registry-")), repositoryRoot = resolve(import.meta.dirname, "../../../../../.."); try {
    const result = await prepareHen11({repositoryRoot, outputRoot: join(parent, "candidate")}); assert.equal(result.prelaunch_authorization_required, false);
  } finally { rmSync(parent, {recursive: true, force: true}); }
});

test("prepares an exact development-enabled VPS-native package contract", async () => {
  const parent = mkdtempSync(join(tmpdir(), "hen11-vps-prepare-")), outputRoot = join(parent, "hen-11-contextbench-intent-anchor-r3-v11"), repositoryRoot = resolve(import.meta.dirname, "../../../../../.."), targetRoot = "/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v11", runtimeRepositoryRoot = `${targetRoot}/repo`;
  try {
    await prepareHen11({repositoryRoot, outputRoot, targetRoot, runtimeRepositoryRoot}); const freeze = JSON.parse(readFileSync(join(outputRoot, "FREEZE.json"))), transfer = JSON.parse(readFileSync(join(outputRoot, "TRANSFER-MANIFEST.json")));
    assert.equal(freeze.deployment.target_root, targetRoot); assert.ok(freeze.source_bindings.every(binding => binding.path.startsWith(`${runtimeRepositoryRoot}/`))); assert.ok(Object.values(freeze.roots).every(path => path.startsWith(`${targetRoot}/`)));
    assert.equal(freeze.remote_provider_bridge.path, `${runtimeRepositoryRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/hen-11-live-contextbench-v1/vps-local-glm-v1.mjs`); assert.equal(freeze.node_runtime.path, "/opt/cyberalchemy-are-tools/node-24.10.0/node"); assert.deepEqual(freeze.node_runtime.required_node_options, ["--experimental-vm-modules"]);
    assert.equal(transfer.launch.disabled, false); assert.deepEqual(transfer.launch.arguments.slice(0, 2), ["--experimental-vm-modules", freeze.node_runtime.launch_wrapper]); assert.equal(transfer.launch.arguments.length, 4); assert.equal(transfer.repositories.length, 2); assert.equal(transfer.scoring_assets.length, 2); assert.ok(transfer.repositories.every(binding => /^[a-f0-9]{64}$/.test(binding.tree_sha256))); assert.ok(transfer.scoring_assets.every(binding => /^[a-f0-9]{64}$/.test(binding.tree_sha256)));
    assert.deepEqual(freeze.native_scoring_runtime.map(binding => binding.role), ["bounded_scorer", "configured_wrapper", "source_manifest"]); assert.ok(freeze.native_scoring_runtime.every(binding => transfer.files.some(file => file.remote_path === binding.path && file.sha256 === binding.sha256)));
    assert.equal(freeze.execution_mode, "development"); assert.equal(freeze.development_execution.prelaunch_authorization_required, false);
  } finally { rmSync(parent, {recursive: true, force: true}); }
});
