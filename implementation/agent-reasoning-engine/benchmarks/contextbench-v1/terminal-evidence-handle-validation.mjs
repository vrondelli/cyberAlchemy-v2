// Schema-wide causal validation for token-efficient terminal evidence handles.
import {createHash} from 'node:crypto';
import {bodyForReceipt,stable} from './delivery.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const models=result=>(result?.receipts??[]).filter(row=>row.kind==='model');
const tokens=result=>models(result).reduce((sum,row)=>sum+(row.input_tokens??0)+(row.output_tokens??0),0);
const stateMessage=message=>typeof message?.content==='string'&&message.content.startsWith('TERMINAL EVIDENCE HANDLES');
const replacedControlMessage=message=>typeof message?.content==='string'&&[
  'The first terminal candidate was held without acceptance',
  'Finalize now within the remaining original token/call budget',
  'Model calls remaining including this one:'
].some(prefix=>message.content.startsWith(prefix));
function promptFor(result,receipt){
  const matches=(result?.captures??[]).filter(row=>{try{return hash(stable(bodyForReceipt(row.prompt,receipt)))===receipt.request_sha256;}catch{return false;}});
  if(matches.length!==1)throw Error('prompt-binding');
  return JSON.parse(matches[0].prompt);
}
export function validateTerminalEvidenceHandlePair({prefix,control,treatment,maximum_state_tokens=160,maximum_state_bytes=1024,maximum_handles=3,minimum_input_token_reduction=128,maximum_paired_token_difference=3072,total_token_limit=96000}){
  const issues=[],add=(code,detail=null)=>issues.push({code,...(detail===null?{}:{detail})}),boundary=prefix?.shared_prefix_boundary;
  if(prefix?.status!=='shared_prefix_ready'||boundary?.kind!=='terminal-candidate'||!['tool','raw-json'].includes(boundary?.terminal_kind)||prefix?.continuation?.state?.terminal_review_pending!==true)add('terminal-handles.prefix-boundary');
  const p=models(prefix),c=models(control),t=models(treatment);
  for(const [name,branch,rows] of [['control',control,c],['treatment',treatment,t]]){
    if(branch?.prefix_ancestry?.continuation_digest!==prefix?.continuation?.continuation_digest||branch?.prefix_ancestry?.prefix_result_sha256!==control?.prefix_ancestry?.prefix_result_sha256)add(`terminal-handles.${name}-ancestry`);
    if(stable(rows.slice(0,p.length))!==stable(p))add(`terminal-handles.${name}-prefix-receipts`);
    if(rows.length-p.length!==1)add(`terminal-handles.${name}-one-call`,rows.length-p.length);
    if(tokens(branch)>total_token_limit)add(`terminal-handles.${name}-token-limit`);
  }
  const cp=control?.decision_state_presentations??[],tp=treatment?.decision_state_presentations??[],presentation=tp[0],bindings=presentation?.handle_bindings??[];
  if(cp.length!==0)add('terminal-handles.control-exposure');
  if(tp.length!==1||presentation?.schema_version!=='are.contextbench-terminal-evidence-handles/v1'||presentation?.phase!=='terminal'||presentation?.prompt_substitution!==true)add('terminal-handles.treatment-exposure');
  if(!Array.isArray(bindings)||bindings.length<1||bindings.length>maximum_handles||bindings.some((row,index)=>row?.handle!==`h${index}`||!/^[a-f0-9]{64}$/.test(row?.read_id??''))||new Set(bindings.map(row=>row.read_id)).size!==bindings.length)add('terminal-handles.private-binding');
  if(presentation&&(presentation.measured_tokens>maximum_state_tokens||presentation.bytes>maximum_state_bytes||presentation.fit?.maximum_tokens!==maximum_state_tokens||presentation.fit?.maximum_bytes!==maximum_state_bytes||presentation.model_calls!==0||presentation.model_tokens!==0||presentation.authority_effect!=='none'))add('terminal-handles.projection-cap');
  const cr=c[p.length],tr=t[p.length];let inputDifference=null;
  try{
    if(!cr||!tr)throw Error('missing-first-branch-receipt');
    const controlPrompt=promptFor(control,cr),treatmentPrompt=promptFor(treatment,tr);
    if(controlPrompt.messages.filter(replacedControlMessage).length!==3||controlPrompt.messages.some(stateMessage))throw Error('control-shape');
    if(treatmentPrompt.messages.filter(stateMessage).length!==1||treatmentPrompt.messages.some(replacedControlMessage))throw Error('treatment-shape');
    const controlTools=controlPrompt.tools??[],treatmentTools=treatmentPrompt.tools??[];
    if(controlTools.length!==1||controlTools[0]?.function?.name!=='submit_context_selection')throw Error('control-tool');
    if(treatmentTools.length!==1||treatmentTools[0]?.function?.name!=='submit_context_handles')throw Error('treatment-tool');
    if(stable(treatmentTools[0]?.function?.parameters?.properties?.context_handles?.items?.enum)!==stable(bindings.map(row=>row.handle)))throw Error('handle-enum');
    const serialized=stable(treatmentPrompt);if(bindings.some(row=>serialized.includes(row.read_id)))throw Error('private-id-disclosed');
    controlPrompt.messages=controlPrompt.messages.filter(message=>!replacedControlMessage(message));treatmentPrompt.messages=treatmentPrompt.messages.filter(message=>!stateMessage(message));controlPrompt.tools=[];treatmentPrompt.tools=[];
    if(stable(controlPrompt)!==stable(treatmentPrompt))throw Error('unregistered-prompt-drift');
    if(presentation?.request_sha256!==tr.request_sha256)throw Error('presentation-receipt');
    inputDifference=(tr.input_tokens??0)-(cr.input_tokens??0);
    if(inputDifference>-minimum_input_token_reduction)throw Error('input-reduction:'+inputDifference);
    const submitted=treatment?.selection?.model_context_handles??[],known=new Map(bindings.map(row=>[row.handle,row.read_id]));
    if(submitted.some(handle=>!known.has(handle))||stable(treatment?.selection?.final_read_ids??[])!==stable(submitted.map(handle=>known.get(handle))))throw Error('handle-resolution');
  }catch(error){add('terminal-handles.first-branch-prompt',String(error.message));}
  const difference=tokens(treatment)-tokens(control);if(!Number.isSafeInteger(difference)||difference>maximum_paired_token_difference)add('terminal-handles.paired-token-difference',difference);
  return {ok:issues.length===0,issues,measurements:{boundary_kind:boundary?.kind??null,phase:'terminal',prefix_model_calls:p.length,control_model_calls:c.length-p.length,treatment_model_calls:t.length-p.length,control_state_presentations:cp.length,treatment_state_presentations:tp.length,treatment_state_tokens:presentation?.measured_tokens??null,treatment_state_bytes:presentation?.bytes??null,private_handle_count:bindings.length,first_request_input_token_difference:inputDifference,control_cumulative_model_tokens:tokens(control),treatment_cumulative_model_tokens:tokens(treatment),paired_token_difference:difference},authority_effect:'none'};
}
