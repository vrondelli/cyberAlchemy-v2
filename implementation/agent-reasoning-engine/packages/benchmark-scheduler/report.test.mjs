import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeRun} from './report.mjs';
test('fixed planned denominator and unknown cost remain visible',()=>{
 const manifest={id:'x',token_budget:30,jobs:['a','b','c'].map(id=>({id,reservation_tokens:10,expected_output:'READY'}))};
 const state={jobs:{a:{status:'completed',usage:{prompt_tokens:2,completion_tokens:1,total_tokens:3},result:{output:{text:'READY'}}},b:{status:'failed'},c:{status:'blocked'}}};
 const r=summarizeRun({manifest,state});assert.deepEqual(r.exact_output,{correct:1,planned:3});assert.equal(r.known_tokens,3);assert.equal(r.unknown_reserved_tokens,10);assert.equal(r.exact_total_tokens,null);assert.equal(r.counts.blocked,1);
});
test('overlap derives from intervals, not configured worker count',()=>{
 const manifest={id:'x',token_budget:2,jobs:['a','b'].map(id=>({id,reservation_tokens:1}))};
 const state={concurrency:4,jobs:Object.fromEntries(['a','b'].map((id,i)=>[id,{status:'completed',usage:{prompt_tokens:1,completion_tokens:0,total_tokens:1},started_at:new Date(i*100).toISOString(),finished_at:new Date(300+i*100).toISOString(),result:{}}]))};
 const r=summarizeRun({manifest,state});assert.equal(r.maximum_job_overlap,2);assert.equal(r.elapsed_ms,400);assert.equal(r.exact_total_tokens,2);
});
