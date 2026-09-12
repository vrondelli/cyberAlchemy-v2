import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {runEpisode} from './episode.mjs';
import {stable,bodyForReceipt} from './delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function run({arm='baseline',budget=10000,pressure=false,extraTool=false,badTool=false,badFinal=false,incomplete=false,incompleteAt=2,incompleteCorrections=0,taskState=false,stateTokenCap=2000}={}){
  const root=mkdtempSync(join(tmpdir(),'are-cb-loop-'));mkdirSync(join(root,'fixture'));
  const receipts=[];let requests=0,previousIds=[],stateMeasurements=0;
  const transport=createStatelessRecyclingTransport({adapter_id:'cb-offline-test',source_ref:'episode.test.mjs',maximum_output_tokens:1024,
    measure_request:async({prompt})=>pressure&&JSON.parse(prompt).messages.length>5?6500:200,
    request_once:async({prompt,dispatch})=>{
      requests++;
      const messages=JSON.parse(prompt).messages;
      let message,finish_reason;
      if(requests===1||(pressure&&requests===2)||(extraTool&&requests===3)||(badTool&&requests===2)){
        const arguments_=badTool&&requests===1?'broken-json':stable({path:'a.py',start_line:1,line_count:1});
        message={role:'assistant',tool_calls:[{id:`r${requests}`,type:'function',function:{name:'read_file',arguments:arguments_}}]};finish_reason='tool_calls';
      }else{
        const ids=[];
        for(const m of messages){
          if(m.role==='tool'){const o=JSON.parse(m.content);if(o.output?.read_id)ids.push(o.output.read_id);}
          if(m.role==='user'&&m.content.startsWith('{"observed_source_index"'))ids.push(...JSON.parse(m.content).observed_source_index.map(x=>x.read_id));
          if(m.role==='user'&&m.content.startsWith('POST-RECYCLE OBSERVED TASK STATE'))ids.push(...JSON.parse(m.content.split('\n').slice(1).join('\n')).evidence.map(x=>x.read_id));
        }
        const selected=ids.length?[...new Set(ids)]:previousIds;previousIds=selected;
        const content=stable({summary:'Fixture complete',context_read_ids:selected});
        message={role:'assistant',content:badFinal&&requests===2?'Explanation\n```json\n'+content+'\n```':content};finish_reason='stop';
      }
      const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};
      if(incomplete&&requests===incompleteAt){receipt.output_tokens=1024;receipt.finish_reason='length';receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);const error=Error('glm.incomplete-output');error.code='incomplete-output';throw error;}
      receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
      return {receipt,final_bytes:stable({message,finish_reason})};
    }});
  const task={problem_statement:'Fix the fixture issue'},recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture-base']}}});
  try{
    const result=await runEpisode({task,arm,client:{receipts,transport,maximum_model_retries:0},recycler,
      tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],
      execute_tool:async()=>({ok:true,output:{path:'a.py',start_line:1,end_line:1,utf8:'source',source_sha256:hash('source')}}),
      measure_index_tokens:async s=>{if(s.startsWith('POST-RECYCLE OBSERVED TASK STATE'))stateMeasurements++;return s.length;},limits:{maximum_calls:4,output_cap:1024,total_tokens:budget,index_entries:10,index_tokens:1000,incomplete_output_corrections:incompleteCorrections,...(taskState?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:stateTokenCap,task_state_evidence:8,task_state_outcomes:12}:{})},run_id:'fixture'});
    return {...result,requests,stateMeasurements};
  }finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}
