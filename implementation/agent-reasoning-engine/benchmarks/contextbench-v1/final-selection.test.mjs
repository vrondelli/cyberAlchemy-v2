import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {bindDelivery, bodyForReceipt, stable} from './delivery.mjs';
import {capturePublicResponse, selectFinalReads} from './final-selection.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture() {
  const prompt=stable({messages:[{role:'assistant',tool_calls:[{id:'r1',type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1})}}]},
    {role:'tool',tool_call_id:'r1',content:stable({ok:true,output:{path:'a.py',start_line:1,end_line:1,utf8:'hello',source_sha256:hash('hello')}})}],tools:[]});
  const r={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,input_tokens:100,output_tokens:10,finish_reason:'stop'};
  r.request_sha256=hash(stable(bodyForReceipt(prompt,r)));
  const input={captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[r]};
  const id=bindDelivery(input).read_observations[0].id;
  const result={receipt:r,final_bytes:stable({finish_reason:'stop',message:{role:'assistant',content:stable({summary:'Done',context_read_ids:[id]}),reasoning_content:'private reasoning'}})};
  return {...input,result,response_capture:capturePublicResponse(result,0),id};
}
test('terminal public response selects delivered IDs without persisting hidden reasoning',()=>{
  const x=fixture();assert.deepEqual(selectFinalReads(x).final_read_ids,[x.id]);
  assert.equal(stable(x.response_capture).includes('private reasoning'),false);
});
test('mutated response bytes fail integrity check',()=>{
  const x=fixture();x.response_capture.public_response.message.content='{}';
  assert.throws(()=>selectFinalReads(x),/capture-digest/);
});
test('receipt substitution and later model calls invalidate terminal binding',()=>{
  const x=fixture();x.receipts[0].input_tokens++;assert.throws(()=>selectFinalReads(x),/receipt-mismatch/);
  const y=fixture();y.receipts.push({...y.receipts[0]});assert.throws(()=>selectFinalReads(y),/not-terminal-response/);
});
test('invented and duplicate final references are rejected',()=>{
  for(const ids of [['invented'],null]){
    const x=fixture(),p=JSON.parse(x.result.final_bytes);p.message.content=stable({summary:'Done',context_read_ids:ids??[x.id,x.id]});
    x.response_capture=capturePublicResponse({...x.result,final_bytes:stable(p)},0);
    assert.throws(()=>selectFinalReads(x),/undelivered-selection|invalid-read-ids/);
  }
});
test('empty explicit final context remains empty, never archive union',()=>{
  const x=fixture(),p=JSON.parse(x.result.final_bytes);p.message.content=stable({summary:'No context selected',context_read_ids:[]});
  x.response_capture=capturePublicResponse({...x.result,final_bytes:stable(p)},0);
  assert.deepEqual(selectFinalReads(x).final_read_ids,[]);
});
test('failed response cannot become a capture',()=>{
  const x=fixture();x.result.receipt.status=500;assert.throws(()=>capturePublicResponse(x.result,0),/unsuccessful-response/);
});
