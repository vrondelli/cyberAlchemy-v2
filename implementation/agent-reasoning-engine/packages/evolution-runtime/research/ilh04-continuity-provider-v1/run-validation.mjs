#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync} from "node:fs";
import {relative, resolve} from "node:path";
import {spawnSync} from "node:child_process";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";

const cycleId = "ilh04-continuity-provider-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
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
  if (digest(material) !== value[digestKey]) throw new Error(`continuity-provider.digest-invalid:${relative(repositoryRoot, path)}`);
  return value;
}

function runTests(id, cwd, files) {
  const run = spawnSync(process.execPath, ["--test", ...files], {cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  if (run.status !== 0) throw new Error(`continuity-provider.test-failed:${id}\n${output.slice(-8000)}`);
  const count = Number(output.match(/ℹ tests (\d+)/u)?.[1] ?? 0);
  const passed = Number(output.match(/ℹ pass (\d+)/u)?.[1] ?? 0);
  const failed = Number(output.match(/ℹ fail (\d+)/u)?.[1] ?? -1);
  if (count < 1 || passed !== count || failed !== 0) throw new Error(`continuity-provider.test-summary-invalid:${id}`);
  return {id, command: [process.execPath, "--test", ...files], count, passed, failed, output_digest: digest(output)};
}

const suiteFiles = (cwd) => readdirSync(resolve(cwd, "test")).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => `test/${name}`);
const predecessor = verifiedJson(resolve(evolutionRoot, "evidence/ilh04-host-confirmation-v1/confirmation-package.json"), "package_digest");
const snapshot = verifiedJson(resolve(evidenceRoot, "continuity-binding-snapshot.json"), "snapshot_digest");
const canary = verifiedJson(resolve(evidenceRoot, "gateway-canary-result.json"), "result_digest");
if (predecessor.package_digest !== "34c2eb72c39011d2d1cb863eb16c719c7d7d1664598cf9f88ebdae6b0c1a1f13") throw new Error("continuity-provider.predecessor-invalid");
if (canary.disposition !== "gateway-provider-confirmed" || canary.snapshot_digest !== snapshot.snapshot_digest || canary.provider_model_calls !== 0 || canary.activation !== "none") throw new Error("continuity-provider.canary-invalid");

const decision = seal({
  schema_version: "are.owner-decision/v1",
  decision_id: "DG-CP-01",
  selection: "A",
  selected_path: "engine-owned-continuity-binding-provider",
  authorization_ref: "conversation:DG-CP-01=A",
  authorized_effects: ["bounded-provider-construction", "entrypoint-wiring", "local-gateway-canary", "repository-evidence"],
  excluded_effects: ["activation", "deployment", "publication", "credential-processing", "production-serving-change"],
  authority_effect: "bounded-construction-only",
}, "decision_digest");
atomicJson(resolve(evidenceRoot, "owner-decision.json"), decision);

const plan = seal({
  schema_version: "are.engine-improvement-plan/v1",
  cycle_id: cycleId,
  cycle_kind: "engine-improvement",
  objective: "Supply exact engine-owned continuity state to the existing IL-H04 renderer through real Codex wrapper and gateway entrypoints.",
  predecessor_package_digest: predecessor.package_digest,
  owner_decision_digest: decision.decision_digest,
  tasks: ["construct-provider", "wire-entrypoints", "run-real-gateway-canary", "run-regressions", "settle-evidence"],
  acceptance: ["closed-digest-bound-snapshot", "exact-selector-resolution", "unknown-selector-fails-closed", "high-risk-notification-surfaced", "repository-default-disabled", "all-tests-pass"],
  activation: "none",
  authority_effect: "none",
}, "plan_digest");
atomicJson(resolve(evidenceRoot, "provider-plan.json"), plan);

const tests = [
  runTests("continuity-provider-focused", wrapperRoot, ["test/continuity-binding-provider.test.mjs", "test/continuity-consumer.test.mjs", "test/continuity-renderer.test.mjs", "test/rpc-client.test.mjs"]),
  runTests("codex-wrapper-full", wrapperRoot, suiteFiles(wrapperRoot)),
  runTests("evolution-runtime-full", evolutionRoot, suiteFiles(evolutionRoot)),
];
const sourceFiles = [
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-binding-provider.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-consumer.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-renderer.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/continuity-binding-provider.test.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-continuity-provider-v1/run-gateway-canary.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-continuity-provider-v1/run-validation.mjs",
];
const sources = sourceFiles.map((path) => ({path, sha256: digest(readFileSync(resolve(repositoryRoot, path)))}));
const profile = JSON.parse(readFileSync(resolve(wrapperRoot, "profiles/repository-v1.json"), "utf8"));
if (profile.continuity_renderer?.enabled !== false) throw new Error("continuity-provider.repository-profile-enabled");

const validation = seal({
  schema_version: "are.continuity-provider-validation/v1",
  cycle_id: cycleId,
  decision_digest: decision.decision_digest,
  plan_digest: plan.plan_digest,
  predecessor_package_digest: predecessor.package_digest,
  snapshot_digest: snapshot.snapshot_digest,
  canary_result_digest: canary.result_digest,
  checks: {snapshot_integrity: true, selector_precedence: true, unresolved_selector_fail_closed: true, deterministic_risk_classification: true, real_gateway_path: true, host_notification: true, structural_receipts: true, repository_default_disabled: true, provider_model_calls: 0, serving_pointer_changes: 0},
  tests,
  sources,
  disposition: "validated-continuity-binding-provider",
  activation: "none",
  authority_effect: "none",
}, "validation_digest");
atomicJson(resolve(evidenceRoot, "provider-validation.json"), validation);

const providerPackage = seal({
  schema_version: "are.continuity-provider-package/v1",
  cycle_id: cycleId,
  cycle_kind: "engine-improvement",
  package_id: "IL-H04-continuity-binding-provider-v1",
  owner_decision_digest: decision.decision_digest,
  plan_digest: plan.plan_digest,
  predecessor_package_digest: predecessor.package_digest,
  snapshot_digest: snapshot.snapshot_digest,
  canary_result_digest: canary.result_digest,
  validation_digest: validation.validation_digest,
  decision: "recommend-provider-variant",
  eligible_scope: "shared-rpc/headless-entrypoints",
  limitations: ["Repository profile remains disabled.", "No provider/model call.", "No Codex Desktop/Windows UI adapter evidence.", "No real-user effectiveness cohort."],
  successor_requirement: "Activation remains a separately authorized controlled-upgrade decision using an operator-supplied exact continuity-state snapshot.",
  activation: "none",
  authority_effect: "none",
}, "package_digest");
atomicJson(resolve(evidenceRoot, "provider-package.json"), providerPackage);

process.stdout.write(`${canonicalJson({ok: true, cycle_id: cycleId, validation_digest: validation.validation_digest, package_digest: providerPackage.package_digest, tests: tests.map(({id, count, passed, failed}) => ({id, count, passed, failed})), activation: "none"})}\n`);
