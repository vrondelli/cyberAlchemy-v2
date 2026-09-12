#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = path.resolve(import.meta.dirname, '../../../..');
const root = path.join(repo, 'implementation/agent-reasoning-engine/benchmarks');
const out = import.meta.dirname;
const rel = p => path.relative(repo, p).split(path.sep).join('/');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const evidencePath = p => /\/(evidence|runs|corpus|interaction-learning|analysis)\//.test('/' + p);
const files = [], links = [], hashGroups = new Map(), parsed = new Map();

function familyOf(p) {
  const q = p.split('/benchmarks/')[1] || '';
  return q.split('/')[0] || 'unknown';
}
function studyOf(p) {
  const q = p.split('/benchmarks/')[1]?.split('/') || [];
  if (q[0] === 'external-context-v1') return q[1] || '_root';
  if (q[0] === 'glm-episodes-v1' && q[1] === 'analysis' && q[2] === 'provider-study-v1') return `provider-study-v1/${q[3] || '_root'}`;
  if (q[0] === 'glm-episodes-v1' && q[1] === 'evidence') return `evidence/${q[2] || '_root'}`;
  if (q[0] === 'glm-episodes-v1' && q[1] === 'analysis') return `analysis/${q[2] || '_root'}`;
  if (q[0] === 'glm-fitting-v1') return q[1] || '_root';
  if (q[0] === 'real-reasoning-v1') return q[1] || '_root';
  return q[1] || '_root';
}
function roleOf(p) {
  if (p.includes('/node_modules/')) return 'dependency';
  if (p.includes('/__pycache__/') || p.endsWith('.pyc')) return 'cache-binary';
  if (/\/(test|src|bin)\//.test(p) || /\.(mjs|cjs|js|py|ts|svelte)$/.test(p)) return 'source-or-test';
  if (/\.(md|txt)$/.test(p)) return 'documentation';
  if (evidencePath(p) && /\.(json|jsonl|log|patch|diff|csv|tap|yml)$/.test(p)) return 'experiment-evidence';
  if (/\.(json|jsonl)$/.test(p)) return 'structured-metadata';
  return 'other';
}
function walk(d) {
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    const p = path.join(d, e.name), rp = rel(p);
    if (e.isSymbolicLink()) { links.push({path:rp, target:fs.readlinkSync(p), content_status:'not-followed'}); continue; }
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.isFile()) continue;
    const b = fs.readFileSync(p), h = sha(b), role = roleOf(rp);
    const rec = {path:rp, family:familyOf(rp), study:studyOf(rp), role, bytes:b.length, sha256:h, content_status:'hash-read-only'};
    if (!hashGroups.has(h)) hashGroups.set(h, []);
    hashGroups.get(h).push(rp);
    const ext = path.extname(p).toLowerCase();
    if (role === 'dependency' || role === 'cache-binary') rec.content_status = 'excluded-from-semantic-processing';
    else if (ext === '.json') {
      try { const x = JSON.parse(b.toString('utf8')); parsed.set(rp, x); rec.content_status = 'parsed-json'; }
      catch (err) { rec.content_status = 'json-parse-error'; rec.parse_error = err.message; }
    } else if (ext === '.jsonl') {
      const rows=[]; let bad=0; for (const [i,line] of b.toString('utf8').split(/\r?\n/).entries()) { if (!line.trim()) continue; try { rows.push(JSON.parse(line)); } catch { bad++; } }
      parsed.set(rp, rows); rec.content_status = bad ? 'parsed-jsonl-with-errors' : 'parsed-jsonl'; rec.jsonl_rows=rows.length; rec.jsonl_bad_lines=bad;
    } else if (['.md','.log','.txt','.tap','.csv','.yml','.patch','.diff','.mjs','.js','.cjs','.py','.ts','.svelte'].includes(ext)) {
      const s=b.toString('utf8'); rec.content_status = role === 'source-or-test' ? 'text-read-structure-only' : 'text-keyword-scanned';
      rec.keyword_hits = [...s.matchAll(/\b(schema|malformed|invalid|timeout|deadline|terminal|staging|feedback|token|read|tool|error|failed|recovery)\b/gi)].length;
    }
    files.push(rec);
  }
}
walk(root);

const duplicateGroups = [...hashGroups.entries()].filter(([,ps]) => ps.length > 1).map(([sha256,paths]) => ({sha256, copies:paths.length, bytes:files.find(f=>f.sha256===sha256)?.bytes||0, paths}));
const dupId = new Map(); duplicateGroups.forEach((g,i)=>g.paths.forEach(p=>dupId.set(p,i+1))); files.forEach(f=>{if(dupId.has(f.path))f.duplicate_content_group=dupId.get(f.path)});

