import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runEpisode} from './episode-recovery-g02-v1.mjs';
import {compileToolValidators,MODEL} from '../packet-diversity-v1/transport-bounded-g02-v1.mjs';
import {assessResponseBatch} from '../g02-response-batch-policy-v1.mjs';
import {stable,bodyForReceipt} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {EXPANDED,EXPANDED_TOOL} from '../terminal-evidence.mjs';

const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const readSchema={type:'object',additionalProperties:false,required:['path','start_line','line_count','revision'],properties:{path:{type:'string'},start_line:{type:'integer',minimum:1},line_count:{type:'integer',minimum:1},revision:{enum:['base','current']}}};
const readTool={type:'function',function:{name:'read_file',description:'Read fixture source.',parameters:readSchema}};
const call=(id,name,args)=>({id,type:'function',function:{name,arguments:stable(args)}});
const batch=(count,name='read_file',args={path:'a.js',start_line:1,line_count:1,revision:'base'})=>Array.from({length:count},(_,index)=>call(`call-${index}`,name,args));
const overLimit=count=>({message:{role:'assistant',content:null,tool_calls:batch(count)},finish_reason:'tool_calls'});
const terminal=()=>({message:{role:'assistant',content:stable({summary:'done',context_read_ids:[]})},finish_reason:'stop'});

class FixtureRecycler{
  constructor({script,client,log=[],failComplete=false,pauseOnSecond=false}){this.script=[...script];this.client=client;this.log=log;this.failComplete=failComplete;this.pauseOnSecond=pauseOnSecond;this.generations=0;this.phase='idle';this.prompts=[];this.complete=[];this.beforeToolCalls=0;}
  async generate({history,render,admit_dispatch,pause_after_recycle}){
    if(this.pauseOnSecond&&this.generations===1&&pause_after_recycle){const boundary={binding:'d'.repeat(64),generation:1,start_index:history.length,recycles:1,history_ref:'e'.repeat(64),history_count:history.length,history_digest:hash(history)};if(await pause_after_recycle(boundary)){const error=Error('recycling.boundary-paused');error.code='boundary-paused';throw error;}}
    const prompt=await render(history,{generation:this.generations,task_state:{},history_ref:'f'.repeat(64),history_count:history.length});
    const dispatch={sequence:this.generations+1,generation:this.generations,prompt_digest:hash(stable(prompt)),input_upper_bound:100,output_reservation:512,projected_upper_bound:612,history_ref:'f'.repeat(64)};
    if(await admit_dispatch(dispatch)!==true)throw Error('recycling.dispatch-admission-denied');
    const spec=this.script.shift();if(!spec)throw Error('fixture.script-exhausted');const wire=JSON.parse(prompt),answer=typeof spec==='function'?spec(wire):spec;
    const receipt={kind:'model',dispatched:true,status:200,model:MODEL,reasoning_effort:'low',output_cap:512,input_tokens:100,output_tokens:20,finish_reason:answer.finish_reason,authority_effect:'none'};
    receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
    const binding=compileToolValidators(wire.tools,receipt.request_sha256),assessment=assessResponseBatch(answer.message,answer.finish_reason,{validators:binding.validators});receipt.tool_schema_binding_sha256=binding.binding_sha256;
    receipt.tool_batch_diagnostic=assessment.diagnostic;receipt.tool_call_shape={present:Object.hasOwn(answer.message,'tool_calls'),is_array:Array.isArray(answer.message.tool_calls),count:assessment.count,over_execution_limit:assessment.over_limit,recoverable:assessment.recoverable};
    this.client.receipts.push(receipt);this.prompts.push(wire);this.generations++;this.phase='model-returned';this.log.push(`returned:${this.generations-1}`);
    return {receipt,final_bytes:stable(answer)};
  }
  beforeTool(){this.beforeToolCalls++;this.log.push('before-tool');this.phase='tool-pending';}
  completeStep(history,terminal=false){this.log.push(`complete:${terminal}`);if(this.failComplete){const error=Error('fixture.persist');error.persistence_failure=true;throw error;}this.complete.push({history:structuredClone(history),terminal});this.phase=terminal?'terminal':'idle';}
  snapshot(){return {phase:this.phase,generation:this.generations,recycles:0,dispatches:[],recoverable_failures:[]};}
}

