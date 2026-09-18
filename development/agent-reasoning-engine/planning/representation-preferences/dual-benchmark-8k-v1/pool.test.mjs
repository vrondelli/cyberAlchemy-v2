import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runPools,createGroupGate} from './pool.mjs';
test('two per benchmark gives four concurrent workers and separate group ceilings',async()=>{
 const active={contextbench:0,longmemeval:0},peaks={contextbench:0,longmemeval:0};let all=0,peak=0,ready=0,release;const barrier=new Promise(r=>release=r);
 const gate=createGroupGate({contextbench:2,longmemeval:2});
 await Promise.all(['contextbench','longmemeval','contextbench','longmemeval','contextbench','longmemeval'].map(group=>gate(group,async()=>{active[group]++;all++;peak=Math.max(peak,all);peaks[group]=Math.max(peaks[group],active[group]);if(++ready===4)release();await barrier;active[group]--;all--;})));
 assert.equal(peak,4);assert.deepEqual(peaks,{contextbench:2,longmemeval:2});
});
test('both benchmark budgets enforced and resume repeats no pair',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'dualpool-test-'));
 try{const manifest={id:'two',global_workers:4,worker_limits:{contextbench:2,longmemeval:2},benchmark_budgets:{contextbench:20,longmemeval:20},token_budget:40,jobs:['contextbench','longmemeval'].map(benchmark=>({id:benchmark,benchmark,depends_on:[],reservation_tokens:20,config:{}}))};
 let calls=0;const options={manifest,directory,minimum_free_bytes:0,executePair:async()=>{calls++;return {status:'completed',usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5},unknown_usage:false};}};
 const state=await runPools(options);assert.equal(state.accounting.known_tokens,10);await runPools(options);assert.equal(calls,2);
 await assert.rejects(runPools({...options,manifest:{...manifest,benchmark_budgets:{contextbench:19,longmemeval:20}}}),/branch reservation/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
