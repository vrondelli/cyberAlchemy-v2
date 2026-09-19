// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {adjudicateRankedRead,COUNTERS} from './ranked-read-adjudication-r1.mjs';
const rows=()=>Array.from({length:4},(_,i)=>({task_id:'contextbench-'+(i+1),valid:true,native_reconstructed:true,accounting_complete:true,window_verified:true,counters_reconstructed:true,total_model_tokens:50000,exported_union_span_recall:1,native_span_f1:1,counters:{...Object.fromEntries(COUNTERS.map(k=>[k,0])),'ranked-mode-requested-calls':1,'ranked-mode-successful-calls':1,'ranked-windows-returned':1,'receipt-confirmed-ranked-observations':1}}));
test('support cannot imply perfect campaign, causal result or matched savings',()=>{
 const r=adjudicateRankedRead(rows());assert.equal(r.disposition,'supporting');assert.equal(r.campaign_goal_achieved,false);assert.equal(r.accepted_token_savings,null);assert.equal(r.matched_control_savings_evaluable,false);
});
test('equal task weighting differs from pooled coverage/token ratio',()=>{
 const x=rows();x[0].total_model_tokens=1000;x[0].exported_union_span_recall=0.2;const r=adjudicateRankedRead(x);assert.equal(r.mean_coverage_per_10000_tokens,(2+0.2+0.2+0.2)/4);assert.notEqual(r.mean_coverage_per_10000_tokens,10000*3.2/151000);
});
test('zero use is inconclusive even with perfect quality; some unused tasks retained',()=>{
 const x=rows();for(const r of x)r.counters['receipt-confirmed-ranked-observations']=0;
 const zero=adjudicateRankedRead(x);assert.equal(zero.disposition,'inconclusive');assert.equal(zero.zero_use_tasks.length,4);
 x[0].counters['receipt-confirmed-ranked-observations']=1;const some=adjudicateRankedRead(x);assert.equal(some.disposition,'supporting');assert.equal(some.rows.length,4);assert.equal(some.zero_use_tasks.length,3);
});
test('invalid or unknown costs yield null ratio without dropping spend',()=>{
 for(const cost of [0,-1,1.2,null,NaN,Infinity]){const x=rows();x[0].total_model_tokens=cost;x[0].known_model_tokens=100;x[0].conservative_model_tokens=8000;const r=adjudicateRankedRead(x);assert.equal(r.disposition,'inconclusive');assert.equal(r.rows.length,4);assert.equal(r.rows[0].coverage_per_10000_tokens,null);assert.equal(r.rows[0].conservative_model_tokens,8000);}
 const x=rows();x[0].accounting_complete=false;assert.equal(adjudicateRankedRead(x).rows[0].coverage_per_10000_tokens,null);
});
test('quality regression or efficiency failure produces counterevidence',()=>{
 const x=rows();for(const r of x)r.native_span_f1=0.1;assert.equal(adjudicateRankedRead(x).disposition,'counterevidence');
 const y=rows();for(const r of y)r.exported_union_span_recall=0.01;assert.equal(adjudicateRankedRead(y).disposition,'counterevidence');
});
test('missing tasks/counters and inconsistent counts cannot silently improve means',()=>{
 const x=rows();x.pop();const missing=adjudicateRankedRead(x);assert.equal(missing.rows.length,4);assert.equal(missing.disposition,'inconclusive');assert.equal(missing.mean_coverage_per_10000_tokens,null);
 for(const mutate of [r=>{delete r.counters;},r=>{r.counters['ranked-mode-successful-calls']=2;},r=>{r.counters['receipt-confirmed-ranked-observations']=2;}]){const x=rows();mutate(x[0]);assert.equal(adjudicateRankedRead(x).disposition,'inconclusive');}
 assert.throws(()=>adjudicateRankedRead([...rows(),rows()[0]]),/task-identity/);
});
