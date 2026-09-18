// H68 terminal prompt-substitution test. No provider or benchmark gold access.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';import {runPreparedBranch,runPreparedTask} from './orchestrate-completion-readiness-v1.mjs';
import {validateTerminalDecisionSubstitutionPair} from './terminal-decision-substitution-validation.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');

test('terminal decision state replaces repeated review messages and reduces input tokens',async()=>{
 const root=mkdtempSync(join(tmpdir(),'are-cb-terminal-review-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);writeFileSync(join(cache,'a.py'),'value = 1\n');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/terminal-review.git']);
  const task={instance_id:'fixture-terminal-review',original_inst_id:'fixture-terminal-review',repo:'example/terminal-review',repo_url:'https://github.com/example/terminal-review.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect the terminal review fixture.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));let prefixReceipts=[],deliveredId=null;const branchPrompts={};
  const limits={maximum_calls:5,output_cap:1024,total_tokens:96000,index_entries:8,index_tokens:1024,finalization_reserve_tokens:3000,finalization_calls:2,output_deferral:true,terminal_submission:true,terminal_content_fallback:true,incomplete_output_corrections:0,maximum_terminal_corrections:0,task_state_projection:false,task_state_novelty_gate:false,terminal_effect_state:false,evidence_slate:false,evidence_slate_candidates:8,evidence_slate_bytes:4096,evidence_slate_tokens:1024,decision_state_evidence:3,decision_state_bytes:1536,decision_state_tokens:384,decision_state_substitution:false};
  const common={instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,repetition:1,provider_profile:{fixture:true}};
  const prefixCell={...common,cell_id:'fixture-terminal-prefix',state_arm:'prefix',repetition:0,limits:{...limits,decision_state:false}};
  const create_client=({cell})=>{
    const receipts=cell.state_arm==='prefix'?[]:structuredClone(prefixReceipts);let localCalls=0;
    const transport=createStatelessRecyclingTransport({adapter_id:'terminal-review-fixture',source_ref:'orchestrate-terminal-review-v1.test.mjs',maximum_output_tokens:1024,measure_request:async({prompt})=>Math.ceil(Buffer.byteLength(prompt)/4),request_once:async({prompt})=>{
      localCalls++;const parsed=JSON.parse(prompt);if(cell.state_arm!=='prefix')branchPrompts[cell.state_arm]=parsed;let message;
      if(cell.state_arm==='prefix'&&localCalls===1)message={role:'assistant',tool_calls:[{id:'read-1',type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1,line_count:1,revision:'base'})}}]};
      else if(cell.cell_id.includes('invalid'))message={role:'assistant',content:'not a valid terminal envelope'};
      else message={role:'assistant',tool_calls:[{id:`submit-${cell.state_arm}`,type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Selected fixture source.',context_read_ids:[deliveredId]})}}]};
      const finish_reason=message.tool_calls?'tool_calls':'stop',receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:Math.ceil(Buffer.byteLength(prompt)/4),output_tokens:20,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);if(cell.state_arm==='prefix')prefixReceipts=structuredClone(receipts);return{receipt,final_bytes:stable({message,finish_reason})};
    }});
    return{transport,receipts,maximum_model_retries:0};
  };
  const execute_tool=async()=>({ok:true,output:{path:'a.py',start_line:1,end_line:1,utf8:'value = 1',source_sha256:hash('value = 1\n')}});
  // Capture the deterministic ID produced by the repository tool through the prefix result.
  const shared={task_path,task_sha256:hash(readFileSync(task_path)),create_client,measure_index_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4)};
  const prefixRoot=join(root,'prefix');
  const originalExecuteImport=execute_tool;
  // runPreparedTask owns repository tools; read_id is recovered from its durable tool event after the first read.
  const prefixPromise=runPreparedTask({...shared,repository_cache:cache,out:prefixRoot,cell:prefixCell,pause_before_terminal_candidate:true});
  // The fixture transport needs the first delivered ID for its terminal candidate. It is deterministic from the prompt-bound tool output, so discover it after the first request via a short polling microtask.
  for(let i=0;i<100&&!deliveredId;i++){
    await new Promise(resolve=>setTimeout(resolve,1));
    const events=join(prefixRoot,'events.jsonl');
    try{for(const line of readFileSync(events,'utf8').split('\n').filter(Boolean)){const event=JSON.parse(line);if(event.kind==='tool-result'&&event.output?.output?.read_id)deliveredId=event.output.output.read_id;}}catch{}
  }
  const prefix=await prefixPromise;assert.ok(deliveredId);assert.equal(prefix.status,'shared_prefix_ready',prefix.error);assert.equal(prefix.shared_prefix_boundary.kind,'terminal-candidate');assert.equal(prefix.continuation.state.terminal_review_pending,true);assert.equal(prefixReceipts.length,2);
  const controlCell={...common,cell_id:'fixture-terminal-control',state_arm:'control',limits:{...limits,decision_state:false}};
  const stateCell={...common,cell_id:'fixture-terminal-state',state_arm:'state',limits:{...limits,decision_state:true,decision_state_substitution:true}};
  const control=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'control'),cell:controlCell});
  const state=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'state'),cell:stateCell});
  assert.equal(control.status,'final_context_selected',control.error);assert.equal(state.status,'final_context_selected',state.error);
  assert.equal(control.receipts.length-prefixReceipts.length,1);assert.equal(state.receipts.length-prefixReceipts.length,1);
  assert.equal(control.decision_state_presentations.length,0);assert.equal(state.decision_state_presentations.length,1);assert.equal(state.decision_state_presentations[0].phase,'terminal');
  assert.deepEqual(control.receipts.slice(0,2),state.receipts.slice(0,2));assert.equal(control.prefix_ancestry.prefix_tree_digest,state.prefix_ancestry.prefix_tree_digest);
  const controlPrompt=structuredClone(branchPrompts.control),statePrompt=structuredClone(branchPrompts.state);const stateIndex=statePrompt.messages.findIndex(message=>message.content?.includes('DECISION STATE'));assert.ok(stateIndex>=0);
  assert.ok(controlPrompt.messages.some(message=>message.content?.includes('held without acceptance')));assert.equal(statePrompt.messages.some(message=>message.content?.includes('held without acceptance')),false);
  assert.deepEqual(controlPrompt.tools.map(tool=>tool.function.name),['submit_context_selection']);assert.deepEqual(statePrompt.tools.map(tool=>tool.function.name),['submit_context_selection']);
  const controlInput=control.receipts.at(-1).input_tokens,stateInput=state.receipts.at(-1).input_tokens;assert.ok(controlInput-stateInput>=128,JSON.stringify({controlInput,stateInput}));
  assert.equal(state.decision_state_presentations[0].prompt_substitution,true);assert.deepEqual(state.decision_state_presentations[0].replaced_messages,['pending_source_feedback','pending_output_cap_feedback','finalization_instruction','calls_remaining']);
  const validation=validateTerminalDecisionSubstitutionPair({prefix,control,treatment:state});assert.equal(validation.ok,true,JSON.stringify(validation));assert.equal(validation.measurements.phase,'terminal');assert.ok(validation.measurements.first_request_input_token_difference<=-128);
  const invalidCell={...common,cell_id:'fixture-terminal-invalid',state_arm:'control',limits:{...limits,decision_state:false}};
  const invalid=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'invalid'),cell:invalidCell});
  assert.equal(invalid.status,'invalid_final_response');assert.equal(invalid.receipts.length-prefixReceipts.length,1);assert.equal(invalid.terminal_corrections,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
