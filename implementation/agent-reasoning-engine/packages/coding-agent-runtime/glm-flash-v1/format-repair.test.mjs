import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {formatRepairEligibility,runNativeFormatRepair} from './format-repair.mjs';import {hash} from './transport.mjs';
const base={tree_sha256:hash('base'),files:{'src/subject.mjs':hash('original')}};
const raw={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'src/subject.mjs',expected_file_sha256:base.files['src/subject.mjs'],utf8:'export const x="json";\n'}]};
const reply=value=>({message:{role:'assistant',tool_calls:[{id:'format',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify(value)}}]},finish_reason:'tool_calls'});
function input(t){const root=mkdtempSync(join(tmpdir(),'are-format-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return {text:JSON.stringify(raw),base,directory:join(root,'run'),check_readiness:async()=>({schema_version:'are.execution-readiness/v1',ready:true})};}
test('complete diagnostics permit metadata errors but reject missing protected payload',()=>{
 assert.equal(formatRepairEligibility(JSON.stringify(raw),base).eligible,true);
 for(const x of [{...raw,authority_effect:'apply'},{...raw,unexpected:true},{...raw,schema_version:'other'},{...raw,rationale:42}])assert.equal(formatRepairEligibility(JSON.stringify(x),base).eligible,true);
 for(const x of [{...raw,authority_effect:'none'},{...raw,changes:{}},{...raw,expected_base_tree_sha256:hash('foreign')}])assert.equal(formatRepairEligibility(JSON.stringify(x),base).eligible,false);
});
test('recovery requires an explicit new model proposal and preserves original',async t=>{let calls=0;const x=input(t);const r=await runNativeFormatRepair({...x,request_once:async()=>{calls++;return reply({...raw,authority_effect:'none'});}});assert.equal(calls,1);assert.equal(r.status,'FORMAT_REPAIRED');assert.equal(r.semantic_validation_required,true);assert.equal(JSON.parse(x.text).authority_effect,undefined);await assert.rejects(runNativeFormatRepair({...x,request_once:async()=>assert.fail()}),/EEXIST/);});
test('source changes are rejected even with valid schema',async t=>{const changed=structuredClone(raw);changed.changes[0].utf8+=' ';const r=await runNativeFormatRepair({...input(t),request_once:async()=>reply({...changed,authority_effect:'none'})});assert.equal(r.reason,'format.source-changed');});
test('still-missing field cannot pass',async t=>{const r=await runNativeFormatRepair({...input(t),request_once:async()=>reply(raw)});assert.equal(r.reason,'format.submission-invalid');});
test('readiness failure makes no model call',async t=>{const r=await runNativeFormatRepair({...input(t),check_readiness:async()=>({ready:false}),request_once:async()=>assert.fail()});assert.equal(r.model_attempts,0);});
test('request failure has unknown accounting and no retry',async t=>{let calls=0;const r=await runNativeFormatRepair({...input(t),request_once:async()=>{calls++;throw Error('private');}});assert.equal(calls,1);assert.equal(r.model_attempts,null);assert.ok(!JSON.stringify(r).includes('private'));});

test('one resubmission fixes multiple metadata errors including nested extras',async t=>{
 const x=input(t),bad=structuredClone(raw);delete bad.schema_version;bad.rationale=42;bad.extra=true;bad.changes[0].note='remove';x.text=JSON.stringify(bad);
 let prompt;const r=await runNativeFormatRepair({...x,request_once:async p=>{prompt=JSON.parse(p);return {message:{role:'assistant',tool_calls:[{id:'all',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({...raw,authority_effect:'none'})}}]},finish_reason:'tool_calls'};}});
 assert.equal(r.status,'FORMAT_REPAIRED');const diagnostic=JSON.parse(prompt.messages[1].content).diagnostics;assert.equal(diagnostic.issues.length,5);assert.ok(diagnostic.issues.some(i=>i.instance_path==='/changes/0/note'));assert.equal(r.model_attempts,1);
});
test('duplicate keys and missing source cannot trigger recovery',async t=>{
 for(const text of [JSON.stringify(raw).replace('"schema_version":','"schema_version":"other","schema_version":'),JSON.stringify({...raw,changes:[{...raw.changes[0],utf8:null}]})])assert.equal(formatRepairEligibility(text,base).eligible,false);
});
test('readiness exception is a bounded block without leaking its message',async t=>{const r=await runNativeFormatRepair({...input(t),check_readiness:async()=>{throw Error('private');},request_once:async()=>assert.fail()});assert.equal(r.reason,'format.execution-not-ready');assert.equal(r.model_attempts,0);});
