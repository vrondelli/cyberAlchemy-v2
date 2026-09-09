import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {runEpisodes,EPISODE_LIMITS,SELECTED_EPISODE_LIMITS,SINGLE_ARM_LIMITS,assessEpisodeContinuity,verifyEpisodePatch,episodeSources,parseEpisodeArgs} from './runner.mjs';
import {createEpisode,episodeIds} from './episodes.mjs';
import {snapshotTree} from '../../packages/coding-agent-runtime/verifier.mjs';
import {hash} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {createReadOnlyToolRuntime} from '../../packages/coding-agent-runtime/read-only-tools.mjs';

const credential={provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key'};
const quiet={report:()=>{},preflight:()=>[]};
function fixture(t) {
 const root=mkdtempSync(join(tmpdir(),'are-episodes-runner-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 return {directory:join(root,'run'),credential};
}
function blocked(reason='glm.candidate-invalid') {
 return {status:'BLOCK',reason_codes:[reason],history:[],receipts:[{kind:'model'}],recycling:{recycles:0,dispatches:[]},final_response_evidence:{visible_content:'malformed answer',reasoning_content:'must stay private'}};
}
function referenceResult(config) {
 const tree=snapshotTree(config.fixture_root),ref=readFileSync(join(dirname(config.fixture_root),'reference','subject.mjs'),'utf8');
 const history=config.observation_allowlist.map((path,turn)=>({calls:[{id:`read-${turn}`,name:'read-file',arguments:{path}}],
  observations:[{ok:true,output:{path,sha256:tree.files[path],utf8:readFileSync(join(config.fixture_root,path),'utf8')}}]}));
 history.push({calls:[{name:'read-context-evidence',arguments:{digest:'a'.repeat(64)}}],observations:[{ok:true,output:{digest:'a'.repeat(64)}}]});
 return {status:'AWAITING_APPROVAL',candidate:{schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:tree.tree_sha256,
  changes:[{operation:'replace-file',path:'src/subject.mjs',expected_file_sha256:tree.files['src/subject.mjs'],utf8:ref}],authority_effect:'none'},
  history,receipts:history.map(()=>({kind:'model',input_tokens:100,output_tokens:20})),
  recycling:{recycles:1,dispatches:history.map((_,i)=>({generation:i===history.length-1?1:0,input_upper_bound:1000,output_reservation:2048,projected_upper_bound:3048}))},
  final_response_evidence:null};
}

test('real episode integration prepares four identical-pair tasks and independently verifies reference repairs',async t=>{
 const input=fixture(t),calls=[],reports=[];
 const result=await runEpisodes(input,{...quiet,report:value=>reports.push(value),run_configured:async(config,{create_client})=>{
  const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.equal(manifest.arms.length,4);assert.deepEqual(manifest.limits,EPISODE_LIMITS);
  for(let i=0;i<4;i++)assert.ok(existsSync(join(input.directory,`arm-${i}`,'config.json')));
  const index=calls.length;if(index)assert.ok(existsSync(join(input.directory,`arm-${index-1}`,'completed.json')));
  assert.equal(config.recycle_at,8000);assert.equal(config.context_limit,16384);
  create_client({signal:new AbortController().signal});calls.push(config);return referenceResult(config);
 },create_client:options=>{
  assert.equal(options.maximum_requests,12);assert.equal(options.maximum_output_tokens,2048);assert.equal(options.token_margin,256);
  assert.equal(options.signal.aborted,false);return {};
 }});
 assert.equal(result.status,'COMPLETED',result.reason);assert.equal(result.arms.length,4);
 assert.deepEqual(calls.map(c=>c.retention_policy),['clear-v1','recent-observations-v2','recent-observations-v2','clear-v1']);
 for(const index of [0,2]) {
  assert.equal(result.arms[index].task_sha256,result.arms[index+1].task_sha256);
  assert.equal(calls[index].request,calls[index+1].request);
 }
 assert.ok(result.arms.every(a=>a.patch_correct&&a.continuity.passed&&a.original_fixture_unchanged));
 assert.ok(result.arms.every(a=>a.verification.verification.passed===8&&a.verification.verification.expected_tests===8));
 assert.ok(result.arms.every(a=>a.final_response_evidence_present===false));
 assert.ok(reports.length>=9);
});

test('correctness does not fabricate recycling continuity',()=>{
 const files={'a.txt':hash('a'),'b.txt':hash('b')},episode={required_reads:['a.txt','b.txt']};
 const entry=(path,text)=>({calls:[{name:'read-file',arguments:{path}}],observations:[{ok:true,output:{path,utf8:text,sha256:files[path]}}]});
 const output={history:[entry('a.txt','a'),entry('b.txt','b')],recycling:{recycles:0,dispatches:[{generation:0},{generation:0}]}};
 let continuity=assessEpisodeContinuity(output,episode,files);
 assert.equal(continuity.required_files_read,true);assert.equal(continuity.required_reads_on_distinct_turns,true);
 assert.equal(continuity.recycled,false);assert.equal(continuity.passed,false);
 output.history=[{calls:[...output.history[0].calls,...output.history[1].calls],observations:[...output.history[0].observations,...output.history[1].observations]}];
 continuity=assessEpisodeContinuity(output,episode,files);assert.equal(continuity.required_reads_on_distinct_turns,false);
 output.history[0].observations[0].output.utf8='stale';assert.equal(assessEpisodeContinuity(output,episode,files).required_files_read,false);
});

test('ordinary invalid output continues; unknown and credential failures stop with visible evidence private',async t=>{
 for(const reason of ['glm.candidate-invalid','glm.secret-resolution-failed','glm.runtime-failed','glm.billing-unavailable']) {
  const input=fixture(t),reports=[];let calls=0;
  const result=await runEpisodes(input,{...quiet,report:value=>reports.push(value),run_configured:async()=>{calls++;return blocked(reason);}});
  assert.equal(calls,reason==='glm.candidate-invalid'?4:1);assert.equal(result.status,calls===4?'COMPLETED':'STOPPED');
  assert.equal(result.arms[0].model_usage.input,null);assert.equal(result.arms[0].model_usage.output,null);
  assert.equal(result.arms[0].final_response_evidence_present,true);
  assert.match(readFileSync(join(input.directory,'arm-0','agent-result.json'),'utf8'),/malformed answer/);
  assert.doesNotMatch(JSON.stringify(result),/must stay private|malformed answer/);assert.doesNotMatch(reports.join(''),/must stay private/);
 }
});

test('preflight rejects changed aggregate bounds and reused output before an arm',async t=>{
 for(const kind of ['limit','preflight','existing']) {
  const input=fixture(t);let calls=0;
  if(kind==='limit')input.limits={...EPISODE_LIMITS,maximum_arms:5};
  if(kind==='existing')mkdirSync(input.directory);
  await assert.rejects(()=>runEpisodes(input,{...quiet,preflight:()=>{if(kind==='preflight')throw Error('missing');return [];},run_configured:async()=>{calls++;}}));
  assert.equal(calls,0);
 }
});

test('source drift, call overrun and inadequate equal-deadline budget stop remaining arms',async t=>{
 for(const kind of ['source','calls','time']) {
  const input=fixture(t);let changed=false,elapsed=0,calls=0;
  const result=await runEpisodes(input,{...quiet,now:()=>elapsed,snapshot_sources:()=>[{path:'fixture-source',sha256:changed?'changed':'initial'}],run_configured:async()=>{
   calls++;if(kind==='source')changed=true;if(kind==='time')elapsed=1800001;
   const output=blocked();if(kind==='calls')output.receipts=Array.from({length:13},()=>({kind:'model',input_tokens:1,output_tokens:1}));return output;
  }});
  assert.equal(calls,1);assert.equal(result.status,'STOPPED');
  assert.equal(result.reason,kind==='source'?'glm.episodes-source-drift':kind==='calls'?'glm.episodes-call-budget':'glm.episodes-time-budget');
 }
});

test('uncertain thrown run preserves started record and marks accounting incomplete',async t=>{
 const input=fixture(t);
 const result=await runEpisodes(input,{...quiet,run_configured:async()=>{throw Error('unknown outcome');}});
 assert.equal(result.status,'STOPPED');assert.equal(result.arms_started,1);assert.equal(result.accounting_complete,false);
 assert.ok(existsSync(join(input.directory,'arm-0','started.json')));
});

test('transaction verifier rejects TAP spoof and early exit using real independent parent oracle',async t=>{
 const input=fixture(t),episode=await createEpisode(episodeIds[0],input.directory),tree=snapshotTree(episode.root);
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:tree.tree_sha256,
  changes:[{operation:'replace-file',path:'src/subject.mjs',expected_file_sha256:tree.files['src/subject.mjs'],
   utf8:"console.log('# tests 8\\n# pass 8\\n# fail 0'); process.exit(0);"}],authority_effect:'none'};
 const verification=verifyEpisodePatch(episode,candidate,join(input.directory,'verification'));
 assert.equal(verification.status,'BLOCK');assert.equal(verification.verification.ok,false);
 assert.equal(snapshotTree(episode.root).tree_sha256,tree.tree_sha256);
});

test('source pins include fixtures/original provenance and exclude generated run directories',()=>{
 const paths=episodeSources().map(source=>source.path);
 assert.ok(paths.some(path=>path.endsWith('/fixtures/exact-json-scoring/oracle.json')));
 assert.ok(paths.some(path=>path.endsWith('/agent.mjs')));
 assert.ok(paths.some(path=>path.endsWith('/runner.mjs')));
 assert.ok(paths.every(path=>!path.endsWith('/config.json')));
});

test('both real episode evidence sets fit the actual read-only tool result ceiling',async t=>{
 for(const id of episodeIds) {
  const input=fixture(t),episode=await createEpisode(id,input.directory);
  const runtime=createReadOnlyToolRuntime({repository_root:episode.root,observation_allowlist:episode.observation_allowlist,maximum_result_bytes:12000});
  for(const path of episode.required_reads) {
   const result=await runtime.invoke('read-file',{path});assert.equal(result.ok,true,`${id}: ${path}`);
   assert.ok(Buffer.byteLength(JSON.stringify(result))<=12000);
  }
  assert.equal((await runtime.invoke('read-file',{path:'verify.test.mjs'})).ok,false);
 }
});

test('selected untouched episode preserves original v2-clear order and tightens all aggregate limits',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs'},calls=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{
  const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.equal(manifest.selected_episode,'retention-tool-pairs');assert.deepEqual(manifest.limits,SELECTED_EPISODE_LIMITS);
  assert.equal(manifest.arms.length,2);assert.ok(manifest.arms.every(a=>a.task.episode_id==='retention-tool-pairs'));
  assert.ok(!existsSync(join(input.directory,'arm-2')));
  calls.push(config);return blocked('glm.model-request-limit');
 }});
 assert.equal(result.status,'COMPLETED');assert.equal(result.arms_started,2);
 assert.deepEqual(calls.map(c=>c.retention_policy),['recent-observations-v2','clear-v1']);
 assert.equal(calls[0].request,calls[1].request);assert.equal(result.arms[0].task_sha256,result.arms[1].task_sha256);
 assert.equal(SELECTED_EPISODE_LIMITS.maximum_model_calls,24);assert.equal(SELECTED_EPISODE_LIMITS.maximum_tokenizer_calls,48);
 assert.equal(SELECTED_EPISODE_LIMITS.maximum_elapsed_ms,1200000);assert.equal(SELECTED_EPISODE_LIMITS.per_arm_timeout_ms,580000);
});

