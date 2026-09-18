// Schema-wide causal validation for the H67 universal decision-bound fork.
import {createHash} from 'node:crypto';
import {bodyForReceipt,stable} from './delivery.mjs';
import {DECISION_BOUNDARY_KINDS,decisionPhase} from './decision-state-v1.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const modelRows=result=>(result?.receipts??[]).filter(row=>row.kind==='model');
const tokens=result=>modelRows(result).reduce((sum,row)=>sum+(row.input_tokens??0)+(row.output_tokens??0),0);
const stateMessage=message=>typeof message?.content==='string'&&message.content.startsWith('DECISION STATE');
export function minimumPairCountReachable({eligible_pairs,processed_prefixes,scheduled_prefixes,minimum_pairs}){
  if(![eligible_pairs,processed_prefixes,scheduled_prefixes,minimum_pairs].every(Number.isSafeInteger)||eligible_pairs<0||processed_prefixes<0||scheduled_prefixes<processed_prefixes||minimum_pairs<1)throw Error('decision-validation.invalid-feasibility-counts');
  return eligible_pairs+(scheduled_prefixes-processed_prefixes)>=minimum_pairs;
}
function promptForReceipt(result,receipt){
  const matches=(result?.captures??[]).filter(row=>{try{return hash(stable(bodyForReceipt(row.prompt,receipt)))===receipt.request_sha256;}catch{return false;}});
  if(matches.length!==1)throw Error('decision-validation.prompt-binding');
  return JSON.parse(matches[0].prompt);
}

export function validateDecisionStatePair({prefix,control,treatment,maximum_state_tokens=1024,maximum_state_bytes=4096,maximum_paired_token_difference=3072,total_token_limit=96000}){
  const issues=[],add=(code,detail=null)=>issues.push({code,...(detail===null?{}:{detail})}),boundary=prefix?.shared_prefix_boundary,kind=boundary?.kind;
  if(prefix?.status!=='shared_prefix_ready'||!DECISION_BOUNDARY_KINDS.has(kind)||stable(prefix?.continuation?.state?.decision_boundary)!==stable(boundary))add('decision-state.prefix-boundary');
  if(kind==='effect-confirmed'&&(boundary?.no_tool_executed_after_confirmation!==true||!Array.isArray(boundary?.confirmed_effect?.affected_paths)||!boundary.confirmed_effect.affected_paths.length))add('decision-state.effect-boundary');
  if(kind==='terminal-candidate'&&!['tool','raw-json'].includes(boundary?.terminal_kind))add('decision-state.terminal-boundary');
  if(['output-pressure','response-pressure'].includes(kind)&&(boundary?.no_tool_executed!==true||typeof boundary?.failure_code!=='string'))add('decision-state.response-boundary');
  if(kind==='context-pressure'&&!Number.isSafeInteger(boundary?.recycles))add('decision-state.context-boundary');
  const p=modelRows(prefix),c=modelRows(control),t=modelRows(treatment);
  for(const [name,branch,rows] of [['control',control,c],['treatment',treatment,t]]){
    if(branch?.prefix_ancestry?.continuation_digest!==prefix?.continuation?.continuation_digest||branch?.prefix_ancestry?.prefix_result_sha256!==control?.prefix_ancestry?.prefix_result_sha256)add(`decision-state.${name}-ancestry`);
    if(stable(rows.slice(0,p.length))!==stable(p))add(`decision-state.${name}-prefix-receipts`);
    if(tokens(branch)>total_token_limit)add(`decision-state.${name}-token-limit`);
  }
  const cp=control?.decision_state_presentations??[],tp=treatment?.decision_state_presentations??[],presentation=tp[0];
  if(cp.length!==0)add('decision-state.control-exposure');
  if(tp.length!==1||presentation?.schema_version!=='are.contextbench-decision-state/v1'||presentation?.phase!==(kind?decisionPhase(kind):null))add('decision-state.treatment-exposure');
  if(presentation&&(presentation.measured_tokens>maximum_state_tokens||presentation.bytes>maximum_state_bytes||presentation.fit?.maximum_tokens!==maximum_state_tokens||presentation.fit?.maximum_bytes!==maximum_state_bytes||presentation.model_calls!==0||presentation.model_tokens!==0||presentation.authority_effect!=='none'))add('decision-state.projection-cap');
  const cr=c[p.length],tr=t[p.length];
  try{
    if(!cr||!tr)throw Error('missing-first-branch-receipt');
    const controlPrompt=promptForReceipt(control,cr),treatmentPrompt=promptForReceipt(treatment,tr),states=treatmentPrompt.messages.filter(stateMessage);
    if(states.length!==1||controlPrompt.messages.some(stateMessage))throw Error('exposure');
    treatmentPrompt.messages=treatmentPrompt.messages.filter(message=>!stateMessage(message));
    if(stable(treatmentPrompt)!==stable(controlPrompt))throw Error('prompt-drift');
    if(presentation?.request_sha256!==tr.request_sha256)throw Error('presentation-receipt');
  }catch(error){add('decision-state.first-branch-prompt',String(error.message));}
  const difference=tokens(treatment)-tokens(control);if(!Number.isSafeInteger(difference)||difference>maximum_paired_token_difference)add('decision-state.paired-token-difference',difference);
  return {ok:issues.length===0,issues,measurements:{boundary_kind:kind??null,phase:kind&&DECISION_BOUNDARY_KINDS.has(kind)?decisionPhase(kind):null,prefix_model_calls:p.length,control_model_calls:c.length-p.length,treatment_model_calls:t.length-p.length,control_state_presentations:cp.length,treatment_state_presentations:tp.length,treatment_state_tokens:presentation?.measured_tokens??null,treatment_state_bytes:presentation?.bytes??null,control_cumulative_model_tokens:tokens(control),treatment_cumulative_model_tokens:tokens(treatment),paired_token_difference:difference},authority_effect:'none'};
}
