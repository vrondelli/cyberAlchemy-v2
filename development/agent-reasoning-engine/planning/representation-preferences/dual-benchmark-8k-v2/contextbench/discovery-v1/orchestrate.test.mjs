import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,writeSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {bodyForReceipt,stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runPreparedTask} from './orchestrate.mjs';
import {exportTerminalEvidenceSelection} from '../terminal-evidence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
for(const mode of ['baseline','review','discovery','result-write','journal-append','recycler-close','unknown-result-write'])test(`isolated orchestration and preserved accounting; mode=${mode}`,async()=>{
 const review=mode!=='baseline';let testReceipts;
 const root=mkdtempSync(join(tmpdir(),'are-v2-orchestrate-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);
  for(const name of ['a','b','c','d'])writeFileSync(join(cache,name+'.py'),name+' = 1\n');
  git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/fixture.git']);
  const task={instance_id:'fixture-v2',original_inst_id:'fixture-v2',repo:'example/fixture',repo_url:'https://github.com/example/fixture.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect the four fixture sources.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
  const cell={cell_id:'fixture-v2',instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{maximum_calls:4,output_cap:1024,total_tokens:10000,index_entries:10,index_tokens:1000,terminal_submission:true,terminal_content_fallback:true,terminal_evidence_review:review,maximum_terminal_corrections:0,compact_representation:true,discovery_retention:mode==='discovery'}};
  const create_client=()=>{
   const receipts=[];testReceipts=receipts;let n=0;
   const transport=createStatelessRecyclingTransport({adapter_id:'fixture-v2',source_ref:'orchestrate.test.mjs',maximum_output_tokens:1024,measure_request:async()=>200,
    request_once:async({prompt})=>{
     n++;const wire=JSON.parse(prompt);let message,finish_reason;
     if(n===1){message={role:'assistant',tool_calls:['a','b','c','d'].map(name=>({id:name,type:'function',function:{name:'read_file',arguments:stable({path:name+'.py',start_line:1,line_count:1,revision:'base'})}}))};finish_reason='tool_calls';}
     else if(review&&n===3){const tool=wire.tools[0];message={role:'assistant',tool_calls:[{id:'selected',type:'function',function:{name:tool.function.name,arguments:stable({summary:'Four sources',context_handles:tool.function.parameters.properties.context_handles.items.enum})}}]};finish_reason='tool_calls';}
     else{message={role:'assistant',content:stable({summary:'Candidate',context_read_ids:review?[]:wire.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content).output.read_id)})};finish_reason='stop';}
     const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
     return {receipt,final_bytes:stable({message,finish_reason})};
    }});return {transport,receipts,maximum_model_retries:0};
  };
  const input={task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,out:join(root,'run'),cell,create_client,measure_index_tokens:async text=>Math.ceil(text.length/4)};
  if(!['baseline','review','discovery'].includes(mode)){
   const injected=()=>Object.assign(Error('injected persistence failure'),{code:'ENOSPC'});
   input.io={write:(path,...args)=>{if(mode.includes('result-write')&&path.endsWith('/result.json')){if(mode==='unknown-result-write')delete testReceipts[0].output_tokens;throw injected();}return writeFileSync(path,...args);},writeJournal:(fd,text)=>{if(mode==='journal-append'&&text.includes('model-response'))throw injected();return writeSync(fd,text);},closeRecycler:recycler=>{recycler?.close();if(mode==='recycler-close')throw injected();}};
   await assert.rejects(runPreparedTask(input),error=>{assert.match(error.message,/orchestration.failed-with-accounting/);assert.equal(error.result.status,'orchestration_error');assert.equal(error.result.native_export,null);assert.equal(error.result.benchmark_cleared,false);assert.equal(error.receipts,testReceipts);assert.ok(error.result.persistence_failures.length);assert.equal(error.cause.message,'injected persistence failure');assert.equal(error.unknown_usage,mode==='unknown-result-write');if(mode==='unknown-result-write'){assert.equal(error.usage,undefined);assert.equal(error.receipt,undefined);}else{assert.equal(error.usage.total_tokens,testReceipts.length*210);assert.equal(error.receipt.usage.total_tokens,error.usage.total_tokens);}return true;});return;
  }
  const result=await runPreparedTask(input);assert.equal(result.status,'final_context_selected',result.error);assert.equal(result.export_error,undefined);
  assert.equal(result.selection.final_read_ids.length,4);assert.equal(result.receipts.length,review?3:2);
  const prediction=JSON.parse(readFileSync(join(root,'run/prediction.json')));
  assert.deepEqual(Object.keys(prediction.traj_data.pred_spans).sort(),['a.py','b.py','c.py','d.py']);
  if(review){
   const source_snapshots=readdirSync(join(root,'run/snapshots')).map(n=>JSON.parse(readFileSync(join(root,'run/snapshots',n))));
   const rebuilt=exportTerminalEvidenceSelection({...result,packet:result.terminal_evidence_presentations[0].packet,source_snapshots,task,response_capture:result.response_captures.at(-1)},join(root,'run/base'));
   assert.deepEqual(rebuilt.prediction,prediction);assert.deepEqual(rebuilt.selection,result.selection);
  }
  await assert.rejects(runPreparedTask(input),error=>{assert.match(error.message,/existing-run-no-replay/);assert.equal(error.usage.total_tokens,0);assert.equal(error.unknown_usage,false);return true;});
 }finally{rmSync(root,{recursive:true,force:true});}
});