const families = {}, studies = {};
for (const f of files) {
  families[f.family] ||= {files:0,bytes:0,roles:{},content_statuses:{},studies:new Set()};
  const a=families[f.family]; a.files++; a.bytes+=f.bytes; inc(a.roles,f.role); inc(a.content_statuses,f.content_status); a.studies.add(f.study);
  const sk=`${f.family}/${f.study}`; studies[sk] ||= {files:0,bytes:0,roles:{},content_statuses:{}}; const s=studies[sk]; s.files++;s.bytes+=f.bytes;inc(s.roles,f.role);inc(s.content_statuses,f.content_status);
}
for(const a of Object.values(families)) a.studies=[...a.studies].sort();

const externalEvents = {files:0,events:0,tool_counts:{},failed_results:0,malformed_arguments:0,malformed_results:0,repeated_exact_calls:0,details:[]};
const canonicalAttempts=[];
function executionClass(p) {
  if (p.includes('/glm-fitting-v1/evidence/offline-')) return 'offline-synthetic';
  if (p.includes('/provider-study-v1/admission-before-masking-v1/') || p.includes('/provider-study-v1/recovery-phase-v1/') || p.includes('/provider-study-v1/multifact-pressure-v1/')) return 'offline-scripted';
  return 'live-provider-evidence';
}
function receiptSummary(receipts=[]) {
  const models=receipts.filter(r=>r?.kind==='model' && r.dispatched!==false), toks=receipts.filter(r=>r?.kind==='tokenizer' && r.dispatched!==false);
  const used=models.filter(r=>Number.isFinite(r.input_tokens)&&Number.isFinite(r.output_tokens));
  return {model_receipts:models.length,tokenizer_receipts:toks.length,usage_complete_model_receipts:used.length,input_tokens:used.reduce((n,r)=>n+r.input_tokens,0),output_tokens:used.reduce((n,r)=>n+r.output_tokens,0),reasoning_tokens_subset:used.reduce((n,r)=>n+(Number.isFinite(r.reasoning_tokens)?r.reasoning_tokens:0),0),cached_input_tokens_subset:used.reduce((n,r)=>n+(Number.isFinite(r.cached_tokens)?r.cached_tokens:0),0),failed_model_receipts:models.filter(r=>r.status!==200).length,length_finished_model_receipts:models.filter(r=>r.finish_reason==='length').length,automatic_retries:models.reduce((n,r)=>n+(r.automatic_retries||0),0)};
}
for (const [p,x] of parsed) {
  if (p.endsWith('/events.json') && Array.isArray(x)) {
    externalEvents.files++; externalEvents.events += x.length; const seen=new Map(); const d={path:p,events:x.length,failed:[],malformed:[],repeats:[]};
    x.forEach((e,i)=>{ inc(externalEvents.tool_counts,String(e?.tool)); if(!e?.arguments||typeof e.arguments!=='object'||Array.isArray(e.arguments)){externalEvents.malformed_arguments++;d.malformed.push({event_index:i,kind:'arguments'});} if(!e?.result||typeof e.result!=='object'||Array.isArray(e.result)){externalEvents.malformed_results++;d.malformed.push({event_index:i,kind:'result'});} else if(e.result.ok===false){externalEvents.failed_results++;d.failed.push({event_index:i,step:e.step,tool:e.tool,error_code:e.result.error?.code||e.result.code||null});} const sig=JSON.stringify([e?.tool,e?.arguments]); if(seen.has(sig)){externalEvents.repeated_exact_calls++;d.repeats.push({event_index:i,prior_event_index:seen.get(sig),step:e.step,tool:e.tool});} else seen.set(sig,i); });
    if(d.failed.length||d.malformed.length||d.repeats.length) externalEvents.details.push(d);
  }
  if (p.startsWith('implementation/agent-reasoning-engine/benchmarks/external-context-v1/') && p.endsWith('/result.json') && Array.isArray(x?.receipts)) {
    canonicalAttempts.push({attempt_kind:'external-context-live',execution_class:executionClass(p),path:p,status:x.status,patch_produced:x.patch_produced,declared_model_attempts:x.model_attempts,declared_tokenizer_attempts:x.tokenizer_attempts,events_path:p.replace(/result\.json$/,'events.json'),...receiptSummary(x.receipts)});
  }
  if (p.includes('/glm-episodes-v1/analysis/provider-study-v1/') && p.endsWith('/result.json') && Array.isArray(x?.receipts)) {
    canonicalAttempts.push({attempt_kind:'provider-study-result',execution_class:executionClass(p),path:p,status:x.status,qualified:x.qualified??null,...receiptSummary(x.receipts)});
  }
}

