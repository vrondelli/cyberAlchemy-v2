import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runScheduler,validateManifest} from './scheduler.mjs';
const usage={prompt_tokens:2,completion_tokens:1,total_tokens:3};
const jobs=['contextbench','longmemeval'].flatMap(benchmark=>Array.from({length:4},(_,i)=>({id:benchmark+'-'+i,benchmark,depends_on:[],reservation_tokens:20})));
const manifest={id:'group-fairness',token_budget:160,worker_limits:{contextbench:2,longmemeval:2},jobs};

test('waiting ContextBench jobs cannot reserve the slots needed by LongMemEval',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dual8k-group-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 let release,watchdog=false,longFinished=0,active={contextbench:0,longmemeval:0},peaks={contextbench:0,longmemeval:0};
 const slow=new Promise(r=>release=r),timer=setTimeout(()=>{watchdog=true;release();},1500);
 try{
  const state=await runScheduler({manifest,directory,concurrency:4,execute:async j=>{
   active[j.benchmark]++;peaks[j.benchmark]=Math.max(peaks[j.benchmark],active[j.benchmark]);
   if(j.benchmark==='contextbench')await slow;
   else if(++longFinished===4)release();
   active[j.benchmark]--;return {usage};
  }});
  assert.equal(watchdog,false,'all four short jobs must finish while the original two slow jobs hold their group slots');
  assert.equal(longFinished,4);assert.equal(peaks.contextbench,2);
  assert.ok(peaks.longmemeval<=2);assert.equal(state.accounting.known_tokens,24);
  assert.ok(Object.values(state.jobs).every(j=>j.status==='completed'));
  await runScheduler({manifest,directory,concurrency:4,execute:()=>assert.fail('completed model call replayed')});
 }finally{clearTimeout(timer);release();}
});

test('invalid group limits and undeclared groups fail before dispatch',()=>{
 for(const worker_limits of [{contextbench:0,longmemeval:2},{contextbench:1.5,longmemeval:2},{contextbench:2},[],null])
  assert.throws(()=>validateManifest({...manifest,worker_limits}),/worker groups/);
});
