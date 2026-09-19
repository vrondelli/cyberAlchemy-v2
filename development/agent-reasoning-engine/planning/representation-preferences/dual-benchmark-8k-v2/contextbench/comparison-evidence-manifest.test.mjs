import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {createComparisonEvidenceManifest,reconcileComparisonCampaignEvidence} from './comparison-evidence-manifest.mjs';
import {buildComparisonSchedule} from './comparison-schedule.mjs';
import {createComparisonOutcomeStore} from './comparison-outcome-store.mjs';
import {runComparisonQueue} from './comparison-queue.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url));
const sources={cohort_path,cohort_sha256:hash(readFileSync(cohort_path)),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
async function fixture(options,check){
 const root=mkdtempSync(join(tmpdir(),'comparison-evidence-')),outcome_root=join(root,'outcomes'),runs_root=join(root,'runs');mkdirSync(outcome_root);mkdirSync(runs_root);
 const schedule=buildComparisonSchedule(sources),entries=schedule.slots.map(s=>({slot_id:s.slot_id,files:null,transport_identity:null}));
 const persistence=createStagePersistence({stage_root:outcome_root,stage_guard:createStageOutputGuard({root:outcome_root})}),store=createComparisonOutcomeStore({root:outcome_root,schedule,sources,persistence}),controller=new AbortController();if(options.preAbort)controller.abort();
 try{
  const terminal=await runComparisonQueue({schedule,sources,signal:controller.signal,persist:store.persist,execute:async({slot})=>{
   const cell=slot.cell,task=JSON.parse(readFileSync(slot.task_path)),profile={model:'glm-5.3-flash',reasoning_effort:cell.provider_profile.reasoning_effort,output_cap:cell.limits.output_cap};
   const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(cell)},binding=slot.arm==='current-are'?hash(scope):hash({scope,profile,policy:'independent-native-v1'});
   const prompt=stable({messages:[{role:'user',content:task.problem_statement}],tools:[]}),reserved=100+cell.provider_profile.token_margin;
   const receipts=[{kind:'tokenizer',model:profile.model,dispatched:true,status:200,automatic_retries:0,input_tokens:100,retained_reasoning_reservation:0,retained_reasoning_occurrences:0,request_sha256:hash({model:profile.model,...JSON.parse(prompt)})},{...profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,reserved_input_tokens:reserved,request_sha256:hash(bodyForReceipt(prompt,profile))}];
   const result={instance_id:task.instance_id,cell_id:cell.cell_id,task_sha256:slot.task_sha256,status:'fixture',receipts,index_tokenizer_receipts:[]};
   if(options.unknown&&slot.sequence===0){result.receipts[1].output_tokens=null;return result;}
   const run=join(runs_root,String(slot.sequence).padStart(2,'0'));mkdirSync(join(run,'state'),{recursive:true});
   const body={version:1,binding,identity:'a'.repeat(64),phase:'idle',model_calls:1,tokenizer_calls:1,receipts};
   const values={'started.json':{cell,task_sha256:slot.task_sha256},'result.json':result,'state/glm-transport-ledger.json':{...body,ledger_digest:hash(body)}};
   if(slot.arm!=='current-are')values['state/driver-binding.json']={binding,scope,profile,context_limit:8000,recycle_at:7999,safety_margin:1};
   for(const [name,value]of Object.entries(values))writeFileSync(join(run,name),stable(value));
   writeFileSync(join(run,'events.jsonl'),stable({kind:'request-capture',capture:{prompt,prompt_sha256:hash(prompt)}})+'\n');
   writeFileSync(join(run,'completed.json'),stable({status:result.status,result_sha256:hash(readFileSync(join(run,'result.json')))}));
   entries[slot.sequence]={slot_id:slot.slot_id,transport_identity:body.identity,files:Object.fromEntries([...Object.keys(values),'events.jsonl','completed.json'].map(name=>[name,hash(readFileSync(join(run,name)))]))};return result;
  }});
  const seal=store.seal(terminal),manifest=createComparisonEvidenceManifest({schedule,sources,outcome_seal_sha256:seal.seal_sha256,entries});
  const args={outcome_root,runs_root,schedule,sources,manifest,expected_manifest_sha256:hash(manifest)};
  await check({args,terminal,entries});
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('binds actual fixed twelve-slot seal to all three arm evidence formats',async()=>fixture({},({args})=>{
 const r=reconcileComparisonCampaignEvidence(args);assert.equal(r.assigned_outcomes,12);assert.equal(r.reconciled_outcomes,12);assert.equal(r.all_run_evidence_reconciled,true);assert.equal(r.accepted_savings,null);assert.equal(r.benchmark_cleared,false);
 assert.equal(r.rows.reduce((n,r)=>n+r.evidence.ledger.total_tokens,0),1440);
}));
test('unstarted and interrupted slots retain full denominator and raw costs',async()=>{
 await fixture({preAbort:true},({args})=>{const r=reconcileComparisonCampaignEvidence(args);assert.equal(r.rows.length,12);assert.equal(r.reconciled_outcomes,0);assert.ok(r.rows.every(x=>x.status==='not-started'));});
 await fixture({unknown:true},({args})=>{const r=reconcileComparisonCampaignEvidence(args);assert.equal(r.rows.length,12);assert.equal(r.rows[0].status,'missing-run-evidence');assert.equal(r.rows[0].attempted,true);assert.equal(r.all_run_evidence_reconciled,false);assert.equal(r.accepted_savings,null);});
});
test('changed per-run bytes reject only that reconciliation while retaining every row',async()=>fixture({},({args})=>{
 writeFileSync(join(args.runs_root,'00/result.json'),'{}');const r=reconcileComparisonCampaignEvidence(args);assert.equal(r.rows.length,12);assert.equal(r.reconciled_outcomes,11);assert.equal(r.rows[0].status,'reconciliation-failed');
}));
test('manifest pin, slot order, file shape and outcome seal cannot be substituted',async()=>fixture({},({args})=>{
 for(const mutate of [a=>a.expected_manifest_sha256='0'.repeat(64),a=>a.manifest.entries.reverse(),a=>a.manifest.outcome_seal_sha256='0'.repeat(64),a=>a.manifest.entries[0].files['../escape']='0'.repeat(64)]){
  const a=structuredClone(args);mutate(a);if(a.expected_manifest_sha256===args.expected_manifest_sha256)a.expected_manifest_sha256=hash(a.manifest);assert.throws(()=>reconcileComparisonCampaignEvidence(a));
 }
 const entries=structuredClone(args.manifest.entries);entries.reverse();assert.throws(()=>createComparisonEvidenceManifest({schedule:args.schedule,sources,outcome_seal_sha256:args.manifest.outcome_seal_sha256,entries}),/slot-order/);
}));
