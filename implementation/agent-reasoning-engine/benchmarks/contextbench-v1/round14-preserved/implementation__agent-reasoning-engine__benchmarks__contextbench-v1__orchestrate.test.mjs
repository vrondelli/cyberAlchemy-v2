import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';import {runPreparedTask} from './orchestrate.mjs';
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
