import {canonicalJson, digest, deepFreeze, isRecord, sealed, text, verifyDigest} from '../../request-intent-runtime/src/canonical.mjs';

const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const finitePositive = value => Number.isFinite(value) && value > 0;
const closed = (value, keys) => isRecord(value) && Object.keys(value).every(key => keys.includes(key));
const requireThat = (condition, code) => { if (!condition) throw Error(code); };
export const REPLICATION_SOURCE_PATHS = Object.freeze([
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/run-replication.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/benchmark-registration.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/requirement-replication.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs'
]);

function normalizedSet(values) {
  requireThat(Array.isArray(values) && values.length <= 64 && values.every(text), 'replication.requirement-set-invalid');
  const normalized = values.map(value => value.trim().toLowerCase()).sort();
  requireThat(new Set(normalized).size === normalized.length, 'replication.requirement-set-duplicate');
  return normalized;
}

function parseOutput(rawOutput, variant) {
  requireThat(typeof rawOutput === 'string' && Buffer.byteLength(rawOutput) <= 32768, 'replication.output-invalid');
  let parsed;
  try { parsed = JSON.parse(rawOutput.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '')); }
  catch { throw Error('replication.output-json-invalid'); }
  const keys = variant === 'treatment' ? ['transition','resulting_requirements','requirement_delta'] : ['transition','resulting_requirements'];
  requireThat(closed(parsed, keys) && keys.every(key => Object.hasOwn(parsed,key)), 'replication.output-shape-invalid');
  requireThat(['continue','refine'].includes(parsed.transition), 'replication.transition-invalid');
  parsed.resulting_requirements = normalizedSet(parsed.resulting_requirements);
  if (variant === 'treatment') {
    requireThat(closed(parsed.requirement_delta,['retained','added','removed'])
      && ['retained','added','removed'].every(key=>Object.hasOwn(parsed.requirement_delta,key)), 'replication.delta-invalid');
    parsed.requirement_delta = Object.fromEntries(['retained','added','removed'].map(key=>[key,normalizedSet(parsed.requirement_delta[key])]));
  }
  return parsed;
}

export function materializeReplicationManifest({preparation, source_digests, environment}) {
  requireThat(preparation?.schema_version === 'are.requirement-replication-preparation/v1'
    && verifyDigest(preparation,'manifest_digest') && preparation.authority_effect === 'none'
    && preparation.status === 'prepared-not-runnable', 'replication.preparation-invalid');
  requireThat(isRecord(source_digests) && canonicalJson(Object.keys(source_digests).sort())===canonicalJson([...REPLICATION_SOURCE_PATHS])
    && Object.keys(source_digests).every(path=>path.startsWith('cyberAlchemy-v2/')&&!path.split('/').includes('..'))
    && Object.values(source_digests).every(sha), 'replication.sources-invalid');
  requireThat(closed(environment,['node_version','binary_version','model','effort','cwd','approval_policy','sandbox','ephemeral','shell_tool','base_instructions','thread_start_timeout_ms','completion_timeout_ms'])
    && environment.node_version === preparation.node_version && environment.binary_version === preparation.binary_version
    && environment.model === preparation.model && environment.effort === preparation.effort
    && environment.cwd === '/tmp' && environment.approval_policy === 'never' && environment.sandbox === 'read-only'
    && environment.ephemeral === true && environment.shell_tool === false && text(environment.base_instructions)
    && Number.isSafeInteger(environment.thread_start_timeout_ms) && environment.thread_start_timeout_ms > 0
    && Number.isSafeInteger(environment.completion_timeout_ms) && environment.completion_timeout_ms > 0, 'replication.environment-invalid');
  return sealed('are.requirement-replication-manifest/v1',{
    experiment_id:preparation.experiment_id, preparation_digest:preparation.manifest_digest,
    plan_digest:preparation.plan_digest, scope:'synthetic requirement-change classification; empty or singleton initial sets',
    model:preparation.model, effort:preparation.effort, binary_version:preparation.binary_version,
    node_version:preparation.node_version, repetitions:3, cases:preparation.cases, prompts:preparation.prompts,
    schedule:preparation.schedule, scoring:preparation.scoring, failure_policy:preparation.failure_policy,
    environment, source_digests, execution_effect:'model calls only when the separate runner receives --live'
  },'manifest_digest');
}

