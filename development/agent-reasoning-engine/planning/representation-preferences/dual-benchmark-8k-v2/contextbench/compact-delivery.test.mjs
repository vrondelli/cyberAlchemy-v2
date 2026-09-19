import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {stable,bodyForReceipt,bindDelivery} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {encodeToolPayload,PAYLOAD_GUIDE} from './tool-payload-codec.mjs';import {bindCompactDelivery} from './compact-delivery.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const events=readFileSync(new URL('./comparison-production-live-r1/runs_root/00/events.jsonl',import.meta.url),'utf8').trim().split(String.fromCharCode(10)).map(JSON.parse),event=events.find(e=>e.kind==='source-tool-result');
// Synthetic successful receipts exercise binding only; historical denied request remains undelivered.
function fixture(payload){const prompt=stable({messages:[{role:'system',content:PAYLOAD_GUIDE},{role:'assistant',content:'',tool_calls:[event.call]},{role:'tool',tool_call_id:event.call.id,content:stable(payload)}],tools:[]}),profile={model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low'},receipt={...profile,kind:'model',dispatched:true,status:200,input_tokens:123,output_tokens:17,request_sha256:hash(bodyForReceipt(prompt,profile))};return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]};}
test('receipt-bound compact delivery yields the same twenty native observation identities as raw delivery',()=>{
 const raw=fixture(event.output),encoded=fixture(encodeToolPayload({tool:'search',result:event.output}).payload),a=bindDelivery(raw),b=bindCompactDelivery(encoded);
 assert.notEqual(raw.receipts[0].request_sha256,encoded.receipts[0].request_sha256);assert.deepEqual(b.read_observations,a.read_observations);assert.equal(b.read_observations.length,20);assert.deepEqual(b.unmapped,[]);assert.deepEqual(b.token_accounting,a.token_accounting);
});
test('raw captures remain compatible',()=>{const f=fixture(event.output);assert.deepEqual(bindCompactDelivery(f),bindDelivery(f));});
test('old wire receipts cannot be reassigned to newly encoded captures',()=>{
 const raw=fixture(event.output),encoded=fixture(encodeToolPayload({tool:'search',result:event.output}).payload);
 assert.throws(()=>bindCompactDelivery({...encoded,receipts:raw.receipts}),/receipt.capture-not-found/);
});
test('tokenizer-only and unsuccessful model attempts cannot credit archived observations',()=>{
 const f=fixture(encodeToolPayload({tool:'search',result:event.output}).payload);
 for(const receipt of [{...f.receipts[0],kind:'tokenizer'},{...f.receipts[0],status:null,failure_code:'cancelled'},{...f.receipts[0],dispatched:false}])assert.equal(bindCompactDelivery({...f,receipts:[receipt]}).read_observations.length,0);
});
test('even a matching synthetic receipt cannot make malformed encoded observations valid',()=>{
 const payload=encodeToolPayload({tool:'search',result:event.output}).payload;payload.output.observations[0].source_ref=99;
 const r=bindCompactDelivery(fixture(payload));assert.equal(r.read_observations.length,0);assert.equal(r.unmapped.length,1);
});
