// G02 exposed-task screen: force early completion within twenty model calls.
import {buildComparisonCell} from './comparison-repair-arm.mjs';
export const FULL_WINDOW=Object.freeze({id:'glm-output-74',context_limit:1000000,recycle_at:990000,safety_margin:10000,total_tokens:4000000,output_cap:8192,maximum_calls:20,maximum_request_bytes:32*1024**2,maximum_stage_bytes:512*1024**2,request_budget:'contextbench-full-window-v1'});
export const RESEARCH_VARIANTS=Object.freeze(['incremental-recovery','radical-ranked-acquisition']);
export function buildFullWindowCell({config,task_id,variant='incremental-recovery'}){
  if(config.full_window_profile!==FULL_WINDOW.id)throw Error('full-window.explicit-profile-required');
  if(!RESEARCH_VARIANTS.includes(variant))throw Error('full-window.research-variant');
  const legacy={...config,context_limit:8000,total_tokens_per_arm:96000};
  const cell=buildComparisonCell({config:legacy,task_id,arm:'current-are'});
  return {...cell,cell_id:task_id+'-'+FULL_WINDOW.id+'-'+variant,research_variant:variant,context_limit:FULL_WINDOW.context_limit,recycle_at:FULL_WINDOW.recycle_at,safety_margin:FULL_WINDOW.safety_margin,
    limits:{...cell.limits,total_tokens:FULL_WINDOW.total_tokens,finalization_reserve_tokens:2*FULL_WINDOW.context_limit,output_cap:FULL_WINDOW.output_cap,maximum_calls:FULL_WINDOW.maximum_calls,discovery_retention:false,maximum_tool_batch_corrections:2},
    provider_profile:{...cell.provider_profile,request_budget:FULL_WINDOW.request_budget}};
}
