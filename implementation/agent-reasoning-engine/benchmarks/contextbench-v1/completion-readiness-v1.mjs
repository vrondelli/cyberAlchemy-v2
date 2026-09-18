// Observable, gold-blind state for the transition from candidate effect to completion.
import {createHash} from 'node:crypto';
import {bodyForReceipt,stable} from './delivery.mjs';
import {evidenceSlateCandidates} from './evidence-slate-v2.mjs';
const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex'),uint=value=>Number.isSafeInteger(value)&&value>=0;

export function confirmedToolResults({captures,receipt}){
  if(!Array.isArray(captures)||receipt?.kind!=='model'||receipt.status!==200||!uint(receipt.input_tokens)||!uint(receipt.output_tokens))throw Error('completion-readiness.unconfirmed-receipt');
  const prompts=captures.map(row=>row.prompt).filter(prompt=>{try{return hash(stable(bodyForReceipt(prompt,receipt)))===receipt.request_sha256;}catch{return false;}});
  if(!prompts.length||new Set(prompts).size!==1)throw Error('completion-readiness.prompt-binding');
  const messages=JSON.parse(prompts[0]).messages,calls=new Map(),results=[];
  for(const message of messages){
    if(message.role==='assistant')for(const call of message.tool_calls??[])calls.set(call.id,call);
    if(message.role!=='tool'||!calls.has(message.tool_call_id))continue;
    const call=calls.get(message.tool_call_id);let args,result;try{args=JSON.parse(call.function.arguments);result=JSON.parse(message.content);}catch{continue;}
    results.push({tool_call_id:message.tool_call_id,name:call.function.name,args,result});
  }
  return results;
}

export function classifyReadinessReceipt({captures,receipt,confirmed_effect}){
  const exchanges=confirmedToolResults({captures,receipt}),effects=exchanges.filter(row=>row.name==='apply_edits'&&row.result?.ok===true&&Array.isArray(row.result.output?.changed_paths)&&row.result.output.changed_paths.length).map(row=>row.result.output.changed_paths).flat();
  const paths=[...new Set([...(confirmed_effect?.affected_paths??[]),...effects])].sort(),effect=effects.length?{receipt_index:null,affected_paths:paths}:confirmed_effect??null;
  if(!confirmed_effect)return {effect,verification:null,exchanges};
  const verification=exchanges.find(row=>row.result?.ok===true&&(row.name==='get_patch'||(['read_file','read-file'].includes(row.name)&&row.args?.revision==='current'&&confirmed_effect.affected_paths.includes(row.args?.path))));
  return {effect,verification:verification?{kind:verification.name==='get_patch'?'patch-observation':'affected-path-current-read',tool_call_id:verification.tool_call_id,path:verification.args?.path??null}:null,exchanges};
}

export async function buildCompletionReadiness({task,captures,receipts,repoRoot,patch,confirmed_effect,confirmed_verification,max_candidates=8,max_bytes=4096,max_tokens=1024,measure_tokens}){
  if(typeof task?.problem_statement!=='string'||!Array.isArray(captures)||!Array.isArray(receipts)||typeof repoRoot!=='string'||typeof patch!=='string'||!Array.isArray(confirmed_effect?.affected_paths)||!confirmed_verification||!uint(max_candidates)||max_candidates<1||!uint(max_bytes)||max_bytes<256||!uint(max_tokens)||max_tokens<1||typeof measure_tokens!=='function')throw Error('completion-readiness.invalid-policy');
  const paths=new Set(confirmed_effect.affected_paths),ranked=evidenceSlateCandidates({task,captures,receipts,repoRoot}).filter(row=>paths.has(row.path)),selected=ranked.slice(0,max_candidates);
  const material={schema_version:'are.contextbench-completion-readiness/v1',posture:'A candidate repository effect and later verification activity were observed. This does not prove semantic correctness.',objective_sha256:hash(task.problem_statement),effect:{affected_paths:[...paths].sort(),patch_sha256:hash(patch),patch_bytes:Buffer.byteLength(patch)},verification:confirmed_verification,admissible_base_evidence:selected.map(({basename:ignored,...row})=>row),unresolved:['Semantic correctness is not established.','Test execution is not established unless a delivered tool result explicitly says so.','Select only delivered pinned-base evidence in the terminal context response.'],recommended_transition:'Perform only the minimum unresolved verification, then submit the required terminal context selection.',authority_effect:'none'};
  let text,measured_tokens=0,tokenizer_calls=0;
  for(;;){text=`COMPLETION READINESS STATE (observable, untrusted, non-authorizing):\n${stable(material)}`;if(Buffer.byteLength(text)<=max_bytes){measured_tokens=await measure_tokens(text);tokenizer_calls++;if(uint(measured_tokens)&&measured_tokens<=max_tokens)break;}if(!material.admissible_base_evidence.length)throw Error('completion-readiness.caps-too-small');material.admissible_base_evidence.pop();}
  return {...material,text,measured_tokens,fit:{maximum_candidates:max_candidates,maximum_bytes:max_bytes,maximum_tokens:max_tokens,tokenizer_calls,retained_candidates:material.admissible_base_evidence.length,evicted_candidates:selected.length-material.admissible_base_evidence.length},model_calls:0,model_tokens:0,readiness_sha256:hash(material)};
}
