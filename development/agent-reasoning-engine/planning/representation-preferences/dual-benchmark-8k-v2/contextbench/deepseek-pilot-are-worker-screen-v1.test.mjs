import test from 'node:test';
import assert from 'node:assert/strict';
import {parseScreenTokenCeiling,screenTokenBudget} from './deepseek-pilot-are-worker-screen-v1.mjs';

test('screen ceiling is opt-in and accepts only a positive safe integer',()=>{
 assert.equal(parseScreenTokenCeiling(undefined),null);
 assert.equal(parseScreenTokenCeiling('261037'),261037);
 for(const value of ['0','-1','1.5','abc','9007199254740992'])assert.throws(()=>parseScreenTokenCeiling(value),/screen.invalid-token-ceiling/);
});

test('screen stops before another dispatch only after known spend reaches the ceiling',()=>{
 const receipts=[
  {kind:'tokenizer',dispatched:true,input_tokens:999999},
  {kind:'model',dispatched:true,input_tokens:100,output_tokens:50},
  {kind:'model',dispatched:false,input_tokens:999,output_tokens:999},
 ];
 assert.deepEqual(screenTokenBudget(receipts,151),{admissible:true,known_tokens:150,unknown_usage:0,reason:'under-ceiling'});
 assert.deepEqual(screenTokenBudget(receipts,150),{admissible:false,known_tokens:150,unknown_usage:0,reason:'token-ceiling-reached'});
 assert.deepEqual(screenTokenBudget(receipts,null),{admissible:true,known_tokens:0,unknown_usage:0,reason:'disabled'});
});

test('unknown dispatched model usage blocks further spending',()=>{
 assert.deepEqual(screenTokenBudget([{kind:'model',dispatched:true,status:200}],200),
  {admissible:false,known_tokens:0,unknown_usage:1,reason:'unknown-usage'});
});
