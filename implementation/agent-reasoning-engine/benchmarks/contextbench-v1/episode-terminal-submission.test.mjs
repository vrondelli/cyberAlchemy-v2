// Offline H9 instrument tests; no model-quality or benchmark-clearance claim.
// Open questions: research/contextbench-v1/PLAN-round5.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {runEpisode} from './episode.mjs';
import {exportModelSelectedContext} from './final-selection.mjs';
import {stable,bodyForReceipt,bindDelivery} from './delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');

async function exercise({scenario='valid',structured=true,budget=30000,finalize=false}={}){
  const root=mkdtempSync(join(tmpdir(),'are-terminal-submit-')),baseRoot=join(root,'base');mkdirSync(baseRoot);
  const base='one\ntwo\nthree\n',current='one\nchanged\nthree\n';writeFileSync(join(baseRoot,'a.txt'),base);
  const receipts=[],prompts=[],events=[];let executions=0,requests=0;
  const terminal=(id,ids,extra=[])=>({role:'assistant',tool_calls:[{id,type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Selected delivered base source.',context_read_ids:ids})}},...extra]});
  const delivered=p=>p.messages.filter(m=>m.role==='tool').map(m=>{try{return JSON.parse(m.content)}catch{return null}}).filter(x=>x?.ok&&x.output?.read_id).map(x=>x.output.read_id);
  const transport=createStatelessRecyclingTransport({adapter_id:'terminal-submission-fixture',source_ref:'episode-terminal-submission.test.mjs',maximum_output_tokens:1024,measure_request:async()=>200,
    request_once:async({prompt})=>{requests++;const p=JSON.parse(prompt);prompts.push(p);const ids=delivered(p);let message,finish_reason;
      if(requests===1){message={role:'assistant',tool_calls:[{id:'read-current',type:'function',function:{name:'read_file',arguments:stable({path:'a.txt',start_line:1,line_count:3,revision:scenario==='provenance'?'current':'base'})}}]};finish_reason='tool_calls';}
      else if(scenario==='freeform-correction'&&requests===2){message={role:'assistant',content:'```json\n'+stable({summary:'bad shape',context_read_ids:ids})+'\n```'};finish_reason='stop';}
      else if(scenario==='provenance'&&requests===2){message=terminal('submit-current',ids.slice(-1));finish_reason='tool_calls';}
      else if(scenario==='provenance'&&requests===3){assert.ok(p.messages.some(m=>m.content?.includes('final-selection.changed-source-lines')));message={role:'assistant',tool_calls:[{id:'read-base',type:'function',function:{name:'read_file',arguments:stable({path:'a.txt',start_line:1,line_count:3,revision:'base'})}}]};finish_reason='tool_calls';}
      else if(scenario==='mixed'&&requests===2){message=terminal('submit-mixed',ids.slice(-1),[{id:'forbidden-edit',type:'function',function:{name:'apply_edits',arguments:stable({edits:[]})}}]);finish_reason='tool_calls';}
      else if(structured){message=terminal('submit-'+requests,ids.slice(-1));finish_reason='tool_calls';}
      else{message={role:'assistant',content:stable({summary:'Selected delivered base source.',context_read_ids:ids.slice(-1)})};finish_reason='stop';}
      const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:200,output_tokens:10,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
    }});
  const task={instance_id:'fixture',repo_url:'https://github.com/example/fixture.git',base_commit:'a'.repeat(40),problem_statement:'Select relevant pinned source.'};
  const recycler=openContextRecycling({transport,fixture_root:baseRoot,scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
  try{
    const result=await runEpisode({task,arm:'baseline',client:{receipts,maximum_model_retries:0},recycler,
      tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}},{type:'function',function:{name:'apply_edits',parameters:{type:'object'}}}],
      execute_tool:async(name,args)=>{executions++;assert.equal(name,'read_file','terminal and mixed mutation calls must not execute');const text=args.revision==='current'?current:base;return{ok:true,output:{path:'a.txt',start_line:1,end_line:3,utf8:text.trimEnd(),source_sha256:hash(text)}};},
      source_context:()=>({snapshots:[{path:'a.txt',source_sha256:hash(current),utf8:current}],repoRoot:baseRoot}),measure_index_tokens:async()=>100,
      limits:{maximum_calls:finalize?3:6,output_cap:1024,total_tokens:budget,index_entries:8,index_tokens:1024,terminal_submission:structured,...(finalize?{finalization_reserve_tokens:2500,finalization_calls:2}:{})},run_id:'fixture',on_event:async e=>events.push(e)});
    const exported=result.status==='final_context_selected'?exportModelSelectedContext({...result,task,source_snapshots:[{path:'a.txt',source_sha256:hash(current),utf8:current}],response_capture:result.response_captures.at(-1)},baseRoot):null;
    return{result,exported,prompts,events,executions,requests,binding:bindDelivery(result)};
  }finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}

test('valid terminal submission ends episode without executor call or acknowledgement',async()=>{
  const r=await exercise();assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,2);assert.equal(r.executions,1);
  assert.equal(r.result.selection.terminal_submission_call_id,'submit-2');assert.deepEqual(r.exported.prediction.traj_data.pred_spans,{'a.txt':[{start:1,end:3}]});
  assert.equal(r.binding.read_observations.length,1);assert.ok(r.prompts[0].tools.some(t=>t.function.name==='submit_context_selection'));
});
test('free-form terminal answer receives one structured correction',async()=>{
  const r=await exercise({scenario:'freeform-correction'});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,3);assert.equal(r.result.terminal_corrections,1);assert.equal(r.executions,1);
  assert.ok(r.prompts[2].messages.some(m=>m.content?.includes('final-selection.terminal-tool-required')));
});
test('structured provenance rejection can retrieve base evidence during exploration',async()=>{
  const r=await exercise({scenario:'provenance'});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,4);assert.equal(r.executions,2);assert.equal(r.result.terminal_corrections,1);
  assert.ok(r.events.some(e=>e.kind==='terminal-submission-rejected'&&e.diagnostic.issues.some(i=>i.code==='final-selection.changed-source-lines')));
  assert.deepEqual(r.exported.prediction.traj_data.pred_spans,{'a.txt':[{start:1,end:3}]});
});
test('mixed terminal and mutation calls are rejected with zero mutation effects',async()=>{
  const r=await exercise({scenario:'mixed'});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,3);assert.equal(r.executions,1);assert.equal(r.result.terminal_corrections,1);
  assert.ok(r.result.history.some(m=>m.role==='tool'&&m.tool_call_id==='forbidden-edit'&&JSON.parse(m.content).effects==='none'));
});
test('reserved finalization exposes only terminal submission and uses no repository tool',async()=>{
  const r=await exercise({finalize:true});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,2);assert.equal(r.executions,1);
  assert.deepEqual(r.prompts[1].tools.map(t=>t.function.name),['submit_context_selection']);assert.ok(r.result.finalizing);
});
test('default free-form terminal behavior remains available when opt-in is false',async()=>{
  const r=await exercise({structured:false});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.result.selection.terminal_submission_call_id,undefined);assert.equal(r.requests,2);
});
test('token admission denial cannot create a terminal submission or executor effect',async()=>{
  const r=await exercise({budget:1000});assert.equal(r.result.status,'token_budget_stopped');assert.equal(r.requests,0);assert.equal(r.executions,0);assert.equal(r.result.selection,null);
});
