import test from 'node:test';import assert from 'node:assert/strict';import {assessTokenBudget} from './token-budget.mjs';
const receipt={kind:'model',dispatched:true,input_tokens:100,output_tokens:20,cached_tokens:50,reasoning_tokens:10};
const args={receipts:[receipt],total_token_limit:200,input_upper_bound:60,output_cap:20};
test('input and output counted once; cached and reasoning subsets not added',()=>{const r=assessTokenBudget(args);assert.equal(r.admissible,true);assert.equal(r.known_consumed,120);});
test('block before next reserved request exceeds cumulative cap',()=>{assert.equal(assessTokenBudget({...args,total_token_limit:199}).admissible,false);});
test('failed dispatched usage unknown blocks further dispatch',()=>{assert.equal(assessTokenBudget({...args,receipts:[{kind:'model',dispatched:true,status:500}]}).reason,'token-budget.unknown-usage');});
test('known failed-call tokens still counted',()=>{assert.equal(assessTokenBudget({...args,receipts:[{...receipt,status:500}]}).known_consumed,120);});
test('tokenizer and nondispatched requests excluded',()=>{assert.equal(assessTokenBudget({...args,receipts:[{kind:'tokenizer',input_tokens:9000},{kind:'model',dispatched:false}]}).known_consumed,0);});
test('repeat requests consume budget each time',()=>{assert.equal(assessTokenBudget({...args,receipts:[receipt,receipt]}).admissible,false);});
