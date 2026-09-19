// Distinct candidate identity; no control dispatch. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildComparisonSchedule} from './comparison-schedule.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
export function buildQueryArchiveSchedule(sources){
 const previous=buildComparisonSchedule(sources);
 const slots=previous.slots.filter(s=>s.arm==='minimal-history').map((s,sequence)=>{
  const cell={...s.cell,cell_id:s.task_id+'-query-archive-r1',comparison_arm:'query-archive',
   context_projection:'query-archive-r1',phase_contract:{exploration_tokens:88000,exploration_calls:95,finalization_tokens:8000,finalization_calls:1}};
  return {...s,sequence,slot_id:s.task_id+'--query-archive',arm:'query-archive',role:'candidate',cell,cell_sha256:hash(cell)};
 });
 assert.equal(slots.length,4);
 const {schedule_sha256:_,...prior}=previous;
 const body={...prior,schema:'are.query-archive-schedule/v1',slots,candidates:['query-archive'],assigned_outcomes:4,
  maximum_total_model_tokens:384000,maximum_model_calls:384,fresh_control_runs:false,matched_control_savings_evaluable:false,
  accepted_control_savings:null,dispatch_admitted:false,open_questions_ref:'QUERY-ARCHIVE-CANDIDATE-R1.md'};
 return {...body,schedule_sha256:hash(body)};
}
export function verifyQueryArchiveSchedule({schedule,...sources}){
 assert.deepEqual(schedule,buildQueryArchiveSchedule(sources),'query-archive.exact-schedule');return true;
}
