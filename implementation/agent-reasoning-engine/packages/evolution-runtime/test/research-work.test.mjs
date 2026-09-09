import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {digest} from "../../request-intent-runtime/src/canonical.mjs";
import {loadBenchmarkRegistrations} from "../src/benchmark-registration.mjs";
import {materializeResearchDag} from "../src/research-dag.mjs";
import {materializeResearchPlan,replayResearchWork,transitionResearchWork} from "../src/research-work.mjs";
const input=JSON.parse(readFileSync(new URL('../plans/requirement-research-v1.json',import.meta.url)));
const registrations=loadBenchmarkRegistrations().filter(r=>input.registration_digests.includes(r.registration_digest));
const research_dag=materializeResearchDag({registrations});
const build=tasks=>materializeResearchPlan({research_dag,registrations,tasks});
const plan=build(input.tasks), initial=replayResearchWork({plan,registrations});
const move=(state,event,verify_evidence)=>transitionResearchWork({plan,registrations,state,event,expected_state_digest:state.state_digest,verify_evidence});
const start={event_id:'start',task_id:'latency.inspect',action:'start'};
test('two independent branches begin ready while successors remain planned',()=>{
  assert.deepEqual(initial.frontier.product_construction,['latency.inspect','replication.design']);
  assert.equal(initial.tasks.length,9);assert.equal(initial.tasks.find(t=>t.task_id==='latency.run').state,'planned');
  assert.deepEqual(build([...input.tasks].reverse()),plan);
});
test('missing prerequisites, cycles, stale sources and direct status fields reject',()=>{
  const alter=()=>structuredClone(input.tasks);
  let t=alter();t[0].depends_on=['unknown'];assert.throws(()=>build(t));
  t=alter();t[0].depends_on=[t[1].task_id];assert.throws(()=>build(t),/cycle/);
  t=alter();t[0].state='completed';assert.throws(()=>build(t),/task-invalid/);
  assert.throws(()=>materializeResearchPlan({research_dag:{...research_dag,dag_digest:'bad'},registrations,tasks:input.tasks}),/source-drift/);
});
test('start requires readiness and returns an immutable successor',()=>{
  assert.throws(()=>move(initial,{...start,task_id:'latency.run'}),/not-ready/);
  const s=move(initial,start);assert.equal(s.tasks.find(t=>t.task_id===start.task_id).state,'running');
  assert.equal(initial.tasks.find(t=>t.task_id===start.task_id).state,'ready');assert.ok(Object.isFrozen(s.events));
});
test('completion requires current criterion-bound evidence and unlocks only its successor',()=>{
  const running=move(initial,start), payload={report:'Measured harness input composition',counts:{input:13661}};
  const evidence={criterion_id:'input-composition-report',artifact_ref:'fixture:input-report',artifact_digest:digest(payload)};
  const complete={event_id:'finish',task_id:start.task_id,action:'complete',evidence:[evidence]};
  const verify=b=>({ok:b.artifact_ref===evidence.artifact_ref && b.artifact_digest===digest(payload),binding:b});
  assert.throws(()=>move(running,complete),/verifier-required/);
  assert.throws(()=>move(running,{...complete,evidence:[]},verify),/evidence-required/);
  assert.throws(()=>move(running,complete,()=>({ok:true,binding:{}})),/not-verified/);
  const done=move(running,complete,verify);
  assert.deepEqual(done.frontier.product_construction,['latency.hypothesize','replication.design']);
  assert.deepEqual(replayResearchWork({plan,registrations,events:done.events,verify_evidence:verify}),done);
  payload.counts.input=1;
  assert.throws(()=>replayResearchWork({plan,registrations,events:done.events,verify_evidence:verify}),/not-verified/);
});
test('blocked dependencies propagate without blocking independent construction',()=>{
  const blocked=move(initial,{event_id:'block',task_id:start.task_id,action:'block',reason:'missing input evidence'});
  assert.deepEqual(blocked.frontier.product_construction,['replication.design']);
  assert.equal(blocked.tasks.find(t=>t.task_id==='latency.run').state,'blocked');
  const resumed=move(blocked,{event_id:'resume',task_id:start.task_id,action:'resume'});
  assert.deepEqual(resumed.frontier,initial.frontier);
});
test('idempotent events replay; conflicts, stale state and tampering block',()=>{
  const s=move(initial,start);
  assert.deepEqual(move(s,start),s);
  assert.throws(()=>move(s,{...start,action:'block',reason:'changed'}),/event-conflict/);
  assert.throws(()=>transitionResearchWork({plan,registrations,state:s,event:{event_id:'x',task_id:'replication.design',action:'start'},expected_state_digest:initial.state_digest}),/stale-state/);
  assert.throws(()=>move({...s,frontier:{}},start),/state-invalid/);
});
test('operational support is a separate queue, not an ambient prerequisite',()=>{
  const p=build([...input.tasks,{...input.tasks[0],task_id:'ops.review',lane:'operational-support',stage:'no-stage'}]);
  const s=replayResearchWork({plan:p,registrations});
  assert.deepEqual(s.frontier.operational_support,['ops.review']);
  assert.deepEqual(s.frontier.product_construction,initial.frontier.product_construction);
});
