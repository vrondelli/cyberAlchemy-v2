// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {adjudicateSchemaAgreement,COUNTERS} from './schema-agreement-adjudication-r2.mjs';
function rows({rejected=0,requested=1}={}){return Array.from({length:4},(_,i)=>({task_id:'contextbench-'+(i+1),valid:true,native_reconstructed:true,accounting_complete:true,window_verified:true,counters_reconstructed:true,total_model_tokens:50000,exported_union_span_recall:1,native_span_f1:1,counters:{...Object.fromEntries(COUNTERS.map(k=>[k,0])),'ranked-mode-requested-calls':requested,'ranked-mode-successful-calls':requested-rejected,'ranked-windows-returned':requested-rejected,'receipt-confirmed-ranked-observations':requested-rejected},search_census:{schema:'are.schema-agreement-search-census/v1',structural_contract:'schema-agreement-r1-local-replay',structural_disagreements:0,counters_reconstructed:true,known_model_tokens:50000,unresolved_search_calls:0,missing_model_responses:0,unknown_usage_receipts:0,rows:Array.from({length:requested},(_,n)=>({call_id:'call-'+n,classification:'ranked',structural_valid:n>=rejected,outcome:n<rejected?'rejected':'accepted'})),classifications:{ranked:requested,literal:0,'literal-default':0,'malformed-json':0,'invalid-shape':0,'missing-mode-invalid':0,'invalid-mode':0},requested_search_calls:requested,rejected_search_calls:rejected,ranked_requested_calls:requested,ranked_rejected_calls:rejected,ranked_rejection_rate:requested?rejected/requested:null,all_search_invalid_rate:requested?rejected/requested:null}}));}
test('quality and efficiency support additionally requires rejection rate strictly below .6',()=>{
 const pass=adjudicateSchemaAgreement(rows());assert.equal(pass.disposition,'supporting');assert.equal(pass.campaign_goal_achieved,false);assert.equal(pass.accepted_token_savings,null);
 const equal=adjudicateSchemaAgreement(rows({requested:5,rejected:3}));assert.equal(equal.eligible,true);assert.equal(equal.disposition,'counterevidence');assert.equal(equal.ranked_rejection_rate,.6);
 assert.equal(adjudicateSchemaAgreement(rows({requested:5,rejected:2})).disposition,'supporting');
});
test('incomplete or contradictory census cannot support even perfect native metrics',()=>{
 for(const mutate of [r=>delete r.search_census,r=>r.search_census.known_model_tokens=1,r=>r.search_census.ranked_rejected_calls=9,r=>r.search_census.rows[0].outcome='unresolved',r=>r.search_census.missing_model_responses=1,r=>r.search_census.structural_disagreements=1,r=>r.search_census.classifications.ranked=0]){
  const x=rows();mutate(x[0]);const r=adjudicateSchemaAgreement(x);assert.equal(r.disposition,'inconclusive');assert.equal(r.eligible,false);assert.equal(r.ranked_rejection_rate,null);assert.equal(r.rows.length,4);
 }
});
test('zero use, missing tasks and unknown costs remain inconclusive with evidence retained',()=>{
 assert.equal(adjudicateSchemaAgreement(rows({requested:0})).disposition,'inconclusive');
 const x=rows();x.pop();assert.equal(adjudicateSchemaAgreement(x).disposition,'inconclusive');
 const y=rows();y[0].unknown_usage=true;y[0].known_model_tokens=123;y[0].conservative_model_tokens=96000;const r=adjudicateSchemaAgreement(y);assert.equal(r.disposition,'inconclusive');assert.equal(r.rows[0].known_model_tokens,123);assert.equal(r.rows[0].conservative_model_tokens,96000);
});
test('quality regression remains counterevidence despite zero search rejection',()=>{
 const x=rows();for(const r of x)r.native_span_f1=.1;assert.equal(adjudicateSchemaAgreement(x).disposition,'counterevidence');
});

test('accepted invalid structures and impossible classification flags are inconclusive',()=>{
 for(const [classification,structural_valid,outcome] of [['ranked',false,'accepted'],['literal',false,'accepted'],['literal-default',false,'rejected'],['malformed-json',true,'rejected'],['malformed-json',null,'accepted'],['invalid-shape',true,'rejected'],['missing-mode-invalid',true,'rejected'],['invalid-mode',true,'accepted']]){
  const x=rows();Object.assign(x[0].search_census.rows[0],{classification,structural_valid,outcome});assert.equal(adjudicateSchemaAgreement(x).disposition,'inconclusive');
 }
});
test('structurally valid semantic rejections remain eligible counterevidence',()=>{
 const x=rows({requested:5,rejected:3});for(const row of x)for(const call of row.search_census.rows)call.structural_valid=true;
 const r=adjudicateSchemaAgreement(x);assert.equal(r.eligible,true);assert.equal(r.disposition,'counterevidence');
});
