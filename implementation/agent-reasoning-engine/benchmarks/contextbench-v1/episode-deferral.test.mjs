// Offline instrument tests; no model-quality or benchmark-clearance claim.
// Open questions: research/contextbench-v1/PLAN-round4.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport, openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {runEpisode} from './episode.mjs';
import {exportModelSelectedContext} from './final-selection.mjs';
import {stable, bodyForReceipt, bindDelivery} from './delivery.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');

async function exercise({arm='baseline', enabled=true, mode='recover', budget=30000, reserve=0}={}) {
  const root=mkdtempSync(join(tmpdir(),'are-deferral-')), baseRoot=join(root,'base');
  mkdirSync(baseRoot);
  const base='relevant source\n'+'x'.repeat(30000)+'\n';
  writeFileSync(join(baseRoot,'a.txt'),base);
  const receipts=[],prompts=[],measured=[],journal=[];
  const transport=createStatelessRecyclingTransport({adapter_id:'deferral-fixture',source_ref:'episode-deferral.test.mjs',maximum_output_tokens:1024,
    measure_request:async ({prompt})=>{
      measured.push(prompt);
      if(mode==='full-fits')return measured.length===2?6500:500;
      if(mode==='nothing-fits'&&receipts.length)return 6500;
      return Math.ceil(Buffer.byteLength(prompt)/4);
    },
    request_once:async ({prompt})=>{
      const p=JSON.parse(prompt);prompts.push(p);
      if(mode==='failed-dispatch'&&prompts.length===2)throw Error('fixture.provider-failure');
      const notice=p.messages.some(m=>m.role==='tool'&&JSON.parse(m.content).error==='tool-output-deferred');
      let message,finish_reason;
      if(!p.tools.length){
        message={role:'assistant',content:stable({summary:'Source could not be delivered before finalization.',context_read_ids:[]})};finish_reason='stop';
      }else if(prompts.length===1||notice){
        message={role:'assistant',tool_calls:[{id:'read-'+prompts.length,type:'function',function:{name:'read_file',arguments:stable({path:'a.txt',start_line:1,line_count:notice?1:2,revision:'base'})}}]};
        finish_reason='tool_calls';
      }else{
        const delivered=p.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).filter(o=>o.ok&&o.output?.read_id);
        assert.ok(delivered.length,'source must actually reach continuation');
        message={role:'assistant',content:stable({summary:'Relevant base source selected.',context_read_ids:[delivered.at(-1).output.read_id]})};finish_reason='stop';
      }
      const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:Math.ceil(Buffer.byteLength(prompt)/4),output_tokens:10,finish_reason};
      receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
      return {receipt,final_bytes:stable({message,finish_reason})};
    }});
  const task={instance_id:'fixture',repo_url:'https://github.com/example/fixture.git',base_commit:'a'.repeat(40),problem_statement:'Find the relevant base source.'};
  const recycler=openContextRecycling({transport,fixture_root:baseRoot,scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
  try{
    const result=await runEpisode({task,arm,client:{receipts,maximum_model_retries:0},recycler,
      tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],
      execute_tool:async (_name,args)=>({ok:true,output:{path:'a.txt',start_line:1,end_line:args.line_count,utf8:base.split('\n').slice(0,args.line_count).join('\n'),source_sha256:hash(base)}}),
      source_context:()=>({snapshots:[],repoRoot:baseRoot}),measure_index_tokens:async()=>100,
      limits:{maximum_calls:4,output_cap:1024,total_tokens:budget,index_entries:8,index_tokens:1024,output_deferral:enabled,finalization_reserve_tokens:reserve,finalization_calls:2},run_id:'fixture',on_event:async e=>journal.push(e)});
    const binding=bindDelivery(result);
    const exported=result.status==='final_context_selected'?exportModelSelectedContext({...result,task,source_snapshots:[],response_capture:result.response_captures.at(-1)},baseRoot):null;
    return {result,binding,exported,prompts,measured,journal};
  }finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}

test('both arms recover oversized read via delivered notice and smaller read, with native source export',async()=>{
  for(const arm of ['baseline','index']){
    const r=await exercise({arm});
    assert.equal(r.result.status,'final_context_selected',r.result.error);
    assert.equal(r.prompts.length,3);assert.equal(r.result.tool_output_deferrals.length,1);
    assert.equal(r.binding.read_observations.length,1);
    const withheld=r.result.events[0].output.output.read_id;
    assert.ok(!r.result.selection.final_read_ids.includes(withheld));
    assert.deepEqual(r.exported.prediction.traj_data.pred_spans,{'a.txt':[{start:1,end:1}]});
    assert.ok(r.result.history.some(m=>m.role==='tool'&&m.content.includes('x'.repeat(30000))),'journal retains full original source');
    assert.ok(r.result.recycling.recycles>0);
    assert.equal(r.binding.token_accounting.known_total_tokens,r.result.receipts.reduce((n,r)=>n+r.input_tokens+r.output_tokens,0));
  }
});
test('full fresh fit delivers full source without crediting a merely constructed deferral',async()=>{
  const r=await exercise({mode:'full-fits'});
  assert.equal(r.result.status,'final_context_selected',r.result.error);
  assert.equal(r.result.tool_output_deferrals.length,0);assert.equal(r.prompts.length,2);
  assert.deepEqual(r.exported.prediction.traj_data.pred_spans,{'a.txt':[{start:1,end:2}]});
});
test('default-disabled projection retains explicit no-fit outcome',async()=>{
  const r=await exercise({enabled:false});
  assert.equal(r.result.status,'context_budget_stopped');assert.equal(r.prompts.length,1);
  assert.equal(r.result.tool_output_deferrals.length,0);assert.equal(r.binding.read_observations.length,0);
});
test('deferral cannot override context admission',async()=>{
  const r=await exercise({mode:'nothing-fits'});
  assert.equal(r.result.status,'context_budget_stopped');assert.equal(r.prompts.length,1);
  assert.equal(r.result.tool_output_deferrals.length,0);
});
test('failed deferral dispatch creates no delivered notice or source credit',async()=>{
  const r=await exercise({mode:'failed-dispatch'});
  assert.equal(r.result.status,'run_error');assert.equal(r.result.error,'fixture.provider-failure');
  assert.equal(r.result.tool_output_deferrals.length,0);assert.equal(r.binding.read_observations.length,0);
});
test('cumulative token denial does not deliver a constructed notice',async()=>{
  const r=await exercise({budget:1700});
  assert.equal(r.result.status,'token_budget_stopped');assert.equal(r.prompts.length,1);
  assert.equal(r.result.tool_output_deferrals.length,0);assert.equal(r.binding.read_observations.length,0);
});
test('a denied exploration deferral can be remeasured for tools-disabled finalization',async()=>{
  const r=await exercise({budget:4000,reserve:2300});
  assert.ok(r.result.admissions.some(a=>a.reason==='token-budget.finalization-reserved'));
  assert.equal(r.result.status,'no_context_selected',r.result.error);
  assert.equal(r.prompts.length,2);assert.deepEqual(r.prompts.at(-1).tools,[]);
  assert.equal(r.result.events.length,1,'no recovery tool may execute in finalization');
  assert.equal(r.result.tool_output_deferrals.length,1);
  assert.equal(r.binding.read_observations.length,0);
});
