import {canonicalJson,digest,deepFreeze,isRecord,sealed,text,verifyDigest} from '../../request-intent-runtime/src/canonical.mjs';
import {assessRequirementChange,materializeRequirementSnapshot} from '../../request-intent-runtime/src/requirement-change.mjs';
import {assessRequirementPatch} from '../../request-intent-runtime/src/requirement-patch.mjs';
const need=(ok,code)=>{if(!ok)throw Error(code);},sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const closed=(x,keys)=>isRecord(x)&&Object.keys(x).every(k=>keys.includes(k));
export const LATENCY_SOURCE_PATHS=Object.freeze([
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/evidence/requirement-latency-001.manifest.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/run-latency-002.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/benchmark-registration.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/requirement-latency-control.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-change.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-patch.mjs']);
const environmentOk=(e,m)=>closed(e,['node_version','binary_version','model','effort','cwd','approval_policy','sandbox','ephemeral','shell_tool','base_instructions','thread_start_timeout_ms','completion_timeout_ms'])
  &&e.node_version===m.node_version&&e.binary_version===m.binary_version&&e.model===m.model&&e.effort===m.effort&&e.cwd==='/tmp'
  &&e.approval_policy==='never'&&e.sandbox==='read-only'&&e.ephemeral===true&&e.shell_tool===false&&text(e.base_instructions)
  &&Number.isSafeInteger(e.thread_start_timeout_ms)&&e.thread_start_timeout_ms>0&&Number.isSafeInteger(e.completion_timeout_ms)&&e.completion_timeout_ms>0;

export function materializeLatencyManifest(input){
  need(input?.experiment_id==='requirement-latency-002'&&sha(input.plan_digest)&&sha(input.hypothesis_digest)
    &&input.model==='gpt-5.6-luna'&&input.effort==='low'&&input.binary_version==='codex-cli 0.153.1'&&input.node_version==='v26.8.1','latency.manifest-identity-invalid');
  need(Array.isArray(input.cases)&&input.cases.length===8&&new Set(input.cases.map(c=>c.id)).size===8
    &&Array.isArray(input.schedule)&&input.schedule.length===80&&input.repetitions===5,'latency.manifest-cardinality-invalid');
  need(isRecord(input.prompts)&&['full','compact'].every(v=>text(input.prompts[v])),'latency.prompts-invalid');
  const seen=new Set();
  input.schedule.forEach((row,index)=>{const c=input.cases.find(x=>x.id===row.case_id);
    need(row.ordinal===index+1&&c&&[1,2,3,4,5].includes(row.repetition)&&['full','compact'].includes(row.variant),'latency.schedule-invalid');
    const prompt=input.prompts[row.variant]+JSON.stringify({objective:c.objective,requirements:c.requirements,request:c.request});
    need(row.prompt===prompt&&row.prompt_digest===digest(prompt),'latency.prompt-binding-invalid');
    const key=`${row.case_id}:${row.repetition}:${row.variant}`;need(!seen.has(key),'latency.schedule-duplicate');seen.add(key);});
  need(seen.size===80&&isRecord(input.source_digests)&&canonicalJson(Object.keys(input.source_digests).sort())===canonicalJson([...LATENCY_SOURCE_PATHS])
    &&Object.values(input.source_digests).every(sha),'latency.sources-invalid');
  need(environmentOk(input.environment,input),'latency.environment-invalid');
  return sealed('are.requirement-latency-controlled-manifest/v1',{...input,scope:'representation-only comparison on eight synthetic cases; five repeated observations per arm',
    gates:{quality_matches_per_arm:40,maximum_p95_ratio:.85,maximum_cache_mean_relative_difference:.10},
    execution_effect:'80 model calls only with explicit --live'},'manifest_digest');
}
export function verifyLatencyManifest(m){try{if(m?.schema_version!=='are.requirement-latency-controlled-manifest/v1'||!verifyDigest(m,'manifest_digest')||m.authority_effect!=='none')return false;
  const {schema_version,scope,gates,execution_effect,authority_effect,manifest_digest,...input}=m;return materializeLatencyManifest(input).manifest_digest===manifest_digest;}catch{return false;}}
function parse(raw,variant){need(typeof raw==='string'&&Buffer.byteLength(raw)<=32768,'latency.output-invalid');let p;try{p=JSON.parse(raw.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,''));}catch{throw Error('latency.output-json-invalid');}
  const keys=variant==='full'?['transition','requirement_delta']:['transition','added','removed'];need(closed(p,keys)&&keys.every(k=>Object.hasOwn(p,k)),'latency.output-shape-invalid');return p;}
export function scoreLatencyRun({manifest,observation}){need(verifyLatencyManifest(manifest),'latency.manifest-invalid');
  need(closed(observation,['ordinal','case_id','repetition','variant','prompt_digest','observed_model','observed_effort','observed_binary_version','thread_id','turn_id','completion_status','tool_events','startup_ms','first_text_ms','elapsed_ms','token_usage','raw_output']),'latency.observation-invalid');
  const expected=manifest.schedule[observation.ordinal-1];need(expected&&['case_id','repetition','variant','prompt_digest'].every(k=>expected[k]===observation[k]),'latency.schedule-mismatch');
  need(observation.observed_model===manifest.model&&observation.observed_effort===manifest.effort&&observation.observed_binary_version===manifest.binary_version,'latency.runtime-identity-mismatch');
  const c=manifest.cases.find(x=>x.id===observation.case_id),reasons=[];let parsed=null,assessment=null;
  try{parsed=parse(observation.raw_output,observation.variant);const snapshot=materializeRequirementSnapshot({consumer_ref:'latency-002',scope_ref:`case:${c.id}`,objective_id:`objective:${c.id}`,
    objective_state_digest:digest({objective:c.objective,requirements:c.requirements}),requirements:c.requirements,source_refs:[`manifest:${manifest.manifest_digest}`]});
    const base={snapshot,request:c.request,request_ref:`case:${c.id}`};assessment=observation.variant==='full'?assessRequirementChange({...base,transition:parsed.transition,delta:parsed.requirement_delta}):assessRequirementPatch({...base,patch:parsed});
  }catch(error){reasons.push(error.message);}
  const label=parsed?.transition===c.expected,norm=xs=>[...xs].map(x=>x.trim().toLowerCase()).sort(),requirements=assessment?.ok===true&&canonicalJson(norm(assessment.value.resulting_requirements))===canonicalJson(norm(c.resulting_requirements));
  const runtime=observation.completion_status==='completed'&&observation.tool_events===0&&[observation.startup_ms,observation.first_text_ms,observation.elapsed_ms].every(x=>Number.isFinite(x)&&x>0)&&isRecord(observation.token_usage)&&text(observation.thread_id)&&text(observation.turn_id);
  if(!label)reasons.push('latency.label-mismatch');if(!requirements)reasons.push('latency.requirement-set-mismatch');if(!runtime)reasons.push('latency.runtime-integrity-failed');
  return deepFreeze({...observation,output_digest:digest(observation.raw_output),parsed_output:parsed,assessment_ok:assessment?.ok===true,label_matched:label,requirements_matched:requirements,runtime_integrity:runtime,
    passed:label&&requirements&&runtime,reason_codes:[...new Set(reasons)].sort(),authority_effect:'none'});}
const percentile=(xs,q)=>[...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*q)-1];
export function materializeLatencyResult({manifest,observations,status,error=null,started_at,finished_at}){need(verifyLatencyManifest(manifest)&&['completed','blocked'].includes(status)&&Array.isArray(observations)&&observations.length<=80&&text(started_at)&&text(finished_at),'latency.result-input-invalid');
  if(status==='completed')need(observations.length===80&&error===null,'latency.completed-invalid');else need(text(error),'latency.blocked-reason-required');
  const runs=observations.map(observation=>scoreLatencyRun({manifest,observation}));let summary=null,gates=null;
  if(status==='completed'){summary=Object.fromEntries(['full','compact'].map(variant=>{const rows=runs.filter(r=>r.variant===variant),cached=rows.map(r=>r.token_usage.total.cachedInputTokens);return[variant,{total:rows.length,passed:rows.filter(r=>r.passed).length,
      first_text_p50_ms:percentile(rows.map(r=>r.first_text_ms),.5),first_text_p95_ms:percentile(rows.map(r=>r.first_text_ms),.95),turn_p50_ms:percentile(rows.map(r=>r.elapsed_ms),.5),turn_p95_ms:percentile(rows.map(r=>r.elapsed_ms),.95),
      startup_p50_ms:percentile(rows.map(r=>r.startup_ms),.5),startup_p95_ms:percentile(rows.map(r=>r.startup_ms),.95),under_1000ms:rows.filter(r=>r.elapsed_ms<=1000).length,
      mean_cached_input_tokens:cached.reduce((a,b)=>a+b,0)/cached.length,mean_input_tokens:rows.reduce((a,r)=>a+r.token_usage.total.inputTokens,0)/rows.length,mean_output_tokens:rows.reduce((a,r)=>a+r.token_usage.total.outputTokens,0)/rows.length}]}));
    const cacheDiff=Math.abs(summary.full.mean_cached_input_tokens-summary.compact.mean_cached_input_tokens)/Math.max(summary.full.mean_cached_input_tokens,summary.compact.mean_cached_input_tokens,1);
    gates={quality:summary.full.passed===40&&summary.compact.passed===40,relative_latency:summary.compact.turn_p95_ms/summary.full.turn_p95_ms<=.85,cache_balance:cacheDiff<=.10,runtime_integrity:runs.every(r=>r.runtime_integrity)};}
  return sealed('are.requirement-latency-controlled-result/v1',{manifest_digest:digest(manifest),model:manifest.model,requested_effort:manifest.effort,binary_version:manifest.binary_version,node_version:manifest.node_version,
    source_digests:manifest.source_digests,started_at,finished_at,status,error,runs,summary,gates,limitations:['Repeated observations are not independent cases.','Provider load remains uncontrolled.','The one-second boundary is diagnostic, not silently removed.']},'result_digest');}
