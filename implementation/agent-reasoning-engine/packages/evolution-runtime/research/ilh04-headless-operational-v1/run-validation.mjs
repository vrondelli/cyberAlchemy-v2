#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync} from "node:fs";
import {relative, resolve} from "node:path";
import {spawnSync} from "node:child_process";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {loadRepositoryProfile, loadContinuityActivationManifest, protocolBindingCheck} from "../../../codex-app-server-wrapper/index.mjs";

const cycleId = "ilh04-headless-operational-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const configurationRoot = resolve(repositoryRoot, "..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const activationRoot = resolve(evolutionRoot, "evidence/ilh04-headless-activation-v1");
const digest = (value) => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => ({...canonicalizeJson(material), [key]: digest(material)});

function atomicJson(path, value) {
  mkdirSync(resolve(path, ".."), {recursive: true, mode: 0o700});
  const temporary = `${path}.tmp-${process.pid}`;
  const descriptor = openSync(temporary, "wx", 0o600);
  try { writeFileSync(descriptor, `${canonicalJson(canonicalizeJson(value))}\n`); fsyncSync(descriptor); }
  finally { closeSync(descriptor); }
  renameSync(temporary, path);
  const directory = openSync(resolve(path, ".."), "r");
  try { fsyncSync(directory); } finally { closeSync(directory); }
}

function verifiedJson(path, digestKey) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  const material = Object.fromEntries(Object.entries(value).filter(([key]) => key !== digestKey));
  if (digest(material) !== value[digestKey]) throw new Error(`operational-continuity.digest-invalid:${relative(repositoryRoot, path)}`);
  return value;
}

