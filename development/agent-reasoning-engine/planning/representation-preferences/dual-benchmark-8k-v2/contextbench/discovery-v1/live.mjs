// Fixed two-worker generation. No scorer invocation here. Open questions: LIVE-PROTOCOL.md.
import {mkdirSync,existsSync,appendFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {dir,read,save,verifyFreeze} from './prepare-live.mjs';
import {runPair} from './run.mjs';
import {runScheduler} from '../../scheduler.mjs';
import {assertSourceSlots} from '../../source-slots.mjs';
import {assertStorageCapacity} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
const zero={prompt_tokens:0,completion_tokens:0,total_tokens:0};
export async function executePairJob(job,{config,directory,health,active,execute=runPair,checkStorage=assertStorageCapacity,checkSlots=assertSourceSlots,record=()=>{}}){
 if(health.stopped)throw Object.assign(Error('shared health stop before pair'),{receipt:{usage:zero}});
 try{checkStorage({outRoot:directory});checkSlots({directory,activeContextIds:active,nextContext:true,maximumSourceTrees:16});}catch(error){error.receipt={...error.receipt,usage:zero};throw error;}
 active.add(job.id);let result;
 const shared={isHealthy:()=>{if(health.stopped)return false;try{checkStorage({outRoot:directory});return true;}catch(error){health.stopped=true;record({kind:'storage-health-stop',error:String(error.message),receipt:error.receipt});return false;}},report:event=>{health.stopped=true;record({kind:'provider-health-stop',event});}};
 try{
  result=await execute({config,task_id:job.task_id,directory:join(directory,'pairs',job.id,'run'),repetition:job.repetition,health:shared});
  if(result.unknown_usage||result.unknown_usage_calls||result.rate_limited||result.persistence_failure){
   health.stopped=true;throw Object.assign(Error('pair health/accounting failure'),{result,receipt:{...(!result.unknown_usage&&!result.unknown_usage_calls?{usage:result.usage}:{}),error_code:result.provider_error_code}});
  }
  return {usage:result.usage,pair_result:result};
 }catch(error){
  health.stopped=true;
  if(error.unknown_usage||error.result?.unknown_usage||error.result?.unknown_usage_calls){const {usage,...receipt}=error.receipt??{};error.receipt=receipt;}
  if(error.result)try{save(join(directory,job.id+'-failure.json'),error.result);}catch(journal){error.message+='; parent journal: '+journal.message;}
  throw error;
 }finally{active.delete(job.id);}
}
export async function generate(){
 verifyFreeze();const directory=join(dir,'live');if(existsSync(directory))throw Error('live directory exists; no automatic resumption or rerun');mkdirSync(directory);
 const config=read(join(dir,'live-config.json')),manifest=read(join(dir,'live-manifest.json')),health={stopped:false},active=new Set();
 const record=event=>appendFileSync(join(directory,'health-events.jsonl'),JSON.stringify({...event,at:new Date().toISOString()})+'\n',{mode:0o600});
 const state=await runScheduler({manifest,directory,concurrency:2,execute:job=>executePairJob(job,{config,directory,health,active,record})});
 save(join(directory,'generation-complete.json'),{accounting:state.accounting,statuses:Object.fromEntries(Object.entries(state.jobs).map(([id,j])=>[id,j.status])),health_stop:health.stopped});
 console.log(JSON.stringify({stage:'generation-terminal',accounting:state.accounting,statuses:Object.fromEntries(Object.entries(state.jobs).map(([id,j])=>[id,j.status]))}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv[2]==='run')await generate();else throw Error('run');}