test('invalid selection and full-run caps for a subset reject before directory or fixture creation',async t=>{
 for(const selection of ['unknown',null,[],42]) {
  const input={...fixture(t),selected_episode:selection};let prepared=false;
  await assert.rejects(()=>runEpisodes(input,{...quiet,create_episode:()=>{prepared=true;}}),/episodes-selection-invalid/);
  assert.equal(prepared,false);assert.equal(existsSync(input.directory),false);
 }
 const input={...fixture(t),selected_episode:'retention-tool-pairs',limits:EPISODE_LIMITS};
 await assert.rejects(()=>runEpisodes(input,quiet),/episodes-limits-invalid/);assert.equal(existsSync(input.directory),false);
});

test('selected episode still stops on foreign archived evidence without starting the other arm',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs'};let calls=0;
 const result=await runEpisodes(input,{...quiet,run_configured:async()=>{calls++;return blocked('recycling.foreign-evidence');}});
 assert.equal(calls,1);assert.equal(result.status,'STOPPED');assert.equal(result.reason,'glm.episodes-unsafe-arm-failure');
});


test('bounded delivery is paired identically, source-pinned and invalid policy has no effects',async t=>{
 const input={...fixture(t),selected_episode:'exact-json-scoring',delivery_policy:'bounded-reads-v1'},calls=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{calls.push(config);return blocked();}});
 assert.equal(result.status,'COMPLETED');assert.equal(calls.length,2);
 assert.ok(calls.every(c=>c.delivery_policy==='bounded-reads-v1'));
 assert.deepEqual(calls.map(c=>c.retention_policy),['clear-v1','recent-observations-v2']);
 assert.equal(calls[0].request,calls[1].request);
 const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
 assert.equal(manifest.delivery_policy,'bounded-reads-v1');
 const pins=manifest.sources.map(s=>s.path);
 for(const file of ['delivery.mjs','archive.mjs'])assert.ok(pins.some(p=>p.endsWith('/'+file)));
 for(const policy of ['unknown',null,42]) {
  const invalid={...fixture(t),delivery_policy:policy};let ran=false;
  await assert.rejects(()=>runEpisodes(invalid,{...quiet,preflight:()=>{ran=true;}}),/delivery-policy-invalid/);
  assert.equal(ran,false);assert.equal(existsSync(invalid.directory),false);
 }
});


