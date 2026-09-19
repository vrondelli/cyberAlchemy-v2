import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildComparisonSchedule} from './comparison-schedule.mjs';import {summarizeComparisonScores} from './comparison-score-summary-r2.mjs';
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url)),sources={cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex'),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
function fixture(){
 const schedule=buildComparisonSchedule(sources),id=s=>({slot_id:s.slot_id,task_id:s.task_id,arm:s.arm});
 const outcomes=schedule.slots.map(s=>({...id(s),valid:true,status:'scored',native:{native:{final:{span:{coverage:1,precision:1},file:{coverage:1,precision:1}}}}}));
 const rows=schedule.slots.map(s=>{const tokens=s.arm==='independent-investigations'?17000:20000;return {...id(s),status:'reconciled',attempted:true,outcome_status:'returned',reconciled:true,raw_accounting:{known_token_lower_bound:tokens,conservative_total_tokens:tokens,raw_accounting_complete:true,provider_healthy:true},evidence:{ledger:{total_tokens:tokens,model_calls:4,evidence_consistent:true},windows:{measured_windows_verified:true,requests:Array.from({length:4},()=>({projected_tokens:7500}))}}};});
 return {schedule,sources,outcomes,reconciliation:{schedule_sha256:schedule.schedule_sha256,assigned_outcomes:12,rows},outer_process_settled:true,post_score_integrity_verified:true};
}
test('exact 15 percent against both comparators passes development only',()=>{
 const r=summarizeComparisonScores(fixture());assert.equal(r.development_target_passed,true);assert.equal(r.totals['independent-investigations'].perfect,4);assert.equal(r.gates.at_least_15_percent_against_both,true);assert.equal(r.benchmark_cleared,false);assert.equal(r.campaign_goal_achieved,false);
});
test('one extra alternative token fails exact threshold without floating rounding',()=>{
 const f=fixture(),r=f.reconciliation.rows.find(r=>r.arm==='independent-investigations');r.raw_accounting.known_token_lower_bound++;r.raw_accounting.conservative_total_tokens++;r.evidence.ledger.total_tokens++;
 const summary=summarizeComparisonScores(f);assert.equal(summary.gates.at_least_15_percent_against_both,false);assert.equal(summary.development_target_passed,false);
});
test('savings against only the more expensive comparator cannot pass',()=>{
 const f=fixture();for(const r of f.reconciliation.rows.filter(r=>r.arm==='minimal-history')){r.raw_accounting.known_token_lower_bound=18000;r.raw_accounting.conservative_total_tokens=18000;r.evidence.ledger.total_tokens=18000;}
 const s=summarizeComparisonScores(f);assert.equal(s.comparisons['current-are'].at_least_15_percent,true);assert.equal(s.comparisons['minimal-history'].at_least_15_percent,false);assert.equal(s.development_target_passed,false);
});
test('one near-perfect task cannot be hidden by averages or rounded F1',()=>{
 const f=fixture(),r=f.outcomes.find(r=>r.arm==='independent-investigations');r.native.native.final.span.precision=1-Number.EPSILON;
 assert.equal(summarizeComparisonScores(f).gates.alternative_each_task_perfect,false);
});
test('invalid, unresolved, short, oversized and unsettled outcomes block efficiency claims',()=>{
 for(const mutate of [f=>f.outcomes[0].valid=false,f=>f.reconciliation.rows[0].raw_accounting.raw_accounting_complete=false,f=>f.reconciliation.rows[0].evidence.windows.requests[0].projected_tokens=8001,f=>f.outer_process_settled=false,f=>f.post_score_integrity_verified=false,f=>{const r=f.reconciliation.rows[0];r.raw_accounting.known_token_lower_bound=8000;r.raw_accounting.conservative_total_tokens=8000;r.evidence.ledger.total_tokens=8000;}]){
  const f=fixture();mutate(f);const r=summarizeComparisonScores(f);assert.equal(r.development_target_passed,false);assert.equal(r.comparisons['current-are'].relative_token_reduction,null);assert.equal(r.assigned_outcomes,12);
 }
});
test('missing/reordered rows and malformed native metrics reject',()=>{
 for(const mutate of [f=>f.outcomes.pop(),f=>f.outcomes.reverse(),f=>f.reconciliation.rows.reverse(),f=>f.outcomes[0].native.native.final.span.coverage=NaN]){const f=fixture();mutate(f);assert.throws(()=>summarizeComparisonScores(f));}
});

test('known spend cannot exceed the sum of supplied request reservations',()=>{
 const f=fixture();for(const r of f.reconciliation.rows)for(const w of r.evidence.windows.requests)w.projected_tokens=1;
 const s=summarizeComparisonScores(f);assert.equal(s.gates.all_requests_within_8k,false);assert.equal(s.development_target_passed,false);assert.equal(s.comparisons['current-are'].relative_token_reduction,null);
});
