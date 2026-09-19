// Distinct candidate identity; no control dispatch. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildComparisonSchedule} from './comparison-schedule.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
export function buildMeasuredTerminalCatalogSchedule(sources){
 const previous=buildComparisonSchedule(sources);
 const slots=previous.slots.filter(s=>s.arm==='minimal-history').map((s,sequence)=>{
  const cell={...s.cell,cell_id:s.task_id+'-measured-terminal-catalog-r1',comparison_arm:'measured-terminal-catalog',
   context_projection:'measured-terminal-catalog-r1',phase_contract:{exploration_tokens:88000,exploration_calls:95,finalization_tokens:8000,finalization_calls:1}};
  return {...s,sequence,slot_id:s.task_id+'--measured-terminal-catalog',arm:'measured-terminal-catalog',role:'candidate',cell,cell_sha256:hash(cell)};
 });
 assert.equal(slots.length,4);
 const {schedule_sha256:_,...prior}=previous;
 const body={...prior,schema:'are.measured-terminal-catalog-schedule/v1',slots,candidates:['measured-terminal-catalog'],assigned_outcomes:4,
  maximum_total_model_tokens:384000,maximum_model_calls:384,fresh_control_runs:false,matched_control_savings_evaluable:false,
  accepted_control_savings:null,dispatch_admitted:false,open_questions_ref:'MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md'};
 return {...body,schedule_sha256:hash(body)};
}
export function verifyMeasuredTerminalCatalogSchedule({schedule,...sources}){
 assert.deepEqual(schedule,buildMeasuredTerminalCatalogSchedule(sources),'measured-terminal-catalog.exact-schedule');return true;
}
