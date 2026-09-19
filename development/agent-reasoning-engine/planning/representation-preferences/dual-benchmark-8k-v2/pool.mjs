// Explicit-executor successor pool. Open questions: PLAN.md.
import {mkdirSync,appendFileSync} from 'node:fs';
import {join} from 'node:path';
import {runScheduler} from './scheduler.mjs';
import {verifySourceBindings} from '../concurrent-benchmark-v1/adapter.mjs';
import {assertStorageCapacity} from '../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
import {assertSourceSlots} from './source-slots.mjs';
const valid=u=>u&&['prompt_tokens','completion_tokens','total_tokens'].every(k=>Number.isSafeInteger(u[k])&&u[k]>=0)&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
export async function runPools({manifest,directory,executePair,storage={},recordEvent}){
 if(typeof executePair!=='function')throw Error('explicit frozen pair executor required');
 verifySourceBindings(manifest);
 const limits=manifest.worker_limits;
 if(!limits||Object.keys(limits).sort().join(',')!=='contextbench,longmemeval'||Object.values(limits).some(n=>!Number.isSafeInteger(n)||n<1))throw Error('invalid benchmark groups');
 const sum=Object.values(limits).reduce((a,b)=>a+b,0);if(sum!==manifest.global_workers)throw Error('global worker mismatch');
 if(manifest.jobs.some(j=>!Object.hasOwn(limits,j.benchmark)))throw Error('invalid benchmark job');
 for(const b of Object.keys(limits)){
  const jobs=manifest.jobs.filter(j=>j.benchmark===b),budget=manifest.benchmark_budgets?.[b];
  if(!jobs.length||!Number.isSafeInteger(budget)||budget<1||jobs.reduce((s,j)=>s+j.reservation_tokens,0)>budget)throw Error('branch reservation exceeds budget');
 }
 mkdirSync(directory,{recursive:true});assertStorageCapacity({...storage,outRoot:directory});
 const active=Object.fromEntries(Object.keys(limits).map(k=>[k,0]));
 const activeContextIds=new Set();
 const event=(event,group)=>{const row={event,group,active:{...active},at:new Date().toISOString()};if(recordEvent)recordEvent(row);else appendFileSync(join(directory,'pool-events.jsonl'),JSON.stringify(row)+'\n');};
 return runScheduler({manifest,directory,concurrency:sum,execute:async(job,ctx)=>{
  try{assertStorageCapacity({...storage,outRoot:directory});assertSourceSlots({directory,activeContextIds,nextContext:job.benchmark==='contextbench',maximumSourceTrees:storage.maximumSourceTrees??32});}
  catch(error){error.receipt={...error.receipt,usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0},external_effect_started:false};throw error;}
  active[job.benchmark]++;if(job.benchmark==='contextbench')activeContextIds.add(job.id);
  let invoked=false,result,problem;
  try{
   event('acquire',job.benchmark);invoked=true;
   result=await executePair({...job.config,benchmark:job.benchmark,directory:join(directory,'pairs',job.id,'run'),token_budget:job.reservation_tokens},ctx);
   const raw=result.provider_error_code??([429,503].includes(result.provider_status)?String(result.provider_status):result.rate_limited?'1302':undefined);
   const code=String(raw)==='503'?'1305':raw;
   if(result.unknown_usage||result.unknown_usage_calls>0||!valid(result.usage)){const e=Error('pair has unknown model usage');e.receipt={error_code:code};throw e;}
   if(code){const e=Error('pair provider failure: '+code);e.receipt={error_code:code,usage:result.usage};throw e;}
   return {usage:result.usage,pair_result:result};
  }catch(error){if(!invoked)error.receipt={...error.receipt,usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0},external_effect_started:false};problem=error;throw error;}
  finally{
   active[job.benchmark]--;activeContextIds.delete(job.id);
   try{event('release',job.benchmark);}catch(error){
    if(problem)problem.message+='; release journal failed: '+error.message;
    else{const usage=valid(result?.usage)?result.usage:!invoked?{prompt_tokens:0,completion_tokens:0,total_tokens:0}:undefined;error.receipt={...(usage?{usage}:{})};throw error;}
   }
  }
 }});
}
