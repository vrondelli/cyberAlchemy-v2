import test from 'node:test';
import assert from 'node:assert/strict';
import {createGlmClient} from '../external-context-v1/holdout-v1/transport.mjs';

const endpoints={chat_endpoint:'http://127.0.0.1:1/chat/completions',tokenizer_endpoint:'http://127.0.0.1:1/tokenizer',maximum_requests:24};

test('ContextBench policies admit a common fifteen-minute model deadline',()=>{
 for(const request_budget of ['contextbench-budget-v1','contextbench-deferral-v1']){
  const client=createGlmClient({...endpoints,request_budget,model_timeout_ms:900000,final_timeout_ms:900000});
  assert.equal(client.model_timeout_ms,900000);
  assert.equal(client.final_timeout_ms,900000);
  assert.throws(()=>createGlmClient({...endpoints,request_budget,model_timeout_ms:900001,final_timeout_ms:900001}),/model-timeout-invalid/);
 }
});

test('non-ContextBench timeout ceilings remain unchanged',()=>{
 assert.throws(()=>createGlmClient({...endpoints,request_budget:'holdout-window-v1',model_timeout_ms:120001,final_timeout_ms:120001}),/model-timeout-invalid/);
 assert.throws(()=>createGlmClient({...endpoints,maximum_requests:12,request_budget:'standard-v1',model_timeout_ms:60001,final_timeout_ms:60001}),/model-timeout-invalid/);
});
