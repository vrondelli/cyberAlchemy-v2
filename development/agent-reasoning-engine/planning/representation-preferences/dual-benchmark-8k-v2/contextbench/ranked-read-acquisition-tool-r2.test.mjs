// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createRankedReadAdapter,validateRankedReadResult} from './ranked-read-acquisition-tool-r2.mjs';
import {attachObservationHandles,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const args={mode:'ranked',query:'first context',revision:'base',path_prefix:'',offset:0,limit:5};
const call={id:'actual-call-1',type:'function',function:{name:'search',arguments:JSON.stringify(args)}};
function fixture({texts=['alpha\nbeta\n','gamma\n'],failureAt=-1,error='repository.read-too-large-use-smaller-range',tamper=null,hintTamper=null}={}){
 const base_commit='a'.repeat(40),index_digest='b'.repeat(64),files=new Map(),sources=new Map();
 const hints=texts.map((text,i)=>{const path=`src/${i}.txt`,sha=hash(text);files.set(path,sha);sources.set(path,text);return {path,base_commit,content_sha256:sha,start_line:1,end_line:text.trimEnd().split('\n').length,score_units:10-i};});
 let queries=0;const calls=[];
 const source_hints={expected:{base_commit,index_digest,files,partial_index:false},query:async query=>{
  queries++;const output={schema:'are.ranked-source-hints/v1',index_digest,query_digest:hash(stable({query})),partial_index:false,omitted_query_terms:0,matching_windows:hints.length,hints:structuredClone(hints),omitted_hints:0,unreadable_matching_lines:0,unreadable_path_fallbacks:0};if(hintTamper)hintTamper(output);return output;
 }};
 const native=async(name,a)=>{calls.push({name,args:a});if(name==='search')return {ok:false,error:'original-native-error'};
  const i=calls.length-1;if(i===failureAt)return {ok:false,error};
  const text=sources.get(a.path),lines=text.split('\n');if(text.endsWith('\n'))lines.pop();
  const utf8=lines.slice(a.start_line-1,a.start_line-1+a.line_count).join('\n');
  const output={path:a.path,start_line:a.start_line,end_line:a.start_line+a.line_count-1,total_lines:lines.length,utf8,byte_count:Buffer.byteLength(utf8),source_sha256:files.get(a.path),source_revision:'base',base_commit};
  if(tamper)tamper(output);return {ok:true,output};
 };
 const rawExecute=createRankedReadAdapter({native,source_hints,snapshot:async path=>sources.get(path)});
 return {execute:(c,a)=>rawExecute({...c,function:{...c.function,arguments:JSON.stringify(a)}},a),rawExecute,evidence:async()=>({hints:await source_hints.query(args.query),expected:source_hints.expected,sources}),calls,queries:()=>queries};
}
test('exact source observations use actual search identity and stable handles',async()=>{
 const f=fixture(),r=await f.execute(call,args);assert.equal(r.output.observations.length,2);assert.equal(f.queries(),1);assert.equal(f.calls.length,2);assert.ok(f.calls.every(c=>c.name==='read_file'&&c.args.revision==='base'));assert.deepEqual(attachObservationHandles(call,r),r);
 assert.equal(r.output.observations[0].utf8,'alpha\nbeta');assert.ok(!r.output.observations[0].utf8.includes(args.query));
 const evidence=await f.evidence();assert.throws(()=>validateRankedReadResult({call:{...call,id:'forged'},args,result:r,...evidence}),/handle-binding/);
});
test('literal delegation preserves result and validation rejects before side effects',async()=>{
 const f=fixture();assert.deepEqual(await f.execute(call,{...args,mode:'literal'}),{ok:false,error:'original-native-error'});assert.equal(f.queries(),0);assert.ok(!Object.hasOwn(f.calls[0].args,'mode'));
 const g=fixture();assert.equal((await g.execute(call,{...args,limit:9,revision:'current'})).ok,false);assert.equal(g.queries(),0);assert.equal(g.calls.length,0);
});
test('size failure stops ordered reads without skipping or retrying',async()=>{
 const f=fixture({texts:['one\n','two\n','three\n'],failureAt:1}),r=await f.execute(call,args);assert.equal(f.calls.length,2);assert.equal(r.output.observations.length,1);assert.equal(r.output.ranked_read.read_stop_index,1);assert.equal(r.output.ranked_read.unattempted_hints,1);assert.equal(r.output.ranked_read.successful_reads,1);
});
test('other native failure aborts even after successful prefix',async()=>{
 const f=fixture({failureAt:1,error:'repository.invalid-path'});await assert.rejects(f.execute(call,args),/native-read-failed/);assert.equal(f.calls.length,2);
});
test('every observation field is checked against exact full source',async()=>{
 for(const key of ['path','start_line','end_line','total_lines','utf8','byte_count','source_sha256','source_revision','base_commit']){
  const f=fixture({tamper:o=>{o[key]=typeof o[key]==='number'?o[key]+1:'tampered';}});await assert.rejects(f.execute(call,args),/source-observation/,key);assert.equal(f.calls.length,1);
 }
 const extra=fixture({tamper:o=>{o.extra=true;}});await assert.rejects(extra.execute(call,args),/source-observation/);
});
test('tampered index hints abort before native reads',async()=>{
 for(const hintTamper of [o=>{o.hints[0].content_sha256='c'.repeat(64);},o=>{o.index_digest='d'.repeat(64);},o=>{o.hints[0].end_line=41;}]){
  const f=fixture({hintTamper});await assert.rejects(f.execute(call,args));assert.equal(f.calls.length,0);
 }
});
test('complete decorated response chooses bounded prefix; oversized first yields zero',async()=>{
 for(const texts of [['x'.repeat(3500)+'\n','y'.repeat(3500)+'\n'],['x'.repeat(9000)+'\n','y\n']]){
  const f=fixture({texts}),r=await f.execute(call,args);assert.ok(Buffer.byteLength(stable(r))<=8192);assert.equal(f.calls.length,2);assert.ok(r.output.observations.length<2);assert.equal(r.output.ranked_read.byte_omitted_windows,2-r.output.observations.length);assert.deepEqual(attachObservationHandles(call,r),r);
  if(texts[0].length>8192)assert.equal(r.output.observations.length,0);
 }
});
test('empty ranking and limited prefix reconcile counts',async()=>{
 const f=fixture({texts:[]}),empty=await f.execute(call,args);assert.equal(empty.output.observations.length,0);assert.equal(f.calls.length,0);
 const g=fixture(),r=await g.execute(call,{...args,limit:1});assert.equal(g.calls.length,1);assert.equal(r.output.ranked_read.unattempted_hints,1);
 const corrupt=structuredClone(r);corrupt.output.ranked_read.omitted_hints++;const a={...args,limit:1},evidence=await g.evidence();assert.throws(()=>validateRankedReadResult({call:{...call,function:{...call.function,arguments:JSON.stringify(a)}},args:a,result:corrupt,...evidence}),/omission-counts/);
});

test('actual call arguments cannot be substituted before execution',async()=>{
 const f=fixture();await assert.rejects(f.rawExecute({...call,function:{...call.function,arguments:JSON.stringify({...args,mode:'literal',query:'DIFFERENT'})}},args),/call-arguments/);assert.equal(f.queries(),0);assert.equal(f.calls.length,0);
});
test('independent decoder rejects source tampering even with recomputed handles',async()=>{
 const f=fixture(),r=await f.execute(call,args),evidence=await f.evidence();
 for(const [key,value] of [['source_revision','current'],['base_commit','bad'],['total_lines',-1],['extra',true],['utf8','forged']]){
  const changed=structuredClone(r);changed.output.observations[0][key]=value;
  if(key==='utf8')changed.output.observations[0].byte_count=Buffer.byteLength(value);
  const redecorated=attachObservationHandles(call,changed);
  assert.throws(()=>validateRankedReadResult({call,args,result:redecorated,...evidence}),/source-observation/);
 }
 assert.throws(()=>validateRankedReadResult({call,args,result:r}),/validation-evidence/);
});