export function verifyReplicationManifest(manifest) {
  try {
    if (manifest?.schema_version !== 'are.requirement-replication-manifest/v1' || !verifyDigest(manifest,'manifest_digest')) return false;
    // Full predecessor bytes are external to this record; structural verification is completed below and its exact digest stays bound.
    requireThat(sha(manifest.preparation_digest) && sha(manifest.plan_digest) && manifest.authority_effect === 'none', 'replication.binding-invalid');
    requireThat(manifest.experiment_id === 'requirement-replication-001' && manifest.repetitions === 3
      && Array.isArray(manifest.cases) && manifest.cases.length === 24 && Array.isArray(manifest.schedule) && manifest.schedule.length === 144,
      'replication.cardinality-invalid');
    requireThat(new Set(manifest.cases.map(c=>c.id)).size === 24, 'replication.case-identity-invalid');
    const counts=new Map();
    for(let index=0;index<manifest.schedule.length;index++) {
      const row=manifest.schedule[index];
      requireThat(row.ordinal===index+1 && manifest.cases.some(c=>c.id===row.case_id) && [1,2,3].includes(row.repetition)
        && ['baseline','treatment'].includes(row.variant) && row.prompt === manifest.prompts[row.variant]
          + JSON.stringify((({objective,requirements,request})=>({objective,requirements,request}))(manifest.cases.find(c=>c.id===row.case_id)))
        && row.prompt_digest===digest(row.prompt), 'replication.schedule-invalid');
      const key=`${row.case_id}:${row.repetition}:${row.variant}`;counts.set(key,(counts.get(key)??0)+1);
    }
    requireThat(counts.size===144 && [...counts.values()].every(n=>n===1), 'replication.schedule-coverage-invalid');
    requireThat(isRecord(manifest.source_digests)
      && canonicalJson(Object.keys(manifest.source_digests).sort())===canonicalJson([...REPLICATION_SOURCE_PATHS])
      && Object.values(manifest.source_digests).every(sha), 'replication.sources-invalid');
    const e=manifest.environment;
    requireThat(closed(e,['node_version','binary_version','model','effort','cwd','approval_policy','sandbox','ephemeral','shell_tool','base_instructions','thread_start_timeout_ms','completion_timeout_ms'])
      && e.node_version===manifest.node_version && e.binary_version===manifest.binary_version && e.model===manifest.model && e.effort===manifest.effort
      && e.cwd==='/tmp' && e.approval_policy==='never' && e.sandbox==='read-only' && e.ephemeral===true && e.shell_tool===false
      && text(e.base_instructions) && Number.isSafeInteger(e.thread_start_timeout_ms) && e.thread_start_timeout_ms>0
      && Number.isSafeInteger(e.completion_timeout_ms) && e.completion_timeout_ms>0, 'replication.environment-invalid');
    return true;
  } catch { return false; }
}

