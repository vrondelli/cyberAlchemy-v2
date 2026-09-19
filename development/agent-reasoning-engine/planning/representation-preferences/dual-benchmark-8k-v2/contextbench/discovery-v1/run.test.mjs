import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {runPair,scorePair,accountReceipts,buildCell,validateConfig} from './run.mjs';
import {runEpisode} from './episode.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const receipt=(extra={})=>({kind:'model',dispatched:true,status:200,input_tokens:2,output_tokens:3,latency_ms:1,...extra});
function fixture(){
 const directory=mkdtempSync(join(homedir(),'.discovery-run-test-')),task_path=join(directory,'task.json');writeFileSync(task_path,'{}');
 const config={context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks:[0,1].map(i=>({id:'task'+i,instance_id:'instance'+i,task_path,task_sha256:createHash('sha256').update('{}').digest('hex'),repository_cache:'unused',cell_template:{instance_id:'instance'+i,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{output_cap:2048,maximum_calls:96,total_tokens:96000,finalization_reserve_tokens:14000,output_deferral:true},provider_profile:{}}}))};
 return {directory,config,clean:()=>rmSync(directory,{recursive:true,force:true})};
}
const success=()=>({status:'final_context_selected',native_export:{prediction:{}},selection:{final_read_ids:['fixture']},receipts:[receipt()],recycling:{dispatches:[{projected_upper_bound:3000}]}});
test('validates explicit config before effects; preflight cell builder matches both arms except treatment flag',async()=>{
 const f=fixture();try{
  assert.equal(validateConfig(f.config),true);const before=structuredClone(f.config),a=buildCell({config:f.config,task_id:'task0',arm:'control'}),b=buildCell({config:f.config,task_id:'task0',arm:'treatment'});
  for(const c of [a,b]){assert.equal(c.context_limit,8000);assert.equal(c.limits.total_tokens,96000);assert.equal(c.limits.compact_representation,true);assert.equal(c.limits.terminal_evidence_review,true);assert.equal(c.limits.terminal_evidence_max_handles,32);assert.equal(c.limits.terminal_evidence_max_state_bytes,8192);assert.equal(c.limits.terminal_evidence_max_state_tokens,2048);assert.equal(c.provider_profile.request_tokenizer_transport_attempts,1);}
  delete a.cell_id;delete b.cell_id;assert.equal(a.limits.discovery_retention,false);assert.equal(b.limits.discovery_retention,true);delete a.limits.discovery_retention;delete b.limits.discovery_retention;assert.deepEqual(a,b);assert.deepEqual(f.config,before);
  const out=join(f.directory,'bad');await assert.rejects(runPair({config:{...f.config,context_limit:8192},task_id:'task0',directory:out}),/fixed-budget/);assert.equal(existsSync(out),false);await assert.rejects(runPair({directory:out}),/explicit-config/);
 }finally{f.clean();}
});
test('alternates AB/BA by task index and repetition; both fixed arms sealed and score remains separate',async()=>{
 const f=fixture();try{
  for(const [task_id,repetition,order]of [['task0',1,['control','treatment']],['task1',1,['treatment','control']],['task0',2,['treatment','control']]]){
   const directory=join(f.directory,task_id+'-'+repetition),calls=[];const result=await runPair({config:f.config,task_id,repetition,directory,check_storage:()=>{},client_factory:()=>({}),run_task:async({out,cell})=>{mkdirSync(out);calls.push(cell.limits.discovery_retention?'treatment':'control');return success();}});
   assert.deepEqual(calls,order);assert.equal(result.planned_arms,2);assert.equal(result.usage.total_tokens,10);assert.equal(result.unknown_usage,false);assert.equal(result.generation_sealed,true);assert.ok(existsSync(join(directory,'result.json')));
   let scores=0;const scored=await scorePair({config:f.config,directory,native_score:async()=>{scores++;return {complete:true,reconstructed:true,metrics:{span_f1:1}};}});assert.equal(scores,2);assert.equal(scored.status,'completed');assert.equal(JSON.parse(readFileSync(join(directory,'result.json'))).arms.control.scoring_pending,true);
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
  let calls=0,reports=0;const pair=await runPair({config:f.config,task_id:'task0',directory:join(f.directory,'failure'),check_storage:()=>{},health:{isHealthy:()=>true,report:()=>{reports++;}},client_factory:()=>({}),run_task:async({out})=>{
   calls++;mkdirSync(out);writeFileSync(join(out,'result.json'),JSON.stringify({status:'stale',receipts:[]}));const rows=[receipt(),receipt({status:503,input_tokens:undefined,output_tokens:undefined})];throw Object.assign(Error('journal write failed'),{result:{status:'orchestration_error',receipts:rows},receipts:rows,unknown_usage:true});
  }});
  assert.equal(calls,1);assert.equal(pair.usage.total_tokens,5);assert.equal(pair.unknown_usage_calls,1);assert.equal(pair.conservative_total_tokens,8005);assert.equal(pair.provider_error_code,'1305');assert.equal(pair.arms.treatment.complete,false);assert.ok(reports>0);
 }finally{f.clean();}
});
test('shared health stops subsequent transport dispatch and second arm without aborting current call',async()=>{
 const f=fixture();try{
  let healthy=true,dispatches=0,tasks=0;const health={isHealthy:()=>healthy,report:()=>{healthy=false;}};
  const client_factory=()=>{const receipts=[];return {create_client:()=>({receipts,index_receipts:[],transport:{request_once:async()=>{dispatches++;receipts.push(receipt({status:429,input_tokens:undefined,output_tokens:undefined}));return {};}}}),measure_index_tokens:async()=>1};};
  const pair=await runPair({config:f.config,task_id:'task0',directory:join(f.directory,'health'),check_storage:()=>{},health,client_factory,run_task:async({out,cell,create_client,before_model_dispatch})=>{tasks++;mkdirSync(out);const client=await create_client({cell});assert.equal(await before_model_dispatch(),true);await client.transport.request_once({});assert.equal(await before_model_dispatch(),false);return {status:'run_error',receipts:client.receipts};}});
  assert.equal(dispatches,1);assert.equal(tasks,1);assert.equal(pair.unknown_usage,true);
  const stopped=await runPair({config:f.config,task_id:'task1',directory:join(f.directory,'stopped'),check_storage:()=>{},health,client_factory:()=>{throw Error('must not create client');}});assert.equal(stopped.usage.total_tokens,0);assert.equal(stopped.planned_arms,2);assert.ok(Object.values(stopped.arms).every(a=>!a.complete));
 }finally{f.clean();}
});
test('unknown usage remains unknown through outer pair persistence failure',async()=>{
 const f=fixture();try{
  await assert.rejects(runPair({config:f.config,task_id:'task0',directory:join(f.directory,'unknown-save'),check_storage:()=>{},client_factory:()=>({}),run_task:async({out})=>{mkdirSync(out);writeFileSync(join(dirname(out),'result.json'),'preserve');return {status:'run_error',receipts:[receipt({input_tokens:undefined})]};}}),e=>{assert.equal(e.unknown_usage,true);assert.equal(Object.hasOwn(e,'usage'),false);assert.equal(Object.hasOwn(e.receipt,'usage'),false);assert.equal(e.result.conservative_total_tokens,8000);return true;});
 }finally{f.clean();}
});
test('known-cost orchestration persistence error stops shared health and the second arm',async()=>{
 const f=fixture();try{
  let calls=0,healthy=true;const pair=await runPair({config:f.config,task_id:'task0',directory:join(f.directory,'disk-error'),check_storage:()=>{},health:{isHealthy:()=>healthy,report:e=>{if(e.persistence_failure)healthy=false;}},client_factory:()=>({}),run_task:async({out})=>{calls++;mkdirSync(out);throw Object.assign(Error('disk full'),{code:'ENOSPC',receipts:[receipt()],receipt:{persistence_failure:true},result:{receipts:[receipt()],persistence_failures:[{stage:'save',code:'ENOSPC'}]}});}});
  assert.equal(calls,1);assert.equal(pair.usage.total_tokens,5);assert.equal(pair.unknown_usage,false);assert.equal(pair.persistence_failure,true);assert.equal(healthy,false);
 }finally{f.clean();}
});
for(const persistence of [false,true])test('REAL frozen registered transport/recycler '+(persistence?'preserves known ledger failure and stops next arm':'denies next dispatch after shared health flips'),async()=>{
 const f=fixture();try{
  let healthy=true,calls=0,tasks=0;const receipts=[],health={isHealthy:()=>healthy,report:e=>{if(e.persistence_failure||e.unknown_usage||e.rate_limited)healthy=false;}};
  const transport=createStatelessRecyclingTransport({adapter_id:'runner-health-fixture',source_ref:'run.test.mjs',maximum_output_tokens:2048,measure_request:async()=>100,request_once:async({prompt})=>{
   calls++;const r=receipt({model:'fixture',output_cap:2048,reasoning_effort:'low',finish_reason:'tool_calls'});r.request_sha256=createHash('sha256').update(stable(bodyForReceipt(prompt,r))).digest('hex');receipts.push(r);
   if(persistence)throw Object.assign(Error('ledger disk full'),{code:'ENOSPC',receipt:{persistence_failure:true,usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}}});
   healthy=false;return {receipt:r,final_bytes:stable({finish_reason:'tool_calls',message:{role:'assistant',content:'',tool_calls:[{id:'get',type:'function',function:{name:'get_patch',arguments:'{}'}}]}})};
  }});
  assert.equal(Object.isFrozen(transport),true);assert.equal(transport.request_once,undefined);
  const pair=await runPair({config:f.config,task_id:'task0',directory:join(f.directory,'real'),check_storage:()=>{},health,client_factory:()=>({create_client:()=>({transport,receipts,index_receipts:[]})}),run_task:async({out,cell,create_client,before_model_dispatch})=>{
   tasks++;mkdirSync(out);mkdirSync(join(out,'base'));const client=await create_client({cell}),recycler=openContextRecycling({transport:client.transport,fixture_root:join(out,'base'),scope:{request:'Public fixture task'},options:{directory:join(out,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:'Public fixture task',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
   try{return await runEpisode({task:{problem_statement:'Public fixture task'},arm:'baseline',client,recycler,tools:[{type:'function',function:{name:'get_patch',parameters:{type:'object'}}}],execute_tool:async()=>({ok:true,output:{patch:''}}),measure_index_tokens:async()=>1,before_model_dispatch,limits:{...cell.limits,terminal_evidence_review:false,discovery_retention:false,output_deferral:false,terminal_submission:false,finalization_reserve_tokens:0,index_entries:0,index_tokens:0},run_id:'fixture'});}finally{recycler.close();}
  }});
  assert.equal(calls,1,JSON.stringify(pair.arms));assert.equal(tasks,1);assert.equal(pair.usage.total_tokens,5);assert.equal(pair.unknown_usage,false);
  const result=JSON.parse(readFileSync(pair.arms.control.result_path));
  if(persistence){assert.equal(result.status,'run_error');assert.equal(result.infrastructure_failure.code,'ENOSPC');assert.equal(pair.persistence_failure,true);assert.equal(healthy,false);}
  else assert.equal(result.admissions.at(-1).reason,'shared-health-stop');
 }finally{f.clean();}
});
test('post-pair persistence failure still throws exact known accumulated usage and receipts',async()=>{
 const f=fixture();try{
  const directory=join(f.directory,'persist');await assert.rejects(runPair({config:f.config,task_id:'task0',directory,check_storage:()=>{},client_factory:()=>({}),run_task:async({out})=>{mkdirSync(out);if(!existsSync(join(dirname(out),'result.json')))writeFileSync(join(dirname(out),'result.json'),'preserve');return success();}}),e=>{assert.equal(e.usage.total_tokens,10);assert.equal(e.unknown_usage,false);assert.equal(e.receipts.length,2);assert.equal(e.result.generation_sealed,false);return true;});
  assert.equal(readFileSync(join(directory,'result.json'),'utf8'),'preserve');
 }finally{f.clean();}
});
