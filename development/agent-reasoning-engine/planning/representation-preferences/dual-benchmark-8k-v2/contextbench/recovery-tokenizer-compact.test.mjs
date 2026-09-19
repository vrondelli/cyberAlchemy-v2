import test from 'node:test';import assert from 'node:assert/strict';
import {createTokenizerMeasurer,runCounterfactual} from './recovery-tokenizer-compact.mjs';
const request={messages:[{role:'user',content:'fixture'}],tools:[]};
test('identical concurrent measurements share one dispatched call and retain lifecycle receipts',async()=>{
 let posts=0;const events=[];const m=createTokenizerMeasurer({post:async(raw,dispatch)=>{await dispatch();posts++;return {status:200,payload:{usage:{prompt_tokens:13}}};},record:async x=>events.push(x),before_dispatch:async()=>{}});
 assert.deepEqual(await Promise.all([m.measure(request),m.measure(request)]),[13,13]);assert.equal(posts,1);assert.equal(m.receipts.length,1);assert.equal(m.invocations,2);assert.deepEqual(events.map(x=>[x.status,x.dispatched]),[['started',false],['started',true],[200,true]]);
});
test('malformed responses remain failed, cache does not retry, and guard denial makes no HTTP call',async()=>{
 let posts=0;const m=createTokenizerMeasurer({post:async(raw,dispatch)=>{await dispatch();posts++;return {status:200,payload:{}};},record:async()=>{},before_dispatch:async()=>{}});
 await assert.rejects(m.measure(request),/invalid-response/);await assert.rejects(m.measure(request));assert.equal(posts,1);assert.equal(m.receipts[0].tokens,null);
 const denied=createTokenizerMeasurer({post:async(raw,dispatch)=>{await dispatch();throw Error('unexpected HTTP');},record:async()=>{},before_dispatch:async()=>{throw Error('disk guard');}});await assert.rejects(denied.measure(request),/disk guard/);assert.equal(denied.receipts[0].dispatched,false);
});
test('fixed denominator survives early source failure and both workers settle',async()=>{
 const controller=new AbortController();let active=0;
 const outcomes=[25,24,24,24].map((count,i)=>({task_id:'task'+i,requests:Array.from({length:count},(_,j)=>({request_sha256:'request'+j}))}));
 const r=await runCounterfactual({outcomes,load_source:async()=>{active++;try{await new Promise(r=>setTimeout(r,5));throw Error('source mismatch');}finally{active--;}},measure:async()=>{throw Error('unexpected measurement');},write_row:async()=>{},signal:controller.signal,abort:()=>controller.abort()});
 assert.equal(active,0);assert.equal(r.status,'failed');assert.equal(r.rows.length,97);assert.equal(r.completed_pairs,0);assert.equal(r.input_size_supported,false);assert.equal(r.model_calls,0);
});
test('tokenizer ceiling and cancellation fail before additional dispatch',async()=>{
 let calls=0;const controller=new AbortController(),m=createTokenizerMeasurer({maximum_calls:1,signal:controller.signal,post:async(raw,dispatch)=>{await dispatch();calls++;return {status:200,payload:{usage:{prompt_tokens:2}}};},record:async()=>{},before_dispatch:async()=>{}});await m.measure(request);await assert.rejects(m.measure({...request,messages:[{role:'user',content:'different'}]}),/call-limit/);controller.abort();await assert.rejects(m.measure(request),/aborted/);assert.equal(calls,1);
});

test('secret resolution failure retains zero dispatch rather than inventing an HTTP attempt',async()=>{
 const m=createTokenizerMeasurer({post:async()=>{throw Error('credential unavailable');},record:async()=>{},before_dispatch:async()=>{}});
 await assert.rejects(m.measure(request),/credential unavailable/);assert.equal(m.receipts.length,1);assert.equal(m.receipts[0].dispatched,false);assert.equal(m.receipts[0].tokens,null);
});
