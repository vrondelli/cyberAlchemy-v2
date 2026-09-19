import test from 'node:test';
import assert from 'node:assert/strict';
import {createMeter} from './qualify.mjs';
import {wire,sha,createTokenizerSession} from './adapter.mjs';
const request=wire([{role:'user',content:'source-only synthetic history'}],1024);
test('tokenizer binds complete future wire while sending only native tokenizer model/messages',async()=>{
 const receipts=[];let calls=0;const meter=createMeter({exchange:async(raw,digest,{signal})=>{calls++;assert.equal(digest,sha(raw));assert.ok(signal);assert.deepEqual(JSON.parse(raw),{model:request.model,messages:request.messages});return {status:200,payload:{usage:{prompt_tokens:31}}};},record:r=>receipts.push(structuredClone(r))});
 const measured=await createTokenizerSession(meter)(request);assert.deepEqual(measured,{input_tokens:31,wire_sha256:sha(request)});assert.equal(calls,1);assert.equal(receipts.length,2);assert.ok(receipts.every(r=>r.model_calls===0));
});
test('HTTP error stops subsequent attempts and retains failed receipt',async()=>{
 let calls=0;const receipts=[];const meter=createMeter({exchange:async()=>{calls++;return {status:429,payload:{}};},record:r=>receipts.push(structuredClone(r))});await assert.rejects(meter(request));await assert.rejects(meter(request));assert.equal(calls,1);assert.equal(receipts.at(-1).http_status,429);assert.equal(receipts.at(-1).status,'failed');
});
test('pre-dispatch journal failure makes zero external calls',async()=>{
 let calls=0;const meter=createMeter({exchange:async()=>{calls++;},record:()=>{throw Error('disk');}});await assert.rejects(meter(request),e=>e.receipt.persistence_failure&&e.receipt.dispatched===false);assert.equal(calls,0);
});
test('abort propagates from bounded session to tokenizer and is terminal',async()=>{
 let aborted=false;const meter=createMeter({exchange:async(raw,digest,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('abort'));},{once:true})),record:()=>{}});const session=createTokenizerSession(meter,{timeout_ms:15});await assert.rejects(session(request),/deadline/);assert.equal(aborted,true);await assert.rejects(session(request),/deadline/);
});
test('unsupported wire or failed storage check cannot dispatch',async()=>{
 let calls=0;const meter=createMeter({exchange:async()=>{calls++;},record:()=>{},before:()=>{throw Error('storage');}});await assert.rejects(meter({...request,tools:[]}));await assert.rejects(meter(request),/storage/);assert.equal(calls,0);
});
test('settlement waits for delayed abort terminal journal before final receipt snapshot',async()=>{
 const receipts=[];
 const meter=createMeter({exchange:(_raw,_digest,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>setTimeout(()=>reject(Error('delayed abort')),20),{once:true})),record:async r=>{if(r.status==='failed')await new Promise(resolve=>setTimeout(resolve,5));receipts.push(structuredClone(r));}});
 const session=createTokenizerSession(meter,{timeout_ms:5});await assert.rejects(session(request),/deadline/);assert.deepEqual(receipts.map(r=>r.status),['started']);
 await meter.settle();assert.deepEqual(receipts.map(r=>r.status),['started','failed']);assert.equal(receipts[1].dispatched,true);assert.equal(receipts[1].wire_sha256,sha(request));assert.equal(receipts[1].model_calls,0);
 await assert.rejects(session(request),/deadline/);
});
test('uncooperative exchange yields bounded unresolved audit drain rather than false completion',async()=>{
 const receipts=[];const meter=createMeter({exchange:()=>new Promise(()=>{}),record:r=>receipts.push(structuredClone(r))});
 const session=createTokenizerSession(meter,{timeout_ms:5});await assert.rejects(session(request),/deadline/);
 const settlement=await meter.settle({timeout_ms:5});assert.deepEqual(settlement,{settled:false,reason:'audit-drain-deadline',timeout_ms:5});assert.deepEqual(receipts.map(r=>r.status),['started']);assert.equal(session.snapshot().calls,1);assert.equal(session.snapshot().terminal,'tokenizer-deadline-exceeded');
 await assert.rejects(session(request),/deadline/);
});
