// G02 VPS qualification adapter. Admission and topology attestations are external inputs;
// this module deliberately has no attestation writer or self-admission helper.
import {createHash} from 'node:crypto';
import {closeSync,existsSync,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createGlmClient,MODEL,stable} from './packet-diversity-v1/transport-bounded-g02-v1.mjs';
import {openContextRecycling} from './packet-diversity-v1/context-recycling-bounded-v3.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {dryRunExactTask} from './g02-task2-qualification.mjs';
import {G02_QUALIFICATION_MINIMUM_REQUEST_BYTES,G02_WORKER_BINDING,runBoundedG02WorkerQualification} from './deepseek-pilot-are-worker-g02-v1.mjs';
import {G02_FREEZE_DIGEST,G02_QUALIFICATION_CAPS,runG02VpsQualification,verifyG02VpsQualificationReceipt} from './g02-vps-qualification-v1.mjs';
import {createRemoteMountedCredentialBinding,createG02RemoteMountedPost,G02_REMOTE_MOUNTED_BINDING} from './g02-remote-mounted-glm-v1.mjs';
import {G02_GATEWAY_IMAGE_DIGEST,G02_MACHINE_ID_SHA256,verifyG02GatewayObservation} from './g02-gateway-observation-v1.mjs';
import {verifyReviewerAttestation} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/security/reviewer-attestation-v1.mjs';

const here=dirname(fileURLToPath(import.meta.url)),repoDefault=resolve(here,'../../../../../..');
const qualifierPath=join(here,'g02-vps-qualification-v1.mjs'),probePath=fileURLToPath(import.meta.url);
const workerPath=join(here,'deepseek-pilot-are-worker-g02-v1.mjs'),transportPath=join(here,'packet-diversity-v1/transport-bounded-g02-v1.mjs');
const remoteGatewayPath=join(here,'g02-remote-mounted-glm-v1.mjs');
const gatewayObservationPath=join(here,'g02-gateway-observation-v1.mjs');
const reviewerVerifierPath=join(repoDefault,'implementation/agent-reasoning-engine/packages/evolution-runtime/src/security/reviewer-attestation-v1.mjs');
const vpsProfilePath=join(repoDefault,'implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ARE-DSH-VPS-QUALIFICATION.v1.json');
const sha=value=>createHash('sha256').update(value).digest('hex');
const hashFile=path=>sha(readFileSync(path));
const hash=value=>sha(typeof value==='string'||Buffer.isBuffer(value)?value:stable(value));
const need=(ok,code)=>{if(!ok)throw Error('g02-vps-probe.'+code);};
const HASH=/^[a-f0-9]{64}$/;
const NONCE=/^[a-f0-9]{32,128}$/;
const REVIEW_DOMAIN='g02-vps-qualification-review';
const GATEWAY_DOMAIN='g02-vps-gateway-host-attestation';
const trustedNow=()=>new Date().toISOString();
const validUsage=r=>Number.isSafeInteger(r?.input_tokens)&&r.input_tokens>=0&&Number.isSafeInteger(r?.output_tokens)&&r.output_tokens>=0;
export const G02_GATEWAY_TOPOLOGY=Object.freeze({host_ref:'vps:187.77.163.194',observed_hostname:'srv1959838',machine_id_sha256:G02_MACHINE_ID_SHA256,container:'are-keld-presentation-provider-gateway-1',container_image_digest:G02_GATEWAY_IMAGE_DIGEST,execution_path:'ssh-strict-host-key+docker-exec',chat_endpoint:'https://api.z.ai/api/paas/v4/chat/completions',tokenizer_endpoint:'https://api.z.ai/api/paas/v4/tokenizer',secret_path:'/run/secrets/model_api_key',secret_crosses_host_boundary:false,probe_origin:'inside-container',loopback:false});

