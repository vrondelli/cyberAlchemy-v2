import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadRows,project,retrievalMessages,digest,createExecutor} from '../../dual-benchmark-8k-v1/longmemeval/adapter.mjs';
import {scopeMessages} from './adapter.mjs';
export const PAIR_CAP=16000,BRANCH_CAP=64000;
const zero=()=>({prompt_tokens:0,completion_tokens:0,total_tokens:0});
const valid=u=>Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
/** Source-only fixed development cohort. Evaluation/gold fields never enter pairs. */
export function buildPairs(){return loadRows().map((row,index)=>{
 const projection=project(row),arms=index%2?['scope','baseline']:['baseline','scope'];
 return {id:`longmem-scope-${index}`,task_id:row.task_id,index,repetition:1,token_budget:PAIR_CAP,source_digest:projection.archive_digest,projection_digest:projection.projection_digest,question:row.question,question_date:row.question_date,jobs:arms.map(arm=>{
  const messages=arm==='baseline'?retrievalMessages(row,projection):scopeMessages(row,projection);
  return {id:`longmem-scope-${index}-${arm}`,arm,kind:'static',phase:'answer',depends_on:[],input_cap:6976,output_cap:1024,reservation_tokens:8000,messages,messages_sha256:digest(messages)};
 })};
});}
export function validatePair(pair){const canonical=buildPairs().find(p=>p.id===pair?.id);if(!canonical||digest(pair)!==digest(canonical))throw Error('pair differs from fixed source and policy manifest');return pair;}
export function validateSchedule(pairs){const expected=buildPairs();if(!Array.isArray(pairs)||pairs.length!==4||new Set(pairs.map(p=>p.id)).size!==4)throw Error('exact four distinct pairs required');for(const pair of pairs)validatePair(pair);if(pairs.reduce((n,p)=>n+p.token_budget,0)!==BRANCH_CAP)throw Error('branch cap mismatch');return expected;}
/** Tokenizer-only. Complete actual prompts; no speculative note reservation. */
export async function preflight(pairs,provider){validateSchedule(pairs);const calls=[];for(const pair of pairs)for(const job of pair.jobs){
 const receipt=await provider.tokenize(job.id+'-preflight',job.messages),input=receipt.usage?.prompt_tokens;
 if(!Number.isSafeInteger(input)||input<0)throw Error('unknown tokenizer usage');calls.push({pair_id:pair.id,job_id:job.id,input_tokens:input,output_reserve:1024,admitted:input<=6976&&input+1024<=8000,messages_sha256:job.messages_sha256});
 }return {admitted:calls.every(c=>c.admitted),calls,tokenizer_calls:calls.length,model_generation_calls:0,maximum_model_tokens:BRANCH_CAP,measured_prompt_plus_output_reserves:calls.reduce((n,c)=>n+c.input_tokens+c.output_reserve,0)};}
/** Root verifies freeze and owns scheduler/global gate; this function never retries. */
export async function runPair({pair,directory,provider,token_budget=PAIR_CAP,write=writeFileSync}){
 validatePair(pair);if(!provider?.tokenize||!provider?.generate)throw Error('explicit provider required');if(!Number.isSafeInteger(token_budget)||token_budget<1||token_budget>PAIR_CAP)throw Error('invalid pair cap');
 mkdirSync(directory,{recursive:true});write(join(directory,'started.json'),JSON.stringify({pair_sha256:digest(pair),started_at:new Date().toISOString()}),{flag:'wx'});
 const execute=createExecutor({directory,provider}),usage=zero(),calls=[];let held_tokens=0,health_stop=null;
 const add=u=>{if(!valid(u))throw Error('unknown usage');for(const key of Object.keys(usage))usage[key]+=u[key];};
 for(const job of pair.jobs){const call={job_id:job.id,arm:job.arm,messages:job.messages,messages_sha256:job.messages_sha256,projection_digest:pair.projection_digest,reservation_tokens:job.reservation_tokens};calls.push(call);
  if(health_stop){Object.assign(call,{status:'blocked',failure:health_stop,usage:zero()});continue;}
  if(usage.total_tokens+held_tokens+job.reservation_tokens>token_budget){Object.assign(call,{status:'blocked',failure:'pair budget admission',usage:zero()});continue;}
  try{const value=await execute(job,{attempt_id:job.id,dependencies:{}});add(value.usage);Object.assign(call,{status:'completed',usage:value.usage,answer:value.output.text,answer_sha256:digest(value.output.text),receipt:value.receipt,admission:value.admission});}
  catch(error){const u=error.model_started===false?zero():error.usage??error.receipt?.usage;try{add(u);}catch{call.unknown_usage=true;held_tokens+=job.reservation_tokens;}Object.assign(call,{status:'failed',failure:String(error.message),usage:u??null,receipt:error.receipt??null,provider_error_code:error.receipt?.error_code??null,provider_status:error.receipt?.status??null});if(call.unknown_usage||[429,503].includes(call.provider_status)||['1302','1305'].includes(String(call.provider_error_code))||error.receipt?.persistence_failure)health_stop='provider health stop: '+(call.unknown_usage?'unknown model usage':error.receipt?.persistence_failure?'receipt persistence failure':'capacity status '+call.provider_status);}
 }
 const answers=calls.map(c=>({arm:c.arm,status:c.status,text:c.answer??null,answer_sha256:c.answer_sha256??null,failure:c.failure??null}));
 const result={id:pair.id,task_id:pair.task_id,repetition:1,protocol:'scope-policy-ablation-v2',pair_sha256:digest(pair),source_digest:pair.source_digest,projection_digest:pair.projection_digest,status:calls.every(c=>c.status==='completed')?'completed':'failed',usage,held_tokens,unknown_usage:calls.some(c=>c.unknown_usage),token_budget,planned_answer_slots:2,answers,calls,provider_error_code:calls.find(c=>c.provider_error_code)?.provider_error_code??null,provider_status:calls.find(c=>[429,503].includes(c.provider_status))?.provider_status??null};
 try{write(join(directory,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}catch(error){throw Object.assign(Error('pair-result-persistence-failure'),{cause:error,result,unknown_usage:result.unknown_usage,held_tokens,...(!result.unknown_usage?{usage:{...usage},receipt:{kind:'pair',usage:{...usage},persistence_failure:true}}:{})});}return result;
}
