#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync} from "node:fs";
import {resolve, join, relative} from "node:path";
import {spawnSync} from "node:child_process";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_OWNER_DECISION_DIGEST,
  materializeContinuityProjection,
  renderDeterministicContinuity,
} from "../../../codex-app-server-wrapper/index.mjs";
import {renderDeterministicContinuity as renderRetainedCandidate} from "../../src/deterministic-continuity-renderer-v4.mjs";
import {LIVE_SCENARIOS_V4} from "../interaction-learning-objective-cycle-v1/live-scenarios-v4.mjs";

const evolutionRoot = resolve(import.meta.dirname, "../..");
const areRoot = resolve(evolutionRoot, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const cycleId = "ilh04-engine-improvement-v1";
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const interactionRoot = resolve(evolutionRoot, "evidence/interaction-learning-objective-cycle-v1/runtime/cycles/interaction-learning-objective-cycle-v1");
const digest = (value) => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => ({...canonicalizeJson(material), [key]:digest(material)});

function atomicJson(path, value) {
  mkdirSync(resolve(path, ".."), {recursive:true, mode:0o700});
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
  if (digest(material) !== expected) throw new Error(`engine-improvement.input-digest-invalid:${relative(repositoryRoot, path)}`);
  return value;
}

function runTests(id, cwd, files) {
  const run = spawnSync(process.execPath, ["--test", ...files], {cwd, encoding:"utf8", maxBuffer:64 * 1024 * 1024});
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  if (run.status !== 0) throw new Error(`engine-improvement.test-failed:${id}\n${output.slice(-8000)}`);
  const count = Number(output.match(/ℹ tests (\d+)/u)?.[1] ?? 0);
  const passed = Number(output.match(/ℹ pass (\d+)/u)?.[1] ?? 0);
  const failed = Number(output.match(/ℹ fail (\d+)/u)?.[1] ?? -1);
  if (!Number.isSafeInteger(count) || count < 1 || passed !== count || failed !== 0) throw new Error(`engine-improvement.test-summary-invalid:${id}`);
  return {id, command:[process.execPath,"--test",...files], count, passed, failed, output_digest:digest(output)};
}

const suiteFiles = (cwd) => readdirSync(resolve(cwd, "test")).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => `test/${name}`);

const learningPackage = verifiedJson(join(interactionRoot, "learning-package-v4.json"), "package_digest");
const ownerDecision = verifiedJson(join(interactionRoot, "owner-decision.json"), "decision_digest");
if (learningPackage.package_digest !== CONTINUITY_LEARNING_PACKAGE_DIGEST || learningPackage.evaluator_verdict !== "candidate-supported"
  || ownerDecision.decision_digest !== CONTINUITY_OWNER_DECISION_DIGEST || ownerDecision.decision !== "retain-supported-candidate"
  || ownerDecision.retained_package_digest !== learningPackage.package_digest || ownerDecision.activation !== "none") throw new Error("engine-improvement.handoff-invalid");

const handoff = seal({
  schema_version:"are.engine-improvement-handoff/v1", cycle_id:cycleId,
  source_cycle_id:learningPackage.cycle_id, target_cycle_kind:"engine-improvement",
  accepted_artifacts:[{artifact_ref:"interaction-learning:IL-H04:learning-package-v4",artifact_digest:learningPackage.package_digest},{artifact_ref:"interaction-learning:DG-IL-15:owner-decision",artifact_digest:ownerDecision.decision_digest}],
  accepted_claims:["bounded-deterministic-renderer-supported","construction-retention-approved","activation-not-authorized"],
  disposition:"accepted-construction-input", activation:"none", authority_effect:"none",
}, "handoff_digest");
atomicJson(join(evidenceRoot, "input-handoff.json"), handoff);

const plan = seal({
  schema_version:"are.engine-improvement-plan/v1", cycle_id:cycleId,
  objective:"Integrate IL-H04 at the ARE objective-transition boundary behind a disabled reversible configuration.",
  input_handoff_digest:handoff.handoff_digest,
  tasks:["bind-retained-candidate","construct-wrapper-variant","compare-retained-scenarios","validate-wrapper-and-runtime","recommend-construction-variant"],
  acceptance:["exact-input-digests","20-of-20-render-parity","high-risk-context-and-notification","low-risk-bypass","fail-closed-binding","repository-default-disabled","all-tests-pass","activation-none"],
  rollback:"Keep continuity_renderer.enabled false or remove the wrapper adapter; preserve objective resolution and retained evidence.",
  activation:"none", authority_effect:"none",
}, "plan_digest");
atomicJson(join(evidenceRoot, "integration-plan.json"), plan);

