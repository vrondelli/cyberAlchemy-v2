import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {buildManifest,createExecutor,emptyMessages,loadRows,digest} from './adapter.mjs';
import {createProvider} from '../../benchmark-pilot-v2/execution/selectivity-v2/provider.mjs';
/** Root verifies freeze and owns concurrency. All provider requests within this pair are sequential. */
export async function runPair({row,directory,repetition=1,token_budget=51200,provider,credential}){
 const canonical=loadRows().find(r=>r.task_id===row.task_id);if(!canonical||digest(canonical.history)!==digest(row.history)||canonical.question!==row.question||canonical.question_date!==row.question_date)throw Error('source row binding mismatch');
 mkdirSync(directory,{recursive:true});const resultPath=join(directory,'result.json');if(existsSync(resultPath))throw Error('pair already recorded');
 provider??=createProvider({directory,credential});const execute=createExecutor({directory,provider});
 // Build fixed cohort first so the same stable indexing/selection contract applies.
 const manifest=buildManifest({repetitions:repetition});const jobs=manifest.jobs.filter(j=>j.task_id===row.task_id&&j.repetition===repetition);
 if(!jobs.length)throw Error('task outside fixed development cohort');
 const results={},calls=[],usage={prompt_tokens:0,completion_tokens:0,total_tokens:0};let held_tokens=0;
 const add=u=>{if(!u||!Number.isSafeInteger(u.prompt_tokens)||u.prompt_tokens<0||!Number.isSafeInteger(u.completion_tokens)||u.completion_tokens<0||u.total_tokens!==u.prompt_tokens+u.completion_tokens)throw Error('unknown usage');for(const k of Object.keys(usage))usage[k]+=u[k];};
 for(const job of jobs){
  const call={job_id:job.id,arm:job.arm,phase:job.phase??job.kind};calls.push(call);
  if(job.note_parent&&!results[job.note_parent]){Object.assign(call,{status:'blocked',failure:'failed predecessor',usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0}});continue;}
  let dispatched=false;
  try{
   const receipt=await provider.tokenize(job.id+'-reserve',emptyMessages(job)),n=receipt.usage?.prompt_tokens;
   if(!Number.isSafeInteger(n)||n<0)throw Error('unknown tokenizer usage');job.input_cap=n+(job.note_parent?384:0);job.reservation_tokens=job.input_cap+job.output_cap;call.reservation_tokens=job.reservation_tokens;
   if(usage.total_tokens+held_tokens+job.reservation_tokens>token_budget)throw Error('pair token budget admission');
   dispatched=true;const value=await execute(job,{dependencies:results,attempt_id:job.id});add(value.usage);results[job.id]=value;Object.assign(call,{status:'completed',usage:value.usage,output:value.output});
  }catch(error){let u=error.usage??error.receipt?.usage;
   if(!dispatched||error.model_started===false||String(error.message)==='8K experiment admission exceeded')u={prompt_tokens:0,completion_tokens:0,total_tokens:0};
   try{add(u);}catch{call.unknown_usage=true;held_tokens+=job.reservation_tokens;}
   Object.assign(call,{status:'failed',failure:String(error.message),usage:u??null,provider_error_code:error.receipt?.error_code??null,provider_status:error.receipt?.status??null});
  }
 }
 const answers=calls.filter(c=>c.phase==='answer').map(c=>({arm:c.arm,status:c.status,text:c.output?.text??null,failure:c.failure??null}));
 const failures=calls.filter(c=>c.status!=='completed').map(c=>({job_id:c.job_id,status:c.status,failure:c.failure}));
 const arms=Object.fromEntries(['control','treatment'].map(arm=>{const selected=calls.filter(c=>c.arm===arm);const totals={prompt_tokens:0,completion_tokens:0,total_tokens:0};for(const c of selected)if(c.usage&&!c.unknown_usage)for(const key of Object.keys(totals))totals[key]+=c.usage[key];return[arm,{usage:totals,unknown_usage:selected.some(c=>c.unknown_usage),answer:answers.find(a=>a.arm===arm),calls:selected}];}));
 const result={task_id:row.task_id,repetition,status:failures.length?'failed':'completed',failures,usage,held_tokens,unknown_usage:calls.some(c=>c.unknown_usage),planned_answer_slots:2,answers,arms,calls,token_budget,provider_error_code:calls.find(c=>c.provider_error_code)?.provider_error_code??null,provider_status:calls.find(c=>[429,503].includes(c.provider_status))?.provider_status??null};
 writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const [configPath,outputDir]=process.argv.slice(2);if(!configPath||!outputDir)throw Error('usage: node run-pair.mjs CONFIG OUTPUT_DIRECTORY');const c=JSON.parse(readFileSync(configPath));const row=loadRows().find(r=>r.task_id===c.task_id);if(!row||digest(row.history)!==c.history_sha256)throw Error('configuration source hash mismatch');const result=await runPair({row,directory:outputDir,repetition:c.repetition,token_budget:c.token_budget??51200});console.log(JSON.stringify(result));if(result.status!=='completed')process.exitCode=1;}
