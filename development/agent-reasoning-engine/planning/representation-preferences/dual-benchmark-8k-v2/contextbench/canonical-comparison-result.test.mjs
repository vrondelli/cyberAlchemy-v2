import {test} from 'node:test';import assert from 'node:assert/strict';
import {preserveComparisonResult} from './canonical-comparison-result.mjs';
import {accountComparisonOutcome} from './comparison-accounting.mjs';
test('complete canonical result remains byte-equivalent and detached even when provider health is bad',()=>{
 const value={status:'run_error',infrastructure_failure:null,receipts:[{kind:'model',dispatched:true,status:null,input_tokens:null,output_tokens:null,failure_code:'request-failed'}],index_tokenizer_receipts:[]};
 const result=preserveComparisonResult(value);assert.deepEqual(result,value);assert.notEqual(result,value);assert.notEqual(result.receipts,value.receipts);value.receipts.push({});assert.equal(result.receipts.length,1);
 const accounting=accountComparisonOutcome({attempted:true,status:'returned',result});assert.equal(accounting.provider_healthy,false);assert.equal(accounting.raw_accounting_complete,false);assert.equal(accounting.conservative_total_tokens,8000);
});
test('incomplete summary prefers available client receipts and explicitly refuses canonical/accounting claims',()=>{
 const receipts=[{kind:'model',dispatched:true,status:200,input_tokens:100,output_tokens:20}],result=preserveComparisonResult({status:'orchestration_error',receipts:[]},{receipts,index_receipts:[]});
 assert.equal(result.accounting_requires_reconciliation,true);assert.equal(result.dispatcher_recovery.canonical_persistence_claimed,false);assert.deepEqual(result.receipts,receipts);
 const accounting=accountComparisonOutcome({attempted:true,status:'failed',result});assert.equal(accounting.known_token_lower_bound,120);assert.equal(accounting.conservative_total_tokens,96000);assert.equal(accounting.raw_accounting_complete,false);
});
test('absent or malformed summaries cannot become a zero-cost complete result',()=>{
 for(const value of [null,[],{receipts:'invalid',index_tokenizer_receipts:[]}]){
  const result=preserveComparisonResult(value);assert.equal(result.accounting_requires_reconciliation,true);assert.equal(accountComparisonOutcome({attempted:true,status:'failed',result}).raw_accounting_complete,false);
 }
});
