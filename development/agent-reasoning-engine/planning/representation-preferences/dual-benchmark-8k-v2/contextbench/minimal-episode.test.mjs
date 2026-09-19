// Synthetic provider, real evidence binding/export. Open questions: MINIMAL-EPISODE.md.
import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runMinimalEpisode} from './minimal-episode.mjs';
import {createMinimalPhases} from './minimal-phase-runtime.mjs';
import {bodyForReceipt,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixture({failAt=-1,overWindow=false,persistFail=false,neverFinish=false,largeUsage=false}={}){
 const root=mkdtempSync(join(tmpdir(),'minimal-episode-')),snapshots=[],saved=[],prompts=[],receipts=[];let calls=0;
 for(let i=0;i<4;i++){const utf8='evidence '+i+'\n',path='q'+i+'.js';writeFileSync(join(root,path),utf8);snapshots.push({path,utf8,source_sha256:hash(utf8)});}
 const driver={receipts,prepare:async({prompt,output_cap})=>{prompts.push(JSON.parse(prompt));const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap};return {prompt,output_cap,profile,input_upper_bound:overWindow?8000:largeUsage?6976:1000,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))};},dispatch:async prepared=>{
  const wire=JSON.parse(prepared.prompt),n=calls++,receipt={...prepared.profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:largeUsage?6976:100,output_tokens:largeUsage?1024:20,request_sha256:prepared.request_sha256,finish_reason:'tool_calls'};
  if(n===failAt){receipts.push({...receipt,status:null,input_tokens:null,output_tokens:null});throw Error('fixture.provider-failure');}
  const terminal=wire.tools.some(t=>t.function.name==='submit_context_handles_v2'),finish=!terminal&&n>=4&&!neverFinish;
  const name=terminal?'submit_context_handles_v2':finish?'finish_discovery':'read_file',args=terminal?{summary:'First evidence',context_handles:[saved.find(e=>e.kind==='terminal-packet').packet.private.bindings.find(b=>b.path==='q0.js').handle]}:finish?{}:{path:'q'+(n%4)+'.js',start_line:1,line_count:1};
  const message={role:'assistant',content:null,reasoning_content:'original reasoning '+n,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]};receipts.push(receipt);return {final_bytes:stable({message,finish_reason:'tool_calls'})};
 }};
 try{const result=await runMinimalEpisode({task:{problem_statement:'Find the behavior',instance_id:'fixture',repo_url:'https://example.invalid/source.git',base_commit:'a'.repeat(40)},driver,tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],execute_tool:async(name,args)=>{const s=snapshots.find(s=>s.path===args.path);return {ok:true,output:{path:s.path,start_line:1,end_line:1,utf8:s.utf8.trimEnd(),source_sha256:s.source_sha256}};},source_context:()=>({snapshots,repoRoot:root}),measure_tokens:async()=>100,persist:e=>{if(persistFail&&e.kind==='request-capture')throw Error('fixture.disk-full');saved.push(structuredClone(e));}});return {result,calls,prompts,saved};}finally{rmSync(root,{recursive:true,force:true});}
}
test('baseline completes with recent history while earlier delivered evidence remains selectable',async()=>{
 const {result,calls,prompts,saved}=await fixture();assert.equal(result.status,'final_context_selected');assert.equal(calls,6);assert.equal(result.phase_state.known_tokens,720);assert.equal(result.phase_state.closed,true);
 assert.equal(result.exported.prediction.traj_data.pred_steps.length,4);assert.equal(result.exported.prediction.traj_data.pred_files.length,1);
 assert.equal(prompts[4].messages.filter(m=>m.role==='tool').length,2);assert.deepEqual(prompts[4].messages.filter(m=>m.role==='tool').map(m=>m.tool_call_id),['call-2','call-3']);
 assert.equal(prompts[4].messages.find(m=>m.role==='assistant').reasoning_content,'original reasoning 2');
 const packet=saved.find(e=>e.kind==='terminal-packet').packet;assert.equal(packet.private.bindings.find(b=>b.handle===result.exported.selection.model_context_handles[0]).path,'q0.js');assert.equal(result.branches[0].captures.length,5);
});
test('provider failure and persistence failure retain costs without further dispatch',async()=>{
 const failed=await fixture({failAt:2});assert.equal(failed.result.status,'run_error');assert.equal(failed.calls,3);assert.equal(failed.result.phase_state.known_tokens,240);assert.equal(failed.result.phase_state.unknown_calls,1);
 const disk=await fixture({persistFail:true});assert.equal(disk.calls,0);assert.equal(disk.result.status,'run_error');assert.equal(disk.result.phase_state.pending.reservation,2024);
 const oversized=await fixture({overWindow:true});assert.equal(oversized.calls,0);assert.equal(oversized.result.status,'run_error');
});
test('discovery call ceiling forces terminal selection within shared budget',async()=>{
 const {result,calls}=await fixture({neverFinish:true});assert.equal(result.status,'final_context_selected');assert.equal(calls,89);assert.equal(result.branches[0].captures.length,88);assert.equal(result.phase_state.known_tokens,89*120);
});
test('discovery token ceiling preserves final selection allocation',async()=>{
 const {result,calls}=await fixture({neverFinish:true,largeUsage:true});assert.equal(result.status,'final_context_selected');assert.equal(calls,12);assert.equal(result.phase_state.known_tokens,96000);assert.equal(result.phase_state.closed,true);
});
test('baseline phase accounting rejects excess reservations and latches receipt drift',()=>{
 const receipts=[],phases=createMinimalPhases({get_receipts:()=>receipts,persist:()=>{}}),sha='a'.repeat(64);
 assert.equal(phases.reserve({input_upper_bound:7000,output_cap:1024,request_sha256:sha}).admissible,false);
 assert.equal(phases.reserve({input_upper_bound:1000,output_cap:1024,request_sha256:sha}).admissible,true);
 receipts.push({kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,request_sha256:sha});phases.settle();const old=receipts[0].input_tokens;receipts[0].input_tokens=0;assert.throws(()=>phases.snapshot(),/receipt-prefix-drift/);receipts[0].input_tokens=old;assert.throws(()=>phases.reserve({input_upper_bound:1000,output_cap:1024,request_sha256:sha}),/not-ready/);
});
