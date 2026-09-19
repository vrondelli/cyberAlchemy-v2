// Additive query-archive production candidate. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Candidate-only descendant of comparison-accounting.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Raw lower bounds and unresolved reservations, not durable reconciliation. Open questions: COMPARISON-ACCOUNTING.md.
import assert from 'node:assert/strict';
import {verifyQueryArchiveSchedule as verifyComparisonSchedule} from './query-archive-schedule-r1.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const need=(v,m)=>{if(!v)throw Error('comparison-accounting.'+m);};
const sum=(a,b)=>{need(uint(a)&&uint(b)&&uint(a+b),'overflow');return a+b;};
export {accountComparisonOutcome} from './comparison-accounting.mjs';
import {accountComparisonOutcome} from './comparison-accounting.mjs';
export function accountComparisonQueue({terminal,schedule,sources}){
 verifyComparisonSchedule({schedule,...sources});need(terminal?.workers_settled===true&&terminal.assigned_outcomes===schedule.assigned_outcomes&&terminal.schedule_sha256===schedule.schedule_sha256,'terminal-binding');
 need(Array.isArray(terminal.outcomes)&&terminal.outcomes.length===schedule.assigned_outcomes,'fixed-denominator');
 const rows=terminal.outcomes.map((outcome,i)=>{
  const slot=schedule.slots[i];assert.deepEqual(['sequence','slot_id','task_id','arm'].map(k=>outcome[k]),['sequence','slot_id','task_id','arm'].map(k=>slot[k]),'comparison-accounting.slot-identity');
  const accounting=accountComparisonOutcome(outcome);return {slot_id:slot.slot_id,task_id:slot.task_id,arm:slot.arm,status:outcome.status,attempted:outcome.attempted,...accounting};
 });
 const aggregate=values=>({known_token_lower_bound:values.reduce((n,r)=>sum(n,r.known_token_lower_bound),0),conservative_total_tokens:values.reduce((n,r)=>sum(n,r.conservative_total_tokens),0),raw_accounting_complete:values.every(r=>r.raw_accounting_complete),provider_healthy:values.every(r=>r.provider_healthy)});
 return {schema:'are.candidate-only-raw-accounting/v1',schedule_sha256:schedule.schedule_sha256,assigned_outcomes:schedule.assigned_outcomes,attempted_outcomes:rows.filter(r=>r.attempted).length,rows,by_arm:Object.fromEntries(schedule.candidates.map(arm=>[arm,aggregate(rows.filter(r=>r.arm===arm))])),...aggregate(rows),all_outcomes_returned:rows.every(r=>r.status==='returned'),durable_reconciliation_pending:true,accepted_savings:null,benchmark_cleared:false,authority_effect:'none'};
}
