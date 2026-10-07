#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync} from "node:fs";
import {join, relative, resolve} from "node:path";
import {spawnSync} from "node:child_process";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";

const cycleId = "ilh04-host-confirmation-v1";
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
  const expected = value[digestKey];
  const material = Object.fromEntries(Object.entries(value).filter(([key]) => key !== digestKey));
  if (digest(material) !== expected) throw new Error(`host-confirmation.digest-invalid:${relative(repositoryRoot, path)}`);
  return value;
}

function runTests(id, cwd, files) {
  const run = spawnSync(process.execPath, ["--test", ...files], {cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  if (run.status !== 0) throw new Error(`host-confirmation.test-failed:${id}\n${output.slice(-8000)}`);
  const count = Number(output.match(/ℹ tests (\d+)/u)?.[1] ?? 0);
  const passed = Number(output.match(/ℹ pass (\d+)/u)?.[1] ?? 0);
  const failed = Number(output.match(/ℹ fail (\d+)/u)?.[1] ?? -1);
  if (!Number.isSafeInteger(count) || count < 1 || passed !== count || failed !== 0) throw new Error(`host-confirmation.test-summary-invalid:${id}`);
  return {id, command: [process.execPath, "--test", ...files], count, passed, failed, output_digest: digest(output)};
}

const suiteFiles = (cwd) => readdirSync(resolve(cwd, "test")).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => `test/${name}`);
const priorPackage = verifiedJson(resolve(evolutionRoot, "evidence/ilh04-engine-improvement-v1/integration-package.json"), "package_digest");
const canary = verifiedJson(resolve(evidenceRoot, "host-canary-result.json"), "result_digest");
if (priorPackage.decision !== "recommend-variant" || priorPackage.activation !== "none") throw new Error("host-confirmation.predecessor-invalid");
if (canary.disposition !== "headless-host-confirmed" || canary.metrics.host_surface_success_rate !== 1
  || canary.metrics.false_trigger_count !== 0 || !canary.integrity.tampered_notification_rejected
  || !canary.recovery.replayed_projection_suppressed || canary.repository_default_disabled !== true) throw new Error("host-confirmation.canary-invalid");

const decision = seal({
  schema_version: "are.owner-decision/v1",
  decision_id: "DG-IC-01",
  selection: "A",
  selected_path: "non-activating-host-canary",
  authorization_ref: "conversation:DG-IC-01=A",
  authorized_effects: ["bounded-local-host-canary", "repository-evidence", "host-consumer-construction"],
  excluded_effects: ["activation", "deployment", "publication", "credential-processing", "production-serving-change"],
  authority_effect: "bounded-construction-only",
}, "decision_digest");
atomicJson(resolve(evidenceRoot, "owner-decision.json"), decision);

const plan = seal({
  schema_version: "are.controlled-upgrade-preflight-plan/v1",
  cycle_id: cycleId,
  cycle_kind: "controlled-upgrade",
  phase: "non-activating-host-confirmation",
  objective: "Confirm that the shared headless Codex RPC host validates, receives, surfaces, receipts, and recovers IL-H04 continuity notifications without activating the repository profile.",
  predecessor_package_digest: priorPackage.package_digest,
  owner_decision_digest: decision.decision_digest,
  tasks: ["construct-validated-host-consumer", "run-high-and-low-risk-canary", "verify-integrity-and-recovery", "run-regressions", "settle-evidence"],
  acceptance: ["all-high-risk-surfaced", "zero-low-risk-or-disabled-false-triggers", "tamper-rejected", "replay-suppressed-after-recovery", "repository-default-disabled", "all-tests-pass"],
  product_frontier: "Validated shared RPC host consumer and structural receipt surface.",
  runnable_product_work: ["headless-wrapper-to-rpc-client-canary", "consumer-integrity-validation", "recovery-deduplication"],
  operational_tasks: [],
  affected_stages: ["wrapper-client-notification", "shared-rpc-host-consumption"],
  causal_blockers: [],
  deferred_operational_residue: ["Codex Desktop/Windows UI adapter", "real-user confirmation cohort", "serving activation"],
  activation: "none",
  authority_effect: "none",
}, "plan_digest");
atomicJson(resolve(evidenceRoot, "confirmation-plan.json"), plan);

const tests = [
  runTests("continuity-host-focused", wrapperRoot, ["test/continuity-consumer.test.mjs", "test/continuity-renderer.test.mjs", "test/rpc-client.test.mjs"]),
  runTests("codex-wrapper-full", wrapperRoot, suiteFiles(wrapperRoot)),
  runTests("evolution-runtime-full", evolutionRoot, suiteFiles(evolutionRoot)),
];
const sourceFiles = [
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-consumer.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-renderer.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/protocol.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/continuity-consumer.test.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-host-confirmation-v1/run-canary.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/ilh04-host-confirmation-v1/run-validation.mjs",
];
const sources = sourceFiles.map((path) => ({path, sha256: digest(readFileSync(resolve(repositoryRoot, path)))}));
const repositoryProfile = JSON.parse(readFileSync(resolve(wrapperRoot, "profiles/repository-v1.json"), "utf8"));
if (repositoryProfile.continuity_renderer?.enabled !== false) throw new Error("host-confirmation.repository-profile-enabled");

const validation = seal({
  schema_version: "are.continuity-host-confirmation-validation/v1",
  cycle_id: cycleId,
  decision_digest: decision.decision_digest,
  plan_digest: plan.plan_digest,
  predecessor_package_digest: priorPackage.package_digest,
  canary_result_digest: canary.result_digest,
  checks: {
    high_risk_surface_success: true,
    zero_false_triggers: true,
    notification_integrity: true,
    recovery_deduplication: true,
    structural_receipts: true,
    repository_default_disabled: true,
    provider_model_calls: 0,
    serving_pointer_changes: 0,
  },
  tests,
  sources,
  disposition: "validated-headless-host-confirmation",
  activation: "none",
  authority_effect: "none",
}, "validation_digest");
atomicJson(resolve(evidenceRoot, "confirmation-validation.json"), validation);

const confirmationPackage = seal({
  schema_version: "are.continuity-host-confirmation-package/v1",
  cycle_id: cycleId,
  cycle_kind: "controlled-upgrade",
  phase: "non-activating-host-confirmation",
  package_id: "IL-H04-headless-host-confirmation-v1",
  owner_decision_digest: decision.decision_digest,
  plan_digest: plan.plan_digest,
  predecessor_package_digest: priorPackage.package_digest,
  canary_result_digest: canary.result_digest,
  validation_digest: validation.validation_digest,
  metrics: canary.metrics,
  decision: "confirm-headless-host-surface",
  eligible_scope: "shared-rpc-client/headless",
  blocked_scope: "Codex Desktop/Windows UI",
  limitations: ["No repository-profile activation.", "No provider or model call.", "No Codex Desktop/Windows UI consumption evidence.", "No real-user effectiveness cohort."],
  successor_requirement: "A separately authorized controlled-upgrade decision may consider only the confirmed headless host scope; desktop UI activation requires its own adapter and canary.",
  activation: "none",
  authority_effect: "none",
}, "package_digest");
atomicJson(resolve(evidenceRoot, "confirmation-package.json"), confirmationPackage);

process.stdout.write(`${canonicalJson({ok: true, cycle_id: cycleId, canary_result_digest: canary.result_digest, validation_digest: validation.validation_digest, package_digest: confirmationPackage.package_digest, tests: tests.map(({id, count, passed, failed}) => ({id, count, passed, failed})), activation: "none", authority_effect: "none"})}\n`);
