import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {runComparisonCampaign} from './comparison-compact-campaign-runner.mjs';import {buildComparisonSchedule} from './comparison-schedule.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url)),sources={cohort_path,cohort_sha256:hash(readFileSync(cohort_path)),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
async function fixture(options={},check){
 const root=mkdtempSync(join(tmpdir(),'comparison-campaign-')),schedule=buildComparisonSchedule(sources),roots=Object.fromEntries(['outcome','runs','metadata','source'].map(k=>[k+'_root',join(root,k)]));
 if(options.nestedSource)roots.source_root=join(roots.outcome_root,'..source');
 for(const k of ['outcome_root','runs_root','metadata_root'])mkdirSync(roots[k]);
 const persistence=key=>createStagePersistence({stage_root:roots[key],stage_guard:createStageOutputGuard({root:roots[key]})});
 const outcome_persistence=persistence('outcome_root'),run_persistence=persistence('runs_root'),metadataBase=persistence('metadata_root'),metadata_persistence={...metadataBase,writeJson(path,value,opts){if(options.metadataFailure)throw Error('fixture.metadata-full');return metadataBase.writeJson(path,value,opts);}};
 let admissions=0,factories=0,executions=0,active=0,maximum=0;const signals=[];
 const create_factory=({signal})=>{factories++;signals.push(signal);return {create_client:async args=>{assert.equal(args.signal,signal);return {identity:'a'.repeat(64)};},measure_index_tokens:async()=>100};};
 const execute_arm=async args=>{
  executions++;active++;maximum=Math.max(maximum,active);await new Promise(resolve=>setTimeout(resolve,1));
  try{
   const slot=schedule.slots.find(s=>s.task_id===args.task_id&&s.arm===args.arm),cell=slot.cell,task=JSON.parse(readFileSync(slot.task_path));
   const client=await args.create_client({cell,signal:args.signal});
   const profile={model:'glm-5.3-flash',reasoning_effort:cell.provider_profile.reasoning_effort,output_cap:cell.limits.output_cap},prompt=stable({messages:[{role:'user',content:task.problem_statement}],tools:[]});
   const receipts=[{kind:'tokenizer',model:profile.model,dispatched:true,status:200,automatic_retries:0,input_tokens:100,retained_reasoning_reservation:0,retained_reasoning_occurrences:0,request_sha256:hash({model:profile.model,...JSON.parse(prompt)})},{...profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,reserved_input_tokens:100+cell.provider_profile.token_margin,request_sha256:hash(bodyForReceipt(prompt,profile))}];
   const result={instance_id:task.instance_id,cell_id:cell.cell_id,task_sha256:slot.task_sha256,status:'fixture',receipts,index_tokenizer_receipts:[]};
   if(options.failure&&slot.sequence===0)throw Object.assign(Error('fixture.after-paid-call'),{result});
   const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(cell)},binding=slot.arm==='current-are'?hash(scope):hash({scope,profile,policy:'independent-native-v1'});
   const body={version:1,binding,identity:client.identity,phase:'idle',model_calls:1,tokenizer_calls:1,receipts};
   const save=(name,value)=>args.persistence.writeJson(join(args.out,name),value);
   save('started.json',{cell,task_sha256:slot.task_sha256});save('result.json',result);save('completed.json',{status:result.status,result_sha256:hash(readFileSync(join(args.out,'result.json')))});save('state/glm-transport-ledger.json',{...body,ledger_digest:hash(body)});
   if(slot.arm!=='current-are')save('state/driver-binding.json',{binding,scope,profile,context_limit:8000,recycle_at:7999,safety_margin:1});
   args.persistence.append(join(args.out,'events.jsonl'),stable({kind:'request-capture',capture:{prompt,prompt_sha256:hash(prompt)}})+'\n');return result;
  }finally{active--;}
 };
 try{let result,error;try{result=await runComparisonCampaign({schedule,sources,...roots,outcome_persistence,run_persistence,metadata_persistence,signal:new AbortController().signal,admit_campaign:async()=>{admissions++;return !options.deny;},admit_source:async()=>true,before_model_dispatch:async()=>true},{create_factory,execute_arm});}catch(e){error=e;}
  await check({result,error,admissions,factories,executions,maximum,signals,roots});
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('campaign composes twelve runs, two workers, fixed pins and saved reconciliation',async()=>fixture({},r=>{
 assert.ifError(r.error);assert.equal(r.factories,12);assert.equal(r.executions,12);assert.equal(r.maximum,2);assert.ok(r.signals.every(s=>s===r.signals[0]));
 assert.equal(r.result.reconciliation.reconciled_outcomes,12);assert.equal(r.result.benchmark_cleared,false);assert.equal(r.result.outer_process_settlement_pending,true);
 assert.equal(hash(readFileSync(join(r.roots.metadata_root,'RESULTS.json'))),r.result.result_file_sha256);
}));
test('campaign admission denial performs no client construction or execution',async()=>fixture({deny:true},r=>{assert.match(r.error.message,/campaign-admission/);assert.equal(r.factories,0);assert.equal(r.executions,0);}));
test('paid exception retains costs and full denominator without invented run evidence',async()=>fixture({failure:true},r=>{
 assert.ifError(r.error);assert.equal(r.result.terminal_status,'incomplete');assert.equal(r.result.reconciliation.rows.length,12);assert.equal(r.result.reconciliation.rows[0].raw_accounting.known_token_lower_bound,120);assert.equal(r.result.reconciliation.rows[0].status,'missing-run-evidence');assert.equal(r.result.reconciliation.all_run_evidence_reconciled,false);assert.ok(r.executions<=2);assert.ok(r.signals.every(s=>s.aborted));
}));

test('metadata failure after generation preserves attached outcomes and costs',async()=>fixture({metadataFailure:true},r=>{
 assert.match(r.error.message,/metadata-full/);assert.equal(r.executions,12);
 assert.equal(r.error.campaign_evidence.terminal.outcomes.length,12);
 assert.equal(r.error.campaign_evidence.entries.filter(e=>e.files!==null).length,12);
 assert.equal(r.error.campaign_evidence.terminal.outcomes.reduce((n,o)=>n+o.result.receipts[1].input_tokens+o.result.receipts[1].output_tokens,0),1440);
}));

test('dot-prefixed descendant source root rejects before admission and factories',async()=>fixture({nestedSource:true},r=>{
 assert.ok(r.error);assert.match(r.error.message,/root-overlap/);assert.equal(r.admissions,0);assert.equal(r.factories,0);assert.equal(r.executions,0);
}));
