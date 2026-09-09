import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export class BenchmarkAttemptError extends Error {
  constructor(code, response) { super('bounded_adapter_failure'); this.code=code; this.response=response; }
}

export const FAMILIES = ['lookup', 'architecture', 'conflict', 'continuation', 'repair', 'abstention'];
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const string = x => typeof x === 'string' && x.length > 0;
function keys(x, required, optional = []) {
  if (!object(x) || required.some(k => !Object.hasOwn(x, k)) || Object.keys(x).some(k => !required.includes(k) && !optional.includes(k))) fail('invalid object fields');
}
function jsonValue(x) {
  if (x === null || typeof x === 'string' || typeof x === 'boolean') return;
  if (typeof x === 'number' && Number.isFinite(x)) return;
  if (Array.isArray(x)) return x.forEach(jsonValue);
  if (object(x) && Object.getPrototypeOf(x) === Object.prototype) return Object.values(x).forEach(jsonValue);
  fail('not a JSON value');
}
async function sourceBytes(root, path) {
  if (!string(path) || isAbsolute(path) || path.split(/[\\/]/).includes('..') || path.includes('\\')) fail('invalid source path');
  const base = await realpath(root), actual = await realpath(resolve(base, path));
  const rel = relative(base, actual);
  if (rel.startsWith('..') || isAbsolute(rel)) fail('source outside root');
  const bytes = await readFile(actual);
  if (bytes.length > 1024 * 1024) fail('source exceeds 1 MiB');
  return bytes;
}
export async function validateDataset(root, dataset) {
  keys(dataset, ['schema_version','status','authority_effect','description','sources','tasks','open_questions']);
  if (dataset.schema_version !== 'are.glm-fitting-dataset/v1' || dataset.authority_effect !== 'none') fail('invalid dataset identity');
  if (!Array.isArray(dataset.sources) || dataset.sources.length !== 8 || !Array.isArray(dataset.tasks) || dataset.tasks.length !== 48) fail('expected eight sources and 48 tasks');
  const texts = new Map(), sources = new Map(), paths = new Set(), digests = new Set(), groups = new Map();
  for (const s of dataset.sources) {
    keys(s,['source_id','path','sha256','group','split']);
    if (![s.source_id,s.group,s.path].every(string) || !['train','dev','heldout'].includes(s.split) || !/^[a-f0-9]{64}$/.test(s.sha256)) fail('invalid source');
    if (sources.has(s.source_id) || paths.has(s.path) || digests.has(s.sha256) || groups.has(s.group)) fail('duplicate source, content, or group');
    const bytes = await sourceBytes(root,s.path);
    if (sha256(bytes) !== s.sha256) fail(`source drift: ${s.path}`);
    JSON.parse(bytes.toString('utf8'));
    sources.set(s.source_id,s); paths.add(s.path); digests.add(s.sha256); groups.set(s.group,s.split); texts.set(s.source_id,bytes.toString('utf8'));
  }
  const ids = new Set(), pairs = new Set(), counts = {train:0,dev:0,heldout:0};
  for (const t of dataset.tasks) {
    keys(t,['id','family','group','split','source_ids','question','fixture','gold']);
    if (!string(t.id) || !string(t.question) || !FAMILIES.includes(t.family) || ids.has(t.id) || groups.get(t.group) !== t.split || !Object.hasOwn(counts,t.split)) fail('invalid task identity or split');
    if (!Array.isArray(t.source_ids) || t.source_ids.length !== 1 || !t.source_ids.every(id => sources.get(id)?.group === t.group)) fail('task source crosses group');
    if (!object(t.fixture)) fail('invalid fixture'); jsonValue(t.fixture);
    keys(t.gold,['expected','evidence','verifier']); jsonValue(t.gold.expected);
    if (!object(t.gold.expected) || t.gold.verifier !== 'exact-json-v1' || !Array.isArray(t.gold.evidence) || t.gold.evidence.length !== 1) fail('invalid gold');
    for (const e of t.gold.evidence) {
      keys(e,['source_id','sha256','json_pointer']);
      if (!t.source_ids.includes(e.source_id) || sources.get(e.source_id).sha256 !== e.sha256 || typeof e.json_pointer !== 'string' || (e.json_pointer !== '' && !/^\/[^/]+$/.test(e.json_pointer))) fail('invalid gold evidence');
      const doc = JSON.parse(texts.get(e.source_id));
      if (e.json_pointer && !Object.hasOwn(doc,e.json_pointer.slice(1))) fail('missing evidence selector');
      const field=e.json_pointer.slice(1), value=doc[field];
      const expected=t.family==='lookup'?{value}:t.family==='architecture'?{reference:value,field}:t.family==='conflict'?{value,stale_note_supported:false}:t.family==='continuation'?{next_action:'report_reference',reference:value}:t.family==='repair'?{candidate:{...t.fixture.damaged_object,[field]:value}}:{abstain:true,reason:'not_in_provided_source'};
      if (t.family==='repair' && (!object(t.fixture.damaged_object) || !Object.hasOwn(t.fixture.damaged_object,field))) fail('invalid repair fixture');
      if (!isDeepStrictEqual(t.gold.expected,expected)) fail('gold disagrees with pinned evidence');
    }
    const pair = `${t.group}:${t.family}`;
    if (pairs.has(pair)) fail('duplicate group family');
    ids.add(t.id); pairs.add(pair); counts[t.split]++;
  }
  if (!isDeepStrictEqual(counts,{train:24,dev:12,heldout:12})) fail('invalid split counts');
  return {texts,counts,sources};
}
export function validateConfig(config) {
  keys(config,['split','repeats','max_attempts','max_input_bytes','context_limit_tokens','recycle_at_tokens','output_reserve_tokens','token_margin','policy','model','adapter_kind']);
  if (!['train','dev','heldout'].includes(config.split) || !string(config.policy) || !string(config.model) || !['offline-scripted','bounded-runtime'].includes(config.adapter_kind)) fail('invalid config labels');
  for (const k of ['repeats','max_attempts','max_input_bytes','context_limit_tokens','recycle_at_tokens','output_reserve_tokens']) if (!Number.isSafeInteger(config[k]) || config[k] < 1) fail(`invalid ${k}`);
  if (!Number.isSafeInteger(config.token_margin) || config.token_margin < 0 || config.repeats > 10 || config.max_attempts > 480 || config.max_input_bytes > 1024*1024 || config.recycle_at_tokens > config.context_limit_tokens || config.output_reserve_tokens + config.token_margin >= config.recycle_at_tokens) fail('invalid context or run bounds');
}
export function publicInput(task, sources, texts, config) {
  // Deliberately constructed, never spread a task or include its gold/split/family/id.
  return {schema_version:'are.glm-fitting-input/v1',invocation_id:randomUUID(),question:task.question,fixture:structuredClone(task.fixture),sources:task.source_ids.map(id => ({source_id:id,path:sources.get(id).path,sha256:sources.get(id).sha256,text:texts.get(id)})),context:{context_limit_tokens:config.context_limit_tokens,recycle_at_tokens:config.recycle_at_tokens,output_reserve_tokens:config.output_reserve_tokens,token_margin:config.token_margin,policy:config.policy}};
}
export function scoreResponse(gold, text) {
  if (typeof text !== 'string') return {passed:false,reason:'response_not_text'};
  let value; try { value=JSON.parse(text); } catch { return {passed:false,reason:'invalid_json'}; }
  return {passed:isDeepStrictEqual(value,gold.expected),reason:isDeepStrictEqual(value,gold.expected)?'exact_json_match':'answer_mismatch'};
}
function responseRecord(x) {
  keys(x,['text','tool_events','usage','finish_reason'],['transport_receipts','admission','evaluation_kind']);
  for (const k of ['transport_receipts','admission','evaluation_kind']) if (Object.hasOwn(x,k)) jsonValue(x[k]);
  if (typeof x.text !== 'string' || !Array.isArray(x.tool_events) || x.tool_events.length > 1000 || !(x.finish_reason === null || typeof x.finish_reason === 'string')) fail('malformed adapter response');
  jsonValue(x.tool_events); keys(x.usage,['model_calls','tokenizer_calls','input_tokens','output_tokens','cache_tokens','recycles']);
  for (const v of Object.values(x.usage)) if (!(v === null || (Number.isSafeInteger(v) && v >= 0))) fail('malformed usage');
  if (Buffer.byteLength(JSON.stringify(x)) > 1024*1024) fail('adapter response exceeds 1 MiB');
  return structuredClone(x);
}
export async function runDataset({root,dataset,adapter,config,task_ids=null,onAttempt=async()=>{}}) {
  validateConfig(config);
  if (typeof adapter !== 'function' || typeof onAttempt !== 'function') fail('invalid adapter or recorder');
  const {texts,sources,counts}=await validateDataset(root,dataset);
  let selected=dataset.tasks.filter(t=>t.split===config.split);
  if (task_ids !== null) {
    if (!Array.isArray(task_ids) || task_ids.length===0 || new Set(task_ids).size!==task_ids.length || task_ids.some(id=>!selected.some(t=>t.id===id))) fail('invalid explicit task selection');
    selected=selected.filter(t=>task_ids.includes(t.id));
  }
  if (selected.length*config.repeats > config.max_attempts) fail('attempt cap too small; refusing partial split');
  const attempts=[];
  for (let repeat=0;repeat<config.repeats;repeat++) for (const task of selected) {
    const input=publicInput(task,sources,texts,config), inputJSON=JSON.stringify(input), started=performance.now();
    const record={schema_version:'are.glm-fitting-attempt/v1',task_id:task.id,repeat,invocation_id:input.invocation_id,dataset_sha256:sha256(JSON.stringify(dataset)),input_sha256:sha256(inputJSON),input_bytes:Buffer.byteLength(inputJSON),config:structuredClone(config),status:'started',response:null,score:null,error_code:null};
    // Persist a start event before any adapter work so interruptions remain visible.
    await onAttempt(structuredClone(record));
    try {
      if (record.input_bytes>config.max_input_bytes) fail('input_byte_limit');
      // Recheck pinned files before each attempt, including drift after a prior call.
      for (const id of task.source_ids) if (sha256(await sourceBytes(root,sources.get(id).path))!==sources.get(id).sha256) fail('source_drift_during_run');
      record.response=responseRecord(await adapter(structuredClone(input)));
      record.score=scoreResponse(task.gold,record.response.text); record.status='completed';
    } catch (error) {
      record.status='failed';
      if (error instanceof BenchmarkAttemptError) {
        record.response=responseRecord(error.response);
        record.error_code=/^[a-z0-9-]{1,80}$/.test(error.code)?error.code:'bounded-adapter-failure';
      }
      // Do not persist arbitrary adapter exceptions (may contain provider credentials).
      record.error_code??=['input_byte_limit','source_drift_during_run'].includes(error.message)?error.message:'adapter_or_source_failure';
    }
    record.elapsed_ms=Math.round((performance.now()-started)*1000)/1000;
    await onAttempt(structuredClone(record)); attempts.push(record);
  }
  return {schema_version:'are.glm-fitting-run/v1',authority_effect:'none',dataset_sha256:sha256(JSON.stringify(dataset)),counts,selected_task_ids:selected.map(t=>t.id),config:structuredClone(config),attempts,summary:{attempted:attempts.length,passed:attempts.filter(a=>a.score?.passed).length,failed:attempts.filter(a=>a.status==='failed').length},claim_limit:'Offline scripted runs verify harness behavior only; context tokens and provider compaction require runtime evidence.'};
}
