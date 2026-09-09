// Successor canary: the model reports semantic deltas; the host owns transitions.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessRequirementOperationFastPath,canonicalizeIntentJson,materializeRequirementSnapshot,REQUIREMENT_DELTA_INSTRUCTION,
  resolveRequirementOperationFromDelta} from '../../../request-intent-runtime/index.mjs';
import {digest,sealed,verifyDigest} from '../../../request-intent-runtime/src/canonical.mjs';
import {createAppServerRpcClient,spawnAppServerRpcTransport} from '../../../codex-app-server-wrapper/src/rpc-client.mjs';
import {validateAdversarialHoldout} from './run-fast-path-canary.mjs';

const directory=dirname(fileURLToPath(import.meta.url)),repositoryRoot=resolve(directory,'../../../../../../..');
const read=name=>JSON.parse(readFileSync(join(directory,name),'utf8')),sha=path=>createHash('sha256').update(readFileSync(join(repositoryRoot,path))).digest('hex');
const plan=read('../../plans/requirement-fast-path-canary-v2.json'),holdout=read('fast-path-adversarial-holdout-001.json');
const SOURCE_PATHS=Object.freeze([
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/index.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-change.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-patch.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-operation-fast-path.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/plans/requirement-fast-path-canary-v2.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/fast-path-adversarial-holdout-001.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/run-fast-path-canary-002.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/fast-path-canary-002.test.mjs']);
const closed=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>keys.includes(key));

function snapshotFor(item){return materializeRequirementSnapshot({consumer_ref:'fast-path-canary-002',scope_ref:`case:${item.id}`,objective_id:`objective:${item.id}`,
  objective_state_digest:digest({case_id:item.id,requirements:item.requirements}),requirements:item.requirements,source_refs:[`holdout:${holdout.dataset_id}`]});}
function promptFor(contract){return `${REQUIREMENT_DELTA_INSTRUCTION}\n\nINPUT ${canonicalizeIntentJson({snapshot:contract.snapshot,request:contract.request,request_ref:contract.request_ref})}`;}

export function buildFastPathCanaryManifest002(){
  if(!validateAdversarialHoldout(holdout))throw Error('fast-path-canary-002.holdout-invalid');
  const liveSchedule=holdout.cases.filter(item=>item.live_canary).map((item,index)=>({ordinal:index+1,case_id:item.id,
    expected_model_calls:item.expected_disposition==='fast-path'?0:1,prompt_digest:item.expected_disposition==='fast-path'?null:digest(promptFor({snapshot:snapshotFor(item),request:item.request,request_ref:`live-002:${item.id}`}))}));
  return sealed('are.requirement-fast-path-canary-manifest/v2',{experiment_id:'requirement-fast-path-canary-002',predecessor_manifest_digest:plan.predecessor_manifest_digest,
    counterevidence_result_digest:plan.counterevidence_result_digest,plan_ref:'../../plans/requirement-fast-path-canary-v2.json',plan_digest:digest(plan),
    dataset_ref:'fast-path-adversarial-holdout-001.json',dataset_digest:digest(holdout),
    schedule:holdout.cases.map((item,index)=>({ordinal:index+1,case_id:item.id})),live_schedule:liveSchedule,
    source_digests:Object.fromEntries(SOURCE_PATHS.map(path=>[path,sha(path)])),
    runtime:{node_version:'v26.8.1',binary_version:'codex-cli 0.153.1',model:'gpt-5.6-luna',effort:'low',cwd:repositoryRoot,
      approval_policy:'never',sandbox:'read-only',shell_tool:false,thread_start_timeout_ms:240000,completion_timeout_ms:300000},
    gates:{local_positive_recall:1,local_adversarial_false_admission_rate:0,local_exact_result_rate:1,
      live_route_accuracy:1,live_exact_result_rate:1,live_model_call_count:4,live_tool_event_count:0,host_transition_ownership_rate:1}},'manifest_digest');
}

export function verifyFastPathCanaryManifest002(value,currentSources=true){
  try{
    if(value?.schema_version!=='are.requirement-fast-path-canary-manifest/v2'||!verifyDigest(value,'manifest_digest')||value.plan_digest!==digest(plan)
      ||value.dataset_digest!==digest(holdout)||value.schedule.length!==24||value.live_schedule.length!==6||Object.keys(value.source_digests).length!==SOURCE_PATHS.length)return false;
    if(canonicalizeIntentJson(value.schedule)!==canonicalizeIntentJson(holdout.cases.map((item,index)=>({ordinal:index+1,case_id:item.id}))))return false;
    if(Object.keys(value.source_digests).some(path=>!SOURCE_PATHS.includes(path))||currentSources&&Object.entries(value.source_digests).some(([path,expected])=>sha(path)!==expected))return false;
    return value.predecessor_manifest_digest===plan.predecessor_manifest_digest&&value.counterevidence_result_digest===plan.counterevidence_result_digest;
  }catch{return false;}
}

export function runLocalCanary002(manifest=buildFastPathCanaryManifest002(),currentSources=true){
  if(!verifyFastPathCanaryManifest002(manifest,currentSources))throw Error('fast-path-canary-002.manifest-invalid');
  const rows=manifest.schedule.map(entry=>{const item=holdout.cases.find(candidate=>candidate.id===entry.case_id),snapshot=snapshotFor(item);
    const assessed=assessRequirementOperationFastPath({snapshot,request:item.request,request_ref:`local-002:${item.id}`}),observed=assessed.ok?assessed.value:null;
    const passed=assessed.ok&&observed.disposition===item.expected_disposition&&observed.operation===item.expected_operation
      &&(item.expected_disposition==='fallback-required'||canonicalizeIntentJson(observed.change.resulting_requirements)===canonicalizeIntentJson(item.expected_requirements));
    return {case_id:item.id,expected_disposition:item.expected_disposition,observed_disposition:observed?.disposition??null,passed};});
  const positives=rows.filter(row=>row.expected_disposition==='fast-path'),adversarial=rows.filter(row=>row.expected_disposition==='fallback-required');
  const summary={total:rows.length,passed:rows.filter(row=>row.passed).length,positive_recall:positives.filter(row=>row.observed_disposition==='fast-path').length/positives.length,
    adversarial_false_admission_rate:adversarial.filter(row=>row.observed_disposition==='fast-path').length/adversarial.length,exact_result_rate:rows.filter(row=>row.passed).length/rows.length,model_calls:0};
  const gates={positive_recall:summary.positive_recall===manifest.gates.local_positive_recall,
    adversarial_false_admission_rate:summary.adversarial_false_admission_rate===manifest.gates.local_adversarial_false_admission_rate,
    exact_result_rate:summary.exact_result_rate===manifest.gates.local_exact_result_rate};
  return sealed('are.requirement-fast-path-local-result/v2',{experiment_id:manifest.experiment_id,manifest_digest:manifest.manifest_digest,
    case_results:rows.map(({case_id,passed})=>({case_id,passed})),observations_digest:digest(rows),summary,gates,
    disposition:Object.values(gates).every(Boolean)?'candidate-supported':'revise-candidate'},'result_digest');
}

export function verifyLocalCanary002(value,manifest=buildFastPathCanaryManifest002(),currentSources=true){
  try{return value?.schema_version==='are.requirement-fast-path-local-result/v2'&&verifyDigest(value,'result_digest')&&value.manifest_digest===manifest.manifest_digest
    &&canonicalizeIntentJson(value)===canonicalizeIntentJson(runLocalCanary002(manifest,currentSources));}catch{return false;}
}

function parseDelta(output){
  const trimmed=output.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''),start=trimmed.indexOf('{'),end=trimmed.lastIndexOf('}');
  if(start<0||end<start)throw Error('fast-path-canary-002.model-json-missing');
  const parsed=JSON.parse(trimmed.slice(start,end+1));
  if(!closed(parsed,['posture','added','removed']))throw Error('fast-path-canary-002.model-delta-not-closed');
  return parsed;
}

