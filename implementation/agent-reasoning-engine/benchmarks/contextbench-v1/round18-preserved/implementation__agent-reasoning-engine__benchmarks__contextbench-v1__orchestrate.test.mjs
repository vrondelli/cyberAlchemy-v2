import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';import {runPreparedBranch,runPreparedTask} from './orchestrate.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('isolated original task -> real source read -> model selection -> native prediction with durable evidence',async()=>{
 const root=mkdtempSync(join(tmpdir(),'are-cb-orchestrate-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);writeFileSync(join(cache,'a.py'),'value = 1\n');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/fixture.git']);
  const task={instance_id:'fixture-1',original_inst_id:'fixture-1',repo:'example/fixture',repo_url:'https://github.com/example/fixture.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect the fixture and report its source context.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
  const cell={cell_id:'fixture-baseline',instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{maximum_calls:3,output_cap:1024,total_tokens:10000,index_entries:10,index_tokens:1000}};
  const create_client=()=>{
    const receipts=[];let n=0;
    const transport=createStatelessRecyclingTransport({adapter_id:'fixture',source_ref:'orchestrate.test.mjs',maximum_output_tokens:1024,measure_request:async()=>200,request_once:async({prompt})=>{
      n++;const messages=JSON.parse(prompt).messages;
      const message=n===1?{role:'assistant',tool_calls:[{id:'r1',type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1,line_count:1,revision:'base'})}}]}:
        {role:'assistant',content:stable({summary:'Observed source',context_read_ids:[JSON.parse(messages.find(m=>m.role==='tool').content).output.read_id]})};
      const finish_reason=n===1?'tool_calls':'stop',receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
      return {receipt,final_bytes:stable({message,finish_reason})};
    }});return {transport,receipts,maximum_model_retries:0};
  };
  const input={task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,out:join(root,'run'),cell,create_client,measure_index_tokens:async text=>text.length};
  const r=await runPreparedTask(input);assert.equal(r.status,'final_context_selected');assert.equal(r.export_error,undefined);
  const pred=JSON.parse(readFileSync(join(root,'run/prediction.json')));assert.deepEqual(pred.traj_data.pred_spans,{'a.py':[{start:1,end:1}]});
  const journal=readFileSync(join(root,'run/events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(journal[0].kind,'dispatch-admission');assert.ok(journal[0].captures[0].prompt_sha256);assert.ok(existsSync(join(root,'run/completed.json')));
  await assert.rejects(runPreparedTask(input),/existing-run-no-replay/);
  writeFileSync(task_path,stable({...task,gold_context:'forbidden'}));
  await assert.rejects(runPreparedTask({...input,out:join(root,'bad'),task_sha256:hash(readFileSync(task_path))}),/task-fields/);
  assert.equal(existsSync(join(root,'bad')),false);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('prepared shared prefix forks into isolated causally bound branches',async()=>{
 const root=mkdtempSync(join(tmpdir(),'are-cb-orchestrate-fork-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);writeFileSync(join(cache,'a.py'),'value = 1\n');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/fork.git']);
  const task={instance_id:'fixture-fork',original_inst_id:'fixture-fork',repo:'example/fork',repo_url:'https://github.com/example/fork.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect the fork fixture.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));let prefixReceipts=[];
  const baseLimits={maximum_calls:5,output_cap:1024,total_tokens:10000,index_entries:10,index_tokens:1000,task_state_bytes:4096,task_state_tokens:2000,task_state_evidence:8,task_state_outcomes:12,task_state_include_outcomes:false};
  const common={instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,repetition:1,provider_profile:{fixture:true}};
  const prefixCell={...common,cell_id:'fixture-prefix',state_arm:'prefix',limits:{...baseLimits,task_state_projection:false}};
  const create_client=({cell})=>{
   const receipts=cell.state_arm==='prefix'?[]:structuredClone(prefixReceipts),prompts=[];
   const transport=createStatelessRecyclingTransport({adapter_id:'fork-fixture',source_ref:'orchestrate.test.mjs:fork',maximum_output_tokens:1024,
    measure_request:async({prompt})=>JSON.parse(prompt).messages.filter(message=>message.role==='tool').length>=2?6500:200,
    request_once:async({prompt})=>{prompts.push(prompt);const parsed=JSON.parse(prompt);let message,finish_reason;
     if(receipts.length<2){message={role:'assistant',tool_calls:[{id:`read-${receipts.length+1}`,type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1,line_count:1,revision:'base'})}}]};finish_reason='tool_calls';}
     else {const stateMessage=parsed.messages.find(item=>item.content?.startsWith('POST-RECYCLE OBSERVED TASK STATE'));const ids=stateMessage?JSON.parse(stateMessage.content.split('\n').slice(1).join('\n')).evidence.map(item=>item.read_id):[];message={role:'assistant',content:stable({summary:'branch',context_read_ids:ids})};finish_reason='stop';}
     const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);if(cell.state_arm==='prefix')prefixReceipts=structuredClone(receipts);return {receipt,final_bytes:stable({message,finish_reason})};
   }});return {transport,receipts,prompts,maximum_model_retries:0};
  };
  const shared={task_path,task_sha256:hash(readFileSync(task_path)),create_client,measure_index_tokens:async text=>text.length};
  const prefixRoot=join(root,'prefix'),prefix=await runPreparedTask({...shared,repository_cache:cache,out:prefixRoot,cell:prefixCell,pause_after_first_recycle:true});
  assert.equal(prefix.status,'shared_prefix_ready',prefix.error);assert.equal(prefixReceipts.length,2);
  const controlCell={...common,cell_id:'fixture-control-1',state_arm:'control',limits:{...baseLimits,task_state_projection:false}};
  const stateCell={...common,cell_id:'fixture-state-1',state_arm:'state',limits:{...baseLimits,task_state_projection:true}};
  const control=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'control'),cell:controlCell});
  const state=await runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'state'),cell:stateCell});
  assert.equal(control.status,'no_context_selected',control.error);assert.equal(state.status,'final_context_selected',state.error);
  assert.equal(control.prefix_ancestry.prefix_tree_digest,state.prefix_ancestry.prefix_tree_digest);assert.equal(control.prefix_model_tokens,420);assert.equal(state.prefix_model_tokens,420);
  assert.deepEqual(control.receipts.slice(0,2),state.receipts.slice(0,2));assert.equal(control.task_state_presentations.length,0);assert.equal(state.task_state_presentations.length,1);
  assert.equal(existsSync(join(root,'state','prediction.json')),true);assert.equal(existsSync(join(root,'control','prediction.json')),false);
  assert.equal(readFileSync(join(root,'prefix/work/a.py'),'utf8'),'value = 1\n');
  const drift={...stateCell,recycle_at:6999};await assert.rejects(runPreparedBranch({...shared,prefix_root:prefixRoot,out:join(root,'drift'),cell:drift}),/branch-policy-drift/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
