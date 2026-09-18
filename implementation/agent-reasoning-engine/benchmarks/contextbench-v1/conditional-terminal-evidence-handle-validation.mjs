// Causal validation for prefix-only conditional terminal-handle activation.
// An inactive treatment must be prompt-equivalent to control and carries an
// explicit receipt-bound activation decision. An active treatment inherits the
// full incremental-disclosure validation.
import {stable} from './delivery.mjs';
import {promptFor,validateTerminalEvidenceHandleIncrementalPair} from './terminal-evidence-handle-incremental-validation.mjs';

const models=result=>(result?.receipts??[]).filter(row=>row.kind==='model');
const tokens=result=>models(result).reduce((sum,row)=>sum+(row.input_tokens??0)+(row.output_tokens??0),0);

export function validateConditionalTerminalEvidenceHandlePair({prefix,control,treatment,minimum_handles=3,maximum_state_tokens=160,maximum_state_bytes=1024,maximum_handles=3,minimum_input_token_reduction=128,maximum_paired_token_difference=3072,total_token_limit=96000}){
  const issues=[],add=(code,detail=null)=>issues.push({code,...(detail===null?{}:{detail})});
  const presentations=treatment?.decision_state_presentations??[],presentation=presentations[0],bindings=presentation?.handle_bindings??[],activation=presentation?.activation;
  if(!Number.isSafeInteger(minimum_handles)||minimum_handles<1||minimum_handles>maximum_handles)add('terminal-handles-conditional.invalid-policy');
  if(presentations.length!==1||presentation?.schema_version!=='are.contextbench-terminal-evidence-handles/v1')add('terminal-handles-conditional.presentation');
  if(activation?.schema_version!=='are.contextbench-terminal-handle-activation/v1'||activation?.policy!=='minimum-prefix-handle-count'||activation?.minimum_handles!==minimum_handles||activation?.observed_handles!==bindings.length||activation?.active!==(bindings.length>=minimum_handles)||activation?.reason!==(bindings.length>=minimum_handles?'threshold-met':'threshold-not-met')||activation?.authority_effect!=='none')add('terminal-handles-conditional.activation-receipt');
  if(!Array.isArray(bindings)||bindings.length>maximum_handles||bindings.some((row,index)=>row?.handle!==`h${index}`||!/^[a-f0-9]{64}$/.test(row?.read_id??''))||new Set(bindings.map(row=>row.read_id)).size!==bindings.length)add('terminal-handles-conditional.private-binding');

  if(activation?.active===true){
    if(bindings.length!==minimum_handles)add('terminal-handles-conditional.active-count');
    const inherited=validateTerminalEvidenceHandleIncrementalPair({prefix,control,treatment,maximum_state_tokens,maximum_state_bytes,maximum_handles,minimum_input_token_reduction,maximum_paired_token_difference,total_token_limit});
    issues.push(...inherited.issues);
    return {ok:issues.length===0,issues,measurements:{...inherited.measurements,activation:'active',activation_minimum_handles:minimum_handles,activation_observed_handles:bindings.length},authority_effect:'none'};
  }

  const boundary=prefix?.shared_prefix_boundary,p=models(prefix),c=models(control),t=models(treatment);
  if(prefix?.status!=='shared_prefix_ready'||boundary?.kind!=='terminal-candidate'||!['tool','raw-json'].includes(boundary?.terminal_kind)||prefix?.continuation?.state?.terminal_review_pending!==true)add('terminal-handles-conditional.prefix-boundary');
  for(const [name,branch,rows] of [['control',control,c],['treatment',treatment,t]]){
    if(branch?.prefix_ancestry?.continuation_digest!==prefix?.continuation?.continuation_digest||branch?.prefix_ancestry?.prefix_result_sha256!==control?.prefix_ancestry?.prefix_result_sha256)add(`terminal-handles-conditional.${name}-ancestry`);
    if(stable(rows.slice(0,p.length))!==stable(p))add(`terminal-handles-conditional.${name}-prefix-receipts`);
    if(rows.length-p.length!==1)add(`terminal-handles-conditional.${name}-one-call`,rows.length-p.length);
    if(tokens(branch)>total_token_limit)add(`terminal-handles-conditional.${name}-token-limit`);
  }
  if((control?.decision_state_presentations??[]).length!==0)add('terminal-handles-conditional.control-exposure');
  if(presentation?.prompt_substitution!==false||stable(presentation?.replaced_messages??[])!=='[]')add('terminal-handles-conditional.inactive-substitution');
  let promptEquivalent=false,inputDifference=null;
  try{
    const cr=c[p.length],tr=t[p.length];
    if(!cr||!tr)throw Error('missing-first-branch-receipt');
    const controlPrompt=promptFor(control,cr),treatmentPrompt=promptFor(treatment,tr);
    promptEquivalent=stable(controlPrompt)===stable(treatmentPrompt);
    if(!promptEquivalent)throw Error('inactive-prompt-drift');
    if((treatmentPrompt.tools??[]).length!==1||treatmentPrompt.tools[0]?.function?.name!=='submit_context_selection')throw Error('inactive-control-tool');
    if(presentation?.request_sha256!==tr.request_sha256)throw Error('activation-receipt-binding');
    if(Array.isArray(treatment?.selection?.model_context_handles))throw Error('inactive-handle-selection');
    inputDifference=(tr.input_tokens??0)-(cr.input_tokens??0);
    if(inputDifference!==0)throw Error('inactive-input-token-drift:'+inputDifference);
  }catch(error){add('terminal-handles-conditional.inactive-prompt',String(error.message));}
  const difference=tokens(treatment)-tokens(control);
  if(!Number.isSafeInteger(difference)||difference>maximum_paired_token_difference)add('terminal-handles-conditional.paired-token-difference',difference);
  return {ok:issues.length===0,issues,measurements:{boundary_kind:boundary?.kind??null,phase:'terminal',prefix_model_calls:p.length,control_model_calls:c.length-p.length,treatment_model_calls:t.length-p.length,control_state_presentations:control?.decision_state_presentations?.length??0,treatment_state_presentations:presentations.length,treatment_state_tokens:presentation?.measured_tokens??null,treatment_state_bytes:presentation?.bytes??null,private_handle_count:bindings.length,first_request_input_token_difference:inputDifference,control_cumulative_model_tokens:tokens(control),treatment_cumulative_model_tokens:tokens(treatment),paired_token_difference:difference,activation:'inactive',activation_minimum_handles:minimum_handles,activation_observed_handles:bindings.length,inactive_prompt_equivalent:promptEquivalent},authority_effect:'none'};
}
