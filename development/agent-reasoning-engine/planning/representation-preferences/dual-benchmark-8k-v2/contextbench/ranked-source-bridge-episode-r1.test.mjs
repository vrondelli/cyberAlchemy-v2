// Scripted model with real repository reads and native terminal export.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createSourceHintService} from './ranked-source-index-service-r1.mjs';
import {runRankedSourceHintsEpisode} from './ranked-source-hints-episode-r1.mjs';
import {admitToolBatch} from './ranked-source-hints-admission-r1.mjs';
import {rankSourcesTool} from './ranked-source-hints-tool-r1.mjs';
import {tools,createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bodyForReceipt,observationItems} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function hints(base,sha,query){return {schema:'are.ranked-source-hints/v1',index_digest:'c'.repeat(64),query_digest:hash(stable({query})),partial_index:false,omitted_query_terms:0,matching_windows:1,omitted_hints:0,unreadable_matching_lines:0,unreadable_path_fallbacks:0,hints:[{path:'unread.js',base_commit:base,content_sha256:sha,start_line:1,end_line:1,score_units:100}]};}
async function fixture({hintOnly=false,forged=false,summaryTokens=100}={}){
 const root=mkdtempSync(join(tmpdir(),'ranked-native-'));const events=[],receipts=[],snapshots=[],prompts=[];let calls=0,queries=0;
 try{
  const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-q');const text='export const needle = 1;\n';writeFileSync(join(root,'unread.js'),text);git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');const base=git('rev-parse','HEAD');
  const manifests=[],indexEvents=[];
  const live=await createSourceHintService({repository:root,base_commit:base,signal:new AbortController().signal,save_manifest:v=>manifests.push(v),record:e=>indexEvents.push(e)});
  const source_hints={...live,query:async query=>{queries++;assert.equal(snapshots.length,0);return live.query(query);}};

  const execute_tool=createRepositoryTools({root,base_commit:base,record_source:s=>snapshots.push(s)});
  const driver={receipts,index_receipts:[],measurePrompt:async()=>2000,admitMessages:async(messages,tools)=>stable({messages,tools}),prepare:async({prompt,output_cap})=>{prompts.push(JSON.parse(prompt));const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap};return {prompt,output_cap,profile,input_upper_bound:1000,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))}} ,dispatch:async prepared=>{
   const n=calls++,packet=events.find(e=>e.kind==='terminal-packet')?.packet;
   const sequence=hintOnly?[['rank_sources',{query:'needle'}],['finish_issue_attempt',{}]]:[['rank_sources',{query:'needle'}],['read_file',{path:'unread.js',revision:'base',start_line:1,line_count:1}],['finish_issue_attempt',{}]];
   const [name,args]=packet?['submit_context_handles_v2',{summary:'Read source after ranked hint; patch correctness unverified.',context_handles:[packet.private.bindings[0].handle]}]:sequence[n];
   receipts.push({...prepared.profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,request_sha256:prepared.request_sha256,finish_reason:'tool_calls'});
   return {final_bytes:stable({message:{role:'assistant',content:null,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'})};}};
  const result=await runRankedSourceHintsEpisode({task:{problem_statement:'Investigate needle.',instance_id:'fixture',repo_url:'https://example.invalid/repo.git',base_commit:base},driver,tools,execute_tool,source_context:()=>({snapshots,repoRoot:root}),source_hints,measure_tokens:async()=>summaryTokens,persist:e=>events.push(structuredClone(e))});
  live.close();assert.equal(manifests.length,1);assert.ok(indexEvents.every(e=>e.model_calls===0&&e.settlement.process_group_absent));
  return {result,events,snapshots,prompts,calls,queries};
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('rank unread source then native read: only the read reaches final export',async()=>{
 const f=await fixture();assert.equal(f.result.status,'final_context_selected',f.result.error);assert.equal(f.result.arm,'ranked-source-hints');assert.equal(f.calls,4);assert.equal(f.queries,1);assert.equal(f.result.phase_state.known_tokens,480);
 const packet=f.events.find(e=>e.kind==='terminal-packet');assert.equal(packet.joined.read_observations.length,1);assert.equal(packet.joined.read_observations[0].tool_call_id,'call-1');
 assert.deepEqual(f.result.exported.prediction.traj_data.pred_files,['unread.js']);
 assert.ok(f.prompts[0].tools.some(t=>t.function.name==='rank_sources'));assert.ok(f.prompts[0].messages.some(m=>m.content.includes('Pinned source index')));
 assert.equal(f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='rank_sources').output.output.hints.length,1);
});
test('hint-only trajectory cannot create terminal source evidence',async()=>{
 const f=await fixture({hintOnly:true});assert.equal(f.result.status,'run_error');assert.equal(f.result.exported,undefined);assert.equal(f.snapshots.length,0);assert.equal(f.queries,1);assert.equal(f.result.phase_state.known_tokens,240);
});
