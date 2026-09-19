// Real repository edits and native evidence projection; scripted model, no provider calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runIndependentRepairEpisode} from './independent-repair-episode.mjs';
import {tools,createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixture({stale=false,failAfterEdit=false,fullSynthesisWindow=false}={}){
 const root=mkdtempSync(join(tmpdir(),'independent-repair-')),base=join(root,'base'),work=join(root,'work');
 const git=(cwd,...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const original='export const value = 1;\n',snapshots=[],events=[],receipts=[],prompts=[];let calls=0;
 try{
  git(root,'init',base);writeFileSync(join(base,'value.js'),original);git(base,'add','.');git(base,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');
  const commit=git(base,'rev-parse','HEAD');git(root,'clone','--no-local',base,work);
  const execute_tool=createRepositoryTools({root:work,base_commit:commit,record_source:s=>snapshots.push(s)});
  const driver={receipts,prepare:async({prompt,output_cap})=>{
   prompts.push(JSON.parse(prompt));const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap};
   return {prompt,output_cap,profile,input_upper_bound:fullSynthesisWindow&&calls>=7?6976:1000,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))};
  },dispatch:async prepared=>{
   const n=calls++,receipt={...prepared.profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:fullSynthesisWindow&&n>=7?6976:100,output_tokens:fullSynthesisWindow&&n>=7?1024:20,request_sha256:prepared.request_sha256,finish_reason:'tool_calls'};
   if(failAfterEdit&&n===9){receipts.push({...receipt,status:null,input_tokens:null,output_tokens:null});throw Error('fixture.provider-interrupted');}
   if(n===0){
    receipt.finish_reason='stop';receipts.push(receipt);
    return {final_bytes:stable({message:{role:'assistant',content:stable({questions:[{question:'What behavior is required?',investigates:'expected result'},{question:'What produces the result?',investigates:'implementation'},{question:'What could regress?',investigates:'compatibility'}]})},finish_reason:'stop'})};
   }
   if(n<=6){
    const branch=Math.ceil(n/2),name=n%2?'read_file':'submit_investigation';
    const args=n%2?{path:'value.js',start_line:1,line_count:1,revision:'base'}:{branch_id:'q'+branch,claims:[]};
    receipts.push(receipt);return {final_bytes:stable({message:{role:'assistant',content:null,reasoning_content:'branch reasoning',tool_calls:[{id:'branch-call-'+(n%2),type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'})};
   }
   const packet=events.find(e=>e.kind==='terminal-packet')?.packet;
   const sequence=[['read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'}],['apply_edits',{edits:[{path:'value.js',source_sha256:stale?'0'.repeat(64):hash(original),old_text:'value = 1',new_text:'value = 2'}]}],['read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'}],['read_file',{path:'value.js',start_line:1,line_count:1,revision:'base'}],['get_patch',{}],['finish_issue_attempt',{}]];
   const [name,args]=packet?['submit_context_handles_v2',{summary:stale?'Edit rejected; unable to repair.':'Attempted value correction; correctness unverified.',context_handles:[packet.private.bindings.find(b=>b.source_sha256===hash(original)).handle]}]:sequence[n-7];
   receipts.push(receipt);return {final_bytes:stable({message:{role:'assistant',content:null,reasoning_content:'reasoning '+n,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'})};
  }};
  const result=await runIndependentRepairEpisode({task:{problem_statement:'Change value from 1 to 2.',instance_id:'fixture',repo_url:'https://example.invalid/repo.git',base_commit:commit},driver,tools,execute_tool,source_context:()=>({snapshots,repoRoot:base}),measure_tokens:async()=>100,persist:e=>events.push(structuredClone(e))});
  return {result,events,prompts,calls,base:readFileSync(join(base,'value.js'),'utf8'),work:readFileSync(join(work,'value.js'),'utf8'),patch:git(work,'diff',commit),original};
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('attempts a real edit, delivers its result, and selects pinned-base source',async()=>{
 const f=await fixture();assert.equal(f.result.status,'final_context_selected');assert.equal(f.calls,14);assert.equal(f.result.phase_state.known_tokens,1680);
 assert.equal(f.base,f.original);assert.equal(f.work,'export const value = 2;\n');assert.match(f.patch,/\+export const value = 2/);
 assert.equal(f.result.task_protocol,'issue-resolution-attempt-v1');
 assert.equal(f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='apply_edits').output.ok,true);
 const packet=f.events.find(e=>e.kind==='terminal-packet').packet;
 assert.ok(packet.private.bindings.every(b=>b.source_sha256===hash(f.original)),'edited line cannot masquerade as base evidence');
 assert.equal(f.result.exported.prediction.traj_data.pred_files.length,1);
 assert.match(f.prompts[7].messages[0].content,/attempt a source patch/);
 assert.deepEqual(f.prompts[7].tools.slice(0,-1),tools);
 assert.equal(f.prompts[10].messages.find(m=>m.role==='assistant').reasoning_content,'reasoning 8');
 assert.equal(f.result.branches.length,4);
 assert.deepEqual(f.result.branches.map(b=>b.branch_id),['q1','q2','q3','synthesis']);
 for(const p of f.prompts.slice(1,7)){assert.ok(!p.tools.some(t=>t.function.name==='apply_edits'));assert.ok(!p.messages.some(m=>m.content?.includes('investigation_findings')));}
});
test('rejected edit remains visible and does not become a false repair claim',async()=>{
 const f=await fixture({stale:true});assert.equal(f.result.status,'final_context_selected');assert.equal(f.work,f.original);assert.equal(f.patch,'');
 const edit=f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='apply_edits');assert.equal(edit.output.ok,false);assert.match(edit.output.error,/stale-edit-source/);
 assert.match(f.result.exported.selection.summary,/unable to repair/);assert.equal(f.result.phase_state.known_tokens,1680);
});
test('interruption after edit preserves attempted work and unknown-call accounting',async()=>{
 const f=await fixture({failAfterEdit:true});assert.equal(f.result.status,'run_error');assert.equal(f.calls,10);assert.equal(f.work,'export const value = 2;\n');assert.equal(f.base,f.original);
 assert.equal(f.result.phase_state.known_tokens,1080);assert.equal(f.result.phase_state.unknown_calls,1);assert.equal(f.result.exported,undefined);
});
test('read-only tool subset is rejected before driver dispatch',async()=>{
 let dispatched=false;
 await assert.rejects(()=>runIndependentRepairEpisode({task:{problem_statement:'Repair'},driver:{receipts:[],prepare:async()=>{},dispatch:async()=>{dispatched=true;}},tools:tools.filter(t=>t.function.name==='read_file'),execute_tool:async()=>{},source_context:()=>({}),measure_tokens:async()=>0,persist:()=>{}}),/dependencies/);
 assert.equal(dispatched,false);
});

test('full-window synthesis spend preserves final selection inside the original join cap',async()=>{
 const f=await fixture({fullSynthesisWindow:true});
 assert.equal(f.result.status,'final_context_selected');assert.equal(f.calls,9);
 assert.equal(f.result.phase_state.known_tokens,16840);assert.equal(f.result.phase_state.closed,true);
 assert.equal(f.result.branches.at(-1).captures.length,1);
 assert.equal(f.work,f.original);
 assert.equal(f.prompts.at(-1).tools.length,1);
 assert.equal(f.prompts.at(-1).tools[0].function.name,'submit_context_handles_v2');
});
