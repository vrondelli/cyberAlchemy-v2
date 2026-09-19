import test from 'node:test';
import assert from 'node:assert/strict';
import { observeModelReceiptTimings } from './timing.mjs';
test('observer preserves receipt identity/content and derives absolute local request intervals',()=>{
  const receipts=[],events=[],model={kind:'model',dispatched:true,latency_ms:125,status:200,request_sha256:'a'.repeat(64)},before=structuredClone(model);
  const restore=observeModelReceiptTimings(receipts,{record:event=>events.push(event),now:()=>1000});
  assert.equal(receipts.push({kind:'tokenizer',dispatched:true,latency_ms:5},model),2);
  assert.equal(receipts[1],model);assert.deepEqual(model,before);assert.equal(events.length,1);
  assert.equal(events[0].start_ms,875);assert.equal(events[0].end_ms,1000);assert.equal(events[0].latency_ms,125);
  model.input_tokens=20;assert.equal(receipts[1].input_tokens,20);
  restore();assert.equal(Object.hasOwn(receipts,'push'),false);receipts.push({...model});assert.equal(events.length,1);
});
test('undispatched receipts produce no model interval and recorder errors retain pushed receipt',()=>{
  const receipts=[],events=[];const restore=observeModelReceiptTimings(receipts,{record:event=>events.push(event),now:()=>1000});
  receipts.push({kind:'model',dispatched:false,latency_ms:5});assert.equal(events.length,0);restore();
  const receipt={kind:'model',dispatched:true,latency_ms:5};const stop=observeModelReceiptTimings(receipts,{record:()=>{throw Error('disk failure');},now:()=>1000});
  assert.throws(()=>receipts.push(receipt),/disk failure/);assert.equal(receipts.at(-1),receipt);stop();
});