function writeExclusive(path,value){const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}}
function materialDigest(value,key='attestation_digest'){const material={...value};delete material[key];return hash(material);}
function exactKeys(value,keys){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
function sourceBindings(){return Object.freeze({package_digest:G02_FREEZE_DIGEST,caps_digest:hash(G02_QUALIFICATION_CAPS),vps_profile_sha256:hashFile(vpsProfilePath),qualifier_sha256:hashFile(qualifierPath),probe_sha256:hashFile(probePath),worker_sha256:hashFile(workerPath),transport_sha256:hashFile(transportPath),remote_gateway_sha256:hashFile(remoteGatewayPath),gateway_observation_sha256:hashFile(gatewayObservationPath),reviewer_verifier_sha256:hashFile(reviewerVerifierPath)});}

function reviewArtifactBindings({gateway_attestation_sha256,consumption_path,reviewer_trust_registry_path,reviewer_trust_registry_sha256}){
  return Object.freeze({...sourceBindings(),gateway_attestation_sha256,consumption_path:resolve(consumption_path),reviewer_trust_registry_path:resolve(reviewer_trust_registry_path),reviewer_trust_registry_sha256});
}

function gatewayArtifactBindings({observation_receipt,reviewer_trust_registry_path,reviewer_trust_registry_sha256}){
  return Object.freeze({...sourceBindings(),topology_digest:hash(G02_GATEWAY_TOPOLOGY),observation_receipt_digest:hash(observation_receipt),reviewer_trust_registry_path:resolve(reviewer_trust_registry_path),reviewer_trust_registry_sha256});
}

export function verifyG02GatewayHostAttestation(value,{run_id,reviewer_trust_registry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,now=new Date().toISOString()}={}){
  const keys=['schema_version','payload','observation_receipt','signature','authority_effect'],reasons=[];
  if(!exactKeys(value,keys))reasons.push('shape');
  if(value?.schema_version!=='are.g02-gateway-host-attestation/v2'||value?.authority_effect!=='none')reasons.push('identity');
  const payload=value?.payload,attestorId=payload?.reviewer_id;
  if(!NONCE.test(payload?.nonce??'')||!Number.isFinite(Date.parse(payload?.issued_at))||!Number.isFinite(Date.parse(payload?.expires_at))||Date.parse(payload?.issued_at)>Date.parse(now)||Date.parse(payload?.expires_at)<=Date.parse(now)||Date.parse(payload?.expires_at)-Date.parse(payload?.issued_at)>86400000)reasons.push('run-or-expiry');
  if(!verifyG02GatewayObservation(value?.observation_receipt).ok||value?.observation_receipt?.completed_at!==payload?.issued_at)reasons.push('gateway-observation');
  let expectedBindings=null;
  try{
    need(typeof reviewer_trust_registry_path==='string'&&resolve(reviewer_trust_registry_path)===reviewer_trust_registry_path&&HASH.test(reviewer_trust_registry_sha256??''),'trust-registry-binding');
    expectedBindings=gatewayArtifactBindings({observation_receipt:value?.observation_receipt,reviewer_trust_registry_path,reviewer_trust_registry_sha256});
  }catch{reasons.push('trust-registry-binding');}
  const authentication=verifyReviewerAttestation({trust_registry:reviewer_trust_registry,trust_registry_sha256:reviewer_trust_registry_sha256,payload,signature:value?.signature,expected:{domain:GATEWAY_DOMAIN,reviewer_id:attestorId,decision:'PASS',artifact_bindings:expectedBindings,run_id,expires_at:payload?.expires_at,nonce:payload?.nonce},now});
  if(!authentication.ok)reasons.push(...authentication.reason_codes.map(code=>`gateway-authentication:${code}`));
  return Object.freeze({ok:reasons.length===0,reason_codes:[...new Set(reasons)].sort(),authentication,authority_effect:'none'});
}

export function verifyG02ExternalReviewAttestation(value,{run_id,gateway_attestation,gateway_attestation_sha256,reviewer_trust_registry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,now=new Date().toISOString()}={}){
  const keys=['schema_version','payload','signature','authority_effect'],reasons=[];
  if(!exactKeys(value,keys))reasons.push('shape');
  if(value?.schema_version!=='are.g02-external-review-attestation/v4'||value?.authority_effect!=='none')reasons.push('identity');
  const payload=value?.payload,reviewerId=payload?.reviewer_id,consumptionPath=payload?.artifact_bindings?.consumption_path;
  const gatewayResult=verifyG02GatewayHostAttestation(gateway_attestation,{run_id,reviewer_trust_registry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,now});
  if(!gatewayResult.ok)reasons.push(...gatewayResult.reason_codes.map(code=>`gateway:${code}`));
  if(!gatewayResult.authentication?.ok||reviewerId===gatewayResult.authentication?.reviewer_id)reasons.push('two-person-review');
  if(!NONCE.test(payload?.nonce??'')||typeof consumptionPath!=='string'||resolve(consumptionPath)!==consumptionPath)reasons.push('single-use-binding');
  if(!Number.isFinite(Date.parse(payload?.issued_at))||!Number.isFinite(Date.parse(payload?.expires_at))||Date.parse(payload.expires_at)-Date.parse(payload.issued_at)>86400000)reasons.push('review-duration');
  let expectedBindings=null;
  try{
    need(typeof reviewer_trust_registry_path==='string'&&resolve(reviewer_trust_registry_path)===reviewer_trust_registry_path&&HASH.test(reviewer_trust_registry_sha256??''),'trust-registry-binding');
    expectedBindings=reviewArtifactBindings({gateway_attestation_sha256,consumption_path:consumptionPath,reviewer_trust_registry_path,reviewer_trust_registry_sha256});
  }catch{reasons.push('trust-registry-binding');}
  const authentication=verifyReviewerAttestation({trust_registry:reviewer_trust_registry,trust_registry_sha256:reviewer_trust_registry_sha256,payload,signature:value?.signature,expected:{domain:REVIEW_DOMAIN,reviewer_id:reviewerId,decision:'PASS',artifact_bindings:expectedBindings,run_id,expires_at:payload?.expires_at,nonce:payload?.nonce},now});
  if(!authentication.ok)reasons.push(...authentication.reason_codes.map(code=>`reviewer-authentication:${code}`));
  return Object.freeze({ok:reasons.length===0,reason_codes:[...new Set(reasons)].sort(),authentication,gateway_authentication:gatewayResult.authentication,authority_effect:'none'});
}

function readJsonArtifact(path,{expected_sha256=null,maximum_bytes=1024*1024}={}){need(typeof path==='string'&&resolve(path)===path,'external-artifact-reference');const stat=lstatSync(path);need(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=maximum_bytes,'external-artifact-file');const bytes=readFileSync(path);if(expected_sha256!==null){need(HASH.test(expected_sha256),'external-artifact-reference');need(sha(bytes)===expected_sha256,'external-artifact-digest');}return JSON.parse(bytes);}
function readExternalArtifact(path,expectedSha){return readJsonArtifact(path,{expected_sha256:expectedSha});}

function consumeG02ExternalReview({review,gateway_attestation,review_attestation_sha256,gateway_attestation_sha256,reviewer_trust_registry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,run_id,consumed_at}){
  const review_result=verifyG02ExternalReviewAttestation(review,{run_id,gateway_attestation,gateway_attestation_sha256,reviewer_trust_registry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,now:consumed_at});
  need(review_result?.ok===true&&review_result.authentication?.ok===true&&review_result.gateway_authentication?.ok===true,'review-not-admitted');
  const consumptionPath=review.payload.artifact_bindings.consumption_path,record={schema_version:'are.g02-external-review-consumption/v3',review_attestation_sha256,gateway_attestation_sha256,reviewer_trust_registry_path,reviewer_trust_registry_sha256,gateway_attestor_id:review_result.gateway_authentication.reviewer_id,gateway_attestor_key_id:review_result.gateway_authentication.key_id,gateway_attestor_payload_sha256:review_result.gateway_authentication.payload_sha256,reviewer_id:review_result.authentication.reviewer_id,reviewer_key_id:review_result.authentication.key_id,reviewer_payload_sha256:review_result.authentication.payload_sha256,nonce:review.payload.nonce,run_id,consumed_at,authority_effect:'none'};
  writeExclusive(consumptionPath,record);return Object.freeze(record);
}

async function createConcreteG02ProbeInternal({repo_root=repoDefault,probe_root,gateway,secret_registry,secret_ref,signal,execution_mode='mocked',gateway_observation=null}={}){
  const root=resolve(repo_root),stage=resolve(probe_root),chat=new URL(gateway?.chat_endpoint),tokenizer=new URL(gateway?.tokenizer_endpoint);
  need(!existsSync(stage),'single-use-probe-root');need(chat.origin===tokenizer.origin&&chat.pathname.endsWith('/chat/completions')&&tokenizer.pathname.endsWith('/tokenizer'),'gateway-endpoints');
  need(['mocked','live'].includes(execution_mode),'execution-mode');
  if(execution_mode==='mocked')need(secret_ref&&typeof secret_registry?.consume==='function','secret-boundary');
  if(execution_mode==='live')need(stable({chat_endpoint:chat.href,tokenizer_endpoint:tokenizer.href})===stable({chat_endpoint:G02_GATEWAY_TOPOLOGY.chat_endpoint,tokenizer_endpoint:G02_GATEWAY_TOPOLOGY.tokenizer_endpoint})&&verifyG02GatewayObservation(gateway_observation).ok&&G02_REMOTE_MOUNTED_BINDING.host==='187.77.163.194'&&G02_REMOTE_MOUNTED_BINDING.container===G02_GATEWAY_TOPOLOGY.container&&G02_REMOTE_MOUNTED_BINDING.secret_path===G02_GATEWAY_TOPOLOGY.secret_path&&G02_REMOTE_MOUNTED_BINDING.secret_crosses_host_boundary===false&&G02_REMOTE_MOUNTED_BINDING.maximum_request_bytes===G02_QUALIFICATION_CAPS.maximum_request_bytes,'live-topology');
  const credential=execution_mode==='live'?createRemoteMountedCredentialBinding():{registry:secret_registry,reference:secret_ref};
  mkdirSync(stage,{recursive:false,mode:0o700});const fixture=join(stage,'fixture');mkdirSync(fixture,{mode:0o700});
  const persistence=createStagePersistence({stage_guard:createStageOutputGuard({root:stage}),stage_root:stage});
  return async request=>{
    const expectedMode=execution_mode==='live'?'live-non-loopback':'mocked-provider-free';
    need(request?.package_digest===G02_FREEZE_DIGEST&&stable(request?.caps)===stable(G02_QUALIFICATION_CAPS)&&request?.mode===expectedMode&&request?.live_enabled===(execution_mode==='live'),'request-binding');
    need(G02_QUALIFICATION_CAPS.minimum_qualification_request_bytes===G02_QUALIFICATION_MINIMUM_REQUEST_BYTES,'qualification-request-floor');
    const deadline=new AbortController(),timer=setTimeout(()=>deadline.abort(),G02_QUALIFICATION_CAPS.maximum_elapsed_seconds*1000),boundedSignal=signal?AbortSignal.any([signal,deadline.signal]):deadline.signal;
    const dry=dryRunExactTask({repo_root:root}),directory=join(stage,'state');
    const client=createGlmClient({chat_endpoint:chat.href,tokenizer_endpoint:tokenizer.href,api_key_ref:credential.reference,secret_registry:credential.registry,persistence,before_dispatch:async()=>{need(!boundedSignal.aborted,'deadline');return true;},maximum_requests:2,maximum_output_tokens:G02_QUALIFICATION_CAPS.maximum_output_tokens,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:'contextbench-full-window-v1',maximum_request_bytes:G02_QUALIFICATION_CAPS.maximum_request_bytes,maximum_response_bytes:G02_QUALIFICATION_CAPS.maximum_response_bytes,token_margin:512,reasoning_effort:'low',timeout_ms:30000,model_timeout_ms:120000,signal:boundedSignal,...(execution_mode==='live'?{post:createG02RemoteMountedPost(),transport_dispatch:'remote-mounted-gateway-v1'}:{})});
    const recycler=openContextRecycling({transport:client.transport,persistence,fixture_root:fixture,scope:{request:dry.task.instance_id},options:{directory,context_limit:G02_QUALIFICATION_CAPS.context_limit,recycle_at:990000,safety_margin:10000,state:{objective:dry.task.instance_id,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[dry.task.sha256]}}});
    client.bindRunLedger({directory,binding:hash({package:G02_FREEZE_DIGEST,task:dry.task})});const beforeBytes=readFileSync(join(directory,'glm-transport-ledger.json'));
    let workerReceipt;try{workerReceipt=await runBoundedG02WorkerQualification({client,recycler});}finally{clearTimeout(timer);deadline.abort();recycler.close();}
    const afterBytes=readFileSync(join(directory,'glm-transport-ledger.json')),receipts=client.receipts,model=receipts.findLast(row=>row.kind==='model'),tokenizerReceipt=receipts.findLast(row=>row.kind==='tokenizer');
    const dispatched=receipts.filter(row=>row.dispatched===true),unknown=dispatched.filter(row=>row.kind==='model'&&!validUsage(row)).length,known=receipts.reduce((total,row)=>total+(Number.isSafeInteger(row.input_tokens)?row.input_tokens:0)+(row.kind==='model'&&Number.isSafeInteger(row.output_tokens)?row.output_tokens:0),0);
    const ledger=JSON.parse(afterBytes);need(workerReceipt&&model&&tokenizerReceipt&&ledger.phase==='idle','probe-incomplete');
    return {glm_profile:{model:MODEL,response_batch_policy:'g02-v1',tool_schema_validation:'ajv-strict-v1',request_budget:client.request_budget,transport_identity:client.identity,automatic_model_retries:client.maximum_model_retries,tokenizer_transport_attempts:client.maximum_tokenizer_transport_attempts},token_boundary:{measured_input_tokens:tokenizerReceipt.input_tokens,reserved_input_tokens:model.reserved_input_tokens,actual_input_tokens:model.input_tokens,actual_output_tokens:model.output_tokens,context_limit:G02_QUALIFICATION_CAPS.context_limit,output_cap:model.output_cap,request_bytes:model.request_bytes??0,response_bytes:model.response_bytes},durable_accounting:{ledger_binding:ledger.binding,ledger_before_sha256:sha(beforeBytes),ledger_after_sha256:sha(afterBytes),ledger_digest:ledger.ledger_digest,model_request_sha256:model.request_sha256,tokenizer_request_sha256:tokenizerReceipt.request_sha256,final_phase:ledger.phase,receipt_count:receipts.length,dispatched_calls:dispatched.length,known_tokens:known,unknown_usage_dispatched_requests:unknown,conservative_total_tokens:known+unknown*G02_QUALIFICATION_CAPS.context_limit},benchmark_adapter:{task_id:dry.task.id,instance_id:dry.task.instance_id,task_sha256:dry.task.sha256,worker_version:G02_WORKER_BINDING.worker_version,episode:G02_WORKER_BINDING.episode,transport:G02_WORKER_BINDING.transport,profile:G02_WORKER_BINDING.profile,dry_run_status:dry.status,worker_receipt:workerReceipt},accounting:{model_calls:dispatched.filter(row=>row.kind==='model').length,tokenizer_calls:dispatched.filter(row=>row.kind==='tokenizer').length,known_tokens:known,unknown_usage_dispatched_requests:unknown,elapsed_seconds:receipts.reduce((total,row)=>total+(row.latency_ms??0),0)/1000}};
  };
}

export async function createConcreteG02Probe(options={}){
  need(options.execution_mode===undefined||options.execution_mode==='mocked','live-requires-admitted-runner');
  return createConcreteG02ProbeInternal({...options,execution_mode:'mocked',gateway_observation:null});
}

export async function runDevelopmentG02VpsQualification({repo_root=repoDefault,gateway_observation_path,gateway_observation_sha256,run_id,output_root,probe_root,gateway,signal}={}){
  need(typeof run_id==='string'&&/^g02-development-[A-Za-z0-9_-]+$/.test(run_id),'development-run-id');
  const observedAt=trustedNow(),observation=readExternalArtifact(gateway_observation_path,gateway_observation_sha256),verification=verifyG02GatewayObservation(observation);need(verification.ok,'gateway-observation:'+verification.reason_codes.join(','));
  const age=Date.parse(observedAt)-Date.parse(observation.completed_at);need(Number.isFinite(age)&&age>=0&&age<=15*60*1000,'gateway-observation-stale');
  const probe=await createConcreteG02ProbeInternal({repo_root,probe_root,gateway,signal,execution_mode:'live',gateway_observation:observation});
  const receipt=await runG02VpsQualification({repo_root,output_root,mode:'live',gateway_attestation_sha256:gateway_observation_sha256,execute_probe:probe,now:trustedNow});
  const verified=verifyG02VpsQualificationReceipt(receipt,{expected_mode:'live-non-loopback',expected_gateway_attestation_sha256:gateway_observation_sha256});need(verified.ok&&Object.values(receipt.checks).every(Boolean)&&receipt.accounting.unknown_usage_dispatched_requests===0,'live-checks-failed');
  const predecessor=JSON.parse(readFileSync(resolve(repo_root,'implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ARE-DSH-VPS-QUALIFICATION.v1.json')));
  const descendant={...predecessor,schema_version:'are.dsh-vps-qualification/v5',execution_mode:'development',predecessor_receipt_digest:predecessor.receipt_digest,package_digest:G02_FREEZE_DIGEST,gateway_observation_sha256,qualification_receipt_digest:receipt.receipt_digest,checks:{...predecessor.checks,glm_profile:true,token_boundary:true,durable_accounting:true,benchmark_adapter:true,exact_gateway_observation:true},tests:{...predecessor.tests,g02_live_probe:{model_calls:receipt.accounting.model_calls,tokenizer_calls:receipt.accounting.tokenizer_calls,unknown_usage_dispatched_requests:0}},model_calls:receipt.accounting.model_calls,credentials_accessed:true,credential_material_emitted:false,provider_network_accessed:true,benchmark_ready:true,missing:[],development_launch:{run_id,prelaunch_authorization_required:false,cryptographic_signatures_required:false,independent_postrun_review_required:true,observation_digest:observation.observation_digest},live_probe:{host_ref:G02_GATEWAY_TOPOLOGY.host_ref,run_id,automatic_retries:0,maximum_workers:1,caps:G02_QUALIFICATION_CAPS,worker_receipt_digest:receipt.evidence.benchmark_adapter.worker_receipt.worker_receipt_digest},postrun_review_status:'pending',authority_effect:'none'};
  delete descendant.receipt_digest;descendant.receipt_digest=hash(descendant);writeExclusive(join(resolve(output_root),'VPS-QUALIFICATION-DESCENDANT.json'),descendant);return Object.freeze({receipt,descendant,development_launch_consumed:true});
}

export async function runAdmittedG02VpsQualification({repo_root=repoDefault,review_attestation_path,review_attestation_sha256,gateway_attestation_path,gateway_attestation_sha256,reviewer_trust_registry_path,reviewer_trust_registry_sha256,run_id,output_root,probe_root,gateway,signal}={}){
  const verificationTime=trustedNow();
  const reviewerTrustRegistry=readJsonArtifact(reviewer_trust_registry_path),gatewayAttestation=readExternalArtifact(gateway_attestation_path,gateway_attestation_sha256),gatewayReview=verifyG02GatewayHostAttestation(gatewayAttestation,{run_id,reviewer_trust_registry:reviewerTrustRegistry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,now:verificationTime});need(gatewayReview.ok,'gateway-attestation:'+gatewayReview.reason_codes.join(','));
  const review=readExternalArtifact(review_attestation_path,review_attestation_sha256),reviewResult=verifyG02ExternalReviewAttestation(review,{run_id,gateway_attestation:gatewayAttestation,gateway_attestation_sha256,reviewer_trust_registry:reviewerTrustRegistry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,now:verificationTime});need(reviewResult.ok,'review-attestation:'+reviewResult.reason_codes.join(','));
  const probe=await createConcreteG02ProbeInternal({repo_root,probe_root,gateway,signal,execution_mode:'live',gateway_observation:gatewayAttestation.observation_receipt});
  const consumptionPath=review.payload.artifact_bindings.consumption_path;
  consumeG02ExternalReview({review,gateway_attestation:gatewayAttestation,review_attestation_sha256,gateway_attestation_sha256,reviewer_trust_registry:reviewerTrustRegistry,reviewer_trust_registry_path,reviewer_trust_registry_sha256,run_id,consumed_at:verificationTime});
  const receipt=await runG02VpsQualification({repo_root,output_root,mode:'live',gateway_attestation_sha256,execute_probe:probe,now:trustedNow});
  const verified=verifyG02VpsQualificationReceipt(receipt,{expected_mode:'live-non-loopback',expected_gateway_attestation_sha256:gateway_attestation_sha256});need(verified.ok&&Object.values(receipt.checks).every(Boolean)&&receipt.accounting.unknown_usage_dispatched_requests===0,'live-checks-failed');
  const predecessor=JSON.parse(readFileSync(resolve(repo_root,'implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ARE-DSH-VPS-QUALIFICATION.v1.json')));
  const descendant={...predecessor,schema_version:'are.dsh-vps-qualification/v4',predecessor_receipt_digest:predecessor.receipt_digest,package_digest:G02_FREEZE_DIGEST,review_attestation_sha256,gateway_attestation_sha256,qualification_receipt_digest:receipt.receipt_digest,checks:{...predecessor.checks,glm_profile:true,token_boundary:true,durable_accounting:true,benchmark_adapter:true,authenticated_distinct_review:true},tests:{...predecessor.tests,g02_live_probe:{model_calls:receipt.accounting.model_calls,tokenizer_calls:receipt.accounting.tokenizer_calls,unknown_usage_dispatched_requests:0}},model_calls:receipt.accounting.model_calls,credentials_accessed:true,credential_material_emitted:false,provider_network_accessed:true,benchmark_ready:true,missing:[],gateway_authentication:{attestor_id:reviewResult.gateway_authentication.reviewer_id,key_id:reviewResult.gateway_authentication.key_id,payload_sha256:reviewResult.gateway_authentication.payload_sha256},reviewer_authentication:{reviewer_id:reviewResult.authentication.reviewer_id,key_id:reviewResult.authentication.key_id,payload_sha256:reviewResult.authentication.payload_sha256,trust_registry_path:reviewer_trust_registry_path,trust_registry_sha256:reviewer_trust_registry_sha256,nonce:review.payload.nonce,consumption_path:consumptionPath},live_probe:{host_ref:G02_GATEWAY_TOPOLOGY.host_ref,run_id,automatic_retries:0,maximum_workers:1,caps:G02_QUALIFICATION_CAPS,worker_receipt_digest:receipt.evidence.benchmark_adapter.worker_receipt.worker_receipt_digest},authority_effect:'none'};
  delete descendant.receipt_digest;descendant.receipt_digest=hash(descendant);writeExclusive(join(resolve(output_root),'VPS-QUALIFICATION-DESCENDANT.json'),descendant);return Object.freeze({receipt,descendant,review_consumed:true});
}

export function currentG02AdmissionBindings(){return sourceBindings();}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const [observationPath,observationSha,runId,outputRoot,probeRoot]=process.argv.slice(2);need(observationPath&&observationSha&&runId&&outputRoot&&probeRoot,'usage: OBSERVATION SHA RUN_ID OUTPUT_ROOT PROBE_ROOT');
  const result=await runDevelopmentG02VpsQualification({gateway_observation_path:resolve(observationPath),gateway_observation_sha256:observationSha,run_id:runId,output_root:resolve(outputRoot),probe_root:resolve(probeRoot),gateway:{chat_endpoint:G02_GATEWAY_TOPOLOGY.chat_endpoint,tokenizer_endpoint:G02_GATEWAY_TOPOLOGY.tokenizer_endpoint}});process.stdout.write(JSON.stringify({status:'completed',benchmark_ready:result.descendant.benchmark_ready,receipt_digest:result.receipt.receipt_digest})+'\n');
}
