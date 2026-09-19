import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,appendFileSync,readFileSync,existsSync,statfsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {runScheduler} from '../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/scheduler.mjs';
import {verifySourceBindings} from '../concurrent-benchmark-v1/adapter.mjs';
const validUsage=u=>u&&['prompt_tokens','completion_tokens','total_tokens'].every(k=>Number.isSafeInteger(u[k])&&u[k]>=0)&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
export function createGroupGate(limits,onEvent=()=>{}){
 const active=Object.fromEntries(Object.keys(limits).map(k=>[k,0])),waiting=[];
 for(const n of Object.values(limits))if(!Number.isSafeInteger(n)||n<1)throw Error('invalid group limit');
 function drain(){for(let i=0;i<waiting.length;){const w=waiting[i];if(active[w.group]>=limits[w.group]){i++;continue;}waiting.splice(i,1);active[w.group]++;onEvent({event:'acquire',group:w.group,active:{...active},at:new Date().toISOString()});w.resolve(()=>{active[w.group]--;onEvent({event:'release',group:w.group,active:{...active},at:new Date().toISOString()});drain();});}}
 return async(group,operation)=>{if(!Object.hasOwn(limits,group))throw Error('unknown benchmark group');const release=await new Promise(resolve=>{waiting.push({group,resolve});drain();});try{return await operation();}finally{release();}};
}
export async function runPools({manifest,directory,executePair,minimum_free_bytes=2*1024**3}){
 verifySourceBindings(manifest);mkdirSync(directory,{recursive:true});
 const disk=statfsSync(directory);if(disk.bavail*disk.bsize<minimum_free_bytes)throw Error('insufficient evidence disk');
 const limits=manifest.worker_limits;if(!limits||Object.keys(limits).sort().join(',')!=='contextbench,longmemeval')throw Error('both benchmark limits required');
 const sum=Object.values(limits).reduce((a,b)=>a+b,0);if(sum!==manifest.global_workers)throw Error('global worker mismatch');
 for(const benchmark of Object.keys(limits)){
  const selected=manifest.jobs.filter(j=>j.benchmark===benchmark);
  if(!selected.length||selected.reduce((n,j)=>n+j.reservation_tokens,0)>manifest.benchmark_budgets[benchmark])throw Error('branch reservation exceeds budget');
 }
 if(manifest.jobs.some(j=>!Object.hasOwn(limits,j.benchmark)))throw Error('invalid benchmark job');
 const gate=createGroupGate(limits,event=>appendFileSync(join(directory,'pool-events.jsonl'),JSON.stringify(event)+'\n'));
 return runScheduler({directory,manifest,concurrency:sum,execute:(job,ctx)=>gate(job.benchmark,async()=>{
  const pairDir=join(directory,'pairs',job.id);mkdirSync(pairDir,{recursive:true});
  const config={...job.config,benchmark:job.benchmark,directory:join(pairDir,'run'),token_budget:job.reservation_tokens};
  const result=executePair?await executePair(config,ctx):await childPair(config,pairDir);
  const rawCapacity=result.provider_error_code??([429,503].includes(result.provider_status)?String(result.provider_status):result.rate_limited?'1302':undefined);
  const capacity=String(rawCapacity)==='503'?'1305':rawCapacity;
  if(result.unknown_usage||result.unknown_usage_calls>0||!validUsage(result.usage)){const e=Error('pair has unknown model usage');e.receipt={error_code:capacity};throw e;}
  if(capacity){const e=Error('pair provider failure: '+capacity);e.receipt={usage:result.usage,error_code:capacity==='503'?'1305':capacity};throw e;}
  return {usage:result.usage,output:{benchmark:job.benchmark,result_path:join(pairDir,'run','result.json'),status:result.status},pair_result:result};
 })});
}
async function childPair(config,directory){
 const file=join(directory,'config.json');writeFileSync(file,JSON.stringify(config,null,2)+'\n',{flag:'wx'});
 return new Promise((resolvePromise,reject)=>{
  const child=spawn(process.execPath,[resolve(import.meta.dirname,'worker.mjs'),file],{stdio:['ignore','pipe','pipe']});
  let bytes=0;const log=chunk=>{bytes+=chunk.length;if(bytes<=1024*1024)appendFileSync(join(directory,'worker.log'),chunk);};child.stdout.on('data',log);child.stderr.on('data',log);
  child.on('error',reject);child.on('close',(code,signal)=>{const path=join(config.directory,'result.json');if(existsSync(path)){try{const result=JSON.parse(readFileSync(path));result.worker_exit={code,signal};resolvePromise(result);}catch(e){reject(e);}}else reject(Error('worker terminated without model usage receipt: '+code+'/'+signal));});
 });
}
