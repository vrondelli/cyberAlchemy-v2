// Offline actual recycler/episode integration; no provider or gold.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runEpisode} from './episode.mjs';
import {EXPANDED,EXPANDED_TOOL,exportTerminalEvidenceSelection} from '../terminal-evidence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function exercise({candidate='raw',forced=false,maxCalls=6,budget=30000,noReady=false,recycleReview=false,oversizeReview=false,badReview=false,wrongReviewReceipt=false,incompleteReview=false}={}){
 const root=mkdtempSync(join(tmpdir(),'dual8k-episode-')),base=join(root,'base');mkdirSync(base);
 const names=['alpha','beta','gamma','delta'],snapshots=names.map(name=>{const utf8='function '+name+'() {}\n';writeFileSync(join(base,name+'.js'),utf8);return {path:name+'.js',utf8,source_sha256:hash(utf8)};});
 const receipts=[],prompts=[],events=[],executions=[];let requests=0,reviewMeasures=0;
 const tool=(id,name,args)=>({id,type:'function',function:{name,arguments:stable(args)}});
 const transport=createStatelessRecyclingTransport({adapter_id:'dual8k-terminal-review-fixture',source_ref:'episode-integration.test.mjs',maximum_output_tokens:512,
  measure_request:async({prompt})=>{const p=JSON.parse(prompt);if(p.tools.some(t=>t.function.name===EXPANDED_TOOL)){reviewMeasures++;if(oversizeReview)return 7900;if(recycleReview&&reviewMeasures===1)return 7100;}return 200;},
  request_once:async({prompt})=>{
   requests++;const p=JSON.parse(prompt);prompts.push(p);let message,finish_reason='tool_calls';
   if(p.tools.some(t=>t.function.name===EXPANDED_TOOL))message={role:'assistant',tool_calls:[tool('review',EXPANDED_TOOL,{summary:'Reviewed delivered base source.',context_handles:badReview?['h99']:['h0','h1','h2','h3']})]};
   else if(requests===1)message={role:'assistant',tool_calls:names.map(n=>tool('read-'+n,'read_file',{path:n+'.js',start_line:1,line_count:1,revision:'base'}))};
   else if(forced)message={role:'assistant',tool_calls:[tool('patch','get_patch',{})]};
   else if(candidate==='tool')message={role:'assistant',tool_calls:[tool('held-submit','submit_context_selection',{summary:'No selection yet.',context_read_ids:[]}),tool('held-edit','apply_edits',{edits:[]})]};
   else{message={role:'assistant',content:stable({summary:'No selection yet.',context_read_ids:[]})};finish_reason='stop';}
   const receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,input_tokens:200,output_tokens:10,finish_reason};if(incompleteReview&&p.tools.some(t=>t.function.name===EXPANDED_TOOL)){receipt.output_tokens=512;receipt.finish_reason='length';receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);throw Object.assign(Error('glm.incomplete-output'),{code:'incomplete-output'});}receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));if(wrongReviewReceipt&&p.tools.some(t=>t.function.name===EXPANDED_TOOL))receipt.request_sha256='f'.repeat(64);receipts.push(receipt);return {receipt,final_bytes:stable({message,finish_reason})};
  }});
 const task={instance_id:'fixture',repo_url:'https://example.invalid/fixture.git',base_commit:'a'.repeat(40),problem_statement:'Find alpha beta gamma delta source.'};
 const recycler=openContextRecycling({transport,fixture_root:base,scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
 try{
  const result=await runEpisode({task,arm:'baseline',client:{receipts,maximum_model_retries:0},recycler,tools:['read_file','get_patch','apply_edits'].map(name=>({type:'function',function:{name,parameters:{type:'object'}}})),
   execute_tool:async(name,args)=>{executions.push(name);if(name==='get_patch')return {ok:true,output:{patch:''}};assert.equal(name,'read_file','held tool effects must not execute');const row=snapshots.find(s=>s.path===args.path);return {ok:true,output:{...row,start_line:1,end_line:1,utf8:row.utf8.trimEnd()}};},
   source_context:()=>({snapshots,repoRoot:base,patch:''}),measure_index_tokens:async text=>noReady?9999:Math.ceil(text.length/4),
   limits:{maximum_calls:forced?4:maxCalls,output_cap:512,total_tokens:budget,index_entries:8,index_tokens:1024,terminal_submission:true,terminal_content_fallback:true,maximum_terminal_corrections:0,incomplete_output_corrections:0,terminal_evidence_review:true,terminal_evidence_version:EXPANDED,terminal_evidence_max_handles:32,terminal_evidence_max_state_bytes:8192,terminal_evidence_max_state_tokens:2048,compact_representation:true,...(forced?{finalization_reserve_tokens:1500,finalization_calls:2}:{})},run_id:'fixture',on_event:async e=>events.push(e)});
  const exported=result.status==='final_context_selected'?exportTerminalEvidenceSelection({...result,packet:result.terminal_evidence_packet,response_capture:result.response_captures.at(-1),source_snapshots:snapshots,task},base):null;
  return {result,exported,requests,prompts,events,executions,reviewMeasures};
 }finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}
test('early raw empty candidate is held for exactly one review, fourth handle reaches native export',async()=>{
 const r=await exercise();assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,3);assert.equal(r.result.terminal_evidence_held.length,1);assert.equal(r.result.terminal_evidence_presentations.length,1);assert.equal(r.result.selection.final_read_ids.length,4);assert.deepEqual(r.exported.prediction.traj_data.pred_files,['alpha.js','beta.js','delta.js','gamma.js']);assert.equal(r.result.receipts.reduce((n,x)=>n+x.input_tokens+x.output_tokens,0),630);
 const p=r.prompts.at(-1);assert.deepEqual(p.tools,[r.result.terminal_evidence_packet.model.tool]);assert.match(p.messages[0].content,/submit_context_handles_v2/);assert.doesNotMatch(p.messages[0].content,/submit_context_selection/);assert.ok(p.messages.some(m=>m.content?.includes('No selection yet.')),'visible held history retained');
});
test('mixed terminal/tool candidate closes held tools with zero effects',async()=>{
 const r=await exercise({candidate:'tool'});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,3);assert.deepEqual(r.executions,['read_file','read_file','read_file','read_file']);
 for(const id of ['held-submit','held-edit'])assert.equal(JSON.parse(r.result.history.find(m=>m.role==='tool'&&m.tool_call_id===id).content).effects,'none');
});
test('forced finalization directly presents evidence without a redundant held model call',async()=>{
 const r=await exercise({forced:true});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.requests,3);assert.equal(r.result.terminal_evidence_held.length,0);assert.equal(r.result.terminal_evidence_presentations.length,1);
});
test('only actual successful request receives a private packet after native recycle renders alternatives',async()=>{
 const r=await exercise({recycleReview:true});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.ok(r.reviewMeasures>=2);assert.equal(r.result.terminal_evidence_presentations.length,1);assert.equal(r.result.terminal_evidence_presentations[0].request_sha256,r.result.receipts.at(-1).request_sha256);assert.ok(r.result.captures.length>r.requests);assert.equal(r.result.recycling.recycles,1);
});
test('non-ready evidence cannot dispatch review or synthesize an empty success',async()=>{
 const r=await exercise({noReady:true});assert.equal(r.requests,2);assert.equal(r.result.selection,null);assert.match(r.result.error,/terminal-evidence-not-ready/);assert.equal(r.result.terminal_evidence_presentations.length,0);
});
test('original token and call budgets can stop held review without an extra dispatch',async()=>{
 for(const options of [{budget:1000},{maxCalls:2}]){const r=await exercise(options);assert.equal(r.requests,2);assert.equal(r.result.selection,null);assert.equal(r.result.terminal_evidence_presentations.length,0);assert.ok(['token_budget_stopped','call_budget_exhausted'].includes(r.result.status),r.result.error);}
});
test('entire actual request must fit native8K admission; invalid review gets no correction',async()=>{
 const large=await exercise({oversizeReview:true});assert.equal(large.requests,2);assert.equal(large.result.status,'context_budget_stopped');assert.equal(large.result.terminal_evidence_presentations.length,0);assert.equal(large.result.terminal_evidence_attempts.length,0);
 const invalid=await exercise({badReview:true});assert.equal(invalid.requests,3);assert.equal(invalid.result.status,'invalid_final_response');assert.equal(invalid.result.terminal_corrections,0);assert.equal(invalid.result.selection,null);
});

