import test from 'node:test';
import assert from 'node:assert/strict';
import {applyBoundedFailureCensoring} from './censored-pair-accounting.mjs';

const metric=value=>({span_coverage:value,span_precision:value,span_f1:value,file_coverage:value,file_precision:value,valid:true,model_tokens:1000,unknown_usage_calls:0});
const fixture=()=>({
  prefixRows:Array.from({length:8},(_,index)=>({cell_id:`p${index}`,unknown_usage_calls:index===0?1:0})),
  rows:Array.from({length:8},(_,index)=>({instance_id:`t${index}`,control:metric(.2),treatment:metric(.3),pair_validation:{ok:index!==0,prefix_cell_id:`p${index}`,control_cell_id:`c${index}`,treatment_cell_id:`s${index}`}})),
  localFailures:[{cell_id:'p0',failure_family:'model-transport-indeterminate',accounting_posture:'upper-bound-debit',unknown_model_receipts:1,known_model_tokens:1200,input_token_upper_bound:1500,output_token_upper_bound:2048,indeterminate_token_debit:3548,conservative_model_token_upper_bound:4748,total_token_limit:96000}]
});

test('bounded prefix failure becomes a symmetric fixed zero and preserves raw metrics',()=>{
  const result=applyBoundedFailureCensoring(fixture());
  assert.equal(result.passed,true);
  assert.equal(result.accounting.complete_pairs,7);
  assert.equal(result.accounting.censored_pairs,1);
  assert.equal(result.rows[0].control.span_f1,0);
  assert.equal(result.rows[0].treatment.span_f1,0);
  assert.equal(result.rows[0].control.uncensored_metrics.span_f1,.2);
  assert.equal(result.rows[0].control.conservative_model_tokens,4548);
  assert.equal(result.rows[1].treatment.span_f1,.3);
});

test('unmatched unknown usage, malformed bounds, too many failures, and too few pairs fail separately',()=>{
  const unmatched=fixture();unmatched.prefixRows[1].unknown_usage_calls=1;assert.equal(applyBoundedFailureCensoring(unmatched).checks.unbounded_unknown_usage,false);
  const malformed=fixture();malformed.localFailures[0].indeterminate_token_debit=1;assert.equal(applyBoundedFailureCensoring(malformed).checks.bound_shape_valid,false);
  const excess=fixture();excess.localFailures.push({...excess.localFailures[0],cell_id:'p1'}, {...excess.localFailures[0],cell_id:'p2'});excess.prefixRows[1].unknown_usage_calls=1;excess.prefixRows[2].unknown_usage_calls=1;assert.equal(applyBoundedFailureCensoring(excess).checks.indeterminate_call_limit,false);
  const sparse=fixture();for(let index=1;index<4;index++)sparse.rows[index].pair_validation.ok=false;assert.equal(applyBoundedFailureCensoring(sparse).checks.minimum_complete_pairs,false);
});

test('zero-byte tokenizer branch failure is a bounded symmetric zero with no token debit',()=>{
  const value=fixture();
  value.prefixRows[0].unknown_usage_calls=0;
  value.localFailures=[{cell_id:'s0',failure_family:'tokenizer-transport',terminal_kind:'tokenizer',response_bytes:0,unknown_model_receipts:0,known_model_tokens:1000}];
  const result=applyBoundedFailureCensoring(value);
  assert.equal(result.passed,true);
  assert.equal(result.accounting.conservative_token_debit,0);
  assert.equal(result.rows[0].control.span_f1,0);
  assert.equal(result.rows[0].treatment.span_f1,0);
  assert.equal(result.rows[0].treatment.conservative_model_tokens,1000);
});

test('nonterminal shared boundary remains in denominator and does not count as a complete pair',()=>{
  const value=fixture();
  value.prefixRows[0].unknown_usage_calls=0;
  value.localFailures=[{cell_id:'p0',failure_family:'nonterminal-boundary',boundary_kind:'output-pressure',unknown_model_receipts:0,known_model_tokens:1000}];
  const result=applyBoundedFailureCensoring(value);
  assert.equal(result.passed,true);
  assert.equal(result.accounting.complete_pairs,7);
  assert.equal(result.accounting.censored_pairs,1);
  assert.equal(result.rows[0].control.span_f1,0);
  assert.equal(result.rows[0].treatment.span_f1,0);
});
