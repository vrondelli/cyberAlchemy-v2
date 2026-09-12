import test from 'node:test';import assert from 'node:assert/strict';
import {combine} from './controls-probe.mjs';import {validateArgs} from './controls-contract.mjs';
const r=status=>({candidate_id:'baseline',status,cleanup_verified:true,excerpt:'evidence',log_sha256:'a'});
test('both checks required, baseline and regression distinguished',()=>{
 assert.equal(combine('baseline',r('passed'),r('passed')).status,'passed');
 assert.equal(combine('baseline',r('intended_failure'),r('passed')).status,'intended_failure');
 assert.equal(combine('baseline',r('passed'),r('failed')).status,'failed');
 assert.equal(combine('baseline',r('execution_error'),r('passed')).status,'execution_error');
});
test('candidate identity and cleanup fail closed',()=>{
 assert.throws(()=>combine('other',r('passed'),r('passed')),/candidate mismatch/);
 assert.throws(()=>combine('baseline',r('passed'),{...r('passed'),cleanup_verified:false}),/cleanup/);
});
test('tool requires the combined probe identity',()=>{
 assert(validateArgs('run_public_reproducer',JSON.stringify({candidate_id:'baseline',probe_id:'public-snippet-controls-v1'})).ok);
 assert(!validateArgs('run_public_reproducer',JSON.stringify({candidate_id:'baseline',probe_id:'public-async-snippet-v1'})).ok);
});
