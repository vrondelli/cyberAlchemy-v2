// Synthetic public envelopes and usage only, never providers or reference labels.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R4.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {runCompactMethodEpisode} from './native-method-episode-r4.mjs';
import {deferMethodOutputs} from './method-output-deferral-r3.mjs';
import {nativeFilePredictionR4} from './native-method-live-policy-r4.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),small='void f() {}',large='void huge() {'+' x();'.repeat(1800)+' }';
const view=r=>r.operation==='get_method'?{status:'method-source',path:'src/A.java',source:r.method_id==='huge'?large:small,
 source_sha256:sha(r.method_id==='huge'?large:small),method_source_sha256:sha(r.method_id==='huge'?large:small),
 method:{source_span:{start_line:1,end_line:1,start_utf8:0,end_utf8:(r.method_id==='huge'?large:small).length}}}:
 {status:'page',items:[],total:0,next_offset:null};
const call=(id,name,args)=>({id,type:'function',function:{name,arguments:stable(args)}});
async function scripted({arm='baseline',mode='terminal',pressure=false,acquireUntilFinal=false,huge=false,
 invalidFirst=false,recover=false,batch=1,totalTokens=65536,measured=400,actualInput=400,output=20,limits={},priorReceipt=null}={}){
 const root=mkdtempSync(join(tmpdir(),'are-method-r4-test-'));mkdirSync(join(root,'fixture'));
 const receipts=priorReceipt?[priorReceipt]:[],toolSets=[],observedEvents=[],heads=[];let calls=0;const ids=new Set();let withheldId;
 const transport=createStatelessRecyclingTransport({adapter_id:'native-r4-synthetic',source_ref:'native-method-episode-r4.test.mjs',maximum_output_tokens:512,
  measure_request:async({prompt})=>{
   const p=JSON.parse(prompt);
   if(huge&&p.messages.some(m=>m.role==='tool'&&m.content.includes(large)))return 7800;
   if(pressure&&p.messages.filter(m=>['assistant','tool'].includes(m.role)).length>2)return 7800;
   return measured;
  },request_once:async({prompt})=>{
   calls++;const p=JSON.parse(prompt);toolSets.push(p.tools.map(t=>t.function.name));
   heads.push(p.messages.findLast(m=>m.content?.includes('Repository actions remaining:'))?.content);
   ids.clear();for(const m of p.messages){if(m.role!=='user')continue;let x;try{x=JSON.parse(m.content);}catch{continue;}for(const row of x.method_terminal_handles?.evidence??[])ids.add(row.handle);}
   let message,finish_reason;
   const finalOnly=p.tools.length===1&&p.tools[0].function.name==='submit_method_handles';
   const acquiring=calls===1||huge&&calls===2||invalidFirst&&calls===2||recover&&calls===2||pressure&&calls===2||acquireUntilFinal&&!finalOnly;
   if(acquiring){
    let toolCalls;
    if(recover&&calls===2)toolCalls=[call('recover-'+calls,'recover_observed_read',{retrieval_handle:'observed-read:'+ [...ids][0]})];
    else toolCalls=Array.from({length:batch},(_,i)=>call('r4-read-'+calls+'-'+i,'read_file',{
     method_id:huge&&calls===1?'huge':'m',path:invalidFirst&&calls===1?'wrong.java':'src/A.java',start_line:1}));
    message={role:'assistant',tool_calls:toolCalls};finish_reason='tool_calls';
   }else{
    const chosen=mode==='invented'?['h99']:mode==='withheld'?['h99']:mode==='empty'?[]:[...ids];
    let args=stable({summary:'Bound source localization check',context_handles:chosen});
    if(mode==='duplicate')args=stable({summary:'Duplicates rejected',context_handles:[...chosen,...chosen]});
    if(mode==='long')args=stable({summary:'x'.repeat(161),context_handles:chosen});
    if(mode==='fenced')args='```json\n'+args+'\n```';
    if(mode==='extra')args=stable({summary:'Bad envelope',context_handles:chosen,extra:true});
    if(mode==='raw'||mode==='fenced'){message={role:'assistant',content:args};finish_reason='stop';}
    else {message={role:'assistant',tool_calls:[call('r4-terminal-'+calls,'submit_method_handles',{})]};
     message.tool_calls[0].function.arguments=args;
     if(mode==='mixed')message.tool_calls.push(call('extra-source','read_file',{method_id:'m',path:'src/A.java',start_line:1}));
     finish_reason='tool_calls';}
   }
   const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,status:200,
    input_tokens:actualInput,output_tokens:output,finish_reason};
   receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
   return {receipt,final_bytes:stable({message,finish_reason})};
  }});
 const task={problem_statement:'Inspect complete source and localize without editing.'};
 const recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},
  options:{directory:join(root,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,
   state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['synthetic']}}});
 try{return {...await runCompactMethodEpisode({caseId:'c',arm,task,client:{receipts,maximum_model_retries:0},recycler,
  measure_index_tokens:async()=>100,run_id:'r4-synthetic',view,
  on_event:async e=>{observedEvents.push(e);if(e.kind==='tool-result'&&e.output.output?.utf8===large)withheldId=e.output.output.read_id;},
  limits:{total_tokens:totalTokens,...(totalTokens<=16384?{finalization_reserve_tokens:0}:{}),...limits}}),
  toolSets,calls,observedEvents,heads,withheldId};}finally{recycler.close();}
}
test('both arms accept only a bound terminal tool or strict declared raw alternative',async()=>{
 for(const arm of ['baseline','index'])for(const mode of ['terminal','raw']){
  const r=await scripted({arm,mode});assert.equal(r.functionality_valid,true,r.error);
  assert.equal(nativeFilePredictionR4(r).valid,true);assert.equal(r.calls,2);assert.equal(r.method_tool_accounting.all_tool_attempts,1);
  assert.equal(bindDelivery(r).read_observations[0].body,small);assert.ok(r.toolSets[0].includes('submit_method_handles'));
  assert.equal(r.native_method_binding.physical_line_provenance_claimed,false);
 }
});
test('invalid terminal envelopes and empty predictions stay rejected, zero corrections or extra acquisition',async()=>{
 for(const mode of ['invented','fenced','extra','mixed','empty','duplicate','long']){
  const r=await scripted({mode});assert.equal(r.functionality_valid,false,mode);
  assert.equal(nativeFilePredictionR4(r).valid,false);assert.equal(r.calls,2);assert.equal(r.terminal_corrections,0);
  assert.equal(r.method_tool_accounting.all_tool_attempts,1);
 }
});
test('prediction reconstruction rejects presentation, table, selection and receipt drift',async()=>{
 const r=await scripted();assert.equal(nativeFilePredictionR4(r).valid,true);
 for(const mutate of [x=>{x.method_handle_presentations.at(-1).request_sha256='0'.repeat(64);},x=>{x.method_handle_presentations.at(-1).table.bindings[0].read_id='0'.repeat(64);},x=>{x.selection.final_read_ids=['0'.repeat(64)];},x=>{x.receipts.at(-1).dispatch_uncertain=true;}]){
  const bad=structuredClone(r);mutate(bad);assert.equal(nativeFilePredictionR4(bad).valid,false);
 }
});
test('fresh-context projection withholds entire large method, preserves journal and never credits withheld ID',async()=>{
 for(const arm of ['baseline','index']){
  const r=await scripted({arm,huge:true});assert.equal(r.functionality_valid,true,r.error);assert.ok(r.recycling.recycles>0);
  assert.equal(r.tool_output_deferrals.length,1);const binding=bindDelivery(r);
  assert.equal(binding.read_observations.length,1);assert.equal(binding.read_observations[0].body,small);
  assert.ok(r.history.some(m=>m.role==='tool'&&m.content.includes(large)),'complete original retained');
  assert.ok(!binding.read_observations.some(x=>x.id===r.withheldId));
  const bad=await scripted({arm,huge:true,mode:'withheld'});assert.equal(bad.functionality_valid,false);
  assert.ok(bad.error,'withheld alias rejected');
 }
});
test('projection preserves identity and errors, covers method catalogs without partial-source advice',()=>{
 const pending=[{role:'assistant',tool_calls:[call('catalog','list_runtime_methods',{limit:50}),call('error','read_file',{})]},
  {role:'tool',tool_call_id:'catalog',content:stable({ok:true,output:{items:['x'.repeat(3000)]}})},
  {role:'tool',tool_call_id:'error',content:stable({ok:false,error:'validator',detail:'x'.repeat(3000)})}];
 const before=stable(pending),p=deferMethodOutputs(pending);assert.equal(stable(pending),before);assert.equal(p.deferrals.length,1);
 const n=JSON.parse(p.exchange[1].content);assert.equal(n.payload_delivered,false);assert.ok(n.guidance.includes('limit:1'));
 assert.equal(p.exchange[2].content,pending[2].content);assert.throws(()=>deferMethodOutputs(pending.slice(0,2)),/pending-delivery/);
});
test('both arms expose exact headroom and finalize at ten charged attempts before further acquisition',async()=>{
 for(const arm of ['baseline','index']){
  const r=await scripted({arm,acquireUntilFinal:true,batch:2});assert.equal(r.functionality_valid,true,r.error);
  assert.equal(r.calls,6);assert.equal(r.method_tool_accounting.all_tool_attempts,10);assert.equal(r.method_tool_accounting.ledger.length,10);
  assert.equal(r.method_handle_presentations.at(-1).table.bindings.length,10);
  assert.equal(r.selection.final_read_ids.length,10,'all ten delivered reads remain selectable, not a ranked slate');
  assert.equal(nativeFilePredictionR4(r).ranked_files.length,1);
  assert.deepEqual(r.toolSets.at(-1),['submit_method_handles']);assert.ok(r.heads.at(-1).includes('Repository actions remaining: 0;'));
  assert.ok(r.observedEvents.some(e=>e.kind==='finalization-start'&&e.reason==='repository-action-capacity'));
 }
});
test('invalid and recovery attempts are charged and excess batches are not reclassified as success',async()=>{
 const invalid=await scripted({invalidFirst:true});assert.equal(invalid.functionality_valid,true,invalid.error);
 assert.equal(invalid.method_tool_accounting.all_tool_attempts,2);
 const recovered=await scripted({recover:true});assert.equal(recovered.functionality_valid,true,recovered.error);
 assert.equal(recovered.method_tool_accounting.all_tool_attempts,2);assert.equal(recovered.method_tool_accounting.attempts,1);
 const over=await scripted({batch:11});assert.equal(over.functionality_valid,false);assert.equal(over.method_tool_accounting.all_tool_attempts,11);
 assert.equal(over.method_tool_accounting.ledger.length,10);assert.equal(over.calls,1);
});
test('call and total-token reserves remain inside original caps and actual spent-token cap stops dispatch',async()=>{
 for(const arm of ['baseline','index']){
  const callReserve=await scripted({arm,acquireUntilFinal:true});assert.equal(callReserve.functionality_valid,true,callReserve.error);
  assert.equal(callReserve.calls,10);assert.equal(callReserve.method_tool_accounting.all_tool_attempts,9);
  assert.ok(callReserve.observedEvents.some(e=>e.kind==='finalization-start'&&e.reason==='reserved-call-capacity'));
  const tokenReserve=await scripted({arm,totalTokens:18000,measured:1000,actualInput:1000,output:100});
  assert.equal(tokenReserve.functionality_valid,true,tokenReserve.error);
  assert.ok(tokenReserve.observedEvents.some(e=>e.kind==='finalization-start'&&e.reason==='reserved-total-token-capacity'));
  assert.ok(bindDelivery(tokenReserve).token_accounting.known_total_tokens<=18000);
 }
 const stopped=await scripted({totalTokens:1200});assert.equal(stopped.functionality_valid,false);assert.equal(stopped.calls,1);
 assert.equal(stopped.status,'token_budget_stopped');
});
test('native index and state recycling remain treatment behavior with identical common acquisition',async()=>{
 const r=await scripted({arm:'index',pressure:true});assert.equal(r.functionality_valid,true,r.error);
 assert.ok(r.recycling.recycles>0);assert.ok(r.indexes.length>0);assert.ok(r.task_state_presentations.length>0);
 assert.equal(nativeFilePredictionR4({...r,selection:{...r.selection,final_read_ids:['0'.repeat(64)]}}).valid,false);
});
test('uncertain or unknown historical spend stops both arms before any generation',async()=>{
 for(const arm of ['baseline','index'])for(const priorReceipt of [
  {kind:'tokenizer',dispatched:true,status:200,dispatch_uncertain:true},
  {kind:'model',dispatched:true,status:503,input_tokens:null,output_tokens:null}
 ]){
  const r=await scripted({arm,priorReceipt});assert.equal(r.functionality_valid,false);
  assert.equal(r.calls,0);assert.equal(r.method_tool_accounting.all_tool_attempts,0);
  assert.equal(nativeFilePredictionR4(r).valid,false);
 }
});
