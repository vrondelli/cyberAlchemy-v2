import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSchedule,admitSchedule} from './schedule.mjs';
const tasks=()=>Array.from({length:4},(_,i)=>({task_id:'task-'+i,split:'development',messages:[{role:'system',content:'transport'},{role:'user',content:'question '+i}],treatment_projection:{items:i===0?[{instruction:'Use a DAG'}]:[]},exposure:{state_digest:'state-'+i}}));
test('fixed paired schedule excludes reserved tasks and isolates selected state',()=>{
 const input=tasks(),schedule=buildSchedule(input);
 assert.equal(schedule.length,16);
 assert.deepEqual(schedule.slice(0,2).map(x=>x.arm),['control','treatment']);
 assert.deepEqual(schedule.slice(8,10).map(x=>x.arm),['treatment','control']);
 assert.equal(input[0].messages.length,2);
 assert.equal(schedule[0].messages.length,2);assert.equal(schedule[1].messages.length,3);
 assert.equal(schedule[2].input_digest,schedule[3].input_digest);
 input[0].split='reserved';assert.throws(()=>buildSchedule(input),/reserved/);
});
test('admission fails closed on unknown usage, overlength and cumulative excess',()=>{
 const schedule=buildSchedule(tasks());const counts=Object.fromEntries(schedule.map(x=>[x.input_digest,7168]));
 assert.equal(admitSchedule(schedule,counts).maximum_generation_tokens,131072);
 assert.throws(()=>admitSchedule(schedule,{}),/unknown/);
 assert.throws(()=>admitSchedule(schedule,{...counts,[schedule[0].input_digest]:7169}),/overlength/);
 assert.throws(()=>admitSchedule(schedule,counts,{budget:131071}),/budget/);
 assert.throws(()=>admitSchedule([...schedule.slice(1),schedule[1]],counts),/invalid/);
});