const visible = {files:0,episodes:0,history_exchanges:0,tool_calls:0,observations:0,tool_counts:{},failed_observations:0,malformed_call_arguments:0,call_observation_count_mismatches:0,duplicate_call_ids_within_exchange:0,status_counts:{},terminal_phase_counts:{},details:[]};
for (const [p,x] of parsed) if (p.endsWith('/visible-trace.json') && x && typeof x==='object' && !Array.isArray(x)) {
  visible.files++; visible.episodes++; inc(visible.status_counts,String(x.status)); inc(visible.terminal_phase_counts,String(x.recycling?.phase)); const d={path:p,failed:[],malformed:[],mismatches:[],duplicates:[]};
  for (const [hi,h] of (Array.isArray(x.history)?x.history:[]).entries()) {
    visible.history_exchanges++; const calls=Array.isArray(h.calls)?h.calls:[], obs=Array.isArray(h.observations)?h.observations:[]; visible.tool_calls+=calls.length; visible.observations+=obs.length;
    if(calls.length!==obs.length && obs.length){visible.call_observation_count_mismatches++;d.mismatches.push({history_index:hi,calls:calls.length,observations:obs.length});}
    const ids=new Set(); calls.forEach((c,ci)=>{inc(visible.tool_counts,String(c?.name));if(!c?.arguments||typeof c.arguments!=='object'||Array.isArray(c.arguments)){visible.malformed_call_arguments++;d.malformed.push({history_index:hi,call_index:ci,tool:c?.name});} if(c?.id&&ids.has(c.id)){visible.duplicate_call_ids_within_exchange++;d.duplicates.push({history_index:hi,call_index:ci,call_id:c.id});} ids.add(c?.id);});
    obs.forEach((o,oi)=>{if(o?.ok===false){visible.failed_observations++;d.failed.push({history_index:hi,observation_index:oi,tool:o?.tool_name,error_code:o?.error?.code||o?.code||null});}});
  }
  if(d.failed.length||d.malformed.length||d.mismatches.length||d.duplicates.length) visible.details.push(d);
  if(Array.isArray(x.receipts)) canonicalAttempts.push({attempt_kind:'glm-episode-visible-trace',execution_class:executionClass(p),path:p,status:x.status,completion_gate:x.completion_gate?.status||x.completion_gate?.passed||null,history_exchanges:Array.isArray(x.history)?x.history.length:0,...receiptSummary(x.receipts)});
}

const fitting={files:0,rows:0,started_rows:0,completed_rows:0,attempts:[]};
for(const [p,x] of parsed) if(p.includes('/glm-fitting-v1/evidence/')&&p.endsWith('.jsonl')&&Array.isArray(x)){
  fitting.files++; fitting.rows+=x.length; for(const row of x){if(row.status==='started')fitting.started_rows++; if(row.status==='completed'){fitting.completed_rows++; const usage=row.response?.usage||{}; const tr=Array.isArray(row.response?.transport_receipts)?row.response.transport_receipts:[]; fitting.attempts.push({attempt_kind:'glm-fitting-completed-row',execution_class:executionClass(p),path:p,invocation_id:row.invocation_id,task_id:row.task_id,status:row.status,passed:row.score?.passed??null,finish_reason:row.response?.finish_reason??null,input_tokens:Number.isFinite(usage.input_tokens)?usage.input_tokens:null,output_tokens:Number.isFinite(usage.output_tokens)?usage.output_tokens:null,reasoning_tokens_subset:Number.isFinite(usage.reasoning_tokens)?usage.reasoning_tokens:null,cached_input_tokens_subset:Number.isFinite(usage.cached_tokens)?usage.cached_tokens:null,transport_receipts:tr.length});}}
}

const totals={attempts:canonicalAttempts.length+fitting.attempts.length,model_receipts:0,usage_complete_model_receipts:0,input_tokens:0,output_tokens:0,total_model_tokens:0,reasoning_tokens_subset:0,cached_input_tokens_subset:0,failed_model_receipts:0,length_finished_model_receipts:0};
for(const a of canonicalAttempts){for(const k of ['model_receipts','usage_complete_model_receipts','input_tokens','output_tokens','reasoning_tokens_subset','cached_input_tokens_subset','failed_model_receipts','length_finished_model_receipts'])totals[k]+=a[k]||0;}
for(const a of fitting.attempts){totals.model_receipts++;if(Number.isFinite(a.input_tokens)&&Number.isFinite(a.output_tokens)){totals.usage_complete_model_receipts++;totals.input_tokens+=a.input_tokens;totals.output_tokens+=a.output_tokens;totals.reasoning_tokens_subset+=a.reasoning_tokens_subset||0;totals.cached_input_tokens_subset+=a.cached_input_tokens_subset||0;}}
totals.total_model_tokens=totals.input_tokens+totals.output_tokens; totals.missing_usage_model_receipts=totals.model_receipts-totals.usage_complete_model_receipts;
const tokenByExecutionClass={};
for(const a of [...canonicalAttempts,...fitting.attempts]){const k=a.execution_class;tokenByExecutionClass[k]||={attempts:0,model_receipts:0,usage_complete_model_receipts:0,input_tokens:0,output_tokens:0,total_model_tokens:0,missing_usage_model_receipts:0};const z=tokenByExecutionClass[k];z.attempts++;const mr=a.model_receipts??1;const ur=a.usage_complete_model_receipts??((Number.isFinite(a.input_tokens)&&Number.isFinite(a.output_tokens))?1:0);z.model_receipts+=mr;z.usage_complete_model_receipts+=ur;z.missing_usage_model_receipts+=mr-ur;z.input_tokens+=a.input_tokens||0;z.output_tokens+=a.output_tokens||0;z.total_model_tokens=z.input_tokens+z.output_tokens;}

