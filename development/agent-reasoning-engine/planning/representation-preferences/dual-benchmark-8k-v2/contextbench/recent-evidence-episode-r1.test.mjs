import {rankedSearchSchema} from './schema-agreement-arguments-r1.mjs';
// Scripted model with real repository reads and native terminal export.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createSourceHintService} from './ranked-source-index-service-r1.mjs';
import {runRankedReadEpisode} from './recent-evidence-episode-r1.mjs';
import {admitToolBatch} from './ranked-source-hints-admission-r1.mjs';
import {rankSourcesTool} from './ranked-source-hints-tool-r1.mjs';
import {tools,createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bodyForReceipt,observationItems} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function hints(base,sha,query){return {schema:'are.ranked-source-hints/v1',index_digest:'c'.repeat(64),query_digest:hash(stable({query})),partial_index:false,omitted_query_terms:0,matching_windows:1,omitted_hints:0,unreadable_matching_lines:0,unreadable_path_fallbacks:0,hints:[{path:'unread.js',base_commit:base,content_sha256:sha,start_line:1,end_line:1,score_units:100}]};}
async function fixture({hintOnly=false,forged=false,persistenceFailure=false,summaryTokens=100,recentOrder=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ranked-native-'));const events=[],receipts=[],snapshots=[],prompts=[];let calls=0,queries=0;
 try{
  const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-q');const text='export const needle = 1;\n';writeFileSync(join(root,'unread.js'),text);if(recentOrder){writeFileSync(join(root,'aaa.js'),'export const early = 1;\n');writeFileSync(join(root,'zzz.js'),'export const late = 2;\n');}git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');const base=git('rev-parse','HEAD');
  const manifests=[],indexEvents=[];
  const live=await createSourceHintService({repository:root,base_commit:base,signal:new AbortController().signal,save_manifest:v=>manifests.push(v),record:e=>indexEvents.push(e)});
  const source_hints={...live,query:async query=>{queries++;assert.equal(snapshots.length,0);return live.query(query);}};

  const nativeTool=createRepositoryTools({root,base_commit:base,record_source:s=>snapshots.push(s)});
  const execute_tool=async(name,args)=>{const r=await nativeTool(name,args);if(forged&&name==='read_file'&&r.ok)r.output.source_revision='current';return r;};
  const driver={receipts,index_receipts:[],measurePrompt:async()=>2000,admitMessages:async(messages,tools)=>stable({messages,tools}),prepare:async({prompt,output_cap})=>{prompts.push(JSON.parse(prompt));const search=JSON.parse(prompt).tools?.find(t=>t.function?.name==='search');if(search)assert.deepEqual(search.function.parameters,rankedSearchSchema);const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap};return {prompt,output_cap,profile,input_upper_bound:1000,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))}} ,dispatch:async prepared=>{
   const n=calls++,packet=events.find(e=>e.kind==='terminal-packet')?.packet;
   const sequence=recentOrder?[['search',{mode:'ranked',query:'needle',path_prefix:'',offset:0,limit:5,revision:'base'}],['read_file',{path:'aaa.js',start_line:1,line_count:1,revision:'base'}],['read_file',{path:'zzz.js',start_line:1,line_count:1,revision:'base'}],['read_file',{path:'unread.js',start_line:1,line_count:1,revision:'base'}],['finish_issue_attempt',{}]]:hintOnly?[['rank_sources',{query:'needle'}],['finish_issue_attempt',{}]]:[['search',{mode:'ranked',query:'needle',path_prefix:'',offset:0,limit:5,revision:'base'}],['finish_issue_attempt',{}]];
   const [name,args]=packet?['submit_context_handles_v3',{summary:'Read source after ranked hint; patch correctness unverified.',context_handles:[packet.private.bindings[0].handle]}]:sequence[n];
   receipts.push({...prepared.profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,request_sha256:prepared.request_sha256,finish_reason:'tool_calls'});
   return {final_bytes:stable({message:{role:'assistant',content:null,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'})};}};
  const result=await runRankedReadEpisode({task:{problem_statement:'Investigate needle.',instance_id:'fixture',repo_url:'https://example.invalid/repo.git',base_commit:base},driver,tools,execute_tool,source_context:()=>({snapshots,repoRoot:root}),source_hints,measure_tokens:async()=>summaryTokens,persist:e=>{if(persistenceFailure&&e.kind==='ranked-read-evidence')throw Error('fixture.evidence-persistence');events.push(structuredClone(e));}});
  live.close();assert.equal(manifests.length,1);assert.ok(indexEvents.every(e=>e.model_calls===0&&e.settlement.process_group_absent));
  return {result,events,snapshots,prompts,calls,queries};
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('ranked search directly reads source and reaches native final export',async()=>{
 const f=await fixture();assert.equal(f.result.status,'final_context_selected',f.result.error);assert.equal(f.result.arm,'recent-evidence-ledger');assert.equal(f.calls,3);assert.equal(f.queries,1);assert.equal(f.result.phase_state.known_tokens,360);
 const packet=f.events.find(e=>e.kind==='terminal-packet');assert.equal(packet.joined.read_observations.length,1);assert.equal(packet.joined.read_observations[0].tool_call_id,'call-0:search:0');
 assert.deepEqual(f.result.exported.prediction.traj_data.pred_files,['unread.js']);
 const records=f.events.filter(e=>e.kind==='ranked-read-evidence');assert.equal(records.length,1);assert.equal(records[0].delivery,'unconfirmed');assert.equal(f.result.branches[0].ranked_evidence_records[0].record_sha256,records[0].record.record_sha256);assert.equal(packet.joined.branch_bindings[0].receipt_confirmed_ranked_read_ids.length,1);
 assert.deepEqual(f.prompts[0].tools.find(t=>t.function.name==='search').function.parameters,rankedSearchSchema);assert.ok(f.prompts[0].tools.some(t=>t.function.name==='rank_sources'));assert.ok(f.prompts[0].messages.some(m=>m.content.includes('Pinned source index')));
 assert.equal(f.events.find(e=>e.kind==='source-tool-result'&&e.call.function.name==='search').output.output.observations.length,1);
});
test('hint-only trajectory cannot create terminal source evidence',async()=>{
 const f=await fixture({hintOnly:true});assert.equal(f.result.status,'run_error');assert.equal(f.result.exported,undefined);assert.equal(f.snapshots.length,0);assert.equal(f.queries,1);assert.equal(f.result.phase_state.known_tokens,240);
});

test('source integrity failure retains paid receipt and aborts before next model call',async()=>{
 const f=await fixture({forged:true});assert.equal(f.result.status,'run_error');assert.match(f.result.error,/source-observation/);assert.equal(f.calls,1);assert.equal(f.result.phase_state.known_tokens,120);assert.equal(f.result.exported,undefined);assert.equal(f.events.filter(e=>e.kind==='ranked-read-evidence').length,0);
});
test('evidence persistence failure aborts without claiming delivery or retry',async()=>{
 const f=await fixture({persistenceFailure:true});assert.equal(f.result.status,'run_error');assert.match(f.result.error,/evidence-persistence/);assert.equal(f.calls,1);assert.equal(f.result.phase_state.known_tokens,120);assert.equal(f.result.exported,undefined);
});

// The fourth discovery request confirms zzz; its next ledger must outrank aaa.
test('episode projects recently confirmed evidence ahead of alphabetical entries',async()=>{
 const f=await fixture({recentOrder:true});assert.equal(f.result.status,'final_context_selected',f.result.error);assert.equal(f.result.arm,'recent-evidence-ledger');
 const prefix='Evidence coverage ledger (not relevance or gold coverage): ';
 const message=f.prompts[4].messages.find(m=>m.role==='system'&&m.content.startsWith(prefix));
 assert.ok(message);const ledger=JSON.parse(message.content.slice(prefix.length));
 assert.deepEqual(ledger.entries.map(e=>e.path),['zzz.js','aaa.js','unread.js']);
 assert.equal(f.calls,6);assert.equal(f.result.phase_state.known_tokens,720);
});
