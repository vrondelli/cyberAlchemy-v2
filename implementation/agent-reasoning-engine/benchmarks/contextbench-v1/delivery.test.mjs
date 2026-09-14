import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {bindDelivery,bodyForReceipt,stable} from './delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(){const messages=[{role:'assistant',tool_calls:[{id:'read-1',type:'function',function:{name:'read_file',arguments:'{"path":"a.py","start_line":1,"line_count":1}'}}]},{role:'tool',tool_call_id:'read-1',content:stable({ok:true,output:{path:'a.py',start_line:1,end_line:1,utf8:'hello',source_sha256:'a'.repeat(64),byte_count:5}})}];const prompt=stable({messages,tools:[]}),r={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,input_tokens:100,output_tokens:10};r.request_sha256=hash(stable(bodyForReceipt(prompt,r)));return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[r]};}
test('binds successful receipt to exact visible read bytes',()=>{const x=bindDelivery(fixture());assert.equal(x.read_observations.length,1);assert.equal(x.read_observations[0].body,'hello');assert.equal(x.token_accounting.known_total_tokens,110);});
test('capture without model receipt is not delivery',()=>{const x=fixture();x.receipts=[];assert.equal(bindDelivery(x).read_observations.length,0);});
test('duplicate captures do not duplicate read credit; repeated model requests count tokens',()=>{const x=fixture();x.captures.push(x.captures[0]);x.receipts.push({...x.receipts[0]});const r=bindDelivery(x);assert.equal(r.read_observations.length,1);assert.equal(r.token_accounting.known_total_tokens,220);assert.equal(r.requests.length,2);});
test('HTTP failure does not confirm delivery',()=>{const x=fixture();x.receipts[0].status=500;assert.equal(bindDelivery(x).read_observations.length,0);});
test('unknown usage is not zero or confirmed delivery',()=>{const x=fixture();delete x.receipts[0].input_tokens;const r=bindDelivery(x);assert.equal(r.token_accounting.cost_complete,false);assert.equal(r.read_observations.length,0);});
test('altered prompt fails binding',()=>{const x=fixture();x.captures[0].prompt+=' ';assert.throws(()=>bindDelivery(x),/capture.digest/);});
test('correctly rehashed but different prompt does not match receipt',()=>{const x=fixture();x.captures[0].prompt=stable({messages:[],tools:[]});x.captures[0].prompt_sha256=hash(x.captures[0].prompt);assert.throws(()=>bindDelivery(x),/capture-not-found/);});
test('tokenizer receipts cannot confirm delivery',()=>{const x=fixture();x.receipts[0].kind='tokenizer';assert.equal(bindDelivery(x).read_observations.length,0);});
test('malformed arguments on a rejected read do not poison later delivered evidence',()=>{
 const x=fixture(),prompt=JSON.parse(x.captures[0].prompt),bad={id:'bad-read',type:'function',function:{name:'read_file',arguments:'{"path":"unterminated'}};
 prompt.messages.unshift({role:'assistant',tool_calls:[bad]},{role:'tool',tool_call_id:'bad-read',content:stable({ok:false,error:'invalid arguments'})});
 x.captures[0].prompt=stable(prompt);x.captures[0].prompt_sha256=hash(x.captures[0].prompt);x.receipts[0].request_sha256=hash(stable(bodyForReceipt(x.captures[0].prompt,x.receipts[0])));
 const result=bindDelivery(x);assert.equal(result.unmapped.length,0);assert.equal(result.read_observations.length,1);
});
test('malformed arguments on a successful read remain explicit unmapped evidence',()=>{
 const x=fixture(),prompt=JSON.parse(x.captures[0].prompt);prompt.messages[0].tool_calls[0].function.arguments='{"path":"unterminated';
 x.captures[0].prompt=stable(prompt);x.captures[0].prompt_sha256=hash(x.captures[0].prompt);x.receipts[0].request_sha256=hash(stable(bodyForReceipt(x.captures[0].prompt,x.receipts[0])));
 const result=bindDelivery(x);assert.equal(result.unmapped.length,1);assert.equal(result.read_observations.length,0);
});