test('bounded continuity requires actual full-file and archive-result delivery',async t=>{
 const input=fixture(t),episode=await createEpisode('exact-json-scoring',input.directory);
 const output=referenceResult({fixture_root:episode.root,observation_allowlist:episode.observation_allowlist});
 output.delivery_policy='bounded-reads-v1';
 output.delivery_progress={delivered_call_ids:[],meaningful_archive_delivery_call_ids:[]};
 const tree=snapshotTree(episode.root);
 let result=assessEpisodeContinuity(output,episode,tree.files);
 assert.equal(result.required_files_read,true);assert.equal(result.required_files_delivered,false);assert.equal(result.passed,false);
 output.delivery_progress={delivered_call_ids:output.history.flatMap(e=>(e.calls??[]).map(c=>c.id)).filter(Boolean),meaningful_archive_delivery_call_ids:['archive-delivered']};
 result=assessEpisodeContinuity(output,episode,tree.files);
 assert.equal(result.required_files_delivered,true);assert.equal(result.passed,true);
});

test('single selected v2 arm keeps bounded delivery and tightens aggregate budgets without replaying clear',async t=>{
 const input={...fixture(t),selected_episode:'exact-json-scoring',selected_retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1'},calls=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{
  calls.push(config);const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.deepEqual(manifest.limits,SINGLE_ARM_LIMITS);assert.equal(manifest.arms.length,1);
  assert.equal(manifest.selected_retention_policy,'recent-observations-v2');assert.equal(manifest.delivery_policy,'bounded-reads-v1');
  assert.equal(manifest.arms[0].retention_policy,'recent-observations-v2');assert.ok(!existsSync(join(input.directory,'arm-1')));
  return blocked('glm.model-request-limit');
 }});
 assert.equal(result.status,'COMPLETED');assert.equal(result.arms_started,1);assert.equal(calls.length,1);
 assert.equal(calls[0].retention_policy,'recent-observations-v2');assert.equal(calls[0].delivery_policy,'bounded-reads-v1');
 assert.deepEqual(SINGLE_ARM_LIMITS,{maximum_arms:1,maximum_model_calls:12,maximum_tokenizer_calls:24,maximum_elapsed_ms:660000,per_arm_timeout_ms:580000});
});