test('mismatched successful review receipt cannot select a tokenizer candidate packet',async()=>{
 const r=await exercise({wrongReviewReceipt:true});assert.equal(r.requests,3);assert.equal(r.result.status,'run_error');assert.match(r.result.error,/terminal-packet-request-binding/);assert.equal(r.result.terminal_evidence_presentations.length,0);assert.equal(r.result.selection,null);
});

test('length-truncated review retains its attempted private packet and known receipt cost without retry',async()=>{
 const r=await exercise({incompleteReview:true});assert.equal(r.requests,3);assert.equal(r.result.status,'run_error');assert.equal(r.result.error,'glm.incomplete-output');assert.equal(r.result.terminal_evidence_presentations.length,0);assert.equal(r.result.terminal_evidence_attempts.length,1);
 const a=r.result.terminal_evidence_attempts[0];assert.equal(a.dispatched,true);assert.equal(a.posture,'dispatched-receipt-bound');assert.equal(a.finish_reason,'length');assert.equal(a.input_tokens+a.output_tokens,712);assert.equal(a.request_sha256,r.result.receipts.at(-1).request_sha256);assert.equal(a.packet.private.bindings.length,4);assert.equal(r.result.receipts.reduce((n,x)=>n+x.input_tokens+x.output_tokens,0),1132);assert.equal(r.result.output_cap_corrections,0);assert.equal(r.result.selection,null);
 assert.ok(r.events.some(e=>e.kind==='terminal-evidence-attempt-admitted'&&e.dispatched===null));assert.ok(r.events.some(e=>e.kind==='terminal-evidence-attempt-receipt'&&e.dispatched));
});
