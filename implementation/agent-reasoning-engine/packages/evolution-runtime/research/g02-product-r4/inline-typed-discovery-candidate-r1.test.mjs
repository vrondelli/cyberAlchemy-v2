// Source-only tests. Open Questions: evidence/G02-TYPED-NAVIGATION-R2.json.
import{test}from'node:test';import assert from'node:assert/strict';
import{appendPartialDefinitionMetadata as append}from'./inline-typed-discovery-candidate-r1.mjs';
import{observationItems,observationMaterial}from'../../../../benchmarks/contextbench-v1/delivery.mjs';
const digest='a'.repeat(64),result={ok:true,output:{path:'service.py',start_line:10,end_line:20,utf8:'return 1',byte_count:8,source_sha256:digest,source_revision:'base'}};
const definition={id:'d-1',kind:'function',qualified_name:'Service::run',signature:'def run(self):',signature_truncated:false,start_line:5,end_line:150};
const index={status:'parsed',source_sha256:digest,definitions:[definition]};
test('partial function hint preserves exact ordinary read and delivery identity',()=>{
 const r=append({result,index});assert.equal(r.output.typed_navigation.discovery_only,true);
 const call={id:'read1',function:{name:'read_file'}};
 const original=observationItems(call,result)[0],augmented=observationItems(call,r)[0];
 assert.deepEqual(observationMaterial(original.tool_call_id,original.o),observationMaterial(augmented.tool_call_id,augmented.o));
 assert.equal(r.output.typed_navigation.candidates[0].read_file_args.line_count,100);
 assert.equal(r.output.start_line,10);assert.equal(r.output.end_line,20);
});
test('fully contained functions and unrelated definitions are not suggested',()=>{
 const i={...index,definitions:[{...definition,start_line:11,end_line:19},{...definition,start_line:30,end_line:40}]};
 assert.equal(append({result,index:i}),result);
});
test('source mismatch, current revision and failed parse do not attach hints',()=>{
 assert.equal(append({result,index:{...index,source_sha256:'b'.repeat(64)}}),result);
 const current={...result,output:{...result.output,source_revision:'current'}};assert.equal(append({result:current,index}),current);
 assert.equal(append({result,index:{...index,status:'parse-error'}}),result);
});
test('explicit partial parse flag, max3 and metadata byte cap',()=>{
 const i={...index,status:'parsed-partial',incomplete_parse:true,definitions:Array.from({length:10},(_,n)=>({...definition,id:'d-'+n}))};
 const r=append({result,index:i});assert.equal(r.output.typed_navigation.candidates.length,3);
 assert.equal(r.output.typed_navigation.omitted_candidates,7);assert.equal(r.output.typed_navigation.incomplete_parse,true);
 assert.ok(Buffer.byteLength(JSON.stringify(r.output.typed_navigation))<=4096);
 const huge={...index,definitions:[{...definition,signature:'x'.repeat(5000)}]};assert.equal(append({result,index:huge}),result);
});
