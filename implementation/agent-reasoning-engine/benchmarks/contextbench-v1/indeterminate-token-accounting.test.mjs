import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyBoundedIndeterminateModelFailure} from './indeterminate-token-accounting.mjs';

const fixture=()=>({
  status:'run_error',error:'glm.deadline-exceeded',selection:null,native_export:null,
  receipts:[
    {kind:'model',dispatched:true,status:200,input_tokens:1200,output_tokens:40,response_bytes:600,automatic_retries:0},
    {kind:'model',dispatched:true,status:null,input_tokens:null,output_tokens:null,response_bytes:0,automatic_retries:0,failure_code:'deadline-exceeded'}
  ],
  recycling:{dispatches:[
    {sequence:1,input_upper_bound:1712,output_reservation:2048,projected_upper_bound:3760},
    {sequence:2,input_upper_bound:1500,output_reservation:2048,projected_upper_bound:3548}
  ]},
  admissions:[{admissible:true,known_consumed:1240,request_reservation:3548,total_token_limit:96000}]
});

test('zero-byte timeout debits the admitted input and output upper bound',()=>{
  assert.deepEqual(classifyBoundedIndeterminateModelFailure(fixture()),{
    scope:'local-cell',failure_family:'model-transport-indeterminate',failure_code:'deadline-exceeded',terminal_status:null,response_bytes:0,automatic_retries:0,known_model_tokens:1240,unknown_model_receipts:1,input_token_upper_bound:1500,output_token_upper_bound:2048,indeterminate_token_debit:3548,conservative_model_token_upper_bound:4788,total_token_limit:96000,accounting_posture:'upper-bound-debit'
  });
});

test('validator reports every unproven transport shape as not bounded',()=>{
  for(const mutate of [
    value=>value.receipts.at(-1).response_bytes=1,
    value=>value.receipts.at(-1).automatic_retries=1,
    value=>value.receipts.at(-1).input_tokens=1,
    value=>value.recycling.dispatches.at(-1).projected_upper_bound=999,
    value=>value.admissions.at(-1).request_reservation=999,
    value=>value.admissions.at(-1).known_consumed=1239,
    value=>value.admissions.at(-1).total_token_limit=4000,
    value=>value.receipts.push({kind:'tokenizer',dispatched:true})
  ]){const value=fixture();mutate(value);assert.equal(classifyBoundedIndeterminateModelFailure(value),null);}
});
