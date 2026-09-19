// Real transport/runner/storage pipeline against a loopback provider, never paid GLM.
import {resolveToolArchiveReference} from './tool-archive-references.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync,lstatSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runComparisonArm} from './ranked-read-arm-r1.mjs';
import {runComparisonArm as oldDispatcher} from './comparison-compact-arm.mjs';
import {buildRankedReadAcquisitionSchedule as buildComparisonSchedule} from './ranked-read-acquisition-schedule-r1.mjs';
import {runComparisonCampaign} from './ranked-read-campaign-r1.mjs';
import {createComparisonGenerationStorage} from './ranked-read-generation-storage-r1.mjs';
import {prepareComparisonPrediction,scoreComparisonCampaign} from './score-ranked-read-r2.mjs';
import {createComparisonOutcomeStore,verifyComparisonOutcomeSeal} from './ranked-read-outcome-store-r1.mjs';
import {createComparisonEvidenceManifest,reconcileComparisonCampaignEvidence} from './ranked-read-evidence-manifest-r1.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-admission-v5.mjs';import {createIndexTokenizer} from './packet-diversity-v1/live-client-admission-v5.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function response(wire){
 const tool=(name,args)=>({message:{role:'assistant',tool_calls:[{id:'call-'+hash(stable(wire)).slice(0,10),type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'});
 const final=wire.tools.find(t=>t.function.name==='submit_context_handles_v3');if(final)return tool(final.function.name,{summary:'Fixture source',context_handles:final.function.parameters.properties.context_handles.items.enum});
 if(!wire.messages.some(m=>m.role==='tool'))return tool('search',{mode:'ranked',query:'py',revision:'base',path_prefix:'',offset:0,limit:5});
 return tool('finish_issue_attempt',{});
}
async function fixture(t,mode,{failSave=false,dispatch_arm=runComparisonArm,line_width=40,read_limit=12}={}){
 const root=mkdtempSync(join(tmpdir(),'canonical-integration-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const cache=join(root,'cache');mkdirSync(cache);const git=(...a)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...a],{cwd:cache,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git('init');writeFileSync(join(cache,'a.py'),['overflow','wide'].includes(mode)?Array.from({length:100},()=>('# '+('x'.repeat(line_width)))).join('\n')+'\n':'a = 1\n');git('add','.');git('-c','user.name=fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');const commit=git('rev-parse','HEAD');git('remote','add','origin','https://example.invalid/source.git');
 const wideSteps=new Map();let modelCalls=0;const server=http.createServer(async(req,res)=>{let body='';for await(const b of req)body+=b;res.setHeader('content-type','application/json');if(req.url==='/tokenizer'){const count=Math.ceil(Buffer.byteLength(body)/4);res.end(JSON.stringify({usage:{prompt_tokens:count}}));return;}modelCalls++;if(mode==='unknown'){req.socket.destroy();return;}const wire=JSON.parse(body);let r=response(wire,read_limit);
 if(mode==='wide'){
  const final=wire.tools.find(t=>t.function.name==='submit_context_handles_v3');
  const tool=(name,args,id)=>({id,type:'function',function:{name,arguments:stable(args)}});
  if(final)r={message:{role:'assistant',tool_calls:[tool(final.function.name,{summary:'All fixture reads',context_handles:final.function.parameters.properties.context_handles.items.enum},'final')]},finish_reason:'tool_calls'};
  else{
   const key=wire.messages.find(m=>m.role==='user'&&m.content?.startsWith('Inspect the fixture behavior.'))?.content;
   assert.ok(key);const step=wideSteps.get(key)??0;wideSteps.set(key,step+1);
   const calls=step===0?[tool('rank_sources',{query:'py'},'rank')]:step<=12?Array.from({length:4},(_,j)=>tool('read_file',{path:'a.py',revision:'base',start_line:(step-1)*4+j+1,line_count:1},'read-'+step+'-'+j)):[tool('finish_issue_attempt',{},'finish')];
   r={message:{role:'assistant',tool_calls:calls},finish_reason:'tool_calls'};
  }
 }if(mode==='overflow'&&r.message.tool_calls?.[0]?.function.name==='read_file'){const original=r.message.tool_calls[0];r.message.tool_calls=['a','b'].map(suffix=>({...original,id:original.id+suffix,function:{name:'read_file',arguments:original.function.arguments}}));}res.end(JSON.stringify({model:'glm-5.3-flash',choices:[r],usage:{prompt_tokens:Math.ceil(Buffer.byteLength(stable({model:wire.model,messages:wire.messages,tools:wire.tools}))/4),completion_tokens:20}}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const endpoint='http://127.0.0.1:'+server.address().port;
 const template=JSON.parse(readFileSync(new URL('./discovery-v1/live-config.json',import.meta.url))).tasks[0].cell_template;
 const tasks=Array.from({length:4},(_,i)=>{const task={instance_id:'fixture-'+i,original_inst_id:'fixture-'+i,repo:'fixture',repo_url:'https://example.invalid/source.git',language:'python',base_commit:commit,problem_statement:'Inspect the fixture behavior. '+i,source:'fixture'},task_path=join(root,'task'+i+'.json');writeFileSync(task_path,stable(task));return {id:'contextbench-'+(i+1),instance_id:task.instance_id,task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,base_commit:commit,cell_template:{...structuredClone(template),instance_id:task.instance_id}};});
 const config={model:'glm-5.3-flash',context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks};const config_path=join(root,'config.json'),cohort_path=join(root,'cohort.json');writeFileSync(config_path,stable(config));writeFileSync(cohort_path,stable({source_config_sha256:hash(readFileSync(config_path)),cohort:tasks.map(({id,instance_id,task_path,task_sha256,base_commit})=>({task_id:id,instance_id,task_path,task_sha256,base_commit}))}));const sources={config_path,cohort_path,cohort_sha256:hash(readFileSync(cohort_path))},schedule=buildComparisonSchedule({...sources,candidates:['ranked-read-acquisition']});
 const runs=join(root,'runs'),outcomes=join(root,'outcomes'),metadata=join(root,'metadata'),source_root=join(root,'source');
 for(const path of [runs,outcomes,metadata])mkdirSync(path);
 const request={schedule,sources,outcome_root:outcomes,runs_root:runs,metadata_root:metadata,source_root,credential_path:'unused',signal:new AbortController().signal};
 const storage=createComparisonGenerationStorage(request,{host_guard:()=>({admitted:true})});
 const create_factory=({signal,persistence,before_dispatch})=>({
  create_client:({cell,record_event})=>{
   const native=createGlmClient({chat_endpoint:endpoint+'/chat/completions',tokenizer_endpoint:endpoint+'/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:cell.limits.output_deferral?'contextbench-deferral-v1':'contextbench-budget-v1',maximum_request_bytes:262144,token_margin:512,reasoning_effort:'low',model_timeout_ms:30000,signal,persistence,before_dispatch});
   const index=createIndexTokenizer({registry:{consume:async({consumer})=>consumer(Buffer.from('fixture'))},reference:{},maximum_calls:512,signal,record:r=>record_event({kind:'index-tokenizer',receipt:r}),post:async()=>({status:200,payload:{usage:{prompt_tokens:100}},bytes:10})});
   return {...native,index_receipts:index.receipts,measure_index:index.measure};
  },measure_index_tokens:(text,client)=>client.measure_index(text)
 });
 const campaign=await runComparisonCampaign({...request,...storage},{create_factory});
 const metadataTerminal=JSON.parse(readFileSync(join(outcomes,'QUEUE-TERMINAL.json')));
 const manifest=JSON.parse(readFileSync(join(metadata,'EVIDENCE-MANIFEST.json')));
 const hydrated=verifyComparisonOutcomeSeal({root:outcomes,schedule,sources,expected_seal_sha256:manifest.outcome_seal_sha256});
 const terminal={...metadataTerminal,outcomes:hydrated.map(x=>x.result)};
 const sealed={seal:JSON.parse(readFileSync(join(outcomes,'GENERATION-SEAL.json')))};
 const reconciliation=campaign.reconciliation;
 if(mode!=='unknown')for(const [i,slot] of schedule.slots.entries()){
  const prepared=prepareComparisonPrediction({slot,outcome:terminal.outcomes[i],entry:manifest.entries[i],runs_root:runs,source_root});
  assert.ok(prepared.prediction);assert.equal(prepared.verify(),true);
 }
 if(process.env.ARE_FIXTURE_DEBUG)console.error(JSON.stringify({mode,modelCalls,outcomes:terminal.outcomes.filter(x=>x.attempted).map(x=>({status:x.status,error:x.error,result_error:x.result?.error,receipts:x.result?.receipts?.length}))}));

 const allocated=path=>{const st=lstatSync(path);return Math.max(st.size,st.blocks*512)+(st.isDirectory()?readdirSync(path).reduce((n,k)=>n+allocated(join(path,k)),0):0);};
 const capacity={mode,rows:terminal.outcomes.filter(o=>o.attempted).map(o=>{
  const folder=join(runs,String(o.sequence).padStart(2,'0'));
  const journal=join(folder,'events.jsonl');const events=existsSync(journal)?readFileSync(journal,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
  if(mode==='wide'){
   const packet=events.find(e=>e.kind==='terminal-packet')?.packet;
   assert.equal(packet.fit.rendered_handles,48);assert.equal(packet.fit.omitted_eligible,0);
   assert.equal(o.result.native_export.selection.final_read_ids.length,48);
  }
  const sourceIndex=JSON.parse(readFileSync(join(folder,'source-index.json')));
  assert.equal(sourceIndex.base_commit,commit);
  const indexQueries=events.filter(e=>e.kind==='source-index-query');
  assert.ok(indexQueries.length>=1);
  assert.ok(indexQueries.every(e=>e.index_digest===sourceIndex.index_digest&&e.model_calls===0));
  if(mode!=='unknown'){
   assert.ok(indexQueries.length>=2);
   const ranking=events.find(e=>e.kind==='source-tool-result'&&e.call?.function?.name==='search');
   assert.ok(ranking.output.output.observations.length>0,'fixture must deliver a real ranked source hint');
  }
  const archives=events.filter(e=>e.kind==='tool-output-archive-reference');
  for(const event of archives){const restored=resolveToolArchiveReference({journal:join(folder,'events.jsonl'),record:event.record});assert.equal(restored.sha256,event.record.sha256);}
  const admissions=events.filter(e=>e.kind==='aggregate-admission');
  return {sequence:o.sequence,arm:o.arm,model_calls:(o.result?.receipts??[]).filter(r=>r.kind==='model').length,tokenizer_calls:(o.result?.receipts??[]).filter(r=>r.kind==='tokenizer').length,index_tokenizer_calls:(o.result?.index_tokenizer_receipts??[]).length,
   bounded_view_batches:events.filter(e=>e.kind==='bounded-view-admission').length,projection_attempts:events.filter(e=>e.kind==='frontier-projection-attempt').length,raw_exchanges:events.filter(e=>e.kind==='frontier-raw-exchange').length,admission_batches:admissions.length,maximum_fit_attempts:Math.max(0,...admissions.map(e=>e.attempts.length)),
   archive_reference_records:archives.length,archive_reference_json_bytes:archives.reduce((n,e)=>n+Buffer.byteLength(stable(e)+'\n'),0),
   allocated_run_bytes:existsSync(folder)?allocated(folder):0,event_journal_bytes:existsSync(journal)?Buffer.byteLength(readFileSync(journal)):0};
 }),allocated_runs_bytes:allocated(runs),allocated_outcomes_bytes:allocated(outcomes),ordinary_stage_limit_bytes:248*1024**2,final_stage_reserve_bytes:8*1024**2,maximum_runs_bytes:256*1024**2,maximum_outcomes_bytes:64*1024**2};
 if(mode!=='unknown'){
  const indexPath=join(runs,'00','source-index.json'),original=readFileSync(indexPath);
  const changed=JSON.parse(original);changed.index_digest='0'.repeat(64);writeFileSync(indexPath,stable(changed));
  const rejected=reconcileComparisonCampaignEvidence({outcome_root:outcomes,runs_root:runs,schedule,sources,manifest,expected_manifest_sha256:hash(stable(manifest))});
  assert.equal(rejected.all_run_evidence_reconciled,false);assert.equal(rejected.rows[0].status,'reconciliation-failed');
  assert.match(rejected.rows[0].error,/file-integrity/);writeFileSync(indexPath,original);
 }
 const score_root=join(root,'score');mkdirSync(score_root);
 const scored=await scoreComparisonCampaign({outcome_root:outcomes,runs_root:runs,source_root,score_root,schedule,sources,manifest,expected_manifest_sha256:hash(stable(manifest)),verify_settlement:async()=>true,admit_score:async()=>true},{...(mode==='measurement-failure'?{adjudicate:()=>{throw Error('injected.baseline-source-drift');}}:{}),native_score:async()=>({native:{final:{span:{coverage:0.5,precision:0.5},file:{coverage:0.5,precision:0.5}},trajectory:{steps:[{coverage:{span:0.75}}]}}})});
 assert.deepEqual(JSON.parse(readFileSync(join(score_root,'RESULTS.json'))),scored);
 return {terminal,sealed,reconciliation,modelCalls,capacity,scored};
}


test('four-task candidate campaign seals and reconstructs ranked predictions',async t=>{
 const f=await fixture(t,'normal');assert.equal(f.terminal.status,'settled');assert.equal(f.terminal.outcomes.length,4);assert.equal(f.reconciliation.reconciled_outcomes,4);assert.equal(f.modelCalls,12);assert.equal(f.scored.acquisition.rows.length,4);assert.equal(f.scored.post_score_integrity_verified,true);assert.ok(f.scored.acquisition.rows.every(r=>r.counters['ranked-mode-requested-calls']===1));assert.equal(f.scored.campaign_goal_achieved,false);assert.equal(f.sealed.seal.summary.accounting.raw_accounting_complete,true);assert.deepEqual(Object.keys(f.sealed.seal.summary.accounting.by_arm),['ranked-read-acquisition']);
 for(const o of f.terminal.outcomes){assert.equal(o.result.status,'final_context_selected');assert.equal(o.result.branches[0].ranked_evidence_records.length,1);}
});
test('unknown provider cost stops campaign and retains every assigned task',async t=>{
 const f=await fixture(t,'unknown');assert.equal(f.terminal.status,'incomplete');assert.equal(f.scored.acquisition.disposition,'inconclusive');assert.equal(f.scored.acquisition.rows.length,4);assert.equal(f.terminal.outcomes.length,4);assert.ok(f.terminal.outcomes.some(o=>o.status==='not-started'));assert.equal(f.sealed.seal.summary.accounting.raw_accounting_complete,false);assert.ok(f.sealed.seal.summary.accounting.conservative_total_tokens>0);
});

test('post-evaluation measurement failure still persists all native outcomes and costs',async t=>{
 const f=await fixture(t,'measurement-failure');assert.equal(f.scored.acquisition_measurement_verified,false);assert.equal(f.scored.acquisition.disposition,'inconclusive');assert.equal(f.scored.acquisition.rows.length,4);assert.equal(f.scored.native_outcomes.length,4);assert.ok(f.scored.native_outcomes.every(r=>r.valid&&r.native));assert.ok(f.scored.acquisition.rows.every(r=>r.coverage_per_10000_tokens===null&&r.known_model_tokens>0&&r.conservative_model_tokens>=r.known_model_tokens));assert.equal(f.scored.post_score_integrity_verified,true);assert.equal(f.scored.campaign_goal_achieved,false);
});
