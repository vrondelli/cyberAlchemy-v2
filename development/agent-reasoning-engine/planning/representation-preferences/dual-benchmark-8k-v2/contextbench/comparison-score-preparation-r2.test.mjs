import {runPreparedTask} from './discovery-v1/orchestrate-recovery-v2.mjs';
import {prepareComparisonPrediction} from './score-comparison-campaign-r2.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from './packet-diversity-v1/context-recycling-bounded-v3.mjs';
import {bodyForReceipt,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('native scorer preparation reads actual current ARE source layout and detects subsequent drift',async()=>{
 const mode='paired';
 const review=true;
 const root=mkdtempSync(join(tmpdir(),'are-v2-orchestrate-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);
  for(const name of ['a','b','c','d'])writeFileSync(join(cache,name+'.py'),name+' = 1\n');
  git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/fixture.git']);
  const task={instance_id:'fixture-v2',original_inst_id:'fixture-v2',repo:'example/fixture',repo_url:'https://github.com/example/fixture.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect the four fixture sources.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
  const cell={cell_id:'fixture-v2',instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{maximum_calls:96,output_cap:2048,total_tokens:96000,finalization_reserve_tokens:14000,finalization_calls:2,output_deferral:true,index_entries:10,index_tokens:1000,terminal_submission:true,terminal_content_fallback:true,terminal_evidence_review:review,maximum_terminal_corrections:0,compact_representation:true,discovery_retention:true,recovery_visibility:mode==='demand'?'demand':'eager'}};
  const create_client=()=>{
   const receipts=[];let n=0;
   const transport=createStatelessRecyclingTransport({adapter_id:'fixture-v2',source_ref:'orchestrate.test.mjs',maximum_output_tokens:2048,measure_request:async({prompt})=>{const wire=JSON.parse(prompt);receipts.push({kind:'tokenizer',dispatched:true,status:200,input_tokens:200,request_sha256:hash(stable({model:'glm-5.3-flash',...wire})),retained_reasoning_reservation:0,retained_reasoning_occurrences:0});return 712;},
    request_once:async({prompt})=>{
     n++;const wire=JSON.parse(prompt);let message,finish_reason;
     if(n===1){message={role:'assistant',tool_calls:['a','b','c','d'].map(name=>({id:name,type:'function',function:{name:'read_file',arguments:stable({path:name+'.py',start_line:1,line_count:1,revision:'base'})}}))};finish_reason='tool_calls';}
     else if(review&&n===3){const tool=wire.tools[0];message={role:'assistant',tool_calls:[{id:'selected',type:'function',function:{name:tool.function.name,arguments:stable({summary:'Four sources',context_handles:tool.function.parameters.properties.context_handles.items.enum})}}]};finish_reason='tool_calls';}
     else{message={role:'assistant',content:stable({summary:'Candidate',context_read_ids:review?[]:wire.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content).output.read_id)})};finish_reason='stop';}
     const receipt={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,latency_ms:1,input_tokens:200,output_tokens:10,reserved_input_tokens:712,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
     return {receipt,final_bytes:stable({message,finish_reason})};
    }});return {transport,receipts,maximum_model_retries:0};
  };

  const stage=join(root,'evidence');mkdirSync(stage);
  const persistence=createStagePersistence({stage_root:stage,stage_guard:createStageOutputGuard({root:stage})});
  const out=join(stage,'00'),source_root=join(root,'sources'),source=join(source_root,'00');mkdirSync(source_root);
  const result=await runPreparedTask({task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,out,evidence_root:stage,source_out:source,cell,create_client,measure_index_tokens:async text=>Math.ceil(text.length/4),persistence,admit_source:async()=>true});
  assert.equal(result.status,'final_context_selected');assert.ok(result.native_export);
  const input={slot:{sequence:0,arm:'current-are',task_path,task_sha256:hash(readFileSync(task_path)),instance_id:task.instance_id,base_commit:task.base_commit},outcome:{result},entry:{files:{'events.jsonl':hash(readFileSync(join(out,'events.jsonl')))}},runs_root:stage,source_root};
  const prepared=prepareComparisonPrediction(input);
  assert.deepEqual(prepared.prediction,result.native_export.prediction);
  assert.equal(prepared.verify(),true);
  writeFileSync(join(source,'base','a.py'),'changed = 2\n');
  assert.throws(()=>prepared.verify(),/base-revision-or-drift/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
