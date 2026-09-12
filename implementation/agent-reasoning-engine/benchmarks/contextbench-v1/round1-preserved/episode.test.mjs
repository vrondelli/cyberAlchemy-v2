import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {runEpisode} from './episode.mjs';
import {stable,bodyForReceipt} from './delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function run({arm='baseline',budget=10000,pressure=false,badTool=false}={}){
  const root=mkdtempSync(join(tmpdir(),'are-cb-loop-'));mkdirSync(join(root,'fixture'));
  const receipts=[];let requests=0;
  const transport=createStatelessRecyclingTransport({adapter_id:'cb-offline-test',source_ref:'episode.test.mjs',maximum_output_tokens:1024,
    measure_request:async({prompt})=>pressure&&JSON.parse(prompt).messages.length>5?6500:200,
    request_once:async({prompt,dispatch})=>{
      requests++;
      const messages=JSON.parse(prompt).messages;
      let message,finish_reason;
      if(requests===1||(pressure&&requests===2)||(badTool&&requests===2)){
        const arguments_=badTool&&requests===1?'broken-json':stable({path:'a.py',start_line:1,line_count:1});
        message={role:'assistant',tool_calls:[{id:`r${requests}`,type:'function',function:{name:'read_file',arguments:arguments_}}]};finish_reason='tool_calls';
      }else{
        const ids=[];
        for(const m of messages){
          if(m.role==='tool'){const o=JSON.parse(m.content);if(o.output?.read_id)ids.push(o.output.read_id);}
          if(m.role==='user'&&m.content.startsWith('{"observed_source_index"'))ids.push(...JSON.parse(m.content).observed_source_index.map(x=>x.read_id));
        }
        message={role:'assistant',content:stable({summary:'Fixture complete',context_read_ids:[...new Set(ids)]})};finish_reason='stop';
      }
      const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};
      receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
      return {receipt,final_bytes:stable({message,finish_reason})};
    }});
  const task={problem_statement:'Fix the fixture issue'},recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture-base']}}});
  try{
    const result=await runEpisode({task,arm,client:{receipts,transport,maximum_model_retries:0},recycler,
      tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],
      execute_tool:async()=>({ok:true,output:{path:'a.py',start_line:1,end_line:1,utf8:'source',source_sha256:hash('source')}}),
      measure_index_tokens:async s=>s.length,limits:{maximum_calls:4,output_cap:1024,total_tokens:budget,index_entries:10,index_tokens:1000},run_id:'fixture'});
    return {...result,requests};
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
test('malformed tool call yields feedback and permits correction in same loop',async()=>{
  const r=await run({badTool:true});assert.equal(r.status,'final_context_selected');
  assert.equal(r.events[0].output.ok,false);assert.equal(r.events[1].output.ok,true);
  assert.equal(r.requests,3);
});
