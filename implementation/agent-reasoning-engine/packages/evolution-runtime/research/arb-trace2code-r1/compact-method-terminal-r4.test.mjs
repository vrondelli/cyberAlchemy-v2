// Synthetic successful/failed request envelopes only; no models/reference labels.
// Open Questions: evidence/G01-COMPACT-METHOD-TERMINAL-R4.json.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {buildMethodHandleTable,methodHandleTool,methodHandleMessage,selectMethodHandleSubmission,METHOD_HANDLE_TOOL} from './compact-method-terminal-r4.mjs';
import {stable,attachObservationHandles,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {capturePublicResponse} from '../../../../benchmarks/contextbench-v1/final-selection.mjs';
const sha=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
function sourceMessages(n=1,sameFile=false){
 const calls=[],outputs=[];
 for(let i=0;i<n;i++){
  const source='void f'+i+'() {}',path=sameFile?'A.java':'A'+i+'.java';
  const call={id:'read-'+i,type:'function',function:{name:'read_file',arguments:stable({method_id:'m'+i,path,start_line:1})}};
  const output=attachObservationHandles(call,{ok:true,output:{path,start_line:1,end_line:1,utf8:source,byte_count:Buffer.byteLength(source),
   source_sha256:sha(source),method_source_sha256:sha(source),method_id:'m'+i,source_byte_start:0,source_byte_end:Buffer.byteLength(source),complete_method:true}});
  calls.push(call);outputs.push({role:'tool',tool_call_id:call.id,content:stable(output)});
 }
 return n?[{role:'assistant',tool_calls:calls},...outputs]:[];
}
function fixture({n=1,sameFile=false,raw=false,selected=['h0'],source=null}={}){
 const messages=source??sourceMessages(n,sameFile),table=buildMethodHandleTable({captures:[],receipts:[],messages});
 const value={summary:'Brief source localization',context_handles:selected};
 const public_response=raw?{finish_reason:'stop',message:{role:'assistant',content:stable(value)}}:
  {finish_reason:'tool_calls',message:{role:'assistant',tool_calls:[{id:'terminal',type:'function',function:{name:METHOD_HANDLE_TOOL,arguments:stable(value)}}]}};
 const f={messages,table,public_response,receipts:[{kind:'model',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,
  dispatched:true,status:200,input_tokens:400,output_tokens:20,finish_reason:public_response.finish_reason}]};
 rebind(f);return f;
}
function rebind(f,change=p=>p){
 const p=change({messages:[...f.messages,methodHandleMessage(f.table)],tools:[methodHandleTool(f.table)]});
 const prompt=stable(p),r=f.receipts[0];r.request_sha256=sha(stable(bodyForReceipt(prompt,r)));
 f.captures=[{prompt,prompt_sha256:sha(prompt)}];
 f.response_capture=capturePublicResponse({receipt:r,final_bytes:stable(f.public_response)},0);
}
const select=f=>selectMethodHandleSubmission(f);
test('pending full source is a candidate only, then original successful request proves its exact delivery',()=>{
 for(const raw of [false,true]){
  const f=fixture({raw});assert.equal(f.table.bindings.length,1);
  assert.equal(bindDelivery({captures:[],receipts:[]}).read_observations.length,0);
  const s=select(f);assert.deepEqual(s.final_read_ids,[f.table.bindings[0].read_id]);
  assert.deepEqual(s.model_context_handles,['h0']);assert.equal(s.request_sha256,f.receipts[0].request_sha256);
 }
});
test('all ten acquired methods remain addressable; eight-file cap is not an eight-read slate',()=>{
 const f=fixture({n:10,sameFile:true,selected:Array.from({length:10},(_,i)=>'h'+i)});
 assert.equal(f.table.bindings.length,10);assert.equal(select(f).final_read_ids.length,10);
 const eight=fixture({n:10,selected:Array.from({length:8},(_,i)=>'h'+i)});assert.equal(select(eight).final_read_ids.length,8);
 const nine=fixture({n:10,selected:Array.from({length:9},(_,i)=>'h'+i)});assert.throws(()=>select(nine),/eight-file-cap/);
 assert.throws(()=>fixture({n:11}),/original-read-action-cap/);
});
test('a self-consistent narrowed table cannot hide delivered evidence or change private read coordinates',()=>{
 const f=fixture({n:4});f.table.bindings.pop();f.table.table_sha256=sha({schema_version:f.table.schema_version,bindings:f.table.bindings});rebind(f);
 assert.throws(()=>select(f),/all-handles-confirmed-no-slate/);
 const bad=fixture({n:2});[bad.table.bindings[0].read_id,bad.table.bindings[1].read_id]=[bad.table.bindings[1].read_id,bad.table.bindings[0].read_id];
 bad.table.table_sha256=sha({schema_version:bad.table.schema_version,bindings:bad.table.bindings});rebind(bad);
 assert.throws(()=>select(bad),/all-handles-confirmed-no-slate/);
});
test('deferral notices expose no withheld-source handles and cannot be promoted to delivery',()=>{
 const original=sourceMessages(),withheld=structuredClone(original);
 withheld[1].content=stable({ok:false,error:'tool-output-deferred',execution_succeeded:true,payload_delivered:false,result_digest:sha(original[1].content)});
 const honest=fixture({source:withheld,selected:[]});assert.equal(honest.table.bindings.length,0);assert.deepEqual(select(honest).final_read_ids,[]);
 const promoted=fixture();promoted.messages=withheld;rebind(promoted);assert.throws(()=>select(promoted),/all-handles-confirmed-no-slate/);
});
test('exact request table/tool declarations, capture integrity and terminality are mandatory',()=>{
 const undeclared=fixture();rebind(undeclared,p=>({...p,tools:[]}));assert.throws(()=>select(undeclared),/exact-declared-tool/);
 const missing=fixture();rebind(missing,p=>({...p,messages:p.messages.slice(0,-1)}));assert.throws(()=>select(missing),/exact-request-table/);
 const duplicate=fixture();rebind(duplicate,p=>({...p,messages:[...p.messages,p.messages.at(-1)]}));assert.throws(()=>select(duplicate),/exact-request-table/);
 const tampered=fixture();tampered.table.bindings[0].path='foreign.java';assert.throws(()=>select(tampered),/table-digest/);
 const capture=fixture();capture.response_capture.public_response.message.tool_calls[0].function.arguments='{}';assert.throws(()=>select(capture),/capture-digest/);
 const later=fixture();later.receipts.push({...later.receipts[0]});assert.throws(()=>select(later),/not-terminal-response/);
});
test('unsuccessful, uncertain and unknown-usage responses never validate prospective source',()=>{
 for(const change of [{status:503},{dispatch_uncertain:true},{input_tokens:null}]){
  const f=fixture();Object.assign(f.receipts[0],change);
  const c=f.response_capture;c.receipt_sha256=sha(f.receipts[0]);delete c.capture_sha256;c.capture_sha256=sha(c);
  assert.throws(()=>select(f),/receipt-mismatch|delivery-or-usage/);
 }
});
test('entire terminal envelope is validated; no partial JSON, fences, duplicates, extra fields or long summary rescue',()=>{
 const invalid=[
  '{"summary":"unfinished',
  '```json\n{"summary":"x","context_handles":["h0"]}\n```',
  '{"summary":"x","summary":"y","context_handles":["h0"]}',
  stable({summary:'x',context_handles:['h0','h0']}),stable({summary:'x',context_handles:['h9']}),
  stable({summary:'x',context_handles:['h0'],extra:true}),stable({summary:'x'.repeat(161),context_handles:['h0']})
 ];
 for(const args of invalid){const f=fixture();f.public_response.message.tool_calls[0].function.arguments=args;rebind(f);assert.throws(()=>select(f),/invalid-json|invalid-schema|duplicate-handles/);}
 const mixed=fixture();mixed.public_response.message.tool_calls.push(mixed.messages[0].tool_calls[0]);rebind(mixed);assert.throws(()=>select(mixed),/terminal-tool-required/);
});
test('formatter is deterministic and lossless, concise aliases reduce serialized bytes not proven provider tokens',()=>{
 const f=fixture({n:10,sameFile:true,selected:Array.from({length:10},(_,i)=>'h'+i)}),before=stable(f.messages);
 const again=buildMethodHandleTable({captures:[],receipts:[],messages:f.messages});assert.deepEqual(again,f.table);assert.equal(stable(f.messages),before);
 const compact=stable({summary:'Brief',context_handles:f.table.bindings.map(r=>r.handle)}),full=stable({summary:'Brief',context_read_ids:f.table.bindings.map(r=>r.read_id)});
 assert.ok(Buffer.byteLength(full)-Buffer.byteLength(compact)>600);
 for(const r of f.table.bindings)assert.ok(!methodHandleMessage(f.table).content.includes(r.read_id));
});
