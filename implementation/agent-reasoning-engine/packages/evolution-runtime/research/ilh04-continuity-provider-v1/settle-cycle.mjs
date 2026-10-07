#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";

import {createDurableEvolutionKernel, createEvolutionCoordinator, loadCandidateCycleDefinitionRegistry} from "../../index.mjs";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";

const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; };
const cycleRoot = resolve(argument("--cycle-root") ?? "");
const engineRoot = join(cycleRoot, "engine");
const cycleRef = "cycle:engine-improvement:ilh04-continuity-provider-v1";
const phase = "provider-integration";
const validatorRef = "validator:ilh04-continuity-provider-artifact-v1";
const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find((entry) => entry.cycle_kind === "engine-improvement");
if (!definition) throw new Error("continuity-provider-settlement.definition-missing");
const files = [
  ["decision", "owner-decision.json"],
  ["plan", "provider-plan.json"],
  ["snapshot", "continuity-binding-snapshot.json"],
  ["canary", "gateway-canary-result.json"],
  ["validation", "provider-validation.json"],
  ["package", "provider-package.json"],
];
for (const [, file] of files) if (!existsSync(join(cycleRoot, file))) throw new Error(`continuity-provider-settlement.artifact-missing:${file}`);
const hashFile = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const tasks = files.map(([name, file], index) => ({
  task_id: `task:ilh04-continuity-provider:${name}`,
  title: `Bind verified IL-H04 continuity provider ${name} artifact`,
  owner: "agent",
  lane: "engine-improvement",
  stage: name,
  question_ref: `question:ilh04-continuity-provider:${name}`,
  depends_on: index ? [`task:ilh04-continuity-provider:${files[index - 1][0]}`] : [],
  completion_criteria: [`criterion:ilh04-continuity-provider:${name}`],
  validator_ref: validatorRef,
  artifact_file: file,
}));
const plan = {schema_version: "are.research-work-plan/v1", plan_digest: definition.definition_digest, research_dag: {dag_digest: "6".repeat(64)}, tasks, topological_order: tasks.map((task) => task.task_id), authority_effect: "none"};
const envelope = {schema_version: "are.evolution-effect-envelope/v1", envelope_ref: "envelope:engine-improvement:ilh04-continuity-provider-v1", cycle_ref: cycleRef, cycle_definition_digest: definition.definition_digest, authorization_ref: "decision:DG-CP-01:A", allowed_effect_classes: ["repository-read"], resource_limits: {maximum_attempts: 1, maximum_concurrency: 1, maximum_tokens: 16, maximum_cost: 0, maximum_elapsed_seconds: 120}, expires_at: "2030-01-01T00:00:00.000Z", enabled: true, authority_effect: "none"};
const actor = {actor_id: "agent:ilh04-continuity-provider", actor_kind: "agent"};
const base = (revision, idempotency_key) => ({idempotency_key, expected_event_revision: revision, actor, worker_ref: null, cycle_ref: cycleRef, cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest});
const coordinatorOptions = (kernel, strict = true) => ({
  kernel,
  registry,
  verify_plan: strict ? (candidate) => canonicalJson(candidate) === canonicalJson(plan) : () => true,
  validators: strict ? {[validatorRef]: ({task, evidence}) => ({ok: evidence.length === 1 && evidence[0].criterion_id === task.completion_criteria[0] && evidence[0].artifact_digest === hashFile(join(cycleRoot, task.artifact_file))})} : {},
  cycle_validators: strict ? {"engine-improvement": ({definition: bound, plan: boundPlan, envelope: boundEnvelope}) => ({ok: bound.definition_digest === definition.definition_digest && canonicalJson(boundPlan) === canonicalJson(plan) && boundEnvelope.authorization_ref === envelope.authorization_ref && boundEnvelope.allowed_effect_classes[0] === "repository-read"})} : {},
  now: () => "2026-09-24T20:00:00.000Z",
});
const kernel = createDurableEvolutionKernel({root: engineRoot, require_enabled: false});
const coordinator = createEvolutionCoordinator(coordinatorOptions(kernel));
let projection = coordinator.inspect().value;
let row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
if (!row) {
  const admitted = coordinator.admitPhase({...base(0, `${cycleRef}:admit`), phase, plan, envelope, prerequisite_receipt_refs: ["controlled-upgrade:IL-H04:host-confirmation", "decision:DG-CP-01:A"]});
  if (admitted.disposition !== "accepted") throw new Error(`continuity-provider-settlement.admission-failed:${admitted.reason_codes.join(",")}`);
}
while (true) {
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
  if (!row.frontier.length) break;
  const taskRef = row.frontier[0];
  const revision = row.event_refs.length;
  const leased = coordinator.leaseWork({...base(revision, `${cycleRef}:lease:${revision}`), phase, task_ref: taskRef, worker_ref: "worker:ilh04-provider-evidence-binder", rationale: "Bind an already validated non-activating provider artifact.", effect_class: "repository-read", resource_request: {tokens: 1, cost: 0, elapsed_seconds: 1}, lease_seconds: 300});
  if (leased.disposition !== "accepted") throw new Error(`continuity-provider-settlement.lease-failed:${leased.reason_codes.join(",")}`);
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
  const item = row.work_items.find((entry) => entry.task_id === taskRef);
  const task = tasks.find((entry) => entry.task_id === taskRef);
  const settled = coordinator.settleWork({...base(row.event_refs.length, `${cycleRef}:settle:${row.event_refs.length}`), phase, task_ref: taskRef, lease_ref: item.active_lease.lease_ref, fencing_token: item.active_lease.fencing_token, outcome: "succeeded", evidence: [{criterion_id: task.completion_criteria[0], artifact_ref: `artifact:ilh04-continuity-provider:${task.stage}`, artifact_digest: hashFile(join(cycleRoot, task.artifact_file))}], accounting: {tokens: 1, cost: 0, elapsed_seconds: 1}});
  if (settled.disposition !== "accepted") throw new Error(`continuity-provider-settlement.settle-failed:${settled.reason_codes.join(",")}`);
}
const final = coordinator.inspect().value;
const finalRow = final.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
if (!finalRow || finalRow.work_items.some((entry) => entry.state !== "completed")) throw new Error("continuity-provider-settlement.incomplete");
const before = canonicalJson(final);
const restarted = createEvolutionCoordinator(coordinatorOptions(createDurableEvolutionKernel({root: engineRoot, require_enabled: false}), false)).inspect().value;
if (canonicalJson(restarted) !== before) throw new Error("continuity-provider-settlement.restart-drift");
rmSync(join(engineRoot, "index", "evolution.sqlite"), {force: true});
const recoveringKernel = createDurableEvolutionKernel({root: engineRoot, require_enabled: false});
if (recoveringKernel.diagnose().value.disposition !== "rebuild-required") throw new Error("continuity-provider-settlement.recovery-diagnosis-invalid");
recoveringKernel.recover();
const recovered = createEvolutionCoordinator(coordinatorOptions(recoveringKernel, false)).inspect().value;
if (canonicalJson(recovered) !== before) throw new Error("continuity-provider-settlement.recovery-drift");
const material = {schema_version: "are.continuity-provider-coordinator-settlement/v1", cycle_ref: cycleRef, definition_digest: definition.definition_digest, phase, task_count: finalRow.work_items.length, completed_task_count: finalRow.work_items.filter((entry) => entry.state === "completed").length, accounting: finalRow.accounting, restart_verified: true, sqlite_loss_recovery_verified: true, coordination_projection_digest: createHash("sha256").update(before).digest("hex"), activation: "none", authority_effect: "none"};
const settlement = {...material, settlement_digest: createHash("sha256").update(canonicalJson(material)).digest("hex")};
writeFileSync(join(cycleRoot, "coordinator-settlement.json"), `${canonicalJson(settlement)}\n`, {mode: 0o600});
process.stdout.write(`${canonicalJson({ok: true, ...settlement})}\n`);
