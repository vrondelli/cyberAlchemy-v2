// Native one-call archived terminal component; no provider construction on import.
// Open questions/live authorization: PLAN.md. Scoring is deliberately absent.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync,appendFileSync} from 'node:fs';
import {join} from 'node:path';
import {openContextRecycling} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {capturePublicResponse} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import {stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {retainedReasoning} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {observeModelReceiptTimings} from '../../../dual-benchmark-8k-v1/contextbench/timing.mjs';
import {accountReceipts} from '../discovery-v1/run.mjs';
import {diagnoseTerminalEvidence,exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {hash} from './prepare.mjs';
const clone=x=>JSON.parse(stable(x));
const need=(x,m)=>assert.ok(x,'packet-run.'+m);
const save=(path,value)=>writeFileSync(path,stable(value)+'\n',{flag:'wx',mode:0o600});
export function derivePrefixLedger({donor,binding,identity}){
 need(identity===donor.ledger_identity,'transport-identity-drift');need(hash(donor.receipts)===donor.prefix_receipts_sha256,'prefix-receipt-drift');
 const usage=accountReceipts(donor.receipts);need(!usage.unknown_usage&&!usage.rate_limited,'prefix-known-usage');
 need(donor.receipts.every(r=>['model','tokenizer'].includes(r.kind)),'prefix-kind');
 need(donor.cell.provider_profile.request_tokenizer_transport_attempts===1,'prefix-retry-policy');
 const body={version:1,binding,identity,phase:'idle',model_calls:donor.receipts.filter(r=>r.kind==='model').length,tokenizer_calls:donor.receipts.filter(r=>r.kind==='tokenizer').length,receipts:clone(donor.receipts)};
 return {...body,ledger_digest:hash(body)};
}
/** Fresh recycler scope; original receipt evidence imported through native ledger API.
 * Prefix counters are historical. Only suffix receipts represent new expenditure. */
export async function runNativeRequest({donor,prompt,directory,repoRoot,create_client,storage_guard,before_model_dispatch=async()=>true,model_dispatch_enabled=false,signal,variant='legacy',open_recycler=openContextRecycling}){
 need(['legacy','diversity'].includes(variant)&&typeof model_dispatch_enabled==='boolean','policy');
 need(typeof create_client==='function'&&typeof storage_guard==='function'&&typeof before_model_dispatch==='function'&&typeof open_recycler==='function','explicit-callbacks');
 need(!existsSync(directory),'existing-output');need(typeof prompt==='string'&&JSON.parse(prompt).messages,'prompt');
 retainedReasoning(JSON.parse(prompt).messages,donor.receipts);
 storage_guard(directory);mkdirSync(directory,{recursive:true,mode:0o700});
 let client,recycler,restoreTiming,result,error=null,admission=null,generated=null,entered=false,lifecycle_failure=false;const lifecycle_errors=[];
 const receiptsBefore=donor.receipts.length,scope={request:donor.task.problem_statement,donor_id:donor.donor_id,variant,prompt_sha256:hash(prompt),prefix_receipts_sha256:donor.prefix_receipts_sha256};
 try{
  client=await create_client({cell:donor.cell,task:donor.task});
  need(client.identity===donor.ledger_identity&&client.maximum_model_retries===0&&client.maximum_requests===96&&client.token_margin===donor.cell.provider_profile.token_margin,'native-profile-drift');
  need(client.receipts.length===0&&typeof client.bindRunLedger==='function','fresh-native-client');
  const stateRoot=join(directory,'state');
  recycler=open_recycler({transport:client.transport,fixture_root:repoRoot,scope,options:{directory:stateRoot,context_limit:8000,recycle_at:donor.cell.recycle_at,safety_margin:donor.cell.safety_margin,state:{objective:scope.request,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[donor.task.base_commit]}}});
  const ledger=derivePrefixLedger({donor,binding:hash(scope),identity:client.identity});
  save(join(stateRoot,'glm-transport-ledger.json'),ledger);
  save(join(directory,'prefix-derivation.json'),{schema_version:'are.packet-derived-prefix/v1',original_ledger_digest:donor.ledger_source_digest,donor_bindings:donor.bindings,prefix_receipts_sha256:donor.prefix_receipts_sha256,derived_ledger_digest:ledger.ledger_digest,historical_receipts:receiptsBefore,posture:'Counterfactual continuation import, not new provider attempts or the original recycler checkpoint.'});
  client.bindRunLedger({directory:stateRoot,binding:hash(scope),require_existing:true});
  need(stable(client.receipts)===stable(donor.receipts),'native-prefix-import');
  restoreTiming=observeModelReceiptTimings(client.receipts,{record:interval=>appendFileSync(join(directory,'model-timing.jsonl'),JSON.stringify(interval)+'\n',{mode:0o600})});
  save(join(directory,'prompt.json'),{prompt,prompt_sha256:hash(prompt)});
  generated=await recycler.generate({history:[],run_id:donor.donor_id+'-'+variant,render:()=>prompt,admit_dispatch:async dispatch=>{
   need(admission===null,'one-new-admission');admission={...dispatch};
   need(dispatch.projected_upper_bound<=8000&&dispatch.output_reservation===2048,'exact-window');
   need(!client.receipts.slice(receiptsBefore).some(r=>r.kind==='model'),'one-new-model-call');
   save(join(directory,'admission.json'),admission);
   if(!model_dispatch_enabled||signal?.aborted)return false;
   storage_guard(directory);if(await before_model_dispatch({dispatch,donor_id:donor.donor_id,variant,receipts:client.receipts.slice(receiptsBefore)})===false)return false;
   entered=true;return true;
  }});
  try{recycler.completeStep([],true);}catch(e){lifecycle_failure=true;lifecycle_errors.push({phase:'complete-step',error:String(e.message)});throw e;}
 }catch(e){error=e;}
 finally{for(const [phase,cleanup]of [['restore-timing',()=>restoreTiming?.()],['recycler-close',()=>recycler?.close()]]){try{cleanup();}catch(e){lifecycle_failure=true;lifecycle_errors.push({phase,error:String(e.message)});error??=e;}}}
 const receipts=clone(client?.receipts??[]),suffix=receipts.slice(Math.min(receiptsBefore,receipts.length));
 let usage=accountReceipts(suffix);
 const unreceipted=entered&&!suffix.some(r=>r.kind==='model'&&r.dispatched!==false);
 if(unreceipted)usage={...usage,unknown_usage:true,unknown_usage_calls:usage.unknown_usage_calls+1,conservative_total_tokens:usage.conservative_total_tokens+8000};
 need(usage.model_calls<=1,'suffix-call-ceiling');
 const persistence_failure=Boolean(error&&(error.receipt?.persistence_failure||['ENOSPC','EIO','EDQUOT','EROFS'].includes(error.code)));
 result={schema_version:'are.packet-native-request/v1',donor_id:donor.donor_id,variant,status:lifecycle_failure?'failed':generated?'generated':!model_dispatch_enabled&&admission&&!entered?'preflight':'failed',error:error?String(error.message):null,persistence_failure,lifecycle_failure,lifecycle_errors,admission,usage,unknown_usage:usage.unknown_usage,provider_error_code:usage.provider_error_code,receipts,suffix_receipt_start:receiptsBefore,prefix_usage:donor.prefix_usage,prompt_sha256:hash(prompt),generated,entered};
 try{save(join(directory,'request-result.json'),{...result,generated:undefined,...(generated?{response_capture:capturePublicResponse(generated,receipts.length-1)}:{})});}catch(e){throw Object.assign(e,{result,receipts,unknown_usage:usage.unknown_usage,receipt:{kind:'packet-persistence',persistence_failure:true,...(!usage.unknown_usage?{usage}:{})}});}
 return result;
}
export async function runSlot({donor,prepared,variant,directory,repoRoot,...options}){
 need(prepared.admitted&&prepared.donor_id===donor.donor_id&&prepared.prefix_receipts_sha256===donor.prefix_receipts_sha256,'prepared-binding');
 const packet=prepared.pair[variant],prompt=prepared.prompts[variant];need(packet&&typeof prompt==='string','prepared-variant');
 need(diagnoseTerminalEvidence(stable({summary:'',context_handles:[]}),packet).ok,'packet-integrity');
 const actual=JSON.parse(prompt),original=JSON.parse(donor.original_prompt),index=donor.packet_message_index;
 need(stable(actual.tools)===stable([packet.model.tool]),'packet-tool-schema');
 need(actual.messages[index]?.role==='user'&&actual.messages[index].content===packet.model.text,'packet-message');
 actual.messages[index]=original.messages[index];actual.tools=original.tools;need(stable(actual)===stable(original),'nonpacket-wire-drift');
 need(stable(prepared.pair.legacy.model.tool)===stable(prepared.pair.diversity.model.tool),'paired-schema-drift');
 const result=await runNativeRequest({donor,prompt,variant,directory,repoRoot,...options});
 result.packet=packet;result.captures=[...clone(donor.captures),{prompt,prompt_sha256:hash(prompt)}];
 if(result.generated&&!result.error&&!result.lifecycle_failure&&!result.persistence_failure){
  try{
   result.response_capture=capturePublicResponse(result.generated,result.receipts.length-1);
   result.native_export=exportTerminalEvidenceSelection({packet,captures:result.captures,receipts:result.receipts,response_capture:result.response_capture,source_snapshots:donor.snapshots,task:donor.task},repoRoot);
   result.status=result.native_export.selection.final_read_ids.length?'completed':'no_context_selected';
  }catch(e){result.status='invalid_terminal_selection';result.error=String(e.message);}
 }
 // Do not persist hidden reasoning output in the public response artifact.
 delete result.generated;
 try{save(join(directory,'result.json'),result);}catch(e){throw Object.assign(e,{result,receipts:result.receipts,unknown_usage:result.unknown_usage,receipt:{kind:'packet-persistence',persistence_failure:true,...(!result.unknown_usage?{usage:result.usage}:{})}});}
 return result;
}
/** Exactly eight fixed donor pairs; two workers, sequential variants per pair. */
export async function runPairs({jobs,execute_slot,health={isHealthy:()=>true,report:()=>{}},model_dispatch_enabled=false}){
 need(Array.isArray(jobs)&&jobs.length===8&&new Set(jobs.map(j=>j.donor.donor_id)).size===8,'eight-distinct-donors');
 need(jobs.every((j,i)=>j.donor.donor_index===i)&&new Set(jobs.map(j=>j.donor.task.instance_id)).size===4,'fixed-donor-order');
 need(typeof execute_slot==='function'&&typeof health.isHealthy==='function'&&typeof health.report==='function','callbacks');
 const slots=Array(16),health_errors=[];let cursor=0,healthy=true;
 const isHealthy=()=>{if(!healthy)return false;try{return health.isHealthy()!==false;}catch(e){healthy=false;health_errors.push({phase:'health-check',error:String(e.message)});return false;}};
 await Promise.all([0,1].map(async()=>{while(cursor<8){const index=cursor++,job=jobs[index],order=index%2?['diversity','legacy']:['legacy','diversity'];
  for(const variant of order){const slot=index*2+(variant==='legacy'?0:1);if(!isHealthy()){slots[slot]={donor_id:job.donor.donor_id,variant,status:'not-started-shared-health-stop',usage:accountReceipts([]),unknown_usage:false};continue;}
   let result;try{result=await execute_slot({...job,variant,model_dispatch_enabled,before_model_dispatch:async()=>isHealthy()});}
   catch(e){result=e.result??{donor_id:job.donor.donor_id,variant,status:'infrastructure-failure',usage:accountReceipts(e.receipts??[]),unknown_usage:Boolean(e.unknown_usage),error:String(e.message)};result.persistence_failure=true;}
   slots[slot]=result;if(result.unknown_usage||result.persistence_failure||result.lifecycle_failure||result.provider_error_code){healthy=false;try{await health.report(result);}catch(e){health_errors.push({phase:'health-report',donor_id:job.donor.donor_id,variant,error:String(e.message)});}}
  }
 }}));
 const usage={};for(const key of ['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens']){usage[key]=slots.reduce((n,s)=>n+(s.usage?.[key]??0),0);need(Number.isSafeInteger(usage[key])&&usage[key]>=0,'aggregate-usage');}
 usage.unknown_usage=slots.some(r=>r.unknown_usage);
 const logical_totals={};for(const variant of ['legacy','diversity'])logical_totals[variant]=jobs.reduce((n,j,i)=>n+(j.donor.prefix_usage?.total_tokens??0)+(slots[i*2+(variant==='legacy'?0:1)].usage?.total_tokens??0),0);
 return {schema_version:'are.packet-pairs/v1',planned_slots:16,slots,usage,health_errors,logical_totals,historical_prefix_tokens:jobs.reduce((n,j)=>n+(j.donor.prefix_usage?.total_tokens??0),0),unknown_usage:slots.some(r=>r.unknown_usage),all_valid:health_errors.length===0&&slots.every(r=>r.status==='completed'&&!r.unknown_usage&&!r.persistence_failure&&!r.lifecycle_failure&&!r.provider_error_code),maximum_new_model_tokens:128000,claim_ceiling:'Archived terminal component only; no fresh full-trajectory or15% claim.'};
}

export async function measureNativeWire(options){
 const result=await runNativeRequest({...options,model_dispatch_enabled:false});
 need(result.usage.model_calls===0&&!result.unknown_usage,'preflight-no-model-calls');
 need(!result.lifecycle_failure&&!result.persistence_failure,'preflight-lifecycle-failure');
 const receipt=result.receipts.slice(result.suffix_receipt_start).filter(r=>r.kind==='tokenizer').at(-1);
 need(receipt?.status===200&&!receipt.failure_code&&Number.isSafeInteger(receipt.input_tokens),'successful-wire-tokenizer');
 const retained=retainedReasoning(JSON.parse(options.prompt).messages,options.donor.receipts);
 const projected_upper_bound=receipt.input_tokens+options.donor.cell.provider_profile.token_margin+retained.tokens+2048;
 const expectedDenial=result.status==='preflight'&&result.error==='recycling.dispatch-admission-denied'&&result.admission&&!result.entered;
 const expectedOversize=result.status==='failed'&&result.error==='recycling.fresh-context-too-large'&&result.admission===null&&!result.entered&&projected_upper_bound>=options.donor.cell.recycle_at;
 need(expectedDenial||expectedOversize,'unexpected-preflight-disposition');
 return {projected_upper_bound,result};
}
