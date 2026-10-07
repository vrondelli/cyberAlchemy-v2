// Provider-free construction and verification of the G03 development generation freeze.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstatSync, readFileSync, readdirSync} from "node:fs";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {loadSourceManifest, sha, IDS} from "./adapter-unexposed-v1.mjs";
import {generationPlan, PLANNED_GENERATION_CALLS, GENERATION_TOKEN_RESERVATION} from "./runner-unexposed-v1.mjs";
import {preflightVpsStorage} from "./storage-vps-unexposed-v1.mjs";
import {inspectGateway} from "./provider-gateway-unexposed-v1.mjs";
import {collectExecutableClosure, collectPlanningTree} from "./dependency-closure-unexposed-v1.mjs";

export const PLAN_FILE_SHA256 = "d8dcc44bb0b97ffd88789cbac0cd69234c5c9dc46526ebb47a5d4291d2c3ba60";
export const RESULTS_FILE_SHA256 = "6d50c42e71bd78a7f66ec13217f9c5e7b6a4a6ac854166281ced3c835f47feb2";
export const RUNNER_SHA256 = "705bf34563695dff7900cc232291f0e5b016ba3f3a9b031f7f70ebe546f2b165";
export const ADAPTER_SHA256 = "b3ee2756f4c8d02fb2e8f2f6c442019c75a46157509bfed122954cf885f8970f";
export const PROTOCOL_SHA256 = "ea7172b5f6b67b819c69dfd96f551d6fb6e2275074f80e25ad27ab47e9f7a382";
export const PROVIDER_SHA256 = "25f75f25033f3c38e68b9003fb41e74107c320262f79be2727d9bde4ba4f1683";
export const OUTPUT_BUDGET_SHA256 = "aa8ef55753c50dfb68598c727e7eeb4e473d71254d86b34767785089e9e65623";
export const STORAGE_GUARD_SHA256 = "aefc8ed4d3466f130cfa08334bd195b7195346584c54bdfeb312a9d697300cee";
export const SECURITY_SHA256 = "1dcdb67bb6243af830cd38eedeb0cb8ec94857ebb09067766818ecd009d1f156";
export const CLOSURE_SHA256 = "01244610f70a6d6e5ef570e5711316426f85751c1b50704428b9caf6a744c8b7";
const EXPECTED_PLAN_SHA256 = "f0bdaf51c90f27553c1fc0fa85879a7e497eb05d72b1e441a30cf756f6f01abc";
const EXECUTION_RUNTIME = Object.freeze({kind: "host-extracted-node", path: "/opt/are-benchmark-runs/longmemeval-unexposed-generation-20260926-v3/runtime/node", sha256: "19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3", source_image: "node:26.8.1-bookworm-slim", source_image_digest: "sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e", node_version: "v26.8.1", pid_namespace: "host", provider_network_access: "docker-exec-gateway-only"});
const here = import.meta.dirname, confirmation = resolve(here, "..");
const fixedFiles = Object.freeze({
  adapter: join(here, "adapter-unexposed-v1.mjs"), runner: join(here, "runner-unexposed-v1.mjs"), protocol: join(here, "paired-protocol-v1.json"),
  provider: join(here, "provider-gateway-unexposed-v1.mjs"), output_budget: join(here, "output-budget-unexposed-v1.mjs"), storage_guard: join(here, "storage-vps-unexposed-v1.mjs"),
  security: join(here, "generation-security-unexposed-v1.mjs"), closure: join(here, "dependency-closure-unexposed-v1.mjs")
});
const fileSha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const exactFile = (path, digest, code) => { const stat = lstatSync(path); assert.ok(stat.isFile() && !stat.isSymbolicLink(), code); assert.equal(fileSha(path), digest, code); return {path: resolve(path), sha256: digest}; };
const readJson = (path) => JSON.parse(readFileSync(path));

function verifyCodeFiles() {
  return {
    adapter: exactFile(fixedFiles.adapter, ADAPTER_SHA256, "freeze.adapter-drift"),
    runner: exactFile(fixedFiles.runner, RUNNER_SHA256, "freeze.runner-drift"),
    protocol: exactFile(fixedFiles.protocol, PROTOCOL_SHA256, "freeze.protocol-drift"),
    provider: exactFile(fixedFiles.provider, PROVIDER_SHA256, "freeze.provider-drift"),
    output_budget: exactFile(fixedFiles.output_budget, OUTPUT_BUDGET_SHA256, "freeze.output-budget-drift"),
    storage_guard: exactFile(fixedFiles.storage_guard, STORAGE_GUARD_SHA256, "freeze.storage-guard-drift"),
    security: exactFile(fixedFiles.security, SECURITY_SHA256, "freeze.security-drift"), closure: exactFile(fixedFiles.closure, CLOSURE_SHA256, "freeze.closure-drift")
  };
}

