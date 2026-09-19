// Prospective candidate-only research; historical comparisons remain immutable.
// Open questions: CANDIDATE-ONLY-PLAN.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildComparisonSchedule} from './comparison-schedule.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const supported=['current-are','independent-investigations'];
export function buildCandidateOnlySchedule({candidates=['current-are'],...sources}){
 assert.ok(Array.isArray(candidates)&&candidates.length>0&&candidates.length<=2,'candidate-only.nonempty-candidates');
 assert.ok(candidates.every(c=>supported.includes(c))&&new Set(candidates).size===candidates.length,'candidate-only.controls-or-unsupported-candidates');
 const previous=buildComparisonSchedule(sources);
 const slots=previous.slots.filter(s=>candidates.includes(s.arm)).map((s,sequence)=>({...s,sequence,role:'candidate'}));
 const body={schema:'are.candidate-only-schedule/v1',config_path:previous.config_path,config_sha256:previous.config_sha256,
  cohort_path:previous.cohort_path,cohort_sha256:previous.cohort_sha256,cohort:previous.cohort,
  candidates:[...candidates],slots,workers:2,repetitions:1,assigned_outcomes:slots.length,
  maximum_total_model_tokens:slots.length*96000,maximum_model_calls:slots.length*96,
  fresh_control_runs:false,matched_control_savings_evaluable:false,accepted_control_savings:null,
  dispatch_admitted:false,authority_effect:'none',open_questions_ref:'CANDIDATE-ONLY-PLAN.md'};
 return {...body,schedule_sha256:createHash('sha256').update(stable(body)).digest('hex')};
}
export function verifyCandidateOnlySchedule({schedule,...sources}){
 assert.deepEqual(schedule,buildCandidateOnlySchedule({...sources,candidates:schedule.candidates}),'candidate-only.exact-reconstruction');return true;
}
