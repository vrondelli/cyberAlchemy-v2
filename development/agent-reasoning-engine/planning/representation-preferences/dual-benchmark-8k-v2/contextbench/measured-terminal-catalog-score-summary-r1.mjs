// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Candidate-only descendant of comparison-score-summary-r2.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Pure scoring decision, not evaluator execution or proof of supplied receipts. Open questions: COMPARISON-SCORE-SUMMARY-R2.md.
import assert from 'node:assert/strict';
import {verifyMeasuredTerminalCatalogSchedule as verifyComparisonSchedule} from './measured-terminal-catalog-schedule-r1.mjs';
import {recoveryMetrics} from './score-recovery-campaign.mjs';
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const need=(v,m)=>{if(!v)throw Error('comparison-score.'+m);};
const sum=values=>values.reduce((a,b)=>{need(uint(b)&&uint(a+b),'cost-overflow');return a+b;},0);
export function summarizeComparisonScores({schedule,sources,outcomes,reconciliation,outer_process_settled,post_score_integrity_verified}){
 verifyComparisonSchedule({schedule,...sources});
 need(typeof outer_process_settled==='boolean'&&typeof post_score_integrity_verified==='boolean','verification-flags');
 need(Array.isArray(outcomes)&&outcomes.length===schedule.assigned_outcomes&&reconciliation?.schedule_sha256===schedule.schedule_sha256&&reconciliation.assigned_outcomes===schedule.assigned_outcomes&&Array.isArray(reconciliation.rows)&&reconciliation.rows.length===schedule.assigned_outcomes,'denominator');
 const rows=schedule.slots.map((slot,i)=>{
  const outcome=outcomes[i],e=reconciliation.rows[i];
  for(const row of [outcome,e])assert.deepEqual([row.slot_id,row.task_id,row.arm],[slot.slot_id,slot.task_id,slot.arm],'comparison-score.row-identity');
  need(typeof outcome.valid==='boolean'&&typeof e.reconciled==='boolean','row-flags');
  const raw=e.raw_accounting;need(raw&&uint(raw.known_token_lower_bound)&&uint(raw.conservative_total_tokens),'raw-cost');
  need(raw.conservative_total_tokens>=raw.known_token_lower_bound,'cost-order');
  const ledger=e.evidence?.ledger,windows=e.evidence?.windows;
  const accounting=e.reconciled===true&&e.status==='reconciled'&&e.attempted===true&&e.outcome_status==='returned'&&raw.raw_accounting_complete===true&&raw.provider_healthy===true&&ledger?.evidence_consistent===true&&uint(ledger.total_tokens)&&ledger.total_tokens===raw.known_token_lower_bound&&ledger.total_tokens===raw.conservative_total_tokens&&ledger.total_tokens<=96000&&uint(ledger.model_calls)&&ledger.model_calls>0&&ledger.model_calls<=96;
  const windowVerified=windows?.measured_windows_verified===true&&Array.isArray(windows.requests)&&windows.requests.length===ledger?.model_calls&&windows.requests.every(r=>uint(r.projected_tokens)&&r.projected_tokens>0&&r.projected_tokens<=8000)&&sum(windows.requests.map(r=>r.projected_tokens))>=ledger.total_tokens;
  const valid=outcome.valid&&outcome.status==='scored'&&!outcome.native?.native?.error;
  const metrics=valid?recoveryMetrics(outcome.native):null;
  return {slot_id:slot.slot_id,task_id:slot.task_id,arm:slot.arm,status:outcome.status,valid,metrics,accounting_complete:accounting,window_verified:windowVerified,known_tokens:raw.known_token_lower_bound,conservative_tokens:raw.conservative_total_tokens,model_calls:ledger?.model_calls??null,long_trajectory:accounting&&ledger.model_calls>1&&ledger.total_tokens>8000};
 });
 const totals=Object.fromEntries(schedule.candidates.map(arm=>{
  const a=rows.filter(r=>r.arm===arm);
  return [arm,{assigned:a.length,valid:a.filter(r=>r.valid).length,perfect:a.filter(r=>r.valid&&['span_coverage','span_precision','file_coverage','file_precision'].every(k=>r.metrics[k]===1)).length,known_tokens:sum(a.map(r=>r.known_tokens)),conservative_tokens:sum(a.map(r=>r.conservative_tokens)),mean_span_f1:a.reduce((n,r)=>n+(r.metrics?.span_f1??0),0)/a.length,mean_file_f1:a.reduce((n,r)=>n+(r.metrics?.file_f1??0),0)/a.length}];
 }));
 const gates={all_assigned_valid:rows.every(r=>r.valid),complete_accounting:rows.every(r=>r.accounting_complete),all_requests_within_8k:rows.every(r=>r.window_verified),all_long_trajectories:rows.every(r=>r.long_trajectory),outer_process_settled,post_score_integrity_verified,each_task_perfect:rows.every(r=>r.valid&&['span_coverage','span_precision','file_coverage','file_precision'].every(k=>r.metrics[k]===1))};
 return {schema:'are.candidate-only-score-summary/v1',schedule_sha256:schedule.schedule_sha256,assigned_outcomes:schedule.assigned_outcomes,rows,totals,gates,
  candidate_quality_target_passed:Object.values(gates).every(Boolean),development_target_passed:false,
  matched_control_savings_evaluable:false,accepted_savings:null,benchmark_cleared:false,campaign_goal_achieved:false,
  claim_ceiling:'Exposed candidate-only quality and token accounting. Fresh controls suspended; matched 15% savings, untouched confirmation and full benchmark scope remain unproven.',authority_effect:'none'};
}
