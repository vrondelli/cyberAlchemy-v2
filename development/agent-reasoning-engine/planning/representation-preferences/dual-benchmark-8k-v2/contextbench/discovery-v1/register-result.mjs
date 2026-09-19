// Additive post-run native registration. No provider, scorer or gold access.
// Open questions: POSTRUN-IMPLEMENTATION.md.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {dir,root,read,sha,save,verifyFreeze,verifyBindings} from './prepare-live.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {materializeResearchDag} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {digest} from '../../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {createHash} from 'node:crypto';
import {summarize} from './score-live.mjs';
export const gateKeys=['all_pairs_sealed_and_recorded','all_eight_valid','treatment_each_task_perfect','at_least_15_percent_reduction','all_requests_admitted','all_long_trajectories','complete_accounting'];
export const taskIds=['integration','tokenizer-preflight','freeze','generation-two-workers','native-score','complete-report','independent-review'];
const prefix=relative(root,dir),ref=n=>prefix+'/'+n,bind=n=>({path:ref(n),sha256:sha(join(dir,n))});
const bytes=v=>JSON.stringify(v,null,2)+'\n',byteHash=v=>createHash('sha256').update(bytes(v)).digest('hex');
export function classifyOutcome(result,{scoring_errors=[]}={}){
 assert.equal(result.campaign_goal_achieved,false);assert.equal(result.outcomes.length,8);
 assert.deepEqual(Object.keys(result.gates).sort(),[...gateKeys].sort());assert.ok(gateKeys.every(k=>typeof result.gates[k]==='boolean'));
 assert.equal(result.development_target_passed,gateKeys.every(k=>result.gates[k]));
 const incomplete=(result.infrastructure_failures?.length??0)>0||scoring_errors.length>0||!result.gates.complete_accounting||!result.gates.all_pairs_sealed_and_recorded||result.outcomes.some(o=>o.metrics_valid!==true);
 return incomplete?'inconclusive':result.development_target_passed?'supporting':'counterevidence';
}
export function createRecords({result,hypotheses,experiment,scoring_errors=[],artifact_prefix=prefix}){
 const h=hypotheses.records.find(x=>x.record_id===hypotheses.selection.selected);assert.ok(h);assert.equal(experiment.hypothesis_ref,h.record_id);
 const kind=classifyOutcome(result,{scoring_errors}),reduction=result.relative_token_reduction;
 const claim=`Fixed four-pair development experiment: control ${result.totals.control.complete}/4 valid, treatment ${result.totals.treatment.complete}/4 valid and ${result.totals.treatment.perfect}/4 perfect; known model tokens ${result.accounting.known_tokens}; reported total-token reduction ${reduction===null?'unavailable':(100*reduction).toFixed(4)+'%'}. Classification ${kind} concerns the bounded combined discovery/retention hypothesis only. Infrastructure or accounting incompleteness is not clean mechanism evidence; component effects and generalization are not identified.`;
 const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:artifact_prefix+'/LIVE-RESULTS.json',source_result_digest:digest(result),observation_kind:kind,phase:'experiment',claim,evaluator_id:'pinned-native-contextbench-source-selection',evidence_refs:['LIVE-RESULTS.json','LIVE-POSTRUN-REVIEW.json','live-freeze.json'].map(n=>artifact_prefix+'/'+n),limitations:result.limitations});
 const next=kind==='supporting'?'Preregister untouched long-task confirmation with unchanged native perfection and15% cumulative-token criteria; do not claim campaign completion.':kind==='counterevidence'?'Review the clean failed combined hypothesis and preregister a bounded successor without gold-derived task hints; retain all prior failures and thresholds.':'Resolve the documented infrastructure, scoring or accounting uncertainty before drawing a mechanism conclusion; do not replace outcomes without an explicit new protocol.';
 const decision=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:experiment.record_id,observation_refs:[observation.record_id],disposition:kind==='counterevidence'?'revise-hypothesis':'collect-replications',next_action:next,reason_codes:['fixed-exposed-development-cohort','combined-intervention',kind,'campaign-goal-open'],supporting_count:Number(kind==='supporting'),counterevidence_count:Number(kind==='counterevidence')});
 assert.ok([h,experiment,observation,decision].every(r=>verifyEvolutionRecord(r).ok));return {hypothesis:h,observation,decision,kind};
}
export function loadPrerequisites(){
 const freeze=verifyFreeze();assert.ok(!existsSync(join(dir,'live/.scheduler-lock')),'generation owner still active');
 const result=read(join(dir,'LIVE-RESULTS.json')),checkpoint=read(join(dir,'live/checkpoint.json')),seal=read(join(dir,'live/generation-complete.json')),evaluation=read(join(dir,'live/evaluation-complete.json')),review=read(join(dir,'LIVE-POSTRUN-REVIEW.json')),config=read(join(dir,'live-config.json'));
 assert.equal(config.tasks.length,4);assert.deepEqual(Object.keys(checkpoint.jobs).sort(),config.tasks.map(t=>t.id).sort());assert.ok(Object.values(checkpoint.jobs).every(j=>['completed','failed','unknown','blocked','budget_blocked'].includes(j.status)));
 assert.deepEqual(seal.statuses,Object.fromEntries(Object.entries(checkpoint.jobs).map(([id,j])=>[id,j.status])));assert.deepEqual(seal.accounting,checkpoint.accounting);
 assert.equal(evaluation.report_sha256,sha(join(dir,'LIVE-RESULTS.json')));assert.equal(evaluation.model_calls,0);
 assert.equal(review.result_integrity_approved,true);assert.equal(review.freeze_sha256,sha(join(dir,'live-freeze.json')));assert.equal(result.campaign_goal_achieved,false);
 assert.ok(Array.isArray(review.source_bindings)&&review.source_bindings.some(b=>resolve(root,b.path)===join(dir,'LIVE-RESULTS.json')&&b.sha256===evaluation.report_sha256),'review must bind result');verifyBindings(review.source_bindings);
 assert.deepEqual(result.outcomes.map(o=>o.task_id+':'+o.arm).sort(),config.tasks.flatMap(t=>['control','treatment'].map(a=>t.id+':'+a)).sort());
 assert.deepEqual(result.accounting.scheduler,checkpoint.accounting);
 const scoring_errors=[],score_refs=[],pairs={};assert.equal(result.experiment_id,config.experiment_id);
 for(const task of config.tasks){const name='live/pairs/'+task.id+'/run/scored-pair-result.json',p=join(dir,name);
  if(!existsSync(p)){assert.ok(result.outcomes.filter(o=>o.task_id===task.id).every(o=>!o.complete),'valid outcomes lack scoring evidence');const failure='live/'+task.id+'-failure.json';if(existsSync(join(dir,failure))){pairs[task.id]=read(join(dir,failure));score_refs.push(failure);}scoring_errors.push({task_id:task.id,error:'missing-scored-pair'});continue;}
  const pair=read(p);pairs[task.id]=pair;assert.equal(pair.task_id,task.id);assert.equal(pair.planned_arms,2);assert.equal(pair.generation_sealed,true);assert.equal(pair.config_sha256,createHash('sha256').update(JSON.stringify(config,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v)).digest('hex'));
  score_refs.push(name);for(const arm of ['control','treatment']){const a=pair.arms[arm];if(a.scoring_error||a.reconstructed===false)scoring_errors.push({task_id:task.id,arm,error:a.scoring_error??'reconstruction-failed'});}
 }
 assert.deepEqual(summarize({config,pairs,checkpoint}),result,'report differs from sealed scoring evidence');
 const hypotheses=read(join(dir,'live-hypotheses.json')),experiment=read(join(dir,'live-experiment.json')),continuity=read(join(dir,'live-continuity.json'));assert.deepEqual(continuity.experiment_and_task_refs.tasks,taskIds);
 classifyOutcome(result,{scoring_errors});return {freeze,result,checkpoint,seal,evaluation,review,config,scoring_errors,score_refs,hypotheses,experiment};
}
export function buildBundle(context=loadPrerequisites()){
 const {freeze,result,hypotheses,experiment,scoring_errors,score_refs}=context,{hypothesis,observation,decision,kind}=createRecords(context);
 const observations={records:[observation,decision],classification:kind,scoring_errors,campaign_goal_achieved:false,authority_effect:'none',open_questions_ref:'LIVE-PROTOCOL.md'};
 const evidence_bindings=['LIVE-RESULTS.json','LIVE-POSTRUN-REVIEW.json','live/evaluation-complete.json','live/generation-complete.json','live/checkpoint.json','register-result.mjs','close-live-work.mjs',...score_refs].map(bind);
 evidence_bindings.push({path:ref('LIVE-OBSERVATIONS.json'),sha256:byteHash(observations)});
 const body={experiment_id:result.experiment_id,records:[hypothesis,experiment,observation,decision],implementation:{record_id:'implementation:'+digest(freeze.bindings),source_bindings:freeze.bindings},question:{record_id:'question:'+digest(decision.next_action),question:decision.next_action},evidence_bindings};
 const registration={...body,registration_digest:digest(body)};
 const verify_registration=r=>{try{const {registration_digest,...b}=r;assert.equal(registration_digest,digest(b));assert.deepEqual(r,registration);for(const binding of [...r.implementation.source_bindings,...r.evidence_bindings]){if(binding.path===ref('LIVE-OBSERVATIONS.json'))assert.equal(binding.sha256,byteHash(observations));else verifyBindings([binding]);}assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));return true;}catch{return false;}};
 const dag=materializeResearchDag({registrations:[registration],verify_registration});
 const tasks=taskIds.map((task_id,i)=>({task_id,title:task_id,depends_on:i?[taskIds[i-1]]:[],owner:'coordinator',lane:'product-construction',stage:'prototype',question_ref:registration.question.record_id,completion_criteria:['Validate evidence and disposition for '+task_id,...(task_id==='independent-review'?['Bind completion audit']:[])],validator_ref:ref('LIVE-COMPLETION-AUDIT.md')}));
 const plan=materializeResearchPlan({research_dag:dag,registrations:[registration],verify_registration,tasks});
 return {context,kind,registration,verify_registration,artifacts:{'LIVE-OBSERVATIONS.json':observations,'LIVE-REGISTRATION.json':registration,'LIVE-RESEARCH-DAG.json':dag,'LIVE-RESEARCH-WORK.json':plan}};
}
export function register({check=false}={}){
 const bundle=buildBundle();
 if(check){for(const [name,value]of Object.entries(bundle.artifacts))assert.deepEqual(read(join(dir,name)),value,name);}
 else{for(const name of Object.keys(bundle.artifacts))assert.ok(!existsSync(join(dir,name)),'existing post-run artifact: '+name);for(const [name,value]of Object.entries(bundle.artifacts))save(join(dir,name),value);}
 return bundle;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){assert.ok(process.argv.slice(2).every(x=>x==='--check'));const b=register({check:process.argv.includes('--check')});console.log(JSON.stringify({classification:b.kind,native_tasks:7,campaign_goal_achieved:false}));}
