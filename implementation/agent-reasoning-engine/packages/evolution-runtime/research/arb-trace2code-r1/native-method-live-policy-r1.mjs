// Pure prospective live admission/prediction policy. No labels/providers.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R1.json.
import {selectFinalReads} from '../../../../benchmarks/contextbench-v1/final-selection.mjs';
import {bindDelivery,stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
export const uint=x=>Number.isSafeInteger(x)&&x>=0;
export function providerAdmitted(reply){return reply?.dispatched===true&&!reply.dispatch_uncertain&&reply.status===200&&!reply.failure_code&&uint(reply.prompt_tokens);}
export function generationAdmitted(reply,measured){return providerAdmitted(reply)&&uint(measured)&&reply.prompt_tokens<=measured&&
 reply.prompt_tokens+512<=8192&&uint(reply.completion_tokens)&&reply.completion_tokens<=512&&
 reply.public_response?.message?.role==='assistant'&&['stop','tool_calls'].includes(reply.public_response?.finish_reason);}
export function nativeFilePrediction(result){
 if(!result?.functionality_valid)return {valid:false,ranked_files:[],failure:result?.error??result?.status??'missing'};
 try{
  const selection=selectFinalReads({...result,response_capture:result.response_captures.at(-1)});
  if(stable(selection.final_read_ids)!==stable(result.selection.final_read_ids))throw Error('selection-drift');
  const binding=bindDelivery(result);if(binding.unmapped.length||!binding.token_accounting.cost_complete)throw Error('delivery-or-usage');
  const byId=new Map(binding.read_observations.map(r=>[r.id,r]));
  const ranked=[...new Set(selection.final_read_ids.map(id=>{if(!byId.has(id))throw Error('missing-id');return byId.get(id).path;}))];
  if(ranked.length<1||ranked.length>8)throw Error('file-count');
  return {valid:true,ranked_files:ranked,final_read_ids:selection.final_read_ids,delivery_binding:binding};
 }catch{return {valid:false,ranked_files:[],failure:'native-prediction-reconstruction-failed'};}
}
