import {projectPagedFiles} from './paging.mjs';
import {hash,need,stable} from './transport.mjs';

export function validateCompletionPolicy(value='none') {
 need(['none','budget-aware-v1','bounded-execution-v2','explicit-finalization-v3','patch-contract-v4','compact-contract-v5','deduplicated-state-v6','reserved-headroom-v7','verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(value),'completion-policy-invalid');return value;
}
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const id=value=>typeof value==='string'&&value.length>0&&value.length<=256&&!value.includes('\0');
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const splitPair=(text,position)=>position>0&&position<text.length&&/[\uD800-\uDBFF]/.test(text[position-1])&&/[\uDC00-\uDFFF]/.test(text[position]);

function mergeRanges(ranges) {
 const merged=[];
 for(const [start,end] of ranges.sort((a,b)=>a[0]-b[0]||a[1]-b[1])) {
  const last=merged.at(-1);
  if(last&&start<=last[1])last[1]=Math.max(last[1],end);else merged.push([start,end]);
 }
 return merged;
}

// Pure projection of the verified run ledger; no source reads or mutable store.
// Delivery is supplied by the dispatch-bound delivery projector, never inferred
// from a tool having executed or from an attempted/discarded prompt projection.
export function projectCompletionState({history,receipts,maximum_requests,base,observation_allowlist,delivery_progress,recycled=false,archive_recovery_seen_or_present=false,paged=false,history_limit=12}) {
 need([12,16].includes(history_limit),'completion-budget-invalid');
 need(typeof recycled==='boolean'&&typeof archive_recovery_seen_or_present==='boolean','completion-recovery-invalid');
 need(integer(maximum_requests)&&maximum_requests>=1&&maximum_requests<=history_limit,'completion-budget-invalid');
 need(Array.isArray(history)&&history.length<=history_limit&&Array.isArray(receipts)&&receipts.length<=history_limit*3,'completion-ledger-invalid');
 need(receipts.every(receipt=>receipt&&['model','tokenizer'].includes(receipt.kind)),'completion-ledger-invalid');
 const modelCount=receipts.filter(receipt=>receipt.kind==='model').length,tokenizerCount=receipts.length-modelCount;
 need(modelCount<=maximum_requests&&tokenizerCount<=maximum_requests*2&&history.length<=modelCount,'completion-budget-invalid');
 need(base?.files&&typeof base.files==='object'&&!Array.isArray(base.files)&&Array.isArray(observation_allowlist)
  &&observation_allowlist.length<=24&&new Set(observation_allowlist).size===observation_allowlist.length
  &&observation_allowlist.every(path=>typeof path==='string'&&path.length>0&&sha(base.files[path])),'completion-scope-invalid');
 const delivered=delivery_progress?.delivered_call_ids,unknown=delivery_progress?.delivery_unknown_call_ids??[];
 need(Array.isArray(delivered)&&delivered.length<=24&&delivered.every(id)&&new Set(delivered).size===delivered.length
  &&Array.isArray(unknown)&&unknown.length<=24&&unknown.every(id)&&new Set(unknown).size===unknown.length
  &&delivered.every(value=>!unknown.includes(value)),'completion-delivery-invalid');
 const calls=new Map();
 for(const [turn,entry] of history.entries()) {
  need(entry&&typeof entry==='object'&&!Array.isArray(entry),'completion-ledger-invalid');
  if(entry.calls===undefined)continue;
  need(Array.isArray(entry.calls)&&entry.calls.length<=8&&Array.isArray(entry.observations)&&entry.observations.length===entry.calls.length,'completion-ledger-invalid');
  for(const [index,call] of entry.calls.entries()) {
   const observation=entry.observations[index];
   need(call&&id(call.id)&&typeof call.name==='string'&&!calls.has(call.id)&&observation&&typeof observation.ok==='boolean'
    &&!(observation.deferred===true&&observation.ok),'completion-ledger-invalid');
   calls.set(call.id,{call,observation,turn});
  }
 }
 need(calls.size<=24,'completion-budget-invalid');
 const readNames=['read-file','read-context-evidence','read-inspection-evidence'];
 for(const value of [...delivered,...unknown])need(calls.has(value)&&calls.get(value).observation.ok===true
  &&readNames.includes(calls.get(value).call.name),'completion-delivery-invalid');
 const confirmed=new Set(delivered),sources=new Map(),files=new Map();
 for(const [callId,{call,observation,turn}] of calls)if(call.name==='read-file'&&observation.ok) {
  if(observation.output?.paged===true){need(paged,'completion-source-invalid');continue;}
  const path=call.arguments?.path,output=observation.output;
  need(observation_allowlist.includes(path)&&output?.path===path&&output.sha256===base.files[path]
   &&typeof output.utf8==='string'&&hash(output.utf8)===base.files[path],'completion-source-invalid');
  sources.set(callId,{path,sha256:output.sha256,text:output.utf8,turn});
  if(!files.has(path))files.set(path,{path,sha256:output.sha256,total_chars:output.utf8.length,
   full_file_delivered:false,delivered_ranges:[],eof_received:false});
  if(confirmed.has(callId))files.get(path).full_file_delivered=true;
 }
 for(const [callId,{call,observation,turn}] of calls)if(call.name==='read-inspection-evidence'&&observation.ok) {
  const output=observation.output,source=sources.get(call.arguments?.call_id);
  need(source&&source.turn<turn&&output?.call_id===call.arguments.call_id&&output.path===source.path
   &&output.sha256===source.sha256&&output.total_chars===source.text.length&&output.offset_unit==='utf16-code-units',
  'completion-archive-source-invalid');
  const offset=call.arguments.offset??0,maxChars=call.arguments.max_chars??1024;
  need(integer(offset)&&offset<=source.text.length&&integer(maxChars)&&maxChars>=1&&maxChars<=1024,'completion-archive-range-invalid');
  let end=Math.min(source.text.length,offset+maxChars);if(splitPair(source.text,end))end--;
  need(!splitPair(source.text,offset)&&(end>offset||offset===source.text.length)
   &&output.offset===offset&&output.next_offset===end&&output.utf8===source.text.slice(offset,end)
   &&typeof output.eof==='boolean'&&output.eof===(end===source.text.length),'completion-archive-range-invalid');
  if(!confirmed.has(callId))continue;
  const file=files.get(source.path);
  if(end>offset)file.delivered_ranges.push([offset,end]);
  if(output.eof)file.eof_received=true;
 }
 const pageFiles=paged?projectPagedFiles(history,base.files,confirmed,typeof paged==='number'?paged:5000):[];
 for(const f of pageFiles)files.set(f.path,f);
 const remaining_model_turns=maximum_requests-modelCount;
 const reading_turns_remaining=Math.min(24-calls.size,Math.max(0,remaining_model_turns-(paged?1:3)));
 const recoverySource=[...sources.entries()].filter(([,source])=>source.text.length>0)
  .sort((a,b)=>a[1].text.length-b[1].text.length||a[1].path.localeCompare(b[1].path)||a[0].localeCompare(b[0]))[0];
 const suggested_archive_read=recycled&&!archive_recovery_seen_or_present&&reading_turns_remaining>0&&recoverySource
  ?{name:'read-inspection-evidence',arguments:{call_id:recoverySource[0],offset:0,max_chars:1024}}:null;
 return {remaining_model_turns,remaining_tool_calls:24-calls.size,
  inspection_guidance:{reading_turns_remaining,reserved_synthesis_turns:Math.min(paged?1:3,remaining_model_turns),
   archive_recovery:!recycled?'not-yet-recycled':archive_recovery_seen_or_present?'seen-or-present':'not-seen',
   suggested_archive_read},
  phase:remaining_model_turns>3?'inspect':remaining_model_turns>=2?'synthesize':remaining_model_turns===1?'finalize':'exhausted',
  files:[...files.values()].sort((a,b)=>a.path.localeCompare(b.path)).map(file=>{
   const delivered_ranges=mergeRanges(file.delivered_ranges);let covered=0;
   for(const [start,end] of delivered_ranges){if(start>covered)break;covered=Math.max(covered,end);}
   return {...file,delivered_ranges,first_missing_offset:covered===file.total_chars?null:covered};
  }),authority_effect:'none'};
}


// Only confirmed whole-file delivery can suppress a repeat. Unknown or merely
// rendered results remain eligible for an actual read.
export function repeatReadObservation(call,history,confirmedIds) {
 if(call.name!=='read-file'||call.arguments.offset!==undefined)return null;
 const confirmed=new Set(confirmedIds);
 for(const entry of history)for(const [index,source] of (entry.calls??[]).entries()) {
  const observation=entry.observations?.[index];
  if(source.name==='read-file'&&source.arguments.path===call.arguments.path
   &&confirmed.has(source.id)&&observation?.ok===true&&observation.output?.paged!==true) {
   return {ok:false,deferred:true,reason_codes:['completion.repeat-read-deferred'],
    output:{call_id:call.id,message:'This file was already delivered. No filesystem read executed. Use bounded archive recovery only for missing details, or produce the patch.',
     ...(observation.output.utf8.length?{suggested_archive_read:{name:'read-inspection-evidence',arguments:{call_id:source.id,offset:0,max_chars:1024}}}:{})},authority_effect:'none'};
  }
 }
 return null;
}


export function finalizationDue(policy,maximumRequests,modelCount) {
 validateCompletionPolicy(policy);
 need(integer(maximumRequests)&&maximumRequests>=1&&maximumRequests<=(['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy)?16:12)
  &&integer(modelCount)&&modelCount<=maximumRequests,'completion-budget-invalid');
 if(['paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy))return maximumRequests-modelCount<=1;
 return ['explicit-finalization-v3','patch-contract-v4','compact-contract-v5','deduplicated-state-v6','reserved-headroom-v7','verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy)?maximumRequests-modelCount<=3
  :policy==='bounded-execution-v2'&&maximumRequests-modelCount<=1;
}
export const FINAL_PATCH_REQUEST='Inspection is finished. Answer the original task now with ONLY the JSON patch object specified above, using the exact base and file hashes and complete replacement source. Tools are unavailable. Do not return a progress update or promise to continue. Preserve the original API and unrelated behavior. Do not claim verification you did not perform. If the evidence is insufficient, state that instead of inventing a patch; such a response is not a successful repair.';


// Prompt-only references: the canonical request remains a user message and
// persisted task state is never changed. Distinct objectives/pending items stay.
export function projectTaskStateForPrompt(state,request) {
 return {...state,...(state.objective===request?{objective:'See original user request.'}:{}),
  ...(Array.isArray(state.pending)?{pending:state.pending.map(item=>item===request?'Original user request remains pending.':item)}:{})};
}

// Contract guidance only; never repairs a response or relaxes candidate parsing.
export const PATCH_CONTRACT_GUIDANCE='For your final answer, return only the JSON patch object. Top-level keys: schema_version, expected_base_tree_sha256, changes, optional rationale, authority_effect. authority_effect is required and must be "none". Each changes item has exactly operation, path, expected_file_sha256, utf8. Put rationale only at the top level; do not add replacement_sha256 or other fields. Copy the supplied hashes exactly. Continue any required archive recovery before finalizing; this reminder does not assert task completion.';

export const COMPACT_PATCH_CONTRACT='Final JSON: only the shown keys. Each change has only operation, path, expected_file_sha256, utf8. rationale belongs at top level; authority_effect must be "none". Complete required recovery first.';

// Pure prompt projection after ledger validation. Never edits durable evidence.
export function omitPromptDigest(record,key,policy) {
 if(!['deduplicated-state-v6','reserved-headroom-v7','verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy))return record;
 const {[key]:redundant,...rest}=record;return rest;
}

export function completionTokenMargin(policy){validateCompletionPolicy(policy);return ['verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy)?512:256;}
export function validateCompletionRequirements(value,allowlist,policy){
 if(!['verified-completion-v8','paged-completion-v9','compact-paging-v10','assembled-paging-v11','budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy)){need(value===undefined,'completion-requirements-policy-invalid');return undefined;}
 need(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>['required_reads','distinct_turns','archive_after_recycle'].includes(k)), 'completion-requirements-invalid');
 need(Array.isArray(value.required_reads)&&value.required_reads.length>0&&value.required_reads.length<=24&&new Set(value.required_reads).size===value.required_reads.length&&value.required_reads.every(p=>typeof p==='string'&&allowlist?.includes(p))&&typeof value.distinct_turns==='boolean'&&typeof value.archive_after_recycle==='boolean','completion-requirements-invalid');
 return structuredClone(value);
}
export function assessCompletionRequirements(requirements,{state,history,recycled,archive_confirmed}){
 const missing_required_reads=requirements.required_reads.filter(path=>!state.files.some(f=>f.path===path&&f.full_file_delivered));
 const turns=requirements.required_reads.map(path=>history.findIndex(e=>(e.calls??[]).some((c,i)=>c.name==='read-file'&&c.arguments?.path===path&&e.observations?.[i]?.ok===true)));
 const distinct_read_turns=!requirements.distinct_turns||(turns.every(n=>n>=0)&&new Set(turns).size===turns.length);
 const archive_recovery_required=requirements.archive_after_recycle&&recycled;
 return {passed:missing_required_reads.length===0&&distinct_read_turns&&(!archive_recovery_required||archive_confirmed),missing_required_reads,distinct_read_turns,archive_recovery_required,archive_recovery_confirmed:archive_confirmed};
}


export function completionBudget(policy,softLimit){
 validateCompletionPolicy(policy);
 if(!['budgeted-paging-v12','page-adherence-v13','final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy))return {maximum_requests:12,maximum_tokenizer_requests:24,request_budget:'standard-v1'};
 need(Number.isSafeInteger(softLimit)&&softLimit>2048,'completion-window-invalid');
 const maximum_requests=softLimit<=8000?16:12;
 return {maximum_requests,maximum_tokenizer_requests:maximum_requests*2,request_budget:maximum_requests===16?'paging-v1':'standard-v1',page_chars:softLimit<=8000?4000:5500,...(['final-latency-v14','synthesis-adherence-v15','native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy)?{final_timeout_ms:60000,...(['native-submission-v16','native-reasoning-v17','minimal-repair-v18','case-evidence-v19','example-fields-v20'].includes(policy)?{native_submission:true,...(policy==='native-reasoning-v17'?{final_reasoning_effort:'high'}:{})}:{})}:{})};
}
export function minimumCompletionTurns(requirements,state,{page_chars,recycled,archive_confirmed}){
 let reads=0;
 for(const path of requirements.required_reads){const f=state.files.find(f=>f.path===path);if(f?.full_file_delivered)continue;
  reads+=f?Math.max(1,Math.ceil((f.total_chars-(f.first_missing_offset??0))/page_chars)):1;
 }
 return reads+1+Number(requirements.archive_after_recycle&&recycled&&!archive_confirmed);
}

// Final prompt guidance only. Hashes come from the verified base; no oracle data.
export function synthesisContract(base,mutationAllowlist) {
 need(sha(base?.tree_sha256)&&Array.isArray(mutationAllowlist)&&mutationAllowlist.length>0&&mutationAllowlist.every(path=>sha(base.files?.[path])),'synthesis-base-invalid');
 return [
  'Before answering, compare the replacement code against every inspected requirement, one by one. Check valid and invalid inputs, boundary cases, and unchanged API behavior. Resolve contradictions before emitting the patch. This review is not executed verification; do not claim tests ran.',
  'Return only the following JSON structure. Copy the field names and hashes exactly; replace COMPLETE_REPLACEMENT_SOURCE with complete file contents and omit change entries for files you do not need to modify. Keep schema_version and authority_effect. No markdown or additional fields.',
  stable({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:mutationAllowlist.map(path=>({operation:'replace-file',path,expected_file_sha256:base.files[path],utf8:'COMPLETE_REPLACEMENT_SOURCE'})),authority_effect:'none'})
 ].join('\n');
}
