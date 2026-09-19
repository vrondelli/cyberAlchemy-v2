import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runPools} from './pool.mjs';
test('pool integrates group admission and preserves independently budgeted usage across resume',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dual8k-v2-pool-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const jobs=['contextbench','longmemeval'].flatMap(benchmark=>Array.from({length:4},(_,i)=>({id:benchmark+'-'+i,benchmark,depends_on:[],reservation_tokens:20,config:{id:benchmark+'-'+i}})));
 const manifest={id:'integrated-v2',global_workers:4,worker_limits:{contextbench:2,longmemeval:2},benchmark_budgets:{contextbench:80,longmemeval:80},token_budget:160,jobs};
 let release,expired=false,short=0,calls=0;const slow=new Promise(r=>release=r),timer=setTimeout(()=>{expired=true;release();},1500);
 const storage={hostRoot:null,minimumFreeBytes:0,minimumHostFreeBytes:0};
 try{
  const state=await runPools({manifest,directory,storage,executePair:async c=>{
   calls++;if(c.benchmark==='contextbench')await slow;else if(++short===4)release();
   return {usage:{prompt_tokens:2,completion_tokens:1,total_tokens:3},unknown_usage:false};
  }});
  assert.equal(expired,false);assert.equal(calls,8);assert.equal(state.accounting.known_tokens,24);
  await runPools({manifest,directory,storage,executePair:()=>assert.fail('repeated')});
  await assert.rejects(runPools({manifest:{...manifest,benchmark_budgets:{contextbench:79,longmemeval:80}},directory,storage,executePair:()=>{}}),/branch reservation/);
 }finally{clearTimeout(timer);release();}
});

test('disk admission failure before invoking an executor is recorded as known zero spend',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dual8k-v2-storage-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const jobs=['contextbench','longmemeval'].map(benchmark=>({id:benchmark,benchmark,depends_on:[],reservation_tokens:10,config:{}}));
 const manifest={id:'disk-failure',global_workers:2,worker_limits:{contextbench:1,longmemeval:1},benchmark_budgets:{contextbench:10,longmemeval:10},token_budget:20,jobs};
 let checks=0,calls=0;
 const storage={hostRoot:null,get minimumFreeBytes(){return ++checks===1?0:Number.MAX_SAFE_INTEGER;}};
 const state=await runPools({manifest,directory,storage,executePair:()=>{calls++;assert.fail('disk gate must precede model dispatch');}});
 assert.equal(calls,0);assert.equal(state.accounting.known_tokens,0);assert.equal(state.accounting.unknown_reserved_tokens,0);
 assert.ok(Object.values(state.jobs).every(j=>j.status==='failed'&&j.usage.total_tokens===0));
});

for(const failedEvent of ['acquire','release'])test(`journal ${failedEvent} failure preserves known usage`,async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dual8k-v2-journal-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const jobs=['contextbench','longmemeval'].map(benchmark=>({id:benchmark,benchmark,depends_on:[],reservation_tokens:10,config:{}}));
 const manifest={id:'journal-'+failedEvent,global_workers:2,worker_limits:{contextbench:1,longmemeval:1},benchmark_budgets:{contextbench:10,longmemeval:10},token_budget:20,jobs};
 let calls=0;const releases=[];
 const state=await runPools({manifest,directory,storage:{hostRoot:null,minimumFreeBytes:0,minimumHostFreeBytes:0},
  recordEvent:row=>{if(row.event==='release')releases.push(row);if(row.event===failedEvent)throw Error('injected journal failure');},
  executePair:async()=>{calls++;return {usage:{prompt_tokens:2,completion_tokens:1,total_tokens:3}};}});
 assert.equal(calls,failedEvent==='acquire'?0:2);
 assert.equal(state.accounting.known_tokens,failedEvent==='acquire'?0:6);
 assert.equal(state.accounting.unknown_reserved_tokens,0);
 assert.ok(Object.values(state.jobs).every(j=>j.status==='failed'));
 assert.equal(releases.length,2);assert.deepEqual(releases.at(-1).active,{contextbench:0,longmemeval:0});
});
