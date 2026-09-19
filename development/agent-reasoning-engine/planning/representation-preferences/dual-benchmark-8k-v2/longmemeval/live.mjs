// Bounded generation coordinator; no evaluator imports. Open questions: LIVE-PROTOCOL.md.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runScheduler} from '../scheduler.mjs';
import {buildPairs,validateSchedule,runPair} from './runner.mjs';
import {createProvider} from './provider.mjs';
import {verifySourceBindings} from '../../concurrent-benchmark-v1/adapter.mjs';
import {assertStorageCapacity} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
import {createResearchHypothesis,createResearchExperiment,verifyResearchContinuity} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
export const dir=import.meta.dirname,root=resolve(dir,'../../../../../..');
export const read=p=>JSON.parse(readFileSync(p));
export const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
export const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
const bind=p=>({path:relative(root,p),sha256:sha(p)});
export function verifyFreeze({review=true}={}){
 const freeze=read(join(dir,'live-freeze.json'));verifySourceBindings({source_bindings:freeze.bindings});
 const binding=read(join(dir,'live-continuity.json')),hypotheses=read(join(dir,'live-hypotheses.json')),policy=read(resolve(root,binding.policy_ref));
 assert.ok(verifyResearchContinuity({binding,hypotheses,policy,phase:'freeze',root}).ok);
 if(review){const r=read(join(dir,'LIVE-REVIEW.json'));assert.equal(r.approved,true);assert.equal(r.freeze_sha256,sha(join(dir,'live-freeze.json')));}
 return freeze;
}
export async function executePairJob(job,{directory,providerFactory=createProvider,health,onHealth=()=>{},storage={}}){
 const zero={prompt_tokens:0,completion_tokens:0,total_tokens:0};
 if(health.stopped)throw Object.assign(Error('previous provider health failure'),{receipt:{usage:zero}});
 try{assertStorageCapacity({...storage,outRoot:dir});}catch(error){error.receipt={usage:zero};throw error;}
 const out=join(directory,'pairs',job.id);let result;
 try{
  result=await runPair({pair:job.pair,directory:out,provider:providerFactory({directory:join(out,'provider')}),token_budget:job.reservation_tokens});
 }catch(error){
  health.stopped=true;onHealth(error);
  if(error.result)try{save(join(directory,job.id+'-failure.json'),error.result);}catch(journal){error.message+='; parent failure journal: '+journal.message;}
  throw error;
 }
 const persistence=result.calls.some(c=>c.receipt?.persistence_failure),capacity=[429,503].includes(result.provider_status)||['1302','1305'].includes(String(result.provider_error_code));
 if(result.unknown_usage||persistence||capacity){
  health.stopped=true;const error=Object.assign(Error('pair provider health failure'),{result,receipt:{...(!result.unknown_usage?{usage:result.usage}:{}),error_code:result.provider_error_code??(result.provider_status===503?'1305':result.provider_status)}});onHealth(error);throw error;
 }
 return {usage:result.usage,pair_result:result};
}
export function freeze(){
 const pairs=buildPairs();validateSchedule(pairs);
 const pre=read(join(dir,'preflight/result.json'));assert.ok(pre.admitted);assert.deepEqual(read(join(dir,'preflight/pairs.json')),pairs);
 const manifest={id:'longmem-scope-v2-r1',token_budget:64000,worker_limits:{longmemeval:2},jobs:pairs.map(pair=>({id:pair.id,benchmark:'longmemeval',depends_on:[],reservation_tokens:16000,pair}))};
 save(join(dir,'live-manifest.json'),manifest);
 const prefix=relative(root,dir),parent=read(join(dir,'../hypotheses.json')),records=parent.records.filter(h=>/^dual8k-v2-L-scope-/.test(h.hypothesis_key)).map(h=>createResearchHypothesis({...h,provenance_refs:[...h.provenance_refs,h.record_id,prefix+'/live-continuity.json']}));assert.equal(records.length,2);
 const hypotheses={records,selection:{selected:records[0].record_id,alternatives:[records[1].record_id]},authority_effect:'none'};save(join(dir,'live-hypotheses.json'),hypotheses);
 const e=createResearchExperiment({hypothesis_ref:records[0].record_id,research_question:'Does generic scope guidance improve the fixed four development tasks with identical evidence?',baseline_ref:'v1-retrievalMessages',treatment_ref:'v2-scopeMessages',metrics:records[0].metrics,dataset_refs:[relative(root,join(dir,'live-manifest.json'))],required_repetitions:1,success_criteria:{all_scope_answers_correct:true,quality_nonregression:true,all_eight_answers_complete:true,all_eight_judgments_valid:true,unknown_usage:0,maximum_request_tokens:8000,generation_budget:64000,judge_budget:58880,campaign_goal_achieved:false},stop_conditions:['No automatic retries or replacement','Unknown usage/capacity/persistence stops new work','Gold isolated to scorer','No campaign success from diagnostic']});save(join(dir,'live-experiment.json'),e);
 const prior=read(join(dir,'../continuity.json')),policy=read(resolve(root,prior.policy_ref));
 // Preserve each hypothesis's existing canonical parent continuity reference.
 const binding={...prior,binding_ref:prefix+'/live-continuity.json',objective_contribution:'Independent scoped LongMemEval diagnostic only; ContextBench and full-task15%/perfect-score gates remain open.',question_and_hypotheses:{question:e.research_question,records_ref:prefix+'/live-hypotheses.json',...hypotheses.selection},experiment_and_task_refs:{plan_ref:prefix+'/LIVE-PROTOCOL.md',tasks:['freeze','generate','blind-judge','report','review-successor'],unresolved:''},continuity_review:{reviewer:'coordinator protocol review plus separately bound LIVE-REVIEW.json before dispatch',reviewed_artifacts:[bind(join(dir,'LIVE-PROTOCOL.md')),bind(join(dir,'live-hypotheses.json'))],criterion_verdicts:Object.fromEntries(policy.required_review_criteria.map(k=>[k,'Canonical method and goals retained; scoped diagnostic cannot clear overall campaign; exact budgets, eight fixed outcomes and unchanged native judging.'])),passed_for_candidate_plan:true,run_ready:true}};
 const checked=verifyResearchContinuity({binding,hypotheses,policy,phase:'freeze',root});assert.ok(checked.ok,JSON.stringify(checked));save(join(dir,'live-continuity.json'),binding);save(join(dir,'live-continuity-validation.json'),checked);
 const priorFreeze=read(join(dir,'../../dual-benchmark-8k-v1/freeze.json'));
 const paths=['live.mjs','score-live.mjs','LIVE-PROTOCOL.md','adapter.mjs','runner.mjs','provider.mjs','live-manifest.json','live-hypotheses.json','live-experiment.json','live-continuity.json','live-continuity-validation.json','preflight/result.json','preflight/pairs.json','../scheduler.mjs'];
 const bindings=[...priorFreeze.bindings,...paths.map(p=>bind(resolve(dir,p)))];verifySourceBindings({source_bindings:bindings});
 save(join(dir,'live-freeze.json'),{created_at:new Date().toISOString(),bindings,workers:2,generation_cap:64000,judge_cap:58880,combined_cap:122880,scope:'fixed four development pairs; no full-task efficiency/perfection claim',authority_effect:'none'});
 console.log(JSON.stringify({frozen:true,pairs:4,model_answer_calls:8,combined_cap:122880,review_required:true}));
}
export async function generate(){
 verifyFreeze();const directory=join(dir,'live');mkdirSync(directory,{recursive:true});
 const health={stopped:false};const state=await runScheduler({manifest:read(join(dir,'live-manifest.json')),directory,concurrency:2,execute:job=>executePairJob(job,{directory,health})});
 save(join(directory,'generation-complete.json'),{accounting:state.accounting,statuses:Object.fromEntries(Object.entries(state.jobs).map(([id,j])=>[id,j.status])),health_stop:health.stopped});
 console.log(JSON.stringify({stage:'generation-terminal',accounting:state.accounting}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const command=process.argv[2];if(command==='freeze')freeze();else if(command==='run')await generate();else if(command==='verify'){verifyFreeze();console.log('verified');}else throw Error('freeze | verify | run');}
