#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

import {createDurableEvolutionKernel, createEvolutionCoordinator, loadCandidateCycleDefinitionRegistry} from "../../index.mjs";
import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";

const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; };
const cycleRoot = resolve(argument("--cycle-root") ?? "");
const engineRoot = join(cycleRoot, "engine");
const cycleRef = "cycle:engine-improvement:ilh04-wrapper-v1";
const phase = "construction-validation";
const validatorRef = "validator:ilh04-engine-improvement-artifact-v1";
const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find((entry) => entry.cycle_kind === "engine-improvement");
if (!definition) throw new Error("ilh04-settlement.definition-missing");

const files = [
  ["handoff", "input-handoff.json"],
  ["plan", "integration-plan.json"],
  ["comparison", "deterministic-comparison.json"],
  ["validation", "integration-validation.json"],
  ["package", "integration-package.json"],
];
for (const [, file] of files) if (!existsSync(join(cycleRoot, file))) throw new Error(`ilh04-settlement.artifact-missing:${file}`);
const hashFile = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const tasks = files.map(([name, file], index) => ({
  task_id:`task:ilh04-engine-improvement:${name}`,
  title:`Bind verified IL-H04 ${name} artifact`, owner:"agent", lane:"engine-improvement", stage:name,
  question_ref:`question:ilh04-engine-improvement:${name}`,
  depends_on:index ? [`task:ilh04-engine-improvement:${files[index - 1][0]}`] : [],
  completion_criteria:[`criterion:ilh04-engine-improvement:${name}`], validator_ref:validatorRef, artifact_file:file,
}));
const plan = {schema_version:"are.research-work-plan/v1",plan_digest:definition.definition_digest,research_dag:{dag_digest:"4".repeat(64)},tasks,topological_order:tasks.map((task)=>task.task_id),authority_effect:"none"};
const envelope = {schema_version:"are.evolution-effect-envelope/v1",envelope_ref:"envelope:engine-improvement:ilh04-wrapper-v1",cycle_ref:cycleRef,cycle_definition_digest:definition.definition_digest,authorization_ref:"decision:user-plan-and-do-ilh04-integration",allowed_effect_classes:["repository-read"],resource_limits:{maximum_attempts:1,maximum_concurrency:1,maximum_tokens:16,maximum_cost:0,maximum_elapsed_seconds:120},expires_at:"2030-01-01T00:00:00.000Z",enabled:true,authority_effect:"none"};
const actor = {actor_id:"agent:ilh04-engine-improvement",actor_kind:"agent"};
const base = (revision,idempotency_key) => ({idempotency_key,expected_event_revision:revision,actor,worker_ref:null,cycle_ref:cycleRef,cycle_definition_ref:definition.definition_ref,cycle_definition_digest:definition.definition_digest});
const kernel = createDurableEvolutionKernel({root:engineRoot,require_enabled:false});
const coordinator = createEvolutionCoordinator({
  kernel, registry,
  verify_plan:(candidate)=>canonicalJson(candidate)===canonicalJson(plan),
  validators:{[validatorRef]:({task,evidence})=>({ok:evidence.length===1 && evidence[0].criterion_id===task.completion_criteria[0] && evidence[0].artifact_digest===hashFile(join(cycleRoot,task.artifact_file))})},
  cycle_validators:{"engine-improvement":({definition:bound,plan:boundPlan,envelope:boundEnvelope})=>({ok:bound.definition_digest===definition.definition_digest && canonicalJson(boundPlan)===canonicalJson(plan) && boundEnvelope.authorization_ref===envelope.authorization_ref && boundEnvelope.allowed_effect_classes.length===1 && boundEnvelope.allowed_effect_classes[0]==="repository-read"})},
  now:()=>"2026-09-24T12:00:00.000Z",
});

