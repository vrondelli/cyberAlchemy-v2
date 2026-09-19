// Recovery visibility pair candidate; no evaluator invocation. Open questions: ORCHESTRATE-RECOVERY.md.
// Open questions: PLAN.md. No credentials are read and no calls occur on import.
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {runPreparedTask} from './orchestrate-recovery-v2.mjs';
import {EXPANDED} from '../terminal-evidence.mjs';
import {observeModelReceiptTimings} from '../../../dual-benchmark-8k-v1/contextbench/timing.mjs';
import {liveClientFactory} from '../packet-diversity-v1/live-client-bounded-v3.mjs';
import {stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const uint=x=>Number.isSafeInteger(x)&&x>=0,need=(x,m)=>{if(!x)throw Error('discovery-run.'+m);};
const zero=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0});
export function accountReceipts(receipts=[]){
 need(Array.isArray(receipts),'receipts-array');
 const models=receipts.filter(r=>r?.kind==='model'&&r.dispatched!==false),known=models.filter(r=>r.dispatched===true&&uint(r.input_tokens)&&uint(r.output_tokens));
 const prompt_tokens=known.reduce((s,r)=>s+r.input_tokens,0),completion_tokens=known.reduce((s,r)=>s+r.output_tokens,0),unknown_usage_calls=models.length-known.length;
 need(uint(prompt_tokens)&&uint(completion_tokens)&&uint(prompt_tokens+completion_tokens),'usage-overflow');
 const limited=receipts.find(r=>r&&([429,503].includes(r.status)||r.failure_code==='rate-limited'||['1302','1305'].includes(String(r.provider_code))));
 return {prompt_tokens,completion_tokens,total_tokens:prompt_tokens+completion_tokens,model_calls:models.length,unknown_usage_calls,unknown_usage:unknown_usage_calls>0,conservative_total_tokens:prompt_tokens+completion_tokens+8000*unknown_usage_calls,rate_limited:Boolean(limited),provider_error_code:limited?(['1302','1305'].includes(String(limited.provider_code))?String(limited.provider_code):limited.status===503?'1305':'1302'):null};
}
export function validateConfig(config){
 need(config&&Array.isArray(config.tasks)&&config.tasks.length>0,'explicit-config-required');
 need(config.context_limit===8000&&config.total_tokens_per_arm===96000,'fixed-budget');
 for(const key of ['credential_path','python','scorer','upstream','source_manifest','scoring_cache'])need(typeof config[key]==='string'&&config[key].length>0,'config-'+key);
 need(new Set(config.tasks.map(t=>t.id)).size===config.tasks.length,'duplicate-task');
 for(const t of config.tasks){
  need(typeof t.id==='string'&&/^[a-zA-Z0-9_-]+$/.test(t.id)&&typeof t.instance_id==='string'&&typeof t.task_path==='string'&&typeof t.repository_cache==='string'&&/^[a-f0-9]{64}$/.test(t.task_sha256),'task-shape');
  const c=t.cell_template;need(c&&c.instance_id===t.instance_id&&c.limits&&c.provider_profile,'cell-shape');
  need(c.context_limit===8000&&c.limits.total_tokens===96000&&c.limits.output_cap===2048&&c.limits.maximum_calls===96&&c.limits.finalization_reserve_tokens===14000&&c.limits.output_deferral===true,'cell-call-budget');
 }
 return true;
}
function validate(config,task_id){
 validateConfig(config);
 const index=config.tasks.findIndex(t=>t.id===task_id);need(index>=0,'unknown-task');
 const task=config.tasks[index];need(hash(readFileSync(task.task_path))===task.task_sha256,'task-hash');return {task,index};
}
export function buildCell({config,task_id,arm,repetition=1}){
 const {task}=validate(config,task_id);need(['control','treatment'].includes(arm)&&uint(repetition)&&repetition>0,'cell-arguments');
 const cell=structuredClone(task.cell_template);cell.cell_id=task_id+'-r'+repetition+'-'+arm;cell.context_limit=8000;cell.limits={...cell.limits,total_tokens:96000,compact_representation:true,terminal_evidence_review:true,terminal_evidence_version:EXPANDED,terminal_evidence_max_handles:32,terminal_evidence_max_state_bytes:8192,terminal_evidence_max_state_tokens:2048,discovery_retention:true,recovery_visibility:arm==='treatment'?'demand':'eager'};
 cell.provider_profile={...cell.provider_profile,index_tokenizer_transport_attempts:1,request_tokenizer_transport_attempts:1};return cell;
}
// Max multiplicity preserves repeated identical attempts within a ledger, while
// avoiding double accounting of the same receipt copied into error/disk records.
function mergeReceipts(sources){
 const maximum=new Map(),values=new Map();for(const source of sources){const local=new Map();for(const r of source??[]){const k=stable(r);local.set(k,(local.get(k)??0)+1);values.set(k,r);}for(const[k,n]of local)maximum.set(k,Math.max(n,maximum.get(k)??0));}
 return [...maximum].flatMap(([k,n])=>Array.from({length:n},()=>structuredClone(values.get(k))));
}
export async function runPair(options={}){
 const state={attempts:[],output:null};
 try{return await runPairImpl(options,state);}catch(error){
  if(!state.attempts.length)throw error;
  const receipts=state.attempts.flatMap(a=>mergeReceipts([a.result?.receipts,a.client?.receipts,a.result?.index_tokenizer_receipts,a.client?.index_receipts]));
  const usage=accountReceipts(receipts),result={...(state.output??{}),status:'pair_persistence_or_accounting_error',task_id:options.task_id,repetition:options.repetition??1,planned_arms:2,generation_sealed:false,usage,unknown_usage:usage.unknown_usage,conservative_total_tokens:usage.conservative_total_tokens,provider_error_code:usage.provider_error_code,error:String(error.message)};
  throw Object.assign(Error('discovery-run.failed-with-accounting: '+error.message),{cause:error,result,receipts,...(!usage.unknown_usage?{usage}:{}),unknown_usage:usage.unknown_usage,receipt:{kind:'pair-runner',...(!usage.unknown_usage?{usage}:{}),persistence_failure:true}});
 }
}
async function runPairImpl({config,task_id,directory,repetition=1,signal,health={isHealthy:()=>true,report:()=>{}},run_task=runPreparedTask,client_factory=liveClientFactory,check_storage,persistence,evidence_root,source_root,admit_source}={},state){
 const {task,index}=validate(config,task_id);
 need(persistence&&typeof persistence.writeJson==='function'&&typeof persistence.append==='function'&&typeof evidence_root==='string'&&typeof source_root==='string'&&typeof admit_source==='function','bounded-persistence-and-sources-required');
 const save=(path,value)=>persistence.writeJson(path,value);need(typeof directory==='string'&&directory.length>0&&uint(repetition)&&repetition>0,'arguments');
 need(typeof health.isHealthy==='function'&&typeof health.report==='function'&&typeof run_task==='function'&&typeof client_factory==='function'&&typeof check_storage==='function','callbacks');
 need(!existsSync(directory),'existing-output');check_storage(directory);mkdirSync(directory,{recursive:true,mode:0o700});
 const order=(index+repetition-1)%2?['treatment','control']:['control','treatment'],arms={};let locallyHealthy=true;
 const report=async(receipts,extra={})=>{const a=accountReceipts(receipts);if(a.rate_limited||a.unknown_usage||extra.unknown_usage||extra.persistence_failure||extra.infrastructure_failure){locallyHealthy=false;await health.report({task_id,repetition,...a,...extra});}return a;};
 const healthy=()=>locallyHealthy&&!signal?.aborted&&health.isHealthy()!==false;
 for(const arm of order){
  if(!healthy()){arms[arm]={status:signal?.aborted?'not-started-aborted':'not-started-after-shared-health-stop',complete:false,metrics:zero(),usage:accountReceipts(),scoring_pending:false};continue;}
  const cell=buildCell({config,task_id,arm,repetition}),attempt={arm,result:null,client:null};state.attempts.push(attempt);
  const out=join(directory,arm),controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,1800000);
  let result,client=null,restoreTiming;
  try{
   const factory=client_factory({credential_path:config.credential_path,signal:controller.signal,persistence,before_dispatch:async()=>{need(healthy()&&!controller.signal.aborted,'shared-health-stop');check_storage(directory);}});
   const wrapped={...factory,create_client:async args=>{
    need(healthy()&&!controller.signal.aborted,'shared-health-stop');client=await factory.create_client(args);attempt.client=client;
    restoreTiming=observeModelReceiptTimings(client.receipts,{record:interval=>persistence.append(join(out,'model-timing.jsonl'),JSON.stringify({...interval,task_id,arm,repetition})+'\n')});
    const guard=fn=>async(...args)=>{
     need(healthy()&&!controller.signal.aborted,'shared-health-stop');
     try{return await fn(...args);}finally{await report([...(client.receipts??[]),...(client.index_receipts??[])],{arm});}
    };
    if(typeof client.measure_index==='function')client.measure_index=guard(client.measure_index.bind(client));
    return client;
   }};
   result=await run_task({persistence,evidence_root,source_out:join(source_root,task_id+'-r'+repetition+'-'+arm),admit_source,task_path:task.task_path,task_sha256:task.task_sha256,repository_cache:task.repository_cache,out,cell,...wrapped,before_model_dispatch:async()=>{
    await report([...(client?.receipts??[]),...(client?.index_receipts??[])],{arm});
    if(!healthy()||controller.signal.aborted)return false;
    try{check_storage(directory);}catch(e){await report([],{arm,persistence_failure:true,infrastructure_error:String(e.message)});return false;}
    return true;
   }});
  }catch(e){
   const ledgerPath=join(out,'state','glm-transport-ledger.json'),retainedPath=join(out,'result.json');let ledger=null,retained=null;
   try{if(existsSync(ledgerPath))ledger=read(ledgerPath);}catch{}
   try{if(existsSync(retainedPath))retained=read(retainedPath);}catch{}
   const attached=[e.receipt,e.original_receipt].filter(r=>r?.kind==='model');
   const receipts=mergeReceipts([e.receipts,e.result?.receipts,client?.receipts,retained?.receipts,ledger?.receipts,attached]);
   const missing=Math.max(0,(ledger?.model_calls??0)-receipts.filter(r=>r?.kind==='model'&&r.dispatched!==false).length);
   for(let i=0;i<missing;i++)receipts.push({kind:'model',dispatched:true,failure_code:'missing-completion-receipt',conservative_assumption:true});
   if((e.unknown_usage||e.result?.unknown_usage||(client&&receipts.filter(r=>r.kind==='model').length===0))&&!accountReceipts(receipts).unknown_usage)receipts.push({kind:'model',dispatched:true,failure_code:'unknown-orchestration-attempt',conservative_assumption:true});
   result={...(retained??{}),...(e.result??{}),status:'orchestration_error',error:String(e.message),receipts,native_export:null,unknown_usage:accountReceipts(receipts).unknown_usage,persistence_failure:Boolean(e.receipt?.persistence_failure||e.result?.persistence_failures?.length||e.result?.infrastructure_failure?.persistence_failure||['ENOSPC','EDQUOT','EIO','EROFS'].includes(e.code)),persistence_failures:e.result?.persistence_failures??[]};
  }finally{attempt.result=result;clearTimeout(timer);signal?.removeEventListener('abort',abort);restoreTiming?.();}
  result.receipts??=[];
  if(result.unknown_usage&&!accountReceipts(result.receipts).unknown_usage)result={...result,receipts:[...result.receipts,{kind:'model',dispatched:true,failure_code:'explicit-unknown-usage',conservative_assumption:true}]};
  attempt.result=result;
  const persistence_failure=Boolean(result.persistence_failure||result.persistence_failures?.length||result.infrastructure_failure?.persistence_failure);
  // Export runs only after episode selection validation. Its failure, or an
  // orchestration/source failure, invalidates infrastructure; ordinary model
  // run_error/selection failures retain their existing incomplete result.
  const infrastructure_failure=Boolean(result.infrastructure_failure||['orchestration_error','native_export_error'].includes(result.status));
  const usage=await report([...(result.receipts??[]),...(result.index_tokenizer_receipts??[])],{arm,persistence_failure,infrastructure_failure});
  let resultPath=join(out,'result.json');
  if(!existsSync(resultPath)||stable(read(resultPath))!==stable(result)){resultPath=join(directory,arm+'-accounted-result.json');save(resultPath,result);}
  const dispatches=result.recycling?.dispatches??[],valid=dispatches.length>0&&dispatches.length===usage.model_calls&&dispatches.every(d=>uint(d.projected_upper_bound)&&d.projected_upper_bound<=8000);
  arms[arm]={status:result.status,error:result.error??null,persistence_failure,infrastructure_failure,usage,complete:result.status==='final_context_selected'&&Boolean(result.native_export?.prediction)&&!usage.unknown_usage&&!infrastructure_failure&&!persistence_failure,scoring_pending:true,run_directory:out,result_path:resultPath,result_sha256:hash(readFileSync(resultPath)),window_admission_valid:valid,context_recycles:result.recycling?.recycles??0,maximum_admitted_request_tokens:dispatches.length?Math.max(...dispatches.map(d=>d.projected_upper_bound)):null,cell};
  save(join(directory,arm+'-summary.json'),arms[arm]);
 }
 const values=Object.values(arms),usage=Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens'].map(k=>[k,values.reduce((s,r)=>s+r.usage[k],0)])),unknown_usage_calls=values.reduce((s,r)=>s+r.usage.unknown_usage_calls,0);
 const output={status:values.every(r=>r.complete)&&!unknown_usage_calls?'completed':'incomplete',task_id,instance_id:task.instance_id,repetition,order,planned_arms:2,arms,usage,unknown_usage_calls,unknown_usage:unknown_usage_calls>0,conservative_total_tokens:values.reduce((s,r)=>s+r.usage.conservative_total_tokens,0),rate_limited:values.some(r=>r.usage.rate_limited),provider_error_code:values.find(r=>r.usage.provider_error_code)?.usage.provider_error_code??null,generation_sealed:true,persistence_failure:values.some(r=>r.persistence_failure),infrastructure_failure:values.some(r=>r.infrastructure_failure),config_sha256:hash(stable(config)),quality_scope:'native source-selection quality; not code-repair success',authority_effect:'none',open_questions_ref:'PLAN.md'};
 state.output=output;save(join(directory,'pair-result.json'),output);save(join(directory,'result.json'),output);return output;
}
