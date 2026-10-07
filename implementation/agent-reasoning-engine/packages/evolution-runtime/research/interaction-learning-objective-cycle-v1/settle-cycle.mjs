#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

import {createDurableEvolutionKernel, createEvolutionCoordinator, loadCandidateCycleDefinitionRegistry} from "../../index.mjs";
import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";

const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; };
const cycleRoot = resolve(argument("--cycle-root") ?? "");
const engineRoot = join(cycleRoot, "engine");
const cycleRef = "cycle:interaction-learning:objective-continuity-v1";
const phase = "objective-cycle";
const validatorRef = "validator:interaction-learning-evidence-v1";
const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find((entry) => entry.cycle_kind === "interaction-learning");
if (!definition) throw new Error("interaction-settlement.definition-missing");

const files = [
  ["baseline", "baseline.json"],
  ["h01-hypothesis", "hypothesis.json"],
  ["h01-offline-screen", "offline-screen.json"],
  ["h01-live-run", "live-run.json"],
  ["h01-validation", "validation.json"],
  ["h01-learning-package", "learning-package.json"],
  ["h02-hypothesis", "hypothesis-v2.json"],
  ["h02-offline-screen", "offline-screen-v2.json"],
  ["h02-live-run", "live-run-v2.json"],
  ["h02-validation", "validation-v2.json"],
  ["h02-learning-package", "learning-package-v2.json"],
  ["h03-hypothesis", "hypothesis-v3.json"],
  ["h03-offline-screen", "offline-screen-v3.json"],
  ["h03-failed-attempt", "live-run-v3-failed-attempt-1.json"],
  ["h03-live-run", "live-run-v3.json"],
  ["h03-validation", "validation-v3.json"],
  ["h03-learning-package", "learning-package-v3.json"],
  ["h04-hypothesis", "hypothesis-v4.json"],
  ["h04-offline-screen", "offline-screen-v4.json"],
  ["h04-live-run", "live-run-v4.json"],
  ["h04-validation", "validation-v4.json"],
  ["h04-learning-package", "learning-package-v4.json"],
];
for (const [, file] of files) if (!existsSync(join(cycleRoot, file))) throw new Error(`interaction-settlement.artifact-missing:${file}`);
const hashFile = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const tasks = files.map(([name, file], index) => ({task_id:`task:interaction-learning:${name}`, title:`Bind verified ${name} evidence`, owner:"agent", lane:"interaction-learning", stage:name, question_ref:`question:interaction-learning:${name}`, depends_on:index ? [`task:interaction-learning:${files[index - 1][0]}`] : [], completion_criteria:[`criterion:interaction-learning:${name}`], validator_ref:validatorRef, artifact_file:file}));
const plan = {schema_version:"are.research-work-plan/v1", plan_digest:definition.definition_digest, research_dag:{dag_digest:"1".repeat(64)}, tasks, topological_order:tasks.map((task)=>task.task_id), authority_effect:"none"};
const envelope = {schema_version:"are.evolution-effect-envelope/v1", envelope_ref:"envelope:interaction-learning:objective-cycle-v1", cycle_ref:cycleRef, cycle_definition_digest:definition.definition_digest, authorization_ref:"decision:user-approved-interaction-learning-cycle", allowed_effect_classes:["repository-read"], resource_limits:{maximum_attempts:1, maximum_concurrency:1, maximum_tokens:64, maximum_cost:0, maximum_elapsed_seconds:300}, expires_at:"2030-01-01T00:00:00.000Z", enabled:true, authority_effect:"none"};
const actor = {actor_id:"agent:interaction-learning-cycle", actor_kind:"agent"};
const base = (revision, idempotency_key) => ({idempotency_key, expected_event_revision:revision, actor, worker_ref:null, cycle_ref:cycleRef, cycle_definition_ref:definition.definition_ref, cycle_definition_digest:definition.definition_digest});
const kernel = createDurableEvolutionKernel({root:engineRoot, require_enabled:false});
const coordinator = createEvolutionCoordinator({
  kernel,
  registry,
  verify_plan:(candidate)=>canonicalJson(candidate)===canonicalJson(plan),
  validators:{[validatorRef]:({task,evidence})=>{
    const expected = hashFile(join(cycleRoot, task.artifact_file));
    return {ok:evidence.length===1 && evidence[0].criterion_id===task.completion_criteria[0] && evidence[0].artifact_digest===expected};
  }},
  cycle_validators:{"interaction-learning":({definition:bound,plan:boundPlan,envelope:boundEnvelope})=>({ok:bound.definition_digest===definition.definition_digest && canonicalJson(boundPlan)===canonicalJson(plan) && boundEnvelope.authorization_ref===envelope.authorization_ref})},
});

