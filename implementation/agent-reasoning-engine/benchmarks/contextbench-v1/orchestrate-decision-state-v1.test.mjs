// H67 universal-boundary fixture. No provider, network, credentials, or gold.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {bindDelivery,bodyForReceipt,stable} from './delivery.mjs';
import {runPreparedBranch,runPreparedTask} from './orchestrate-completion-readiness-v1.mjs';
import {validateDecisionStatePair} from './decision-state-validation.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');

test('effect confirmation wins over simultaneous terminal proposal and treatment is sole prompt difference',async()=>{
  const root=mkdtempSync(join(tmpdir(),'are-decision-state-')),cache=join(root,'cache');mkdirSync(cache);
  const git=args=>execFileSync('git',args,{cwd:cache,encoding:'utf8'}).trim();
  try{
    git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);
    writeFileSync(join(cache,'query.py'),'value = 1\n');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/decision-state.git']);
    const task={instance_id:'fixture-decision-state',original_inst_id:'fixture-decision-state',repo:'example/decision-state',repo_url:'https://github.com/example/decision-state.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Change query.py value to two and select the source.',source:'fixture'};
    const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
    const limits={maximum_calls:6,output_cap:1024,total_tokens:96000,index_entries:8,index_tokens:1024,finalization_reserve_tokens:0,output_deferral:true,terminal_submission:true,terminal_content_fallback:true,incomplete_output_corrections:0,maximum_terminal_corrections:0,task_state_projection:false,task_state_novelty_gate:false,terminal_effect_state:false,evidence_slate:false,evidence_slate_candidates:8,evidence_slate_bytes:4096,evidence_slate_tokens:1024,decision_state_evidence:8,decision_state_bytes:4096,decision_state_tokens:1024};
    const common={instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,repetition:1,provider_profile:{fixture:true}};
    const prefixCell={...common,cell_id:'fixture-decision-prefix',cell_kind:'shared-prefix',state_arm:'prefix',repetition:0,limits:{...limits,decision_state:false}};
    let prefixReceipts=[],deliveredId=null;const branchPrompts={};
    const create_client=({cell})=>{
      const receipts=cell.state_arm==='prefix'?[]:structuredClone(prefixReceipts);let calls=0;
      const transport=createStatelessRecyclingTransport({adapter_id:'decision-state-fixture',source_ref:'orchestrate-decision-state-v1.test.mjs',maximum_output_tokens:1024,measure_request:async()=>300,request_once:async({prompt})=>{
        calls++;let message;
        if(cell.state_arm==='prefix'&&calls===1)message={role:'assistant',tool_calls:[{id:'read-1',type:'function',function:{name:'read_file',arguments:stable({path:'query.py',start_line:1,line_count:1,revision:'base'})}}]};
        else if(cell.state_arm==='prefix'&&calls===2)message={role:'assistant',tool_calls:[{id:'edit-1',type:'function',function:{name:'apply_edits',arguments:stable({edits:[{path:'query.py',source_sha256:hash('value = 1\n'),old_text:'value = 1\n',new_text:'value = 2\n'}]})}}]};
        else if(cell.state_arm==='prefix')message={role:'assistant',tool_calls:[{id:'held-submit',type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'premature',context_read_ids:[deliveredId]})}}]};
        else {branchPrompts[cell.state_arm]=JSON.parse(prompt);message={role:'assistant',tool_calls:[{id:`submit-${cell.state_arm}`,type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Selected delivered source.',context_read_ids:[deliveredId]})}}]};}
        const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:300,output_tokens:20,finish_reason:'tool_calls'};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);if(cell.state_arm==='prefix')prefixReceipts=structuredClone(receipts);
        return {receipt,final_bytes:stable({message,finish_reason:'tool_calls'})};
      }});return {transport,receipts,maximum_model_retries:0};
    };
    const shared={task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,create_client,measure_index_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4)};
    const prefixRoot=join(root,'prefix');
    // The read identifier is deterministic after the first delivery, but the
    // held candidate is irrelevant to boundary classification.
    const prefixPromise=runPreparedTask({...shared,out:prefixRoot,cell:prefixCell,pause_at_decision_boundary:true});
    const prefix=await prefixPromise;
    deliveredId=bindDelivery({captures:prefix.captures,receipts:prefix.receipts}).read_observations[0].id;
    assert.equal(prefix.status,'shared_prefix_ready',prefix.error);assert.equal(prefix.shared_prefix_boundary.kind,'effect-confirmed');assert.equal(prefix.shared_prefix_boundary.held_tool_call_count,1);assert.equal(prefix.shared_prefix_boundary.no_tool_executed_after_confirmation,true);assert.match(prefix.patch,/value = 2/);assert.equal(prefix.continuation.state.decision_boundary.kind,'effect-confirmed');
    const controlCell={...common,cell_id:'fixture-decision-control',cell_kind:'branch',prefix_cell_id:prefixCell.cell_id,state_arm:'control',limits:{...limits,decision_state:false}};
    const stateCell={...common,cell_id:'fixture-decision-state',cell_kind:'branch',prefix_cell_id:prefixCell.cell_id,state_arm:'state',limits:{...limits,decision_state:true}};
    const control=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'control'),cell:controlCell});
    const state=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'state'),cell:stateCell});
    assert.equal(control.status,'final_context_selected',control.error);assert.equal(state.status,'final_context_selected',state.error);
    assert.equal(control.decision_state_presentations.length,0);assert.equal(state.decision_state_presentations.length,1);assert.equal(state.decision_state_presentations[0].phase,'effect');assert.equal(state.decision_state_presentations[0].model_calls,0);
    const cp=structuredClone(branchPrompts.control),sp=structuredClone(branchPrompts.state),i=sp.messages.findIndex(message=>message.content?.includes('DECISION STATE'));
    assert.ok(i>=0);sp.messages.splice(i,1);assert.deepEqual(sp,cp);
    const validation=validateDecisionStatePair({prefix,control,treatment:state});assert.equal(validation.ok,true,JSON.stringify(validation));
    const broken=structuredClone(state);broken.decision_state_presentations[0].phase='terminal';assert.equal(validateDecisionStatePair({prefix,control,treatment:broken}).ok,false);
  }finally{rmSync(root,{recursive:true,force:true});}
});
