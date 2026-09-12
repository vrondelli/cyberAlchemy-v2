import test from 'node:test';import assert from 'node:assert/strict';
import {createIndexTokenizer} from './live-client.mjs';
const registry={consume:async({consumer})=>consumer(Buffer.from('fixture-only'))};
test('index tokenizer uses full GLM tokenizer envelope, caches exact bytes and enforces finite calls',async()=>{
 let calls=0;const records=[];
 const t=createIndexTokenizer({registry,reference:{},maximum_calls:1,record:r=>records.push(r),post:async(url,raw)=>{
  calls++;assert.ok(url.pathname.endsWith('/tokenizer'));const body=JSON.parse(raw);assert.equal(body.model,'glm-5.3-flash');assert.equal(body.messages[0].content,'index');return {status:200,payload:{usage:{prompt_tokens:12}}};
 }});
 assert.equal(await t.measure('index'),12);assert.equal(await t.measure('index'),12);assert.equal(calls,1);
 await assert.rejects(t.measure('other'),/call-limit/);assert.equal(records.at(-1).tokens,12);
});
test('invalid tokenizer response is never converted into a zero-token index',async()=>{
 const t=createIndexTokenizer({registry,reference:{},maximum_calls:1,post:async()=>({status:200,payload:{}})});
 await assert.rejects(t.measure('index'),/failed/);assert.equal(t.receipts[0].dispatched,true);assert.ok(t.receipts[0].failure_code);
});
test('credential failure records no dispatch and never calls the endpoint',async()=>{
 let called=false;
 const t=createIndexTokenizer({registry:{consume:async()=>{throw Error('unavailable');}},reference:{},maximum_calls:1,post:async()=>{called=true;}});
 await assert.rejects(t.measure('index'));assert.equal(called,false);assert.equal(t.receipts[0].dispatched,false);
});
test('endpoint failure survives a secret registry consumer-denied wrapper',async()=>{
 const registry={consume:async({consumer})=>{try{await consumer(Buffer.from('fixture-only'));}catch{const e=Error('redacted');e.code='consumer-denied';throw e;}}};
 const t=createIndexTokenizer({registry,reference:{},maximum_calls:1,post:async()=>{const e=Error('network');e.code='request-failed';throw e;}});
 await assert.rejects(t.measure('state'),/request-failed/);assert.equal(t.receipts[0].failure_code,'request-failed');assert.equal(t.receipts[0].dispatched,true);
});
