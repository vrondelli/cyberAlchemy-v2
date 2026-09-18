// H58 causal-boundary fixture. No provider, network, credentials, or benchmark gold.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';
import {runPreparedBranch,runPreparedTask} from './orchestrate-first-evidence-guidance-v1.mjs';
import {validateFirstEvidenceGuidancePair} from './first-evidence-guidance-validation.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');

test('first confirmed read forks before held response effects and guides treatment once',async()=>{
  const root=mkdtempSync(join(tmpdir(),'are-first-evidence-')),cache=join(root,'cache');mkdirSync(cache);
  const git=args=>execFileSync('git',args,{cwd:cache,encoding:'utf8'}).trim();
  try{
    git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);
    writeFileSync(join(cache,'query.py'),'value = 1\n');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/first-evidence.git']);
    const task={instance_id:'fixture-first-evidence',original_inst_id:'fixture-first-evidence',repo:'example/first-evidence',repo_url:'https://github.com/example/first-evidence.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect query.py and preserve the value.',source:'fixture'};
    const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
    const limits={maximum_calls:5,output_cap:1024,total_tokens:96000,index_entries:8,index_tokens:1024,finalization_reserve_tokens:0,output_deferral:true,terminal_submission:true,terminal_content_fallback:true,incomplete_output_corrections:0,maximum_terminal_corrections:0,task_state_projection:false,task_state_novelty_gate:false,terminal_effect_state:false,evidence_slate_candidates:8,evidence_slate_bytes:4096,evidence_slate_tokens:1024};
    const common={instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,repetition:1,provider_profile:{fixture:true}};
    const prefixCell={...common,cell_id:'fixture-first-prefix',cell_kind:'shared-prefix',state_arm:'prefix',repetition:0,limits:{...limits,evidence_slate:false}};
    let prefixReceipts=[],deliveredId=null;const branchPrompts={};
    const create_client=({cell})=>{
      const receipts=cell.state_arm==='prefix'?[]:structuredClone(prefixReceipts);let calls=0;
      const transport=createStatelessRecyclingTransport({adapter_id:'first-evidence-fixture',source_ref:'orchestrate-first-evidence-guidance-v1.test.mjs',maximum_output_tokens:1024,measure_request:async()=>300,request_once:async({prompt})=>{
        calls++;let message;
        if(cell.state_arm==='prefix'&&calls===1)message={role:'assistant',tool_calls:[{id:'read-1',type:'function',function:{name:'read_file',arguments:stable({path:'query.py',start_line:1,line_count:1,revision:'base'})}}]};
        else if(cell.state_arm==='prefix')message={role:'assistant',tool_calls:[{id:'held-write',type:'function',function:{name:'write_file',arguments:stable({path:'query.py',content:'value = 999\n'})}}]};
        else {branchPrompts[cell.state_arm]=JSON.parse(prompt);message={role:'assistant',tool_calls:[{id:`submit-${cell.state_arm}`,type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Selected delivered query source.',context_read_ids:[deliveredId]})}}]};}
        const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:300,output_tokens:20,finish_reason:'tool_calls'};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);if(cell.state_arm==='prefix')prefixReceipts=structuredClone(receipts);
        return {receipt,final_bytes:stable({message,finish_reason:'tool_calls'})};
      }});
      return {transport,receipts,maximum_model_retries:0};
    };
    const shared={task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,create_client,measure_index_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4)};
    const prefixRoot=join(root,'prefix');const prefix=await runPreparedTask({...shared,out:prefixRoot,cell:prefixCell,pause_after_first_confirmed_read:true});
    assert.equal(prefix.status,'shared_prefix_ready',prefix.error);assert.equal(prefix.shared_prefix_boundary.kind,'first-evidence-delivery');assert.equal(prefix.shared_prefix_boundary.held_tool_call_count,1);assert.equal(prefix.shared_prefix_boundary.no_tool_executed_after_confirmation,true);assert.equal(prefix.patch,'');
    deliveredId=prefix.shared_prefix_boundary.confirmed_read_ids[0];assert.match(deliveredId,/^[a-f0-9]{64}$/);assert.ok(prefix.continuation.state.pending_source_feedback.includes('None of its proposed tool effects ran'));
    const controlCell={...common,cell_id:'fixture-first-control',cell_kind:'branch',prefix_cell_id:prefixCell.cell_id,state_arm:'control',limits:{...limits,evidence_slate:false}};
    const stateCell={...common,cell_id:'fixture-first-state',cell_kind:'branch',prefix_cell_id:prefixCell.cell_id,state_arm:'state',limits:{...limits,evidence_slate:true}};
    const control=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'control'),cell:controlCell});
    const state=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'state'),cell:stateCell});
    assert.equal(control.status,'final_context_selected',control.error);assert.equal(state.status,'final_context_selected',state.error);assert.equal(control.patch,'');assert.equal(state.patch,'');
    assert.equal(control.evidence_slate_presentations.length,0);assert.equal(state.evidence_slate_presentations.length,1);assert.equal(state.evidence_slate_presentations[0].fit.retained_candidates,1);
    const cp=structuredClone(branchPrompts.control),sp=structuredClone(branchPrompts.state),guidanceIndex=sp.messages.findIndex(message=>message.content?.includes('MID-TRAJECTORY EVIDENCE GUIDANCE'));
    assert.ok(guidanceIndex>=0);sp.messages.splice(guidanceIndex,1);assert.deepEqual(sp,cp);
    assert.equal(control.receipts.length-prefixReceipts.length,1);assert.equal(state.receipts.length-prefixReceipts.length,1);
    const validation=validateFirstEvidenceGuidancePair({prefix,control,treatment:state});assert.equal(validation.ok,true,JSON.stringify(validation));
  }finally{rmSync(root,{recursive:true,force:true});}
});
