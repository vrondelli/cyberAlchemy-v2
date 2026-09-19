// Actual recycler and native export with synthetic transport; no provider/gold.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runEpisode} from './episode.mjs';
import {EXPANDED,EXPANDED_TOOL,exportTerminalEvidenceSelection} from '../terminal-evidence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function exercise({enabled=true,recycle=false,oversize=false,deferral=false,badRecovery=false,badReceipt=false,failedDiscovery=false,novelty=null,endAt=12}={}){
 const root=mkdtempSync(join(tmpdir(),'discovery-episode-')),base=join(root,'base');mkdirSync(base);const utf8=deferral?'function alpha() {'+'x'.repeat(1200)+'}\n':'function alpha() {}\n',snapshot={path:'alpha.js',utf8,source_sha256:hash(utf8)};writeFileSync(join(base,'alpha.js'),utf8);const beta={path:'beta.js',utf8:'function beta() {}\n',source_sha256:hash('function beta() {}\n')};writeFileSync(join(base,'beta.js'),beta.utf8);
 const receipts=[],prompts=[],events=[],executions=[];let requests=0,forcedRecycle=false;
 const tool=(id,name,args,raw)=>({id,type:'function',function:{name,arguments:raw??stable(args)}});
 const transport=createStatelessRecyclingTransport({adapter_id:'discovery-fixture',source_ref:'episode.test.mjs',maximum_output_tokens:512,
  measure_request:async({prompt})=>{const p=JSON.parse(prompt);if((oversize||deferral)&&requests===1&&p.messages.some(m=>m.role==='tool'&&(!deferral||m.content.includes('function alpha'))))return 7900;if(recycle&&requests===2&&!forcedRecycle){forcedRecycle=true;return 7900;}return 200;},
  request_once:async({prompt})=>{
   requests++;const p=JSON.parse(prompt);prompts.push(p);let message,finish_reason='tool_calls';
   if(p.tools.some(t=>t.function.name===EXPANDED_TOOL))message={role:'assistant',tool_calls:[tool('final',EXPANDED_TOOL,{summary:'Selected original source.',context_handles:['h0']})]};
   else if(requests===1)message={role:'assistant',tool_calls:[tool('read-alpha','read_file',{path:'alpha.js',start_line:1,line_count:1,revision:'base'}),...(deferral?[tool('read-beta','read_file',{path:'beta.js',start_line:1,line_count:1,revision:'base'}),tool('patch-batch','get_patch',{})]:[])]};
   else if(enabled&&requests===2)message={role:'assistant',tool_calls:[tool('refresh','list_recovery_page',{cursor:null})]};
   else if(enabled&&requests===3){
    const page=p.messages.map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).find(v=>v?.version==='historical-recovery-page-v1');
    const handle=page?.entries[0]?.handle??'r0';message={role:'assistant',tool_calls:[tool('recover','recover_archived_read',{handle},badRecovery?' {"handle":"r0","handle":"r1"} ':undefined)]};
   }else if(novelty&&requests===5)message={role:'assistant',tool_calls:[tool('novelty-read','read_file',{path:novelty==='new'?'beta.js':'alpha.js',start_line:1,line_count:1,revision:'base'})]};
   else if(requests>=endAt){message={role:'assistant',content:stable({summary:'Ready for review.',context_read_ids:[]})};finish_reason='stop';}
   else message={role:'assistant',tool_calls:[tool('patch-'+requests,'get_patch',{})]};
   const receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,input_tokens:200,output_tokens:10,finish_reason};if(failedDiscovery&&requests===3){receipt.finish_reason='length';receipt.output_tokens=512;receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);throw Error('glm.incomplete-output');}receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));if(badReceipt&&requests===2)receipt.request_sha256='f'.repeat(64);receipts.push(receipt);return {receipt,final_bytes:stable({message,finish_reason})};
  }});
 const task={instance_id:'fixture',repo_url:'https://example.invalid/fixture.git',base_commit:'a'.repeat(40),problem_statement:'Inspect alpha source.'};
 const recycler=openContextRecycling({transport,fixture_root:base,scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
 try{
  const result=await runEpisode({task,arm:'baseline',client:{receipts,maximum_model_retries:0},recycler,tools:['read_file','get_patch'].map(name=>({type:'function',function:{name,parameters:{type:'object'}}})),execute_tool:async(name,args)=>{executions.push(name);if(name==='get_patch')return {ok:true,output:{patch:''}};assert.equal(name,'read_file');const source=args.path==='beta.js'?beta:snapshot;return {ok:true,output:{...source,start_line:1,end_line:1,utf8:source.utf8.trimEnd()}};},source_context:()=>({snapshots:[snapshot,beta],repoRoot:base,patch:''}),measure_index_tokens:async text=>Math.ceil(text.length/4),limits:{maximum_calls:deferral?4:20,...(deferral?{finalization_reserve_tokens:1500,finalization_calls:2}:{}),output_cap:512,total_tokens:80000,index_entries:8,index_tokens:1024,terminal_submission:true,terminal_content_fallback:true,maximum_terminal_corrections:0,incomplete_output_corrections:0,terminal_evidence_review:true,terminal_evidence_version:EXPANDED,terminal_evidence_max_handles:32,terminal_evidence_max_state_bytes:8192,terminal_evidence_max_state_tokens:2048,compact_representation:true,discovery_retention:enabled,output_deferral:deferral},run_id:'fixture',on_event:async e=>events.push(e)});
  const archive=bindDelivery({captures:result.captures,receipts:result.receipts});
  const exported=result.status==='final_context_selected'?exportTerminalEvidenceSelection({...result,packet:result.terminal_evidence_packet,response_capture:result.response_captures.at(-1),source_snapshots:[snapshot,beta],task},base):null;
  return {result,exported,requests,prompts,events,executions,archive};
 }finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}
test('treatment omits old exchanges but protects first delivery and native archived selection',async()=>{
 const r=await exercise();assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.archive.read_observations.length,1);assert.deepEqual(r.exported.prediction.traj_data.pred_files,['alpha.js']);
 assert.ok(r.prompts[1].messages.some(m=>m.role==='tool'&&m.tool_call_id==='read-alpha'));
 assert.ok(!r.prompts[5].messages.some(m=>m.tool_call_id==='read-alpha'));
 assert.ok(r.result.history.some(m=>m.tool_call_id==='read-alpha'),'private archive/history unchanged');
 assert.ok(r.result.history_projections.some(p=>p.removed_bytes>0));assert.equal(r.result.recovery_presentations.length,r.requests-1);
 const recovered=JSON.parse(r.result.history.find(m=>m.tool_call_id==='recover').content);assert.equal(recovered.ok,true,JSON.stringify(recovered));assert.equal(recovered.output.read_id,r.archive.read_observations[0].id);assert.equal(recovered.output.current_source_verified,false);
 assert.equal(r.result.receipts.reduce((n,x)=>n+x.input_tokens+x.output_tokens,0),r.requests*210);
});
test('control has no injected schemas, projection, index or discovery reminders',async()=>{
 const r=await exercise({enabled:false});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.result.history_projections.length,0);assert.equal(r.result.discovery_presentations.length,0);assert.equal(r.result.recovery_presentations.length,0);assert.ok(r.prompts.every(p=>!p.tools.some(t=>t.function.name==='list_recovery_page')));
});
test('reminders consume only successful rendered requests, rate limit and stop at finalization',async()=>{
 const r=await exercise({recycle:true,endAt:15});assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.result.recycling.recycles,1);assert.ok(r.result.captures.length>r.requests);const ds=r.result.discovery_presentations;assert.equal(ds.length,3);assert.equal(ds[0].step,2);assert.ok(ds.slice(1).every((d,i)=>d.step-ds[i].step>=4));
 assert.ok(!r.prompts.at(-1).messages.some(m=>m.content?.startsWith('Review the explicit requirements')));assert.deepEqual(r.prompts.at(-1).tools.map(t=>t.function.name),[EXPANDED_TOOL]);
});
test('duplicate raw recovery fields are rejected before repository dispatch',async()=>{
 const r=await exercise({badRecovery:true});assert.equal(r.result.status,'final_context_selected',r.result.error);const o=JSON.parse(r.result.history.find(m=>m.tool_call_id==='recover').content);assert.equal(o.ok,false);assert.match(o.error,/invalid-recovery-json/);assert.ok(!r.executions.includes('recover_archived_read'));
});
test('oversize protected pending cannot bypass actual recycler admission',async()=>{
 const r=await exercise({oversize:true});assert.equal(r.requests,1);assert.equal(r.result.status,'context_budget_stopped');assert.equal(r.result.selection,null);assert.equal(r.result.recovery_presentations.length,1);assert.equal(r.result.history_projections.length,1);
});

