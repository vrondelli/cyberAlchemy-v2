import {projectPagedFiles} from '../../packages/coding-agent-runtime/glm-flash-v1/paging.mjs';
import {accessSync,constants,closeSync,cpSync,fsyncSync,mkdirSync,openSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodeIds,availableEpisodeIds,createEpisode,verifyEpisodeCandidate} from './episodes.mjs';
import {parseCredential,parseConfig,runConfiguredGlm} from '../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {runtimeSources} from '../../packages/coding-agent-runtime/glm-flash-v1/paired-canary.mjs';
import {validateSourcePolicy} from '../../packages/coding-agent-runtime/glm-flash-v1/source-preservation.mjs';
import {completionBudget,validateCompletionPolicy,completionTokenMargin} from '../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs';
import {validateDeliveryPolicy} from '../../packages/coding-agent-runtime/glm-flash-v1/delivery.mjs';
import {createGlmClient,MODEL,hash,need,GlmError} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {runTransactionalPatchSet} from '../../packages/coding-agent-runtime/patch-set-runtime.mjs';
import {snapshotTree} from '../../packages/coding-agent-runtime/verifier.mjs';

export const EPISODE_LIMITS=Object.freeze({maximum_arms:4,maximum_model_calls:48,maximum_tokenizer_calls:96,maximum_elapsed_ms:2400000,per_arm_timeout_ms:580000});
export const SELECTED_EPISODE_LIMITS=Object.freeze({maximum_arms:2,maximum_model_calls:24,maximum_tokenizer_calls:48,maximum_elapsed_ms:1200000,per_arm_timeout_ms:580000});
export const SINGLE_ARM_LIMITS=Object.freeze({maximum_arms:1,maximum_model_calls:12,maximum_tokenizer_calls:24,maximum_elapsed_ms:660000,per_arm_timeout_ms:580000});
const defaultContextPolicy=Object.freeze({context_limit:16384,recycle_at:8000,safety_margin:1024,maximum_output_tokens:2048,token_margin:256});
const ordinary=new Set(['glm.model-request-limit','glm.tokenizer-limit','glm.tool-call-limit','glm.run-deadline-exceeded',
 'glm.candidate-invalid','glm.candidate-scope-invalid','glm.incomplete-output','glm.tool-result-too-large','glm.request-too-large','recycling.fresh-context-too-large']);

function persist(path,value) {
 const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
 const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}
}
function filesUnder(root,accept) {
 const files=[];
 for(const item of readdirSync(root,{withFileTypes:true})) {
  const path=join(root,item.name);
  if(item.isDirectory()&&item.name!=='__pycache__')files.push(...filesUnder(path,accept));
  else if(item.isFile()&&accept(item.name))files.push({path,sha256:hash(readFileSync(path,'utf8'))});
 }
 return files.sort((a,b)=>a.path.localeCompare(b.path));
}
export function episodeSources() {
 const local=dirname(fileURLToPath(import.meta.url));
 const fixtureSources=filesUnder(join(local,'fixtures'),()=>true);
 const originals=fixtureSources.filter(source=>source.path.endsWith('/provenance.json')).map(source=>{
  const provenance=JSON.parse(readFileSync(source.path,'utf8'));
  const path=resolve(local,'../../../..',provenance.source_path);return {path,sha256:hash(readFileSync(path,'utf8'))};
 });
 const localSources=['episodes.mjs','runner.mjs'].map(name=>({path:join(local,name),sha256:hash(readFileSync(join(local,name),'utf8'))}));
 return [...new Map([...runtimeSources(),...localSources,...fixtureSources,...originals].map(source=>[source.path,source])).values()]
  .sort((a,b)=>a.path.localeCompare(b.path));
}
const loadedSources=episodeSources();
function preflightBridge(credential) {
 need(process.versions.node==='26.8.1','episodes-node-version');
 need(credential.python_command&&credential.project_root,'episodes-explicit-bridge-required');
 accessSync(credential.python_command,constants.X_OK);
 accessSync(join(credential.project_root,'secret_management','bridge.py'),constants.R_OK);
 return filesUnder(join(credential.project_root,'secret_management'),name=>name.endsWith('.py'));
}

