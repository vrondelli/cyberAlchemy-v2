// Real repository edits and native evidence projection; scripted model, no provider calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runReceiptBudgetEpisode} from './receipt-budget-episode-r1.mjs';
import {tools,createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixture({stale=false,failAfterEdit=false,recoverAfterEdit=false}={}){
 const root=mkdtempSync(join(tmpdir(),'minimal-repair-')),base=join(root,'base'),work=join(root,'work');
 const git=(cwd,...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const original='export const value = 1;\n',snapshots=[],events=[],receipts=[],prompts=[];let calls=0,recoveryArgs=null;
 try{
  git(root,'init',base);writeFileSync(join(base,'value.js'),original);git(base,'add','.');git(base,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');
  const commit=git(base,'rev-parse','HEAD');git(root,'clone','--no-local',base,work);
  const execute_tool=createRepositoryTools({root:work,base_commit:commit,record_source:s=>snapshots.push(s)});
  const driver={receipts,index_receipts:[],measurePrompt:async prompt=>{
   if(recoverAfterEdit&&JSON.parse(prompt).messages.some(m=>m.role==='tool'&&m.tool_call_id==='call-0'&&JSON.parse(m.content).ok===true))return 9000;
   return 2000;
  },admitMessages:async(messages,tools)=>stable({messages,tools}),prepare:async({prompt,output_cap})=>{
   prompts.push(JSON.parse(prompt));const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap};
   return {prompt,output_cap,profile,input_upper_bound:1000,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))};
  },dispatch:async prepared=>{
   if(recoverAfterEdit){const deferred=JSON.parse(prepared.prompt).messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).find(o=>o.deferred?.archive_recovery);if(deferred)recoveryArgs=deferred.deferred.archive_recovery.arguments;}
   const n=calls++,receipt={...prepared.profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,request_sha256:prepared.request_sha256,finish_reason:'tool_calls'};
   if(failAfterEdit&&n===2){receipts.push({...receipt,status:null,input_tokens:null,output_tokens:null});throw Error('fixture.provider-interrupted');}
   const packet=events.find(e=>e.kind==='terminal-packet')?.packet;
   const sequence=[['read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'}],['apply_edits',{edits:[{path:'value.js',source_sha256:stale?'0'.repeat(64):hash(original),old_text:'value = 1',new_text:'value = 2'}]}],['read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'}],['read_file',{path:'value.js',start_line:1,line_count:1,revision:'base'}],['get_patch',{}],['finish_issue_attempt',{}]];
   if(recoverAfterEdit&&n===2){assert.ok(recoveryArgs,'recovery arguments must have been visible in the actual prompt');sequence[2]=['recover_archived_read',recoveryArgs];}
   const [name,args]=packet?['submit_context_handles_v2',{summary:stale?'Edit rejected; unable to repair.':'Attempted value correction; correctness unverified.',context_handles:[packet.private.bindings.find(b=>b.source_sha256===hash(original)).handle]}]:sequence[n];
   receipts.push(receipt);return {final_bytes:stable({message:{role:'assistant',content:null,reasoning_content:'reasoning '+n,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'})};
  }};
  const result=await runReceiptBudgetEpisode({task:{problem_statement:'Change value from 1 to 2.',instance_id:'fixture',repo_url:'https://example.invalid/repo.git',base_commit:commit},driver,tools,execute_tool,source_context:()=>({snapshots,repoRoot:base}),measure_tokens:async()=>100,persist:e=>events.push(structuredClone(e))});
  return {result,events,prompts,calls,base:readFileSync(join(base,'value.js'),'utf8'),work:readFileSync(join(work,'value.js'),'utf8'),patch:git(work,'diff',commit),original};
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('attempts a real edit, delivers its result, and selects pinned-base source',async()=>{
 const f=await fixture();assert.equal(f.result.status,'final_context_selected');assert.equal(f.calls,7);assert.equal(f.result.phase_state.known_tokens,840);
 assert.equal(f.base,f.original);assert.equal(f.work,'export const value = 2;\n');assert.match(f.patch,/\+export const value = 2/);
 assert.equal(f.result.task_protocol,'issue-resolution-attempt-v1');
 assert.equal(f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='apply_edits').output.ok,true);
 const packet=f.events.find(e=>e.kind==='terminal-packet').packet;
 assert.ok(packet.private.bindings.every(b=>b.source_sha256===hash(f.original)),'edited line cannot masquerade as base evidence');
 assert.equal(f.result.exported.prediction.traj_data.pred_files.length,1);
 assert.match(f.prompts[0].messages[0].content,/attempt a source patch/);
 assert.deepEqual(f.prompts[0].tools.slice(0,-2),tools);
 assert.equal(f.result.arm,'receipt-budget');
 assert.ok(f.events.filter(e=>e.kind==='history-projection').every(e=>e.projection.delivery_confirmed===false));
 assert.ok(f.events.some(e=>e.kind==='frontier-raw-exchange'&&e.exchange.assistant.reasoning_content==='reasoning 0'));
 assert.ok(f.prompts[2].messages.some(m=>m.content?.includes?.('Evidence coverage ledger')));
 assert.equal(f.result.tokenizer_state.phase,'final'); 
});
test('rejected edit remains visible and does not become a false repair claim',async()=>{
 const f=await fixture({stale:true});assert.equal(f.result.status,'final_context_selected');assert.equal(f.work,f.original);assert.equal(f.patch,'');
 const edit=f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='apply_edits');assert.equal(edit.output.ok,false);assert.match(edit.output.error,/stale-edit-source/);
 assert.match(f.result.exported.selection.summary,/unable to repair/);assert.equal(f.result.phase_state.known_tokens,840);
});
test('interruption after edit preserves attempted work and unknown-call accounting',async()=>{
 const f=await fixture({failAfterEdit:true});assert.equal(f.result.status,'run_error');assert.equal(f.calls,3);assert.equal(f.work,'export const value = 2;\n');assert.equal(f.base,f.original);
 assert.equal(f.result.phase_state.known_tokens,240);assert.equal(f.result.phase_state.unknown_calls,1);assert.equal(f.result.exported,undefined);
});
test('read-only tool subset is rejected before driver dispatch',async()=>{
 let dispatched=false;
 await assert.rejects(()=>runReceiptBudgetEpisode({task:{problem_statement:'Repair'},driver:{receipts:[],index_receipts:[],measurePrompt:async()=>1000,admitMessages:async()=>{},prepare:async()=>{},dispatch:async()=>{dispatched=true;}},tools:tools.filter(t=>t.function.name==='read_file'),execute_tool:async()=>{},source_context:()=>({}),measure_tokens:async()=>0,persist:()=>{}}),/dependencies/);
 assert.equal(dispatched,false);
});

test('model-visible recovery delivers omitted original bytes after working-tree mutation and exports them',async()=>{
 const f=await fixture({recoverAfterEdit:true});assert.equal(f.result.status,'final_context_selected');assert.equal(f.work,'export const value = 2;\n');
 const recovered=f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='recover_archived_read');assert.equal(recovered.output.ok,true);assert.equal(recovered.output.output.utf8,'export const value = 1;');
 const terminal=f.events.find(e=>e.kind==='terminal-packet');assert.ok(terminal.joined.read_observations.some(o=>o.tool_call_id==='call-2'&&o.body==='export const value = 1;'));
 assert.ok(!terminal.joined.read_observations.some(o=>o.tool_call_id==='call-0'),'raw omitted bytes alone never counted as delivery');
 assert.ok(f.result.exported.source_projection.projections.some(o=>o.read_id===recovered.output.output.read_id&&o.event_ids.length>0));
});
