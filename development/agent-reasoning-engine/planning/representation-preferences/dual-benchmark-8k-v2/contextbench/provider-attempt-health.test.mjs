import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
import {runPairWithProviderHealth} from './run-recovery-pair-provider-health.mjs';
import {runRecoveryCampaign} from './recovery-campaign.mjs';
const model={kind:'model',status:200,dispatched:true,automatic_retries:0,input_tokens:20,output_tokens:5};
const tokenizer={kind:'tokenizer',status:200,dispatched:true,automatic_retries:0,input_tokens:15};
const index={kind:'index-tokenizer',status:200,dispatched:true,tokens:10,transport_attempts:[{attempt:1,status:200}]};
test('every provider family validates terminal state, usage and one-attempt policy',()=>{
 assert.equal(providerAttemptHealth([model,tokenizer,index]).healthy,true);
 for(const bad of [{...tokenizer,status:null,failure_code:'deadline-exceeded'},{...model,status:null,input_tokens:undefined,output_tokens:undefined,failure_code:'cancelled'},{...index,status:'started',failure_code:'request-failed'},{...tokenizer,input_tokens:undefined},{...index,transport_attempts:[{attempt:1,status:200},{attempt:2,status:200}]},{...model,automatic_retries:1},{...model,dispatched:false},{...index,tokens:-1},{kind:'unrecognized'}]){
  const r=providerAttemptHealth([model,bad]);assert.equal(r.healthy,false);assert.equal(r.failures.length,1);assert.equal(r.failures[0].receipt_index,1);
 }
});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'provider-stop-')),evidence_root=join(root,'evidence'),source_root=join(root,'sources'),task_path=join(root,'task.json');mkdirSync(evidence_root);mkdirSync(source_root);writeFileSync(task_path,'{}');
 const config={context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks:[0,1,2,3].map(i=>({id:'task'+i,instance_id:'instance'+i,task_path,task_sha256:createHash('sha256').update('{}').digest('hex'),repository_cache:join(root,'cache'+i),base_commit:'a'.repeat(40),cell_template:{instance_id:'instance'+i,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{output_cap:2048,maximum_calls:96,total_tokens:96000,finalization_reserve_tokens:14000,output_deferral:true},provider_profile:{}}}))};
 return {root,config,evidence_root,source_root,binding:{},host_guard:()=>({admitted:true})};
}
test('actual campaign stop prevents next arm and queued tasks on tokenizer timeout, retaining known model cost',async()=>{
 const f=fixture();try{
 const started=[];
 const terminal=await runRecoveryCampaign({...f,execute:args=>runPairWithProviderHealth({...args,client_factory:()=>({}),run_task:async({out})=>{
  started.push(out);mkdirSync(out);
  return {status:'run_error',error:'glm.deadline-exceeded',receipts:[{...model},{...tokenizer,status:null,input_tokens:undefined,failure_code:'deadline-exceeded'}],index_tokenizer_receipts:[],recycling:{dispatches:[{projected_upper_bound:8000}]}};
 }})});
 assert.ok(started.length>=1&&started.length<=2);assert.equal(terminal.outcomes.filter(x=>x.status==='not-started').length,4-started.length);assert.equal(terminal.usage.total_tokens,25*started.length);assert.equal(terminal.unknown_usage_calls,0);
 // Both simultaneous workers may already have entered, but neither starts its second arm.
 assert.equal(new Set(started.map(p=>p.split('/').slice(-2,-1)[0])).size,started.length);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('index failure also stops; successful receipts preserve completed paired behavior',async()=>{
 for(const fail of [true,false]){
 const f=fixture();try{
 let calls=0;const terminal=await runRecoveryCampaign({...f,execute:args=>runPairWithProviderHealth({...args,client_factory:()=>({}),run_task:async({out})=>{
  calls++;mkdirSync(out);return {status:fail?'run_error':'final_context_selected',native_export:fail?null:{prediction:{synthetic:true}},receipts:[{...model},{...tokenizer}],index_tokenizer_receipts:[fail?{...index,status:'started',failure_code:'request-failed'}:structuredClone(index)],recycling:{dispatches:[{projected_upper_bound:8000}]}};
 }})});
 if(fail){assert.ok(calls<=2);assert.ok(terminal.outcomes.some(x=>x.status==='not-started'));}
 else{assert.equal(calls,8);assert.equal(terminal.seal.summary.complete,true);}
 assert.equal(terminal.usage.total_tokens,calls*25);
 }finally{rmSync(f.root,{recursive:true,force:true});}
 }
});