test('real recycler loop binds source read to terminal model selection',async()=>{
  const r=await run();assert.equal(r.status,'final_context_selected');assert.equal(r.requests,2);
  assert.equal(r.selection.final_read_ids.length,1);assert.equal(r.response_captures.length,2);
  assert.ok(r.events[0].output.output.read_id);assert.equal(r.admissions.every(x=>x.admissible),true);
});
test('prospective total budget denial dispatches no extra model request',async()=>{
  const r=await run({budget:1300});assert.equal(r.status,'token_budget_stopped');assert.equal(r.requests,1);
  assert.equal(r.recycling.dispatches.length,1);assert.equal(r.admissions.at(-1).known_consumed,210);
});
test('index survives actual recycler displacement; baseline has same legal read IDs',async()=>{
  const r=await run({arm:'index',pressure:true});assert.equal(r.status,'final_context_selected');
  assert.ok(r.recycling.recycles>0);assert.ok(r.selection.final_read_ids.length>0);
  const last=JSON.parse(r.captures.at(-1).prompt).messages;
  assert.equal(last.some(m=>m.role==='tool'),false);
  assert.ok(last.some(m=>m.content?.includes('observed_source_index')));
});
test('task-state projection appears only after actual recycling and preserves recoverable evidence',async()=>{
  const r=await run({pressure:true,taskState:true});assert.equal(r.status,'final_context_selected',r.error);assert.ok(r.recycling.recycles>0);
  assert.equal(r.task_state_presentations.length,1);assert.equal(r.task_state_presentations[0].generation,1);assert.ok(r.task_state_presentations[0].measured_tokens>0);
  assert.equal(r.stateMeasurements,1);
  const last=JSON.parse(r.captures.at(-1).prompt).messages;assert.equal(last.some(m=>m.role==='tool'),false);assert.ok(last.some(m=>m.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE')));assert.equal(r.selection.final_read_ids.length,1);
});
test('task-state projection is silent when no recycle occurs',async()=>{const r=await run({taskState:true});assert.equal(r.status,'final_context_selected');assert.equal(r.recycling.recycles,0);assert.deepEqual(r.task_state_presentations,[]);assert.equal(r.stateMeasurements,0);});
test('task-state projection appears only once across successful requests in one recycled generation',async()=>{
  const r=await run({pressure:true,extraTool:true,taskState:true});assert.equal(r.status,'final_context_selected',r.error);
  assert.equal(r.recycling.recycles,1);assert.equal(r.task_state_presentations.length,1);assert.equal(r.stateMeasurements,1);
  const last=JSON.parse(r.captures.at(-1).prompt).messages;
  assert.equal(last.some(message=>message.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE')),false);
});
test('shared prefix pauses before post-recycle rendering and resumes isolated control/state branches',async t=>{
  const root=mkdtempSync(join(tmpdir(),'are-cb-shared-prefix-')),fixture=join(root,'fixture');mkdirSync(fixture);writeFileSync(join(fixture,'a.py'),'source\n');
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const task={problem_statement:'Fix the shared-prefix fixture'},scope={request:task.problem_statement};
  const state={objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture-base']};
  const baseLimits={maximum_calls:4,output_cap:1024,total_tokens:10000,index_entries:10,index_tokens:1000,task_state_bytes:4096,task_state_tokens:2000,task_state_evidence:8,task_state_outcomes:12,task_state_include_outcomes:false};
  const makeClient=({seed=[],prompts})=>{
    const receipts=structuredClone(seed);
    const transport=createStatelessRecyclingTransport({adapter_id:'cb-shared-prefix',source_ref:'episode.test.mjs:shared-prefix',maximum_output_tokens:1024,
      measure_request:async({prompt})=>JSON.parse(prompt).messages.filter(message=>message.role==='tool').length>=2?6500:200,
      request_once:async({prompt})=>{
        prompts.push(prompt);const parsed=JSON.parse(prompt),number=receipts.length+1;
        let message,finish_reason;
        if(receipts.length<2){message={role:'assistant',tool_calls:[{id:`prefix-read-${receipts.length+1}`,type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1,line_count:1})}}]};finish_reason='tool_calls';}
        else {const stateMessage=parsed.messages.find(item=>item.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE'));const ids=stateMessage?JSON.parse(stateMessage.content.split('\n').slice(1).join('\n')).evidence.map(item=>item.read_id):[];message={role:'assistant',content:stable({summary:'branch complete',context_read_ids:ids})};finish_reason='stop';}
        const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};
        receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);return {receipt,final_bytes:stable({message,finish_reason})};
      }});
    return {receipts,transport,maximum_model_retries:0};
  };
  const tools=[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],execute_tool=async()=>({ok:true,output:{path:'a.py',start_line:1,end_line:1,utf8:'source',source_sha256:hash('source')}});
  const prefixPrompts=[],prefixClient=makeClient({prompts:prefixPrompts}),prefixState=join(root,'prefix-state');
  let recycler=openContextRecycling({transport:prefixClient.transport,fixture_root:fixture,scope,options:{directory:prefixState,context_limit:8000,recycle_at:7000,safety_margin:1000,state}});
  const prefix=await runEpisode({task,arm:'baseline',client:prefixClient,recycler,tools,execute_tool,measure_index_tokens:async text=>text.length,limits:{...baseLimits,task_state_projection:false},run_id:'prefix',pause_after_first_recycle:true});
  assert.equal(prefix.status,'shared_prefix_ready',prefix.error);assert.equal(prefixClient.receipts.length,2);assert.equal(prefixPrompts.length,2);assert.equal(prefix.recycling.phase,'idle');assert.equal(prefix.shared_prefix_boundary.generation,1);
  recycler.close();
  const runBranch=async projection=>{
    const directory=join(root,projection?'state-branch':'control-branch');cpSync(prefixState,directory,{recursive:true});
    const prompts=[],client=makeClient({seed:prefixClient.receipts,prompts});
    const branchRecycler=openContextRecycling({transport:client.transport,fixture_root:fixture,scope,options:{directory,context_limit:8000,recycle_at:7000,safety_margin:1000,state}});
    try{return {result:await runEpisode({task,arm:'baseline',client,recycler:branchRecycler,tools,execute_tool,measure_index_tokens:async text=>text.length,limits:{...baseLimits,task_state_projection:projection},run_id:projection?'state':'control',continuation:prefix.continuation}),prompts};}
    finally{branchRecycler.close();}
  };
  const control=await runBranch(false),treatment=await runBranch(true);
  assert.equal(control.result.status,'final_context_selected');assert.equal(treatment.result.status,'final_context_selected');
  assert.deepEqual(control.result.selection.final_read_ids,[]);
  assert.deepEqual(control.result.receipts[0],treatment.result.receipts[0]);assert.equal(control.prompts.length,1);assert.equal(treatment.prompts.length,1);
  const controlMessages=JSON.parse(control.prompts[0]).messages,treatmentMessages=JSON.parse(treatment.prompts[0]).messages;
  assert.equal(controlMessages.some(message=>message.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE')),false);
  assert.equal(treatmentMessages.filter(message=>message.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE')).length,1,JSON.stringify({messages:treatmentMessages,presentations:treatment.result.task_state_presentations,captures:treatment.result.captures,events:treatment.result.events}));
  assert.equal(control.result.task_state_presentations.length,0);assert.equal(treatment.result.task_state_presentations.length,1);
  const withoutState=treatmentMessages.filter(message=>!message.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE'));
  assert.deepEqual(withoutState,controlMessages);
  const tampered=structuredClone(prefix.continuation);tampered.state.next_step++;
  const invalidDirectory=join(root,'invalid-branch');cpSync(prefixState,invalidDirectory,{recursive:true});const invalidClient=makeClient({seed:prefixClient.receipts,prompts:[]});
  const invalidRecycler=openContextRecycling({transport:invalidClient.transport,fixture_root:fixture,scope,options:{directory:invalidDirectory,context_limit:8000,recycle_at:7000,safety_margin:1000,state}});
  try{await assert.rejects(runEpisode({task,arm:'baseline',client:invalidClient,recycler:invalidRecycler,tools,execute_tool,measure_index_tokens:async text=>text.length,limits:{...baseLimits,task_state_projection:false},run_id:'invalid',continuation:tampered}),/continuation-integrity/);}finally{invalidRecycler.close();}
});
test('irreducibly small task-state cap fails only after bounded selected-generation fitting',async()=>{const r=await run({pressure:true,taskState:true,stateTokenCap:1});assert.equal(r.status,'run_error');assert.equal(r.error,'task-state.token-cap-too-small');assert.equal(r.requests,2);assert.equal(r.stateMeasurements,3);});
test('malformed tool call yields feedback and permits correction in same loop',async()=>{
  const r=await run({badTool:true});assert.equal(r.status,'final_context_selected');
  assert.equal(r.events[0].output.ok,false);assert.equal(r.events[1].output.ok,true);
  assert.equal(r.requests,3);
});
test('length-limited model output fails without an admitted correction',async()=>{const r=await run({incomplete:true});assert.equal(r.status,'run_error');assert.equal(r.error,'glm.incomplete-output');assert.equal(r.requests,2);assert.equal(r.output_cap_corrections,0);assert.equal(r.receipts.at(-1).finish_reason,'length');});
test('one admitted concise-action correction retains failed usage and completes',async()=>{const r=await run({incomplete:true,incompleteCorrections:1});assert.equal(r.status,'final_context_selected',r.error);assert.equal(r.requests,3);assert.equal(r.output_cap_corrections,1);assert.equal(r.receipts.length,3);assert.equal(r.receipts[1].finish_reason,'length');assert.ok(r.captures.at(-1).prompt.includes('previous response reached the fixed output-token cap'));});
test('recycle-boundary state is presented once when its first dispatch reaches the output cap',async()=>{
  const r=await run({pressure:true,taskState:true,incomplete:true,incompleteAt:3,incompleteCorrections:1});
  assert.equal(r.status,'final_context_selected',r.error);assert.equal(r.recycling.recycles,1);
  assert.equal(r.task_state_presentations.length,1);assert.equal(r.task_state_presentations[0].generation,1);
  assert.equal(r.task_state_presentations[0].dispatch_outcome,'incomplete-output');
  const last=JSON.parse(r.captures.at(-1).prompt).messages;
  assert.equal(last.some(message=>message.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE')),false);
});

test('fenced terminal response gets exactly one tools-disabled correction within original budgets',async()=>{
  const r=await run({badFinal:true});assert.equal(r.status,'final_context_selected');
  assert.equal(r.requests,3);assert.equal(r.terminal_corrections,1);assert.equal(r.selection.final_read_ids.length,1);
  const prompt=JSON.parse(r.captures.at(-1).prompt);assert.deepEqual(prompt.tools,[]);
  assert.ok(prompt.messages.at(-1).content.includes('Rejected public response'));
  assert.equal(r.admissions.at(-1).known_consumed,420);
});
test('terminal correction cannot dispatch when cumulative budget is exhausted',async()=>{
  const r=await run({badFinal:true,budget:1500});assert.equal(r.status,'token_budget_stopped');
  assert.equal(r.requests,2);assert.equal(r.recycling.dispatches.length,2);
});
