import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {hash} from './transport.mjs';
import {runPublicRepairFeedback} from './public-feedback.mjs';
function setup(t,source='export const solve=x=>x;') {
 const root=mkdtempSync(join(tmpdir(),'are-feedback-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const path=join(root,'public.json'),text=JSON.stringify({rule:'increment'});writeFileSync(path,text);
 const base={tree_sha256:hash('base'),files:{'src/subject.mjs':hash('original')}};
 const candidate={schema_version:'are.patch-set-candidate/v1',authority_effect:'none',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'src/subject.mjs',expected_file_sha256:base.files['src/subject.mjs'],utf8:source}]};
 const plan={schema_version:'are.public-case-plan/v1',sources:[{path,sha256:hash(text)}],checks:[{id:'increment',export_name:'solve',args:[1],expected:{ok:true,value:2},evidence:[{path,selector:'/rule',value_sha256:hash(JSON.stringify('increment'))}]}]};
 return {candidate,base,plan,directory:join(root,'run'),check_readiness:async()=>({schema_version:'are.execution-readiness/v1',ready:true})};
}
const reply=c=>({message:{role:'assistant',tool_calls:[{id:'fix',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify(c)}}]},finish_reason:'tool_calls'});
test('one corrective turn is validated and never applied',async t=>{
 const x=setup(t);let calls=0;const c=structuredClone(x.candidate);c.changes[0].utf8='export const solve=x=>x+1;';
 const r=await runPublicRepairFeedback({...x,request_once:async prompt=>{calls++;assert.ok(prompt.includes('failed_checks'));return reply(c);}});
 assert.equal(calls,1);assert.equal(r.status,'REPAIRED');assert.equal(x.candidate.changes[0].utf8,'export const solve=x=>x;');
 await assert.rejects(runPublicRepairFeedback({...x,request_once:async()=>{assert.fail('no replay');}}),/EEXIST/);
});
test('passing candidate makes no call',async t=>{const x=setup(t,'export const solve=x=>x+1;');const r=await runPublicRepairFeedback({...x,request_once:async()=>assert.fail()});assert.equal(r.status,'UNCHANGED');});
test('wrong corrective proposal fails after exactly one call',async t=>{const x=setup(t);let calls=0;const r=await runPublicRepairFeedback({...x,request_once:async()=>{calls++;return reply(x.candidate);}});assert.equal(r.status,'REJECTED');assert.equal(calls,1);});
test('transport failure is retained with unknown accounting and no retry',async t=>{const x=setup(t);let calls=0;const r=await runPublicRepairFeedback({...x,request_once:async()=>{calls++;throw Error('secret text');}});assert.equal(calls,1);assert.equal(r.model_attempts,null);assert.equal(r.status,'BLOCK');assert.ok(!JSON.stringify(r).includes('secret text'));});
test('foreign scope and malformed submission never pass',async t=>{const x=setup(t);const c=structuredClone(x.candidate);c.expected_base_tree_sha256=hash('foreign');const r=await runPublicRepairFeedback({...x,request_once:async()=>reply(c)});assert.equal(r.status,'BLOCK');});
test('validation process failure never becomes model feedback',async t=>{const x=setup(t,'while(true){}');const r=await runPublicRepairFeedback({...x,request_once:async()=>assert.fail()});assert.equal(r.status,'BLOCK');assert.equal(r.model_attempts,0);});

test('post-repair timeout is an execution block, not a semantic rejection',async t=>{
 const x=setup(t);const c=structuredClone(x.candidate);c.changes[0].utf8='export const solve=()=>{while(true){}}';
 const r=await runPublicRepairFeedback({...x,request_once:async()=>reply(c)});
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['feedback.validation-execution-failed']);assert.equal(r.model_attempts,1);
});

test('failed readiness blocks the corrective call with zero attempts',async t=>{
 const x=setup(t);const r=await runPublicRepairFeedback({...x,check_readiness:async()=>({schema_version:'are.execution-readiness/v1',ready:false}),request_once:async()=>assert.fail('not admitted')});
 assert.equal(r.status,'BLOCK');assert.equal(r.model_attempts,0);assert.deepEqual(r.reason_codes,['feedback.execution-not-ready']);
});
test('missing readiness adapter rejects before execution',async t=>{
 const x=setup(t);await assert.rejects(runPublicRepairFeedback({...x,check_readiness:undefined,request_once:async()=>assert.fail()}),/feedback-readiness-required/);
});
test('unconfirmed worker cleanup stops before any model request',async t=>{
 const x=setup(t);const backend={id:'test-worker',validate:({subject,plan})=>({subject_sha256:hash(readFileSync(subject,'utf8')),plan_sha256:hash(JSON.stringify(plan)),ok:false,worker_cleanup_verified:false,results:[]})};
 await assert.rejects(runPublicRepairFeedback({...x,validation_backend:backend,request_once:async()=>assert.fail()}),/worker-cleanup-unconfirmed/);
});

test('joint diagnostics repair schema and real source behavior in one native response',async t=>{
 const x=setup(t),raw=structuredClone(x.candidate);delete raw.schema_version;delete raw.authority_effect;
 const revised=structuredClone(x.candidate);revised.changes[0].utf8='export const solve=x=>x+1;';let calls=0;
 const r=await runPublicRepairFeedback({...x,rejected_text:JSON.stringify(raw),request_once:async prompt=>{
  calls++;const body=JSON.parse(JSON.parse(prompt).messages[1].content);assert.deepEqual(body.failed_checks,['increment']);assert.equal(body.schema_diagnostics.issues.length,2);return reply(revised);
 }});
 assert.equal(r.status,'REPAIRED');assert.equal(r.before.ok,false);assert.equal(r.after.ok,true);assert.equal(calls,1);
});
test('passing validation envelope still requires a schema-correct model submission',async t=>{
 const x=setup(t,'export const solve=x=>x+1;'),raw=structuredClone(x.candidate);delete raw.authority_effect;let calls=0;
 const r=await runPublicRepairFeedback({...x,rejected_text:JSON.stringify(raw),request_once:async()=>{calls++;return reply(x.candidate);}});
 assert.equal(r.status,'REPAIRED');assert.equal(calls,1);assert.equal(r.before.ok,true);assert.equal(r.after.ok,true);
});
test('diagnostic envelope cannot hide changed source or foreign scope',async t=>{
 const x=setup(t),raw=structuredClone(x.candidate);delete raw.authority_effect;raw.changes[0].utf8='export const solve=x=>0;';
 await assert.rejects(runPublicRepairFeedback({...x,rejected_text:JSON.stringify(raw),request_once:async()=>assert.fail()}),/diagnostic-scope-invalid/);
});

test('enabled correction recovery requires bounded physical accounting',async t=>{
 for(const accounting of [undefined,{model_attempts:null,tokenizer_attempts:1},{model_attempts:0,tokenizer_attempts:1},{model_attempts:3,tokenizer_attempts:1},{model_attempts:2,tokenizer_attempts:3}]){
  const x=setup(t);await assert.rejects(runPublicRepairFeedback({...x,maximum_model_retries:1,request_once:async()=>({...reply(x.candidate),...(accounting===undefined?{}:{transport_accounting:accounting})})}),/transport-accounting/);
 }
});
