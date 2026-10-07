// Actual source/catalog native cycle with confirmed delivery, recovery and second recycle.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {runProfileBoundMethodEpisode} from './native-method-episode-r10.mjs';
import {loadProfileBoundModule,profileClosureEvidence} from './profile-bound-module-closure-r10.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const {nativeFilePredictionR5:nativeFilePredictionR10}=await loadProfileBoundModule(new URL('./native-method-live-policy-r5.mjs',import.meta.url));
import {createFrozenAdaptiveCommonTools} from './adaptive-common-tools-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
const {stable,bindDelivery}=await loadProfileBoundModule(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs',import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
test('clarified contract receipts bind both native arms through canonical source, recovery, two recycles and strict terminal',async()=>{
 const view=createFrozenAdaptiveCommonTools(),caseId='Defects4J-Cli-5',file=view({operation:'list_files',case_id:caseId,limit:1}).items[0].path;
 const method=view({operation:'list_methods',case_id:caseId,path:file,limit:1}).items[0];
 for(const arm of ['baseline','index']){
  const root=mkdtempSync(join(tmpdir(),'are-r6b-navigation-')),receipts=[];mkdirSync(join(root,'fixture'));let calls=0;
  const transport=createStatelessRecyclingTransport({adapter_id:'r6b-navigation-cycle',source_ref:import.meta.url,maximum_output_tokens:512,
   measure_request:async({prompt})=>JSON.parse(prompt).messages.filter(m=>['assistant','tool'].includes(m.role)).length>2?7800:400,
   request_once:async({prompt})=>{
    const p=JSON.parse(prompt);calls++;assert.ok(p.messages[1].content.includes('terminal_eligible only permits selection'));for(const message of p.messages){if(message.role==='user'&&message.content.includes('method_terminal_handles'))assert.ok(message.content.includes('terminal_eligible only permits selection'));}const handles=[],readIds=[];
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
  assert.equal(r.functionality_valid,true,r.error);assert.equal(nativeFilePredictionR10(r).valid,true);assert.equal(calls,5);
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
  const evidence=profileClosureEvidence();assert.equal(evidence.loaded_modules.filter(m=>m.modified).length,2);
  const binding=bindDelivery(r);assert.equal(binding.read_observations.length,1);assert.equal(binding.token_accounting.cost_complete,true);
 }
});

test('both arms may acquire a second complete method after selection first becomes eligible',async()=>{
 const view=createFrozenAdaptiveCommonTools(),caseId='Defects4J-Cli-5';
 const files=view({operation:'list_files',case_id:caseId,limit:2}).items;
 const choices=files.flatMap(f=>view({operation:'list_methods',case_id:caseId,path:f.path,limit:2}).items.map(m=>({file:f.path,method:m}))).slice(0,2);
 assert.equal(choices.length,2);
 for(const arm of ['baseline','index']){
  const root=mkdtempSync(join(tmpdir(),'are-r10-multi-source-')),receipts=[];mkdirSync(join(root,'fixture'));let calls=0,sawEligibleBeforeSecondRead=false;
  const transport=createStatelessRecyclingTransport({adapter_id:'r10-multi-source',source_ref:import.meta.url,maximum_output_tokens:512,
   measure_request:async({prompt})=>JSON.parse(prompt).messages.filter(m=>['assistant','tool'].includes(m.role)).length>2?7800:400,
   request_once:async({prompt})=>{
    const p=JSON.parse(prompt);calls++;const handles=[],readIds=[];let eligible=false;
    for(const m of p.messages){if(m.role==='tool'){const output=JSON.parse(m.content).output;if(output?.read_id)readIds.push(output.read_id);}
     if(m.role==='user')try{const table=JSON.parse(m.content).method_terminal_handles;if(table){eligible=table.terminal_eligible;for(const h of table.evidence)handles.push(h.handle);}}catch{}}
    if(calls===4){assert.equal(eligible,true);assert.ok(handles.length>0);sawEligibleBeforeSecondRead=true;}
    const name=['runtime_status','list_methods','read_file','list_methods','read_file','recover_observed_read','submit_source_handles'][calls-1];
    const choice=choices[calls<=3?0:1];
    const args=calls===1?{}:calls===2||calls===4?{path:choice.file,limit:2}:calls===3||calls===5?
     {path:choice.file,method_id:choice.method.method_id,start_line:choice.method.source_span.start_line}:
     calls===6?{retrieval_handle:'observed-read:'+readIds[0]}:{context_handles:[...new Set(handles)]};
    const finish_reason='tool_calls',message={role:'assistant',tool_calls:[{id:'multi-'+calls,type:'function',function:{name,arguments:stable(args)}}]};
    const receipt={kind:'model',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,dispatched:true,dispatch_uncertain:false,status:200,input_tokens:400,output_tokens:20,finish_reason,
     request_sha256:sha(providerBody({operation:'generate',request_id:'synthetic-r10-multi-'+calls,messages:p.messages,tools:p.tools,output_cap:512}))};
    receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
   }});
  const task={problem_statement:'Offline scripted continuation after first eligible source; not fault-quality prediction.'};
  const recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},
   options:{directory:join(root,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['multi-source-continuation']}}});
  let result;try{result=await runProfileBoundMethodEpisode({caseId,arm,task,client:{receipts,maximum_model_retries:0},recycler,measure_index_tokens:async()=>100,run_id:'r10-multi-source'});}finally{recycler.close();}
  assert.equal(sawEligibleBeforeSecondRead,true);assert.equal(result.functionality_valid,true,result.error);assert.equal(nativeFilePredictionR10(result).valid,true);
  assert.equal(calls,7);assert.equal(result.method_tool_accounting.all_tool_attempts,6);assert.equal(result.selection.final_read_ids.length,2);
  const binding=bindDelivery(result);assert.equal(binding.read_observations.length,2);assert.equal(binding.token_accounting.cost_complete,true);
  assert.ok(result.recycling.recycles>=2);
 }
});
