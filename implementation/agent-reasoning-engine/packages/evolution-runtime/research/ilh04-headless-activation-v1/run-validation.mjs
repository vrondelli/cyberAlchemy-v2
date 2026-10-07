#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync} from "node:fs";
import {relative, resolve} from "node:path";
import {spawnSync} from "node:child_process";

import {createServingVersionStore} from "../../index.mjs";
import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";

const cycleId = "ilh04-headless-activation-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const providerRoot = resolve(evolutionRoot, "evidence/ilh04-continuity-provider-v1");
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
  if (digest(material) !== value[digestKey]) throw new Error(`headless-activation.digest-invalid:${relative(repositoryRoot, path)}`);
  return value;
}

function runTests(id, cwd, files) {
  const run = spawnSync(process.execPath, ["--test", ...files], {cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  if (run.status !== 0) throw new Error(`headless-activation.test-failed:${id}\n${output.slice(-8000)}`);
  const count = Number(output.match(/ℹ tests (\d+)/u)?.[1] ?? 0);
  const passed = Number(output.match(/ℹ pass (\d+)/u)?.[1] ?? 0);
  const failed = Number(output.match(/ℹ fail (\d+)/u)?.[1] ?? -1);
  if (count < 1 || passed !== count || failed !== 0) throw new Error(`headless-activation.test-summary-invalid:${id}`);
  return {id, command: [process.execPath, "--test", ...files], count, passed, failed, output_digest: digest(output)};
}

const suiteFiles = (cwd) => readdirSync(resolve(cwd, "test")).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => `test/${name}`);
const owner = verifiedJson(resolve(evidenceRoot, "owner-decision.json"), "decision_digest");
const plan = verifiedJson(resolve(evidenceRoot, "activation-plan.json"), "plan_digest");
const result = verifiedJson(resolve(evidenceRoot, "activation-result.json"), "result_digest");
const providerPackage = verifiedJson(resolve(providerRoot, "provider-package.json"), "package_digest");
const snapshot = verifiedJson(resolve(providerRoot, "continuity-binding-snapshot.json"), "snapshot_digest");
const pointerStore = createServingVersionStore({path: resolve(evidenceRoot, "runtime/serving-pointer.json")});
const pointer = pointerStore.read();
if (owner.selection !== "admit" || result.disposition !== "activated" || !result.checks.rollback_verified || !result.checks.real_gateway_canary_passed
  || result.provider_package_digest !== providerPackage.package_digest || result.snapshot_digest !== snapshot.snapshot_digest
  || pointer?.pointer_digest !== result.serving_pointer.pointer_digest || pointer.version_ref !== result.activation_attempt.version_ref) throw new Error("headless-activation.result-invalid");
const profile = JSON.parse(readFileSync(resolve(wrapperRoot, "profiles/repository-v1.json"), "utf8"));
if (profile.continuity_renderer?.enabled !== false) throw new Error("headless-activation.repository-default-enabled");

const tests = [
  runTests("upgrade-controller-focused", evolutionRoot, ["test/operations.test.mjs"]),
  runTests("evolution-runtime-full", evolutionRoot, suiteFiles(evolutionRoot)),
  runTests("codex-wrapper-full", wrapperRoot, suiteFiles(wrapperRoot)),
];
const sourceFiles = [
  "implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/src/upgrade-controller.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/test/operations.test.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/registry/cycle-definitions.v1.json",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-headless-activation-v1/run-controlled-upgrade.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-headless-activation-v1/run-validation.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-binding-provider.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json",
];
const sources = sourceFiles.map((path) => ({path, sha256: digest(readFileSync(resolve(repositoryRoot, path)))}));
const validation = seal({
  schema_version: "are.headless-continuity-activation-validation/v1",
  cycle_id: cycleId,
  owner_decision_digest: owner.decision_digest,
  plan_digest: plan.plan_digest,
  provider_package_digest: providerPackage.package_digest,
  activation_result_digest: result.result_digest,
  serving_pointer_digest: pointer.pointer_digest,
  checks: {single_cycle_instance_admission: true, upgrade_decision_integrity: true, predecessor_match: true, failed_canary_rollback: true, successful_real_gateway_canary: true, retained_local_pointer: true, repository_default_disabled: true, provider_model_calls: 0, external_serving_changes: 0},
  tests,
  sources,
  disposition: "validated-local-headless-activation",
  activation_scope: "local-evidence-owned-headless-pointer",
  authority_effect: "none",
}, "validation_digest");
atomicJson(resolve(evidenceRoot, "activation-validation.json"), validation);

const activationPackage = seal({
  schema_version: "are.headless-continuity-activation-package/v1",
  cycle_id: cycleId,
  cycle_kind: "controlled-upgrade",
  package_id: "IL-H04-local-headless-activation-v1",
  owner_decision_digest: owner.decision_digest,
  plan_digest: plan.plan_digest,
  provider_package_digest: providerPackage.package_digest,
  activation_result_digest: result.result_digest,
  validation_digest: validation.validation_digest,
  serving_pointer_digest: pointer.pointer_digest,
  decision: "retain-local-headless-activation",
  active_version_ref: pointer.version_ref,
  rollback_target_ref: pointer.predecessor_ref,
  eligible_scope: "local shared-rpc/headless execution with explicit profile and continuity-state selection",
  excluded_scope: ["repository-default profile", "Codex Desktop/Windows UI", "deployment", "external serving", "real-user effectiveness"],
  successor_requirement: "Operational use must explicitly select an enabled profile and the exact continuity snapshot; broader activation requires another owner decision.",
  activation: "controlled-local",
  authority_effect: "none",
}, "package_digest");
atomicJson(resolve(evidenceRoot, "activation-package.json"), activationPackage);
process.stdout.write(`${canonicalJson({ok: true, cycle_id: cycleId, validation_digest: validation.validation_digest, package_digest: activationPackage.package_digest, tests: tests.map(({id, count, passed, failed}) => ({id, count, passed, failed})), activation: "controlled-local"})}\n`);
