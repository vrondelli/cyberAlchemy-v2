import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import http from 'node:http';
import {once} from 'node:events';
import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createInjectedSecretProvider,createSecretProviderRegistry,createSecretReference} from '../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs';
import {MODEL,stable} from './packet-diversity-v1/transport-bounded-g02-v1.mjs';
import {G02_QUALIFICATION_CAPS,runG02VpsQualification} from './g02-vps-qualification-v1.mjs';
import {G02_GATEWAY_TOPOLOGY,createConcreteG02Probe,currentG02AdmissionBindings,runAdmittedG02VpsQualification,verifyG02ExternalReviewAttestation,verifyG02GatewayHostAttestation} from './g02-vps-probe-adapter-v1.mjs';
import {reviewerAttestationSigningBytes,reviewerTrustRegistryDigest} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/security/reviewer-attestation-v1.mjs';

const repo=resolve(fileURLToPath(new URL('../../../../../..',import.meta.url)));
const sha=value=>createHash('sha256').update(value).digest('hex'),digest=value=>sha(stable(value));
const reviewerKeys=Object.freeze({vlad:generateKeyPairSync('ed25519'),dave:generateKeyPairSync('ed25519')});
function observed(material){return {...material,observation_digest:digest(material)};}
function external(path,value){const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');writeFileSync(path,bytes,{flag:'wx',mode:0o600});return sha(bytes);}
function secretBoundary(){const provider=createInjectedSecretProvider({provider_id:'gateway-fixture',resolve:()=>Buffer.from('fixture-secret')});return {registry:createSecretProviderRegistry({providers:[provider]}),reference:createSecretReference({provider_id:'gateway-fixture',locator:'mounted:model-api-key'})};}
function observationReceipt(completed_at='2026-09-26T11:00:00.000Z'){return observed({schema_version:'are.g02-gateway-observation/v1',host_ref:'vps:187.77.163.194',observed_hostname:'srv1959838',machine_id_sha256:G02_GATEWAY_TOPOLOGY.machine_id_sha256,container:'are-keld-presentation-provider-gateway-1',container_user:'65532:65532',container_image_digest:G02_GATEWAY_TOPOLOGY.container_image_digest,secret_path:'/run/secrets/model_api_key',secret_readable:true,secret_bytes_read:false,ssh_batch_mode:true,strict_host_key_checking:true,provider_calls:0,started_at:new Date(Date.parse(completed_at)-1000).toISOString(),completed_at,authority_effect:'none'});}
function trustRegistry(){const record=(reviewer_id)=>({reviewer_id,key_id:`${reviewer_id}-fixture`,algorithm:'Ed25519',public_key_spki_base64:reviewerKeys[reviewer_id].publicKey.export({format:'der',type:'spki'}).toString('base64'),valid_from:'2026-09-01T00:00:00.000Z',valid_until:'2026-10-01T00:00:00.000Z',status:'active',revoked_at:null});return {schema_version:'are.reviewer-trust-registry/v1',registry_id:'g02-test-reviewers',issued_at:'2026-09-01T00:00:00.000Z',expires_at:'2026-10-01T00:00:00.000Z',reviewers:{vlad:record('vlad'),dave:record('dave')},authority_effect:'none'};}
function gatewayAttestation({run_id='g02-live-r1',trust_path='/tmp/g02-reviewer-trust.json',trust_sha=reviewerTrustRegistryDigest(trustRegistry()),attestor_id='vlad',issued_at='2026-09-26T11:00:00.000Z',expires_at='2026-09-26T13:00:00.000Z',nonce='a'.repeat(32),mutate_payload=()=>{}}={}){const observation_receipt=observationReceipt(issued_at),payload={schema_version:'are.reviewer-attestation-payload/v1',domain:'g02-vps-gateway-host-attestation',reviewer_id:attestor_id,decision:'PASS',artifact_bindings:{...currentG02AdmissionBindings(),topology_digest:digest(G02_GATEWAY_TOPOLOGY),observation_receipt_digest:digest(observation_receipt),reviewer_trust_registry_path:trust_path,reviewer_trust_registry_sha256:trust_sha},run_id,issued_at:observation_receipt.completed_at,expires_at,nonce,authority_effect:'none'};mutate_payload(payload);return {schema_version:'are.g02-gateway-host-attestation/v2',payload,observation_receipt,signature:{schema_version:'are.reviewer-attestation-signature/v1',algorithm:'Ed25519',key_id:`${attestor_id}-fixture`,signature_base64:sign(null,reviewerAttestationSigningBytes(payload),reviewerKeys[attestor_id].privateKey).toString('base64')},authority_effect:'none'};}
function reviewAttestation({run_id='g02-live-r1',gateway_sha,consumption_path,trust_path,trust_sha,reviewer_id='dave',issued_at='2026-09-26T11:10:00.000Z',expires_at='2026-09-26T13:00:00.000Z',nonce='d'.repeat(32),mutate_payload=()=>{}}){const payload={schema_version:'are.reviewer-attestation-payload/v1',domain:'g02-vps-qualification-review',reviewer_id,decision:'PASS',artifact_bindings:{...currentG02AdmissionBindings(),gateway_attestation_sha256:gateway_sha,consumption_path,reviewer_trust_registry_path:trust_path,reviewer_trust_registry_sha256:trust_sha},run_id,issued_at,expires_at,nonce,authority_effect:'none'};mutate_payload(payload);return {schema_version:'are.g02-external-review-attestation/v4',payload,signature:{schema_version:'are.reviewer-attestation-signature/v1',algorithm:'Ed25519',key_id:`${reviewer_id}-fixture`,signature_base64:sign(null,reviewerAttestationSigningBytes(payload),reviewerKeys[reviewer_id].privateKey).toString('base64')},authority_effect:'none'};}

test('mocked exact G02 episode and transport remain explicitly non-live and non-ready',async t=>{
  const parent=mkdtempSync(join(tmpdir(),'g02-concrete-'));t.after(()=>rmSync(parent,{recursive:true,force:true}));
  const seen=[],server=http.createServer((request,response)=>{const chunks=[];request.on('data',c=>chunks.push(c));request.on('end',()=>{seen.push(request.url);const body=request.url.endsWith('/tokenizer')?{usage:{prompt_tokens:20}}:{model:MODEL,choices:[{message:{role:'assistant',content:'{"summary":"qualified","context_read_ids":[]}'},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:8}};const bytes=Buffer.from(JSON.stringify(body));response.writeHead(200,{'content-type':'application/json','content-length':bytes.length});response.end(bytes);});});
  server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
  const {registry,reference}=secretBoundary(),port=server.address().port;
  const probe=await createConcreteG02Probe({repo_root:repo,probe_root:join(parent,'probe'),gateway:{chat_endpoint:`http://127.0.0.1:${port}/chat/completions`,tokenizer_endpoint:`http://127.0.0.1:${port}/tokenizer`},secret_registry:registry,secret_ref:reference});
  const times=['2026-09-26T12:00:00.000Z','2026-09-26T12:00:01.000Z'];
  const receipt=await runG02VpsQualification({repo_root:repo,output_root:join(parent,'qualification'),execute_probe:probe,now:()=>times.shift()});
  assert.equal(receipt.mode,'mocked-provider-free');assert.equal(receipt.live_enabled,false);assert.equal(receipt.benchmark_ready,false);assert.match(receipt.evidence.benchmark_adapter.worker_receipt.worker_receipt_digest,/^[a-f0-9]{64}$/);
  assert.ok(receipt.evidence.token_boundary.request_bytes>=G02_QUALIFICATION_CAPS.minimum_qualification_request_bytes);assert.ok(receipt.evidence.token_boundary.actual_input_tokens+receipt.evidence.token_boundary.actual_output_tokens<=G02_QUALIFICATION_CAPS.qualification_model_context_limit);
  assert.equal(receipt.accounting.model_calls,1);assert.equal(receipt.accounting.tokenizer_calls,1);assert.equal(seen.length,2);assert.equal(existsSync(join(parent,'qualification','VPS-QUALIFICATION-DESCENDANT.json')),false);
});

test('independently supplied gateway and review attestations bind topology, sources, expiry and run',()=>{
  const gatewaySha='a'.repeat(64),consumption='/tmp/g02-independent-consumed.json',trustPath='/tmp/g02-reviewer-trust.json',trust=trustRegistry(),trustSha=reviewerTrustRegistryDigest(trust),gateway=gatewayAttestation({trust_path:trustPath,trust_sha:trustSha}),review=reviewAttestation({gateway_sha:gatewaySha,consumption_path:consumption,trust_path:trustPath,trust_sha:trustSha});
  const gatewayOptions={run_id:'g02-live-r1',reviewer_trust_registry:trust,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,now:'2026-09-26T12:00:00.000Z'};
  assert.equal(verifyG02GatewayHostAttestation(gateway,gatewayOptions).ok,true);
  const options={...gatewayOptions,gateway_attestation:gateway,gateway_attestation_sha256:gatewaySha};
  const reviewResult=verifyG02ExternalReviewAttestation(review,options);
  assert.equal(reviewResult.ok,true,reviewResult.reason_codes.join(','));assert.equal(reviewResult.authentication.reviewer_id,'dave');
  const topologyRelabel=structuredClone(gateway);topologyRelabel.payload.artifact_bindings.topology_digest='0'.repeat(64);
  assert.equal(verifyG02GatewayHostAttestation(topologyRelabel,gatewayOptions).ok,false);
  const samePerson=reviewAttestation({gateway_sha:gatewaySha,consumption_path:consumption,trust_path:trustPath,trust_sha:trustSha,reviewer_id:'vlad'});
  assert.ok(verifyG02ExternalReviewAttestation(samePerson,options).reason_codes.includes('two-person-review'));
  assert.equal(verifyG02ExternalReviewAttestation(review,{...options,run_id:'other'}).ok,false);
  assert.equal(verifyG02ExternalReviewAttestation(review,{...options,now:'2026-09-26T14:00:00.000Z'}).ok,false);
  const futureGateway=structuredClone(gateway);futureGateway.payload.issued_at='2026-09-26T12:30:00.000Z';futureGateway.payload.expires_at='2026-09-26T13:30:00.000Z';
  assert.equal(verifyG02GatewayHostAttestation(futureGateway,gatewayOptions).ok,false);
});

test('gateway attestor identity cannot be relabeled to bypass two-person review',()=>{
  const trustPath='/tmp/g02-reviewer-trust.json',trust=trustRegistry(),trustSha=reviewerTrustRegistryDigest(trust),signed=gatewayAttestation({trust_path:trustPath,trust_sha:trustSha}),options={run_id:'g02-live-r1',reviewer_trust_registry:trust,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,now:'2026-09-26T12:00:00.000Z'};
  const relabeled=structuredClone(signed);relabeled.payload.reviewer_id='dave';relabeled.signature.key_id='dave-fixture';
  assert.equal(verifyG02GatewayHostAttestation(relabeled,options).ok,false);
  assert.ok(verifyG02GatewayHostAttestation(relabeled,options).reason_codes.some(code=>code.startsWith('gateway-authentication:')));
});

test('two reviewer names cannot share one key and satisfy signer separation',()=>{
  const trustPath='/tmp/g02-reviewer-trust.json',trust=trustRegistry();trust.reviewers.dave.key_id=trust.reviewers.vlad.key_id;trust.reviewers.dave.public_key_spki_base64=trust.reviewers.vlad.public_key_spki_base64;const trustSha=reviewerTrustRegistryDigest(trust),gatewaySha='a'.repeat(64),gateway=gatewayAttestation({trust_path:trustPath,trust_sha:trustSha}),review=reviewAttestation({gateway_sha:gatewaySha,consumption_path:'/tmp/g02-one-key-consumed.json',trust_path:trustPath,trust_sha:trustSha});review.signature.key_id=trust.reviewers.vlad.key_id;review.signature.signature_base64=sign(null,reviewerAttestationSigningBytes(review.payload),reviewerKeys.vlad.privateKey).toString('base64');
  const result=verifyG02ExternalReviewAttestation(review,{run_id:'g02-live-r1',gateway_attestation:gateway,gateway_attestation_sha256:gatewaySha,reviewer_trust_registry:trust,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,now:'2026-09-26T12:00:00.000Z'});
  assert.equal(result.ok,false);assert.ok(result.reason_codes.some(code=>code.includes('trust-registry-reviewer-key-uniqueness')));
});

test('missing, substituted, revoked and overlong reviewer authentication fail closed',()=>{
  const trustPath='/tmp/g02-reviewer-trust.json',trust=trustRegistry(),trustSha=reviewerTrustRegistryDigest(trust),gatewaySha='a'.repeat(64),gateway=gatewayAttestation({trust_path:trustPath,trust_sha:trustSha}),review=reviewAttestation({gateway_sha:gatewaySha,consumption_path:'/tmp/g02-consumed.json',trust_path:trustPath,trust_sha:trustSha});
  const options={run_id:'g02-live-r1',gateway_attestation:gateway,gateway_attestation_sha256:gatewaySha,reviewer_trust_registry:trust,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,now:'2026-09-26T12:00:00.000Z'};
  assert.equal(verifyG02ExternalReviewAttestation({...review,signature:null},options).ok,false);
  assert.equal(verifyG02ExternalReviewAttestation(review,{...options,reviewer_trust_registry_sha256:'0'.repeat(64)}).ok,false);
  const revoked=structuredClone(trust);revoked.reviewers.dave.status='revoked';revoked.reviewers.dave.revoked_at='2026-09-26T11:30:00.000Z';
  assert.ok(verifyG02ExternalReviewAttestation(review,{...options,reviewer_trust_registry:revoked,reviewer_trust_registry_sha256:reviewerTrustRegistryDigest(revoked)}).reason_codes.some(code=>code.includes('key-revoked')));
  const expired=structuredClone(trust);expired.expires_at='2026-09-26T12:00:00.000Z';
  assert.ok(verifyG02ExternalReviewAttestation(review,{...options,reviewer_trust_registry:expired,reviewer_trust_registry_sha256:reviewerTrustRegistryDigest(expired)}).reason_codes.some(code=>code.includes('trust-registry-currentness')));
  const overlong=reviewAttestation({gateway_sha:gatewaySha,consumption_path:'/tmp/g02-consumed.json',trust_path:trustPath,trust_sha:trustSha,expires_at:'2026-09-27T11:10:00.001Z'});
  assert.ok(verifyG02ExternalReviewAttestation(overlong,options).reason_codes.includes('review-duration'));
  const capDrift=reviewAttestation({gateway_sha:gatewaySha,consumption_path:'/tmp/g02-consumed.json',trust_path:trustPath,trust_sha:trustSha,mutate_payload:value=>{value.artifact_bindings.caps_digest='0'.repeat(64);}});
  assert.ok(verifyG02ExternalReviewAttestation(capDrift,options).reason_codes.includes('reviewer-authentication:binding-artifact-bindings'));
  assert.ok(verifyG02ExternalReviewAttestation(review,{...options,gateway_attestation_sha256:'f'.repeat(64)}).reason_codes.includes('reviewer-authentication:binding-artifact-bindings'));
  const relativeConsumption=reviewAttestation({gateway_sha:gatewaySha,consumption_path:'relative-consumed.json',trust_path:trustPath,trust_sha:trustSha});
  assert.ok(verifyG02ExternalReviewAttestation(relativeConsumption,options).reason_codes.includes('single-use-binding'));
});

test('consumption and trusted production time remain internal to the admitted runner',()=>{
  const source=readFileSync(fileURLToPath(new URL('./g02-vps-probe-adapter-v1.mjs',import.meta.url)),'utf8');
  assert.doesNotMatch(source,/export function consumeG02ExternalReview/);
  assert.doesNotMatch(source,/consumeG02ExternalReview\(\{[^}]*review_result/);
  assert.doesNotMatch(source,/runAdmittedG02VpsQualification\(\{[^}]*\bnow\b/);
  assert.match(source,/const trustedNow=\(\)=>new Date\(\)\.toISOString\(\)/);
});

test('localhost/mock topology cannot be promoted or consumed as live-ready evidence',async t=>{
  const parent=mkdtempSync(join(tmpdir(),'g02-no-mock-promotion-'));t.after(()=>rmSync(parent,{recursive:true,force:true}));
  const issuedAt=new Date(Date.now()-60000).toISOString(),reviewIssuedAt=new Date(Date.now()-30000).toISOString(),expiresAt=new Date(Date.now()+3600000).toISOString();
  const gatewayPath=join(parent,'GATEWAY.json'),consumption=join(parent,'CONSUMED.json'),trustPath=join(parent,'TRUST.json'),trust=trustRegistry(),trustSha=reviewerTrustRegistryDigest(trust);external(trustPath,trust);const signedGateway=gatewayAttestation({trust_path:trustPath,trust_sha:trustSha,issued_at:issuedAt,expires_at:expiresAt}),gatewaySha=external(gatewayPath,signedGateway);
  const reviewPath=join(parent,'REVIEW.json'),reviewSha=external(reviewPath,reviewAttestation({gateway_sha:gatewaySha,consumption_path:consumption,trust_path:trustPath,trust_sha:trustSha,issued_at:reviewIssuedAt,expires_at:expiresAt}));
  await assert.rejects(createConcreteG02Probe({repo_root:repo,probe_root:join(parent,'direct-probe'),gateway:{chat_endpoint:G02_GATEWAY_TOPOLOGY.chat_endpoint,tokenizer_endpoint:G02_GATEWAY_TOPOLOGY.tokenizer_endpoint},execution_mode:'live',gateway_attestation:signedGateway}),/live-requires-admitted-runner/);
  await assert.rejects(runAdmittedG02VpsQualification({repo_root:repo,review_attestation_path:reviewPath,review_attestation_sha256:reviewSha,gateway_attestation_path:gatewayPath,gateway_attestation_sha256:gatewaySha,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,run_id:'g02-live-r1',output_root:join(parent,'qualification'),probe_root:join(parent,'probe'),gateway:{chat_endpoint:'http://127.0.0.1:1/chat/completions',tokenizer_endpoint:'http://127.0.0.1:1/tokenizer'},now:()=> '2026-09-26T12:00:00.000Z'}),/live-topology/);
  assert.equal(existsSync(consumption),false);assert.equal(existsSync(join(parent,'qualification','VPS-QUALIFICATION-DESCENDANT.json')),false);
});

test('missing external signature and artifact digest fail closed before dispatch',async t=>{
  const parent=mkdtempSync(join(tmpdir(),'g02-external-review-'));t.after(()=>rmSync(parent,{recursive:true,force:true}));
  const issuedAt=new Date(Date.now()-60000).toISOString(),reviewIssuedAt=new Date(Date.now()-30000).toISOString(),expiresAt=new Date(Date.now()+3600000).toISOString();
  const gatewayPath=join(parent,'GATEWAY.json'),consumption=join(parent,'CONSUMED.json'),trustPath=join(parent,'TRUST.json'),trust=trustRegistry(),trustSha=reviewerTrustRegistryDigest(trust);external(trustPath,trust);const gatewaySha=external(gatewayPath,gatewayAttestation({trust_path:trustPath,trust_sha:trustSha,issued_at:issuedAt,expires_at:expiresAt}));
  const unsigned=reviewAttestation({gateway_sha:gatewaySha,consumption_path:consumption,trust_path:trustPath,trust_sha:trustSha,issued_at:reviewIssuedAt,expires_at:expiresAt});unsigned.signature=null;
  const reviewPath=join(parent,'REVIEW.json'),reviewSha=external(reviewPath,unsigned);
  await assert.rejects(runAdmittedG02VpsQualification({repo_root:repo,review_attestation_path:reviewPath,review_attestation_sha256:reviewSha,gateway_attestation_path:gatewayPath,gateway_attestation_sha256:gatewaySha,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,run_id:'g02-live-r1',output_root:join(parent,'qualification'),probe_root:join(parent,'probe'),gateway:{chat_endpoint:G02_GATEWAY_TOPOLOGY.chat_endpoint,tokenizer_endpoint:G02_GATEWAY_TOPOLOGY.tokenizer_endpoint},now:()=> '2026-09-26T12:00:00.000Z'}),/reviewer-authentication/);
  assert.equal(existsSync(join(parent,'qualification')),false);
  await assert.rejects(runAdmittedG02VpsQualification({repo_root:repo,review_attestation_path:reviewPath,review_attestation_sha256:'f'.repeat(64),gateway_attestation_path:gatewayPath,gateway_attestation_sha256:gatewaySha,reviewer_trust_registry_path:trustPath,reviewer_trust_registry_sha256:trustSha,run_id:'g02-live-r1',now:()=> '2026-09-26T12:00:00.000Z'}),/external-artifact-digest/);
});

test('direct development invocation requires only the frozen observation and run coordinates',async()=>{const {spawnSync}=await import('node:child_process'),result=spawnSync(process.execPath,[fileURLToPath(new URL('./g02-vps-probe-adapter-v1.mjs',import.meta.url))],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/usage: OBSERVATION SHA RUN_ID OUTPUT_ROOT PROBE_ROOT/);assert.doesNotMatch(result.stderr,/review|signature|trust.registry/i);});
