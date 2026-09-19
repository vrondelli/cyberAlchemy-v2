import test from 'node:test';import assert from 'node:assert/strict';
import {createTokenizerReserve} from './bounded-archive-frontier-tokenizer-r1.mjs';
test('exploration cannot consume the 32-operation final reserve even with cache hits',async()=>{
 const receipts=[],b=createTokenizerReserve({get_receipts:()=>receipts});let calls=0;
 for(let i=0;i<160;i++)await b.run(async()=>{calls++;});
 assert.equal(b.canExplore(),false);await assert.rejects(b.run(async()=>{calls++;}),/reserved-capacity/);assert.equal(calls,160);
 b.beginFinal();for(let i=0;i<32;i++)await b.run(async()=>{calls++;});assert.equal(calls,192);await assert.rejects(b.run(async()=>{}),/reserved-capacity/);
});
test('existing actual tokenizer receipts consume capacity and model receipts do not',async()=>{
 const receipts=[...Array.from({length:150},()=>({kind:'tokenizer'})),...Array.from({length:40},()=>({kind:'model'}))],b=createTokenizerReserve({get_receipts:()=>receipts});
 assert.equal(b.snapshot().remaining,10);assert.equal(b.canExplore(24),false);
 await b.run(async()=>receipts.push({kind:'tokenizer'}));assert.equal(b.snapshot().used,151);b.beginFinal();assert.equal(b.snapshot().remaining,41);
});
test('failed measurement remains charged and unexpected multi-call operations fail',async()=>{
 const receipts=[],b=createTokenizerReserve({get_receipts:()=>receipts});await assert.rejects(b.run(async()=>{throw Error('timeout');}),/timeout/);assert.equal(b.snapshot().used,1);
 await assert.rejects(b.run(async()=>{receipts.push({kind:'tokenizer'},{kind:'tokenizer'});}),/operation-multiple-tokenizer-calls/);
});
