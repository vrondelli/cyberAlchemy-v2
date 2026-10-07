#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

import {applyUpgradeDecision, createServingVersionStore, createUpgradeDecision} from "../../index.mjs";
import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";

const cycleId = "ilh04-headless-activation-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const providerRoot = resolve(evolutionRoot, "evidence/ilh04-continuity-provider-v1");
const runtimeRoot = resolve(evidenceRoot, "runtime");
const pointerPath = resolve(runtimeRoot, "serving-pointer.json");
const resultPath = resolve(evidenceRoot, "activation-result.json");
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
  if (digest(material) !== value[digestKey]) throw new Error(`headless-activation.digest-invalid:${path}`);
  return value;
}

const providerPackage = verifiedJson(resolve(providerRoot, "provider-package.json"), "package_digest");
const snapshot = verifiedJson(resolve(providerRoot, "continuity-binding-snapshot.json"), "snapshot_digest");
if (providerPackage.package_digest !== "1ee7240cbaa891e9a2911050995be4c19144c03e1abb06fcf4ff7afab203298f"
  || providerPackage.decision !== "recommend-provider-variant" || providerPackage.eligible_scope !== "shared-rpc/headless-entrypoints") throw new Error("headless-activation.provider-package-ineligible");

const predecessorRef = "continuity:repository-default-disabled";
const candidateRef = `continuity:IL-H04-provider:${providerPackage.package_digest}`;
const store = createServingVersionStore({path: pointerPath});
if (existsSync(resultPath)) {
  const retained = verifiedJson(resultPath, "result_digest");
  if (retained.disposition !== "activated" || store.read()?.version_ref !== candidateRef) throw new Error("headless-activation.replay-state-invalid");
  process.stdout.write(`${canonicalJson({ok: true, replayed: true, ...retained})}\n`);
  process.exit(0);
}
if (existsSync(pointerPath)) throw new Error("headless-activation.unsettled-pointer-exists");

const ownerDecision = seal({
  schema_version: "are.owner-decision/v1",
  decision_id: "DG-CU-01",
  selection: "admit",
  selected_path: "controlled-local-headless-activation",
  authorization_ref: "conversation:next-admitted",
  authorized_effects: ["single-cycle-instance-admission", "local-serving-pointer", "headless-gateway-canary", "rollback-exercise", "repository-evidence"],
  excluded_effects: ["global-cycle-definition-admission", "repository-default-profile-enablement", "desktop-ui-claim", "deployment", "publication", "credential-processing", "external-serving-change"],
  authority_effect: "bounded-local-activation-only",
}, "decision_digest");
atomicJson(resolve(evidenceRoot, "owner-decision.json"), ownerDecision);

const plan = seal({
  schema_version: "are.controlled-upgrade-plan/v1",
  cycle_id: cycleId,
  cycle_kind: "controlled-upgrade",
  phase: "controlled-local-headless-activation",
  objective: "Admit one controlled-upgrade instance, prove rollback, and retain the validated IL-H04 provider behind an evidence-owned local serving pointer for the confirmed headless scope.",
  owner_decision_digest: ownerDecision.decision_digest,
  provider_package_digest: providerPackage.package_digest,
  snapshot_digest: snapshot.snapshot_digest,
  tasks: ["admit-cycle-instance", "initialize-predecessor", "exercise-failed-canary-rollback", "run-real-gateway-canary", "retain-local-candidate-pointer", "validate-and-settle"],
  product_frontier: "Reversible local headless activation with an exact provider package and state snapshot.",
  runnable_product_work: ["local-serving-pointer-transition", "gateway-canary", "rollback-verification"],
  operational_tasks: [],
  affected_stages: ["controlled-upgrade-store", "shared-rpc-headless-gateway"],
  causal_blockers: [],
  deferred_operational_residue: ["repository-default enablement", "Codex Desktop/Windows adapter", "deployment", "real-user cohort"],
  activation_scope: "local-evidence-owned-headless-pointer",
  authority_effect: "none",
}, "plan_digest");
atomicJson(resolve(evidenceRoot, "activation-plan.json"), plan);

const initialized = store.write({version_ref: predecessorRef});
if (!initialized.ok) throw new Error(`headless-activation.pointer-initialize-failed:${initialized.disposition}`);
const upgradeDecision = createUpgradeDecision({
  current_version_ref: predecessorRef,
  candidate_version_ref: candidateRef,
  comparison_ref: `provider-package:${providerPackage.package_digest}`,
  comparison_outcome: "KEEP",
  required_keep_streak_met: true,
  reproduction_passed: true,
  holdout_passed: true,
  mode: "controlled-local",
  activation_enabled: true,
  canary_policy_ref: "canary:real-headless-gateway-plus-rollback/v1",
});
atomicJson(resolve(evidenceRoot, "upgrade-decision.json"), upgradeDecision);

const rollbackAttempt = await applyUpgradeDecision({decision: upgradeDecision, store, canary: async () => ({ok: false, reason: "bounded-rollback-exercise"})});
if (rollbackAttempt.disposition !== "rolled-back" || store.read()?.version_ref !== predecessorRef) throw new Error("headless-activation.rollback-not-proven");

let canary;
const activationAttempt = await applyUpgradeDecision({
  decision: upgradeDecision,
  store,
  canary: async () => {
    const run = spawnSync(process.execPath, [resolve(evolutionRoot, "research/ilh04-continuity-provider-v1/run-gateway-canary.mjs")], {cwd: evolutionRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024});
    if (run.status !== 0) return {ok: false, reason: `${run.stderr ?? ""}${run.stdout ?? ""}`.slice(-8000)};
    canary = verifiedJson(resolve(providerRoot, "gateway-canary-result.json"), "result_digest");
    return {ok: canary.disposition === "gateway-provider-confirmed" && canary.snapshot_digest === snapshot.snapshot_digest && canary.provider_model_calls === 0};
  },
});
if (activationAttempt.disposition !== "activated" || store.read()?.version_ref !== candidateRef || !canary) throw new Error("headless-activation.canary-activation-failed");
const repositoryProfile = JSON.parse(readFileSync(resolve(wrapperRoot, "profiles/repository-v1.json"), "utf8"));
if (repositoryProfile.continuity_renderer?.enabled !== false) throw new Error("headless-activation.repository-default-mutated");
const pointer = store.read();
const result = seal({
  schema_version: "are.headless-continuity-activation-result/v1",
  cycle_id: cycleId,
  owner_decision_digest: ownerDecision.decision_digest,
  plan_digest: plan.plan_digest,
  upgrade_decision_ref: upgradeDecision.record_id,
  upgrade_decision_digest: upgradeDecision.record_digest,
  provider_package_digest: providerPackage.package_digest,
  snapshot_digest: snapshot.snapshot_digest,
  gateway_canary_digest: canary.result_digest,
  rollback_attempt: rollbackAttempt,
  activation_attempt: activationAttempt,
  serving_pointer: pointer,
  checks: {cycle_instance_admitted: true, rollback_verified: true, real_gateway_canary_passed: true, local_pointer_retained: true, repository_default_disabled: true, provider_model_calls: 0},
  disposition: "activated",
  activation_scope: "local-evidence-owned-headless-pointer",
  claim_limit: "The retained pointer is local cycle evidence; entrypoints still require explicit profile selection and --continuity-state. No repository-default, Desktop UI, deployment, or external serving activation is claimed.",
  authority_effect: "none",
}, "result_digest");
atomicJson(resultPath, result);
process.stdout.write(`${canonicalJson({ok: true, replayed: false, ...result})}\n`);