const enabled = {enabled:true, mode:"context-and-notification", candidate_ref:CONTINUITY_CANDIDATE_REF, learning_package_digest:CONTINUITY_LEARNING_PACKAGE_DIGEST, owner_decision_digest:CONTINUITY_OWNER_DECISION_DIGEST};
let baselineProjectionCount = 0;
let candidateProjectionCount = 0;
let exactParityCount = 0;
const cases = [];
for (const scenario of LIVE_SCENARIOS_V4) {
  const input = {transition:scenario.expected_transition,active_objective:scenario.active_objective,active_cycle:scenario.active_cycle,relationship_code:scenario.relationship_code,response_language:scenario.response_language,next_action:scenario.next_pending_action,clarification_needed:scenario.clarification_expected,evidence_status:scenario.evidence_status};
  const resolution = {disposition:"resolved",transition:scenario.expected_transition,resolution_digest:digest({scenario_id:scenario.scenario_id,kind:"resolution"}),next_state:{state_digest:digest({scenario_id:scenario.scenario_id,kind:"state"}),active_objective:{description:scenario.active_objective}}};
  const binding = {high_risk:true,active_cycle:scenario.active_cycle,relationship_code:scenario.relationship_code,response_language:scenario.response_language,next_action:scenario.next_pending_action,clarification_needed:scenario.clarification_expected,evidence_status:scenario.evidence_status};
  const baseline = materializeContinuityProjection({configuration:{enabled:false},resolution,engine_binding:binding});
  const candidate = materializeContinuityProjection({configuration:enabled,resolution,engine_binding:binding});
  if (baseline.projection) baselineProjectionCount += 1;
  if (candidate.projection) candidateProjectionCount += 1;
  const retained = renderRetainedCandidate(input);
  const integrated = renderDeterministicContinuity(input);
  const parity = canonicalJson(retained) === canonicalJson(integrated) && candidate.projection?.response === retained.response;
  if (parity) exactParityCount += 1;
  cases.push({scenario_id:scenario.scenario_id, baseline_disposition:baseline.disposition, candidate_disposition:candidate.disposition, parity, projection_digest:candidate.projection?.projection_digest ?? null});
}
if (baselineProjectionCount !== 0 || candidateProjectionCount !== 20 || exactParityCount !== 20) throw new Error("engine-improvement.comparison-failed");
const comparison = seal({
  schema_version:"are.engine-improvement-comparison/v1", cycle_id:cycleId, plan_digest:plan.plan_digest,
  baseline:{variant:"repository-default-disabled",projection_count:baselineProjectionCount},
  candidate:{variant:"codex-wrapper-continuity-integration/v1",projection_count:candidateProjectionCount,exact_retained_parity_count:exactParityCount,scenario_count:20},
  metrics:{high_risk_projection_coverage:1,exact_render_parity_rate:1}, cases,
  disposition:"candidate-clears-deterministic-comparison", claim_limit:"Retained synthetic cohort and integration contract only; no real-user or production-effectiveness claim.",
  activation:"none", authority_effect:"none",
}, "comparison_digest");
atomicJson(join(evidenceRoot, "deterministic-comparison.json"), comparison);

const tests = [
  runTests("continuity-integration", wrapperRoot, ["test/continuity-renderer.test.mjs"]),
  runTests("codex-wrapper-full", wrapperRoot, suiteFiles(wrapperRoot)),
  runTests("evolution-runtime-full", evolutionRoot, suiteFiles(evolutionRoot)),
];
const sourceFiles = [
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/continuity-renderer.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/config.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/protocol.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json",
  "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/continuity-renderer.test.mjs",
];
const sources = sourceFiles.map((path) => ({path,sha256:digest(readFileSync(resolve(repositoryRoot,path)))}));
const repositoryProfile = JSON.parse(readFileSync(resolve(repositoryRoot,"implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json"),"utf8"));
if (repositoryProfile.continuity_renderer?.enabled !== false) throw new Error("engine-improvement.repository-profile-enabled");
const validation = seal({
  schema_version:"are.engine-improvement-validation/v1", cycle_id:cycleId, plan_digest:plan.plan_digest,
  handoff_digest:handoff.handoff_digest, comparison_digest:comparison.comparison_digest,
  checks:{exact_input_binding:true,retained_parity:true,high_risk_projection:true,low_risk_bypass:true,fail_closed_binding:true,repository_default_disabled:true,provider_calls:0,serving_pointer_changes:0},
  tests, sources, disposition:"validated-construction-candidate", activation:"none", authority_effect:"none",
}, "validation_digest");
atomicJson(join(evidenceRoot, "integration-validation.json"), validation);

const integrationPackage = seal({
  schema_version:"are.engine-improvement-package/v1", cycle_id:cycleId, package_id:"IL-H04-codex-wrapper-integration-v1",
  input_handoff_digest:handoff.handoff_digest, plan_digest:plan.plan_digest, comparison_digest:comparison.comparison_digest, validation_digest:validation.validation_digest,
  candidate:{candidate_ref:"codex-wrapper-continuity-integration/v1",renderer_ref:CONTINUITY_CANDIDATE_REF,surfaces:["objective-transition-resolution","codex-additional-context","typed-client-notification"],default_enabled:false,notification_method:"cyberalchemy/continuity"},
  decision:"recommend-variant", rollback:plan.rollback,
  limitations:["No production activation or serving-pointer change.","No real-user confirmation cohort.","Host UI consumption of the typed notification remains unverified."],
  successor_requirement:"A separately authorized interaction confirmation or controlled-upgrade cycle is required before activation.",
  activation:"none", authority_effect:"none",
}, "package_digest");
atomicJson(join(evidenceRoot, "integration-package.json"), integrationPackage);

process.stdout.write(`${canonicalJson({ok:true,cycle_id:cycleId,evidence_root:evidenceRoot,comparison_digest:comparison.comparison_digest,validation_digest:validation.validation_digest,package_digest:integrationPackage.package_digest,tests:tests.map(({id,count,passed,failed})=>({id,count,passed,failed})),activation:"none",authority_effect:"none"})}\n`);