function taskIdentity(episode) {
 const tree=snapshotTree(episode.root);
 need(Array.isArray(episode.required_reads)&&episode.required_reads.length>=2
  &&episode.required_reads.every(path=>episode.observation_allowlist.includes(path)&&tree.files[path]),'episodes-required-reads-invalid');
 need(Number.isSafeInteger(episode.verification?.expected_tests)&&episode.verification.expected_tests>0,'episodes-oracle-invalid');
 need(!episode.observation_allowlist.includes(episode.verification.test_path),'episodes-oracle-visible');
 return {episode_id:episode.id,request_sha256:hash(episode.request),fixture_tree_sha256:tree.tree_sha256,fixture_files:tree.files,
  observation_allowlist:episode.observation_allowlist,mutation_allowlist:episode.mutation_allowlist,required_reads:episode.required_reads,
  verification:episode.verification,provenance:episode.provenance};
}

export function assessEpisodeContinuity(output,episode,fixtureFiles) {
 const history=output.history??[],dispatches=output.recycling?.dispatches??[],reads=[],first=new Map();
 let evidenceAfterRecycle=false;
 const delivered=new Set(output.delivery_progress?.delivered_call_ids??[]),deliveredFiles=new Set();
 for(const [turn,entry] of history.entries())for(const [index,call] of (entry.calls??[]).entries()) {
  const observation=entry.observations?.[index],path=call.arguments?.path;
  if(call.name==='read-file') {
   const success=observation?.ok===true&&observation.output?.path===path&&typeof observation.output?.utf8==='string'
    &&observation.output.sha256===fixtureFiles[path]&&hash(observation.output.utf8)===fixtureFiles[path];
   reads.push({path,turn:turn+1,success});if(success&&!first.has(path))first.set(path,turn+1);
   if(success&&delivered.has(call.id))deliveredFiles.add(path);
  }
  if(call.name==='read-context-evidence'&&dispatches[turn]?.generation>0&&observation?.ok===true
   &&/^[a-f0-9]{64}$/.test(call.arguments?.digest)&&observation.output?.digest===call.arguments.digest)evidenceAfterRecycle=true;
 }
 if(['paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(output.completion_policy))for(const f of projectPagedFiles(history,fixtureFiles,delivered,['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(output.completion_policy)?output.paging_budget.page_chars:['compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(output.completion_policy)?5500:5000)){if(f.read_complete)first.set(f.path,f.first_turn+1);if(f.full_file_delivered)deliveredFiles.add(f.path);}
 const deliveryAware=output.delivery_policy==='bounded-reads-v1';
 if(deliveryAware)evidenceAfterRecycle=(output.delivery_progress?.meaningful_archive_delivery_call_ids??[]).length>0;
 const requiredDelivered=deliveryAware?episode.required_reads.every(path=>deliveredFiles.has(path)):null;
 const requiredRead=episode.required_reads.every(path=>first.has(path));
 const distinctTurns=requiredRead&&new Set(episode.required_reads.map(path=>first.get(path))).size===episode.required_reads.length;
 const recycled=(output.recycling?.recycles??0)>0,after=dispatches.some(d=>d.generation>0);
 return {required_files_read:requiredRead,required_reads_on_distinct_turns:distinctTurns,recycled,dispatched_after_recycle:after,
  archived_read_after_recycle:evidenceAfterRecycle,required_files_delivered:requiredDelivered,passed:requiredRead&&distinctTurns&&recycled&&after&&evidenceAfterRecycle&&(!deliveryAware||requiredDelivered),
  read_counts:{attempts:reads.length,successful:reads.filter(r=>r.success).length,unique_paths:first.size,
   by_path:Object.fromEntries([...new Set(reads.map(r=>r.path))].map(path=>[path,reads.filter(r=>r.path===path).length]))}};
}

export function verifyEpisodePatch(episode,candidate,destination,{verify_episode=verifyEpisodeCandidate}={}) {
 cpSync(episode.root,destination,{recursive:true});
 const command=['trusted-episode-oracle',episode.id];
 return runTransactionalPatchSet({run_id:'episode-verification',fixture_root:destination,raw_candidate:candidate,
  mutation_allowlist:episode.mutation_allowlist,approve:true,verification_command:command,
  verification_sandbox:{run(actual) {
   if(hash(actual)!==hash(command))return {ok:false,reason_codes:['episodes.oracle-command-invalid']};
   // The trusted parent oracle compares child-produced values. Candidate code
   // never runs in the oracle process; TAP text/exit 0 is not a passing result.
   const result=verify_episode(episode.id,destination);
   const ok=result.ok===true&&result.passed===episode.verification.expected_tests&&result.expected_tests===episode.verification.expected_tests;
   return {...result,ok,reason_codes:ok?[]:['episodes.oracle-failed'],authority_effect:'none'};
  }}});
}

// These dependencies are trusted test seams, never CLI or model-supplied data.
export async function runEpisodes({directory,credential,limits,selected_episode,selected_retention_policy,delivery_policy,completion_policy,source_policy,soft_limit=8000,model_timeout_ms,maximum_model_retries=0},
 {run_configured=runConfiguredGlm,create_client=createGlmClient,create_episode=createEpisode,episode_ids=availableEpisodeIds,
  verify_patch=verifyEpisodePatch,snapshot_sources=episodeSources,preflight=preflightBridge,now=Date.now,report=console.log}={}) {
 need(Number.isSafeInteger(maximum_model_retries)&&maximum_model_retries>=0&&maximum_model_retries<=2,'episodes-model-retries-invalid');
 need([8000,10000,12000].includes(soft_limit),'episodes-soft-limit-invalid');
 need(model_timeout_ms===undefined||(Number.isSafeInteger(model_timeout_ms)&&model_timeout_ms>=30000&&model_timeout_ms<=60000),'episodes-model-timeout-invalid');
 const contextPolicy=Object.freeze({...defaultContextPolicy,recycle_at:soft_limit,token_margin:completionTokenMargin(completion_policy)});
 const selected=parseCredential(credential);
 const deliveryPolicy=validateDeliveryPolicy(delivery_policy);
 const completionPolicy=validateCompletionPolicy(completion_policy);
 const sourcePolicy=validateSourcePolicy(source_policy);
 need(sourcePolicy==='none'||deliveryPolicy==='bounded-reads-v1','source-requires-bounded-delivery');
 need(completionPolicy==='none'||deliveryPolicy==='bounded-reads-v1','completion-requires-bounded-delivery');
 need(typeof directory==='string'&&directory.length>0,'episodes-directory-required');
 need(episode_ids===availableEpisodeIds||(Array.isArray(episode_ids)&&episode_ids.length===2&&new Set(episode_ids).size===2),'episodes-two-required');
 need(selected_episode===undefined||(typeof selected_episode==='string'&&episode_ids.includes(selected_episode)),'episodes-selection-invalid');
 need(selected_retention_policy===undefined||(selected_episode!==undefined&&['clear-v1','recent-observations-v2'].includes(selected_retention_policy)),'episodes-retention-selection-invalid');
 const baseLimits=selected_retention_policy!==undefined?SINGLE_ARM_LIMITS:selected_episode===undefined?EPISODE_LIMITS:SELECTED_EPISODE_LIMITS;
 const runBudget=completionBudget(completionPolicy,soft_limit);
 const policyLimits=['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionPolicy)?Object.freeze({...baseLimits,maximum_model_calls:baseLimits.maximum_arms*runBudget.maximum_requests,maximum_tokenizer_calls:baseLimits.maximum_arms*runBudget.maximum_tokenizer_requests}):baseLimits;
 const expectedLimits=maximum_model_retries?Object.freeze({...policyLimits,maximum_model_calls:policyLimits.maximum_model_calls+baseLimits.maximum_arms*maximum_model_retries}):policyLimits;
 if(limits===undefined)limits=expectedLimits;
 need(hash(limits)===hash(expectedLimits),'episodes-limits-invalid');
 const sources=snapshot_sources(),bridgeSources=preflight(selected);
 if(snapshot_sources===episodeSources)need(hash(sources)===hash(loadedSources),'episodes-source-drift');
 const dir=resolve(directory);mkdirSync(dir,{mode:0o700});
 const prepared=[];
 for(const [episodeIndex,id] of (selected_episode===undefined?episode_ids.slice(0,2):episode_ids).entries()) {
  if(selected_episode!==undefined&&id!==selected_episode)continue;
  const policies=episodeIndex===0?['clear-v1','recent-observations-v2']:['recent-observations-v2','clear-v1'];
  let pairIdentity;
  for(const retention_policy of policies) {
   if(selected_retention_policy!==undefined&&retention_policy!==selected_retention_policy)continue;
   const index=prepared.length,armDirectory=join(dir,`arm-${index}`);mkdirSync(armDirectory,{mode:0o700});
   const episode=await create_episode(id,armDirectory);need(episode.id===id,'episodes-id-drift');
   if(deliveryPolicy==='bounded-reads-v1')episode.request=episode.request.replace('successfully call read-context-evidence once','successfully call read-context-evidence or read-inspection-evidence once');
   const task=taskIdentity(episode);
   if(pairIdentity)need(hash(task)===hash(pairIdentity),'episodes-pair-task-drift');else pairIdentity=task;
   const config=parseConfig({schema_version:'are.glm-flash-config/v1',model:MODEL,credential:selected,run_id:`episode-${index}-${id}`,...(model_timeout_ms===undefined?{}:{model_timeout_ms}),...(maximum_model_retries?{maximum_model_retries}:{}),
    ...(['verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionPolicy)?{completion_requirements:{required_reads:episode.required_reads,distinct_turns:true,archive_after_recycle:true}}:{}),
    request:episode.request,fixture_root:episode.root,state_directory:join(armDirectory,'state'),
    observation_allowlist:episode.observation_allowlist,mutation_allowlist:episode.mutation_allowlist,
    context_limit:contextPolicy.context_limit,recycle_at:contextPolicy.recycle_at,safety_margin:contextPolicy.safety_margin,retention_policy,...(delivery_policy===undefined?{}:{delivery_policy:deliveryPolicy}),...(completion_policy===undefined?{}:{completion_policy:completionPolicy}),...(source_policy===undefined?{}:{source_policy:sourcePolicy})});
   persist(join(armDirectory,'config.json'),config);prepared.push({index,episode,task,config,directory:armDirectory});
  }
 }
 const started=now(),arms=[];
 const manifest={schema_version:'are.glm-episodes-manifest/v1',model:MODEL,...(model_timeout_ms===undefined?{}:{model_timeout_ms}),...(maximum_model_retries?{maximum_model_retries}:{}),selected_episode:selected_episode??null,selected_retention_policy:selected_retention_policy??null,delivery_policy:deliveryPolicy,completion_policy:completionPolicy,source_policy:sourcePolicy,limits,context_policy:contextPolicy,sources,bridge_sources:bridgeSources,
  node_version:process.versions.node,started_at:new Date(started).toISOString(),credential_reference_sha256:hash(selected),
  arms:prepared.map(({index,task,config})=>({index,task,retention_policy:config.retention_policy,config_sha256:hash(config)})),
  authority_effect:'none',...(maximum_model_retries?{maximum_model_retries}:{automatic_retries:0}),open_questions:['Two controlled source-derived episodes do not establish general GLM improvement.','Provider internal compaction is not observable here.']};
 persist(join(dir,'manifest.json'),manifest);
 let status='COMPLETED',reason=null,armsStarted=0;
 try {
  for(const arm of prepared) {
   need(hash(snapshot_sources())===hash(sources)&&hash(preflight(selected))===hash(bridgeSources),'episodes-source-drift');
   need(hash(taskIdentity(arm.episode))===hash(arm.task),'episodes-fixture-drift');
   need(limits.maximum_elapsed_ms-(now()-started)>=600000,'episodes-time-budget');
   need(arms.reduce((n,a)=>n+a.model_requests,0)+runBudget.maximum_requests+maximum_model_retries<=limits.maximum_model_calls
    &&arms.reduce((n,a)=>n+a.tokenizer_requests,0)+runBudget.maximum_tokenizer_requests<=limits.maximum_tokenizer_calls,'episodes-call-budget');
   persist(join(arm.directory,'started.json'),{index:arm.index,task_sha256:hash(arm.task),started_at:new Date(now()).toISOString(),timeout_ms:580000,authority_effect:'none'});
   armsStarted++;const armStarted=now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),580000);
   report(JSON.stringify({status:'RUNNING',index:arm.index,episode_id:arm.episode.id,retention_policy:arm.config.retention_policy,directory:arm.directory}));
   let output;
   try {output=await run_configured(arm.config,{create_client:options=>create_client({...options,maximum_requests:runBudget.maximum_requests,request_budget:runBudget.request_budget,maximum_output_tokens:2048,token_margin:contextPolicy.token_margin,
    signal:AbortSignal.any([options.signal,controller.signal].filter(Boolean))})});}finally{clearTimeout(timer);}
   persist(join(arm.directory,'agent-result.json'),output);
   const unchanged=snapshotTree(arm.episode.root).tree_sha256===arm.task.fixture_tree_sha256;
   const verification=unchanged&&output.status==='AWAITING_APPROVAL'?verify_patch(arm.episode,output.candidate,join(arm.directory,'verification')):null;
   const receipts=output.receipts??[],modelReceipts=receipts.filter(r=>r.kind==='model');
   const receipt={schema_version:'are.glm-episode-arm/v1',index:arm.index,episode_id:arm.episode.id,retention_policy:arm.config.retention_policy,delivery_policy:deliveryPolicy,completion_policy:completionPolicy,source_policy:sourcePolicy,delivery_progress:output.delivery_progress??null,
    directory:arm.directory,task_sha256:hash(arm.task),request_sha256:arm.task.request_sha256,fixture_tree_sha256:arm.task.fixture_tree_sha256,
    agent_status:output.status,reasons:output.reason_codes??[],patch_correct:verification?.status==='PATCH_CANDIDATE',verification,
    continuity:assessEpisodeContinuity(output,arm.episode,arm.task.fixture_files),original_fixture_unchanged:unchanged,
    model_requests:modelReceipts.length,...(maximum_model_retries?{automatic_retries:modelReceipts.filter(r=>r.attempt_index===1).length}:{}),tokenizer_requests:receipts.filter(r=>r.kind==='tokenizer').length,
    model_usage:{input:modelReceipts.every(r=>Number.isSafeInteger(r.input_tokens))?modelReceipts.reduce((n,r)=>n+r.input_tokens,0):null,
     output:modelReceipts.every(r=>Number.isSafeInteger(r.output_tokens))?modelReceipts.reduce((n,r)=>n+r.output_tokens,0):null},
    elapsed_ms:now()-armStarted,recycles:output.recycling?.recycles??0,
    dispatch_headroom:(output.recycling?.dispatches??[]).map(d=>({...d,soft_headroom_tokens:contextPolicy.recycle_at-d.projected_upper_bound,hard_headroom_tokens:contextPolicy.context_limit-d.projected_upper_bound})),
    final_response_evidence_present:output.final_response_evidence!=null,agent_result_sha256:hash(output),authority_effect:'none'};
   persist(join(arm.directory,'completed.json'),receipt);arms.push(receipt);
   report(JSON.stringify({status:'ARM_COMPLETED',index:arm.index,patch_correct:receipt.patch_correct,continuity:receipt.continuity.passed,
    model_requests:receipt.model_requests,tokenizer_requests:receipt.tokenizer_requests}));
   need(unchanged,'episodes-fixture-drift');
   need(hash(snapshot_sources())===hash(sources)&&hash(preflight(selected))===hash(bridgeSources),'episodes-source-drift');
   need(receipt.model_requests<=runBudget.maximum_requests+maximum_model_retries&&receipt.tokenizer_requests<=runBudget.maximum_tokenizer_requests,'episodes-call-budget');
   need(now()-started<=limits.maximum_elapsed_ms,'episodes-time-budget');
   need(output.status==='AWAITING_APPROVAL'||(output.status==='BLOCK'&&receipt.reasons.length>0&&receipt.reasons.every(code=>ordinary.has(code))),'episodes-unsafe-arm-failure');
   need(verification?.status!=='EFFECT_AMBIGUOUS','episodes-verification-uncertain');
  }
 }catch(error){status='STOPPED';reason=error instanceof GlmError?error.message:'glm.episodes-execution-failed';}
 const result={schema_version:'are.glm-episodes-result/v1',status,reason,directory:dir,manifest_sha256:hash(manifest),arms,arms_started:armsStarted,
  accounting_complete:armsStarted===arms.length,model_requests:arms.reduce((n,a)=>n+a.model_requests,0),tokenizer_requests:arms.reduce((n,a)=>n+a.tokenizer_requests,0),
  elapsed_ms:now()-started,authority_effect:'none',automatic_retries:armsStarted===arms.length?arms.reduce((n,a)=>n+(a.automatic_retries??0),0):null,product_approval:'not-requested',open_questions:manifest.open_questions};
 persist(join(dir,'result.json'),result);report(JSON.stringify({status,reason,directory:dir,arms_completed:arms.length}));return result;
}

export function parseEpisodeArgs(args) {
  need([4,6,8,10,12,14,16,18,20].includes(args.length)&&args[0]==='--credential'&&args[2]==='--output-directory','episodes-usage-invalid');
  const selection={};
  for(let i=4;i<args.length;i+=2) {
   const key={'--episode':'selected_episode','--delivery-policy':'delivery_policy','--retention-policy':'selected_retention_policy','--completion-policy':'completion_policy','--source-policy':'source_policy','--soft-limit':'soft_limit','--model-timeout-ms':'model_timeout_ms','--maximum-model-retries':'maximum_model_retries'}[args[i]];
   need(typeof key==='string'&&!Object.hasOwn(selection,key),'episodes-usage-invalid');if(key==='soft_limit'){need(/^(8000|10000|12000)$/.test(args[i+1]),'episodes-soft-limit-invalid');selection[key]=Number(args[i+1]);}else if(key==='model_timeout_ms'){need(/^\d+$/.test(args[i+1])&&Number(args[i+1])>=30000&&Number(args[i+1])<=60000,'episodes-model-timeout-invalid');selection[key]=Number(args[i+1]);}else if(key==='maximum_model_retries'){need(/^[012]$/.test(args[i+1]),'episodes-model-retries-invalid');selection[key]=Number(args[i+1]);}else selection[key]=args[i+1];
  }
  return {credential_file:args[1],directory:args[3],...selection};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  const {credential_file,...selection}=parseEpisodeArgs(process.argv.slice(2));
  const result=await runEpisodes({credential:JSON.parse(readFileSync(resolve(credential_file),'utf8')),...selection});process.exitCode=result.status==='COMPLETED'?0:1;
 }catch{console.error('Episode runner failed; inspect the selected private output directory.');process.exitCode=1;}
}