function noEvaluatorMaterial(packageDirectory, manifest) {
  const allowed = new Set(["manifest.json", "acquisition.json", ...manifest.rows.map((row) => row.path)]), names = readdirSync(packageDirectory);
  assert.deepEqual([...names].sort(), [...allowed].sort(), "freeze.source-package-artifact-set");
  assert.ok(names.every((name) => !/(?:reference|evaluator|oracle|gold|answer)/i.test(name)), "freeze.evaluator-material-present");
}

export function prepareGenerationFreeze({packageDirectory, planningDirectory, storageBindingPath, livePath = join(here, "live-generation-unexposed-v1.mjs"), freezePath = fileURLToPath(import.meta.url), inspect, read}) {
  const manifestPath = join(packageDirectory, "manifest.json"), planPath = join(planningDirectory, "PLAN.json"), resultsPath = join(planningDirectory, "RESULTS.json");
  const manifest = readJson(manifestPath), loaded = loadSourceManifest(manifest, packageDirectory); noEvaluatorMaterial(packageDirectory, manifest);
  exactFile(planPath, PLAN_FILE_SHA256, "freeze.plan-file-drift"); exactFile(resultsPath, RESULTS_FILE_SHA256, "freeze.results-file-drift");
  const qualification = readJson(planPath), planningResult = readJson(resultsPath), plan = generationPlan(loaded.rows, qualification);
  assert.equal(planningResult.status, "planned"); assert.equal(planningResult.plan_sha256, EXPECTED_PLAN_SHA256); assert.equal(planningResult.calls, 156); assert.equal(planningResult.calls_exact, true); assert.equal(planningResult.generation_calls, PLANNED_GENERATION_CALLS); assert.equal(planningResult.generation_token_reservation, GENERATION_TOKEN_RESERVATION); assert.equal(planningResult.model_generation_calls, 0);
  const storageBinding = readJson(storageBindingPath), storageReceipt = preflightVpsStorage({binding: storageBinding, outputRoot: storageBinding.output_root, growth_reservation_bytes: 32 * 1024 ** 2});
  const code = {...verifyCodeFiles(), freeze: {path: resolve(freezePath), sha256: fileSha(freezePath)}, live: {path: resolve(livePath), sha256: fileSha(livePath)}};
  const executable_closure = collectExecutableClosure([freezePath, livePath]), planning_tree = collectPlanningTree(planningDirectory);
  return {
    schema_version: "are.longmemeval-unexposed-generation-freeze/v2", execution_mode: "development", human_prelaunch_authorization_required: false, live_dispatch_admitted: true, launch_disabled: false, authority_effect: "none",
    model: "glm-5.3-flash", context_limit: 8000, workers: 2, answer_slots: 8, maximum_generation_calls: 152, maximum_live_tokenizer_calls: 152, generation_token_reservation: 1216000, deadline_ms: 7200000, automatic_retries: 0,
    execution_runtime: {...EXECUTION_RUNTIME, binary: exactFile(EXECUTION_RUNTIME.path, EXECUTION_RUNTIME.sha256, "freeze.execution-runtime-binary")}, gateway: inspectGateway(inspect, read), ordered_question_ids: [...IDS], source_package: {directory: resolve(packageDirectory), manifest_file_sha256: fileSha(manifestPath), bindings: loaded.bindings},
    planning: {directory: resolve(planningDirectory), plan_file_sha256: PLAN_FILE_SHA256, results_file_sha256: RESULTS_FILE_SHA256, internal_plan_sha256: EXPECTED_PLAN_SHA256, planning_tokenizer_calls: 156, artifact_tree: planning_tree},
    generation_plan_sha256: sha(plan), code_bindings: code, executable_closure, target_storage: {binding_file: exactFile(storageBindingPath, fileSha(storageBindingPath), "freeze.storage-binding-file"), binding: storageBinding, preflight: storageReceipt}, evaluator_reference_access: false, evaluator_reference_files_present: false, campaign_goal_achieved: false,
    open_questions: []
  };
}

