import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PHASES,createQueryArchivePhases} from './query-archive-phase-r1.mjs';
test('95 exploration calls and exactly one final call, with separate token ceilings',()=>{
 assert.deepEqual(PHASES,[{id:'discover',tokens:88000,calls:95},{id:'join',tokens:8000,calls:1}]);
 const receipts=[],states=[],p=createQueryArchivePhases({get_receipts:()=>receipts,persist:s=>states.push(s)});
 const request={input_upper_bound:100,output_cap:20,request_sha256:'a'.repeat(64)};
 const dispatch=()=>{assert.equal(p.reserve(request).admissible,true);receipts.push({kind:'model',dispatched:true,status:200,automatic_retries:0,request_sha256:request.request_sha256,input_tokens:100,output_tokens:20});p.settle();};
 for(let i=0;i<95;i++)dispatch();
 assert.equal(p.reserve(request).admissible,false);p.finishPhase();dispatch();
 assert.equal(p.reserve(request).admissible,false);p.finishPhase();assert.equal(p.snapshot().closed,true);
 assert.equal(p.snapshot().model_calls,96);assert.equal(p.snapshot().known_tokens,11520);
});
test('unused exploration budget does not transfer to finalization',()=>{
 const receipts=[],p=createQueryArchivePhases({get_receipts:()=>receipts,persist:()=>{}});p.finishPhase();
 assert.equal(p.reserve({input_upper_bound:7990,output_cap:20,request_sha256:'a'.repeat(64)}).admissible,false);
});