export async function runLiveCanary002(manifest=buildFastPathCanaryManifest002()){
  if(!verifyFastPathCanaryManifest002(manifest))throw Error('fast-path-canary-002.manifest-invalid');
  const binary=execFileSync('codex',['--version'],{encoding:'utf8'}).trim();
  if(process.version!==manifest.runtime.node_version||binary!==manifest.runtime.binary_version)throw Error('fast-path-canary-002.runtime-version-mismatch');
  const observations=[];let client,current=null;
  try{
    client=createAppServerRpcClient({transport:spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio']}),
      thread_start_timeout_ms:manifest.runtime.thread_start_timeout_ms,completion_timeout_ms:manifest.runtime.completion_timeout_ms});
    client.events.on('notification',notification=>{if(!current)return;
      if(notification.method==='item/started'&&!['userMessage','agentMessage','reasoning'].includes(notification.params?.item?.type))current.tool_events++;
      if(notification.method==='thread/tokenUsage/updated')current.token_usage=notification.params?.tokenUsage??null;});
    await client.initialize({clientInfo:{name:'are-fast-path-canary-002',version:'0.2.0'},capabilities:{experimentalApi:true}});await client.notify('initialized');
    const models=await client.request('model/list',{}),model=models.data.find(item=>item.id===manifest.runtime.model||item.model===manifest.runtime.model);
    if(!model?.supportedReasoningEfforts?.some(item=>item.reasoningEffort===manifest.runtime.effort))throw Error('fast-path-canary-002.model-effort-unavailable');
    for(const entry of manifest.live_schedule){
      const item=holdout.cases.find(candidate=>candidate.id===entry.case_id),snapshot=snapshotFor(item);
      current={ordinal:entry.ordinal,case_id:item.id,expected_disposition:item.expected_disposition,observed_disposition:null,expected_model_calls:entry.expected_model_calls,
        model_calls:0,tool_events:0,token_usage:null,elapsed_ms:0,completion_status:null,raw_output_digest:null,parsed_delta:null,resulting_requirements:null,
        derived_transition:null,transition_owner:null,reason_codes:[],passed:false};
      const started=performance.now();
      const resolved=await resolveRequirementOperationFromDelta({snapshot,request:item.request,request_ref:`live-002:${item.id}`},async contract=>{
        current.model_calls++;const prompt=promptFor(contract);if(digest(prompt)!==entry.prompt_digest)throw Error('fast-path-canary-002.prompt-drift');
        const thread=await client.startThread({cwd:manifest.runtime.cwd,model:manifest.runtime.model,approvalPolicy:'never',sandbox:'read-only',ephemeral:true,
          config:{'features.shell_tool':false,'model_reasoning_effort':manifest.runtime.effort},baseInstructions:'Return only the requested JSON object. Do not use tools. The host derives workflow transitions; never return a transition field.'});
        if(thread.model!==manifest.runtime.model||thread.reasoningEffort!==manifest.runtime.effort)throw Error('fast-path-canary-002.observed-runtime-mismatch');
        const turn=await client.runTurn({threadId:thread.thread.id,model:manifest.runtime.model,effort:manifest.runtime.effort,input:[{type:'text',text:prompt}],
          approvalPolicy:'never',sandboxPolicy:{type:'readOnly'}});current.completion_status=turn.completed.turn.status;current.raw_output_digest=digest(turn.text);
        current.parsed_delta=parseDelta(turn.text);return current.parsed_delta;});
      current.elapsed_ms=Number((performance.now()-started).toFixed(3));
      const route=assessRequirementOperationFastPath({snapshot,request:item.request,request_ref:`live-002:${item.id}`});current.observed_disposition=route.ok?route.value.disposition:null;
      current.reason_codes=resolved.ok?[]:resolved.reason_codes;current.resulting_requirements=resolved.ok?resolved.value.change.resulting_requirements:null;
      current.derived_transition=resolved.ok?resolved.value.change.transition:null;current.transition_owner=resolved.ok?resolved.value.transition_owner:null;
      current.passed=resolved.ok&&current.observed_disposition===item.expected_disposition&&current.model_calls===entry.expected_model_calls&&current.tool_events===0
        &&current.transition_owner==='deterministic-host'&&canonicalizeIntentJson(current.resulting_requirements)===canonicalizeIntentJson(item.expected_requirements)
        &&(current.model_calls===0||current.completion_status==='completed');
      observations.push(current);console.log('PROGRESS '+JSON.stringify({completed:observations.length,total:manifest.live_schedule.length,case_id:item.id,passed:current.passed}));current=null;
    }
  }finally{await client?.close();}
  const summary={total:observations.length,passed:observations.filter(row=>row.passed).length,route_accuracy:observations.filter(row=>row.observed_disposition===row.expected_disposition).length/observations.length,
    exact_result_rate:observations.filter(row=>row.passed).length/observations.length,model_calls:observations.reduce((sum,row)=>sum+row.model_calls,0),
    tool_events:observations.reduce((sum,row)=>sum+row.tool_events,0),host_transition_ownership_rate:observations.filter(row=>row.transition_owner==='deterministic-host').length/observations.length,
    elapsed_ms:Number(observations.reduce((sum,row)=>sum+row.elapsed_ms,0).toFixed(3))};
  const gates={route_accuracy:summary.route_accuracy===manifest.gates.live_route_accuracy,exact_result_rate:summary.exact_result_rate===manifest.gates.live_exact_result_rate,
    model_call_count:summary.model_calls===manifest.gates.live_model_call_count,tool_event_count:summary.tool_events===manifest.gates.live_tool_event_count,
    host_transition_ownership_rate:summary.host_transition_ownership_rate===manifest.gates.host_transition_ownership_rate};
  return sealed('are.requirement-fast-path-live-result/v2',{experiment_id:manifest.experiment_id,manifest_digest:manifest.manifest_digest,
    observed_runtime:{node_version:process.version,binary_version:binary,model:manifest.runtime.model,effort:manifest.runtime.effort},observations,summary,gates,
    disposition:Object.values(gates).every(Boolean)?'candidate-supported':'counterevidence-observed',limitations:['Six cases are a bounded canary, not independent validation or a population benchmark.',
      'Passing does not activate production wrapper integration.']},'result_digest');
}

