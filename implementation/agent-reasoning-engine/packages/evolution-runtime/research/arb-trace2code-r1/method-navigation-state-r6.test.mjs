// Synthetic public tool envelopes; no providers, filesystem source or evaluator labels.
// Open Questions: evidence/G01-METHOD-NAVIGATION-STATE-R6.json.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {collectConfirmedMethodNavigation as collect,buildMethodNavigationState as build,verifyMethodNavigationState as verify} from './method-navigation-state-r6.mjs';
import {stable,bodyForReceipt} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex'),caseId='synthetic-case';
const clone=x=>({...JSON.parse(stable(x)),measure_tokens:x.measure_tokens});
const method=(i=0)=>({method_id:'p/A.java#method@'+i,name:'f'+i,kind:'method',has_body:true,parameter_types_syntax:[],
 source_span:{complete:true,start_line:i+1,end_line:i+2,start_utf8:i*100,end_utf8:i*100+99}});
function output(operation,extra={}){return {schema:['runtime_status','list_runtime_methods'].includes(operation)?'are.adaptive-runtime-view/v1':'are.canonical-method-view/v1',
 operation,case_id:caseId,status:'page',authority_effect:'none',resolved_call_graph:false,total:1,offset:0,next_offset:null,items:[method()],...extra};}
const runtime=available=>output('runtime_status',{status:available?'runtime-status':'runtime-unavailable',runtime_available:available,source_case_retained:true,
 ...(available?{compiled_methods:10,reported_positive_methods:2}:{reason:'not-built'})});
function fixture(operation='list_methods',args={path:'p/A.java'},out=output(operation),id='c1'){
 const call={id,type:'function',function:{name:operation,arguments:stable(args)}};
 const messages=[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:id,content:stable({ok:true,output:out})}];
 const f={caseId,captures:[],receipts:[],generation:1,measure_tokens:async()=>200,messages};rebind(f);return f;
}
function rebind(f){const prompt=stable({messages:f.messages,tools:[]});const receipt={kind:'model',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,
 dispatched:true,status:200,input_tokens:400,output_tokens:20};receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));
 f.captures=[{prompt,prompt_sha256:sha(prompt)}];f.receipts=[receipt];}