const ordinaryLimits=overrides=>({maximum_calls:2,output_cap:512,total_tokens:10000,index_entries:0,index_tokens:0,terminal_submission:false,terminal_evidence_review:false,discovery_retention:false,output_deferral:false,incomplete_output_corrections:0,maximum_terminal_corrections:0,maximum_tool_batch_corrections:1,...overrides});
async function ordinary({count=9,script=[overLimit(count),terminal()],limits={},failComplete=false,pauseOnSecond=false,onEvent}={}){
  const client={receipts:[],maximum_model_retries:0},log=[],events=[],executions=[];
  const recycler=new FixtureRecycler({script,client,log,failComplete,pauseOnSecond});
  const result=await runEpisode({task:{problem_statement:'fixture'},arm:'baseline',client,recycler,tools:[readTool],execute_tool:async(name)=>{executions.push(name);return {ok:true};},limits:ordinaryLimits(limits),run_id:'fixture',on_event:async event=>{events.push(event);log.push(`event:${event.kind}`);if(onEvent)await onEvent(event);}});
  return {result,recycler,client,log,events,executions};
}

test('9 and 32-call batches are privately rejected before capture or tool execution and receive one bounded correction',async t=>{
  for(const count of [9,32])await t.test(String(count),async()=>{
    const r=await ordinary({count});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.result.tool_batch_corrections,1);
    assert.equal(r.executions.length,0);assert.equal(r.recycler.beforeToolCalls,0);assert.equal(r.result.response_captures.length,1);assert.equal(r.events.filter(event=>event.kind==='model-response').length,1);
    const rejected=r.events.find(event=>event.kind==='tool-batch-rejected');assert.equal(rejected.count,count);assert.equal(rejected.correction_remaining,true);assert.equal(rejected.effects,'none');
    assert.ok(r.log.indexOf('event:tool-batch-rejected')<r.log.indexOf('complete:false'));assert.equal(r.recycler.complete[0].history.filter(message=>message.role==='tool').length,count);
    assert.ok(r.recycler.prompts[1].messages.some(message=>message.role==='user'&&message.content.includes('None ran')));assert.equal(r.client.receipts.length,2);assert.equal(r.result.admissions.length,2);
  });
});

test('a second over-limit batch exhausts the single correction without capture, replay or execution',async()=>{
  const r=await ordinary({script:[overLimit(9),overLimit(9)],limits:{maximum_calls:3}});
  assert.equal(r.result.status,'run_error');assert.equal(r.result.error,'episode.tool-batch-correction-exhausted');assert.equal(r.result.tool_batch_corrections,1);
  assert.equal(r.result.response_captures.length,0);assert.equal(r.recycler.beforeToolCalls,0);assert.equal(r.executions.length,0);assert.equal(r.events.filter(event=>event.kind==='tool-batch-rejected').length,2);
  assert.equal(r.result.history.filter(message=>message.role==='assistant').length,1);assert.equal(r.recycler.complete.at(-1).terminal,true);
});

test('shared-boundary continuation retains the private correction state and original budgets',async()=>{
  const client={receipts:[],maximum_model_retries:0},events=[],recycler=new FixtureRecycler({script:[overLimit(9)],client,pauseOnSecond:true});
  const result=await runEpisode({task:{problem_statement:'fixture'},arm:'baseline',client,recycler,tools:[readTool],execute_tool:async()=>{throw Error('must-not-run');},limits:ordinaryLimits({maximum_calls:3}),run_id:'fixture',pause_after_first_recycle:true,on_event:async event=>events.push(event)});
  assert.equal(result.status,'shared_prefix_ready',result.error);assert.equal(result.tool_batch_corrections,1);assert.equal(result.continuation.state.tool_batch_corrections,1);
  assert.match(result.continuation.state.pending_tool_batch_feedback,/None ran/);assert.equal(result.continuation.state.pending_tool_exchange.length,10);assert.equal(client.receipts.length,1);assert.equal(result.response_captures.length,0);
  assert.ok(events.some(event=>event.kind==='shared-prefix-boundary'));assert.equal(recycler.beforeToolCalls,0);
});

test('correction persistence failure is fail-closed with no public capture or execution',async()=>{
  const r=await ordinary({script:[overLimit(9)],limits:{maximum_calls:2},failComplete:true});
  assert.equal(r.result.status,'run_error');assert.equal(r.result.infrastructure_failure?.persistence_failure,true);assert.equal(r.result.recycling.phase,'model-returned');
  assert.equal(r.result.response_captures.length,0);assert.equal(r.executions.length,0);assert.equal(r.recycler.beforeToolCalls,0);assert.equal(r.client.receipts.length,1);
});

