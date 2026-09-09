import test from 'node:test';
import assert from 'node:assert/strict';
import {pageObservation,projectPagedFiles,PAGE_CHARS} from './paging.mjs';
import {hash,stable} from './transport.mjs';
import {validateCalls,toolDefinitions} from './tools.mjs';
const text='x'.repeat(4999)+'😀'+'y'.repeat(4000),files={'a':hash(text)};
function entry(offset,id,source=text){
 const args={path:'a',offset},call={id,name:'read-file',arguments:args};
 const observation=pageObservation({ok:true,output:{path:'a',utf8:source,sha256:hash(source)}},args);
 return {calls:[call],observations:[observation],messages:[{role:'assistant',tool_calls:[{id,type:'function',function:{name:'read-file',arguments:JSON.stringify(args)}}]},{role:'tool',tool_call_id:id,content:stable(observation)}]};
}
test('pages preserve Unicode boundaries and require complete confirmed source coverage',()=>{
 const a=entry(0,'a'),b=entry(4999,'b');assert.equal(a.observations[0].output.next_offset,4999);
 assert.throws(()=>entry(5000,'bad'),/page-offset-invalid/);
 const h=[a,b];assert.equal(projectPagedFiles(h,files,new Set(['a']))[0].full_file_delivered,false);
 const f=projectPagedFiles(h,files,new Set(['a','b']))[0];assert.equal(f.full_file_delivered,true);assert.equal(f.first_missing_offset,null);
 assert.equal(projectPagedFiles([b],files,new Set(['b']))[0].full_file_delivered,false);
});
test('overlaps, gaps, unknown delivery and forged file bytes do not satisfy coverage',()=>{
 const a=entry(0,'a'),b=entry(4999,'b'),overlap=entry(4000,'c');
 assert.equal(projectPagedFiles([a,overlap,b],files,new Set(['a','b','c']))[0].full_file_delivered,true);
 assert.equal(projectPagedFiles([a,b],files,new Set())[0].full_file_delivered,false);
 const forged=structuredClone(b);forged.observations[0].output.utf8='z'+forged.observations[0].output.utf8.slice(1);forged.observations[0].output.page_sha256=hash(forged.observations[0].output.utf8);forged.messages[1].content=stable(forged.observations[0]);
 assert.throws(()=>projectPagedFiles([a,forged],files,new Set(['a','b'])),/page-assembled-hash-mismatch/);
 const wrong=structuredClone(b);wrong.observations[0].output.total_chars++;wrong.messages[1].content=stable(wrong.observations[0]);assert.throws(()=>projectPagedFiles([a,wrong],files),/page-range-invalid|page-source-drift/);
 const protocol=structuredClone(b);protocol.messages[1].content='{}';assert.throws(()=>projectPagedFiles([protocol],files),/page-protocol-invalid/);
});
test('page arguments are opt-in and original full small observations remain unchanged',()=>{
 const c=entry(0,'a').messages[0].tool_calls;assert.throws(()=>validateCalls(c,['read-file'],new Set(),[],false),/tool-arguments-invalid/);
 assert.equal(validateCalls(c,['read-file'],new Set(),[],true)[0].arguments.offset,0);
 assert.ok(toolDefinitions(['read-file'],true)[0].function.parameters.properties.offset);
 assert.equal(toolDefinitions(['read-file'])[0].function.parameters.properties.offset,undefined);
 const o={ok:true,output:{path:'a',utf8:'abc',sha256:hash('abc')}};assert.equal(pageObservation(o,{path:'a'}),o);
 assert.equal(PAGE_CHARS,5000);
});

test('assembled requirement attachment uses exact complete source, never a partial JSON page',async()=>{
 const {projectInspectedRequirements}=await import('./source-preservation.mjs');
 const source=JSON.stringify({requirements:['Preserve duplicate IDs and ordered results.'],padding:'x'.repeat(9000)}),base={files:{a:hash(source)}};
 const a=entry(0,'a',source),b=entry(5000,'b',source);
 const input={history:[a,b],base,observation_allowlist:['a']};
 assert.deepEqual(projectInspectedRequirements(input).fields,[]);
 assert.deepEqual(projectInspectedRequirements({...input,history:[a],paged:true}).fields,[]);
 const r=projectInspectedRequirements({...input,paged:true});assert.deepEqual(r.fields[0].value,['Preserve duplicate IDs and ordered results.']);assert.deepEqual(r.fields[0].source_call_ids,['a','b']);
 const bad=structuredClone(b);bad.observations[0].output.sha256='0'.repeat(64);bad.messages[1].content=stable(bad.observations[0]);
 assert.throws(()=>projectInspectedRequirements({...input,history:[a,bad],paged:true}),/page-range-invalid/);
});

test('v12 budget stays window-bound, explicit and accounts for missing page turns',async()=>{
 const {completionBudget,minimumCompletionTurns}=await import('./completion.mjs');
 const {createGlmClient}=await import('./transport.mjs');
 assert.deepEqual(completionBudget('budgeted-paging-v12',8000),{maximum_requests:16,maximum_tokenizer_requests:32,request_budget:'paging-v1',page_chars:4000});
 assert.equal(completionBudget('budgeted-paging-v12',10000).maximum_requests,12);
 assert.equal(completionBudget('assembled-paging-v11',8000).maximum_requests,12);
 const opts={chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer',maximum_requests:16};
 assert.throws(()=>createGlmClient(opts),/limits-exceed-candidate/);
 assert.equal(createGlmClient({...opts,request_budget:'paging-v1'}).maximum_requests,16);
 assert.throws(()=>createGlmClient({...opts,request_budget:'paging-v1',maximum_requests:17}),/limits-exceed-candidate/);
 const requirements={required_reads:['a','b'],archive_after_recycle:true};
 const state={files:[{path:'a',total_chars:9800,first_missing_offset:4000,full_file_delivered:false}]};
 assert.equal(minimumCompletionTurns(requirements,state,{page_chars:4000,recycled:true,archive_confirmed:false}),5);
});


test('next-page hint explicitly starts at zero and follows validated missing coverage',async()=>{
 const {nextPageRead}=await import('./paging.mjs');
 assert.deepEqual(nextPageRead(['new.json'],[]),{name:'read-file',arguments:{path:'new.json',offset:0}});
 assert.deepEqual(nextPageRead(['a'],[{path:'a',first_missing_offset:8000}]),{name:'read-file',arguments:{path:'a',offset:8000}});
 assert.equal(nextPageRead([],[]),null);
 assert.throws(()=>nextPageRead(['a'],[{path:'a',first_missing_offset:null}]),/page-next-read-invalid/);
});
