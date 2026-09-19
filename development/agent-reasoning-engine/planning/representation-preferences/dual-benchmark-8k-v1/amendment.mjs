// Additive first-exposure amendment. Never rewrites frozen original execution evidence.
// Open questions: AMENDMENT.md#open-questions.
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runScheduler} from '../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/scheduler.mjs';
import {runPools} from './pool.mjs';
import {runPair} from './contextbench/run.mjs';
import {verifySourceBindings} from '../concurrent-benchmark-v1/adapter.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir);
const read=p=>JSON.parse(readFileSync(p,'utf8')),local=p=>read(join(dir,p));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const save=(p,v)=>writeFileSync(join(dir,p),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const bound=p=>({path:prefix+'/'+p,sha256:sha(join(dir,p))});
const originalPair='live/stage1/pairs/contextbench-4/run/result.json';
const repairBase='amended-live/first-exposure-cb4',repairPair=repairBase+'/pairs/contextbench-4/run/result.json';
function originalBindings(){const f=local('freeze.json');verifySourceBindings({source_bindings:f.bindings});for(const b of f.external_bindings??[])assert.equal(sha(resolve(root,b.path)),b.sha256);return f;}
function verifyAmendment(){originalBindings();const f=local('AMENDMENT-FREEZE.json');verifySourceBindings({source_bindings:f.bindings});assert.equal(f.original_freeze_sha256,sha(join(dir,'freeze.json')));assert.equal(local('contextbench/infrastructure-repair.json').passed,true);zeroExposure();return f;}
function zeroExposure(){
 const p=local(originalPair);assert.equal(p.task_id,'contextbench-4');assert.equal(p.repetition,1);assert.equal(p.usage.total_tokens,0);assert.equal(p.unknown_usage,false);assert.equal(p.unknown_usage_calls,0);
 for(const arm of ['control','treatment']){
  const a=p.arms[arm];assert.equal(a.status,'orchestration_error');assert.match(a.error,/unable to read tree/);assert.equal(a.usage.model_calls,0);assert.equal(a.usage.total_tokens,0);assert.equal(a.usage.unknown_usage_calls,0);
  const folder=join(dir,'live/stage1/pairs/contextbench-4/run',arm),r=read(join(folder,'result.json'));assert.equal((r.receipts??[]).filter(x=>x.kind==='model').length,0);
  const ledger=join(folder,'state/glm-transport-ledger.json');if(existsSync(ledger)){const l=read(ledger);assert.equal(l.model_calls,0);assert.equal((l.receipts??[]).filter(x=>x.kind==='model').length,0);assert.ok(!/pending/.test(l.phase??''));}
  const state=join(folder,'state/checkpoint.json');if(existsSync(state)){const s=read(state);assert.equal((s.dispatches??[]).length,0);assert.ok(!/pending/.test(s.phase??''));}
 }
 return p;
}
function budgetAndWorkers(){
 const manifest=local('stage1-manifest.json'),state=local('live/stage1/checkpoint.json');
 const cb=manifest.jobs.filter(j=>j.benchmark==='contextbench');assert.ok(cb.every(j=>state.jobs[j.id].status!=='pending'),'original pending ContextBench jobs must finish dispatch');assert.ok(cb.filter(j=>state.jobs[j.id].status==='running').length<=1,'repair would exceed two ContextBench workers');
 assert.equal(state.jobs['contextbench-4'].status,'completed');
 const account=j=>{const r=state.jobs[j.id];return r.usage?.total_tokens??(['running','unknown','failed'].includes(r.status)?j.reservation_tokens:0);};
 const context=cb.reduce((s,j)=>s+account(j),0),long=manifest.jobs.filter(j=>j.benchmark==='longmemeval').reduce((s,j)=>s+account(j),0);
 const jp=join(dir,'live/stage1/judge/checkpoint.json'),judge=existsSync(jp)?read(jp).accounting.accounted_tokens:8*7360;
 assert.ok(context+192000<=768000,'ContextBench first-stage allocation exceeded');assert.ok(long+judge<=204800,'LongMemEval generator plus judge allocation exceeded');assert.ok(context+192000+long+judge<=972800,'combined first-stage allocation exceeded');return {context_accounted:context,longmem_accounted:long,judge_accounted_or_reserved:judge,supplement_reservation:192000};
}
const [command]=process.argv.slice(2);
if(command==='freeze'){
 originalBindings();zeroExposure();assert.equal(local('contextbench/infrastructure-repair.json').passed,true);budgetAndWorkers();
 const names=['freeze.json','amendment.mjs','AMENDMENT.md','score-amended.mjs','audit-amended.mjs','contextbench/infrastructure-repair.json',originalPair,...['control','treatment'].map(a=>'live/stage1/pairs/contextbench-4/run/'+a+'/result.json')];
 save('AMENDMENT-FREEZE.json',{schema_version:'are.dual8k-zero-exposure-amendment/v1',original_freeze_sha256:sha(join(dir,'freeze.json')),bindings:names.map(bound),task_id:'contextbench-4',first_exposure_only:true,no_outcome_retries:true,preserve_all_original_outcomes:true,original_stage1_combined_ceiling:972800,two_stage_combined_ceiling:1945600,supplement_reservation_reuses_original_zero_cost_allocation:192000,stage2_manifest:'stage2-manifest.json',stage2_directory:'amended-live/stage2',authority_effect:'none',open_questions_ref:'AMENDMENT.md#open-questions'});
 console.log('Amendment frozen; no model calls.');
}else if(command==='repair'){
 verifyAmendment();const budget=budgetAndWorkers();const original=local('stage1-manifest.json').jobs.find(j=>j.id==='contextbench-4');assert.equal(original.reservation_tokens,192000);
 const manifest={id:'dual8k-amended-first-exposure-cb4',token_budget:192000,jobs:[{...original,depends_on:[]}]};
 const state=await runScheduler({directory:join(dir,repairBase),manifest,concurrency:1,execute:async(job)=>{
  const result=await runPair({...job.config,directory:join(dir,repairBase,'pairs',job.id,'run')});
  const code=result.provider_error_code??(result.rate_limited?'1302':null);
  if(result.unknown_usage){const e=Error('supplement usage unknown');e.receipt={error_code:code};throw e;}
  if(code){const e=Error('supplement capacity failure');e.receipt={error_code:String(code)==='503'?'1305':code,usage:result.usage};throw e;}
  return {usage:result.usage,pair_result:result};
 }});
 console.log(JSON.stringify({budget,accounting:state.accounting,jobs:Object.fromEntries(Object.entries(state.jobs).map(([k,v])=>[k,v.status]))}));
}else if(command==='admit'){
 verifyAmendment();const old=local('SCALING-ADMISSION.json'),state=local('live/stage1/checkpoint.json'),supp=local(repairPair),checkpoint=local(repairBase+'/checkpoint.json');
 assert.equal(old.admitted,false,'original non-admission must remain intact');
 const allowed=new Set(['contextbench-4:no-model-exposure','contextbench-4:invalid-window']);
 const reasons=[];if(!old.reasons.length||old.reasons.some(r=>!allowed.has(r)))reasons.push('original-non-CB4-health-blocker');
 if(Object.values(state.jobs).some(r=>r.status!=='completed')||state.accounting.unknown_reserved_tokens||state.accounting.running_reserved_tokens||state.concurrency!==4)reasons.push('original-stage-not-completely-known-or-capacity-changed');
 if(!(old.model_peaks?.contextbench>=2&&old.model_peaks?.longmemeval>=2&&old.global_model_peak>=4))reasons.push('original-required-request-overlap-missing');
 if(checkpoint.jobs['contextbench-4']?.status!=='completed'||checkpoint.accounting.unknown_reserved_tokens||checkpoint.accounting.running_reserved_tokens)reasons.push('supplement-accounting-incomplete');
 if(supp.unknown_usage||supp.provider_error_code||supp.rate_limited)reasons.push('supplement-unknown-or-capacity-failure');
 for(const arm of ['control','treatment'])if(!(supp.arms[arm].usage.total_tokens>0)||supp.arms[arm].window_admission_valid!==true)reasons.push('supplement-arm-exposure-or-window:'+arm);
 const budget=budgetAndWorkers();
 save('AMENDED-SCALING-ADMISSION.json',{admitted:reasons.length===0,reasons,original_admission_sha256:sha(join(dir,'SCALING-ADMISSION.json')),supplement_result_sha256:sha(join(dir,repairPair)),amendment_freeze_sha256:sha(join(dir,'AMENDMENT-FREEZE.json')),original_health_evidence:old,budget,quality_outcomes_not_used_to_select_scaling:true,authority_effect:'none'});
 console.log(JSON.stringify({admitted:reasons.length===0,reasons}));
}else if(command==='stage2'){
 verifyAmendment();const gate=local('AMENDED-SCALING-ADMISSION.json');assert.equal(gate.admitted,true);assert.equal(gate.original_admission_sha256,sha(join(dir,'SCALING-ADMISSION.json')));assert.equal(gate.supplement_result_sha256,sha(join(dir,repairPair)));assert.equal(gate.amendment_freeze_sha256,sha(join(dir,'AMENDMENT-FREEZE.json')));
 const manifest=local('stage2-manifest.json');assert.equal(manifest.global_workers,8);assert.equal(manifest.token_budget,972800);
 const result=await runPools({manifest,directory:join(dir,'amended-live/stage2')});console.log(JSON.stringify(result.accounting));
}else throw Error('Usage: amendment.mjs freeze|repair|admit|stage2');
