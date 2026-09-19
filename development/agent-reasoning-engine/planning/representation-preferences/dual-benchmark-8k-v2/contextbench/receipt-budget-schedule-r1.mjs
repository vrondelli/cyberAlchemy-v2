// Distinct candidate identity; no control dispatch. Open questions: FRONTIER-RESOURCE-HYPOTHESES-R2.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildComparisonSchedule} from './comparison-schedule.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
export function buildReceiptBudgetSchedule(sources){
 const previous=buildComparisonSchedule(sources);
 const slots=previous.slots.filter(s=>s.arm==='minimal-history').map((s,sequence)=>{
  const cell={...s.cell,cell_id:s.task_id+'-receipt-budget-r1',comparison_arm:'receipt-budget',
   context_projection:'receipt-budget-r1',phase_contract:{exploration_tokens:88000,exploration_calls:95,finalization_tokens:8000,finalization_calls:1}};
  return {...s,sequence,slot_id:s.task_id+'--receipt-budget',arm:'receipt-budget',role:'candidate',cell,cell_sha256:hash(cell)};
 });
 assert.equal(slots.length,4);
 const {schedule_sha256:_,...prior}=previous;
 const body={...prior,schema:'are.receipt-budget-schedule/v1',slots,candidates:['receipt-budget'],assigned_outcomes:4,
  maximum_total_model_tokens:384000,maximum_model_calls:384,fresh_control_runs:false,matched_control_savings_evaluable:false,
  accepted_control_savings:null,dispatch_admitted:false,open_questions_ref:'FRONTIER-RESOURCE-HYPOTHESES-R2.md'};
 return {...body,schedule_sha256:hash(body)};
}
export function verifyReceiptBudgetSchedule({schedule,...sources}){
 assert.deepEqual(schedule,buildReceiptBudgetSchedule(sources),'receipt-budget.exact-schedule');return true;
}