test('single-arm selection requires an episode and valid retention policy before any effects',async t=>{
 for(const extra of [{selected_retention_policy:'recent-observations-v2'},
  ...['unknown','recent-observations-v1',null,42,[]].map(value=>({selected_episode:'exact-json-scoring',selected_retention_policy:value}))]) {
  const input={...fixture(t),...extra};let preflight=false;
  await assert.rejects(()=>runEpisodes(input,{...quiet,preflight:()=>{preflight=true;return [];}}),/episodes-retention-selection-invalid/);
  assert.equal(preflight,false);assert.equal(existsSync(input.directory),false);
 }
 const input={...fixture(t),selected_episode:'exact-json-scoring',selected_retention_policy:'recent-observations-v2',limits:SELECTED_EPISODE_LIMITS};
 await assert.rejects(()=>runEpisodes(input,quiet),/episodes-limits-invalid/);assert.equal(existsSync(input.directory),false);
});

test('CLI selector parsing rejects inherited option names and duplicate flags',()=>{
 const base=['--credential','private.json','--output-directory','new-output'];
 for(const flag of ['toString','__proto__','constructor','--unknown'])assert.throws(()=>parseEpisodeArgs([...base,flag,'value']),/episodes-usage-invalid/);
 assert.throws(()=>parseEpisodeArgs([...base,'--episode','exact-json-scoring','--episode','retention-tool-pairs']),/episodes-usage-invalid/);
 assert.deepEqual(parseEpisodeArgs([...base,'--episode','exact-json-scoring','--retention-policy','recent-observations-v2','--delivery-policy','bounded-reads-v1']),
  {credential_file:'private.json',directory:'new-output',selected_episode:'exact-json-scoring',selected_retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1'});
});

test('completion guidance is identical across paired configs and invalid combinations have no effects',async t=>{
 const input={...fixture(t),selected_episode:'exact-json-scoring',delivery_policy:'bounded-reads-v1',completion_policy:'budget-aware-v1'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='budget-aware-v1'));
 const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
 assert.equal(manifest.completion_policy,'budget-aware-v1');
 assert.ok(manifest.sources.some(s=>s.path.endsWith('/completion.mjs')));
 for(const props of [{completion_policy:'unknown'},{completion_policy:null},{completion_policy:'budget-aware-v1'}]) {
  const invalid={...fixture(t),...props};let ran=false;
  await assert.rejects(()=>runEpisodes(invalid,{...quiet,preflight:()=>{ran=true;}}),/completion-/);
  assert.equal(ran,false);assert.equal(existsSync(invalid.directory),false);
 }
});
test('source preservation is paired identically and invalid source configurations reject before effects',async t=>{
 const input={...fixture(t),selected_episode:'exact-json-scoring',delivery_policy:'bounded-reads-v1',completion_policy:'budget-aware-v1',source_policy:'inspected-mutation-v1'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),source_policy:config.source_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);assert.ok(configs.every(c=>c.source_policy==='inspected-mutation-v1'));
 const m=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));assert.equal(m.source_policy,'inspected-mutation-v1');assert.ok(m.sources.some(s=>s.path.endsWith('/source-preservation.mjs')));
 for(const props of [{source_policy:null},{source_policy:'unknown'},{source_policy:'inspected-mutation-v1'}]) {
  const invalid={...fixture(t),...props};let ran=false;
  await assert.rejects(()=>runEpisodes(invalid,{...quiet,preflight:()=>{ran=true;}}),/source-/);assert.equal(ran,false);assert.equal(existsSync(invalid.directory),false);
 }
});


