// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {appendPartialDefinitionMetadata as append} from './inline-typed-discovery-candidate-r2.mjs';
import {observationMaterial} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const digest='a'.repeat(64),result={ok:true,output:{path:'service.hpp',start_line:10,end_line:20,utf8:'return 1',byte_count:8,source_sha256:digest,source_revision:'base'}};
const fn={id:'f',kind:'function',qualified_name:'Service::run',signature:'int run()',signature_truncated:false,start_line:5,end_line:150};
const cls={...fn,id:'c',kind:'class',qualified_name:'Service',signature:'class Service',start_line:1,end_line:200};
const idx=definitions=>({status:'parsed',source_sha256:digest,definitions});
test('clean class-only orientation suggests ten lines, never full class',()=>{
 const output=append({result,index:idx([cls])});const hint=output.output.typed_navigation.candidates[0];
 assert.equal(hint.kind,'class');assert.equal(hint.read_file_args.line_count,10);
 assert.equal(hint.suggested_read_scope,'header-window-not-full-class');
 assert.deepEqual(observationMaterial('read',output.output),observationMaterial('read',result.output));
});
test('two nearest functions and one nearest class, maximum three',()=>{
 const defs=[cls,{...cls,id:'outer',start_line:1,end_line:500},fn,...[2,3,4].map(n=>({...fn,id:'f'+n,end_line:150+n}))];
 const hints=append({result,index:idx(defs)}).output.typed_navigation;
 assert.deepEqual(hints.candidates.map(c=>c.id),['f','f2','c']);assert.equal(hints.omitted_candidates,3);
 assert.equal(hints.candidates[0].read_file_args.line_count,100);
});
test('three functions if no class; no contained or unrelated suggestions',()=>{
 assert.equal(append({result,index:idx([{...fn,start_line:11,end_line:19},{...cls,start_line:25,end_line:30}])}),result);
 assert.equal(append({result,index:idx([fn,...[2,3,4].map(n=>({...fn,id:'f'+n}))])}).output.typed_navigation.candidates.length,3);
});
test('identity and failed parse checks fail closed',()=>{
 assert.equal(append({result,index:{...idx([cls]),source_sha256:'b'.repeat(64)}}),result);
 assert.equal(append({result:{...result,output:{...result.output,source_revision:'current'}},index:idx([cls])}).output.typed_navigation,undefined);
 assert.equal(append({result,index:{...idx([cls]),status:'parse-error'}}),result);
 assert.equal(append({result,index:idx([{...cls,start_line:-1}])}),result);
});
test('explicit incomplete parse and cap; oversized function cannot suppress small class',()=>{
 const index={...idx([{...fn,signature:'x'.repeat(5000)},cls]),status:'parsed-partial',incomplete_parse:true};
 const hints=append({result,index}).output.typed_navigation;
 assert.equal(hints.incomplete_parse,true);assert.deepEqual(hints.candidates.map(c=>c.id),['c']);
 assert.ok(Buffer.byteLength(JSON.stringify(hints))<=4096);
 assert.equal(append({result,index,maximumBytes:100}),result);
});
