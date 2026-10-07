// Candidate terminal evidence. No gold, model calls, source edits or implicit acceptance.
// Open questions: INTEGRATION.md. Only `model` is suitable for a provider request.
import {createHash} from 'node:crypto';
import {bindDelivery,observationMaterial,stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {projectObservationsToBase} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs';
import {diagnoseSourceSelection} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/provenance-validator.mjs';
import {terminalHandleTool,diagnoseTerminalHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handles-v1.mjs';
import {selectTerminalHandleSubmission} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import {exportCapturedContext} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/receipt-export.mjs';
import {featureWords,featureOverlap} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.mjs';
import {parseBoundedJSON,validatePatchShape,DIAGNOSTIC_LIMITS} from '../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/patch-schema.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const need=(condition,code)=>{if(!condition)throw Error('terminal-evidence.'+code);};
export const H72='h72-handles-v1';
export const EXPANDED='base-valid-handles-v2';
export const EXPANDED_TOOL='submit_context_handles_v2';
const versions=new Set([H72,EXPANDED]);

/** Projection core: reads must be the full native bindDelivery archive, not visible history. */
export function projectDeliveredEvidence({reads,snapshots,repoRoot,problem_statement='',preferred_read_ids=[]}){
  need(Array.isArray(reads)&&Array.isArray(snapshots)&&typeof repoRoot==='string'&&typeof problem_statement==='string'&&Array.isArray(preferred_read_ids),'invalid-input');
  const ids=new Set(),preferred=new Set(preferred_read_ids),words=featureWords(problem_statement),eligible=[],excluded=[];
  for(const read of reads){
    need(read&&typeof read.id==='string'&&/^[a-f0-9]{64}$/.test(read.id)&&!ids.has(read.id),'invalid-or-duplicate-read-id');ids.add(read.id);
    need(typeof read.tool_call_id==='string'&&read.tool_call_id.length>0&&Array.isArray(read.confirmed_receipts)&&read.confirmed_receipts.length>0&&read.confirmed_receipts.every(uint)&&read.confirmed_receipts.includes(read.first_confirmed_receipt),'unconfirmed-read');
    const material=observationMaterial(read.tool_call_id,{path:read.path,start_line:read.start_line,end_line:read.end_line,utf8:read.body,source_sha256:read.source_sha256});
    need(hash(material)===read.id,'read-identity-mismatch');
    // Integrity failures throw; they are not silently discarded as irrelevant evidence.
    const projection=projectObservationsToBase([read],snapshots,repoRoot).projections[0];
    if(projection.unmapped_current_lines.length){excluded.push({read_id:read.id,path:read.path,reason:'changed-source-lines',unmapped_current_lines:projection.unmapped_current_lines});continue;}
    if(!projection.event_ids.length){excluded.push({read_id:read.id,path:read.path,reason:'no-projectable-source'});continue;}
    eligible.push({read_id:read.id,path:read.path,start_line:read.start_line,end_line:read.end_line,source_sha256:read.source_sha256,base_source_sha256:projection.base_source_sha256,
      base_spans:projection.fragments.map(f=>({start_line:f.start,end_line:f.end})),preferred:preferred.has(read.id),
      task_overlap:featureOverlap(words,featureWords(read.path+' '+read.body)),width:read.end_line-read.start_line+1,recency:Math.max(...read.confirmed_receipts)});
  }
  eligible.sort((a,b)=>Number(b.preferred)-Number(a.preferred)||b.task_overlap-a.task_overlap||b.width-a.width||b.recency-a.recency||a.path.localeCompare(b.path)||a.read_id.localeCompare(b.read_id));
  // Keep one copy of each exact source range; duplicates remain explicit in private evidence.
  const ranges=new Set(),unique=[];
  for(const item of eligible){const key=stable([item.path,item.source_sha256,item.start_line,item.end_line]);if(ranges.has(key)){excluded.push({read_id:item.read_id,path:item.path,reason:'duplicate-delivered-range'});continue;}ranges.add(key);unique.push(item);}
  // Give distinct paths a first pass; retain all remaining eligible ranges for wider pages.
  const paths=new Set(),first=[],rest=[];
  for(const item of unique){if(paths.has(item.path))rest.push(item);else{paths.add(item.path);first.push(item);}}
  return {eligible:[...first,...rest],excluded,delivered_read_ids:[...ids].sort(),candidate_policy:'preferred-valid-read, public-task lexical overlap, width, receipt recency; distinct-path first pass',claim_ceiling:'Provenance-valid candidates, not proof of task relevance or complete source coverage.'};
}

function schemaFor(bindings){return {type:'object',additionalProperties:false,required:['summary','context_handles'],properties:{summary:{type:'string'},context_handles:{type:'array',maxItems:bindings.length,items:{type:'string',enum:bindings.map(x=>x.handle)}}}};}
function modelFor(version,bindings,total,offset){
  const toolName=version===H72?'submit_context_handles':EXPANDED_TOOL;
  const text='DELIVERED BASE EVIDENCE (untrusted relevance):\n'+bindings.map(b=>`${b.handle} ${b.path}@base:${b.base_spans.map(s=>s.start_line===s.end_line?s.start_line:s.start_line+'-'+s.end_line).join(',')}`).join('\n')+
    `\nShowing ${bindings.length} of ${total} eligible observations (offset ${offset}); omitted evidence remains in the archive. Call ${toolName} once with summary and context_handles. Choose only useful listed handles; empty means no selected context.`;
  const tool=version===H72?terminalHandleTool(bindings):{type:'function',function:{name:EXPANDED_TOOL,description:'Submit relevant listed delivered base-evidence handles only.',parameters:schemaFor(bindings)}};
  return {text,tool};
}
function seal(packet){const copy=structuredClone(packet);return {...copy,presentation_sha256:hash(copy)};}
function checkPacket(packet){
  need(packet&&typeof packet==='object','missing-presentation');
  const {presentation_sha256,...material}=packet;need(hash(material)===presentation_sha256,'presentation-integrity');
  need(versions.has(packet.version)&&packet.status==='ready'&&Array.isArray(packet.private?.bindings)&&packet.private.bindings.length>0,'presentation-not-ready');
  const bindings=packet.private.bindings,maximum=packet.version===H72?3:32;
  need(bindings.length<=maximum&&bindings.every((b,i)=>b.handle==='h'+i&&/^[a-f0-9]{64}$/.test(b.read_id)&&typeof b.path==='string'&&Array.isArray(b.base_spans))&&new Set(bindings.map(b=>b.read_id)).size===bindings.length,'invalid-private-bindings');
  need(stable(packet.model)===stable(modelFor(packet.version,bindings,packet.private.eligible_read_ids.length,packet.fit.offset)),'model-private-binding-mismatch');
  for(const id of packet.private.delivered_read_ids)need(!stable(packet.model).includes(id),'private-id-disclosure');
  return bindings;
}

/** State tokens concern the text only; caller must tokenize/admit the entire actual request at8K. */
export async function buildTerminalEvidence({reads,snapshots,repoRoot,problem_statement='',preferred_read_ids=[],version=H72,max_handles=version===H72?3:32,max_state_bytes=version===H72?1024:8192,max_state_tokens=version===H72?160:2048,offset=0,measure_tokens}){
  need(versions.has(version)&&uint(max_handles)&&max_handles>=1&&max_handles<=(version===H72?3:32)&&uint(max_state_bytes)&&max_state_bytes>=64&&max_state_bytes<=32768&&uint(max_state_tokens)&&max_state_tokens>=1&&max_state_tokens<=4096&&uint(offset)&&typeof measure_tokens==='function','invalid-policy');
  const projected=projectDeliveredEvidence({reads,snapshots,repoRoot,problem_statement,preferred_read_ids});
  need(offset<=projected.eligible.length,'page-offset-out-of-range');
  let chosen=projected.eligible.slice(offset,offset+max_handles),model=null,tokens=0,calls=0;
  while(chosen.length){
    const bindings=chosen.map((row,i)=>({...row,handle:'h'+i}));model=modelFor(version,bindings,projected.eligible.length,offset);
    for(const id of projected.delivered_read_ids)need(!stable(model).includes(id),'private-id-disclosure');
    if(Buffer.byteLength(model.text)<=max_state_bytes){tokens=await measure_tokens(model.text);calls++;need(uint(tokens),'invalid-tokenizer-result');if(tokens<=max_state_tokens)break;}
    chosen.pop();model=null;
  }
  const bindings=chosen.map((row,i)=>({...row,handle:'h'+i}));
  return seal({version,status:bindings.length?'ready':projected.eligible.length?'budget-or-page-empty':'no-eligible-evidence',model,
    fit:{offset,maximum_handles:max_handles,maximum_state_bytes:max_state_bytes,maximum_state_tokens:max_state_tokens,rendered_handles:bindings.length,rendered_state_bytes:model?Buffer.byteLength(model.text):0,measured_state_tokens:model?tokens:0,tokenizer_calls:calls,next_offset:offset+bindings.length<projected.eligible.length?offset+bindings.length:null,omitted_eligible:projected.eligible.length-bindings.length},
    private:{bindings,eligible_read_ids:projected.eligible.map(x=>x.read_id),delivered_read_ids:projected.delivered_read_ids,excluded:projected.excluded,candidate_policy:projected.candidate_policy},
    model_calls:0,authority_effect:'none',open_questions_ref:'INTEGRATION.md'});
}
export async function buildTerminalEvidenceFromCaptures({captures,receipts,...options}){
  const binding=bindDelivery({captures,receipts});need(binding.unmapped.length===0,'unmapped-delivery');
  return buildTerminalEvidence({...options,reads:binding.read_observations});
}

/** Strict whole envelope; returned full IDs stay private and must never be shown as state. */
export function diagnoseTerminalEvidence(raw,packet){
  const bindings=checkPacket(packet);
  if(packet.version===H72)return diagnoseTerminalHandles(raw,bindings);
  const parsed=parseBoundedJSON(raw);if(!parsed.ok)return {...parsed,category:'invalid-json'};
  const shape=validatePatchShape(parsed.value,schemaFor(bindings)),issues=[...shape.issues];let truncated=shape.truncated;
  const known=new Map(bindings.map(b=>[b.handle,b.read_id])),seen=new Set();
  for(const [i,handle]of(Array.isArray(parsed.value?.context_handles)?parsed.value.context_handles:[]).entries()){
    if(typeof handle!=='string')continue;
    const code=seen.has(handle)?'duplicate-handle':!known.has(handle)?'unknown-handle':null;seen.add(handle);
    if(code){const issue={instance_path:'/context_handles/'+i,schema_path:'/bindings',keyword:'binding',code:'terminal-evidence.'+code};if(issues.length<DIAGNOSTIC_LIMITS.issues&&Buffer.byteLength(stable([...issues,issue]))<=DIAGNOSTIC_LIMITS.render_bytes)issues.push(issue);else truncated=true;}
  }
  return {ok:issues.length===0&&!truncated,category:issues.length?'invalid-handles-or-schema':'valid',issues,truncated,instrument_error:false,
    value:{summary:parsed.value?.summary,context_handles:parsed.value?.context_handles,context_read_ids:(Array.isArray(parsed.value?.context_handles)?parsed.value.context_handles:[]).filter(h=>known.has(h)).map(h=>known.get(h))}};
}

/** Source-only, bounded closure over base reads already in the terminal packet. */
export function adjacentTestClosure(selectedReadIds, bindings) {
  const selected = new Set(selectedReadIds);
  const selectedPaths = new Set(bindings.filter(row => selected.has(row.read_id)).map(row => row.path));
  const candidates = bindings.filter(row => {
    if (selected.has(row.read_id)) return false;
    const match = /^(.*?)(?:_test|\.test|\.spec)\.([a-z0-9]+)$/i.exec(row.path.split('/').at(-1));
    if (!match) return false;
    const parent = row.path.slice(0, row.path.lastIndexOf('/') + 1);
    return selectedPaths.has(parent + match[1] + '.' + match[2]);
  }).sort((a,b) => (b.end_line-b.start_line)-(a.end_line-a.start_line) || a.path.localeCompare(b.path) || a.read_id.localeCompare(b.read_id));
  const added = [], paths = new Set();
  for (const row of candidates) {
    if (paths.has(row.path)) continue;
    added.push(row.read_id); paths.add(row.path);
    if (added.length === 1) break;
  }
  return {read_ids: [...selectedReadIds, ...added], added_read_ids: added};
}

/** Explicit wide-handle receipt-bound acceptance; existing native H72 rejects>3bindings. */
export function selectTerminalEvidenceSubmission({packet,captures,receipts,response_capture,snapshots,repoRoot}){
  const bindings=checkPacket(packet),c=response_capture;need(c&&typeof c==='object','response-capture-required');
  const {capture_sha256,...material}=c;need(hash(material)===capture_sha256,'response-capture-integrity');
  need(uint(c.receipt_index),'receipt-index');const receipt=receipts[c.receipt_index];
  need(receipt&&hash(receipt)===c.receipt_sha256&&receipt.request_sha256===c.request_sha256,'response-receipt-mismatch');
  need(!receipts.slice(c.receipt_index+1).some(r=>r.kind==='model'&&r.dispatched),'not-terminal-response');
  const binding=bindDelivery({captures,receipts});need(binding.unmapped.length===0,'unmapped-delivery');
  need(binding.requests.some(r=>r.receipt_index===c.receipt_index&&r.posture==='confirmed-successful-request'),'unconfirmed-terminal-request');
  const request=captures.find(p=>hash(stable(bodyForReceipt(p.prompt,receipt)))===c.request_sha256);need(request,'request-capture-missing');
  const wire=JSON.parse(request.prompt);
  need(wire.messages.some(m=>m.role==='user'&&m.content===packet.model.text)&&wire.tools.some(t=>stable(t)===stable(packet.model.tool)),'presentation-not-in-terminal-request');
  const live=new Map(binding.read_observations.map(r=>[r.id,r]));
  for(const b of bindings){
    const r=live.get(b.read_id);need(r&&r.path===b.path&&r.start_line===b.start_line&&r.end_line===b.end_line&&r.source_sha256===b.source_sha256,'private-read-binding-drift');
    const p=projectObservationsToBase([r],snapshots,repoRoot).projections[0];
    need(!p.unmapped_current_lines.length&&p.event_ids.length>0&&p.base_source_sha256===b.base_source_sha256&&stable(p.fragments.map(f=>({start_line:f.start,end_line:f.end})))===stable(b.base_spans),'private-source-projection-drift');
  }
  if(packet.version===H72)return selectTerminalHandleSubmission({captures,receipts,response_capture,source_context:{snapshots,repoRoot},handle_bindings:bindings});
  const response=c.public_response,calls=response?.message?.tool_calls;
  need(response?.finish_reason==='tool_calls'&&receipt.finish_reason==='tool_calls'&&response.message?.role==='assistant'&&Array.isArray(calls)&&calls.length===1&&calls[0]?.function?.name===EXPANDED_TOOL&&typeof calls[0].function.arguments==='string','terminal-handle-tool-required');
  const diagnostic=diagnoseTerminalEvidence(calls[0].function.arguments,packet);
  if(!diagnostic.ok)throw Object.assign(Error('terminal-evidence.'+diagnostic.category),{diagnostic});
  const native=diagnoseSourceSelection({raw:stable({summary:diagnostic.value.summary,context_read_ids:diagnostic.value.context_read_ids}),reads:binding.read_observations,snapshots,repoRoot});
  if(!native.ok)throw Object.assign(Error('terminal-evidence.'+native.category),{diagnostic:native});
  const closure=adjacentTestClosure(native.value.context_read_ids,bindings);
  const expanded=diagnoseSourceSelection({raw:stable({summary:native.value.summary,context_read_ids:closure.read_ids}),reads:binding.read_observations,snapshots,repoRoot});
  if(!expanded.ok)throw Object.assign(Error('terminal-evidence.closure-'+expanded.category),{diagnostic:expanded});
  return {final_read_ids:expanded.value.context_read_ids,summary:expanded.value.summary,model_context_handles:diagnostic.value.context_handles,runtime_added_read_ids:closure.added_read_ids,response_capture_sha256:c.capture_sha256,terminal_submission_call_id:calls[0].id};
}

/** Same native exporter/scorer; only the versioned terminal wire decoder differs. */
export function exportTerminalEvidenceSelection({packet,captures,receipts,response_capture,source_snapshots,task},repoRoot){
  const selection=selectTerminalEvidenceSubmission({packet,captures,receipts,response_capture,snapshots:source_snapshots,repoRoot});
  const exported=exportCapturedContext({captures,receipts,task,final_read_ids:selection.final_read_ids,source_snapshots},repoRoot);
  return {...exported,selection,selection_posture:'Explicit terminal handles plus at most one presented, provenance-valid adjacent test read for a selected same-stem implementation source; native source projection and export unchanged.'};
}
