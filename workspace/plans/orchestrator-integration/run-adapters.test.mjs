// Open questions: PLAN.md#open-questions.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {projectNativeRuns,projectOrchestratorRuns,combineRunProjections} from '../../runtime/src/features/runs/run-adapters.ts';
const source={runtimeId:'local-native-01',label:'Local native',location:'local',observedAtMs:1000,nowMs:1000,maxAgeMs:5000,available:true};
const launchId='11111111-1111-4111-8111-111111111111',digest='a'.repeat(64),key='b'.repeat(64);
function native(status='succeeded'){
 const task={schema_version:'are-text-task/v1',task_id:'text_1',title:'Summarize notes',instruction:'Summarize this text.',input:'A bounded fixture.',objective_kind:'understand'};
 const task_digest=createHash('sha256').update(JSON.stringify(task)).digest('hex');
 const result={status:'passed',verified:true,task_digest,request_id:task.task_id,model:'gpt-5.6-luna',provider_calls:1,tools_enabled:false,max_output_tokens:512,completion_binding_digest:digest,thread_id:'thread-1',turn_id:'turn-1',prompt_sha256:'c'.repeat(64),output:'Fixture result'};
 return {schema_version:'are-native-console-state/v1',mode:'native-fixture',external_model_calls:0,jobs:[{id:launchId,task,task_digest,status,result:status==='succeeded'?result:null}]};
}
const owner=raw=>new Map([[launchId,{schema_version:'are-native-owner-result/v1',run_key:key,status:'PASS',replayed:true,result:structuredClone(raw.jobs[0].result)}]]);
function legacy(){return {schema_version:'cav2-orchestrator-current-state/v1-candidate',projection_revision:5,source_mode:'live-vps-candidate',runs:[{run_key:key,title:'Research',status:'closed',work_kind:'research',lifecycle:{execution:'pass',acceptance:'pending',promotion:'pending'},strategy:{model:'gpt-5.6-luna'},automation:{paused:false},graph:{completed:2,running:0,pending:0,blocked:0,total:2},result:{status:'available',kind:'audited-research',content:'Research result'}}]};}
test('native owner replay binds real run identity and fixture result without granting controls',async()=>{
 const raw=native(),before=JSON.stringify(raw),result=await projectNativeRuns(raw,source,owner(raw)),run=result.runs[0];
 assert.equal(run.runRef.runKey,key);assert.equal(run.result.verification,'owner-verified');assert.equal(run.mode,'fixture');assert.equal(run.icon,'text-task');assert.deepEqual(run.progress,{accepted:1,running:0,pending:0,blocked:0,total:1});assert.deepEqual(run.actions,[]);assert.equal(run.lifecycle.acceptance,null);assert.equal(JSON.stringify(raw),before);
});
test('preparation and verified completion retain one stable view identity',async()=>{
 const preparing=(await projectNativeRuns(native('preparing'),source)).runs[0];const raw=native(),completed=(await projectNativeRuns(raw,source,owner(raw))).runs[0];assert.equal(preparing.viewId,completed.viewId);assert.equal(preparing.runRef,null);assert.equal(preparing.progress,null);
});
test('old native records remain visible without fabricated owner references',async()=>{
 const run=(await projectNativeRuns(native(),source)).runs[0];assert.equal(run.runRef,null);assert.equal(run.result.verification,'source-reported');assert.ok(run.attention.includes('owner-run-reference-unavailable'));assert.equal(run.progress,null);
});
test('task bytes and closed task contract are checked',async()=>{
 const a=native();a.jobs[0].task.input='changed';await assert.rejects(projectNativeRuns(a,source),/RUN_TASK_DIGEST_MISMATCH/);
 const b=native();b.jobs[0].task.extra=true;await assert.rejects(projectNativeRuns(b,source),/RUN_TASK_SCHEMA_INVALID/);
});
test('owner output, task and history receipt mismatch are rejected',async()=>{
 for(const field of ['output','task_digest','completion_binding_digest','thread_id']){const raw=native(),receipts=owner(raw);receipts.get(launchId).result[field]='different';await assert.rejects(projectNativeRuns(raw,source,receipts),/RUN_/);}
 const raw=native(),receipts=owner(raw);receipts.get(launchId).replayed=false;await assert.rejects(projectNativeRuns(raw,source,receipts),/RUN_OWNER_RECEIPT_INVALID/);
});
test('uncertainty and cancellation do not become successful results',async()=>{
 for(const status of ['cancelled','uncertain','cancelling']){const raw=native(status);raw.jobs[0].result=native().jobs[0].result;const run=(await projectNativeRuns(raw,source)).runs[0];assert.equal(run.execution,status);assert.equal(run.result.content,null);assert.equal(run.progress,null);await assert.rejects(projectNativeRuns(raw,source,owner(raw)),/RUN_OWNER_STATE_CONFLICT/);}
});
test('duplicate task identities and orphan owner receipts fail closed',async()=>{
 const raw=native();raw.jobs.push({...raw.jobs[0],id:'22222222-2222-4222-8222-222222222222'});await assert.rejects(projectNativeRuns(raw,source),/RUN_DUPLICATE_TASK/);
 const a=native(),o=owner(a);o.set('orphan',{});await assert.rejects(projectNativeRuns(a,source,o),/RUN_OWNER_ORPHAN_RECEIPT/);
});
test('source freshness preserves previous observations and distinguishes offline',async()=>{
 const stale=(await projectNativeRuns(native(),{...source,nowMs:7000})).runs[0];assert.equal(stale.source.freshness,'stale');assert.equal(stale.execution,'succeeded');
 const offline=(await projectNativeRuns(native(),{...source,available:false})).runs[0];assert.equal(offline.source.freshness,'offline');assert.ok(offline.attention.includes('source-offline'));
 await assert.rejects(projectNativeRuns(native(),{...source,observedAtMs:2000}),/RUN_OBSERVATION_INVALID/);
});
test('legacy research preserves lifecycle and source-reported result',()=>{
 const run=projectOrchestratorRuns(legacy(),source).runs[0];assert.equal(run.execution,'succeeded');assert.equal(run.mode,'live');assert.equal(run.lifecycle.acceptance,'pending');assert.equal(run.result.verification,'source-reported');assert.equal(run.result.kind,'audited-research');assert.equal(run.icon,'research');
});
test('demo research and unknown execution do not imply live model execution',()=>{
 const raw=legacy();raw.runs[0].strategy.model='none';raw.runs[0].lifecycle={};const run=projectOrchestratorRuns(raw,source).runs[0];assert.equal(run.mode,'unknown');assert.equal(run.execution,'unknown');
 raw.source_mode='deterministic-local-fixture';assert.equal(projectOrchestratorRuns(raw,source).runs[0].mode,'fixture');
});
test('pause is scheduling state, not cancellation or completion',()=>{
 const raw=legacy();raw.runs[0].status='active';raw.runs[0].lifecycle.execution='in_progress';raw.runs[0].automation.paused=true;const run=projectOrchestratorRuns(raw,source).runs[0];assert.equal(run.scheduling,'paused');assert.equal(run.execution,'running');
});
test('malformed schema, status, progress and duplicate run references are rejected',async()=>{
 const a=legacy();a.runs[0].graph.running=NaN;assert.throws(()=>projectOrchestratorRuns(a,source),/RUN_INTEGER_INVALID/);
 const b=legacy();b.runs[0].graph.total=3;assert.throws(()=>projectOrchestratorRuns(b,source),/RUN_PROGRESS_INVALID/);
 const c=legacy();c.runs.push(c.runs[0]);assert.throws(()=>projectOrchestratorRuns(c,source),/RUN_DUPLICATE_ID/);
 const d=native();d.mode='live';await assert.rejects(projectNativeRuns(d,source),/RUN_NATIVE_SCHEMA_INVALID/);
 const e=native();e.jobs[0].status='invented';await assert.rejects(projectNativeRuns(e,source),/RUN_ENUM_INVALID/);
});
test('same run key in different runtimes stays distinct; a repeated source is rejected',async()=>{
 const raw=native(),a=await projectNativeRuns(raw,source,owner(raw)),b=projectOrchestratorRuns(legacy(),{...source,runtimeId:'vps-main'});const combined=combineRunProjections([a,b]);assert.equal(combined.runs.length,2);assert.notEqual(combined.runs[0].viewId,combined.runs[1].viewId);assert.throws(()=>combineRunProjections([a,a]),/RUN_DUPLICATE_SOURCE/);
});
test('empty offline source is retained rather than replaced by invented sample runs',async()=>{
 const raw=native();raw.jobs=[];const p=await projectNativeRuns(raw,{...source,available:false});assert.equal(p.runs.length,0);assert.equal(p.sources[0].freshness,'offline');
});
test('existing sibling console fixture projects with original identities and no source mutation',()=>{
 const raw=JSON.parse(readFileSync(new URL('../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/operator-state.json',import.meta.url)));const before=JSON.stringify(raw);const p=projectOrchestratorRuns(raw,source);assert.equal(p.runs.length,raw.runs.length);assert.deepEqual(p.runs.map(r=>r.runRef.runKey),raw.runs.map(r=>r.run_key));assert.ok(p.runs.every(r=>r.mode==='fixture'));assert.equal(JSON.stringify(raw),before);
});
test('integration DAG is acyclic and MCP is a final dependent stage',()=>{
 const dag=JSON.parse(readFileSync(new URL('./DAG.json',import.meta.url)));const map=new Map(dag.nodes.map(n=>[n.id,n]));assert.equal(map.size,dag.nodes.length);const visiting=new Set(),done=new Set();function visit(id){assert.ok(map.has(id));assert.ok(!visiting.has(id),'DAG cycle');if(done.has(id))return;visiting.add(id);for(const dep of map.get(id).depends_on)visit(dep);visiting.delete(id);done.add(id);}for(const id of map.keys())visit(id);assert.equal(done.size,dag.nodes.length);assert.ok(!dag.nodes.some(n=>n.depends_on.includes('T10')));assert.deepEqual(map.get('T1').depends_on,[]);assert.ok(dag.operational_tasks.every(n=>!n.blocks_current_frontier));
});
test('legacy run strategy retains nodes, dependencies and persona bindings',()=>{
 const raw=legacy(),strategy={kind:'recorded-research',model:'gpt-5.6-luna',goal:'Research',max_parallelism:1,nodes:[{node_id:'read',role_id:'reader',stage:'source',depends_on:[],max_attempts:1,status:'succeeded',persona_ref:'turing',persona_version:'1'},{node_id:'write',role_id:'writer',stage:'synthesis',depends_on:['read'],max_attempts:2,status:'pending'}],edges:[{from:'read',to:'write'}]};
 raw.runs[0].strategy=strategy;
 assert.deepEqual(projectOrchestratorRuns(raw,source).runs[0].strategy,strategy);
});
