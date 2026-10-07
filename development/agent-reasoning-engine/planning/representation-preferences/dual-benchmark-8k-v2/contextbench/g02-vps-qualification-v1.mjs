// Single-use, provider-free qualification contract for the exact G02 task-2 package.
import {createHash} from 'node:crypto';
import {closeSync,existsSync,fsyncSync,mkdirSync,openSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {buildFreezePackage,EXACT_TASK} from './g02-task2-qualification.mjs';

export const G02_VPS_QUALIFICATION_SCHEMA='are.g02-vps-qualification-receipt/v1';
export const G02_FREEZE_DIGEST='60f636fb13d46039088524d817f5eb0385b3dfa51a00a459006965fd68c0d3e8';
export const G02_QUALIFICATION_CAPS=Object.freeze({
  maximum_workers:1,
  maximum_model_calls:2,
  maximum_tokenizer_calls:2,
  maximum_total_tokens:4000000,
  maximum_elapsed_seconds:180,
  maximum_request_bytes:32*1024**2,
  minimum_qualification_request_bytes:16*1024,
  maximum_response_bytes:1024**2,
  maximum_output_tokens:2048,
  qualification_model_context_limit:12000,
  context_limit:1000000,
  automatic_model_retries:0,
  tokenizer_transport_attempts:1
});

const here=dirname(fileURLToPath(import.meta.url));
const repoDefault=resolve(here,'../../../../../..');
const VPS_PATH='implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ARE-DSH-VPS-QUALIFICATION.v1.json';
const sha=value=>createHash('sha256').update(value).digest('hex');
const stable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const hash=value=>sha(typeof value==='string'||Buffer.isBuffer(value)?value:stable(value));
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const HASH=/^[a-f0-9]{64}$/;
const SECRET=/(authorization\s*:|bearer\s+[A-Za-z0-9._-]{8,}|api[_-]?key\s*[=:]\s*[^,}\s]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;
const exact=(value,keys)=>object(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const freeze=value=>Object.freeze(structuredClone(value));
const need=(ok,code)=>{if(!ok)throw Error('g02-vps-qualification.'+code);};

function writeExclusive(path,value){
  const descriptor=openSync(path,'wx',0o600);
  try{writeFileSync(descriptor,JSON.stringify(value,null,2)+'\n');fsyncSync(descriptor);}finally{closeSync(descriptor);}
  const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}
}

function deriveChecks(evidence,caps){
  const glm=evidence.glm_profile,token=evidence.token_boundary,account=evidence.durable_accounting,adapter=evidence.benchmark_adapter;
  const glm_profile=exact(glm,['model','response_batch_policy','tool_schema_validation','request_budget','transport_identity','automatic_model_retries','tokenizer_transport_attempts'])&&
    glm.model==='glm-5.3-flash'&&glm.response_batch_policy==='g02-v1'&&glm.tool_schema_validation==='ajv-strict-v1'&&
    glm.request_budget==='contextbench-full-window-v1'&&HASH.test(glm.transport_identity??'')&&glm.automatic_model_retries===0&&glm.tokenizer_transport_attempts===1&&evidence.accounting.model_calls>=1;
  const token_boundary=exact(token,['measured_input_tokens','reserved_input_tokens','actual_input_tokens','actual_output_tokens','context_limit','output_cap','request_bytes','response_bytes'])&&
    [token.measured_input_tokens,token.reserved_input_tokens,token.actual_input_tokens,token.actual_output_tokens,token.context_limit,token.output_cap,token.request_bytes,token.response_bytes].every(integer)&&
    token.context_limit===caps.context_limit&&token.output_cap===caps.maximum_output_tokens&&token.measured_input_tokens<=token.reserved_input_tokens&&
    token.actual_input_tokens<=token.reserved_input_tokens&&token.reserved_input_tokens+token.output_cap<=token.context_limit&&
    token.actual_output_tokens<=token.output_cap&&token.actual_input_tokens+token.actual_output_tokens<=caps.qualification_model_context_limit&&
    token.request_bytes>=caps.minimum_qualification_request_bytes&&token.request_bytes<=caps.maximum_request_bytes&&token.response_bytes<=caps.maximum_response_bytes&&evidence.accounting.tokenizer_calls>=1;
  const expectedConservative=account?.known_tokens+(account?.unknown_usage_dispatched_requests*caps.context_limit);
  const durable_accounting=exact(account,['ledger_binding','ledger_before_sha256','ledger_after_sha256','ledger_digest','model_request_sha256','tokenizer_request_sha256','final_phase','receipt_count','dispatched_calls','known_tokens','unknown_usage_dispatched_requests','conservative_total_tokens'])&&
    [account.ledger_binding,account.ledger_before_sha256,account.ledger_after_sha256,account.ledger_digest,account.model_request_sha256,account.tokenizer_request_sha256].every(value=>HASH.test(value??''))&&account.final_phase==='idle'&&
    [account.receipt_count,account.dispatched_calls,account.known_tokens,account.unknown_usage_dispatched_requests,account.conservative_total_tokens].every(integer)&&
    account.receipt_count>=account.dispatched_calls&&account.dispatched_calls===evidence.accounting.model_calls+evidence.accounting.tokenizer_calls&&
    account.known_tokens===evidence.accounting.known_tokens&&account.unknown_usage_dispatched_requests===evidence.accounting.unknown_usage_dispatched_requests&&
    account.conservative_total_tokens===expectedConservative&&account.conservative_total_tokens<=caps.maximum_total_tokens;
  const worker=adapter?.worker_receipt,workerMaterial=object(worker)?{...worker}:null;
  if(workerMaterial)delete workerMaterial.worker_receipt_digest;
  const benchmark_adapter=exact(adapter,['task_id','instance_id','task_sha256','worker_version','episode','transport','profile','dry_run_status','worker_receipt'])&&
    adapter.task_id===EXACT_TASK.id&&adapter.instance_id===EXACT_TASK.instance_id&&adapter.task_sha256===EXACT_TASK.sha256&&adapter.worker_version==='g02-v1'&&
    adapter.episode==='discovery-v1/episode-recovery-g02-v1.mjs'&&adapter.transport==='packet-diversity-v1/transport-bounded-g02-v1.mjs'&&
    adapter.profile==='glm-full-window-g02-v1'&&adapter.dry_run_status==='qualified-provider-free'&&
    exact(worker,['schema_version','worker_binding','episode_status','model_request_sha256','tokenizer_request_sha256','model_calls','tokenizer_calls','automatic_retries','tool_executions','authority_effect','worker_receipt_digest'])&&
    worker.schema_version==='are.g02-bounded-worker-qualification/v1'&&stable(worker.worker_binding)===stable({worker_version:'g02-v1',episode:'discovery-v1/episode-recovery-g02-v1.mjs',orchestrator:'discovery-v1/orchestrate-recovery-g02-v1.mjs',transport:'packet-diversity-v1/transport-bounded-g02-v1.mjs',response_batch_policy:'g02-v1',profile:'glm-full-window-g02-v1'})&&
    ['final_context_selected','no_context_selected','invalid_final_response'].includes(worker.episode_status)&&worker.model_request_sha256===account.model_request_sha256&&worker.tokenizer_request_sha256===account.tokenizer_request_sha256&&
    worker.model_calls===evidence.accounting.model_calls&&worker.tokenizer_calls===evidence.accounting.tokenizer_calls&&worker.automatic_retries===0&&integer(worker.tool_executions)&&worker.tool_executions<=1&&worker.authority_effect==='none'&&worker.worker_receipt_digest===hash(workerMaterial);
  return {glm_profile,token_boundary,durable_accounting,benchmark_adapter};
}

function receiptMaterial({packageDigest,vpsProfileSha,caps,evidence,startedAt,completedAt,mode,gatewayAttestationSha}){
  const checks=deriveChecks(evidence,caps);
  const live=mode==='live';
  return {schema_version:G02_VPS_QUALIFICATION_SCHEMA,qualification_id:'contextbench-task2-g02-vps-v1',mode:live?'live-non-loopback':'mocked-provider-free',
    package_digest:packageDigest,vps_profile_sha256:vpsProfileSha,task:{...EXACT_TASK},caps,checks,evidence,accounting:evidence.accounting,
    gateway_attestation_sha256:live?gatewayAttestationSha:null,started_at:startedAt,completed_at:completedAt,probe_attempts:1,automatic_retries:0,live_enabled:live,benchmark_ready:false,
    disposition:Object.values(checks).every(Boolean)?'candidate-checks-passed':'candidate-checks-failed',authority_effect:'none'};
}

export function verifyG02VpsQualificationReceipt(value,{expected_package_digest=G02_FREEZE_DIGEST,expected_mode=null,expected_gateway_attestation_sha256=null}={}){
  const reasons=[];
  const keys=['schema_version','qualification_id','mode','package_digest','vps_profile_sha256','task','caps','checks','evidence','accounting','gateway_attestation_sha256','started_at','completed_at','probe_attempts','automatic_retries','live_enabled','benchmark_ready','disposition','authority_effect','receipt_digest'];
  if(!exact(value,keys))reasons.push('receipt-shape');
  if(value?.schema_version!==G02_VPS_QUALIFICATION_SCHEMA||value?.qualification_id!=='contextbench-task2-g02-vps-v1'||!['mocked-provider-free','live-non-loopback'].includes(value?.mode))reasons.push('identity');
  if(value?.package_digest!==expected_package_digest||!HASH.test(value?.vps_profile_sha256??''))reasons.push('package-binding');
  if(stable(value?.task)!==stable(EXACT_TASK)||stable(value?.caps)!==stable(G02_QUALIFICATION_CAPS))reasons.push('task-or-caps');
  const live=value?.mode==='live-non-loopback';
  if(value?.probe_attempts!==1||value?.automatic_retries!==0||value?.live_enabled!==live||value?.benchmark_ready!==false||value?.authority_effect!=='none')reasons.push('execution-posture');
  if((live&&!HASH.test(value?.gateway_attestation_sha256??''))||(!live&&value?.gateway_attestation_sha256!==null))reasons.push('gateway-attestation');
  if(expected_mode!==null&&value?.mode!==expected_mode)reasons.push('mode');
  if(expected_gateway_attestation_sha256!==null&&value?.gateway_attestation_sha256!==expected_gateway_attestation_sha256)reasons.push('gateway-attestation-binding');
  if(!Number.isFinite(Date.parse(value?.started_at))||!Number.isFinite(Date.parse(value?.completed_at))||Date.parse(value.completed_at)<Date.parse(value.started_at)||(Date.parse(value.completed_at)-Date.parse(value.started_at))/1000>G02_QUALIFICATION_CAPS.maximum_elapsed_seconds)reasons.push('time-cap');
  if(!exact(value?.accounting,['model_calls','tokenizer_calls','known_tokens','unknown_usage_dispatched_requests','elapsed_seconds'])||
    ![value?.accounting?.model_calls,value?.accounting?.tokenizer_calls,value?.accounting?.known_tokens,value?.accounting?.unknown_usage_dispatched_requests,value?.accounting?.elapsed_seconds].every(number=>typeof number==='number'&&Number.isFinite(number)&&number>=0)||
    !integer(value?.accounting?.model_calls)||!integer(value?.accounting?.tokenizer_calls)||!integer(value?.accounting?.known_tokens)||!integer(value?.accounting?.unknown_usage_dispatched_requests)||
    value.accounting.model_calls>G02_QUALIFICATION_CAPS.maximum_model_calls||value.accounting.tokenizer_calls>G02_QUALIFICATION_CAPS.maximum_tokenizer_calls||value.accounting.elapsed_seconds>G02_QUALIFICATION_CAPS.maximum_elapsed_seconds)reasons.push('accounting-cap');
  const derived=object(value?.evidence)&&object(value.evidence.accounting)?deriveChecks(value.evidence,G02_QUALIFICATION_CAPS):{glm_profile:false,token_boundary:false,durable_accounting:false,benchmark_adapter:false};
  if(stable(value?.checks)!==stable(derived)||stable(value?.accounting)!==stable(value?.evidence?.accounting))reasons.push('check-binding');
  const expectedDisposition=Object.values(derived).every(Boolean)?'candidate-checks-passed':'candidate-checks-failed';
  if(value?.disposition!==expectedDisposition)reasons.push('disposition');
  if(SECRET.test(JSON.stringify(value)))reasons.push('secret-shaped-data');
  if(object(value)){const material={...value};delete material.receipt_digest;if(value.receipt_digest!==hash(material))reasons.push('receipt-digest');}
  return freeze({ok:reasons.length===0,reason_codes:[...new Set(reasons)].sort(),authority_effect:'none'});
}

export async function runG02VpsQualification({repo_root=repoDefault,output_root,mode='mocked',gateway_attestation_sha256=null,execute_probe,now=()=>new Date().toISOString()}={}){
  need(['mocked','live'].includes(mode),'mode');
  need(mode!=='live'||HASH.test(gateway_attestation_sha256??''),'live-gateway-attestation-required');
  need(typeof execute_probe==='function','probe-required');
  need(typeof output_root==='string'&&output_root.length>0,'output-root-required');
  const root=resolve(repo_root),out=resolve(output_root);
  need(!existsSync(out),'single-use-output-exists');
  const packageManifest=buildFreezePackage({repo_root:root});need(packageManifest.package_digest===G02_FREEZE_DIGEST,'freeze-drift');
  const vpsBytes=readFileSync(join(root,VPS_PATH)),vpsProfileSha=hash(vpsBytes),startedAt=now();
  mkdirSync(out,{mode:0o700});
  const live=mode==='live';
  const request={schema_version:'are.g02-vps-qualification-request/v1',mode:live?'live-non-loopback':'mocked-provider-free',package_digest:packageManifest.package_digest,
    vps_profile_sha256:vpsProfileSha,gateway_attestation_sha256:live?gateway_attestation_sha256:null,task:{...EXACT_TASK},caps:G02_QUALIFICATION_CAPS,probe_attempt:1,automatic_retries:0,live_enabled:live,authority_effect:'none'};
  writeExclusive(join(out,'STARTED.json'),{...request,request_digest:hash(request),started_at:startedAt});
  try{
    const evidence=await execute_probe(freeze(request));
    const material=receiptMaterial({packageDigest:packageManifest.package_digest,vpsProfileSha,caps:G02_QUALIFICATION_CAPS,evidence,startedAt,completedAt:now(),mode,gatewayAttestationSha:gateway_attestation_sha256});
    const receipt=freeze({...material,receipt_digest:hash(material)}),verified=verifyG02VpsQualificationReceipt(receipt);
    need(verified.ok,'receipt-invalid:'+verified.reason_codes.join(','));
    writeExclusive(join(out,'RECEIPT.json'),receipt);
    return receipt;
  }catch(error){
    const crash={schema_version:'are.g02-vps-qualification-crash/v1',package_digest:packageManifest.package_digest,task_id:EXACT_TASK.id,probe_attempts:1,automatic_retries:0,
      failure_code:String(error?.message??'probe-failed').startsWith('g02-vps-qualification.receipt-invalid')?'receipt-invalid':'probe-failed',live_enabled:live,authority_effect:'none'};
    writeExclusive(join(out,'CRASH.json'),{...crash,crash_digest:hash(crash)});
    throw error;
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)throw Error('g02-vps-qualification.live-disabled-pending-independent-review');