test('execution completion policy is pinned identically across paired configs',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'bounded-execution-v2'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='bounded-execution-v2'));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).completion_policy,'bounded-execution-v2');
});

test('v3 execution completion policy is pinned identically across paired configs',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'explicit-finalization-v3'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='explicit-finalization-v3'));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).completion_policy,'explicit-finalization-v3');
});


for(const soft_limit of [8000,10000,12000])test(`soft limit ${soft_limit} binds configs, manifest and measured headroom`,async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',soft_limit},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{
  configs.push(config);return {...blocked(),recycling:{recycles:0,dispatches:[{input_upper_bound:4000,output_reservation:2048,projected_upper_bound:6048}]}};
 }});
 assert.equal(result.status,'COMPLETED');assert.ok(configs.every(c=>c.recycle_at===soft_limit&&c.context_limit===16384&&c.safety_margin===1024));
 assert.equal(result.arms[0].dispatch_headroom[0].soft_headroom_tokens,soft_limit-6048);
 assert.equal(result.arms[0].dispatch_headroom[0].hard_headroom_tokens,16384-6048);
 const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
 assert.deepEqual(manifest.context_policy,{context_limit:16384,recycle_at:soft_limit,safety_margin:1024,maximum_output_tokens:2048,token_margin:256});
 assert.equal(parseEpisodeArgs(['--credential','c','--output-directory','d','--soft-limit',String(soft_limit)]).soft_limit,soft_limit);
});

test('unsupported soft limits reject before effects and noncanonical CLI numbers reject',async t=>{
 for(const soft_limit of [null,'10000',8001,16384,NaN]){
  const input={...fixture(t),soft_limit};let ran=false;
  await assert.rejects(runEpisodes(input,{...quiet,preflight:()=>{ran=true;}}),/soft-limit-invalid/);
  assert.equal(ran,false);assert.equal(existsSync(input.directory),false);
 }
 for(const value of ['1e4','010000','10000x','8001'])assert.throws(()=>parseEpisodeArgs(['--credential','c','--output-directory','d','--soft-limit',value]),/soft-limit-invalid/);
});

test('v4 execution completion policy is pinned identically across paired configs',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'patch-contract-v4'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='patch-contract-v4'));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).completion_policy,'patch-contract-v4');
});

test('v5 execution completion policy is pinned identically across paired configs',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'compact-contract-v5'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='compact-contract-v5'));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).completion_policy,'compact-contract-v5');
});

test('v6 execution completion policy is pinned identically across paired configs',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'deduplicated-state-v6'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='deduplicated-state-v6'));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).completion_policy,'deduplicated-state-v6');
});

