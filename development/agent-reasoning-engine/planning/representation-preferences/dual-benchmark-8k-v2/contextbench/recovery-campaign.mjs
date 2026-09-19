// Two-worker generation only. Open questions: RECOVERY-CAMPAIGN.md.
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runPair,validateConfig,accountReceipts} from './discovery-v1/run-recovery-pair.mjs';
import {createTrajectoryStorage} from './trajectory-storage.mjs';
import {createReferencedSeal} from './referenced-generation-seal.mjs';
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(x,m)=>{if(!x)throw Error('recovery-campaign.'+m);};
const keys=['prompt_tokens','completion_tokens','total_tokens'];
function readBoundResult(root,path,sha){
 const full=resolve(path),part=relative(root,full);need(part&&part!=='..'&&!part.startsWith('..'+sep)&&!part.startsWith(sep),'result-path');
 let current=root;for(const bit of part.split(sep)){current=join(current,bit);need(!lstatSync(current).isSymbolicLink(),'result-symlink');}
 need(lstatSync(full).isFile(),'result-file');const bytes=readFileSync(full);need(hash(bytes)===sha,'result-drift');return JSON.parse(bytes);
}
export function campaignContract({config,root}){
 validateConfig(config);root=resolve(root);const expected=config.tasks.map(t=>t.id);
 const validate=({slot_id,result:p})=>{
  need(expected.includes(slot_id)&&p.task_id===slot_id&&p.planned_arms===2&&p.generation_sealed===true&&p.config_sha256===hash(stable(config)),'pair-identity');
  need(p.arms&&Object.keys(p.arms).sort().join(',')==='control,treatment','fixed-arms');
  for(const arm of ['control','treatment']){
   const a=p.arms[arm];need(typeof a.complete==='boolean','arm-completion');
   if(a.result_path){
    const r=readBoundResult(root,a.result_path,a.result_sha256);assert.deepEqual(accountReceipts(r.receipts),a.usage,'original arm receipt costs');
    need(a.status===r.status,'arm-status');
    if(a.complete)need(r.status==='final_context_selected'&&r.native_export?.prediction&&!a.usage.unknown_usage&&!a.infrastructure_failure&&!a.persistence_failure,'complete-evidence');
   }else{need(a.complete===false&&['not-started-aborted','not-started-after-shared-health-stop'].includes(a.status),'undispatched-arm');assert.deepEqual(a.usage,accountReceipts([]),'undispatched usage');}
  }
  const values=Object.values(p.arms);assert.deepEqual(p.usage,Object.fromEntries(keys.map(k=>[k,values.reduce((n,a)=>n+a.usage[k],0)])),'pair usage');
  need(p.unknown_usage_calls===values.reduce((n,a)=>n+a.usage.unknown_usage_calls,0)&&p.conservative_total_tokens===values.reduce((n,a)=>n+a.usage.conservative_total_tokens,0),'pair-reservations');
  need(p.status===(values.every(a=>a.complete)&&!p.unknown_usage_calls?'completed':'incomplete'),'pair-completion');return true;
 };
 const summarize=rows=>{
  assert.deepEqual(rows.map(r=>r.slot_id),expected,'fixed task denominator');
  const totals=Object.fromEntries(keys.map(k=>[k,rows.reduce((n,r)=>n+r.result.usage[k],0)]));
  return {assigned_tasks:expected.length,assigned_arms:expected.length*2,complete:rows.every(r=>r.result.status==='completed'),usage:totals,unknown_usage_calls:rows.reduce((n,r)=>n+r.result.unknown_usage_calls,0),conservative_total_tokens:rows.reduce((n,r)=>n+r.result.conservative_total_tokens,0),native_scoring_pending:true,benchmark_cleared:false};
 };
 return {validate,summarize};
}
function failureEvidence(error,returned,config){
 const attached=error.receipts??error.result?.receipts,receipts=Array.isArray(attached)?attached:[];
 let counted,reconciliation_error=null;try{counted=accountReceipts(receipts);}catch(e){counted=accountReceipts([]);reconciliation_error=String(e.message);}
 const valid=u=>u&&keys.every(k=>Number.isSafeInteger(u[k])&&u[k]>=0)&&u.prompt_tokens+u.completion_tokens===u.total_tokens;
 const hidden=receipts.some(r=>r?.kind==='model'&&r.dispatched===false&&['input_tokens','output_tokens','reasoning_tokens','cached_tokens'].some(k=>Number.isSafeInteger(r[k])&&r[k]>0));
 let hidden_witness=null;if(hidden)try{hidden_witness=accountReceipts(receipts.map(r=>r?.kind==='model'&&r.dispatched===false&&['input_tokens','output_tokens','reasoning_tokens','cached_tokens'].some(k=>Number.isSafeInteger(r[k])&&r[k]>0)?{...r,dispatched:true}:r));}catch(e){reconciliation_error??=String(e.message);}
 const reports=[error.usage,error.result?.usage,returned?.usage,hidden_witness].filter(valid);
 const contradictory=reports.some(u=>keys.some(k=>u[k]!==counted[k]));
 const uncertain=hidden||Boolean(reconciliation_error)||!Array.isArray(attached)||contradictory||error.unknown_usage===true||error.result?.unknown_usage===true||returned?.unknown_usage===true||Boolean(error.result?.unknown_usage_calls)||Boolean(returned?.unknown_usage_calls);
 // Preserve the largest coherent known-usage witness, with its original reports.
 const known=[counted,...reports].reduce((a,b)=>b.total_tokens>a.total_tokens?b:a);
 const usage=uncertain?{...counted,...Object.fromEntries(keys.map(k=>[k,known[k]])),unknown_usage:true,unknown_usage_calls:null,model_calls:null,conservative_total_tokens:Math.max(2*config.total_tokens_per_arm,counted.conservative_total_tokens,known.total_tokens)}:counted;
 return {receipts,reported_usage:reports,reconciliation_error,unreconciled_pair:uncertain,usage};
}
export async function runRecoveryCampaign({config,evidence_root,source_root,binding,signal,execute=runPair,host_guard}={}){
 validateConfig(config);need(config.tasks.length<=4,'bounded-four-task-cohort');
 need(readdirSync(evidence_root).length===0&&readdirSync(source_root).length===0,'fresh-stage-no-resume');
 const storage=createTrajectoryStorage({evidence_root,source_root,binding,tasks:config.tasks,...(host_guard?{host_guard}:{})}),root=storage.evidence_root,persist=storage.persistence;
 const outcomes=Array(config.tasks.length).fill(null);let next=0;const health={stopped:false};
 const stop=()=>{health.stopped=true;};signal?.addEventListener('abort',stop,{once:true});if(signal?.aborted)stop();
 const shared={isHealthy:()=>!health.stopped,report:async()=>{health.stopped=true;}};
 persist.writeJson(join(root,'PLAN.json'),{schema:'are.recovery-campaign-plan/v1',config_sha256:hash(stable(config)),task_ids:config.tasks.map(t=>t.id),workers:2,assigned_arms:config.tasks.length*2,authority_effect:'none'});
 async function worker(){
  while(next<config.tasks.length){
   const index=next++,task_id=config.tasks[index].id;
   if(health.stopped){outcomes[index]={task_id,status:'not-started',usage:accountReceipts([])};continue;}
   let returned;
   try{
    const directory=join(root,'pairs',task_id);
    const result=await execute({config,task_id,directory,repetition:1,signal,health:shared,persistence:persist,evidence_root:root,source_root:storage.source_root,admit_source:storage.admit_source,check_storage:()=>{try{return storage.check();}catch(e){health.stopped=true;throw e;}}});
    returned=result;
    // The default pair runner persists this exact result before returning.
    const path=join(directory,'result.json'),bytes=readFileSync(path);assert.deepEqual(JSON.parse(bytes),result,'persisted pair result');
    outcomes[index]={task_id,status:'settled',reference:{slot_id:task_id,path:relative(root,path),sha256:hash(bytes)},usage:{...result.usage,unknown_usage_calls:result.unknown_usage_calls,conservative_total_tokens:result.conservative_total_tokens}};
    if(result.unknown_usage||result.rate_limited||result.persistence_failure||result.infrastructure_failure)stop();
   }catch(error){
    stop();outcomes[index]={task_id,status:'failed',error:String(error.message),...failureEvidence(error,returned,config)};
   }
  }
 }
 const workers=await Promise.allSettled([worker(),worker()]);signal?.removeEventListener('abort',stop);
 need(workers.every(w=>w.status==='fulfilled')&&outcomes.every(Boolean),'workers-settlement');
 const usage=Object.fromEntries(keys.map(k=>[k,outcomes.reduce((n,r)=>n+r.usage[k],0)]));
 const terminal={schema:'are.recovery-campaign-terminal/v1',workers_settled:true,assigned_tasks:config.tasks.length,assigned_arms:config.tasks.length*2,outcomes,usage,unknown_usage_calls:outcomes.every(r=>Number.isSafeInteger(r.usage.unknown_usage_calls))?outcomes.reduce((n,r)=>n+r.usage.unknown_usage_calls,0):null,unreconciled_pairs:outcomes.filter(r=>r.unreconciled_pair).length,conservative_total_tokens:outcomes.reduce((n,r)=>n+r.usage.conservative_total_tokens,0),benchmark_cleared:false,authority_effect:'none'};
 try{
  if(outcomes.every(r=>r.status==='settled')){
   const seal=createReferencedSeal({root,slots:outcomes.map(r=>r.reference),...campaignContract({config,root})});
   persist.writeJson(join(root,'GENERATION-SEAL.json'),seal,{final:true});return {...terminal,status:'sealed',seal};
  }
  persist.writeJson(join(root,'RESULTS.json'),{...terminal,status:'incomplete'},{final:true});return {...terminal,status:'incomplete'};
 }catch(error){throw Object.assign(Error('recovery-campaign.final-persistence: '+error.message),{cause:error,result:{...terminal,status:'finalization-failed'}});}
}
