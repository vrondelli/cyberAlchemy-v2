import test from 'node:test';import assert from 'node:assert/strict';import {createReceiptTokenizerReserve} from './receipt-budget-tokenizer-r2.mjs';
function fixture(){const request=[],index=[];return {request,index,b:createReceiptTokenizerReserve({get_receipts:()=>request,get_index_receipts:()=>index})};}
test('cache hits and index measurements do not consume request tokenizer capacity',async()=>{
 const {b,index}=fixture();for(let i=0;i<200;i++)await b.run(async()=>100);for(let i=0;i<100;i++)await b.runIndex(async()=>{index.push({kind:'index-tokenizer',status:200});return 20;});assert.equal(b.snapshot().actual_tokenizer_receipts,0);assert.equal(b.snapshot().remaining,160);assert.equal(b.snapshot().index_remaining,380);assert.equal(b.canExplore(),true);
});
test('actual failed and successful request receipts consume capacity and final reserve remains available',async()=>{
 const {b,request}=fixture();for(let i=0;i<160;i++)await b.run(async()=>request.push({kind:'tokenizer',status:i%2?200:500}));await assert.rejects(b.run(async()=>{}),/reserved-capacity/);assert.equal(b.canExplore(),false);b.beginFinal();for(let i=0;i<32;i++)await b.run(async()=>request.push({kind:'tokenizer',status:200}));assert.equal(request.length,192);await assert.rejects(b.run(async()=>{}),/reserved-capacity/);
});
test('in-flight reservation blocks overlap and is released by a successful cache hit',async()=>{
 const {b}=fixture();let release;const pending=b.run(()=>new Promise(r=>release=r));assert.equal(b.snapshot().remaining,159);assert.equal(b.canExplore(),false);await assert.rejects(b.run(async()=>{}),/concurrent-operation/);assert.throws(()=>b.beginFinal(),/phase-transition/);release(1);await pending;assert.equal(b.snapshot().remaining,160);
});
test('missing failure receipts poison continuation, while recorded failures retain accurate usage',async()=>{
 const a=fixture();await assert.rejects(a.b.run(async()=>{throw Error('uncertain');}),/uncertain/);await assert.rejects(a.b.run(async()=>{}),/uncertain-operation/);
 const c=fixture();await assert.rejects(c.b.run(async()=>{c.request.push({kind:'tokenizer',status:null,failure_code:'timeout'});throw Error('timeout');}),/timeout/);assert.equal(c.b.snapshot().remaining,159);
});
test('receipt rewrite, unexpected retries and cross-family activity fail closed',async()=>{
 const a=fixture();await a.b.run(async()=>a.request.push({kind:'tokenizer',status:200}));a.request[0].status=500;assert.throws(()=>a.b.snapshot(),/receipt-prefix-changed/);
 const c=fixture();await assert.rejects(c.b.run(async()=>c.request.push({kind:'tokenizer',status:200},{kind:'tokenizer',status:200})),/multiple-attempts/);
 const d=fixture();await assert.rejects(d.b.run(async()=>d.index.push({kind:'index-tokenizer',status:200})),/cross-family-attempt/);
});
test('index budget has its own final reserve',async()=>{
 const {b,index}=fixture();for(let i=0;i<480;i++)await b.runIndex(async()=>index.push({kind:'index-tokenizer',status:200}));await assert.rejects(b.runIndex(async()=>{}),/reserved-capacity/);assert.equal(b.snapshot().remaining,160);b.beginFinal();assert.equal(b.snapshot().index_remaining,32);
});

test('observed integrity failure remains poisoned even after caller restores prior bytes',async()=>{
 const {b,request}=fixture();await b.run(async()=>request.push({kind:'tokenizer',status:200}));request[0].status=500;assert.throws(()=>b.snapshot(),/receipt-prefix-changed/);request[0].status=200;await assert.rejects(b.run(async()=>{}),/uncertain-operation/);
});
test('receipt arriving between operations is checkpointed before the next callback',async()=>{
 const {b,request}=fixture();request.push({kind:'tokenizer',status:200});await assert.rejects(b.run(async()=>{request[0].status=500;}),/receipt-prefix-changed/);request[0].status=200;assert.equal(b.snapshot().poisoned,true);
});
test('initial pending index receipt is rejected rather than mistaken for settled capacity',()=>{
 assert.throws(()=>createReceiptTokenizerReserve({get_receipts:()=>[],get_index_receipts:()=>[{kind:'index-tokenizer',status:'started'}]}),/unsettled-receipt/);
});
