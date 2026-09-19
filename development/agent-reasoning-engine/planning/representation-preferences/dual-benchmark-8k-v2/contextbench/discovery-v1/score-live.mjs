// Evaluator process only, after all generation terminal. No provider calls. Open questions: LIVE-PROTOCOL.md.
import {existsSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {dir,read,save,sha,verifyFreeze} from './prepare-live.mjs';
import {scorePair} from './run.mjs';
const zero=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0,file_f1:0});
export function summarize({config,pairs,checkpoint}){
 assert.equal(config.tasks.length,4);assert.deepEqual(Object.keys(checkpoint.jobs).sort(),config.tasks.map(t=>t.id).sort());assert.ok(Object.values(checkpoint.jobs).every(j=>!['running','pending'].includes(j.status)));
 const outcomes=[],infrastructure_failures=[];let known=0,unknown=0,unallocated=0;
 for(const task of config.tasks){
  const pair=pairs[task.id];known+=pair?.usage?.total_tokens??checkpoint.jobs[task.id].usage?.total_tokens??0;unknown+=pair?.unknown_usage_calls??(pair?.unknown_usage?1:!checkpoint.jobs[task.id].usage&&['unknown','failed'].includes(checkpoint.jobs[task.id].status)?1:0);
  if(checkpoint.jobs[task.id].status!=='completed'||pair?.error)infrastructure_failures.push({task_id:task.id,checkpoint_status:checkpoint.jobs[task.id].status,checkpoint_error:checkpoint.jobs[task.id].error??null,pair_status:pair?.status??null,pair_error:pair?.error??null});
  let allocated=0;
  for(const arm of ['control','treatment']){
   const row=pair?.arms?.[arm],usage=row?.usage??{prompt_tokens:0,completion_tokens:0,total_tokens:0,model_calls:0},m=row?.metrics??zero();
   const f=m.file_coverage+m.file_precision,raw_metrics={...m,file_f1:f?2*m.file_coverage*m.file_precision/f:0};
   const metric_keys=['span_coverage','span_precision','span_f1','file_coverage','file_precision','file_f1'],metrics_valid=metric_keys.every(k=>Number.isFinite(raw_metrics[k])&&raw_metrics[k]>=0&&raw_metrics[k]<=1),metrics=metrics_valid?Object.fromEntries(metric_keys.map(k=>[k,raw_metrics[k]])):zero();
   outcomes.push({task_id:task.id,arm,status:row?.status??checkpoint.jobs[task.id].status,complete:row?.complete===true&&row?.reconstructed===true&&metrics_valid,metrics,metrics_valid,...(!metrics_valid?{metric_error:'missing-or-invalid-native-metric',raw_metrics}:{}),usage,window_admission_valid:row?.window_admission_valid===true,long_trajectory_observed:usage.model_calls>1&&usage.total_tokens>8000,maximum_admitted_request_tokens:row?.maximum_admitted_request_tokens??null});allocated+=usage.total_tokens;
  }
  unallocated+=(pair?.usage?.total_tokens??checkpoint.jobs[task.id].usage?.total_tokens??0)-allocated;
 }
 const totals=Object.fromEntries(['control','treatment'].map(arm=>{const rows=outcomes.filter(r=>r.arm===arm);return [arm,{assigned:4,complete:rows.filter(r=>r.complete).length,perfect:rows.filter(r=>Object.values(r.metrics).every(n=>n===1)).length,total_tokens:rows.reduce((n,r)=>n+r.usage.total_tokens,0),mean_span_f1:rows.reduce((n,r)=>n+r.metrics.span_f1,0)/4,mean_file_f1:rows.reduce((n,r)=>n+r.metrics.file_f1,0)/4}];}));
 const reduction=totals.control.total_tokens>0?1-totals.treatment.total_tokens/totals.control.total_tokens:null;
 const accounting={known_tokens:known,unknown_usage_calls:unknown,unallocated_known_tokens:unallocated,scheduler:checkpoint.accounting};
 const gates={all_pairs_sealed_and_recorded:config.tasks.every(t=>pairs[t.id]?.generation_sealed===true&&checkpoint.jobs[t.id].status==='completed'),all_eight_valid:outcomes.every(r=>r.complete),treatment_each_task_perfect:totals.treatment.perfect===4,at_least_15_percent_reduction:reduction!==null&&reduction>=0.15,all_requests_admitted:outcomes.every(r=>r.window_admission_valid),all_long_trajectories:outcomes.every(r=>r.long_trajectory_observed),complete_accounting:unknown===0&&unallocated===0&&checkpoint.accounting.unknown_reserved_tokens===0&&checkpoint.accounting.running_reserved_tokens===0&&known===checkpoint.accounting.known_tokens};
 return {experiment_id:config.experiment_id,outcomes,infrastructure_failures,totals,relative_token_reduction:reduction,accounting,gates,development_target_passed:Object.values(gates).every(Boolean),campaign_goal_achieved:false,limitations:['Fixed exposed four-task development comparison, not full benchmark or untouched confirmation.','Native source-selection quality, not code repair or independent general retention.','Control differs from v1: compact representation and terminal evidence review in both arms.'],open_questions_ref:'LIVE-PROTOCOL.md',authority_effect:'none'};
}
export async function score(){
 verifyFreeze();const directory=join(dir,'live'),seal=read(join(directory,'generation-complete.json')),checkpoint=read(join(directory,'checkpoint.json')),config=read(join(dir,'live-config.json'));assert.ok(Object.values(seal.statuses).every(s=>!['pending','running'].includes(s)));assert.ok(!existsSync(join(directory,'.scheduler-lock')),'generation owner still holds lock');
 assert.deepEqual(seal.statuses,Object.fromEntries(Object.entries(checkpoint.jobs).map(([id,j])=>[id,j.status])));
 const pairs={};
 for(const task of config.tasks){const run=join(directory,'pairs',task.id,'run');
  if(existsSync(join(run,'pair-result.json')))pairs[task.id]=await scorePair({config,directory:run});
  else if(existsSync(join(directory,task.id+'-failure.json')))pairs[task.id]=read(join(directory,task.id+'-failure.json'));
 }
 const report=summarize({config,pairs,checkpoint});save(join(dir,'LIVE-RESULTS.json'),report);save(join(directory,'evaluation-complete.json'),{report_sha256:sha(join(dir,'LIVE-RESULTS.json')),model_calls:0});console.log(JSON.stringify({totals:report.totals,reduction:report.relative_token_reduction,gates:report.gates,campaign_goal_achieved:false}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv[2]==='score')await score();else throw Error('score');}
