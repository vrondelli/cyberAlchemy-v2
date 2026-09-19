import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildCandidateOnlySchedule as buildComparisonSchedule} from './candidate-only-schedule.mjs';import {summarizeComparisonScores} from './candidate-only-score-summary.mjs';
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url)),sources={cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex'),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
function fixture(){
 const schedule=buildComparisonSchedule(sources),id=s=>({slot_id:s.slot_id,task_id:s.task_id,arm:s.arm});
 const outcomes=schedule.slots.map(s=>({...id(s),valid:true,status:'scored',native:{native:{final:{span:{coverage:1,precision:1},file:{coverage:1,precision:1}}}}}));
 const rows=schedule.slots.map(s=>{const tokens=s.arm==='independent-investigations'?17000:20000;return {...id(s),status:'reconciled',attempted:true,outcome_status:'returned',reconciled:true,raw_accounting:{known_token_lower_bound:tokens,conservative_total_tokens:tokens,raw_accounting_complete:true,provider_healthy:true},evidence:{ledger:{total_tokens:tokens,model_calls:4,evidence_consistent:true},windows:{measured_windows_verified:true,requests:Array.from({length:4},()=>({projected_tokens:7500}))}}};});
 return {schedule,sources,outcomes,reconciliation:{schedule_sha256:schedule.schedule_sha256,assigned_outcomes:4,rows},outer_process_settled:true,post_score_integrity_verified:true};
}
test('perfect candidate quality never implies matched-control savings or benchmark completion',()=>{
 const r=summarizeComparisonScores(fixture());assert.equal(r.candidate_quality_target_passed,true);
 assert.equal(r.totals['current-are'].perfect,4);assert.equal(r.accepted_savings,null);assert.equal(r.matched_control_savings_evaluable,false);
 assert.equal(r.development_target_passed,false);assert.equal(r.benchmark_cleared,false);assert.equal(r.campaign_goal_achieved,false);
});
test('near-perfect, invalid, short, unresolved, oversized or unsettled runs cannot pass candidate quality',()=>{
 for(const mutate of [f=>f.outcomes[0].native.native.final.span.precision=1-Number.EPSILON,f=>f.outcomes[0].valid=false,f=>f.reconciliation.rows[0].raw_accounting.raw_accounting_complete=false,f=>f.reconciliation.rows[0].evidence.windows.requests[0].projected_tokens=8001,f=>f.outer_process_settled=false,f=>f.post_score_integrity_verified=false,f=>{const r=f.reconciliation.rows[0];r.raw_accounting.known_token_lower_bound=8000;r.raw_accounting.conservative_total_tokens=8000;r.evidence.ledger.total_tokens=8000;}]){
 const f=fixture();mutate(f);const r=summarizeComparisonScores(f);assert.equal(r.candidate_quality_target_passed,false);assert.equal(r.accepted_savings,null);
 }
});
test('omitted, reordered and malformed outcomes cannot improve the reported score',()=>{
 for(const mutate of [f=>f.outcomes.pop(),f=>f.outcomes.reverse(),f=>f.reconciliation.rows.reverse(),f=>f.outcomes[0].native.native.final.span.coverage=NaN]){const f=fixture();mutate(f);assert.throws(()=>summarizeComparisonScores(f));}
});
