// Convert a narrowly proven model transport failure into a conservative token
// debit. This bounds cost; it does not invent provider usage or a task outcome.
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const transportFailures=new Set(['deadline-exceeded','request-failed']);

export function classifyBoundedIndeterminateModelFailure(result){
  if(!object(result)||result.status!=='run_error'||typeof result.error!=='string'||!result.error.startsWith('glm.'))return null;
  const failureCode=result.error.slice(4);
  if(!transportFailures.has(failureCode)||result.selection!=null||result.native_export!=null||result.export_error!=null)return null;
  if(!Array.isArray(result.receipts)||!object(result.recycling)||!Array.isArray(result.recycling.dispatches)||!Array.isArray(result.admissions))return null;
  const models=result.receipts.filter(receipt=>receipt?.kind==='model'&&receipt.dispatched===true);
  if(models.length===0)return null;
  const terminal=models.at(-1),known=models.slice(0,-1);
  if(result.receipts.at(-1)!==terminal||known.some(receipt=>!integer(receipt.input_tokens)||!integer(receipt.output_tokens)))return null;
  if(terminal.status!==null||terminal.failure_code!==failureCode||terminal.response_bytes!==0||terminal.automatic_retries!==0||terminal.input_tokens!=null||terminal.output_tokens!=null)return null;
  const dispatch=result.recycling.dispatches.at(-1);
  if(!object(dispatch)||dispatch.sequence!==models.length||!integer(dispatch.input_upper_bound)||!integer(dispatch.output_reservation)||!integer(dispatch.projected_upper_bound)||dispatch.projected_upper_bound!==dispatch.input_upper_bound+dispatch.output_reservation)return null;
  const admission=[...result.admissions].reverse().find(row=>row?.admissible===true);
  if(!object(admission)||admission.request_reservation!==dispatch.projected_upper_bound||!integer(admission.known_consumed)||!integer(admission.total_token_limit)||admission.known_consumed+admission.request_reservation>admission.total_token_limit)return null;
  const knownModelTokens=known.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0);
  if(knownModelTokens!==admission.known_consumed)return null;
  return {scope:'local-cell',failure_family:'model-transport-indeterminate',failure_code:failureCode,terminal_status:null,response_bytes:0,automatic_retries:0,known_model_tokens:knownModelTokens,unknown_model_receipts:1,input_token_upper_bound:dispatch.input_upper_bound,output_token_upper_bound:dispatch.output_reservation,indeterminate_token_debit:dispatch.projected_upper_bound,conservative_model_token_upper_bound:knownModelTokens+dispatch.projected_upper_bound,total_token_limit:admission.total_token_limit,accounting_posture:'upper-bound-debit'};
}
