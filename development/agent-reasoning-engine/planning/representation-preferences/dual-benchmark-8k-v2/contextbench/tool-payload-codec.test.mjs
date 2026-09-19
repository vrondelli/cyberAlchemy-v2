import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {encodeToolPayload,decodeToolPayload} from './tool-payload-codec.mjs';
const events=readFileSync(new URL('./comparison-production-live-r1/runs_root/00/events.jsonl',import.meta.url),'utf8').trim().split(String.fromCharCode(10)).map(JSON.parse),original=events.find(e=>e.kind==='source-tool-result').output;
const encode=result=>encodeToolPayload({tool:'search',result}),decode=payload=>decodeToolPayload({tool:'search',payload});
test('observed twenty-result payload round-trips all fields with identical measured byte reduction',()=>{
 const before=structuredClone(original),r=encode(original);assert.equal(r.encoded,true);assert.equal(r.original_bytes,10967);assert.equal(r.payload_bytes,6254);assert.deepEqual(decode(r.payload),original);assert.deepEqual(original,before);assert.equal(r.payload.output.sources.length,5);
});
test('unknown fields, arbitrary handles and distinct revisions survive',()=>{
 const value=structuredClone(original);value.extra={future:['α',true,null,1.25]};value.output.next_field={a:3};
 const o=value.output.observations[0];o.future_field={opaque:'preserve'};o.retrieval_handle='custom:handle';
 value.output.observations[1]={...o,source_revision:'base',source_sha256:'a'.repeat(64)};
 assert.deepEqual(decode(encode(value).payload),value);
});
test('all other current tool envelopes pass through without changing values',()=>{
 for(const [tool,result]of [['read_file',{ok:true,output:original.output.observations[0]}],['read-file',{ok:true,output:original.output.observations[0]}],['list_files',{ok:true,output:{paths:['a'],next_offset:1,total:2}}],['apply_edits',{ok:true,output:{changed:['a']}}],['get_patch',{ok:true,output:{patch:'diff --git a/a b/a'}}],['search',{ok:false,error:{code:'invalid-arguments'}}],['search',{ok:true,output:{observations:[],next_offset:null}}]]){
  const r=encodeToolPayload({tool,result});assert.equal(r.encoded,false);assert.deepEqual(r.payload,result);assert.deepEqual(decodeToolPayload({tool,payload:r.payload}),result);
 }
});
test('encoding never expands a valid small payload',()=>{
 const value=structuredClone(original);value.output.observations=value.output.observations.slice(0,1);
 const r=encode(value);assert.ok(r.payload_bytes<=r.original_bytes);assert.deepEqual(decode(r.payload),value);
});
test('malformed dictionary references, field conflicts and noncanonical encodings reject',()=>{
 const mutations=[v=>v.output.observations[0].source_ref=99,v=>v.output.observations[0].source_ref=-1,v=>v.output.observations[0].source_ref=0.5,v=>v.output.observations[0].path='forged',v=>v.output.observations[0].derived_retrieval_handle=false,v=>v.output.observations[0].retrieval_handle='conflict',v=>v.output.sources.push(structuredClone(v.output.sources[0])),v=>v.output.sources[0].future='not-factored',v=>delete v.output.observations[0].utf8,v=>v.output.observations[0].byte_count++,v=>v.output.observation_encoding='unknown'];
 for(const mutate of mutations){const v=encode(original).payload;mutate(v);assert.throws(()=>decode(v));}
 assert.throws(()=>decodeToolPayload({tool:'read_file',payload:encode(original).payload}),/encoding/);
});
test('reserved names and non-JSON or excessive payloads cannot lose data silently',()=>{
 for(const mutate of [v=>v.output.observation_encoding='reserved',v=>v.output.sources=[],v=>v.output.observations[0].source_ref=0,v=>v.output.observations[0].derived_retrieval_handle=true]){const v=structuredClone(original);mutate(v);assert.throws(()=>encode(v),/reserved/);}
 for(const invalid of [undefined,NaN,-0,()=>{},Symbol('x'),new Date()])assert.throws(()=>encode({...original,invalid}));
 const cycle={};cycle.cycle=cycle;assert.throws(()=>encode(cycle));
 assert.throws(()=>encode({...original,large:'x'.repeat(262145)}),/bound/);
 const deep={};let cursor=deep;for(let i=0;i<40;i++)cursor=cursor.next={};assert.throws(()=>encode(deep),/structure-bound/);
 const arr=[];arr[2]=1;assert.throws(()=>encode({...original,arr}),/dense-array/);
 const withProperty=[];Object.defineProperty(withProperty,'hidden',{value:1});assert.throws(()=>encode({...original,withProperty}),/dense-array/);
 const getter={};Object.defineProperty(getter,'danger',{enumerable:true,get(){throw Error('getter executed');}});assert.throws(()=>encode(getter),/json-property/);
 const large=structuredClone(original);large.output.observations=Array(31).fill(large.output.observations[0]);assert.throws(()=>encode(large),/observation-bound/);
});
