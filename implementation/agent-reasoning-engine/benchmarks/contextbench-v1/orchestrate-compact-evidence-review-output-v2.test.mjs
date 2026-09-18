// H59 pressure-boundary test. No provider or benchmark gold access.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';import {runPreparedBranch,runPreparedTask} from './orchestrate-compact-evidence-review-v2.mjs';
import {validateTerminalReviewPair} from './accounted-response-review-validation.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');

test('incomplete output becomes a shared one-call review with a common recovery envelope',async()=>{
 const root=mkdtempSync(join(tmpdir(),'are-cb-pressure-review-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);writeFileSync(join(cache,'query.py'),'value = 1\n');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/pressure-review.git']);
  const task={instance_id:'fixture-pressure-review',original_inst_id:'fixture-pressure-review',repo:'example/pressure-review',repo_url:'https://github.com/example/pressure-review.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect query.py under context pressure.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));let prefixReceipts=[],deliveredId=null;const prompts={};
  const limits={maximum_calls:5,output_cap:1024,total_tokens:96000,index_entries:8,index_tokens:1024,finalization_reserve_tokens:3000,finalization_calls:2,output_deferral:true,terminal_submission:true,terminal_content_fallback:true,incomplete_output_corrections:0,maximum_terminal_corrections:0,task_state_projection:false,task_state_novelty_gate:false,terminal_effect_state:false,evidence_slate_candidates:8,evidence_slate_bytes:4096,evidence_slate_tokens:1024};
  const common={instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,repetition:1,provider_profile:{fixture:true}};
  const prefixCell={...common,cell_id:'fixture-pressure-prefix',state_arm:'prefix',repetition:0,limits:{...limits,evidence_slate:false}};
  const create_client=({cell})=>{
    const receipts=cell.state_arm==='prefix'?[]:structuredClone(prefixReceipts);let localCalls=0;
    const transport=createStatelessRecyclingTransport({adapter_id:'pressure-review-fixture',source_ref:'orchestrate-outcome-pressure-review-v1.test.mjs',maximum_output_tokens:1024,
      measure_request:async()=>300,
      request_once:async({prompt})=>{localCalls++;const parsed=JSON.parse(prompt);if(cell.state_arm!=='prefix')prompts[cell.state_arm]=parsed;if(cell.state_arm==='prefix'&&localCalls===2){const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:300,output_tokens:1024,finish_reason:'length'};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);prefixReceipts=structuredClone(receipts);const error=Error('glm.incomplete-output');error.code='incomplete-output';throw error;}const message=cell.state_arm==='prefix'
        ?{role:'assistant',tool_calls:[{id:`read-${localCalls}`,type:'function',function:{name:'read_file',arguments:stable({path:'query.py',start_line:1,line_count:1,revision:'base'})}}]}
        :{role:'assistant',tool_calls:[{id:`submit-${cell.state_arm}`,type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Selected pressure fixture.',context_read_ids:[deliveredId]})}}]};
       const finish_reason='tool_calls',receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:300,output_tokens:20,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);if(cell.state_arm==='prefix')prefixReceipts=structuredClone(receipts);return{receipt,final_bytes:stable({message,finish_reason})};}
    });return{transport,receipts,maximum_model_retries:0,acknowledgeResponseFailure:({request_sha256,code})=>{assert.equal(code,'incomplete-output');assert.equal(request_sha256,receipts.at(-1).request_sha256);}};
  };
  const shared={task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,create_client,measure_index_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4)};
  const prefixRoot=join(root,'prefix'),prefixPromise=runPreparedTask({...shared,out:prefixRoot,cell:prefixCell,pause_before_terminal_candidate:true});
  for(let i=0;i<100&&!deliveredId;i++){await new Promise(resolve=>setTimeout(resolve,1));try{for(const line of readFileSync(join(prefixRoot,'events.jsonl'),'utf8').split('\n').filter(Boolean)){const event=JSON.parse(line);if(event.kind==='tool-result'&&event.output?.output?.read_id)deliveredId=event.output.output.read_id;}}catch{}}
  const prefix=await prefixPromise;assert.equal(prefix.status,'shared_prefix_ready',prefix.error);assert.equal(prefix.shared_prefix_boundary.kind,'output-pressure');assert.equal(prefix.shared_prefix_boundary.recovery_candidate_count,1);assert.ok(prefix.shared_prefix_boundary.recovery_envelope_bytes<=4096);assert.ok(prefix.continuation.state.pending_source_feedback.includes('CONTEXT-PRESSURE RECOVERY ENVELOPE'));assert.ok(prefix.continuation.state.pending_source_feedback.includes('terminal review, not a retry'));assert.equal(prefix.shared_prefix_boundary.failed_output_tokens,1024);deliveredId=prefix.continuation.state.pending_source_feedback.match(/"read_id":"([a-f0-9]{64})"/)?.[1];assert.ok(deliveredId);
  const controlCell={...common,cell_id:'fixture-pressure-control',state_arm:'control',limits:{...limits,evidence_slate:false}},stateCell={...common,cell_id:'fixture-pressure-slate',state_arm:'state',limits:{...limits,evidence_slate:true}};
  const control=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'control'),cell:controlCell}),state=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'state'),cell:stateCell});
  assert.equal(control.status,'final_context_selected',control.error);assert.equal(state.status,'final_context_selected',state.error);assert.equal(control.receipts.length-prefixReceipts.length,1);assert.equal(state.receipts.length-prefixReceipts.length,1);
  const cp=structuredClone(prompts.control),sp=structuredClone(prompts.state),slateIndex=sp.messages.findIndex(message=>message.content?.includes('FINALIZATION EVIDENCE CANDIDATES'));assert.ok(slateIndex>=0);sp.messages.splice(slateIndex,1);assert.deepEqual(sp,cp);assert.ok(cp.messages.some(message=>message.content?.includes('CONTEXT-PRESSURE RECOVERY ENVELOPE')));
  const validation=validateTerminalReviewPair({prefix,control,treatment:state});assert.equal(validation.ok,true,JSON.stringify(validation));assert.equal(validation.measurements.boundary_kind,'output-pressure');assert.equal(validation.measurements.recovery_candidate_count,1);
 }finally{rmSync(root,{recursive:true,force:true});}
});
