// Contract tests; episode/receipt reconstruction is a later integration stage.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateRankQuery,validateHintOutput,projectHintOutput,rankSourcesName} from './ranked-source-hints-tool-r1.mjs';
import {observationItems,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const query='needle',sha='b'.repeat(64),base='a'.repeat(40),index='c'.repeat(64);
const fixture=()=>({schema:'are.ranked-source-hints/v1',index_digest:index,query_digest:createHash('sha256').update(stable({query})).digest('hex'),partial_index:false,omitted_query_terms:0,matching_windows:2,omitted_hints:0,unreadable_matching_lines:0,unreadable_path_fallbacks:0,hints:[1,2].map(n=>({path:'source'+n+'.txt',base_commit:base,content_sha256:sha,start_line:1,end_line:3,score_units:100}))});
const expected={index_digest:index,base_commit:base,partial_index:false,files:new Map([['source1.txt',sha],['source2.txt',sha]])};
test('query is closed, byte bounded and well-formed Unicode',()=>{
 assert.deepEqual(validateRankQuery({query:''}),{query:''});assert.throws(()=>validateRankQuery({query,extra:true}),/query-schema/);
 assert.throws(()=>validateRankQuery({query:'é'.repeat(2049)}),/query-byte-limit/);assert.throws(()=>validateRankQuery({query:'\ud800'}),/query-byte-limit/);
});
test('hints bind query, index, base and admitted file hashes',()=>{
 assert.equal(validateHintOutput({query,output:fixture(),expected}).hints.length,2);
 for(const change of [o=>o.query_digest=sha,o=>o.index_digest=sha,o=>o.hints[0].base_commit='d'.repeat(40),o=>o.hints[0].content_sha256=index,o=>o.hints[0].path='absent.txt',o=>o.partial_index=true]){
  const output=fixture();change(output);assert.throws(()=>validateHintOutput({query,output,expected}));
 }
});
test('forged source observation fields, unsafe paths and duplicate hints are rejected',()=>{
 for(const change of [o=>o.hints[0].read_id=sha,o=>o.hints[0].utf8='source',o=>o.observations=[],o=>o.hints[0].path='../escape',o=>o.hints[1]={...o.hints[0]},o=>o.hints[0].end_line=41]){
  const output=fixture();change(output);assert.throws(()=>validateHintOutput({query,output}));
 }
});
test('whole-hint projection preserves counters and native observer grants no credit',()=>{
 const output=fixture(),before=structuredClone(output);
 for(const keep of [2,1,0]){
  const projected=projectHintOutput({query,output,keep});assert.equal(projected.hints.length,keep);assert.equal(projected.omitted_hints,2-keep);assert.equal(projected.matching_windows,2);
  const call={id:'hint-call',type:'function',function:{name:rankSourcesName,arguments:JSON.stringify({query})}};
  assert.deepEqual(observationItems(call,{ok:true,output:projected}),[]);
 }
 assert.deepEqual(output,before);
});
test('actual Python capacity outputs validate against their admitted source manifests',()=>{
 for(const n of ['00','01','02','03']){
  const result=JSON.parse(readFileSync(new URL('./ranked-source-capacity-r1/'+n+'.json',import.meta.url))).result;
  validateHintOutput({query:'source',output:result.query_result,expected:{index_digest:result.index_digest,base_commit:result.base_commit,partial_index:result.manifest.partial,files:new Map(result.manifest.entries.filter(e=>e.status==='admitted').map(e=>[e.path,e.content_sha256]))}});
 }
});
