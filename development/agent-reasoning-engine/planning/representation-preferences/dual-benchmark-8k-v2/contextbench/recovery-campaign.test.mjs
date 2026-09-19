import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {runRecoveryCampaign,campaignContract} from './recovery-campaign.mjs';
import {runPair} from './discovery-v1/run-recovery-pair.mjs';
import {hydrateReferencedSeal} from './referenced-generation-seal.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'campaign-test-')),evidence_root=join(root,'evidence'),source_root=join(root,'sources'),task_path=join(root,'task.json');mkdirSync(evidence_root);mkdirSync(source_root);writeFileSync(task_path,'{}');
 const config={context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks:[0,1,2,3].map(i=>({id:'task'+i,instance_id:'instance'+i,task_path,task_sha256:hash('{}'),repository_cache:join(root,'cache'+i),base_commit:'a'.repeat(40),cell_template:{instance_id:'instance'+i,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{output_cap:2048,maximum_calls:96,total_tokens:96000,finalization_reserve_tokens:14000,output_deferral:true},provider_profile:{}}}))};
 return {root,config,evidence_root,source_root,binding:{},host_guard:()=>({admitted:true}),clean:()=>rmSync(root,{recursive:true,force:true})};
}
const receipt={kind:'model',dispatched:true,input_tokens:20,output_tokens:5,status:200};
async function execute(args){return runPair({...args,client_factory:()=>({}),run_task:async({out})=>{mkdirSync(out);return {status:'final_context_selected',native_export:{prediction:{fixture:true}},receipts:[{...receipt}],recycling:{dispatches:[{projected_upper_bound:8000}]}};}});}
test('four fixed pairs run with at most two workers and hydrate all retained references',async()=>{
 const f=fixture();try{let active=0,peak=0,calls=0;
  const result=await runRecoveryCampaign({...f,execute:async args=>{active++;peak=Math.max(peak,active);calls++;try{await Promise.resolve();return await execute(args);}finally{active--;}}});
  assert.equal(peak,2);assert.equal(active,0);assert.equal(calls,4);assert.equal(result.status,'sealed');assert.equal(result.workers_settled,true);assert.equal(result.usage.total_tokens,200);assert.equal(result.seal.summary.assigned_arms,8);assert.equal(result.seal.summary.complete,true);assert.equal(result.seal.summary.benchmark_cleared,false);
  const slots=result.outcomes.map(r=>r.reference);assert.equal(hydrateReferencedSeal({root:f.evidence_root,seal:result.seal,expected_slots:slots,...campaignContract({config:f.config,root:f.evidence_root})}).length,4);
  await assert.rejects(runRecoveryCampaign({...f,execute}),/fresh-stage/);
  const pair=JSON.parse(readFileSync(join(f.evidence_root,slots[0].path)));const raw=readFileSync(pair.arms.control.result_path,'utf8');writeFileSync(pair.arms.control.result_path,raw+' ');
  assert.throws(()=>hydrateReferencedSeal({root:f.evidence_root,seal:result.seal,expected_slots:slots,...campaignContract({config:f.config,root:f.evidence_root})}),/result-drift/);
 }finally{f.clean();}
});
test('failed worker stops future jobs but waits for the other worker before final persistence',async()=>{
 const f=fixture();try{let release,started;const wait=new Promise(r=>release=r),ready=new Promise(r=>started=r);let calls=0;
  const running=runRecoveryCampaign({...f,execute:async args=>{calls++;if(args.task_id==='task0'){await Promise.resolve();throw Object.assign(Error('source failure'),{receipts:[{...receipt}]});}started();await wait;return execute(args);}});
  await ready;await new Promise(r=>setImmediate(r));assert.equal(existsSync(join(f.evidence_root,'RESULTS.json')),false);assert.equal(existsSync(join(f.evidence_root,'GENERATION-SEAL.json')),false);release();
  const result=await running;assert.equal(calls,2);assert.equal(result.status,'incomplete');assert.equal(result.outcomes.length,4);assert.equal(result.outcomes[0].status,'failed');assert.equal(result.outcomes[2].status,'not-started');assert.equal(result.outcomes[3].status,'not-started');assert.equal(result.usage.total_tokens,25);assert.equal(result.workers_settled,true);assert.equal(result.unknown_usage_calls,0);assert.equal(JSON.parse(readFileSync(join(f.evidence_root,'RESULTS.json'))).assigned_arms,8);
 }finally{f.clean();}
});
test('missing failure accounting reserves the entire pair budget without inventing receipts',async()=>{
 const f=fixture();try{const result=await runRecoveryCampaign({...f,execute:async()=>{throw Error('no ledger');}});assert.equal(result.status,'incomplete');assert.ok(result.unreconciled_pairs>=1);assert.equal(result.unknown_usage_calls,null);assert.equal(result.conservative_total_tokens,result.unreconciled_pairs*192000);assert.ok(result.outcomes.filter(r=>r.status==='failed').every(r=>r.receipts.length===0));}finally{f.clean();}
});

test('explicit unknown usage and contradictory attached spend cannot become zero-cost failures',async()=>{
 for(const extra of [{unknown_usage:true},{usage:{prompt_tokens:30,completion_tokens:5,total_tokens:35}}]){
  const f=fixture();try{const result=await runRecoveryCampaign({...f,execute:async()=>{throw Object.assign(Error('incomplete ledger'),{receipts:[],...extra});}});assert.equal(result.unknown_usage_calls,null);assert.ok(result.unreconciled_pairs>0);assert.equal(result.conservative_total_tokens,result.unreconciled_pairs*192000);if(extra.usage)assert.equal(result.usage.total_tokens,35*result.unreconciled_pairs);}finally{f.clean();}
 }
});
test('post-return pair persistence failure retains returned known usage with uncertainty',async()=>{
 const f=fixture();try{const result=await runRecoveryCampaign({...f,execute:async args=>{const pair=await execute(args);rmSync(join(args.directory,'result.json'));return pair;}});assert.equal(result.status,'incomplete');assert.ok(result.unreconciled_pairs>0);assert.equal(result.usage.total_tokens,50*result.unreconciled_pairs);assert.equal(result.unknown_usage_calls,null);assert.equal(result.conservative_total_tokens,192000*result.unreconciled_pairs);}finally{f.clean();}
});

test('receipt reconciliation failure still retains all fixed task outcomes',async()=>{
 const f=fixture();try{const result=await runRecoveryCampaign({...f,execute:async()=>{throw Object.assign(Error('overflow ledger'),{receipts:[{...receipt,input_tokens:Number.MAX_SAFE_INTEGER,output_tokens:10}]});}});assert.equal(result.status,'incomplete');assert.equal(result.outcomes.length,4);assert.equal(result.unknown_usage_calls,null);assert.ok(result.outcomes.filter(r=>r.status==='failed').every(r=>r.reconciliation_error&&r.receipts.length===1));assert.equal(result.conservative_total_tokens,result.unreconciled_pairs*192000);}finally{f.clean();}
});

test('positive spend contradicted by a non-dispatch flag is retained with uncertainty',async()=>{
 const f=fixture();try{const result=await runRecoveryCampaign({...f,execute:async()=>{throw Object.assign(Error('contradictory dispatch'),{receipts:[{...receipt,dispatched:false}]});}});assert.equal(result.unknown_usage_calls,null);assert.equal(result.usage.total_tokens,25*result.unreconciled_pairs);assert.equal(result.conservative_total_tokens,192000*result.unreconciled_pairs);}finally{f.clean();}
});
