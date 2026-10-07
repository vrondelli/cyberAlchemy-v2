// Strict compact native terminal reconstruction; no response normalization/labels.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R5.json.
import {selectMethodHandleSubmission} from './method-selection-terminal-r5.mjs';
import {bindDelivery,stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
export {providerAdmitted,generationAdmitted,uint} from './native-method-live-policy-r1.mjs';
export function nativeFilePredictionR5(result){
 if(!result?.functionality_valid)return {valid:false,ranked_files:[],failure:result?.error??result?.status??'missing'};
 try{
  const response_capture=result.response_captures.at(-1),presentation=result.method_handle_presentations.at(-1);
  if(presentation?.request_sha256!==response_capture.request_sha256||presentation.receipt_index!==response_capture.receipt_index)throw Error('presentation-binding');
  const selection=selectMethodHandleSubmission({...result,response_capture,table:presentation.table,finalizing:presentation.finalizing});
  if(stable(selection.final_read_ids)!==stable(result.selection.final_read_ids)||selection.handle_table_sha256!==result.selection.handle_table_sha256)throw Error('selection-drift');
  const binding=bindDelivery(result);if(binding.unmapped.length||!binding.token_accounting.cost_complete)throw Error('delivery-or-usage');
  const byId=new Map(binding.read_observations.map(r=>[r.id,r]));
  const ranked=[...new Set(selection.final_read_ids.map(id=>{if(!byId.has(id))throw Error('missing-id');return byId.get(id).path;}))];
  if(ranked.length<1||ranked.length>8)throw Error('file-count');
  return {valid:true,ranked_files:ranked,final_read_ids:selection.final_read_ids,delivery_binding:binding};
 }catch{return {valid:false,ranked_files:[],failure:'native-prediction-reconstruction-failed'};}
}
