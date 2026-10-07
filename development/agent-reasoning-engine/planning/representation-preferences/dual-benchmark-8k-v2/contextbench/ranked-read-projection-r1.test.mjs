// Open questions: RANKED-READ-PROJECTION-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {fixture} from './ranked-read-test-fixture-r1.mjs';
import {projectRankedRead,validateRankedReadView} from './ranked-read-projection-r1.mjs';
import {bindRankedReadDelivery} from './ranked-read-delivery-r2.mjs';
import {admitToolBatch} from './ranked-read-admission-r1.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function delivered(f,result){
 const wire=structuredClone(f.wire);wire.messages[1].content=stable(result);const prompt=stable(wire);
 const receipt={...f.receipts[0],request_sha256:hash(stable(bodyForReceipt(prompt,f.receipts[0])))};
 return {...f,captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]};
}
async function two(){
 const f=await fixture(),e=f.ranked_evidence.get(f.call.id);
 const second={...e.hints.hints[0],start_line:2,end_line:2,score_units:9};e.hints.hints.push(second);e.hints.matching_windows=2;
 // Use the actual adapter to produce a second bound source window.
 const {createRankedReadAdapter}=await import('./ranked-read-acquisition-tool-r2.mjs');
 const adapter=createRankedReadAdapter({source_hints:{expected:e.expected,query:async()=>e.hints},snapshot:async()=>e.sources.get('source.txt'),native:async(name,a)=>({ok:true,output:{path:'source.txt',base_commit:e.expected.base_commit,source_sha256:e.expected.files.get('source.txt'),source_revision:'base',total_lines:2,start_line:a.start_line,end_line:2,utf8:a.start_line===1?'alpha\nbeta':'beta',byte_count:a.start_line===1?10:4}})});
 e.result=await adapter(f.call,JSON.parse(f.call.function.arguments));f.result=e.result;return f;
}
test('prefix retains raw counters and exact native handles, never invents paging',async()=>{
 const f=await two(),e=f.ranked_evidence.get(f.call.id),view=projectRankedRead({evidence:e,keep:1});
 assert.equal(view.output.observations.length,1);assert.equal(view.output.ranked_read.returned_windows,2);assert.deepEqual(view.output.observations[0],e.result.output.observations[0]);assert.equal(Object.hasOwn(view.output,'next_offset'),false);assert.equal(Object.hasOwn(view.deferred,'resume'),false);
 assert.equal(view.deferred.archive_recovery.observations[0].start_line,2);
 const r=bindRankedReadDelivery(delivered(f,view));assert.equal(r.read_observations.length,1);assert.equal(r.receipt_confirmed_ranked_read_ids.length,1);
});
test('zero view validates archive binding but grants no evidence',async()=>{
 const f=await two(),e=f.ranked_evidence.get(f.call.id),view=projectRankedRead({evidence:e,keep:0});
 assert.equal(bindRankedReadDelivery(delivered(f,view)).read_observations.length,0);
 view.deferred.archive_sha256='c'.repeat(64);assert.throws(()=>bindRankedReadDelivery(delivered(f,view)),/view-binding/);
});
test('reordered windows, changed counters and deferred metadata fail reconstruction',async()=>{
 const f=await two(),e=f.ranked_evidence.get(f.call.id),original=projectRankedRead({evidence:e,keep:1});
 for(const mutate of [v=>{v.output.observations[0]=e.result.output.observations[1];},v=>{v.output.ranked_read.returned_windows=1;},v=>{v.deferred.omitted_units=0;},v=>{v.extra=true;}]){
  const v=structuredClone(original);mutate(v);assert.throws(()=>validateRankedReadView({call:f.call,result:v,evidence:e}),/view-binding/);
 }
});
test('aggregate admission measures each exact view and archives raw before projection',async()=>{
 const f=await two(),archived=[],prompts=[];
 const r=await admitToolBatch({messages:[{role:'system',content:'Test source acquisition.'}],tools:[],assistant:f.wire.messages[0],results:[f.result],ranked_evidence:f.ranked_evidence,archive:async x=>archived.push(x),measure:async prompt=>{assert.equal(archived.length,1);prompts.push(prompt);return prompts.length===1?8100:7900;},limit:7998});
 assert.equal(r.status,'admitted');assert.equal(r.outputs[0].output.observations.length,1);assert.deepEqual(archived[0].result,f.result);assert.equal(r.attempts.length,2);assert.equal(r.envelope_tokens,7900);
});
test('no prefix fit denies without extra execution or retries',async()=>{
 const f=await two();const r=await admitToolBatch({messages:[{role:'system',content:'Test source acquisition.'}],tools:[],assistant:f.wire.messages[0],results:[f.result],ranked_evidence:f.ranked_evidence,archive:async()=>{},measure:async()=>8100,limit:7998});assert.equal(r.status,'denied');assert.deepEqual(r.attempts.map(x=>x.kept_units),[[2],[1],[0]]);
});
test('compact archived-read recovery binds origin without nonexistent path arguments',async()=>{
 const f=await two(),args={archive_sha256:'d'.repeat(64),observation_index:0};
 const call={id:'recovered',type:'function',function:{name:'recover_archived_read',arguments:stable(args)}};
 const assistant={role:'assistant',tool_calls:[call]};
 const result={ok:true,output:structuredClone(f.result.output.observations[0]),archive_origin:args};
 const input={messages:[{role:'system',content:'Test recovered source.'}],tools:[],assistant,results:[result],archive:async()=>{},limit:7998};
 const admitted=await admitToolBatch({...input,measure:async()=>7900});
 assert.equal(admitted.status,'admitted');assert.equal(admitted.outputs[0].output.path,result.output.path);
 await assert.rejects(admitToolBatch({...input,results:[{...result,archive_origin:{...args,archive_sha256:'e'.repeat(64)}}],measure:async()=>7900}),/recovery-origin-binding/);
 let projectedCalls=0;
 const projected=await admitToolBatch({...input,measure:async(_prompt)=>projectedCalls++===0?8100:7900});
 assert.equal(projected.status,'admitted');assert.equal(projected.outputs[0].output.end_line,result.output.start_line);
 assert.deepEqual(projected.outputs[0].deferred.resume.arguments,{...args,path:result.output.path,revision:result.output.source_revision,start_line:result.output.start_line+1,line_count:1});
 const full={...args,path:result.output.path,revision:result.output.source_revision,start_line:result.output.start_line,line_count:2};
 const fullCall={...call,function:{...call.function,arguments:stable(full)}};
 assert.equal((await admitToolBatch({...input,assistant:{role:'assistant',tool_calls:[fullCall]},measure:async()=>7900})).status,'admitted');
 await assert.rejects(admitToolBatch({...input,assistant:{role:'assistant',tool_calls:[{...fullCall,function:{...fullCall.function,arguments:stable({...full,path:'wrong.txt'})}}]},measure:async()=>7900}),/read-binding/);
});