test('exact native method IDs/coordinates/page cursors survive and reconstruction is deterministic',async()=>{
 const f=fixture(),p=await build(f);assert.equal(p.material.pages[0].items[0].method_id,method().method_id);
 assert.deepEqual(p.material.pages[0].items[0].source_span,method().source_span);
 assert.equal(p.material.pages[0].next_offset,null);assert.equal(p.provenance.length,1);
 assert.equal(p.provenance[0].confirmed_receipts[0],0);assert.equal(p.source_reads,0);
 assert.equal((await verify(p,f)).ok,true);const bad=structuredClone(p);bad.material.pages[0].items[0].name='forged';assert.equal((await verify(bad,f)).ok,false);
});
test('only successful confirmed model requests count; pending, tokenizer, rejected or withheld outputs do not',async()=>{
 const f=fixture();assert.equal(collect({...f,receipts:[]}).observations.length,0);
 for(const change of [{kind:'tokenizer'},{dispatched:false},{status:503},{failure_code:'rejected'}]){
  const x=clone(f);Object.assign(x.receipts[0],change);assert.equal(collect(x).observations.length,0);
 }
 const deferred=fixture();deferred.messages[1].content=stable({ok:false,error:'tool-output-deferred',execution_succeeded:true,payload_delivered:false});rebind(deferred);
 assert.equal(collect(deferred).observations.length,0);assert.equal(await build(deferred),null);
 assert.equal(await build({...f,generation:0}),null);
});
test('any uncertain or unknown-spend history stops before projection, including earlier failed receipts',()=>{
 const f=fixture();for(const change of [{dispatch_uncertain:true},{input_tokens:null},{output_tokens:null}]){
  const x=clone(f);Object.assign(x.receipts[0],change);assert.throws(()=>collect(x),/uncertain-history|unknown-history/);
 }
 const old={...f.receipts[0],status:503,dispatch_uncertain:true};assert.throws(()=>collect({...f,receipts:[old,...f.receipts]}),/uncertain-history/);
});
test('capture/receipt digest drift rejects, and output scope/operation/closed-argument mismatches reject',()=>{
 const f=fixture(),bad=clone(f);bad.captures[0].prompt+=' ';assert.throws(()=>collect(bad),/capture.digest/);
 const wrong=clone(f);wrong.receipts[0].request_sha256='0'.repeat(64);assert.throws(()=>collect(wrong),/capture-not-found/);
 for(const extra of [{case_id:'foreign'},{operation:'list_files'},{resolved_call_graph:true},{schema:'wrong'},{status:'invented'}])assert.throws(()=>collect(fixture('list_methods',{path:'p/A.java'},output('list_methods',extra))));
 assert.throws(()=>collect(fixture('list_methods',{path:'p/A.java',case_id:caseId})),/closed-arguments/);
 assert.throws(()=>collect(fixture('list_methods',{path:'../secret'})),/source-path/);
});
test('malformed/duplicate-key JSON, wrong filters, source coordinates and cursor drift fail closed',()=>{
 const f=fixture();f.messages[1].content='{"ok":true,"ok":false}';rebind(f);assert.throws(()=>collect(f),/invalid-json/);
 const fenced=fixture();fenced.messages[0].tool_calls[0].function.arguments='```json\n{}\n```';rebind(fenced);assert.throws(()=>collect(fenced),/invalid-json/);
 assert.throws(()=>collect(fixture('list_methods',{path:'p/A.java',name:'other'})),/name-filter/);
 assert.throws(()=>collect(fixture('list_methods',{path:'p/A.java',arity:2})),/arity-filter/);
 const invalid=method();invalid.source_span.end_line=0;assert.throws(()=>collect(fixture('list_methods',{path:'p/A.java'},output('list_methods',{items:[invalid]}))),/span-coordinates/);
 assert.throws(()=>collect(fixture('list_methods',{path:'p/A.java'},output('list_methods',{next_offset:1}))),/page-cursor/);
});
test('repeat delivery is deduplicated but conflicts, duplicate output and tool identity collisions reject',()=>{
 const f=fixture();const repeated={...f,captures:[...f.captures,...f.captures],receipts:[...f.receipts,...f.receipts]};
 assert.equal(collect(repeated).observations.length,1);assert.deepEqual(collect(repeated).observations[0].confirmed_receipts,[0,1]);
 const g=fixture('list_methods',{path:'p/A.java'},output('list_methods',{items:[method(1)]}));
 assert.throws(()=>collect({...f,captures:[...f.captures,...g.captures],receipts:[...f.receipts,...g.receipts]}),/visible-version-conflict/);
 const dup=fixture();dup.messages.push(dup.messages[1]);rebind(dup);assert.throws(()=>collect(dup),/duplicate-tool-output/);
 const clash=fixture();clash.messages.unshift({role:'assistant',tool_calls:[{...clash.messages[0].tool_calls[0],function:{name:'list_files',arguments:'{}'}}]});rebind(clash);assert.throws(()=>collect(clash),/identity-conflict|call-conflict/);
});
test('file items retain paths/hashes and actual next cursor rather than empty paths markers',async()=>{
 const item={path:'p/A.java',source_sha256:'a'.repeat(64),methods:3,references:2,unavailable_references:1};
 const f=fixture('list_files',{limit:1},output('list_files',{total:4,next_offset:1,items:[item]}));
 const p=await build(f);assert.deepEqual(p.material.pages[0].items,[item]);assert.equal(p.material.pages[0].next_offset,1);
 assert.ok(!p.text.includes('read_id'));assert.equal(p.source_reads,0);
});
test('missing runtime and unresolved syntactic references remain honest metadata, not relevance or source',async()=>{
 const r=await build(fixture('runtime_status',{},runtime(false)));assert.equal(r.material.pages[0].runtime_available,false);
 assert.equal(r.material.pages[0].source_case_retained,true);assert.ok(r.material.posture.includes('does not exclude source'));
 const item={reference_ordinal:1,kind:'method-invocation',target_syntax:'obj.f',argument_count:0,enclosing_method_id:method().method_id,
  inside_lambda:false,resolution:'unresolved-syntactic-reference',source_span:method().source_span};
 const p=await build(fixture('list_references',{path:'p/A.java',method_id:method().method_id},output('list_references',{items:[item]})));
 assert.equal(p.material.pages[0].items[0].resolution,item.resolution);assert.equal(p.source_reads,0);assert.ok(!p.text.includes('causal_probability'));
});
test('runtime coordinate rows keep conservative posture and honor filters without asserting typed calls',async()=>{
 const item={class_name:'p.A',name:'f',descriptor:'()V',path:'p/A.java',status:'unique-coordinate-association',source_method_id:method().method_id,
  reported:true,reported_positive:true,type_attributed_signature:false,test_exclusive:false,negative_relevance_inference:false};
 const f=fixture('list_runtime_methods',{positive_only:true,class_name:'p.A'},output('list_runtime_methods',{items:[item]}));
 const p=await build(f);assert.equal(p.material.pages[0].items[0].type_attributed_signature,false);
 assert.throws(()=>collect(fixture('list_runtime_methods',{positive_only:true},output('list_runtime_methods',{items:[{...item,reported_positive:false}]}))),/positive-filter/);
 assert.throws(()=>collect(fixture('list_runtime_methods',{},output('list_runtime_methods',{items:[{...item,test_exclusive:true}]}))),/runtime-posture/);
});
test('whole-item fitting is bounded, exposes omissions and charges at most four exact measurements',async()=>{
 const items=Array.from({length:20},(_,i)=>method(i)),f=fixture('list_methods',{path:'p/A.java',limit:20},output('list_methods',{items,total:20}));
 let measured=0;f.measure_tokens=async t=>{measured++;return Math.ceil(Buffer.byteLength(t)/2);};
 const p=await build({...f,max_bytes:1600});assert.ok(Buffer.byteLength(p.text)<=1600);assert.ok(p.measured_tokens<=512);
 assert.ok(measured<=4);assert.equal(p.fit.tokenizer_calls,measured);assert.ok(p.fit.evicted_items>0);
 assert.equal(p.material.pages[0].omitted_items+p.material.pages[0].items.length,20);
 assert.equal(p.provenance[0].fact.items.length,20);assert.equal(p.material.pages[0].next_offset,null);
 const impossible=fixture();await assert.rejects(()=>build({...impossible,measure_tokens:async()=>513}),/token-cap-too-small/);
 await assert.rejects(()=>build({...impossible,measure_tokens:async()=>null}),/invalid-token-measurement/);
});
test('page cap counts omitted items, uses observed recency and never mutates original captured outputs',async()=>{
 const a=fixture(),b=fixture('list_methods',{path:'p/A.java'},output('list_methods',{items:[method(1)]}),'c2');
 const f={...a,captures:[...a.captures,...b.captures],receipts:[...a.receipts,...b.receipts]};
 const before=stable(f.captures),p=await build({...f,max_pages:1});assert.equal(p.material.pages.length,1);
 assert.equal(p.material.pages[0].items[0].method_id,method(1).method_id);assert.equal(p.material.omitted.pages,1);assert.equal(p.material.omitted.items,1);
 assert.equal(stable(f.captures),before);assert.equal(p.provenance.length,2);
});
test('capacity notices preserve inability and cursor; invalid budgets cannot widen original state caps',async()=>{
 const f=fixture('list_methods',{path:'p/A.java'},output('list_methods',{status:'metadata-capacity-exceeded',total:10,offset:0,next_offset:0,items:undefined}));
 const p=await build(f);assert.equal(p.material.pages[0].status,'metadata-capacity-exceeded');assert.equal(p.material.pages[0].next_offset,0);assert.equal(p.source_reads,0);
 for(const limits of [{max_bytes:4097},{max_tokens:513},{max_pages:9},{generation:-1}])await assert.rejects(()=>build({...fixture(),...limits}),/limits/);
});
