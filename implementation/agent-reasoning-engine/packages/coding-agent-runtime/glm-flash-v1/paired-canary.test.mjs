import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runPairedCanary,PAIR_LIMITS,runtimeSources} from './paired-canary.mjs';

const credential={provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key'};
function fixture(t) {
 const root=mkdtempSync(join(tmpdir(),'are-pair-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 return {directory:join(root,'pair'),credential};
}
function good(options,extra={}) {
 return {status:'PASS_BOUNDED',agent_status:'AWAITING_APPROVAL',retention_policy:options.retention_policy,...options.expected_task,
  context_policy:{context_limit:16384,recycle_at:options.recycle_at ?? 5000,safety_margin:1024,maximum_output_tokens:2048},
  model_requests:12,tokenizer_requests:24,original_fixture_unchanged:true,reasons:[],...extra};
}
const seams={report:()=>{},preflight:()=>[],snapshot_sources:()=>[{path:'fixture-runtime',sha256:'a'.repeat(64)}]};

test('pair prewrites budget/source/task manifest and runs identical arms sequentially',async t=>{
 const input=fixture(t),calls=[];
 const result=await runPairedCanary(input,{...seams,run_canary:async(c,options)=>{
  const index=calls.length;
  const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.deepEqual(manifest.limits,PAIR_LIMITS);assert.deepEqual(options.expected_task,manifest.task);
  assert.ok(existsSync(join(input.directory,`arm-${index}-started.json`)));
  if(index)assert.ok(existsSync(join(input.directory,'arm-0-completed.json')));
  assert.deepEqual(c,credential);calls.push(options);return good(options);
 }});
 assert.equal(result.status,'COMPLETED');assert.equal(result.accounting_complete,true);
 assert.equal(result.model_requests,24);assert.equal(result.tokenizer_requests,48);
 assert.deepEqual(calls.map(o=>o.retention_policy),['clear-v1','recent-observations-v1']);
 assert.deepEqual(calls[0].expected_task,calls[1].expected_task);assert.equal(calls[0].scenario,calls[1].scenario);
});

test('ordinary budget failure remains evidence and permits treatment; credential failure stops',async t=>{
 for(const reason of ['glm.model-request-limit','glm.secret-resolution-failed','glm.runtime-failed']) {
  const input=fixture(t);let calls=0;
  const result=await runPairedCanary(input,{...seams,run_canary:async(_c,o)=>{
   calls++;return good(o,{status:'BLOCK',agent_status:'BLOCK',reasons:[reason]});
  }});
  assert.equal(calls,reason==='glm.model-request-limit'?2:1);
  assert.equal(result.status,calls===2?'COMPLETED':'STOPPED');
  assert.equal(result.arms[0].reasons[0],reason);
 }
});

test('preflight, cap changes, and output reuse reject before invoking an arm',async t=>{
 for(const change of ['cap','preflight','existing']) {
  const input=fixture(t);let calls=0;
  if(change==='cap')input.limits={...PAIR_LIMITS,maximum_model_calls:23};
  if(change==='existing')input.directory=join(input.directory,'..');
  await assert.rejects(()=>runPairedCanary(input,{...seams,
   preflight:()=>{if(change==='preflight')throw Error('missing executable');return [];},
   run_canary:async()=>{calls++;}}));
  assert.equal(calls,0);
 }
});

test('source drift between arms records the first result and blocks treatment',async t=>{
 const input=fixture(t);let changed=false,calls=0;
 const result=await runPairedCanary(input,{...seams,snapshot_sources:()=>[{path:'runtime',sha256:changed?'changed':'initial'}],
  run_canary:async(_c,o)=>{calls++;changed=true;return good(o);}});
 assert.equal(calls,1);assert.equal(result.reason,'glm.pair-source-drift');assert.equal(result.arms.length,1);
});

test('pair enforces remaining aggregate time and checks arm accounting and task identity',async t=>{
 for(const fail of ['time','counts','task']) {
  const input=fixture(t);let elapsed=0,calls=0;
  const result=await runPairedCanary(input,{...seams,now:()=>elapsed,run_canary:async(_c,o)=>{
   calls++;if(fail==='time')elapsed=1200001;
   return good(o,fail==='counts'?{model_requests:13}:fail==='task'?{request_sha256:'wrong'}:{});
  }});
  assert.equal(calls,1);assert.equal(result.status,'STOPPED');
  assert.equal(result.reason,fail==='time'?'glm.pair-time-budget':fail==='counts'?'glm.pair-call-budget':'glm.paired-task-drift');
 }
});

test('unknown thrown arm keeps started evidence and marks aggregate accounting incomplete',async t=>{
 const input=fixture(t);let calls=0;
 const result=await runPairedCanary(input,{...seams,run_canary:async()=>{calls++;throw Error('unknown');}});
 assert.equal(calls,1);assert.equal(result.status,'STOPPED');assert.equal(result.accounting_complete,false);
 assert.equal(result.arms_started,1);assert.equal(result.arms.length,0);
 assert.ok(existsSync(join(input.directory,'arm-0-started.json')));
});

test('runtime pins include transitive transport, verification, secret and retention sources',()=>{
 const paths=runtimeSources().map(s=>s.path);
 for(const suffix of ['/agent.mjs','/retention.mjs','/transport.mjs','/context-recycling.mjs','/cli.mjs','/secret-provider.mjs','/sops-age-secret-provider.mjs','/verifier.mjs','/patch-set-runtime.mjs','/patch-schema.mjs','/schemas/patch-set-candidate.schema.json','/canary.mjs','/paired-canary.mjs'])
  assert.ok(paths.some(p=>p.endsWith(suffix)),suffix);
});


test('v2 context comparison keeps both arms on the selected threshold',async t=>{
 const input={...fixture(t),treatment_policy:'recent-observations-v2',recycle_at:8000},calls=[];
 const result=await runPairedCanary(input,{...seams,run_canary:async(_c,o)=>{calls.push(o);return good(o);}});
 assert.equal(result.status,'COMPLETED');
 assert.deepEqual(calls.map(o=>o.retention_policy),['clear-v1','recent-observations-v2']);
 assert.deepEqual(calls.map(o=>o.recycle_at),[8000,8000]);
 assert.deepEqual(calls[0].expected_task,calls[1].expected_task);
});

test('unapproved pair policy and threshold fail before fixture creation or calls',async t=>{
 for(const override of [{treatment_policy:'unknown'},{recycle_at:7999},{recycle_at:32768}]){
  const input={...fixture(t),...override};let calls=0;
  await assert.rejects(()=>runPairedCanary(input,{...seams,run_canary:async()=>{calls++;}}));
  assert.equal(calls,0);assert.equal(existsSync(input.directory),false);
 }
});


test('second arm is not started with a shorter remaining deadline',async t=>{
 const input=fixture(t);let elapsed=0,calls=0;
 const result=await runPairedCanary(input,{...seams,now:()=>elapsed,run_canary:async(_c,o)=>{
  calls++;elapsed=600001;return good(o);
 }});
 assert.equal(calls,1);assert.equal(result.reason,'glm.pair-time-budget');
 assert.equal(result.accounting_complete,true);
});
