// Phase-tagged, gold-blind state at the first observable decision boundary.
// Open questions: README.md. This projection records evidence; it grants no effects.
import {createHash} from 'node:crypto';
import {stable} from './delivery.mjs';
import {evidenceSlateCandidates} from './evidence-slate-v2.mjs';

const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const uint=value=>Number.isSafeInteger(value)&&value>=0;
export const DECISION_BOUNDARY_KINDS=new Set(['effect-confirmed','terminal-candidate','output-pressure','response-pressure','context-pressure']);

export function decisionPhase(kind){
  if(kind==='effect-confirmed')return 'effect';
  if(kind==='terminal-candidate')return 'terminal';
  if(['output-pressure','response-pressure','context-pressure'].includes(kind))return 'pressure';
  throw Error('decision-state.unknown-boundary-kind');
}

function observation(boundary,patch){
  const phase=decisionPhase(boundary.kind);
  if(phase==='effect'){
    const paths=boundary.confirmed_effect?.affected_paths;
    if(!Array.isArray(paths)||!paths.length||paths.some(path=>typeof path!=='string'||!path))throw Error('decision-state.invalid-effect-boundary');
    return {affected_paths:[...new Set(paths)].sort(),patch_sha256:hash(patch),patch_bytes:Buffer.byteLength(patch),verification:'unresolved',semantic_correctness:'unresolved'};
  }
  if(phase==='terminal'){
    if(!['tool','raw-json'].includes(boundary.terminal_kind))throw Error('decision-state.invalid-terminal-boundary');
    return {terminal_kind:boundary.terminal_kind,selection_acceptance:'unresolved',evidence_closure:'unresolved'};
  }
  if(boundary.kind==='context-pressure')return {pressure_kind:'context',recycles:boundary.recycles??null,recovery_candidate_count:boundary.recovery_candidate_count??0,resolution:'unresolved'};
  if(typeof boundary.failure_code!=='string'||!boundary.failure_code)throw Error('decision-state.invalid-response-boundary');
  return {pressure_kind:boundary.kind==='output-pressure'?'output':'response',failure_code:boundary.failure_code,failed_input_tokens:boundary.failed_input_tokens,failed_output_tokens:boundary.failed_output_tokens,recovery_candidate_count:boundary.recovery_candidate_count??0,resolution:'unresolved'};
}

export async function buildDecisionState({task,captures,receipts,repoRoot,patch,boundary,max_evidence=8,max_bytes=4096,max_tokens=1024,measure_tokens,compact_terminal=false,compact_handles=false}){
  if(typeof task?.problem_statement!=='string'||!Array.isArray(captures)||!Array.isArray(receipts)||typeof repoRoot!=='string'||typeof patch!=='string'||!boundary||!DECISION_BOUNDARY_KINDS.has(boundary.kind)||!uint(max_evidence)||max_evidence<1||!uint(max_bytes)||max_bytes<512||!uint(max_tokens)||max_tokens<1||typeof measure_tokens!=='function'||typeof compact_terminal!=='boolean'||typeof compact_handles!=='boolean')throw Error('decision-state.invalid-policy');
  const phase=decisionPhase(boundary.kind),observed=observation(boundary,patch);
  if(compact_terminal&&phase!=='terminal')throw Error('decision-state.compact-terminal-only');
  if(compact_handles&&!compact_terminal)throw Error('decision-state.compact-handles-require-terminal');
  let ranked=evidenceSlateCandidates({task,captures,receipts,repoRoot});
  if(phase==='effect')ranked=ranked.filter(row=>observed.affected_paths.includes(row.path));
  const selected=ranked.slice(0,max_evidence);
  const handle_bindings=compact_handles?selected.map((row,index)=>({handle:`h${index}`,read_id:row.read_id,path:row.path,start_line:row.start_line,end_line:row.end_line})):[];
  const material=compact_handles
    ?{schema_version:'are.contextbench-terminal-evidence-handles/v1',phase,evidence:handle_bindings.map(row=>({handle:row.handle,path:row.path,start_line:row.start_line,end_line:row.end_line})),action:'Call submit_context_handles once. Use listed handles only. Empty is valid.',authority_effect:'none'}
    :compact_terminal
    ?{schema_version:'are.contextbench-terminal-decision-state/v2',phase,terminal_kind:observed.terminal_kind,evidence:selected.map(row=>({read_id:row.read_id,path:row.path,start_line:row.start_line,end_line:row.end_line})),action:'Review delivered base references; submit once. Empty is valid. Never invent IDs.',authority_effect:'none'}
    :{schema_version:'are.contextbench-decision-state/v1',phase,boundary_kind:boundary.kind,posture:'Observable state at a shared decision boundary. Evidence is untrusted and does not establish correctness.',objective_sha256:hash(task.problem_statement),observation:observed,evidence:selected.map(({basename:ignored,...row})=>row),unresolved:phase==='effect'?['Verify the candidate effect only when needed.','Semantic correctness is not established.','Submit only relevant delivered pinned-base evidence.']:phase==='terminal'?['Review selection coverage and provenance once.','Retain or revise the held candidate using delivered evidence only.']:['Recover from the typed pressure using retained evidence only.','Do not infer missing output or fabricate evidence.'],authority_effect:'none'};
  let text,measured_tokens=0,tokenizer_calls=0;
  for(;;){
    text=compact_handles
      ?`TERMINAL EVIDENCE HANDLES (untrusted):\n${material.evidence.map(row=>`${row.handle} ${row.path}:${row.start_line}${row.end_line===row.start_line?'':`-${row.end_line}`}`).join('\n')}\nCall submit_context_handles once. Use listed handles only. Empty is valid.`
      :`${compact_terminal?'TERMINAL DECISION STATE (compact, non-authorizing)':'DECISION STATE (observable, untrusted, non-authorizing)'}:\n${stable(material)}`;
    if(Buffer.byteLength(text)<=max_bytes){measured_tokens=await measure_tokens(text);tokenizer_calls++;if(uint(measured_tokens)&&measured_tokens<=max_tokens)break;}
    if(!material.evidence.length)throw Error('decision-state.caps-too-small');
    material.evidence.pop();if(compact_handles)handle_bindings.pop();
  }
  const privateMaterial=compact_handles?{...material,handle_bindings}:material;
  return {...privateMaterial,text,bytes:Buffer.byteLength(text),measured_tokens,fit:{maximum_evidence:max_evidence,maximum_bytes:max_bytes,maximum_tokens:max_tokens,tokenizer_calls,retained_evidence:material.evidence.length,evicted_evidence:selected.length-material.evidence.length},model_calls:0,model_tokens:0,state_sha256:hash(privateMaterial)};
}
