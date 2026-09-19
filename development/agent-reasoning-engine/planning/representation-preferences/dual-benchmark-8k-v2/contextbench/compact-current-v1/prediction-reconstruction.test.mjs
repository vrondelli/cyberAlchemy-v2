import {reconstructComparisonPrediction} from '../comparison-compact-prediction.mjs';
// Additive current-ARE codec integration. Open questions: README.md.
// Actual recycler and native export with synthetic transport; no provider/gold.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport,openContextRecycling} from './../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from './delivery.mjs';
import {runEpisode} from './episode-recovery-v2.mjs';
import {EXPANDED,EXPANDED_TOOL,exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function exercise({visibility='eager',premature=false,skipRefresh=false,enabled=true,recycle=false,oversize=false,deferral=false,badRecovery=false,badReceipt=false,failedDiscovery=false,novelty=null,endAt=12,search=false,tamper=null}={}){
 const root=mkdtempSync(join(tmpdir(),'discovery-episode-')),base=join(root,'base');mkdirSync(base);const utf8=search?Array.from({length:20},(_,i)=>'function alpha'+i+'() {}').join('\n')+'\n':deferral?'function alpha() {'+'x'.repeat(1200)+'}\n':'function alpha() {}\n',snapshot={path:'alpha.js',utf8,source_sha256:hash(utf8)};writeFileSync(join(base,'alpha.js'),utf8);const beta={path:'beta.js',utf8:'function beta() {}\n',source_sha256:hash('function beta() {}\n')};writeFileSync(join(base,'beta.js'),beta.utf8);
 const receipts=[],prompts=[],events=[],executions=[];let requests=0,forcedRecycle=false;
 const tool=(id,name,args,raw)=>({id,type:'function',function:{name,arguments:raw??stable(args)}});
 const transport=createStatelessRecyclingTransport({adapter_id:'discovery-fixture',source_ref:'episode.test.mjs',maximum_output_tokens:512,
  measure_request:async({prompt})=>{const p=JSON.parse(prompt);if((oversize||deferral)&&requests===1&&p.messages.some(m=>m.role==='tool'&&(!deferral||m.content.includes('function alpha'))))return 7900;if(recycle&&requests===2&&!forcedRecycle){forcedRecycle=true;return 7900;}return 200;},
  request_once:async({prompt})=>{
   requests++;const p=JSON.parse(prompt);prompts.push(p);let message,finish_reason='tool_calls';
   if(p.tools.some(t=>t.function.name===EXPANDED_TOOL))message={role:'assistant',tool_calls:[tool('final',EXPANDED_TOOL,{summary:'Selected original source.',context_handles:['h0']})]};
   else if(requests===1)message={role:'assistant',tool_calls:[tool('read-alpha',search?'search':'read_file',search?{query:'alpha',path_prefix:'',offset:0,limit:20,revision:'base'}:{path:'alpha.js',start_line:1,line_count:1,revision:'base'}),...(deferral?[tool('read-beta','read_file',{path:'beta.js',start_line:1,line_count:1,revision:'base'}),tool('patch-batch','get_patch',{})]:[])]};
   else if(enabled&&requests===2)message={role:'assistant',tool_calls:[...(premature?[tool('premature','recover_archived_read',{handle:'r0'})]:[]),tool('refresh',skipRefresh?'get_patch':visibility==='demand'?'open_recovery':'list_recovery_page',skipRefresh||visibility==='demand'?{}:{cursor:null})]};
   else if(enabled&&requests===3){
    const page=p.messages.map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).find(v=>v?.version==='historical-recovery-page-v2');
    const handle=page?.entries[0]?.handle??'r0';message={role:'assistant',tool_calls:[tool('recover','recover_archived_read',{handle},badRecovery?' {"handle":"r0","handle":"r1"} ':undefined)]};
   }else if(novelty&&requests===5)message={role:'assistant',tool_calls:[tool('novelty-read','read_file',{path:novelty==='new'?'beta.js':'alpha.js',start_line:1,line_count:1,revision:'base'})]};
   else if(requests>=endAt){message={role:'assistant',content:stable({summary:'Ready for review.',context_read_ids:[]})};finish_reason='stop';}
   else message={role:'assistant',tool_calls:[tool('patch-'+requests,'get_patch',{})]};
   const receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,input_tokens:200,output_tokens:10,finish_reason};if(failedDiscovery&&requests===3){receipt.finish_reason='length';receipt.output_tokens=512;receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);throw Error('glm.incomplete-output');}receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));if(badReceipt&&requests===2)receipt.request_sha256='f'.repeat(64);receipts.push(receipt);return {receipt,final_bytes:stable({message,finish_reason})};
  }});
 const task={instance_id:'fixture',repo_url:'https://example.invalid/fixture.git',base_commit:'a'.repeat(40),problem_statement:'Inspect alpha source.'};
 const recycler=openContextRecycling({transport,fixture_root:base,scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
 try{
  const result=await runEpisode({task,arm:'baseline',client:{receipts,maximum_model_retries:0},recycler,tools:['read_file','get_patch',...(search?['search']:[])].map(name=>({type:'function',function:{name,parameters:{type:'object'}}})),execute_tool:async(name,args)=>{executions.push(name);if(name==='get_patch')return {ok:true,output:{patch:''}};if(name==='search')return {ok:true,output:{next_offset:null,observations:snapshot.utf8.trimEnd().split('\n').map((line,i)=>({path:snapshot.path,source_sha256:snapshot.source_sha256,base_commit:task.base_commit,source_revision:'base',total_lines:20,start_line:i+1,end_line:i+1,utf8:line,byte_count:Buffer.byteLength(line)}))}};assert.equal(name,'read_file');const source=args.path==='beta.js'?beta:snapshot;return {ok:true,output:{...source,start_line:1,end_line:1,utf8:source.utf8.trimEnd()}};},source_context:()=>({snapshots:[snapshot,beta],repoRoot:base,patch:''}),measure_index_tokens:async text=>Math.ceil(text.length/4),limits:{maximum_calls:deferral?4:20,...(deferral?{finalization_reserve_tokens:1500,finalization_calls:2}:{}),output_cap:512,total_tokens:80000,index_entries:8,index_tokens:1024,terminal_submission:true,terminal_content_fallback:true,maximum_terminal_corrections:0,incomplete_output_corrections:0,terminal_evidence_review:true,terminal_evidence_version:EXPANDED,terminal_evidence_max_handles:32,terminal_evidence_max_state_bytes:8192,terminal_evidence_max_state_tokens:2048,compact_representation:true,discovery_retention:enabled,recovery_visibility:visibility,output_deferral:deferral},run_id:'fixture',on_event:async e=>events.push(e)});
  const archive=bindDelivery({captures:result.captures,receipts:result.receipts});
  const exported=result.status==='final_context_selected'?exportTerminalEvidenceSelection({...result,packet:result.terminal_evidence_packet,response_capture:result.response_captures.at(-1),source_snapshots:[snapshot,beta],task},base):null;
  let rebuilt,rebuildError;
  if(exported){
   const saved={...structuredClone(result),instance_id:task.instance_id,native_export:structuredClone(exported)};
   if(tamper==='prediction')saved.native_export.prediction.commit='b'.repeat(40);
   if(tamper==='receipt')for(const r of saved.receipts)r.request_sha256='f'.repeat(64);
   try{rebuilt=reconstructComparisonPrediction({arm:'current-are',result:saved,events,snapshots:[snapshot,beta],task,repoRoot:base});}catch(e){rebuildError=e;}
  }
  return {result,exported,requests,prompts,events,executions,archive,rebuilt,rebuildError};
 }finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}

test('current ARE reconstructs encoded search and archive recovery in both visibility modes',async()=>{
 for(const visibility of ['eager','demand']){
  const r=await exercise({visibility,search:true});assert.equal(r.result.status,'final_context_selected',r.result.error);
  assert.equal(r.archive.read_observations.length,20);assert.ifError(r.rebuildError);
  assert.equal(r.rebuilt.reconstructed,true);assert.deepEqual(r.rebuilt.prediction,r.exported.prediction);
  assert.ok(r.prompts.some(p=>p.messages.some(m=>m.role==='tool'&&m.content.includes('source-dictionary-v1'))));
 }
});
test('current ARE rejects forged saved prediction and receipt identity',async()=>{
 for(const tamper of ['prediction','receipt']){
  const r=await exercise({search:true,tamper});assert.ok(r.exported);assert.ok(r.rebuildError);assert.equal(r.rebuilt,undefined);
 }
});