test('failed discovery dispatch retains exact attempt, page, snapshot prefix and known cost without presentation',async()=>{
 const r=await exercise({recycle:true,failedDiscovery:true});assert.equal(r.requests,3);assert.equal(r.result.status,'run_error');assert.equal(r.result.error,'glm.incomplete-output');assert.equal(r.result.discovery_presentations.length,0);assert.equal(r.result.history_projections.length,2);assert.equal(r.result.discovery_attempts.length,3);
 const a=r.result.discovery_attempts.at(-1);assert.equal(a.reminder,true);assert.equal(a.dispatched,true);assert.equal(a.finish_reason,'length');assert.equal(a.input_tokens+a.output_tokens,712);assert.equal(a.request_sha256,r.result.receipts.at(-1).request_sha256);assert.ok(a.recovery_page.private.read_ids.length);
 const snapshot=r.result.recovery_snapshots.find(s=>s.fingerprint===a.recovery_page.private.snapshot);assert.ok(snapshot);assert.equal(snapshot.archive_sha256,hash(stable({captures:r.result.captures.slice(0,snapshot.capture_count),receipts:r.result.receipts.slice(0,snapshot.receipt_count)})));
 assert.equal(r.result.receipts.reduce((n,x)=>n+x.input_tokens+x.output_tokens,0),1132);assert.equal(r.result.selection,null);
});

