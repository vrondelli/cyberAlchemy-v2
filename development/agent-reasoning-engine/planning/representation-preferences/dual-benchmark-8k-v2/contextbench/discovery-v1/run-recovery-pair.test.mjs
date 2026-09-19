import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {runPair,accountReceipts,buildCell,validateConfig} from './run-recovery-pair.mjs';
import {runEpisode} from './episode.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createStageOutputGuard} from '../packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from '../packet-diversity-v1/stage-persistence.mjs';
const receipt=(extra={})=>({kind:'model',dispatched:true,status:200,input_tokens:2,output_tokens:3,latency_ms:1,...extra});
function fixture(){
 const directory=mkdtempSync(join(homedir(),'.discovery-run-test-')),task_path=join(directory,'task.json');writeFileSync(task_path,'{}');
 const config={context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks:[0,1].map(i=>({id:'task'+i,instance_id:'instance'+i,task_path,task_sha256:createHash('sha256').update('{}').digest('hex'),repository_cache:'unused',cell_template:{instance_id:'instance'+i,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{output_cap:2048,maximum_calls:96,total_tokens:96000,finalization_reserve_tokens:14000,output_deferral:true},provider_profile:{}}}))};
 const evidence_root=join(directory,'evidence');mkdirSync(evidence_root);const persistence=createStagePersistence({stage_root:evidence_root,stage_guard:createStageOutputGuard({root:evidence_root})});
 return {directory:evidence_root,config,bounded:{persistence,evidence_root,source_root:join(directory,'sources'),admit_source:async()=>true},clean:()=>rmSync(directory,{recursive:true,force:true})};
}
const success=()=>({status:'final_context_selected',native_export:{prediction:{}},selection:{final_read_ids:['fixture']},receipts:[receipt()],recycling:{dispatches:[{projected_upper_bound:3000}]}});
test('validates explicit config before effects; preflight cell builder matches both arms except treatment flag',async()=>{
 const f=fixture();try{
  assert.equal(validateConfig(f.config),true);const before=structuredClone(f.config),a=buildCell({config:f.config,task_id:'task0',arm:'control'}),b=buildCell({config:f.config,task_id:'task0',arm:'treatment'});
  for(const c of [a,b]){assert.equal(c.context_limit,8000);assert.equal(c.limits.total_tokens,96000);assert.equal(c.limits.compact_representation,true);assert.equal(c.limits.terminal_evidence_review,true);assert.equal(c.limits.terminal_evidence_max_handles,32);assert.equal(c.limits.terminal_evidence_max_state_bytes,8192);assert.equal(c.limits.terminal_evidence_max_state_tokens,2048);assert.equal(c.provider_profile.request_tokenizer_transport_attempts,1);}
  delete a.cell_id;delete b.cell_id;assert.equal(a.limits.discovery_retention,true);assert.equal(b.limits.discovery_retention,true);assert.equal(a.limits.recovery_visibility,'eager');assert.equal(b.limits.recovery_visibility,'demand');delete a.limits.recovery_visibility;delete b.limits.recovery_visibility;assert.deepEqual(a,b);assert.deepEqual(f.config,before);
  const out=join(f.directory,'bad');await assert.rejects(runPair({...f.bounded,config:{...f.config,context_limit:8192},task_id:'task0',directory:out}),/fixed-budget/);assert.equal(existsSync(out),false);await assert.rejects(runPair({...f.bounded,directory:out}),/explicit-config/);
 }finally{f.clean();}
});
test('alternates AB/BA by task index and repetition; both fixed arms sealed and score remains separate',async()=>{
 const f=fixture();try{
  for(const [task_id,repetition,order]of [['task0',1,['control','treatment']],['task1',1,['treatment','control']],['task0',2,['treatment','control']]]){
   const directory=join(f.directory,task_id+'-'+repetition),calls=[];const result=await runPair({...f.bounded,config:f.config,task_id,repetition,directory,check_storage:()=>{},client_factory:()=>({}),run_task:async({out,cell})=>{mkdirSync(out);calls.push(cell.limits.recovery_visibility==='demand'?'treatment':'control');return success();}});
   assert.deepEqual(calls,order);assert.equal(result.planned_arms,2);assert.equal(result.usage.total_tokens,10);assert.equal(result.unknown_usage,false);assert.equal(result.generation_sealed,true);assert.ok(existsSync(join(directory,'result.json')));
   assert.equal(result.arms.control.scoring_pending,true);
  }
 }finally{f.clean();}
});
test('strict usage rejects negative/fractional/undefined-dispatch as unknown and normalizes capacity codes',()=>{
 for(const patch of [{input_tokens:-1},{output_tokens:1.5},{dispatched:undefined}]){const a=accountReceipts([receipt(patch)]);assert.equal(a.unknown_usage_calls,1);assert.equal(a.conservative_total_tokens,8000);assert.equal(a.total_tokens,0);}
 assert.equal(accountReceipts([receipt({dispatched:false,input_tokens:-1})]).model_calls,0);
 for(const patch of [{status:429},{provider_code:1302},{status:503},{provider_code:1305}])assert.equal(accountReceipts([receipt(patch)]).rate_limited,true);
});
test('orchestration throw carries in-memory receipts instead of stale disk; unknown stops next arm',async()=>{
 const f=fixture();try{
  let calls=0,reports=0;const pair=await runPair({...f.bounded,config:f.config,task_id:'task0',directory:join(f.directory,'failure'),check_storage:()=>{},health:{isHealthy:()=>true,report:()=>{reports++;}},client_factory:()=>({}),run_task:async({out})=>{
   calls++;mkdirSync(out);writeFileSync(join(out,'result.json'),JSON.stringify({status:'stale',receipts:[]}));const rows=[receipt(),receipt({status:503,input_tokens:undefined,output_tokens:undefined})];throw Object.assign(Error('journal write failed'),{result:{status:'orchestration_error',receipts:rows},receipts:rows,unknown_usage:true});
  }});
  assert.equal(calls,1);assert.equal(pair.usage.total_tokens,5);assert.equal(pair.unknown_usage_calls,1);assert.equal(pair.conservative_total_tokens,8005);assert.equal(pair.provider_error_code,'1305');assert.equal(pair.arms.treatment.complete,false);assert.ok(reports>0);
 }finally{f.clean();}
});
test('shared health stops subsequent transport dispatch and second arm without aborting current call',async()=>{
 const f=fixture();try{
  let healthy=true,dispatches=0,tasks=0;const health={isHealthy:()=>healthy,report:()=>{healthy=false;}};
  const client_factory=()=>{const receipts=[];return {create_client:()=>({receipts,index_receipts:[],transport:{request_once:async()=>{dispatches++;receipts.push(receipt({status:429,input_tokens:undefined,output_tokens:undefined}));return {};}}}),measure_index_tokens:async()=>1};};
  const pair=await runPair({...f.bounded,config:f.config,task_id:'task0',directory:join(f.directory,'health'),check_storage:()=>{},health,client_factory,run_task:async({out,cell,create_client,before_model_dispatch})=>{tasks++;mkdirSync(out);const client=await create_client({cell});assert.equal(await before_model_dispatch(),true);await client.transport.request_once({});assert.equal(await before_model_dispatch(),false);return {status:'run_error',receipts:client.receipts};}});
  assert.equal(dispatches,1);assert.equal(tasks,1);assert.equal(pair.unknown_usage,true);
  const stopped=await runPair({...f.bounded,config:f.config,task_id:'task1',directory:join(f.directory,'stopped'),check_storage:()=>{},health,client_factory:()=>{throw Error('must not create client');}});assert.equal(stopped.usage.total_tokens,0);assert.equal(stopped.planned_arms,2);assert.ok(Object.values(stopped.arms).every(a=>!a.complete));
 }finally{f.clean();}
});
test('unknown usage remains unknown through outer pair persistence failure',async()=>{
 const f=fixture();try{
  await assert.rejects(runPair({...f.bounded,config:f.config,task_id:'task0',directory:join(f.directory,'unknown-save'),check_storage:()=>{},client_factory:()=>({}),run_task:async({out})=>{mkdirSync(out);writeFileSync(join(dirname(out),'result.json'),'preserve');return {status:'run_error',receipts:[receipt({input_tokens:undefined})]};}}),e=>{assert.equal(e.unknown_usage,true);assert.equal(Object.hasOwn(e,'usage'),false);assert.equal(Object.hasOwn(e.receipt,'usage'),false);assert.equal(e.result.conservative_total_tokens,8000);return true;});
 }finally{f.clean();}
});
test('known-cost orchestration persistence error stops shared health and the second arm',async()=>{
 const f=fixture();try{
  let calls=0,healthy=true;const pair=await runPair({...f.bounded,config:f.config,task_id:'task0',directory:join(f.directory,'disk-error'),check_storage:()=>{},health:{isHealthy:()=>healthy,report:e=>{if(e.persistence_failure)healthy=false;}},client_factory:()=>({}),run_task:async({out})=>{calls++;mkdirSync(out);throw Object.assign(Error('disk full'),{code:'ENOSPC',receipts:[receipt()],receipt:{persistence_failure:true},result:{receipts:[receipt()],persistence_failures:[{stage:'save',code:'ENOSPC'}]}});}});
  assert.equal(calls,1);assert.equal(pair.usage.total_tokens,5);assert.equal(pair.unknown_usage,false);assert.equal(pair.persistence_failure,true);assert.equal(healthy,false);
 }finally{f.clean();}
});

