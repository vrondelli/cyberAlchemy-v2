// Exact H57 ancestry, one-call, exposure and sole-prompt-difference checks.
import {createHash} from 'node:crypto';
import {stable} from './delivery.mjs';
const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const modelReceipts=result=>(result.receipts??[]).filter(row=>row.kind==='model'&&row.dispatched);
const tokens=rows=>rows.reduce((sum,row)=>sum+(row.input_tokens??0)+(row.output_tokens??0),0);
const parsePrompt=capture=>JSON.parse(capture.prompt);
const slateMessage=message=>typeof message?.content==='string'&&message.content.includes('FINALIZATION EVIDENCE CANDIDATES');
export function validateTerminalReviewPair({prefix,control,treatment,maximum_slate_tokens=1024,maximum_paired_token_difference=3072}){
  const issues=[],add=(code,detail=null)=>issues.push({code,...(detail?{detail}:{})});
  if(prefix?.status!=='shared_prefix_ready'||prefix?.shared_prefix_boundary?.kind!=='terminal-candidate'||prefix?.continuation?.state?.terminal_review_pending!==true)add('terminal-review.prefix-boundary');
  if(control?.prefix_ancestry?.continuation_digest!==prefix?.continuation?.continuation_digest||treatment?.prefix_ancestry?.continuation_digest!==prefix?.continuation?.continuation_digest||control?.prefix_ancestry?.prefix_tree_digest!==treatment?.prefix_ancestry?.prefix_tree_digest)add('terminal-review.ancestry');
  const p=modelReceipts(prefix),c=modelReceipts(control),t=modelReceipts(treatment);
  if(c.length!==p.length+1||t.length!==p.length+1||stable(c.slice(0,p.length))!==stable(p)||stable(t.slice(0,p.length))!==stable(p))add('terminal-review.one-call');
  const controlPresentations=control?.evidence_slate_presentations??[],treatmentPresentations=treatment?.evidence_slate_presentations??[];
  if(controlPresentations.length!==0)add('terminal-review.control-slate');
  if(treatmentPresentations.length!==1)add('terminal-review.treatment-exposure');
  const presentation=treatmentPresentations[0];if(presentation&&(presentation.measured_tokens>maximum_slate_tokens||presentation.fit?.maximum_tokens!==maximum_slate_tokens||presentation.model_calls!==0||presentation.model_tokens!==0))add('terminal-review.slate-cap');
  const controlCapture=control?.captures?.at(-1),treatmentCapture=treatment?.captures?.at(-1);
  if(!controlCapture||!treatmentCapture)add('terminal-review.capture');
  else try{
    const cp=parsePrompt(controlCapture),tp=parsePrompt(treatmentCapture),slates=tp.messages.filter(slateMessage);if(slates.length!==1||cp.messages.some(slateMessage))add('terminal-review.prompt-exposure');
    tp.messages=tp.messages.filter(message=>!slateMessage(message));if(stable(tp)!==stable(cp))add('terminal-review.prompt-difference');
    for(const [arm,prompt] of [['control',cp],['treatment',parsePrompt(treatmentCapture)]])if(prompt.tools?.length!==1||prompt.tools[0]?.function?.name!=='submit_context_selection')add('terminal-review.tools',arm);
    if(presentation?.request_sha256!==t.at(-1)?.request_sha256||treatmentCapture.prompt_sha256!==hash(treatmentCapture.prompt)||controlCapture.prompt_sha256!==hash(controlCapture.prompt))add('terminal-review.receipt-binding');
  }catch(error){add('terminal-review.prompt-parse',String(error.message));}
  const inputDifference=(t.at(-1)?.input_tokens??Infinity)-(c.at(-1)?.input_tokens??0),totalDifference=tokens(t)-tokens(c);
  if(!Number.isSafeInteger(inputDifference)||inputDifference<0||inputDifference>maximum_slate_tokens)add('terminal-review.input-token-difference',inputDifference);
  if(!Number.isSafeInteger(totalDifference)||totalDifference>maximum_paired_token_difference)add('terminal-review.total-token-difference',totalDifference);
  return{ok:issues.length===0,issues,measurements:{prefix_model_calls:p.length,control_review_calls:c.length-p.length,treatment_review_calls:t.length-p.length,treatment_minus_control_input_tokens:inputDifference,treatment_minus_control_total_tokens:totalDifference,slate_measured_tokens:presentation?.measured_tokens??null},authority_effect:'none'};
}
