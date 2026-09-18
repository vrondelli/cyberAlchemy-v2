// Causal and token validation for the H65 completion-readiness fork.
import {bodyForReceipt,stable} from './delivery.mjs';
const modelRows=result=>(result.receipts??[]).filter(row=>row.kind==='model');
const tokens=result=>modelRows(result).reduce((sum,row)=>sum+(row.input_tokens??0)+(row.output_tokens??0),0);
const matchingPrompt=(result,receipt)=>{
  const matches=(result.captures??[]).map(row=>row.prompt).filter(prompt=>{
    try{return cryptoHash(stable(bodyForReceipt(prompt,receipt)))===receipt.request_sha256;}catch{return false;}
  });
  if(!matches.length)throw Error('first-evidence-validation.prompt-not-found');
  if(new Set(matches).size!==1)throw Error('first-evidence-validation.prompt-ambiguous');
  return JSON.parse(matches[0]);
};
import {createHash} from 'node:crypto';
const cryptoHash=value=>createHash('sha256').update(value).digest('hex');

export function validateCompletionReadinessPair({prefix,control,treatment,maximum_readiness_tokens=1024,maximum_paired_token_difference=3072,total_token_limit=96000}){
  const issues=[];
  if(prefix?.status!=='shared_prefix_ready'||prefix.shared_prefix_boundary?.kind!=='effect-confirmed-completion-readiness')issues.push('prefix-boundary');
  if(prefix.shared_prefix_boundary?.no_tool_executed_after_confirmation!==true||prefix.continuation?.state?.completion_readiness_confirmed!==true)issues.push('held-effect');
  if(!Array.isArray(prefix.shared_prefix_boundary?.confirmed_effect?.affected_paths)||prefix.shared_prefix_boundary.confirmed_effect.affected_paths.length<1||!prefix.shared_prefix_boundary?.confirmed_verification?.kind)issues.push('confirmed-effect-verification');
  for(const [name,branch] of [['control',control],['treatment',treatment]]){
    if(branch?.prefix_ancestry?.prefix_result_sha256!==control?.prefix_ancestry?.prefix_result_sha256||branch?.prefix_ancestry?.continuation_digest!==prefix.continuation?.continuation_digest)issues.push(`${name}-ancestry`);
    if(modelRows(branch).slice(0,modelRows(prefix).length).map(stable).join('\n')!==modelRows(prefix).map(stable).join('\n'))issues.push(`${name}-prefix-receipts`);
    if(tokens(branch)>total_token_limit)issues.push(`${name}-token-limit`);
  }
  if((control?.evidence_slate_presentations??[]).length!==0)issues.push('control-guidance');
  const presentations=treatment?.evidence_slate_presentations??[];
  if(presentations.length!==1||presentations[0]?.schema_version!=='are.contextbench-completion-readiness/v1'||presentations[0]?.measured_tokens>maximum_readiness_tokens)issues.push('treatment-guidance');
  const prefixCount=modelRows(prefix).length,controlReceipt=modelRows(control)[prefixCount],treatmentReceipt=modelRows(treatment)[prefixCount];
  try{
    if(!controlReceipt||!treatmentReceipt)throw Error('missing');
    const controlPrompt=matchingPrompt(control,controlReceipt),treatmentPrompt=matchingPrompt(treatment,treatmentReceipt);
    const at=treatmentPrompt.messages.findIndex(message=>typeof message.content==='string'&&message.content.startsWith('COMPLETION READINESS STATE'));
    if(at<0)throw Error('guidance-missing');
    treatmentPrompt.messages.splice(at,1);
    if(stable(treatmentPrompt)!==stable(controlPrompt))throw Error('prompt-drift');
  }catch{issues.push('first-branch-prompt');}
  const controlTokens=tokens(control),treatmentTokens=tokens(treatment),difference=treatmentTokens-controlTokens;
  if(difference>maximum_paired_token_difference)issues.push('paired-token-difference');
  return {ok:issues.length===0,issues:[...new Set(issues)].sort(),measurements:{boundary_kind:prefix.shared_prefix_boundary?.kind??null,affected_path_count:prefix.shared_prefix_boundary?.confirmed_effect?.affected_paths?.length??0,verification_kind:prefix.shared_prefix_boundary?.confirmed_verification?.kind??null,held_tool_call_count:prefix.shared_prefix_boundary?.held_tool_call_count??null,control_readiness_presentations:control?.evidence_slate_presentations?.length??0,treatment_readiness_presentations:presentations.length,treatment_readiness_tokens:presentations[0]?.measured_tokens??null,control_cumulative_model_tokens:controlTokens,treatment_cumulative_model_tokens:treatmentTokens,paired_token_difference:difference},authority_effect:'none'};
}
