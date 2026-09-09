import {readSourceContext,type RunOriginBinding} from './source-context.ts';
import {projectRunStrategy} from './run-strategy.ts';
/** Non-executing source adapters. Open questions: ./README.md#open-questions. */
import {RUN_PROJECTION_SCHEMA, runViewId, type ExecutionStatus, type RunProjection, type RunSource, type RunView} from './run-contract.ts';
type RecordValue = Record<string, unknown>;
function fail(code: string): never { throw new Error(code); }
function object(value: unknown): RecordValue { if (!value || typeof value !== 'object' || Array.isArray(value)) fail('RUN_OBJECT_INVALID'); return value as RecordValue; }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) fail('RUN_ARRAY_INVALID'); return value; }
function text(value: unknown): string { if (typeof value !== 'string' || !value.trim() || value.includes('\0')) fail('RUN_TEXT_INVALID'); return value; }
function integer(value: unknown): number { if (!Number.isSafeInteger(value) || (value as number) < 0) fail('RUN_INTEGER_INVALID'); return value as number; }
function optionalText(value: unknown): string | null { return value === undefined || value === null ? null : text(value); }
function hex(value: unknown): string { const s=text(value);if(!/^[a-f0-9]{64}$/.test(s))fail('RUN_DIGEST_INVALID');return s; }
function runKey(value: unknown): string { const s=text(value);if(!/^[a-f0-9]{64}$/.test(s))fail('RUN_KEY_INVALID');return s; }
function oneOf<T extends string>(value: unknown, values: readonly T[]): T { if(!values.includes(value as T))fail('RUN_ENUM_INVALID');return value as T; }
function sourceView(source: RunSource, revision: number | null): RunView['source'] {
  const runtimeId=text(source.runtimeId), label=text(source.label);
  const observedAtMs=integer(source.observedAtMs),now=integer(source.nowMs),age=integer(source.maxAgeMs);
  if(observedAtMs>now || typeof source.available!=='boolean')fail('RUN_OBSERVATION_INVALID');
  return {runtimeId,label,location:oneOf(source.location,['local','vps','unknown']),observedAtMs,revision,freshness:!source.available?'offline':now-observedAtMs>age?'stale':'fresh'};
}
function projection(source: RunView['source'], runs: RunView[]): RunProjection {
  const ids=new Set<string>(),keys=new Set<string>();
  for(const run of runs){if(ids.has(run.viewId))fail('RUN_DUPLICATE_ID');ids.add(run.viewId);if(run.runRef){const key=JSON.stringify(run.runRef);if(keys.has(key))fail('RUN_DUPLICATE_REFERENCE');keys.add(key);}}
  return {schemaVersion:RUN_PROJECTION_SCHEMA,authorityEffect:'none',sources:[source],runs};
}
async function taskDigest(value: unknown): Promise<{id:string; title:string; digest:string}> {
  const task=object(value), fields=['schema_version','task_id','title','instruction','input','objective_kind'];
  if(Object.keys(task).sort().join()!==[...fields].sort().join()||task.schema_version!=='are-text-task/v1'||task.objective_kind!=='understand')fail('RUN_TASK_SCHEMA_INVALID');
  const id=text(task.task_id);if(!/^[A-Za-z0-9_-]{1,80}$/.test(id))fail('RUN_TASK_ID_INVALID');
  const encoder=new TextEncoder();for(const [field,max] of [['title',160],['instruction',2048],['input',8192]] as const)if(encoder.encode(text(task[field])).length>max)fail('RUN_TASK_LIMIT');
  const bytes=encoder.encode(JSON.stringify(Object.fromEntries(fields.map(field=>[field,task[field]]))));
  const digest=Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  return {id,title:text(task.title),digest};
}
function nativeResult(value: unknown, taskId: string, digest: string): RecordValue {
  const result=object(value);
  if(result.status!=='passed'||result.verified!==true||result.task_digest!==digest||result.request_id!==taskId||result.model!=='gpt-5.6-luna'||result.provider_calls!==1||result.tools_enabled!==false||result.max_output_tokens!==512)fail('RUN_NATIVE_RESULT_BINDING_INVALID');
  hex(result.completion_binding_digest);hex(result.prompt_sha256);text(result.thread_id);text(result.turn_id);const output=text(result.output);if(new TextEncoder().encode(output).length>8192)fail('RUN_RESULT_LIMIT');
  return result;
}
/** Owner observations must come from a trusted backend replay, never browser-supplied approval. */
export async function projectNativeRuns(value: unknown, source: RunSource, ownerObservations: ReadonlyMap<string, unknown> = new Map()): Promise<RunProjection> {
  const root=object(value);if(root.schema_version!=='are-native-console-state/v1'||root.mode!=='native-fixture'||root.external_model_calls!==0)fail('RUN_NATIVE_SCHEMA_INVALID');
  const src=sourceView(source,null),jobs=array(root.jobs),runs:RunView[]=[];const seenTasks=new Set<string>(),seenJobs=new Set<string>();
  for(const value of jobs){
    const job=object(value),launchId=text(job.id);if(!/^[a-f0-9-]{36}$/.test(launchId))fail('RUN_LAUNCH_ID_INVALID');
    if(seenJobs.has(launchId))fail('RUN_DUPLICATE_ID');seenJobs.add(launchId);
    const task=await taskDigest(job.task),digest=hex(job.task_digest);if(task.digest!==digest)fail('RUN_TASK_DIGEST_MISMATCH');
    if(seenTasks.has(task.id))fail('RUN_DUPLICATE_TASK');seenTasks.add(task.id);
    const execution=oneOf(job.status,['preparing','running','cancelling','succeeded','cancelled','uncertain']);
    let result:RunView['result']={kind:'fixture-text',content:null,verification:'unavailable',completionDigest:null};
    let reference:RunView['runRef']=null;const attention:string[]=[];
    let origin:RunOriginBinding|undefined;
    try{const context=await readSourceContext(object(job.task).input);if(context)origin={source:context.source,textSha256:context.text_sha256,taskDigest:digest,binding:'task-digest-bound',sourceVerification:'caller-declared'};}
    catch{attention.push('source-context-invalid');}
    if(execution==='uncertain')attention.push('reconciliation-required');
    if(src.freshness!=='fresh')attention.push('source-'+src.freshness);
    const owner=ownerObservations.get(launchId);
    if(execution==='succeeded'){
      const reported=nativeResult(job.result,task.id,digest);
      result={kind:'fixture-text',content:text(reported.output),verification:'source-reported',completionDigest:hex(reported.completion_binding_digest)};
      if(owner!==undefined){
        const receipt=object(owner);
        if(receipt.schema_version!=='are-native-owner-result/v1'||receipt.status!=='PASS'||receipt.replayed!==true)fail('RUN_OWNER_RECEIPT_INVALID');
        const verified=nativeResult(receipt.result,task.id,digest);
        for(const field of ['output','completion_binding_digest','thread_id','turn_id','prompt_sha256'])if(verified[field]!==reported[field])fail('RUN_OWNER_RESULT_MISMATCH');
        reference={runtimeId:src.runtimeId,runKey:runKey(receipt.run_key)};result.verification='owner-verified';
      }else attention.push('owner-run-reference-unavailable');
    }else if(owner!==undefined)fail('RUN_OWNER_STATE_CONFLICT');
    runs.push({viewId:runViewId(src.runtimeId,'launch',launchId),runRef:reference,launchId,taskId:task.id,title:task.title,icon:'text-task',workKind:'are-native-fixture',originRefs:origin?[{kind:origin.source.kind,id:origin.source.id,revision:origin.source.revision}]:[],...(origin?{origin}:{}),execution,scheduling:'unknown',mode:'fixture',executor:{contract:'are-codex-text/v1',modelTarget:'gpt-5.6-luna'},progress:result.verification==='owner-verified'?{accepted:1,running:0,pending:0,blocked:0,total:1}:null,result,lifecycle:{execution:null,acceptance:null,promotion:null},source:src,attention,actions:[]});
  }
  for(const id of ownerObservations.keys())if(!seenJobs.has(id))fail('RUN_OWNER_ORPHAN_RECEIPT');
  return projection(src,runs);
}
export function projectOrchestratorRuns(value: unknown, source: RunSource): RunProjection {
  const root=object(value);if(root.schema_version!=='cav2-orchestrator-current-state/v1-candidate')fail('RUN_ORCHESTRATOR_SCHEMA_INVALID');
  const src=sourceView(source,integer(root.projection_revision));const sourceMode=text(root.source_mode);
  // Source mode is reported provenance. Hostname and the string "Luna" grant no live status.
  const runs=array(root.runs).map(value=>{
    const raw=object(value),key=text(raw.run_key),legacyStatus=oneOf(raw.status,['active','blocked','closed']);
    const life=raw.lifecycle===undefined?{}:object(raw.lifecycle),executionLife=optionalText(life.execution);
    const automation=raw.automation==null?null:object(raw.automation);
    if(automation&&typeof automation.paused!=='boolean')fail('RUN_PAUSE_INVALID');
    const scheduling=automation?(automation.paused?'paused':'active'):'unknown';
    let execution:ExecutionStatus=legacyStatus==='blocked'?'blocked':legacyStatus==='active'?'running':'unknown';
    if(executionLife==='pass')execution='succeeded';else if(executionLife==='failed')execution='failed';else if(executionLife==='cancelled')execution='cancelled';
    const kind=optionalText(raw.work_kind)??'unknown';
    const native=kind==='are-native-fixture'&&raw.native_execution!=null?object(raw.native_execution):null;
    if(native){const phase=oneOf(native.phase,['queued','running','succeeded','cancelled','needs_attention']);execution=phase==='needs_attention'?'uncertain':phase;}
    const strategy=raw.strategy==null?null:object(raw.strategy);
    const graph=object(raw.graph),progress={accepted:integer(graph.completed),running:integer(graph.running),pending:integer(graph.pending),blocked:integer(graph.blocked),total:integer(graph.total)};
    if(progress.accepted+progress.running+progress.pending+progress.blocked!==progress.total)fail('RUN_PROGRESS_INVALID');
    const reported=raw.result==null?null:object(raw.result);const resultStatus=reported?oneOf(reported.status,['available','pending','blocked','unavailable']):'unavailable';
    const resultKind=reported?.kind===undefined?'unknown':oneOf(reported.kind,['provider-output','audited-research','fixture-text']);
    const attention=src.freshness==='fresh'?[]:['source-'+src.freshness];if(execution==='blocked')attention.push('recorded-blocker');if(execution==='unknown')attention.push('execution-status-unavailable');
    // Known producer work kinds only; unknown contracts stay visibly unknown.
    const mode:RunView['mode']=sourceMode==='deterministic-local-fixture'||kind==='demonstration'||native?.mode==='fixture'?'fixture':kind==='research'&&strategy?.model==='gpt-5.6-luna'&&sourceMode==='live-vps-candidate'?'live':'unknown';
    const result:RunView['result']={kind:resultKind,content:resultStatus==='available'?text(reported!.content):null,verification:resultStatus==='available'?'source-reported':'unavailable',completionDigest:null};
    return {viewId:runViewId(src.runtimeId,'run',key),runRef:{runtimeId:src.runtimeId,runKey:key},launchId:null,taskId:null,title:text(raw.title),icon:native?'text-task':kind.startsWith('research')?'research':'workflow',workKind:kind,originRefs:[],execution,scheduling,mode,executor:{contract:null,modelTarget:strategy?optionalText(strategy.model):null},progress,strategy:projectRunStrategy(raw.strategy),result,lifecycle:{execution:executionLife,acceptance:optionalText(life.acceptance),promotion:optionalText(life.promotion)},source:src,attention,actions:[]} satisfies RunView;
  });
  return projection(src,runs);
}
/** A runtime is supplied once per batch; duplicate identities are not silently merged. */
export function combineRunProjections(inputs: readonly RunProjection[]): RunProjection {
  const runtimes=new Set<string>(),ids=new Set<string>(),refs=new Set<string>();
  for(const input of inputs){if(input.schemaVersion!==RUN_PROJECTION_SCHEMA||input.authorityEffect!=='none')fail('RUN_PROJECTION_INVALID');for(const source of input.sources){if(runtimes.has(source.runtimeId))fail('RUN_DUPLICATE_SOURCE');runtimes.add(source.runtimeId);}for(const run of input.runs){if(ids.has(run.viewId))fail('RUN_DUPLICATE_ID');ids.add(run.viewId);if(run.runRef){const ref=JSON.stringify(run.runRef);if(refs.has(ref))fail('RUN_DUPLICATE_REFERENCE');refs.add(ref);}}}
  return {schemaVersion:RUN_PROJECTION_SCHEMA,authorityEffect:'none',sources:inputs.flatMap(p=>p.sources),runs:inputs.flatMap(p=>p.runs)};
}
