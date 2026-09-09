// Contract and attribution checks, no dispatch. Open questions: T5B-SOURCE-CONTEXT.md.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SOURCE_CONTEXT_PREFIX,encodeSourceContext,readSourceContext,textSha256} from '../../runtime/src/features/runs/source-context.ts';
import {compileTask} from '../luna-vps/runtime/task-contract.mjs';
import {projectNativeRuns} from '../../runtime/src/features/runs/run-adapters.ts';
const selected={kind:'chat',id:'thread-1',revision:'7',selector:'message:3'};
const task=input=>({schema_version:'are-text-task/v1',task_id:'origin-test',title:'Selected source',instruction:'Summarize the selected text.',input,objective_kind:'understand'});
test('preserves exact selected Unicode, whitespace and revision in canonical input',async()=>{
 const text='  café 🙂\r\nSecond line. ';
 const input=await encodeSourceContext(selected,text),envelope=await readSourceContext(input);
 assert.equal(envelope.text,text);assert.deepEqual(envelope.source,selected);
 assert.equal(envelope.text_sha256,await textSha256(text));assert.equal(envelope.authority_effect,'none');
 assert.equal(compileTask(task(input)).task.input,input);
});
test('source revision, selector, identity and text changes alter the owning task digest',async()=>{
 const input=await encodeSourceContext(selected,'Chosen text'),digest=compileTask(task(input)).digest;
 for(const change of [{revision:'8'},{selector:'message:4'},{id:'thread-2'},{kind:'project'}]){
  const next=await encodeSourceContext({...selected,...change},'Chosen text');
  assert.notEqual(compileTask(task(next)).digest,digest);
 }
 assert.notEqual(compileTask(task(await encodeSourceContext(selected,'Changed text'))).digest,digest);
});
test('rejects checksum tampering, extra fields, duplicate keys and noncanonical encodings',async()=>{
 const input=await encodeSourceContext(selected,'Chosen text');
 const v=JSON.parse(input.slice(SOURCE_CONTEXT_PREFIX.length));
 for(const changed of [{...v,text:'Changed text'},{...v,authority_effect:'accepted'},{...v,extra:true},{...v,source:{...v.source,revision:null}}])
  await assert.rejects(readSourceContext(SOURCE_CONTEXT_PREFIX+JSON.stringify(changed)),/SOURCE_CONTEXT_INVALID/);
 await assert.rejects(readSourceContext(input.replace('"schema":','"schema":"duplicate","schema":')),/SOURCE_CONTEXT_INVALID/);
 await assert.rejects(readSourceContext(SOURCE_CONTEXT_PREFIX+JSON.stringify(v,null,2)),/SOURCE_CONTEXT_INVALID/);
});
test('enforces UTF-8 total input budget and explicit source selection',async()=>{
 for(const text of ['','\0','\ud800'])await assert.rejects(encodeSourceContext(selected,text),/SOURCE_CONTEXT_INVALID/);
 await assert.rejects(encodeSourceContext({...selected,revision:''},'Text'),/SOURCE_CONTEXT_INVALID/);
 await assert.rejects(encodeSourceContext(selected,'é'.repeat(4000)),/SOURCE_CONTEXT_INPUT_TOO_LARGE/);
 const input=await encodeSourceContext(selected,'é'.repeat(3500));assert.ok(Buffer.byteLength(input)<=8192);
});
test('ordinary task input is not reinterpreted as a source declaration',async()=>{
 assert.equal(await readSourceContext('A normal text task.'),null);
 assert.equal(await readSourceContext('{"kind":"chat","revision":"7"}'),null);
});
async function project(input){
 const compiled=compileTask(task(input));
 return projectNativeRuns({schema_version:'are-native-console-state/v1',mode:'native-fixture',external_model_calls:0,jobs:[{id:'11111111-1111-4111-8111-111111111111',task:compiled.task,task_digest:compiled.digest,status:'preparing',result:null}]},{runtimeId:'test',label:'Test',location:'local',observedAtMs:1,nowMs:1,maxAgeMs:1000,available:true});
}
test('projects declared source references only after checking exact native task bytes',async()=>{
 const input=await encodeSourceContext(selected,'Chosen text'),run=(await project(input)).runs[0];
 assert.deepEqual(run.originRefs,[{kind:'chat',id:'thread-1',revision:'7'}]);
 assert.equal(run.origin.taskDigest,compileTask(task(input)).digest);
 assert.equal(run.origin.sourceVerification,'caller-declared');
 assert.equal(run.result.verification,'unavailable');
});
test('invalid source metadata does not erase an otherwise valid native run',async()=>{
 const run=(await project(SOURCE_CONTEXT_PREFIX+'invalid')).runs[0];
 assert.deepEqual(run.originRefs,[]);assert.equal(run.origin,undefined);assert.ok(run.attention.includes('source-context-invalid'));assert.equal(run.execution,'preparing');
});

test('builder rejects a coercible non-string source kind',async()=>{
 await assert.rejects(encodeSourceContext({kind:{toString:()=> 'chat'},id:'chat1',revision:'1',selector:'message1'},'text'),/SOURCE_CONTEXT_INVALID/);
});
