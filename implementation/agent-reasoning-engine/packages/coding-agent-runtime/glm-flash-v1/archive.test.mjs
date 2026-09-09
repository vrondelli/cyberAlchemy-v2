import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStatelessRecyclingTransport,openContextRecycling} from '../context-recycling.mjs';
import {hash,stable} from './transport.mjs';
import {readInspectionEvidence} from './archive.mjs';
import {toolDefinitions,validateCalls} from './tools.mjs';

function entry(text='first source observation\n') {
 const call={id:'read-1',name:'read-file',arguments:{path:'source.txt'}};
 const observation={ok:true,output:{path:'source.txt',sha256:hash(text),utf8:text}};
 return {calls:[call],observations:[observation],messages:[
  {role:'assistant',tool_calls:[{id:call.id,type:'function',function:{name:call.name,arguments:stable(call.arguments)}}]},
  {role:'tool',tool_call_id:call.id,content:stable(observation)}]};
}
async function setup(t,history=[entry()]) {
 const directory=mkdtempSync(join(tmpdir(),'are-inspection-archive-')),root=join(directory,'fixture');mkdirSync(root);
 writeFileSync(join(root,'source.txt'),'current fixture intentionally differs from archived bytes');
 const transport=createStatelessRecyclingTransport({adapter_id:'archive-test',source_ref:'fixture',maximum_output_tokens:10,
  measure_request:async()=>10,request_once:async()=>({final_bytes:'fixture'})});
 const recycling=openContextRecycling({transport,scope:{request:'fixture'},fixture_root:root,options:{directory:join(directory,'state'),context_limit:1000,recycle_at:800,safety_margin:100,
  state:{objective:'fixture',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
 t.after(()=>{recycling.close();rmSync(directory,{recursive:true,force:true});});
 await recycling.generate({history:[],render:()=> 'fixture',run_id:'fixture'});recycling.beforeTool();recycling.completeStep(history);
 return {directory,context:{history,history_ref:hash(history),recycling,base:{files:{'source.txt':history[0].observations[0].output.sha256}},observation_allowlist:['source.txt']}};
}
const read=(context,args={call_id:'read-1'})=>readInspectionEvidence(context,args);

test('reads run-owned archive bytes, not fresh filesystem, and preserves history',async t=>{
 const {context}=await setup(t);const before=stable(context.history);
 const result=read(context);
 assert.equal(result.output.utf8,'first source observation\n');assert.equal(result.output.archive_digest,context.history_ref);
 assert.equal(result.output.call_id,'read-1');assert.equal(result.output.sha256,hash(result.output.utf8));
 assert.equal(result.output.next_offset,result.output.total_chars);assert.equal(stable(context.history),before);
});

test('model arguments cannot select paths/digests or nonexistent calls',async t=>{
 const {context}=await setup(t);
 for(const extra of [{path:'../secret'},{digest:context.history_ref}]) assert.throws(()=>read(context,{call_id:'read-1',...extra}),/inspection-arguments-invalid/);
 assert.throws(()=>read(context,{call_id:'fabricated'}),/inspection-call-not-unique/);
});

test('rejects changed history, foreign run archives, and damaged archive bytes',async t=>{
 const {context,directory}=await setup(t),changed=structuredClone(context.history);changed[0].calls[0].id='fake';
 assert.throws(()=>read({...context,history:changed}),/inspection-history-mismatch/);
 assert.throws(()=>read({...context,history:changed,history_ref:hash(changed)}),/recycling.foreign-evidence/);
 const archive=join(directory,'state',context.history_ref+'.json');writeFileSync(archive,'[]');
 assert.throws(()=>read(context),/recycling.archive-integrity/);
});

test('rejects failed/deferred reads, wrong paths, stale hashes and altered source bytes',async t=>{
 for(const mutate of [h=>{h[0].observations[0].ok=false;},h=>{h[0].calls[0].name='read-inspection-evidence';},
  h=>{h[0].observations[0].output.path='other.txt';},h=>{h[0].observations[0].output.utf8+='tampered';}]) {
  const history=[entry()];mutate(history);const {context}=await setup(t,history);
  assert.throws(()=>read(context),/inspection-source-invalid/);
 }
 const {context}=await setup(t);
 assert.throws(()=>read({...context,base:{files:{'source.txt':'a'.repeat(64)}}}),/inspection-source-invalid/);
 assert.throws(()=>read({...context,observation_allowlist:[]}),/inspection-source-invalid/);
});

test('rejects ambiguous call IDs and source/result protocol substitution',async t=>{
 const duplicate=[entry(),entry()];const a=await setup(t,duplicate);
 assert.throws(()=>read(a.context),/inspection-call-not-unique/);
 for(const mutate of [h=>{h[0].messages[1].tool_call_id='other';},h=>{h[0].messages[1].content='{}';},h=>{h[0].messages[0].tool_calls[0].function.arguments='{"path":"other"}';}]) {
  const history=[entry()];mutate(history);const {context}=await setup(t,history);
  assert.throws(()=>read(context),/inspection-protocol-invalid/);
 }
});

test('bounded pages reconstruct Unicode source without splitting surrogate pairs',async t=>{
 const text='é😀尾'.repeat(700),{context}=await setup(t,[entry(text)]);let offset=0,combined='';
 while(offset<text.length){const {output}=read(context,{call_id:'read-1',offset,max_chars:1024});
  assert.ok(output.utf8.length<=1024&&output.next_offset>offset);assert.equal(output.offset_unit,'utf16-code-units');
  assert.equal(output.utf8.toWellFormed(),output.utf8);combined+=output.utf8;offset=output.next_offset;}
 assert.equal(combined,text);
 for(const args of [{offset:2},{offset:1,max_chars:1}])assert.throws(()=>read(context,{call_id:'read-1',...args}),/inspection-range-splits-unicode/);
 for(const args of [{offset:text.length+1},{offset:-1},{offset:0.5},{max_chars:0},{max_chars:1025}])
  assert.throws(()=>read(context,{call_id:'read-1',...args}),/inspection-range-invalid/);
});

test('empty file is a valid exact source and arguments object protocol is accepted',async t=>{
 const history=[entry('')];history[0].messages[0].tool_calls[0].function.arguments={path:'source.txt'};
 const {context}=await setup(t,history);assert.equal(read(context).output.total_chars,0);assert.equal(read(context).output.utf8,'');assert.equal(read(context).output.eof,true);
});

test('paging reports EOF explicitly and an exact-end follow-up is successful and empty',async t=>{
 const text='x'.repeat(448),{context}=await setup(t,[entry(text)]);
 const first=read(context,{call_id:'read-1',max_chars:300}).output;
 assert.equal(first.eof,false);assert.equal(first.next_offset,300);
 const last=read(context,{call_id:'read-1',offset:first.next_offset,max_chars:300}).output;
 assert.equal(last.eof,true);assert.equal(last.next_offset,448);assert.equal(first.utf8+last.utf8,text);
 const end=read(context,{call_id:'read-1',offset:last.next_offset,max_chars:300});
 assert.equal(end.ok,true);assert.equal(end.output.eof,true);assert.equal(end.output.utf8,'');
 assert.equal(end.output.offset,448);assert.equal(end.output.next_offset,448);assert.equal(end.output.total_chars,448);
 assert.throws(()=>read(context,{call_id:'read-1',offset:449}),/inspection-range-invalid/);
});

test('tool schema has no authority-bearing selectors and remains opt-in',()=>{
 const name='read-inspection-evidence',definition=toolDefinitions([name])[0];
 assert.deepEqual(Object.keys(definition.function.parameters.properties),['call_id','offset','max_chars']);
 const call={id:'recover-1',type:'function',function:{name,arguments:'{"call_id":"read-1"}'}};
 assert.throws(()=>validateCalls([call],['read-file'],new Set(),[]),/tool-denied/);
 assert.equal(validateCalls([call],[name],new Set(),[])[0].arguments.call_id,'read-1');
});
