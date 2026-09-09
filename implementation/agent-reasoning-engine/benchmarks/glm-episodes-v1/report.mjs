import {readFile,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export const reportHash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const check=(ok,code)=>{if(!ok)throw new Error(`report.${code}`);};
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const sourceOf=x=>Object.hasOwn(x,'source_policy')?x.source_policy:'none';
const completionOf=x=>Object.hasOwn(x,'completion_policy')?x.completion_policy:'none';
const retryBudget=config=>config.maximum_model_retries??0;
const runBudget=config=>['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(config))&&config.recycle_at<=8000?16:12;
const digest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const equal=(a,b,code)=>check(isDeepStrictEqual(a,b),code);
async function load(path,optional=false){
 let st;try{st=await lstat(path);}catch(e){if(optional&&e.code==='ENOENT')return null;throw new Error('report.missing-artifact');}
 check(st.isFile()&&!st.isSymbolicLink()&&st.size<=32*1024*1024,'artifact-shape');
 try{return JSON.parse(await readFile(path,'utf8'));}catch{throw new Error('report.invalid-json');}
}
function selfDigest(record){const {result_digest,...body}=record;check(digest(result_digest)&&reportHash(body)===result_digest,'self-digest-mismatch');}
function usage(receipts){
 const model=receipts.filter(r=>r.kind==='model'),tokenizer=receipts.filter(r=>r.kind==='tokenizer');
 const total=key=>model.every(r=>integer(r[key]))?model.reduce((n,r)=>n+r[key],0):null;
 return {model_attempts:model.length,tokenizer_attempts:tokenizer.length,input_tokens:total('input_tokens'),output_tokens:total('output_tokens'),
  known_input_tokens:model.reduce((n,r)=>n+(integer(r.input_tokens)?r.input_tokens:0),0),known_output_tokens:model.reduce((n,r)=>n+(integer(r.output_tokens)?r.output_tokens:0),0),
  endpoint_failures:receipts.filter(r=>r.status!==200).map(r=>({kind:r.kind,status:r.status??null,provider_code:/^\d{3,6}$/.test(String(r.provider_code))?String(r.provider_code):null,dispatched:r.dispatched===true}))};
}
function checkAgent(agent,config){
 check(agent?.schema_version==='are.glm-agent-result/v1'&&agent.authority_effect==='none','agent-schema');selfDigest(agent);
 equal(agent.run_id,config.run_id,'agent-run-id');equal(agent.model,config.model,'agent-model');equal(agent.retention_policy,config.retention_policy,'agent-policy');
 equal(sourceOf(agent),sourceOf(config),'agent-source-policy');equal(agent.delivery_policy??'legacy-v1',config.delivery_policy??'legacy-v1','agent-delivery');equal(completionOf(agent),completionOf(config),'agent-completion');
 if(['reserved-headroom-v7','verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent))&&(agent.admission_policy||(agent.recycling?.dispatches??[]).length)){
  equal(agent.admission_policy,{configured_soft_limit:config.recycle_at,soft_headroom_reservation:256,effective_recycle_at:config.recycle_at-256},'admission-policy-mismatch');
  check((agent.recycling?.dispatches??[]).every(d=>integer(d.projected_upper_bound)&&d.projected_upper_bound<config.recycle_at-256),'admission-headroom-violation');
 }
 if(['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent)))equal(agent.paging_budget,{maximum_requests:runBudget(config),maximum_tokenizer_requests:runBudget(config)*2,request_budget:runBudget(config)===16?'paging-v1':'standard-v1',page_chars:config.recycle_at<=8000?4000:5500,...(['final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent))?{final_timeout_ms:60000,...(['native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent))?{native_submission:true,...(completionOf(agent)==='native-reasoning-v17'?{final_reasoning_effort:'high'}:{})}:{})}:{})},'paging-budget');
 check(integer(retryBudget(config))&&retryBudget(config)<=2,'retry-budget-invalid');
 check(Array.isArray(agent.receipts)&&agent.receipts.length<=runBudget(config)*3+retryBudget(config),'receipt-list');
 if(retryBudget(config)){
  let logical=0,retries=0,previous=null;
  for(const r of agent.receipts)if(r.kind==='model'){
   if(r.attempt_index===0){logical++;check(r.model_request_sequence===logical,'retry-sequence');}
   else {
    check(r.attempt_index===1&&previous?.attempt_index===0&&previous.retryable===true&&previous.dispatched===true
      &&r.model_request_sequence===logical&&r.request_sha256===previous.request_sha256,'retry-binding');
    check(['deadline-exceeded','request-failed','response-interrupted'].includes(previous.failure_code)||([500,502,503,504].includes(previous.status)&&[null,'500'].includes(previous.provider_code)),'retry-category');retries++;
   }
   check(r.automatic_retries===r.attempt_index,'retry-receipt');previous=r;
  }
  check(logical<=runBudget(config)&&retries<=retryBudget(config),'retry-budget');
  equal(agent.automatic_retry_permitted,true,'retry-policy');
 }

 if(Object.hasOwn(config,'model_timeout_ms')){
  check(integer(config.model_timeout_ms)&&config.model_timeout_ms>=30000&&config.model_timeout_ms<=60000,'model-timeout-invalid');
  check(agent.receipts.every(r=>r.kind==='tokenizer'?r.timeout_ms===30000:[config.model_timeout_ms,60000].includes(r.timeout_ms)),'model-timeout-receipt');
 }
 for(const r of agent.receipts)check(['model','tokenizer'].includes(r.kind)&&digest(r.request_sha256)&&(r.status===null||integer(r.status))&&typeof r.dispatched==='boolean'&&(r.automatic_retries===0||(retryBudget(config)>0&&r.kind==='model'&&r.automatic_retries===1)),'transport-receipt');
 const measured=usage(agent.receipts);check(measured.model_attempts<=runBudget(config)+retryBudget(config)&&measured.tokenizer_attempts<=runBudget(config)*2,'per-arm-call-cap');return measured;
}
// Independent page reconstruction for recorded v9 evidence; no runtime imports.
export function checkedPages(history,files,delivered,maximumChars=5000){
 const groups=new Map();
 for(const [turn,e] of history.entries())for(const [i,c] of (e.calls??[]).entries()){
  const obs=e.observations?.[i],o=obs?.output;if(c.name!=='read-file'||!obs?.ok||o?.paged!==true)continue;
  check(o.path===c.arguments.path&&o.sha256===files[o.path]&&typeof o.utf8==='string'&&o.page_sha256===reportHash(o.utf8)&&o.offset_unit==='utf16-code-units'&&integer(o.offset)&&integer(o.next_offset)&&integer(o.total_chars)&&o.offset===(c.arguments.offset??0)&&o.next_offset<=o.total_chars&&o.next_offset-o.offset===o.utf8.length&&o.utf8.length<=maximumChars&&(o.utf8.length>0||o.offset===o.total_chars)&&o.eof===(o.next_offset===o.total_chars),'page-range');
  const native=e.messages?.[0]?.tool_calls?.[i],msg=e.messages?.[i+1];let args;try{args=typeof native?.function?.arguments==='string'?JSON.parse(native.function.arguments):native?.function?.arguments;}catch{check(false,'page-native');}
  check(native?.id===c.id&&native?.function?.name==='read-file'&&stable(args)===stable(c.arguments)&&msg?.role==='tool'&&msg.tool_call_id===c.id&&msg.content===stable(obs),'page-native');
  if(!groups.has(o.path))groups.set(o.path,{path:o.path,sha:o.sha256,total:o.total_chars,turn:turn+1,pages:[]});
  const g=groups.get(o.path);check(g.total===o.total_chars,'page-total');g.pages.push({...o,delivered:delivered.has(c.id)});
 }
 const complete=(g,pages)=>{let text='';for(const p of pages.sort((a,b)=>a.offset-b.offset||a.next_offset-b.next_offset)){if(p.offset>text.length)continue;const overlap=Math.min(text.length-p.offset,p.utf8.length);check(text.slice(p.offset,p.offset+overlap)===p.utf8.slice(0,overlap),'page-overlap');text+=p.utf8.slice(overlap);}if(text.length!==g.total)return false;check(reportHash(text)===g.sha,'page-file-hash');return true;};
 return [...groups.values()].map(g=>({path:g.path,turn:g.turn,read:complete(g,[...g.pages]),delivered:complete(g,g.pages.filter(p=>p.delivered))}));
}
function continuity(agent,task){
 const history=agent.history??[],dispatches=agent.recycling?.dispatches??[],first=new Map(),deliveredFiles=new Set();
 check(Array.isArray(history)&&history.length<=(['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent))?16:12)&&Array.isArray(dispatches),'agent-history');
 const delivered=new Set(agent.delivery_progress?.delivered_call_ids??[]);let archived=false;
 for(const [turn,e]of history.entries())for(const [i,c]of(e.calls??[]).entries()){
  const o=e.observations?.[i],path=c.arguments?.path;
  if(c.name==='read-file'&&o?.ok===true&&o.output?.path===path&&typeof o.output?.utf8==='string'&&o.output.sha256===task.fixture_files[path]&&reportHash(o.output.utf8)===task.fixture_files[path]){if(!first.has(path))first.set(path,turn+1);if(delivered.has(c.id))deliveredFiles.add(path);}
  if(c.name==='read-context-evidence'&&dispatches[turn]?.generation>0&&o?.ok===true&&digest(c.arguments?.digest)&&o.output?.digest===c.arguments.digest)archived=true;
 }
 if(['paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent)))for(const f of checkedPages(history,task.fixture_files,delivered,['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent))?agent.paging_budget.page_chars:['compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionOf(agent))?5500:5000)){if(f.read)first.set(f.path,f.turn);if(f.delivered)deliveredFiles.add(f.path);}
 const bounded=agent.delivery_policy==='bounded-reads-v1';
 if(bounded)archived=(agent.delivery_progress?.meaningful_archive_delivery_call_ids??[]).length>0;
 const read=task.required_reads.every(p=>first.has(p)),distinct=read&&new Set(task.required_reads.map(p=>first.get(p))).size===task.required_reads.length;
 const deliveredAll=bounded?task.required_reads.every(p=>deliveredFiles.has(p)):null;
 const recycled=(agent.recycling?.recycles??0)>0,after=dispatches.some(d=>d.generation>0);
 return {required_files_read:read,required_reads_on_distinct_turns:distinct,required_files_delivered:deliveredAll,recycled,dispatched_after_recycle:after,archived_read_after_recycle:archived,passed:read&&distinct&&recycled&&after&&archived&&(!bounded||deliveredAll)};
}


function readActivity(agent,task){
 const files=new Map(),pages=new Map();
 for(const entry of agent.history??[])for(const [i,call]of(entry.calls??[]).entries()){
  const ok=entry.observations?.[i]?.ok===true;
  if(call.name==='read-file'){
   const path=task.observation_allowlist.includes(call.arguments?.path)?call.arguments.path:'outside-allowlist';
   const row=files.get(path)??{path,attempts:0,successful:0};row.attempts++;row.successful+=Number(ok);files.set(path,row);
  }
  if(['read-context-evidence','read-inspection-evidence'].includes(call.name)){
   const args=call.arguments??{},selector=call.name==='read-inspection-evidence'?{source_call_id:args.call_id}:{archive_digest:args.digest};
   const identity={tool:call.name,...selector,offset:args.offset??0,max_chars:args.max_chars??1024},key=stable(identity);
   const row=pages.get(key)??{...identity,attempts:0,successful:0};row.attempts++;row.successful+=Number(ok);pages.set(key,row);
  }
 }
 const progress=agent.delivery_progress;
 return {file_reads:[...files.values()],archive_pages:[...pages.values()],repeated_successful_file_reads:[...files.values()].reduce((n,r)=>n+Math.max(0,r.successful-1),0),
  repeated_successful_archive_pages:[...pages.values()].reduce((n,r)=>n+Math.max(0,r.successful-1),0),
  delivery_counts:progress?Object.fromEntries(['executed_read_call_ids','delivered_call_ids','delivery_unknown_call_ids','undelivered_call_ids','deferred_call_ids'].map(k=>[k.replace('_call_ids',''),Array.isArray(progress[k])?progress[k].length:0])):null};
}

/** Historical integrity report only. Never imports candidates, invokes tools,
 * reads credentials into output, or compares today's source to prior snapshots. */
export async function reportRun(directory){
 check(typeof directory==='string'&&directory.length>0,'directory-required');const root=resolve(directory);
 const manifest=await load(join(root,'manifest.json')),result=await load(join(root,'result.json'));
 check(manifest.schema_version==='are.glm-episodes-manifest/v1'&&result.schema_version==='are.glm-episodes-result/v1'&&manifest.authority_effect==='none'&&result.authority_effect==='none','run-schema');
 check(digest(result.manifest_sha256)&&result.manifest_sha256===reportHash(manifest),'manifest-digest-mismatch');
 check(Array.isArray(manifest.arms)&&manifest.arms.length>0&&manifest.arms.length<=4&&Array.isArray(result.arms),'arms-invalid');
 check(integer(result.arms_started)&&result.arms_started<=manifest.arms.length&&result.arms.length<=result.arms_started&&result.arms_started-result.arms.length<=1,'attempt-accounting');
 equal(result.accounting_complete,result.arms_started===result.arms.length,'accounting-complete-mismatch');
 check(['COMPLETED','STOPPED'].includes(result.status),'run-status');
 check(result.status!=='COMPLETED'||result.arms.length===manifest.arms.length,'incomplete-success');
 check(Array.isArray(manifest.sources)&&Array.isArray(manifest.bridge_sources)&&[...manifest.sources,...manifest.bridge_sources].every(s=>typeof s.path==='string'&&digest(s.sha256)),'source-provenance');
 check(manifest.limits&&['maximum_arms','maximum_model_calls','maximum_tokenizer_calls'].every(k=>integer(manifest.limits[k]))&&manifest.arms.length<=manifest.limits.maximum_arms,'manifest-call-caps');
 check(manifest.context_policy?.context_limit===16384&&[8000,10000,12000].includes(manifest.context_policy?.recycle_at)&&manifest.context_policy?.safety_margin===1024,'context-policy-invalid');
 const completionPolicy=completionOf(manifest);check(['none','budget-aware-v1','bounded-execution-v2','explicit-finalization-v3','patch-contract-v4','compact-contract-v5','deduplicated-state-v6','reserved-headroom-v7','verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionPolicy),'completion-policy-invalid');check(completionPolicy==='none'||manifest.delivery_policy==='bounded-reads-v1','completion-delivery-required');
 const sourcePolicy=sourceOf(manifest);check(['none','inspected-mutation-v1'].includes(sourcePolicy),'source-policy-invalid');check(sourcePolicy==='none'||manifest.delivery_policy==='bounded-reads-v1','source-delivery-required');
 const arms=[];let completedModels=0,completedTokenizers=0;
 for(const [index,planned]of manifest.arms.entries()){
  equal(planned.index,index,'planned-index');check(['clear-v1','recent-observations-v2'].includes(planned.retention_policy),'planned-policy');
  const task=planned.task;check(task&&typeof task.episode_id==='string'&&digest(task.request_sha256)&&digest(task.fixture_tree_sha256)&&Array.isArray(task.required_reads)&&task.required_reads.length>0&&task.fixture_files&&Object.values(task.fixture_files).every(digest),'task-provenance');
  const armDir=join(root,`arm-${index}`),config=await load(join(armDir,'config.json'));
  check(digest(planned.config_sha256)&&reportHash(config)===planned.config_sha256,'config-digest-mismatch');
  equal(reportHash(config.request),task.request_sha256,'request-digest-mismatch');equal(config.retention_policy,planned.retention_policy,'config-policy');
  equal(config.observation_allowlist,task.observation_allowlist,'config-observation-scope');equal(config.mutation_allowlist,task.mutation_allowlist,'config-mutation-scope');
  for(const key of ['context_limit','recycle_at','safety_margin'])equal(config[key],manifest.context_policy?.[key],'config-context-policy');
  equal(config.model_timeout_ms,manifest.model_timeout_ms,'config-model-timeout');
  equal(retryBudget(config),retryBudget(manifest),'config-model-retries');
  equal(sourceOf(config),sourcePolicy,'config-source-policy');equal(completionOf(config),completionPolicy,'config-completion');equal(config.model,manifest.model,'config-model');equal(config.delivery_policy??'legacy-v1',manifest.delivery_policy??'legacy-v1','config-delivery');
  const started=await load(join(armDir,'started.json'),true),completed=await load(join(armDir,'completed.json'),true),agent=await load(join(armDir,'agent-result.json'),true);
  equal(started!==null,index<result.arms_started,'started-accounting-mismatch');equal(completed!==null,index<result.arms.length,'completed-accounting-mismatch');
  if(started){equal(started.index,index,'started-index');equal(started.task_sha256,reportHash(task),'started-task-digest');}
  const basic={index,episode_id:task.episode_id,retention_policy:planned.retention_policy,delivery_policy:manifest.delivery_policy??'legacy-v1',completion_policy:completionPolicy,source_policy:sourcePolicy};
  if(!started){check(!agent,'unstarted-agent-artifact');arms.push({...basic,state:'unstarted'});continue;}
  if(!completed){const metrics=agent?checkAgent(agent,config):null;arms.push({...basic,state:'started-incomplete',recorded_metrics:metrics,verified_repair:null,continuity:null});continue;}
  check(agent,'completed-agent-missing');equal(completed,result.arms[index],'completed-result-mismatch');
  check(completed.schema_version==='are.glm-episode-arm/v1'&&completed.authority_effect==='none','completed-schema');
  equal(completed.index,index,'completed-index');equal(completed.episode_id,task.episode_id,'completed-episode');equal(completed.retention_policy,planned.retention_policy,'completed-policy');
  equal(sourceOf(completed),sourcePolicy,'completed-source-policy');equal(completionOf(completed),completionPolicy,'completed-completion');equal(completed.delivery_policy??'legacy-v1',manifest.delivery_policy??'legacy-v1','completed-delivery');equal(completed.task_sha256,reportHash(task),'completed-task-digest');
  equal(completed.request_sha256,task.request_sha256,'completed-request');equal(completed.fixture_tree_sha256,task.fixture_tree_sha256,'completed-fixture');
  equal(completed.agent_result_sha256,reportHash(agent),'agent-digest-mismatch');const metrics=checkAgent(agent,config);
  equal(completed.agent_status,agent.status,'agent-status');equal(completed.reasons,agent.reason_codes??[],'agent-reasons');
  if(retryBudget(config))equal(completed.automatic_retries,agent.receipts.filter(r=>r.kind==='model'&&r.attempt_index===1).length,'retry-accounting');
  equal(completed.model_requests,metrics.model_attempts,'model-accounting');equal(completed.tokenizer_requests,metrics.tokenizer_attempts,'tokenizer-accounting');
  equal(completed.model_usage,{input:metrics.input_tokens,output:metrics.output_tokens},'usage-accounting');completedModels+=metrics.model_attempts;completedTokenizers+=metrics.tokenizer_attempts;
  check((agent.history??[]).length<=metrics.model_attempts,'history-request-accounting');
  if(['native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionPolicy)&&agent.status==='AWAITING_APPROVAL'){
   const e=agent.history.at(-1),message=e?.messages?.[0],calls=message?.tool_calls;
   check(e.messages.length===1&&message.role==='assistant'&&!e.calls&&!e.observations&&calls?.length===1&&calls[0].type==='function'&&calls[0].function?.name==='submit_patch_candidate'&&e.receipt.finish_reason==='tool_calls','native-terminal-invalid');
   let candidate;try{candidate=JSON.parse(calls[0].function.arguments);}catch{check(false,'native-candidate-json');}
   equal(candidate,agent.candidate,'native-candidate-binding');
  }
  const c=continuity(agent,task);
  if(['verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(completionPolicy)){
   equal(config.completion_requirements,{required_reads:task.required_reads,distinct_turns:true,archive_after_recycle:true},'completion-requirements-task');
   equal(agent.completion_requirements,config.completion_requirements,'completion-requirements-agent');
   check(manifest.context_policy.token_margin===512&&manifest.context_policy.maximum_output_tokens===2048,'completion-margin-binding');
   if(agent.status==='AWAITING_APPROVAL'){
    check(c.required_files_read&&c.required_reads_on_distinct_turns&&c.required_files_delivered&&(!c.recycled||c.archived_read_after_recycle),'completion-gate-unsatisfied');
    equal(agent.completion_gate,{passed:true,missing_required_reads:[],distinct_read_turns:true,archive_recovery_required:c.recycled,archive_recovery_confirmed:c.archived_read_after_recycle},'completion-gate-mismatch');
   }
  }
  for(const [key,value]of Object.entries(c))if(key!=='required_files_delivered'||Object.hasOwn(completed.continuity,key))equal(completed.continuity[key],value,'continuity-mismatch');
  if(completed.verification)selfDigest(completed.verification);
  const verified=completed.verification?.status==='PATCH_CANDIDATE';equal(completed.patch_correct,verified,'repair-verification-mismatch');
  if(verified){const v=completed.verification.verification;check(agent.status==='AWAITING_APPROVAL'&&completed.original_fixture_unchanged===true&&v?.ok===true&&v.passed===task.verification.expected_tests&&v.expected_tests===task.verification.expected_tests&&Array.isArray(v.results)&&v.results.length===v.expected_tests&&v.results.every(r=>r.passed===true),'repair-verifier-invalid');
   equal(completed.verification.before_tree_sha256,task.fixture_tree_sha256,'verification-base');check(agent.candidate&&agent.candidate.expected_base_tree_sha256===task.fixture_tree_sha256,'candidate-base');equal(completed.verification.candidate_digest,reportHash(agent.candidate),'verification-candidate');
   check(Array.isArray(agent.candidate.changes)&&agent.candidate.changes.length>0&&agent.candidate.changes.every(c=>task.mutation_allowlist.includes(c.path)&&c.expected_file_sha256===task.fixture_files[c.path]),'candidate-file-scope');equal([...completed.verification.changed_paths].sort(),agent.candidate.changes.map(c=>c.path).sort(),'verification-changed-paths');
  }
  if(completed.dispatch_headroom!==undefined)equal(completed.dispatch_headroom,(agent.recycling?.dispatches??[]).map(d=>({...d,soft_headroom_tokens:manifest.context_policy.recycle_at-d.projected_upper_bound,hard_headroom_tokens:manifest.context_policy.context_limit-d.projected_upper_bound})),'dispatch-headroom-mismatch');
  arms.push({...basic,state:'completed',agent_status:agent.status,reasons:(agent.reason_codes??[]).map(r=>/^glm\.[a-z-]+$|^recycling\.[a-z-]+$/.test(r)?r:'unclassified-runtime-reason'),completion_gate:agent.completion_gate??null,admission_policy:agent.admission_policy??null,candidate_validation:agent.candidate_validation??null,verified_repair:verified,continuity:c,metrics,read_activity:readActivity(agent,task),elapsed_ms:completed.elapsed_ms});
 }
 check(completedModels<=manifest.limits.maximum_model_calls&&completedTokenizers<=manifest.limits.maximum_tokenizer_calls,'aggregate-call-cap');
 if(retryBudget(manifest))equal(result.automatic_retries,result.accounting_complete?result.arms.reduce((n,a)=>n+a.automatic_retries,0):null,'total-retry-accounting');
 equal(result.model_requests,completedModels,'total-model-accounting');equal(result.tokenizer_requests,completedTokenizers,'total-tokenizer-accounting');
 const finished=arms.filter(a=>a.state==='completed'),incomplete=arms.some(a=>a.state==='started-incomplete');
 const total=key=>incomplete||finished.some(a=>a.metrics[key]===null)?null:finished.reduce((n,a)=>n+a.metrics[key],0);
 const matched=manifest.arms.length===2&&finished.length===2&&manifest.arms[0].task.episode_id===manifest.arms[1].task.episode_id&&reportHash(manifest.arms[0].task)===reportHash(manifest.arms[1].task)&&new Set(manifest.arms.map(a=>a.retention_policy)).size===2;
 return {schema_version:'are.glm-episodes-report/v1',authority_effect:'none',manifest_sha256:result.manifest_sha256,status:result.status,context_policy:manifest.context_policy,...(manifest.model_timeout_ms===undefined?{}:{model_timeout_ms:manifest.model_timeout_ms}),...(retryBudget(manifest)?{maximum_model_retries:retryBudget(manifest)}:{}),
  planned:manifest.arms.length,attempted:result.arms_started,completed:finished.length,unstarted:manifest.arms.length-result.arms_started,accounting_complete:result.accounting_complete,
  recorded_verified_repairs:finished.filter(a=>a.verified_repair).length,recorded_continuity_passes:finished.filter(a=>a.continuity.passed).length,
  totals:{model_attempts:incomplete?null:completedModels,tokenizer_attempts:incomplete?null:completedTokenizers,known_completed_model_attempts:completedModels,known_completed_tokenizer_attempts:completedTokenizers,input_tokens:total('input_tokens'),output_tokens:total('output_tokens')},
  arms,comparison:{matched_single_pair:matched,winner:null,claim_limit:matched?'One recorded pair is exploratory; no reliable winner or general improvement established.':'Incomplete or differently scoped arms do not establish a matched policy comparison.'},
  provenance:{manifest_verified:true,completed_arm_hashes_verified:true,current_sources_checked:false,claim_limit:'Recorded integrity and consistency only; hashes are not signatures, and this report does not rerun the repair oracle. Continuity is not task completion or proof that every observation was delivered.'},open_questions:['Representative task coverage and repeatability remain unmeasured.','Provider internal compaction is not observable from these records.']};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{check(process.argv.length===3,'usage');console.log(JSON.stringify(await reportRun(process.argv[2]),null,2));}catch(e){console.error(/^report\.[a-z-]+$/.test(e.message)?e.message:'report.invalid-artifact');process.exitCode=1;}
}