for(const status of ['native_export_error','orchestration_error'])test('known-cost '+status+' stops shared health before next arm',async()=>{
 const f=fixture();try{
  let calls=0,healthy=true;const pair=await runPair({...f.bounded,config:f.config,task_id:'task0',directory:join(f.directory,status),check_storage:()=>{},health:{isHealthy:()=>healthy,report:event=>{assert.equal(event.infrastructure_failure,true);healthy=false;}},client_factory:()=>({}),run_task:async({out})=>{calls++;mkdirSync(out);return {status,receipts:[receipt()],native_export:null};}});
  assert.equal(calls,1);assert.equal(pair.usage.total_tokens,5);assert.equal(pair.unknown_usage,false);assert.equal(pair.infrastructure_failure,true);assert.equal(pair.arms.treatment.status,'not-started-after-shared-health-stop');assert.equal(healthy,false);
 }finally{f.clean();}
});

test('explicit infrastructure failure on final arm cannot count as completed generation',async()=>{
 const f=fixture();try{
  let calls=0;const pair=await runPair({...f.bounded,config:f.config,task_id:'task0',directory:join(f.directory,'last-infrastructure'),check_storage:()=>{},client_factory:()=>({}),run_task:async({out})=>{mkdirSync(out);calls++;return {...success(),...(calls===2?{infrastructure_failure:{code:'SOURCE_DRIFT'}}:{})};}});
  assert.equal(calls,2);assert.equal(pair.usage.total_tokens,10);assert.equal(pair.status,'incomplete');assert.equal(pair.arms.control.complete,true);assert.equal(pair.arms.treatment.complete,false);assert.equal(pair.infrastructure_failure,true);
 }finally{f.clean();}
});
