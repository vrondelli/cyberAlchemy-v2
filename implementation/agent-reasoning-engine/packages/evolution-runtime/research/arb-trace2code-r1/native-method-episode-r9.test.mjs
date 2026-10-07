// Actual source/catalog native cycle with confirmed delivery, recovery and second recycle.
// Open Questions: evidence/G01-NATIVE-PROFILE-CLOSURE-R9.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {runProfileBoundMethodEpisode} from './native-method-episode-r9.mjs';
import {loadProfileBoundModule,profileClosureEvidence} from './profile-bound-module-closure-r9.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const {nativeFilePredictionR5:nativeFilePredictionR9}=await loadProfileBoundModule(new URL('./native-method-live-policy-r5.mjs',import.meta.url));
import {createFrozenAdaptiveCommonTools} from './adaptive-common-tools-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
const {stable,bindDelivery}=await loadProfileBoundModule(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs',import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
test('new-profile receipts bind both native arms through canonical source, recovery, two recycles and strict terminal',async()=>{
 const view=createFrozenAdaptiveCommonTools(),caseId='Defects4J-Cli-5',file=view({operation:'list_files',case_id:caseId,limit:1}).items[0].path;
 const method=view({operation:'list_methods',case_id:caseId,path:file,limit:1}).items[0];
 for(const arm of ['baseline','index']){
  const root=mkdtempSync(join(tmpdir(),'are-r6b-navigation-')),receipts=[];mkdirSync(join(root,'fixture'));let calls=0;
  const transport=createStatelessRecyclingTransport({adapter_id:'r6b-navigation-cycle',source_ref:import.meta.url,maximum_output_tokens:512,
   measure_request:async({prompt})=>JSON.parse(prompt).messages.filter(m=>['assistant','tool'].includes(m.role)).length>2?7800:400,
   request_once:async({prompt})=>{
    const p=JSON.parse(prompt);calls++;const handles=[],readIds=[];
    for(const m of p.messages){if(m.role==='tool'){const o=JSON.parse(m.content).output;if(o?.read_id)readIds.push(o.read_id);}
     if(m.role==='user')try{for(const h of JSON.parse(m.content).method_terminal_handles?.evidence??[])handles.push(h.handle);}catch{}}
    const name=['runtime_status','list_methods','read_file','recover_observed_read','submit_source_handles'][calls-1];
    const args=calls===1?{}:calls===2?{path:file,limit:1}:calls===3?{path:file,method_id:method.method_id,start_line:method.source_span.start_line}:
     calls===4?{retrieval_handle:'observed-read:'+readIds[0]}:{context_handles:[...new Set(handles)]};
    const message={role:'assistant',tool_calls:[{id:'r6b-'+calls,type:'function',function:{name,arguments:stable(args)}}]},finish_reason='tool_calls';
    const receipt={kind:'model',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,dispatched:true,status:200,input_tokens:400,output_tokens:20,finish_reason};
    receipt.request_sha256=sha(providerBody({operation:'generate',request_id:'synthetic-native-r9-'+calls,messages:p.messages,tools:p.tools,output_cap:512}));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
   }});
  const task={problem_statement:'Offline actual source catalog/recovery/recycle qualification, not fault prediction.'};
  const recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},
   options:{directory:join(root,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['actual-native-catalog-qualification']}}});
  let r;try{r=await runProfileBoundMethodEpisode({caseId,arm,task,client:{receipts,maximum_model_retries:0},recycler,measure_index_tokens:async()=>100,run_id:'r6b-cycle'});}finally{recycler.close();}
  assert.equal(r.functionality_valid,true,r.error);assert.equal(nativeFilePredictionR9(r).valid,true);assert.equal(calls,5);
  assert.equal(r.method_tool_accounting.all_tool_attempts,4);assert.equal(r.method_tool_accounting.attempts,3);
  assert.equal(r.events.find(e=>e.tool==='recover_observed_read').output.ok,true);assert.ok(r.recycling.recycles>=2);
  if(arm==='index'){
   const state=r.task_state_presentations.find(s=>s.projection_mode==='confirmed-native-navigation'&&s.material.pages.some(p=>p.tool==='list_methods'));
   assert.ok(state,'confirmed catalog must survive later recycle');assert.ok(state.material.pages.some(p=>p.items?.some(i=>i.method_id===method.method_id)));
   assert.ok(r.indexes.some(i=>i.entries.length>0),'actual confirmed read index remains present');
   const binding=bindDelivery(r),request=binding.requests.find(q=>q.posture==='confirmed-successful-request'&&q.request_sha256===state.request_sha256);assert.ok(request);
   assert.ok(state.provenance.every(o=>o.confirmed_receipts.every(i=>i<request.receipt_index)));
   const publicMessages=JSON.parse(r.captures[request.capture_indices[0]].prompt).messages;
   assert.ok(publicMessages.some(m=>m.role==='user'&&m.content===stable(state.material)));
  }else assert.equal(r.task_state_presentations.length,0);
  const evidence=profileClosureEvidence();assert.equal(evidence.loaded_modules.filter(m=>m.modified).length,1);
  const binding=bindDelivery(r);assert.equal(binding.read_observations.length,1);assert.equal(binding.token_accounting.cost_complete,true);
 }
});
