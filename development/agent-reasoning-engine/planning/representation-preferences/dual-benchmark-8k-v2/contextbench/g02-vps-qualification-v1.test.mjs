import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {G02_FREEZE_DIGEST,G02_QUALIFICATION_CAPS,runG02VpsQualification,verifyG02VpsQualificationReceipt} from './g02-vps-qualification-v1.mjs';

const repo=resolve(fileURLToPath(new URL('../../../../../..',import.meta.url)));
const stable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const digest=value=>createHash('sha256').update(stable(value)).digest('hex');
const workerMaterial={schema_version:'are.g02-bounded-worker-qualification/v1',worker_binding:{worker_version:'g02-v1',episode:'discovery-v1/episode-recovery-g02-v1.mjs',orchestrator:'discovery-v1/orchestrate-recovery-g02-v1.mjs',transport:'packet-diversity-v1/transport-bounded-g02-v1.mjs',response_batch_policy:'g02-v1',profile:'glm-full-window-g02-v1'},episode_status:'final_context_selected',model_request_sha256:'1'.repeat(64),tokenizer_request_sha256:'2'.repeat(64),model_calls:1,tokenizer_calls:1,automatic_retries:0,tool_executions:0,authority_effect:'none'};
const workerReceipt={...workerMaterial,worker_receipt_digest:digest(workerMaterial)};
const validEvidence=()=>({
  glm_profile:{model:'glm-5.3-flash',response_batch_policy:'g02-v1',tool_schema_validation:'ajv-strict-v1',request_budget:'contextbench-full-window-v1',transport_identity:'a'.repeat(64),automatic_model_retries:0,tokenizer_transport_attempts:1},
  token_boundary:{measured_input_tokens:5900,reserved_input_tokens:6412,actual_input_tokens:5900,actual_output_tokens:8,context_limit:1000000,output_cap:2048,request_bytes:16*1024,response_bytes:2048},
  durable_accounting:{ledger_binding:'b'.repeat(64),ledger_before_sha256:'c'.repeat(64),ledger_after_sha256:'d'.repeat(64),ledger_digest:'e'.repeat(64),model_request_sha256:'1'.repeat(64),tokenizer_request_sha256:'2'.repeat(64),final_phase:'idle',receipt_count:2,dispatched_calls:2,known_tokens:11808,unknown_usage_dispatched_requests:0,conservative_total_tokens:11808},
  benchmark_adapter:{task_id:'contextbench-2',instance_id:'Multi-SWE-Bench__cpp__maintenance__bugfix__64aeac91',task_sha256:'1184ec718b6f23c1fb6d864cdaabc915feff08335e383f109eb3f401cbaff722',worker_version:'g02-v1',episode:'discovery-v1/episode-recovery-g02-v1.mjs',transport:'packet-diversity-v1/transport-bounded-g02-v1.mjs',profile:'glm-full-window-g02-v1',dry_run_status:'qualified-provider-free',worker_receipt:structuredClone(workerReceipt)},
  accounting:{model_calls:1,tokenizer_calls:1,known_tokens:11808,unknown_usage_dispatched_requests:0,elapsed_seconds:12}
});
const fixture=t=>{const parent=mkdtempSync(join(tmpdir(),'g02-vps-q-'));t.after(()=>rmSync(parent,{recursive:true,force:true}));return join(parent,'once');};
const clock=()=>{const values=['2026-09-25T12:00:00.000Z','2026-09-25T12:00:12.000Z'];return()=>values.shift();};

test('single provider-free probe closes all candidate check contracts and seals exact bindings',async t=>{
  const output=fixture(t);let calls=0;
  const receipt=await runG02VpsQualification({repo_root:repo,output_root:output,now:clock(),execute_probe:async request=>{
    calls++;assert.equal(request.package_digest,G02_FREEZE_DIGEST);assert.deepEqual(request.caps,G02_QUALIFICATION_CAPS);assert.equal(request.automatic_retries,0);assert.equal(request.live_enabled,false);return validEvidence();
  }});
  assert.equal(calls,1);assert.deepEqual(receipt.checks,{glm_profile:true,token_boundary:true,durable_accounting:true,benchmark_adapter:true});
  assert.equal(receipt.disposition,'candidate-checks-passed');assert.equal(receipt.benchmark_ready,false);
  assert.equal(verifyG02VpsQualificationReceipt(receipt).ok,true);
  assert.deepEqual(JSON.parse(readFileSync(join(output,'RECEIPT.json'))),receipt);
  assert.equal(JSON.parse(readFileSync(join(output,'STARTED.json'))).probe_attempt,1);
});