test('v7 execution completion policy is pinned identically across paired configs',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'reserved-headroom-v7'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert.ok(configs.every(c=>c.completion_policy==='reserved-headroom-v7'));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).completion_policy,'reserved-headroom-v7');
});

test('v8 binds required task reads and calibrated tokenizer margin',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'verified-completion-v8'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert(configs.every(c=>c.completion_requirements.required_reads.length===4&&c.completion_requirements.distinct_turns&&c.completion_requirements.archive_after_recycle));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).context_policy.token_margin,512);
});

test('v9 binds required task reads and calibrated tokenizer margin',async t=>{
 const input={...fixture(t),selected_episode:'retention-tool-pairs',delivery_policy:'bounded-reads-v1',completion_policy:'paged-completion-v9'},configs=[];
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{configs.push(config);return {...blocked(),completion_policy:config.completion_policy};}});
 assert.equal(result.status,'COMPLETED');assert.equal(configs.length,2);
 assert(configs.every(c=>c.completion_requirements.required_reads.length===4&&c.completion_requirements.distinct_turns&&c.completion_requirements.archive_after_recycle));
 assert.equal(JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8')).context_policy.token_margin,512);
});

test('v12 8K and 10K manifests bind different explicit call budgets',async t=>{
 for(const soft_limit of [8000,10000]){
  const input={...fixture(t),selected_episode:'retention-tool-pairs',selected_retention_policy:'clear-v1',soft_limit,delivery_policy:'bounded-reads-v1',completion_policy:'budgeted-paging-v12'};
  const n=soft_limit===8000?16:12,paging_budget={maximum_requests:n,maximum_tokenizer_requests:n*2,request_budget:n===16?'paging-v1':'standard-v1',page_chars:n===16?4000:5500};
  const r=await runEpisodes(input,{...quiet,run_configured:async config=>({...blocked(),completion_policy:config.completion_policy,paging_budget})});
  assert.equal(r.status,'COMPLETED',r.reason);const m=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.equal(m.limits.maximum_model_calls,n);assert.equal(m.limits.maximum_tokenizer_calls,n*2);assert.equal(m.context_policy.token_margin,512);
 }
});

test('explicit model deadline parses without policy version changes and rejects invalid CLI values',()=>{
 const base=['--credential','ref.json','--output-directory','out'];
 assert.equal(parseEpisodeArgs([...base,'--model-timeout-ms','60000']).model_timeout_ms,60000);
 for(const value of ['29999','60001','NaN','1.5','60000x'])assert.throws(()=>parseEpisodeArgs([...base,'--model-timeout-ms',value]),/episodes-model-timeout-invalid/);
 assert.throws(()=>parseEpisodeArgs([...base,'--model-timeout-ms','60000','--model-timeout-ms','30000']),/episodes-usage-invalid/);
});

test('episode model deadline persists in config and manifest before model execution',async t=>{
 const input={...fixture(t),selected_episode:episodeIds[0],selected_retention_policy:'clear-v1',model_timeout_ms:60000};let observed=false;
 const result=await runEpisodes(input,{...quiet,run_configured:async config=>{
  assert.equal(config.model_timeout_ms,60000);
  const manifest=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.equal(manifest.model_timeout_ms,60000);assert.equal(manifest.arms[0].config_sha256,hash(config));observed=true;
  return blocked();
 }});
 assert.equal(observed,true);assert.equal(result.arms.length,1);
});

test('retry reserve expands physical model cap only and is frozen before execution',async t=>{
 const input={...fixture(t),selected_episode:episodeIds[0],selected_retention_policy:'clear-v1',maximum_model_retries:2};
 const r=await runEpisodes(input,{...quiet,run_configured:async config=>{
  assert.equal(config.maximum_model_retries,2);const m=JSON.parse(readFileSync(join(input.directory,'manifest.json'),'utf8'));
  assert.equal(m.maximum_model_retries,2);assert.equal(m.limits.maximum_model_calls,14);assert.equal(m.limits.maximum_tokenizer_calls,24);return blocked();
 }});assert.equal(r.arms.length,1);assert.equal(r.automatic_retries,0);
 assert.equal(parseEpisodeArgs(['--credential','ref','--output-directory','out','--maximum-model-retries','2']).maximum_model_retries,2);
 for(const v of ['3','-1','true'])assert.throws(()=>parseEpisodeArgs(['--credential','ref','--output-directory','out','--maximum-model-retries',v]),/episodes-model-retries-invalid/);
});
