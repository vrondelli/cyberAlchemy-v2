// Additive task-2 qualification profile for G02 response-batch recovery.
import {buildComparisonCell} from './comparison-repair-arm.mjs';

export const G02_FULL_WINDOW=Object.freeze({
  id:'glm-full-window-g02-v1',
  context_limit:1000000,
  recycle_at:990000,
  safety_margin:10000,
  total_tokens:4000000,
  output_cap:2048,
  maximum_calls:96,
  maximum_request_bytes:32*1024**2,
  maximum_response_bytes:1024**2,
  maximum_stage_bytes:512*1024**2,
  maximum_tool_batch_corrections:1,
  request_budget:'contextbench-full-window-v1'
});

export function buildG02FullWindowCell({config,task_id}){
  if(config.full_window_profile!==G02_FULL_WINDOW.id)throw Error('g02-full-window.explicit-profile-required');
  const legacy={...config,context_limit:8000,total_tokens_per_arm:96000};
  const cell=buildComparisonCell({config:legacy,task_id,arm:'current-are'});
  return {...cell,cell_id:task_id+'-'+G02_FULL_WINDOW.id,context_limit:G02_FULL_WINDOW.context_limit,recycle_at:G02_FULL_WINDOW.recycle_at,safety_margin:G02_FULL_WINDOW.safety_margin,
    limits:{...cell.limits,total_tokens:G02_FULL_WINDOW.total_tokens,finalization_reserve_tokens:2*G02_FULL_WINDOW.context_limit,output_cap:G02_FULL_WINDOW.output_cap,maximum_calls:G02_FULL_WINDOW.maximum_calls,maximum_tool_batch_corrections:G02_FULL_WINDOW.maximum_tool_batch_corrections},
    provider_profile:{...cell.provider_profile,request_budget:G02_FULL_WINDOW.request_budget}};
}