function runTests(id, cwd, files) {
  const run = spawnSync(process.execPath, ["--test", ...files], {cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  if (run.status !== 0) throw new Error(`operational-continuity.test-failed:${id}\n${output.slice(-8000)}`);
  const count = Number(output.match(/ℹ tests (\d+)/u)?.[1] ?? 0);
  const passed = Number(output.match(/ℹ pass (\d+)/u)?.[1] ?? 0);
  const failed = Number(output.match(/ℹ fail (\d+)/u)?.[1] ?? -1);
  if (count < 1 || passed !== count || failed !== 0) throw new Error(`operational-continuity.test-summary-invalid:${id}`);
  return {id, command: [process.execPath, "--test", ...files], count, passed, failed, output_digest: digest(output)};
}

const suiteFiles = (cwd) => readdirSync(resolve(cwd, "test")).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => `test/${name}`);
const predecessor = verifiedJson(resolve(activationRoot, "activation-package.json"), "package_digest");
const state = verifiedJson(resolve(evidenceRoot, "continuity-state.json"), "snapshot_digest");
const operationalCanary = verifiedJson(resolve(evidenceRoot, "operational-canary-result.json"), "result_digest");
const liveInitialize = verifiedJson(resolve(evidenceRoot, "live-initialize-result.json"), "result_digest");
const manifest = loadContinuityActivationManifest(resolve(evidenceRoot, "activation-manifest.json"), configurationRoot);
if (predecessor.package_digest !== "51ac1d9c9ce8df6ff317d9a8fb7d450ab5c05d3b6002000650ff96e50b788163" || !manifest.ok
  || operationalCanary.disposition !== "operational-headless-path-confirmed" || liveInitialize.disposition !== "live-initialize-confirmed"
  || operationalCanary.activation_manifest_digest !== manifest.value.manifest_digest || operationalCanary.snapshot_digest !== state.snapshot_digest
  || liveInitialize.continuity_activation_receipt_digest !== operationalCanary.activation_receipt_digest) throw new Error("operational-continuity.predecessor-or-canary-invalid");
const loadedProfile = loadRepositoryProfile(resolve(wrapperRoot, "profiles/repository-v1.json"), configurationRoot);
if (!loadedProfile.ok || loadedProfile.value.continuity_renderer?.enabled !== false || !protocolBindingCheck(loadedProfile.value.protocol_binding, "codex-cli 0.155.0-alpha.16.3").ok) throw new Error("operational-continuity.repository-profile-invalid");

const owner = seal({schema_version: "are.owner-decision/v1", decision_id: "DG-CO-01", selection: "finish", selected_path: "operational-headless-continuity-binding", authorization_ref: "conversation:do-everything-to-finish-this", authorized_effects: ["activation-manifest", "entrypoint-binding", "protocol-reobservation", "loopback-canaries", "repository-evidence"], excluded_effects: ["external-deployment", "publication", "desktop-ui-claim", "credential-processing", "model-provider-call"], authority_effect: "bounded-local-operation-only"}, "decision_digest");
atomicJson(resolve(evidenceRoot, "owner-decision.json"), owner);
const plan = seal({schema_version: "are.controlled-upgrade-plan/v1", cycle_id: cycleId, cycle_kind: "controlled-upgrade", phase: "operational-headless-binding", objective: "Make the admitted local continuity pointer directly consumable by real ARE entrypoints with exact integrity and current Codex protocol evidence.", predecessor_package_digest: predecessor.package_digest, owner_decision_digest: owner.decision_digest, tasks: ["materialize-operational-state", "bind-activation-manifest", "wire-entrypoints", "reobserve-installed-codex-protocol", "run-model-neutral-gateway-canary", "run-real-binary-initialize-canary", "run-regressions", "settle-evidence"], product_frontier: "Complete local headless continuity execution path.", runnable_product_work: [], operational_tasks: [], affected_stages: ["app-server-startup", "gateway-startup", "continuity-state-selection", "codex-protocol-binding"], causal_blockers: [], deferred_operational_residue: ["external deployment", "Codex Desktop/Windows UI adapter", "real-user effectiveness cohort"], activation_scope: "controlled-local-headless-operational", authority_effect: "none"}, "plan_digest");
atomicJson(resolve(evidenceRoot, "operational-plan.json"), plan);

const tests = [
  runTests("continuity-operational-focused", wrapperRoot, ["test/continuity-activation.test.mjs", "test/continuity-binding-provider.test.mjs", "test/continuity-consumer.test.mjs", "test/continuity-renderer.test.mjs", "test/rpc-client.test.mjs"]),
  runTests("codex-wrapper-full", wrapperRoot, suiteFiles(wrapperRoot)),
  runTests("evolution-runtime-full", evolutionRoot, suiteFiles(evolutionRoot)),
];
const sourceFiles = [
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-activation.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-binding-provider.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/continuity-activation.test.mjs",
  "development/agent-reasoning-engine/codex-integration/evidence/codex-app-server-protocol-observation.v3.json",
  "development/agent-reasoning-engine/codex-integration/evidence/codex-app-server-selected-projection.v3.json",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-headless-operational-v1/run-operational-canary.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-headless-operational-v1/run-live-initialize-canary.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-headless-operational-v1/run-validation.mjs",
];
const sources = sourceFiles.map((path) => ({path, sha256: digest(readFileSync(resolve(repositoryRoot, path)))}));
const validation = seal({schema_version: "are.operational-headless-continuity-validation/v1", cycle_id: cycleId, owner_decision_digest: owner.decision_digest, plan_digest: plan.plan_digest, predecessor_package_digest: predecessor.package_digest, activation_manifest_digest: manifest.value.manifest_digest, snapshot_digest: state.snapshot_digest, operational_canary_digest: operationalCanary.result_digest, live_initialize_digest: liveInitialize.result_digest, checks: {closed_activation_manifest: true, retained_pointer_lineage: true, fresh_operational_state: true, both_entrypoints_bound: true, installed_codex_protocol_reobserved: true, real_binary_initialize: true, model_neutral_continuity_canary: true, repository_default_disabled: true, provider_model_calls: 0}, tests, sources, disposition: "validated-operational-headless-continuity", activation: "controlled-local-operational", authority_effect: "none"}, "validation_digest");
atomicJson(resolve(evidenceRoot, "operational-validation.json"), validation);
const packageValue = seal({schema_version: "are.operational-headless-continuity-package/v1", cycle_id: cycleId, cycle_kind: "controlled-upgrade", package_id: "IL-H04-operational-headless-continuity-v1", owner_decision_digest: owner.decision_digest, plan_digest: plan.plan_digest, predecessor_package_digest: predecessor.package_digest, activation_manifest_digest: manifest.value.manifest_digest, snapshot_digest: state.snapshot_digest, operational_canary_digest: operationalCanary.result_digest, live_initialize_digest: liveInitialize.result_digest, validation_digest: validation.validation_digest, decision: "operational-headless-binding-complete", active_version_ref: predecessor.active_version_ref, rollback_target_ref: predecessor.rollback_target_ref, invocation: {flag: "--continuity-activation", manifest_path: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-headless-operational-v1/activation-manifest.json"}, completed_scope: "local shared-rpc/headless app-server and gateway entrypoints", excluded_scope: ["external deployment", "Codex Desktop/Windows UI", "real-user effectiveness"], activation: "controlled-local-operational", authority_effect: "none"}, "package_digest");
atomicJson(resolve(evidenceRoot, "operational-package.json"), packageValue);
process.stdout.write(`${canonicalJson({ok: true, cycle_id: cycleId, validation_digest: validation.validation_digest, package_digest: packageValue.package_digest, tests: tests.map(({id, count, passed, failed}) => ({id, count, passed, failed})), activation: packageValue.activation})}\n`);