test('rejection-event persistence failure stops before synthetic history is committed',async()=>{
  const r=await ordinary({script:[overLimit(9)],limits:{maximum_calls:2},onEvent:event=>{if(event.kind==='tool-batch-rejected')throw Object.assign(Error('fixture.event-persist'),{persistence_failure:true});}});
  assert.equal(r.result.status,'run_error');assert.equal(r.result.infrastructure_failure?.persistence_failure,true);assert.equal(r.result.recycling.phase,'model-returned');
  assert.equal(r.result.tool_batch_corrections,0);assert.equal(r.result.history.length,0);assert.equal(r.result.response_captures.length,0);assert.equal(r.executions.length,0);assert.equal(r.recycler.complete.length,0);
});

test('terminal evidence review retries one rejected over-limit submission before any presentation',async t=>{
  const root=mkdtempSync(join(tmpdir(),'g02-terminal-review-')),base=join(root,'base'),utf8='function alpha() {}\n',source_sha256=hash(utf8);mkdirSync(base);writeFileSync(join(base,'a.js'),utf8);t.after(()=>rmSync(root,{recursive:true,force:true}));
  const task={problem_statement:'Inspect alpha.',base_commit:'a'.repeat(40)},client={receipts:[],maximum_model_retries:0},events=[],executions=[];
  const terminalArgs=wire=>({summary:'selected',context_handles:wire.tools[0].function.parameters.properties.context_handles.items.enum.slice(0,1)});
  const script=[
    {message:{role:'assistant',content:null,tool_calls:[call('read','read_file',{path:'a.js',start_line:1,line_count:1,revision:'base'})]},finish_reason:'tool_calls'},
    {message:{role:'assistant',content:null,tool_calls:[call('candidate','submit_context_selection',{summary:'candidate',context_read_ids:[]})]},finish_reason:'tool_calls'},
    wire=>({message:{role:'assistant',content:null,tool_calls:batch(9,EXPANDED_TOOL,terminalArgs(wire))},finish_reason:'tool_calls'}),
    wire=>({message:{role:'assistant',content:null,tool_calls:[call('selected',EXPANDED_TOOL,terminalArgs(wire))]},finish_reason:'tool_calls'})
  ];
  const recycler=new FixtureRecycler({script,client});
  const result=await runEpisode({task,arm:'baseline',client,recycler,tools:[readTool],execute_tool:async(name)=>{executions.push(name);return {ok:true,output:{path:'a.js',start_line:1,end_line:1,total_lines:1,utf8:utf8.trimEnd(),byte_count:Buffer.byteLength(utf8.trimEnd()),source_sha256,source_revision:'base',base_commit:task.base_commit}};},
    source_context:()=>({snapshots:[{path:'a.js',utf8,source_sha256}],repoRoot:base,patch:''}),measure_index_tokens:async text=>Math.ceil(text.length/4),limits:{maximum_calls:4,output_cap:512,total_tokens:20000,index_entries:0,index_tokens:0,terminal_submission:true,terminal_content_fallback:false,maximum_terminal_corrections:0,incomplete_output_corrections:0,maximum_tool_batch_corrections:1,terminal_evidence_review:true,terminal_evidence_version:EXPANDED,terminal_evidence_max_handles:32,terminal_evidence_max_state_bytes:8192,terminal_evidence_max_state_tokens:2048,compact_representation:true,discovery_retention:false,output_deferral:false},run_id:'terminal-review',on_event:async event=>events.push(event)});
  assert.equal(result.status,'final_context_selected',result.error);assert.deepEqual(executions,['read_file']);assert.equal(recycler.beforeToolCalls,1);assert.equal(result.tool_batch_corrections,1);
  assert.equal(result.response_captures.length,3);assert.equal(result.terminal_evidence_presentations.length,1);assert.equal(result.terminal_evidence_attempts.length,2);assert.equal(result.terminal_evidence_attempts[0].dispatch_outcome,'tool-batch-rejected');
  const rejectedIndex=events.findIndex(event=>event.kind==='tool-batch-rejected'),presentationIndex=events.findIndex(event=>event.kind==='terminal-evidence-presentation');assert.ok(rejectedIndex>=0&&presentationIndex>rejectedIndex);
  assert.equal(events.filter(event=>event.kind==='model-response').length,3);assert.ok(!result.response_captures.some(capture=>capture.public_response?.message?.tool_calls?.length===9));
});
