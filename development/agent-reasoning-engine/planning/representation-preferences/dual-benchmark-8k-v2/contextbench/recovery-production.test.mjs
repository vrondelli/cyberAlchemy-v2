import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {verifyProductionFreeze,reconcileProduction,runProduction,runProductionStage} from './recovery-production.mjs';
import {runRecoveryCampaign} from './recovery-campaign.mjs';import {runPair} from './discovery-v1/run-recovery-pair.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
test('freeze rejects changed source, duplicate bindings and changed manifest; review cannot admit another manifest',async()=>{
 const root=mkdtempSync(join(tmpdir(),'production-freeze-'));try{
 const source=join(root,'source'),path=join(root,'freeze.json'),review=join(root,'review.json');writeFileSync(source,'source');const f={schema:'are.recovery-production-freeze/v1',files:[{path:source,sha256:hash('source')}]};writeFileSync(path,JSON.stringify(f));const digest=hash(readFileSync(path));
 assert.equal(verifyProductionFreeze(path,digest).files.length,1);writeFileSync(review,JSON.stringify({approved:true,live_execution_admitted:true,manifest_sha256:'wrong'}));
 await assert.rejects(runProduction({manifest_path:path,manifest_sha256:digest,review_path:review}),/exact-live-review-required/);
 writeFileSync(source,'changed');assert.throws(()=>verifyProductionFreeze(path,digest),/source-drift/);writeFileSync(source,'source');
 f.files.push(f.files[0]);writeFileSync(path,JSON.stringify(f));assert.throws(()=>verifyProductionFreeze(path,digest),/freeze-drift/);assert.throws(()=>verifyProductionFreeze(path,hash(readFileSync(path))),/duplicate-binding/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('all eight durable ledgers reconcile; pending phase, extra receipt, scope drift and live writer reject',async()=>{
 const root=mkdtempSync(join(tmpdir(),'production-ledgers-'));try{
 const evidence_root=join(root,'evidence'),source_root=join(root,'sources');mkdirSync(evidence_root);mkdirSync(source_root);
 const config={context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks:[0,1,2,3].map(i=>{const task_path=join(root,'task'+i+'.json'),task={instance_id:'i'+i,problem_statement:'test'};writeFileSync(task_path,JSON.stringify(task));return {id:'t'+i,instance_id:task.instance_id,task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:join(root,'cache'+i),base_commit:'a'.repeat(40),cell_template:{instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{output_cap:2048,maximum_calls:96,total_tokens:96000,finalization_reserve_tokens:14000,output_deferral:true},provider_profile:{}}};})};
 const terminal=await runRecoveryCampaign({config,evidence_root,source_root,binding:{},host_guard:()=>({admitted:true}),execute:args=>runPair({...args,client_factory:()=>({}),run_task:async({out,cell,task_path,persistence})=>{
  mkdirSync(join(out,'state'),{recursive:true});const task=JSON.parse(readFileSync(task_path)),receipts=[{kind:'model',status:200,dispatched:true,automatic_retries:0,input_tokens:20,output_tokens:5}];
  const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(stable(cell))};
  const ledger={version:1,binding:hash(stable(scope)),identity:'synthetic',phase:'idle',model_calls:1,tokenizer_calls:0,receipts};
  persistence.writeJson(join(out,'state','glm-transport-ledger.json'),{...ledger,ledger_digest:hash(stable(ledger))});
  return {status:'final_context_selected',native_export:{prediction:{synthetic:true}},receipts,index_tokenizer_receipts:[],recycling:{dispatches:[{projected_upper_bound:8000}]}};
 }})});
 const args={config,generation_root:evidence_root,terminal},result=reconcileProduction(args);assert.equal(result.arms.length,8);assert.equal(result.known_tokens,200);
 const state=join(evidence_root,'pairs','t0','control','state'),path=join(state,'glm-transport-ledger.json'),original=readFileSync(path);
 for(const mutation of [b=>b.phase='model-pending',b=>b.receipts.push({...b.receipts[0]}),b=>b.binding='b'.repeat(64)]){
  const {ledger_digest,...body}=JSON.parse(original);mutation(body);writeFileSync(path,JSON.stringify({...body,ledger_digest:hash(stable(body))}));assert.throws(()=>reconcileProduction(args));writeFileSync(path,original);
 }
 writeFileSync(join(state,'writer.lock'),'');assert.throws(()=>reconcileProduction(args),/writer-not-settled/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('qualification subprocess fails closed without a valid source manifest and respects deadline',async()=>{
 await assert.rejects(runProductionStage({operation:'qualify',args:{manifest_path:'/missing',manifest_sha256:'x'},deadline_ms:2000}),/ENOENT/);
 await assert.rejects(runProductionStage({operation:'qualify',args:{manifest_path:'/missing',manifest_sha256:'x'},deadline_ms:1}));
});