let projection = coordinator.inspect().value;
let row = projection.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
if (!row) {
  const admitted = coordinator.admitPhase({...base(0,`${cycleRef}:admit`),phase,plan,envelope,prerequisite_receipt_refs:["interaction-learning:DG-IL-15:owner-decision"]});
  if (admitted.disposition !== "accepted") throw new Error(`ilh04-settlement.admission-failed:${admitted.reason_codes.join(",")}`);
}
while (true) {
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
  if (!row.frontier.length) break;
  const taskRef = row.frontier[0];
  const revision = row.event_refs.length;
  const leased = coordinator.leaseWork({...base(revision,`${cycleRef}:lease:${revision}`),phase,task_ref:taskRef,worker_ref:"worker:ilh04-evidence-binder",rationale:"Bind an already validated IL-H04 integration artifact.",effect_class:"repository-read",resource_request:{tokens:1,cost:0,elapsed_seconds:1},lease_seconds:300});
  if (leased.disposition !== "accepted") throw new Error(`ilh04-settlement.lease-failed:${leased.reason_codes.join(",")}`);
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
  const item = row.work_items.find((entry)=>entry.task_id===taskRef);
  const task = tasks.find((entry)=>entry.task_id===taskRef);
  const artifactDigest = hashFile(join(cycleRoot,task.artifact_file));
  const settled = coordinator.settleWork({...base(row.event_refs.length,`${cycleRef}:settle:${row.event_refs.length}`),phase,task_ref:taskRef,lease_ref:item.active_lease.lease_ref,fencing_token:item.active_lease.fencing_token,outcome:"succeeded",evidence:[{criterion_id:task.completion_criteria[0],artifact_ref:`artifact:ilh04-engine-improvement:${task.stage}`,artifact_digest:artifactDigest}],accounting:{tokens:1,cost:0,elapsed_seconds:1}});
  if (settled.disposition !== "accepted") throw new Error(`ilh04-settlement.settle-failed:${settled.reason_codes.join(",")}`);
}
const final = coordinator.inspect().value;
const finalRow = final.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
if (!finalRow || finalRow.work_items.some((entry)=>entry.state!=="completed")) throw new Error("ilh04-settlement.incomplete");
const before = canonicalJson(final);
const restarted = createEvolutionCoordinator({kernel:createDurableEvolutionKernel({root:engineRoot,require_enabled:false}),registry,verify_plan:()=>true,validators:{},cycle_validators:{}}).inspect().value;
if (canonicalJson(restarted)!==before) throw new Error("ilh04-settlement.restart-drift");
rmSync(join(engineRoot,"index","evolution.sqlite"),{force:true});
const recoveringKernel = createDurableEvolutionKernel({root:engineRoot,require_enabled:false});
if (recoveringKernel.diagnose().value.disposition!=="rebuild-required") throw new Error("ilh04-settlement.recovery-diagnosis-invalid");
recoveringKernel.recover();
const recovered = createEvolutionCoordinator({kernel:recoveringKernel,registry,verify_plan:()=>true,validators:{},cycle_validators:{}}).inspect().value;
if (canonicalJson(recovered)!==before) throw new Error("ilh04-settlement.recovery-drift");
const material = {schema_version:"are.engine-improvement-coordinator-settlement/v1",cycle_ref:cycleRef,definition_digest:definition.definition_digest,phase,task_count:finalRow.work_items.length,completed_task_count:finalRow.work_items.filter((entry)=>entry.state==="completed").length,accounting:finalRow.accounting,restart_verified:true,sqlite_loss_recovery_verified:true,coordination_projection_digest:createHash("sha256").update(before).digest("hex"),activation:"none",authority_effect:"none"};
const result = {...material,settlement_digest:createHash("sha256").update(canonicalJson(canonicalizeJson(material))).digest("hex")};
const path = join(cycleRoot,"coordinator-settlement.json");
mkdirSync(dirname(path),{recursive:true,mode:0o700});
const temporary = `${path}.tmp-${process.pid}`;
const descriptor = openSync(temporary,"wx",0o600);
try {writeFileSync(descriptor,`${canonicalJson(canonicalizeJson(result))}\n`);fsyncSync(descriptor);} finally {closeSync(descriptor);}
renameSync(temporary,path);
const directory = openSync(dirname(path),"r"); try {fsyncSync(directory);} finally {closeSync(directory);}
process.stdout.write(`${canonicalJson({ok:true,value:result,persisted_path:path,authority_effect:"none"})}\n`);
