// Successor canary: clear grammar variants remain wholly deterministic.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessRequirementOperationFastPathExpanded,canonicalizeIntentJson,materializeRequirementSnapshot,
  resolveRequirementOperationExpanded,verifyRequirementOperationFastPathExpanded} from '../../../request-intent-runtime/index.mjs';
import {digest,sealed,verifyDigest} from '../../../request-intent-runtime/src/canonical.mjs';
import {createAppServerRpcClient,spawnAppServerRpcTransport} from '../../../codex-app-server-wrapper/src/rpc-client.mjs';

const directory=dirname(fileURLToPath(import.meta.url)),repositoryRoot=resolve(directory,'../../../../../../..');
const read=name=>JSON.parse(readFileSync(join(directory,name),'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(join(repositoryRoot,path))).digest('hex');
const plan=read('../../plans/requirement-fast-path-canary-v4.json'),holdout=read('expanded-grammar-holdout-001.json');
const SOURCE_PATHS=Object.freeze([
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/index.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-change.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-patch.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-operation-fast-path.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/plans/requirement-fast-path-canary-v4.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/expanded-grammar-holdout-001.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/run-fast-path-canary-004.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/fast-path-canary-004.test.mjs']);

function validateHoldout(value){
  return value?.schema_version==='are.requirement-expanded-grammar-holdout/v1'&&value.dataset_id==='requirement-expanded-grammar-holdout-001'
    &&value.authorship_posture==='same-workstream-prospectively-frozen-not-independent'&&value.authority_effect==='none'
    &&Array.isArray(value.cases)&&value.cases.length===24&&new Set(value.cases.map(item=>item.id)).size===24
    &&value.cases.every(item=>typeof item.request==='string'&&Array.isArray(item.requirements)&&Array.isArray(item.expected_requirements)
      &&['fast-path','fallback-required'].includes(item.expected_disposition)
      &&(item.expected_operation===null||['add','remove','maintain'].includes(item.expected_operation))&&typeof item.live_canary==='boolean')
    &&value.cases.filter(item=>item.expected_disposition==='fast-path').length===12
    &&value.cases.filter(item=>item.expected_disposition==='fallback-required').length===12
    &&value.cases.filter(item=>item.live_canary).length===4;
}
function snapshotFor(item){return materializeRequirementSnapshot({consumer_ref:'fast-path-canary-004',scope_ref:`case:${item.id}`,objective_id:`objective:${item.id}`,
  objective_state_digest:digest({case_id:item.id,requirements:item.requirements}),requirements:item.requirements,source_refs:[`holdout:${holdout.dataset_id}`]});}
function observe(item,requestRef){
  const assessed=assessRequirementOperationFastPathExpanded({snapshot:snapshotFor(item),request:item.request,request_ref:requestRef});
  const observed=assessed.ok?assessed.value:null,passed=assessed.ok&&verifyRequirementOperationFastPathExpanded(observed)
    &&observed.disposition===item.expected_disposition&&observed.operation===item.expected_operation
    &&(item.expected_disposition==='fallback-required'||canonicalizeIntentJson(observed.change.resulting_requirements)===canonicalizeIntentJson(item.expected_requirements));
  return {observed,passed};
}

export function buildFastPathCanaryManifest004(){
  if(!validateHoldout(holdout))throw Error('fast-path-canary-004.holdout-invalid');
  return sealed('are.requirement-fast-path-canary-manifest/v4',{experiment_id:'requirement-fast-path-canary-004',predecessor_manifest_digest:plan.predecessor_manifest_digest,
    counterevidence_result_digest:plan.counterevidence_result_digest,plan_ref:'../../plans/requirement-fast-path-canary-v4.json',plan_digest:digest(plan),
    dataset_ref:'expanded-grammar-holdout-001.json',dataset_digest:digest(holdout),schedule:holdout.cases.map((item,index)=>({ordinal:index+1,case_id:item.id})),
    live_schedule:holdout.cases.filter(item=>item.live_canary).map((item,index)=>({ordinal:index+1,case_id:item.id,expected_model_calls:0})),
    source_digests:Object.fromEntries(SOURCE_PATHS.map(path=>[path,sha(path)])),runtime:{node_version:'v26.8.1',binary_version:'codex-cli 0.153.1',model:'gpt-5.6-luna',effort:'low',cwd:repositoryRoot,
      approval_policy:'never',sandbox:'read-only',shell_tool:false,thread_start_timeout_ms:240000,completion_timeout_ms:300000},
    gates:{local_positive_recall:1,local_false_admission_rate:0,local_exact_result_rate:1,live_exact_result_rate:1,live_model_call_count:0,live_tool_event_count:0,
      deterministic_transition_ownership_rate:1,expanded_grammar_label_ownership_rate:1}},'manifest_digest');
}
export function verifyFastPathCanaryManifest004(value,currentSources=true){try{
  if(value?.schema_version!=='are.requirement-fast-path-canary-manifest/v4'||!verifyDigest(value,'manifest_digest')||value.plan_digest!==digest(plan)||value.dataset_digest!==digest(holdout)
    ||value.schedule.length!==24||value.live_schedule.length!==4||Object.keys(value.source_digests).length!==SOURCE_PATHS.length)return false;
  if(canonicalizeIntentJson(value.schedule)!==canonicalizeIntentJson(holdout.cases.map((item,index)=>({ordinal:index+1,case_id:item.id}))))return false;
  if(Object.keys(value.source_digests).some(path=>!SOURCE_PATHS.includes(path))||currentSources&&Object.entries(value.source_digests).some(([path,expected])=>sha(path)!==expected))return false;
  return value.predecessor_manifest_digest===plan.predecessor_manifest_digest&&value.counterevidence_result_digest===plan.counterevidence_result_digest;
}catch{return false;}}

export function runLocalCanary004(manifest=buildFastPathCanaryManifest004()){
  if(!verifyFastPathCanaryManifest004(manifest))throw Error('fast-path-canary-004.manifest-invalid');
  const rows=manifest.schedule.map(entry=>{const item=holdout.cases.find(candidate=>candidate.id===entry.case_id),result=observe(item,`local-004:${item.id}`);
    return {case_id:item.id,expected_disposition:item.expected_disposition,observed_disposition:result.observed?.disposition??null,form_id:result.observed?.form_id??null,passed:result.passed};});
  const positives=rows.filter(row=>row.expected_disposition==='fast-path'),exclusions=rows.filter(row=>row.expected_disposition==='fallback-required');
  const summary={total:rows.length,passed:rows.filter(row=>row.passed).length,positive_recall:positives.filter(row=>row.observed_disposition==='fast-path').length/positives.length,
    false_admission_rate:exclusions.filter(row=>row.observed_disposition==='fast-path').length/exclusions.length,exact_result_rate:rows.filter(row=>row.passed).length/rows.length,model_calls:0};
  const gates={positive_recall:summary.positive_recall===manifest.gates.local_positive_recall,false_admission_rate:summary.false_admission_rate===manifest.gates.local_false_admission_rate,
    exact_result_rate:summary.exact_result_rate===manifest.gates.local_exact_result_rate};
  return sealed('are.requirement-fast-path-local-result/v4',{experiment_id:manifest.experiment_id,manifest_digest:manifest.manifest_digest,
    case_results:rows.map(({case_id,form_id,passed})=>({case_id,form_id,passed})),observations_digest:digest(rows),summary,gates,
    disposition:Object.values(gates).every(Boolean)?'candidate-supported':'revise-candidate'},'result_digest');
}
export function verifyLocalCanary004(value,manifest=buildFastPathCanaryManifest004()){try{return value?.schema_version==='are.requirement-fast-path-local-result/v4'&&verifyDigest(value,'result_digest')
  &&value.manifest_digest===manifest.manifest_digest&&canonicalizeIntentJson(value)===canonicalizeIntentJson(runLocalCanary004(manifest));}catch{return false;}}

export async function runLiveCanary004(manifest=buildFastPathCanaryManifest004()){
  if(!verifyFastPathCanaryManifest004(manifest))throw Error('fast-path-canary-004.manifest-invalid');
  const binary=execFileSync('codex',['--version'],{encoding:'utf8'}).trim();
  if(process.version!==manifest.runtime.node_version||binary!==manifest.runtime.binary_version)throw Error('fast-path-canary-004.runtime-version-mismatch');
  let client,current=null;const observations=[];
  try{
    client=createAppServerRpcClient({transport:spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio']}),thread_start_timeout_ms:manifest.runtime.thread_start_timeout_ms,
      completion_timeout_ms:manifest.runtime.completion_timeout_ms});
    await client.initialize({clientInfo:{name:'are-fast-path-canary-004',version:'0.4.0'},capabilities:{experimentalApi:true}});await client.notify('initialized');
    const models=await client.request('model/list',{}),model=models.data.find(item=>item.id===manifest.runtime.model||item.model===manifest.runtime.model);
    if(!model?.supportedReasoningEfforts?.some(item=>item.reasoningEffort===manifest.runtime.effort))throw Error('fast-path-canary-004.model-effort-unavailable');
    client.events.on('notification',notification=>{if(current&&notification.method==='item/started'&&!['userMessage','agentMessage','reasoning'].includes(notification.params?.item?.type))current.tool_events++;});
    for(const entry of manifest.live_schedule){const item=holdout.cases.find(candidate=>candidate.id===entry.case_id),started=performance.now();let fallbackCalls=0;current={tool_events:0};
      const resolved=await resolveRequirementOperationExpanded({snapshot:snapshotFor(item),request:item.request,request_ref:`live-004:${item.id}`},()=>{fallbackCalls++;throw Error('fast-path-canary-004.unexpected-model-call');});
      const passed=resolved.ok&&resolved.value.disposition==='fast-path'&&resolved.value.model_calls===0&&fallbackCalls===0
        &&resolved.value.transition_owner==='deterministic-host'&&resolved.value.label_owner==='expanded-grammar'
        &&canonicalizeIntentJson(resolved.value.change.resulting_requirements)===canonicalizeIntentJson(item.expected_requirements);
      observations.push({ordinal:entry.ordinal,case_id:item.id,form_id:resolved.ok?resolved.value.form_id:null,model_calls:fallbackCalls,tool_events:current.tool_events,
        resulting_requirements:resolved.ok?resolved.value.change.resulting_requirements:null,derived_transition:resolved.ok?resolved.value.change.transition:null,
        transition_owner:resolved.ok?resolved.value.transition_owner:null,label_owner:resolved.ok?resolved.value.label_owner:null,
        reason_codes:resolved.ok?[]:resolved.reason_codes,elapsed_ms:Number((performance.now()-started).toFixed(3)),passed});
      console.log('PROGRESS '+JSON.stringify({completed:observations.length,total:manifest.live_schedule.length,case_id:item.id,passed}));
      current=null;
    }
  }finally{await client?.close();}
  const summary={total:observations.length,passed:observations.filter(row=>row.passed).length,exact_result_rate:observations.filter(row=>row.passed).length/observations.length,
    model_calls:observations.reduce((sum,row)=>sum+row.model_calls,0),tool_events:observations.reduce((sum,row)=>sum+row.tool_events,0),
    deterministic_transition_ownership_rate:observations.filter(row=>row.transition_owner==='deterministic-host').length/observations.length,
    expanded_grammar_label_ownership_rate:observations.filter(row=>row.label_owner==='expanded-grammar').length/observations.length,
    elapsed_ms:Number(observations.reduce((sum,row)=>sum+row.elapsed_ms,0).toFixed(3))};
  const gates={exact_result_rate:summary.exact_result_rate===manifest.gates.live_exact_result_rate,model_call_count:summary.model_calls===manifest.gates.live_model_call_count,
    tool_event_count:summary.tool_events===manifest.gates.live_tool_event_count,deterministic_transition_ownership_rate:summary.deterministic_transition_ownership_rate===manifest.gates.deterministic_transition_ownership_rate,
    expanded_grammar_label_ownership_rate:summary.expanded_grammar_label_ownership_rate===manifest.gates.expanded_grammar_label_ownership_rate};
  return sealed('are.requirement-fast-path-live-result/v4',{experiment_id:manifest.experiment_id,manifest_digest:manifest.manifest_digest,
    observed_runtime:{node_version:process.version,binary_version:binary,model:manifest.runtime.model,effort:manifest.runtime.effort,app_server_initialized:true,turns_started:0},
    observations,summary,gates,disposition:Object.values(gates).every(Boolean)?'candidate-supported':'counterevidence-observed',
    limitations:['Four deterministic cases and app-server initialization are a bounded canary, not independent validation or a model-quality benchmark.',
      'No Codex turn is expected or started; passing does not activate production wrapper integration.']},'result_digest');
}
export function verifyLiveCanary004(value,manifest=buildFastPathCanaryManifest004()){try{
  if(value?.schema_version!=='are.requirement-fast-path-live-result/v4'||!verifyDigest(value,'result_digest')||value.manifest_digest!==manifest.manifest_digest
    ||value.observations.length!==manifest.live_schedule.length||value.observed_runtime?.turns_started!==0||value.observed_runtime?.app_server_initialized!==true)return false;
  const summary={total:value.observations.length,passed:value.observations.filter(row=>row.passed).length,exact_result_rate:value.observations.filter(row=>row.passed).length/value.observations.length,
    model_calls:value.observations.reduce((sum,row)=>sum+row.model_calls,0),tool_events:value.observations.reduce((sum,row)=>sum+row.tool_events,0),
    deterministic_transition_ownership_rate:value.observations.filter(row=>row.transition_owner==='deterministic-host').length/value.observations.length,
    expanded_grammar_label_ownership_rate:value.observations.filter(row=>row.label_owner==='expanded-grammar').length/value.observations.length,
    elapsed_ms:Number(value.observations.reduce((sum,row)=>sum+row.elapsed_ms,0).toFixed(3))};
  const gates={exact_result_rate:summary.exact_result_rate===manifest.gates.live_exact_result_rate,model_call_count:summary.model_calls===manifest.gates.live_model_call_count,
    tool_event_count:summary.tool_events===manifest.gates.live_tool_event_count,deterministic_transition_ownership_rate:summary.deterministic_transition_ownership_rate===manifest.gates.deterministic_transition_ownership_rate,
    expanded_grammar_label_ownership_rate:summary.expanded_grammar_label_ownership_rate===manifest.gates.expanded_grammar_label_ownership_rate};
  return canonicalizeIntentJson(summary)===canonicalizeIntentJson(value.summary)&&canonicalizeIntentJson(gates)===canonicalizeIntentJson(value.gates);
}catch{return false;}}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const manifest=buildFastPathCanaryManifest004();
  if(process.argv.includes('--manifest'))console.log(JSON.stringify(manifest,null,2));else if(process.argv.includes('--local'))console.log(JSON.stringify(runLocalCanary004(manifest),null,2));
  else if(process.argv.includes('--live'))console.log('RESULT '+JSON.stringify(await runLiveCanary004(manifest)));else throw Error('Use --manifest, --local, or explicit --live.');}