test('probe failure is attempted once and leaves a crash seal without a qualification receipt',async t=>{
  const output=fixture(t);let calls=0;
  await assert.rejects(runG02VpsQualification({repo_root:repo,output_root:output,now:clock(),execute_probe:async()=>{calls++;throw Error('mock failure with bearer hidden-value');}}),/mock failure/);
  assert.equal(calls,1);assert.equal(JSON.parse(readFileSync(join(output,'CRASH.json'))).failure_code,'probe-failed');
  assert.throws(()=>readFileSync(join(output,'RECEIPT.json')),/ENOENT/);
  assert.doesNotMatch(readFileSync(join(output,'CRASH.json'),'utf8'),/hidden-value/);
});

test('single-use output and unattested live mode fail before invoking a probe',async t=>{
  const output=fixture(t);let calls=0;
  await runG02VpsQualification({repo_root:repo,output_root:output,now:clock(),execute_probe:async()=>{calls++;return validEvidence();}});
  await assert.rejects(runG02VpsQualification({repo_root:repo,output_root:output,execute_probe:async()=>{calls++;return validEvidence();}}),/single-use-output-exists/);
  await assert.rejects(runG02VpsQualification({repo_root:repo,output_root:join(dirname(output),'live'),mode:'live',execute_probe:async()=>{calls++;return validEvidence();}}),/live-gateway-attestation-required/);
  assert.equal(calls,1);
});

test('verifier rejects check substitution, cap drift, digest drift and non-conservative accounting',async t=>{
  const output=fixture(t),receipt=await runG02VpsQualification({repo_root:repo,output_root:output,now:clock(),execute_probe:async()=>validEvidence()});
  for(const mutate of [
    value=>{value.checks.glm_profile=false;},
    value=>{value.caps.maximum_model_calls=3;},
    value=>{value.package_digest='e'.repeat(64);},
    value=>{value.evidence.durable_accounting.unknown_usage_dispatched_requests=1;},
    value=>{value.evidence.benchmark_adapter.worker_receipt.model_request_sha256='f'.repeat(64);},
    value=>{value.evidence.benchmark_adapter.worker_receipt.model_calls=2;},
    value=>{value.evidence.benchmark_adapter.worker_receipt.automatic_retries=1;},
    value=>{value.evidence.benchmark_adapter.worker_receipt.worker_receipt_digest='f'.repeat(64);}
    ,value=>{value.evidence.token_boundary.request_bytes=G02_QUALIFICATION_CAPS.minimum_qualification_request_bytes-1;}
    ,value=>{value.evidence.token_boundary.actual_input_tokens=G02_QUALIFICATION_CAPS.qualification_model_context_limit;}
  ]){
    const value=structuredClone(receipt);mutate(value);
    assert.equal(verifyG02VpsQualificationReceipt(value).ok,false);
  }
});

test('unknown dispatched usage is charged at a full context window',async t=>{
  const output=fixture(t),evidence=validEvidence();
  evidence.accounting.unknown_usage_dispatched_requests=1;
  evidence.durable_accounting.unknown_usage_dispatched_requests=1;
  evidence.durable_accounting.conservative_total_tokens=evidence.durable_accounting.known_tokens+G02_QUALIFICATION_CAPS.context_limit;
  const receipt=await runG02VpsQualification({repo_root:repo,output_root:output,now:clock(),execute_probe:async()=>evidence});
  assert.equal(receipt.checks.durable_accounting,true);
  assert.equal(receipt.accounting.unknown_usage_dispatched_requests,1);
});

test('direct runner invocation is live-disabled',()=>{
  const file=fileURLToPath(new URL('./g02-vps-qualification-v1.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[file],{encoding:'utf8',env:{PATH:process.env.PATH}});
  assert.notEqual(result.status,0);assert.match(result.stderr,/live-disabled-pending-independent-review/);
});
