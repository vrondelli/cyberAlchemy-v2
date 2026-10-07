// Synthetic fixtures only. Open Questions: evidence/G01-CANONICAL-METHOD-VIEWS-R1.json.
import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createMethodViewHandler,validateMethodViewRequest,REPLY_CAP} from './canonical-method-view-policy-r1.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture({source='void x(){ /* 🧪 */ }',parameters=['int'],count=2,calls=[]}={}){
 const raw=Buffer.from(source),path='p/$Type.java';
 const methods=Array.from({length:count},(_,i)=>({entity_id:path+'#method@'+i,name:'x',kind:'method',has_body:true,
  owner_class_id:'owner',parameter_types_syntax:i===0?parameters:['String'],
  span:{complete:true,start_utf8:0,end_utf8:raw.length,start_utf16:0,end_utf16:source.length,start_line:1,end_line:1,source}}));
 const record={path,source_sha256:sha(raw),methods,calls,classes:[],unavailable_reference_spans:calls.filter(c=>!c.span.complete).length};
 let current=raw,basis=true;
 const request=createMethodViewHandler({caseIds:['case'],loadCase:()=>[record],readSource:()=>current,
  validateBasis:()=>{if(!basis)throw Error('basis-drift');}});
 return {request,raw,record,setSource:value=>{current=value;},setBasis:value=>{basis=value;}};
}
test('closed fields, prototype operation names and unsafe paths rejected',()=>{
 for(const input of [{operation:'get_method',case_id:'case',method_id:'id',root:'/tmp'},
  {operation:'constructor',case_id:'case'},{operation:'__proto__',case_id:'case'},
  {operation:'list_methods',case_id:'case',path:'../bad'},
  {operation:'list_files',case_id:'case',limit:0},{operation:'list_files',case_id:'case',offset:-1},
  {operation:'get_method',case_id:'case',method_id:'id',max_source_bytes:32769}])
  assert.throws(()=>validateMethodViewRequest(input));
});
test('pagination preserves every overload without implicit resolution',()=>{
 const {request,record}=fixture();
 const first=request({operation:'list_methods',case_id:'case',path:record.path,limit:1});
 const second=request({operation:'list_methods',case_id:'case',path:record.path,offset:first.next_offset,limit:1});
 assert.equal(first.total,2);assert.equal(first.next_offset,1);assert.equal(second.next_offset,null);
 assert.notEqual(first.items[0].method_id,second.items[0].method_id);
 assert.equal(request({operation:'list_methods',case_id:'case',path:record.path,arity:1}).total,2);
});
test('whole Unicode source with exact provenance, no runtime or graph claim',()=>{
 const {request,record,raw}=fixture();
 const response=request({operation:'get_method',case_id:'case',method_id:record.methods[0].entity_id});
 assert.equal(response.status,'method-source');assert.equal(response.source,raw.toString());
 assert.equal(response.method_source_sha256,sha(raw));assert.equal(response.source_bytes,raw.length);
 assert.equal(response.complete_source_returned,true);assert.equal(response.runtime_method_binding,false);
 assert.equal(response.resolved_call_graph,false);assert.equal(response.tokenizer_admitted,false);
});
test('byte capacity explicit without partial source',()=>{
 const {request,record}=fixture({source:'漢'.repeat(100)});
 const response=request({operation:'get_method',case_id:'case',method_id:record.methods[0].entity_id,max_source_bytes:299});
 assert.equal(response.status,'source-capacity-exceeded');assert.equal(response.source_bytes,300);
 assert.equal(response.complete_source_returned,false);assert.equal(Object.hasOwn(response,'source'),false);
});
test('wire capacity counts JSON escaping, not just source bytes',()=>{
 const {request,record}=fixture({source:'"'.repeat(20000)});
 const response=request({operation:'get_method',case_id:'case',method_id:record.methods[0].entity_id});
 assert.equal(response.status,'reply-capacity-exceeded');assert.ok(Buffer.byteLength(JSON.stringify(response))<=REPLY_CAP);
 assert.equal(Object.hasOwn(response,'source'),false);
});
test('source and basis drift fail closed',()=>{
 const f=fixture();f.setSource(Buffer.from('changed'));
 assert.throws(()=>f.request({operation:'get_method',case_id:'case',method_id:f.record.methods[0].entity_id}),/canonical-source-drift/);
 f.setBasis(false);assert.throws(()=>f.request({operation:'list_files',case_id:'case'}),/basis-drift/);
});
test('unknown targets never become arbitrary filesystem reads',()=>{
 const f=fixture();assert.equal(f.request({operation:'list_files',case_id:'unknown'}).status,'unknown-case');
 assert.equal(f.request({operation:'get_method',case_id:'case',method_id:'secret'}).status,'unknown-method');
 assert.equal(f.request({operation:'list_methods',case_id:'case',path:'safe/unknown.java'}).status,'unknown-source');
});
test('unavailable references retained and unresolved names do not acquire callees',()=>{
 const calls=[{kind:'constructor',target_syntax:'Type',argument_count:0,enclosing_method_id:null,inside_lambda:false,
  resolution:'unavailable-source-position',span:{complete:false,reason:'compiler-source-position-unavailable'}},
  {kind:'invocation',target_syntax:'x',argument_count:1,enclosing_method_id:'method',inside_lambda:false,
   resolution:'unresolved-syntactic-reference',span:{complete:true,start_utf8:0,end_utf8:1,source:'x'}}];
 const f=fixture({calls});const r=f.request({operation:'list_references',case_id:'case',path:f.record.path});
 assert.equal(r.total,2);assert.equal(r.items[0].resolution,'unavailable-source-position');
 assert.equal(Object.hasOwn(r.items[1],'callee_method_id'),false);
});
test('oversized metadata stays at same offset, never silently skipped',()=>{
 const f=fixture({parameters:['T'.repeat(40000)]});
 const r=f.request({operation:'list_methods',case_id:'case',path:f.record.path});
 assert.equal(r.status,'metadata-capacity-exceeded');assert.equal(r.offset,0);assert.equal(r.next_offset,0);
 const get=f.request({operation:'get_method',case_id:'case',method_id:f.record.methods[0].entity_id});
 assert.equal(get.status,'reply-capacity-exceeded');assert.ok(Buffer.byteLength(JSON.stringify(get))<=REPLY_CAP);
});
test('oversized source does not leak oversized metadata in capacity reply',()=>{
 const f=fixture({source:'x'.repeat(40000),parameters:['T'.repeat(40000)]});
 const r=f.request({operation:'get_method',case_id:'case',method_id:f.record.methods[0].entity_id});
 assert.equal(r.status,'source-capacity-exceeded');assert.ok(Buffer.byteLength(JSON.stringify(r))<=REPLY_CAP);
});
