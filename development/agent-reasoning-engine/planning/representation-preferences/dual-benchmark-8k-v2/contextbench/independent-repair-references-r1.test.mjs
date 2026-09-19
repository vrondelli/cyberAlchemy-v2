// Real source reads and native export, scripted provider. No benchmark score claims.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runIndependentRepairEpisode} from './independent-repair-references-r1.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';
import {tools,createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixture({correct=false,alwaysInvalid=false,oversizedCorrection=false}={}){
 const root=mkdtempSync(join(tmpdir(),'finding-reference-')),receipts=[],events=[],snapshots=[],prompts=[];
 const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  git('init');writeFileSync(join(root,'value.js'),'export const value = 1;\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');const commit=git('rev-parse','HEAD');
  const execute_tool=createRepositoryTools({root,base_commit:commit,record_source:s=>snapshots.push(s)});
  const attempts=new Map(),exploration=new Map();
  const driver={receipts,admitMessages:async(messages,available)=>renderCompactPrompt({messages,tools:available}),measurePrompt:async prompt=>{const wire=JSON.parse(prompt);return oversizedCorrection&&wire.tools[0]?.function.name==='submit_investigation'&&wire.messages.length===3?4001:1800;},prepare:async({prompt,output_cap})=>{const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap};return {prompt,output_cap,profile,input_upper_bound:1000,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))};},dispatch:async prepared=>{
   const wire=JSON.parse(prepared.prompt);prompts.push(wire);const names=wire.tools.map(t=>t.function.name),n=receipts.length;
   let message,finish_reason='tool_calls',name,args;
   if(names.length===0){finish_reason='stop';message={role:'assistant',content:stable({questions:[{question:'Find behavior',investigates:'behavior'},{question:'Find implementation',investigates:'implementation'},{question:'Find risks',investigates:'risks'}]})};}
   else if(names.includes('end_investigation')){const q=JSON.parse(wire.messages[1].content).question.id,count=exploration.get(q)??0;exploration.set(q,count+1);name=count?'end_investigation':'read_file';args=count?{}:{path:'value.js',start_line:1,line_count:1,revision:'base'};}
   else if(names[0]==='submit_investigation'){
    const catalog=JSON.parse(wire.messages[1].content).catalog,count=attempts.get(catalog.branch_id)??0;attempts.set(catalog.branch_id,count+1);
    name='submit_investigation';const invalid=alwaysInvalid||(correct&&count===0);
    args={branch_id:catalog.branch_id,claims:[{text:'The source exports value 1.',read_refs:[invalid?'list_files:invented':catalog.entries[0].ref]}]};
   }else if(names.includes('finish_issue_attempt')){name='finish_issue_attempt';args={};}
   else {const packet=events.find(e=>e.kind==='terminal-packet').packet;name='submit_context_handles_v2';args={summary:'Read the source; no patch correctness claim.',context_handles:[packet.private.bindings[0].handle]};}
   if(!message)message={role:'assistant',content:null,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]};
   receipts.push({...prepared.profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,request_sha256:prepared.request_sha256,finish_reason});
   return {final_bytes:stable({message,finish_reason})};
  }};
  const result=await runIndependentRepairEpisode({task:{problem_statement:'Inspect value.js and determine its exported value.',instance_id:'fixture',repo_url:'https://example.invalid/repo',base_commit:commit},driver,tools,execute_tool,source_context:()=>({snapshots,repoRoot:root}),measure_tokens:async()=>100,persist:e=>events.push(structuredClone(e))});
  return {result,events,prompts,receipts};
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('three real source investigations complete through catalog mapping, synthesis and native export',async()=>{
 const f=await fixture();assert.equal(f.result.status,'final_context_selected',f.result.error);assert.equal(f.result.phase_state.closed,true);assert.equal(f.result.findings.length,3);
 assert.equal(f.result.exported.prediction.traj_data.pred_files[0],'value.js');
 assert.ok(f.result.findings.every(x=>x.claims[0].read_ids.every(id=>/^[a-f0-9]{64}$/.test(id))));
 assert.equal(f.events.filter(e=>e.kind==='finding-reference-validation').length,3);
});
test('one correction per branch is charged and yields exact confirmed findings',async()=>{
 const f=await fixture({correct:true});assert.equal(f.result.status,'final_context_selected',f.result.error);
 const d=f.events.filter(e=>e.kind==='finding-reference-validation');assert.equal(d.length,6);assert.equal(d.filter(e=>!e.diagnostic.ok).length,3);
 assert.equal(f.result.phase_state.known_tokens,f.receipts.length*120);
 const corrective=f.prompts.filter(p=>p.tools[0]?.function.name==='submit_investigation'&&p.messages.length===3);assert.equal(corrective.length,3);
 assert.ok(corrective.every(p=>JSON.parse(p.messages[2].content).issues[0].keyword==='enum'));
});
test('two invalid submissions fail honestly and never create a final selection',async()=>{
 const f=await fixture({alwaysInvalid:true});assert.equal(f.result.status,'run_error');assert.match(f.result.error,/finding-corrections-exhausted/);assert.equal(f.result.exported,undefined);
 assert.equal(f.events.filter(e=>e.kind==='finding-reference-validation').length,2);assert.equal(f.receipts.length,5);
});
test('correction above 4K is rejected before dispatch without increasing phase limits',async()=>{
 const f=await fixture({correct:true,oversizedCorrection:true});assert.equal(f.result.status,'run_error');assert.match(f.result.error,/finding-envelope/);assert.equal(f.receipts.length,4);
 assert.equal(f.result.exported,undefined);
});
