// Prospective descriptive decision; never overrides native completion gates.
// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {adjudicateRankedRead,COUNTERS} from './ranked-read-adjudication-r2.mjs';
export {COUNTERS};
const hash=x=>createHash('sha256').update(x).digest('hex');
const contractPath=new URL('./SCHEMA-AGREEMENT-MEASUREMENTS-R1.json',import.meta.url);
function verifyCensus(c,row){
 try{
  assert.equal(c.schema,'are.schema-agreement-search-census/v1');assert.equal(c.counters_reconstructed,true);assert.equal(c.structural_contract,'schema-agreement-r1-local-replay');assert.equal(c.structural_disagreements,0);
  assert.equal(c.known_model_tokens,row.total_model_tokens);for(const key of ['unresolved_search_calls','missing_model_responses','unknown_usage_receipts'])assert.equal(c[key],0);
  assert.ok(Array.isArray(c.rows));assert.equal(new Set(c.rows.map(r=>r.call_id)).size,c.rows.length);
  const categories=['ranked','literal','literal-default','malformed-json','invalid-shape','missing-mode-invalid','invalid-mode'];
  for(const r of c.rows){assert.ok(typeof r.call_id==='string'&&r.call_id.length&&categories.includes(r.classification));assert.ok(['accepted','rejected'].includes(r.outcome));assert.ok(typeof r.structural_valid==='boolean'||(r.classification==='malformed-json'&&r.structural_valid===null));}
  const count=f=>c.rows.filter(f).length;
  assert.deepEqual(c.classifications,Object.fromEntries(categories.map(k=>[k,count(r=>r.classification===k)])));
  assert.equal(c.requested_search_calls,c.rows.length);assert.equal(c.rejected_search_calls,count(r=>r.outcome==='rejected'));assert.equal(c.ranked_requested_calls,c.classifications.ranked);assert.equal(c.ranked_rejected_calls,count(r=>r.classification==='ranked'&&r.outcome==='rejected'));
  assert.equal(c.ranked_requested_calls,row.counters['ranked-mode-requested-calls']);assert.equal(c.ranked_rejected_calls,c.ranked_requested_calls-row.counters['ranked-mode-successful-calls']);
  assert.equal(c.ranked_rejection_rate,c.ranked_requested_calls?c.ranked_rejected_calls/c.ranked_requested_calls:null);assert.equal(c.all_search_invalid_rate,c.requested_search_calls?c.rejected_search_calls/c.requested_search_calls:null);
  return true;
 }catch{return false;}
}
export function adjudicateSchemaAgreement(rows){
 const bytes=readFileSync(contractPath),contract=JSON.parse(bytes);for(const b of contract.source_bindings)assert.equal(hash(readFileSync(b.path)),b.sha256,'schema-adjudication.contract-source-drift');
 const native=adjudicateRankedRead(rows),searchValid=native.rows.map(r=>({task_id:r.task_id,verified:verifyCensus(rows.find(x=>x.task_id===r.task_id)?.search_census,rows.find(x=>x.task_id===r.task_id))}));
 const eligible=native.eligible&&searchValid.every(r=>r.verified);
 const totals=eligible?Object.fromEntries(['requested_search_calls','rejected_search_calls','ranked_requested_calls','ranked_rejected_calls'].map(k=>[k,rows.reduce((n,r)=>n+r.search_census[k],0)])):null;
 const rate=totals?.ranked_requested_calls?totals.ranked_rejected_calls/totals.ranked_requested_calls:null;
 const use=native.zero_use_tasks.length<native.rows.length;
 let disposition='inconclusive',reason='incomplete-quality-cost-or-search-census';
 if(eligible&&rate!==null&&use){
  const s=contract.support,support=rate<s.ranked_rejection_rate_less_than&&native.mean_coverage_per_10000_tokens>s.mean_Q_greater_than+s.tolerance&&native.mean_native_span_f1>=s.mean_span_f1_at_least-s.tolerance;
  disposition=support?'supporting':'counterevidence';reason=support?'descriptive-schema-agreement-support':'registered-schema-thresholds-failed';
 }else if(eligible)reason='zero-ranked-or-confirmed-use';
 return {...native,schema:'are.schema-agreement-adjudication/v1',measurement_contract_sha256:hash(bytes),eligible,disposition,reason,search_verification:searchValid,search_censuses:rows.map(r=>({task_id:r.task_id,census:r.search_census??null})),search_totals:totals,ranked_rejection_rate:rate,all_search_invalid_rate:totals?.requested_search_calls?totals.rejected_search_calls/totals.requested_search_calls:null,previous_candidate_deltas:eligible?{mean_native_span_f1:native.mean_native_span_f1-contract.previous_candidate.mean_native_span_f1,mean_coverage_per_10000_tokens:native.mean_coverage_per_10000_tokens-contract.previous_candidate.mean_coverage_per_10000_tokens}:null,claim_ceiling:'Descriptive fixed-cohort comparison; no causal attribution, matched savings or campaign completion.',campaign_goal_achieved:false,open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
}
