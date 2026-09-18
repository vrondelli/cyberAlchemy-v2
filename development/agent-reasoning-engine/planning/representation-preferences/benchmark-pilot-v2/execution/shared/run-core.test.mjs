import test from 'node:test';
import assert from 'node:assert/strict';
import {executeSchedule} from './run-core.mjs';
const row={id:'one',task_id:'task',input_digest:'hash',messages:[],arm:'control',repetition:1};
test('actual usage controls budget and stops subsequent dispatch',async()=>{
 let calls=0;const records=[];
 await assert.rejects(executeSchedule({schedule:[row,{...row,id:'two'}],counts:{hash:10},generate:async()=>{calls++;return {usage:{prompt_tokens:7169,completion_tokens:1,total_tokens:7170},output:'answer'};},save:async x=>records.push(x),score:()=>({pass:true})}),/actual usage/);
 assert.equal(calls,1);assert.equal(records.at(-1).total_tokens,7170);assert.equal(records.at(-1).results[0].score,null);
});
test('uncertain provider error is terminal with no automatic retry',async()=>{
 let calls=0;const records=[];
 await assert.rejects(executeSchedule({schedule:[row,row],counts:{hash:10},generate:async()=>{calls++;throw Error('timeout');},save:async x=>records.push(x),score:()=>({})}),/timeout/);
 assert.equal(calls,1);assert.equal(records.at(-1).usage_complete,false);
});
test('completed run counts every returned input and output token',async()=>{
 const result=await executeSchedule({schedule:[row],counts:{hash:10},generate:async()=>({usage:{prompt_tokens:12,completion_tokens:3,total_tokens:15},output:'answer'}),save:async()=>{},score:()=>({pass:true})});
 assert.equal(result.total_tokens,15);assert.equal(result.results[0].input_count_difference,2);assert.equal(result.status,'completed');
});

test('failed generation with known usage still consumes tokens',async()=>{
 const records=[];await assert.rejects(executeSchedule({schedule:[row],counts:{hash:10},generate:async()=>{throw Object.assign(Error('incomplete-output'),{receipt:{usage:{prompt_tokens:10,completion_tokens:1024,total_tokens:1034}}});},save:async x=>records.push(x),score:()=>({})}),/incomplete/);
 assert.equal(records.at(-1).total_tokens,1034);assert.equal(records.at(-1).usage_complete,true);
});