let projection = coordinator.inspect().value;
let row = projection.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
if (!row) {
  const admitted = coordinator.admitPhase({...base(0,`${cycleRef}:admit`), phase, plan, envelope, prerequisite_receipt_refs:[]});
  if (admitted.disposition !== "accepted") throw new Error(`interaction-settlement.admission-failed:${admitted.reason_codes.join(",")}`);
}
while (true) {
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
  if (!row.frontier.length) break;
  const taskRef = row.frontier[0];
  const revision = row.event_refs.length;
  const leased = coordinator.leaseWork({...base(revision,`${cycleRef}:lease:${revision}`), phase, task_ref:taskRef, worker_ref:"worker:interaction-evidence-binder", rationale:"Bind an already verified objective-cycle artifact into the durable coordination projection.", effect_class:"repository-read", resource_request:{tokens:1,cost:0,elapsed_seconds:1}, lease_seconds:300});
  if (leased.disposition !== "accepted") throw new Error(`interaction-settlement.lease-failed:${leased.reason_codes.join(",")}`);
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
  const item = row.work_items.find((entry)=>entry.task_id===taskRef);
  const task = tasks.find((entry)=>entry.task_id===taskRef);
  const artifactDigest = hashFile(join(cycleRoot, task.artifact_file));
  const settled = coordinator.settleWork({...base(row.event_refs.length,`${cycleRef}:settle:${row.event_refs.length}`), phase, task_ref:taskRef, lease_ref:item.active_lease.lease_ref, fencing_token:item.active_lease.fencing_token, outcome:"succeeded", evidence:[{criterion_id:task.completion_criteria[0],artifact_ref:`artifact:interaction-learning:${task.stage}`,artifact_digest:artifactDigest}], accounting:{tokens:1,cost:0,elapsed_seconds:1}});
  if (settled.disposition !== "accepted") throw new Error(`interaction-settlement.settle-failed:${settled.reason_codes.join(",")}`);
}
const final = coordinator.inspect().value;
const finalRow = final.phases.find((entry)=>entry.cycle_ref===cycleRef && entry.phase===phase);
if (!finalRow || finalRow.work_items.some((entry)=>entry.state!=="completed")) throw new Error("interaction-settlement.incomplete");
const before = canonicalJson(final);
const restarted = createEvolutionCoordinator({kernel:createDurableEvolutionKernel({root:engineRoot,require_enabled:false}),registry,verify_plan:()=>true,validators:{},cycle_validators:{}}).inspect().value;
if (canonicalJson(restarted)!==before) throw new Error("interaction-settlement.restart-drift");
rmSync(join(engineRoot,"index","evolution.sqlite"),{force:true});
const recoveringKernel = createDurableEvolutionKernel({root:engineRoot,require_enabled:false});
if (recoveringKernel.diagnose().value.disposition!=="rebuild-required") throw new Error("interaction-settlement.recovery-diagnosis-invalid");
recoveringKernel.recover();
const recovered = createEvolutionCoordinator({kernel:recoveringKernel,registry,verify_plan:()=>true,validators:{},cycle_validators:{}}).inspect().value;
if (canonicalJson(recovered)!==before) throw new Error("interaction-settlement.recovery-drift");
const material = {schema_version:"are.interaction-learning-coordinator-settlement/v1",cycle_ref:cycleRef,definition_digest:definition.definition_digest,phase,task_count:finalRow.work_items.length,completed_task_count:finalRow.work_items.filter((entry)=>entry.state==="completed").length,accounting:finalRow.accounting,restart_verified:true,sqlite_loss_recovery_verified:true,coordination_projection_digest:createHash("sha256").update(before).digest("hex"),authority_effect:"none"};
const result = {...material,settlement_digest:createHash("sha256").update(canonicalJson(canonicalizeJson(material))).digest("hex")};
const path = join(cycleRoot,"coordinator-settlement.json");
mkdirSync(dirname(path),{recursive:true,mode:0o700});
const temporary = `${path}.tmp-${process.pid}`;
const descriptor = openSync(temporary,"wx",0o600);
try {writeFileSync(descriptor,`${canonicalJson(canonicalizeJson(result))}\n`);fsyncSync(descriptor);} finally {closeSync(descriptor);}
renameSync(temporary,path);
const directory = openSync(dirname(path),"r"); try {fsyncSync(directory);} finally {closeSync(directory);}
process.stdout.write(`${canonicalJson({ok:true,value:result,persisted_path:path,authority_effect:"none"})}\n`);