export function verifyGenerationFreeze(path, {inspect, read} = {}) {
  const freeze = readJson(path); assert.equal(freeze.schema_version, "are.longmemeval-unexposed-generation-freeze/v2");
  assert.equal(freeze.execution_mode, "development"); assert.equal(freeze.human_prelaunch_authorization_required, false); assert.equal(freeze.live_dispatch_admitted, true); assert.equal(freeze.launch_disabled, false);
  for (const [key, expected] of Object.entries({model: "glm-5.3-flash", context_limit: 8000, workers: 2, answer_slots: 8, maximum_generation_calls: 152, maximum_live_tokenizer_calls: 152, generation_token_reservation: 1216000, deadline_ms: 7200000, automatic_retries: 0, evaluator_reference_access: false, evaluator_reference_files_present: false})) assert.equal(freeze[key], expected, `freeze.${key}`);
  assert.deepEqual(freeze.ordered_question_ids, IDS);
  assert.deepEqual(freeze.execution_runtime, {...EXECUTION_RUNTIME, binary: exactFile(EXECUTION_RUNTIME.path, EXECUTION_RUNTIME.sha256, "freeze.execution-runtime-binary")}, "freeze.execution-runtime-drift");
  assert.deepEqual(freeze.gateway, inspectGateway(inspect, read), "freeze.gateway-drift");
  const expectedCode = {...verifyCodeFiles(), freeze: {path: resolve(fileURLToPath(import.meta.url)), sha256: fileSha(fileURLToPath(import.meta.url))}, live: {path: resolve(join(here, "live-generation-unexposed-v1.mjs")), sha256: fileSha(join(here, "live-generation-unexposed-v1.mjs"))}};
  assert.deepEqual(freeze.code_bindings, expectedCode, "freeze.code-binding-drift");
  for (const binding of Object.values(freeze.code_bindings)) exactFile(binding.path, binding.sha256, "freeze.code-binding-drift");
  assert.deepEqual(freeze.executable_closure, collectExecutableClosure([fileURLToPath(import.meta.url), join(here, "live-generation-unexposed-v1.mjs")]), "freeze.executable-closure-drift");
  const packageDirectory = freeze.source_package.directory, manifest = readJson(join(packageDirectory, "manifest.json")), loaded = loadSourceManifest(manifest, packageDirectory); noEvaluatorMaterial(packageDirectory, manifest);
  exactFile(join(packageDirectory, "manifest.json"), freeze.source_package.manifest_file_sha256, "freeze.manifest-file-drift");
  assert.equal(sha(loaded.bindings), sha(freeze.source_package.bindings), "freeze.source-binding-drift");
  const planningDirectory = freeze.planning.directory; exactFile(join(planningDirectory, "PLAN.json"), PLAN_FILE_SHA256, "freeze.plan-file-drift"); exactFile(join(planningDirectory, "RESULTS.json"), RESULTS_FILE_SHA256, "freeze.results-file-drift");
  assert.deepEqual(freeze.planning.artifact_tree, collectPlanningTree(planningDirectory), "freeze.planning-tree-drift");
  const qualification = readJson(join(planningDirectory, "PLAN.json")), planningResult = readJson(join(planningDirectory, "RESULTS.json")), plan = generationPlan(loaded.rows, qualification);
  assert.equal(planningResult.plan_sha256, EXPECTED_PLAN_SHA256); assert.equal(planningResult.status, "planned"); assert.equal(sha(plan), freeze.generation_plan_sha256);
  exactFile(freeze.target_storage.binding_file.path, freeze.target_storage.binding_file.sha256, "freeze.storage-binding-drift"); const storageBinding = readJson(freeze.target_storage.binding_file.path); assert.deepEqual(storageBinding, freeze.target_storage.binding); const storageReceipt = preflightVpsStorage({binding: storageBinding, outputRoot: storageBinding.output_root, growth_reservation_bytes: 32 * 1024 ** 2});
  for (const key of ["schema_version", "status", "output_root", "filesystem", "mount_identity", "host_fingerprint_sha256", "minimum_free_bytes", "growth_reservation_bytes", "required_free_bytes", "provenance", "provider_calls", "credentials_accessed", "authority_effect"]) assert.deepEqual(storageReceipt[key], freeze.target_storage.preflight[key], `freeze.storage-preflight-${key}`);
  return {freeze, plan, loaded, qualification, planningResult, freeze_sha256: fileSha(path)};
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  assert.equal(process.argv.length, 5, "usage: freeze-unexposed-v1.mjs PACKAGE PLANNING-DIRECTORY STORAGE-BINDING");
  process.stdout.write(`${JSON.stringify(prepareGenerationFreeze({packageDirectory: process.argv[2], planningDirectory: process.argv[3], storageBindingPath: process.argv[4]}), null, 2)}\n`);
}