const tokenByStudy={}; for(const a of [...canonicalAttempts,...fitting.attempts]){const k=`${familyOf(a.path)}/${studyOf(a.path)}`;tokenByStudy[k]||={attempts:0,model_receipts:0,usage_complete_model_receipts:0,input_tokens:0,output_tokens:0,total_model_tokens:0,cached_input_tokens_subset:0,reasoning_tokens_subset:0};const z=tokenByStudy[k];z.attempts++;z.model_receipts+=a.model_receipts??1;z.usage_complete_model_receipts+=a.usage_complete_model_receipts??((Number.isFinite(a.input_tokens)&&Number.isFinite(a.output_tokens))?1:0);z.input_tokens+=a.input_tokens||0;z.output_tokens+=a.output_tokens||0;z.cached_input_tokens_subset+=a.cached_input_tokens_subset||0;z.reasoning_tokens_subset+=a.reasoning_tokens_subset||0;z.total_model_tokens=z.input_tokens+z.output_tokens;}

const parseErrors=files.filter(f=>/parse-error|with-errors/.test(f.content_status)).map(f=>({path:f.path,status:f.content_status,error:f.parse_error||null,bad_lines:f.jsonl_bad_lines||0}));
const inventory={schema_version:'are.experiment-trace-coverage/v1',generated_at:new Date().toISOString(),root:rel(root),scope_notes:['All regular files were byte-read and SHA-256 hashed without following symlinks.','JSON and JSONL outside dependency/cache trees were parsed; text was keyword-scanned or structure-read.','Semantic aggregation selects canonical attempt representations: external-context result.json receipts, GLM visible-trace receipts, and completed glm-fitting JSONL rows. Copies such as captures/responses/checkpoints are inventoried but excluded from token totals.','Shared request digests do not collapse attempts; attempt identity is path plus episode/invocation.'],totals:{files:files.length,symlinks:links.length,bytes:files.reduce((n,f)=>n+f.bytes,0),unique_content_hashes:hashGroups.size,duplicate_content_groups:duplicateGroups.length,parse_errors:parseErrors.length},families,studies,links,files,duplicate_groups:duplicateGroups,parse_errors:parseErrors};
const aggregates={schema_version:'are.experiment-trace-aggregates/v1',generated_at:new Date().toISOString(),denominators:{inventory_files:files.length,external_event_files:externalEvents.files,external_events:externalEvents.events,glm_visible_trace_files:visible.files,glm_history_exchanges:visible.history_exchanges,glm_tool_calls:visible.tool_calls,canonical_attempts:totals.attempts,model_receipts:totals.model_receipts},external_events:externalEvents,glm_visible_traces:visible,glm_fitting:fitting,canonical_attempts:canonicalAttempts,token_accounting:{method:'Sum input_tokens + output_tokens once per canonical dispatched model receipt or completed fitting invocation. cached_tokens and reasoning_tokens are reported as subsets and are not added again. Repeated presentations remain included in each request input. Missing usage remains unknown. Live/provider, offline-scripted, and offline-synthetic totals remain separate.',totals,by_execution_class:tokenByExecutionClass,by_study:tokenByStudy}};
fs.writeFileSync(path.join(out,'coverage.json'),JSON.stringify(inventory,null,2)+'\n');
fs.writeFileSync(path.join(out,'aggregates.json'),JSON.stringify(aggregates,null,2)+'\n');
console.log(JSON.stringify({coverage:inventory.totals,families:Object.fromEntries(Object.entries(families).map(([k,v])=>[k,{files:v.files,bytes:v.bytes,studies:v.studies.length}])),denominators:aggregates.denominators,tokens:totals,external:{failed:externalEvents.failed_results,malformed:externalEvents.malformed_arguments+externalEvents.malformed_results,repeats:externalEvents.repeated_exact_calls},visible:{failed:visible.failed_observations,malformed:visible.malformed_call_arguments,mismatches:visible.call_observation_count_mismatches,duplicate_ids:visible.duplicate_call_ids_within_exchange}},null,2));
