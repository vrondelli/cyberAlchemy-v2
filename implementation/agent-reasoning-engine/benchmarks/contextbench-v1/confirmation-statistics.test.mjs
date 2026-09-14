import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateConfirmation,f1,repositoryClusterBootstrap} from './confirmation-statistics.mjs';

const criteria={scheduled_trajectories:4,required_repetitions:2,paired_macro_span_f1_gain_minimum:.05,unknown_model_usage:0,additional_model_calls:0,additional_model_tokens:0,maximum_closure_evidence:6};
const row=(cell_id,repo,repetition,base,treatment)=>({cell_id,repo,repetition,baseline_span_coverage:base,baseline_span_precision:base,baseline_span_f1:base,baseline_file_coverage:base,baseline_file_precision:base,treatment_span_coverage:treatment,treatment_span_precision:treatment,treatment_span_f1:treatment,treatment_file_coverage:treatment,treatment_file_precision:treatment,independent_reconstruction_agrees:true,unknown_usage_calls:0,additional_model_calls:0,additional_model_tokens:0,closure_ids:1});

test('F1 handles empty and harmonic cases',()=>{assert.equal(f1({coverage:0,precision:0}),0);assert.equal(f1({coverage:.5,precision:1}),2/3);});
test('fixed confirmation gate passes a stable positive paired effect',()=>{
  const rows=[row('a','r1',1,.1,.2),row('b','r1',2,.1,.2),row('c','r2',1,.2,.3),row('d','r2',2,.2,.3)];
  const result=evaluateConfirmation(rows,criteria,{seed:'fixed',resamples:1000});assert.equal(result.passed,true);assert.ok(result.bootstrap.lower_95>0);assert.equal(result.repetitions[1].rows,2);
});
test('zeros stay in the denominator and a repetition failure rejects',()=>{
  const rows=[row('a','r1',1,0,0),row('b','r1',2,.2,.1),row('c','r2',1,0,0),row('d','r2',2,.2,.1)];
  const result=evaluateConfirmation(rows,{...criteria,paired_macro_span_f1_gain_minimum:0},{seed:'fixed',resamples:100});assert.equal(result.passed,false);assert.equal(result.checks.each_repetition_positive,false);
});
test('bootstrap is byte-for-byte deterministic',()=>{
  const rows=[row('a','r1',1,.1,.2),row('b','r2',2,.2,.25)];assert.deepEqual(repositoryClusterBootstrap(rows,{seed:'s',resamples:50}),repositoryClusterBootstrap(rows,{seed:'s',resamples:50}));
});
