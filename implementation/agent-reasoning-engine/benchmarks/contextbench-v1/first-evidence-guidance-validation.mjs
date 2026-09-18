// Causal and token validation for the H58 first-evidence fork.
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

export function validateFirstEvidenceGuidancePair({prefix,control,treatment,maximum_guidance_tokens=1024,maximum_paired_token_difference=3072,total_token_limit=96000}){
  const issues=[];
  if(prefix?.status!=='shared_prefix_ready'||prefix.shared_prefix_boundary?.kind!=='first-evidence-delivery')issues.push('prefix-boundary');
  if(prefix.shared_prefix_boundary?.no_tool_executed_after_confirmation!==true||prefix.continuation?.state?.first_evidence_delivery_confirmed!==true)issues.push('held-effect');
  if(!Array.isArray(prefix.shared_prefix_boundary?.confirmed_read_ids)||prefix.shared_prefix_boundary.confirmed_read_ids.length<1)issues.push('confirmed-read');
  for(const [name,branch] of [['control',control],['treatment',treatment]]){
    if(branch?.prefix_ancestry?.prefix_result_sha256!==control?.prefix_ancestry?.prefix_result_sha256||branch?.prefix_ancestry?.continuation_digest!==prefix.continuation?.continuation_digest)issues.push(`${name}-ancestry`);
    if(modelRows(branch).slice(0,modelRows(prefix).length).map(stable).join('\n')!==modelRows(prefix).map(stable).join('\n'))issues.push(`${name}-prefix-receipts`);
    if(tokens(branch)>total_token_limit)issues.push(`${name}-token-limit`);
  }
  if((control?.evidence_slate_presentations??[]).length!==0)issues.push('control-guidance');
  const presentations=treatment?.evidence_slate_presentations??[];
  if(presentations.length!==1||presentations[0]?.schema_version!=='are.contextbench-first-evidence-guidance/v1'||presentations[0]?.measured_tokens>maximum_guidance_tokens)issues.push('treatment-guidance');
  const prefixCount=modelRows(prefix).length,controlReceipt=modelRows(control)[prefixCount],treatmentReceipt=modelRows(treatment)[prefixCount];
  try{
    if(!controlReceipt||!treatmentReceipt)throw Error('missing');
    const controlPrompt=matchingPrompt(control,controlReceipt),treatmentPrompt=matchingPrompt(treatment,treatmentReceipt);
    const at=treatmentPrompt.messages.findIndex(message=>typeof message.content==='string'&&message.content.startsWith('MID-TRAJECTORY EVIDENCE GUIDANCE'));
    if(at<0)throw Error('guidance-missing');
    treatmentPrompt.messages.splice(at,1);
    if(stable(treatmentPrompt)!==stable(controlPrompt))throw Error('prompt-drift');
  }catch{issues.push('first-branch-prompt');}
  const controlTokens=tokens(control),treatmentTokens=tokens(treatment),difference=treatmentTokens-controlTokens;
  if(difference>maximum_paired_token_difference)issues.push('paired-token-difference');
  return {ok:issues.length===0,issues:[...new Set(issues)].sort(),measurements:{boundary_kind:prefix.shared_prefix_boundary?.kind??null,confirmed_read_count:prefix.shared_prefix_boundary?.confirmed_read_ids?.length??0,held_tool_call_count:prefix.shared_prefix_boundary?.held_tool_call_count??null,control_guidance_presentations:control?.evidence_slate_presentations?.length??0,treatment_guidance_presentations:presentations.length,treatment_guidance_tokens:presentations[0]?.measured_tokens??null,control_cumulative_model_tokens:controlTokens,treatment_cumulative_model_tokens:treatmentTokens,paired_token_difference:difference},authority_effect:'none'};
}
