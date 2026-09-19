// Fixed twelve-slot prospective schedule. Open questions: COMPARISON-SCHEDULE.md.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {COMPARISON_ARMS,buildComparisonCell} from './comparison-arm.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-schedule.'+m);};
export function buildComparisonSchedule({config_path,cohort_path,cohort_sha256}){
 const configBytes=readFileSync(config_path),cohortBytes=readFileSync(cohort_path);
 need(hash(cohortBytes)===cohort_sha256,'cohort-digest');
 const config=JSON.parse(configBytes),cohort=JSON.parse(cohortBytes);
 need(hash(configBytes)===cohort.source_config_sha256,'config-digest');
 need(config.tasks?.length===4&&cohort.cohort?.length===4,'fixed-four-tasks');
 const identities=config.tasks.map(t=>({task_id:t.id,instance_id:t.instance_id,task_path:t.task_path,task_sha256:t.task_sha256,base_commit:t.base_commit}));
 assert.deepEqual(identities,cohort.cohort,'comparison-schedule.fixed-cohort');
 need(new Set(identities.map(t=>t.instance_id)).size===4,'duplicate-instance');
 const slots=[];
 for(const [index,task]of config.tasks.entries()){
  const order=index===3?[...COMPARISON_ARMS].reverse():[...COMPARISON_ARMS.slice(index),...COMPARISON_ARMS.slice(0,index)];
  for(const arm of order){const cell=buildComparisonCell({config,task_id:task.id,arm});slots.push({sequence:slots.length,slot_id:task.id+'--'+arm,task_id:task.id,instance_id:task.instance_id,task_path:task.task_path,task_sha256:task.task_sha256,base_commit:task.base_commit,arm,cell,cell_sha256:hash(stable(cell))});}
 }
 const body={schema:'are.comparison-schedule/v1',config_path:resolve(config_path),config_sha256:hash(configBytes),cohort_path:resolve(cohort_path),cohort_sha256,cohort:identities,slots,workers:2,repetitions:1,assigned_outcomes:12,maximum_total_model_tokens:12*96000,maximum_model_calls:12*96,dispatch_admitted:false,authority_effect:'none',open_questions_ref:'COMPARISON-SCHEDULE.md'};
 return {...body,schedule_sha256:hash(stable(body))};
}
export function verifyComparisonSchedule({schedule,...sources}){
 assert.deepEqual(schedule,buildComparisonSchedule(sources),'comparison-schedule.exact-reconstruction');return true;
}