export function verifyLiveCanary002(value,manifest=buildFastPathCanaryManifest002()){
  try{
    if(value?.schema_version!=='are.requirement-fast-path-live-result/v2'||!verifyDigest(value,'result_digest')||value.manifest_digest!==manifest.manifest_digest
      ||value.observations.length!==manifest.live_schedule.length)return false;
    const summary={total:value.observations.length,passed:value.observations.filter(row=>row.passed).length,route_accuracy:value.observations.filter(row=>row.observed_disposition===row.expected_disposition).length/value.observations.length,
      exact_result_rate:value.observations.filter(row=>row.passed).length/value.observations.length,model_calls:value.observations.reduce((sum,row)=>sum+row.model_calls,0),
      tool_events:value.observations.reduce((sum,row)=>sum+row.tool_events,0),host_transition_ownership_rate:value.observations.filter(row=>row.transition_owner==='deterministic-host').length/value.observations.length,
      elapsed_ms:Number(value.observations.reduce((sum,row)=>sum+row.elapsed_ms,0).toFixed(3))};
    const gates={route_accuracy:summary.route_accuracy===manifest.gates.live_route_accuracy,exact_result_rate:summary.exact_result_rate===manifest.gates.live_exact_result_rate,
      model_call_count:summary.model_calls===manifest.gates.live_model_call_count,tool_event_count:summary.tool_events===manifest.gates.live_tool_event_count,
      host_transition_ownership_rate:summary.host_transition_ownership_rate===manifest.gates.host_transition_ownership_rate};
    return canonicalizeIntentJson(summary)===canonicalizeIntentJson(value.summary)&&canonicalizeIntentJson(gates)===canonicalizeIntentJson(value.gates);
  }catch{return false;}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const manifest=buildFastPathCanaryManifest002();
  if(process.argv.includes('--manifest'))console.log(JSON.stringify(manifest,null,2));
  else if(process.argv.includes('--local'))console.log(JSON.stringify(runLocalCanary002(manifest),null,2));
  else if(process.argv.includes('--live'))console.log('RESULT '+JSON.stringify(await runLiveCanary002(manifest)));
  else throw Error('Use --manifest, --local, or explicit --live.');
}