test('confirmed new body resets reminder clock; repeated identical body does not',async()=>{
 const fresh=await exercise({recycle:true,novelty:'new',endAt:15}),repeat=await exercise({recycle:true,novelty:'repeat',endAt:15});
 for(const r of [fresh,repeat])assert.equal(r.result.status,'final_context_selected',r.result.error);
 assert.deepEqual(fresh.result.discovery_presentations.map(d=>d.step),[2,9,13]);
 assert.deepEqual(repeat.result.discovery_presentations.map(d=>d.step),[2,6,10]);
});

test('native oversized-read deferral remains available without inventing delivery of withheld source',async()=>{
 const r=await exercise({deferral:true,endAt:4});assert.ok(r.requests>1,r.result.error);assert.equal(r.result.tool_output_deferrals.length,1);assert.equal(r.archive.read_observations.length,1);assert.equal(r.archive.read_observations[0].path,'beta.js');assert.equal(r.result.status,'final_context_selected',r.result.error);assert.equal(r.result.terminal_evidence_held.length,0);assert.equal(r.result.terminal_evidence_presentations.length,1);assert.ok(r.result.history_projections.length>=2);
 const prompt=r.prompts[1];assert.ok(prompt.messages.some(m=>m.tool_call_id==='read-alpha'));assert.ok(!prompt.messages.some(m=>m.role==='tool'&&m.content.includes('function alpha')));
});