export function scoreReplicationRun({manifest, observation}) {
  requireThat(verifyReplicationManifest(manifest), 'replication.manifest-invalid');
  requireThat(closed(observation,['ordinal','case_id','repetition','variant','prompt_digest','observed_model','observed_effort','observed_binary_version','thread_id','turn_id','completion_status','tool_events','startup_ms','first_text_ms','elapsed_ms','token_usage','raw_output'])
    && Number.isSafeInteger(observation.ordinal), 'replication.observation-invalid');
  const expected=manifest.schedule[observation.ordinal-1];
  requireThat(expected && ['case_id','repetition','variant','prompt_digest'].every(key=>observation[key]===expected[key]), 'replication.observation-schedule-mismatch');
  requireThat(observation.observed_model===manifest.model && observation.observed_effort===manifest.effort
    && observation.observed_binary_version===manifest.binary_version, 'replication.runtime-identity-mismatch');
  const c=manifest.cases.find(item=>item.id===observation.case_id), reasons=[];
  let parsed=null;
  try { parsed=parseOutput(observation.raw_output,observation.variant); } catch(error) { reasons.push(error.message); }
  let deltaValid=observation.variant==='baseline';
  if(parsed && observation.variant==='treatment') {
    const initial=normalizedSet(c.requirements), {retained,added,removed}=parsed.requirement_delta;
    deltaValid=canonicalJson([...retained,...removed].sort())===canonicalJson(initial)
      && retained.every(x=>!removed.includes(x)) && added.every(x=>!initial.includes(x))
      && canonicalJson([...retained,...added].sort())===canonicalJson(parsed.resulting_requirements);
    if(!deltaValid) reasons.push('replication.delta-accounting-invalid');
  }
  const labelMatched=parsed?.transition===c.expected;
  const requirementsMatched=parsed ? canonicalJson(parsed.resulting_requirements)===canonicalJson(normalizedSet(c.resulting_requirements)) : false;
  const runtimeIntegrity=observation.completion_status==='completed' && observation.tool_events===0
    && finitePositive(observation.startup_ms) && finitePositive(observation.first_text_ms) && finitePositive(observation.elapsed_ms)
    && text(observation.thread_id) && text(observation.turn_id) && isRecord(observation.token_usage);
  if(!labelMatched)reasons.push('replication.label-mismatch');
  if(!requirementsMatched)reasons.push('replication.requirement-set-mismatch');
  if(!runtimeIntegrity)reasons.push('replication.runtime-integrity-failed');
  return deepFreeze({ordinal:observation.ordinal,case_id:observation.case_id,repetition:observation.repetition,variant:observation.variant,
    prompt_digest:observation.prompt_digest,observed_model:observation.observed_model,observed_effort:observation.observed_effort,
    observed_binary_version:observation.observed_binary_version,thread_id:observation.thread_id,turn_id:observation.turn_id,
    completion_status:observation.completion_status,tool_events:observation.tool_events,startup_ms:observation.startup_ms,
    first_text_ms:observation.first_text_ms,elapsed_ms:observation.elapsed_ms,token_usage:observation.token_usage,
    raw_output:observation.raw_output,output_digest:digest(observation.raw_output),parsed_output:parsed,
    label_matched:labelMatched,requirements_matched:requirementsMatched,delta_valid:deltaValid,runtime_integrity:runtimeIntegrity,
    passed:labelMatched&&requirementsMatched&&deltaValid&&runtimeIntegrity,reason_codes:[...new Set(reasons)].sort(),authority_effect:'none'});
}

export function materializeReplicationResult({manifest, observations, status, error=null, started_at, finished_at}) {
  requireThat(verifyReplicationManifest(manifest) && ['completed','blocked'].includes(status) && Array.isArray(observations)
    && observations.length<=manifest.schedule.length && text(started_at) && text(finished_at), 'replication.result-input-invalid');
  if(status==='completed')requireThat(observations.length===manifest.schedule.length && error===null,'replication.completed-invalid');
  if(status==='blocked')requireThat(text(error),'replication.blocked-reason-required');
  const runs=observations.map(observation=>scoreReplicationRun({manifest,observation}));
  let summary=null,gates=null;
  if(status==='completed') {
    summary=Object.fromEntries(['baseline','treatment'].map(variant=>{const rows=runs.filter(r=>r.variant===variant);
      return [variant,{total:rows.length,classification_correct:rows.filter(r=>r.label_matched).length,
        requirements_preserved:rows.filter(r=>r.requirements_matched&&r.delta_valid).length,runtime_integrity:rows.filter(r=>r.runtime_integrity).length,
        passed:rows.filter(r=>r.passed).length}];}));
    gates={classification_improved:summary.treatment.classification_correct>summary.baseline.classification_correct,
      requirement_preservation:summary.treatment.requirements_preserved===72,
      runtime_integrity:summary.baseline.runtime_integrity===72&&summary.treatment.runtime_integrity===72};
  }
  return sealed('are.requirement-replication-result/v1',{manifest_digest:digest(manifest),model:manifest.model,
    requested_effort:manifest.effort,binary_version:manifest.binary_version,node_version:manifest.node_version,
    source_digests:manifest.source_digests,started_at,finished_at,status,error,runs,summary,gates,
    limitations:['Synthetic cases use empty or singleton initial requirement sets.','Repeated turns are not independent cases.','Registration checks structure, not independent linguistic truth.']},'result_digest');
}
