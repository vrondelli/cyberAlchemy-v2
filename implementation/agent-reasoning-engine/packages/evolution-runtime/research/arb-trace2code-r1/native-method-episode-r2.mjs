// Separate prospective adapter; frozen live r1 sources and outputs unchanged.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R2.json.
import {loadNativeMethodEpisode} from './native-method-episode-r1.mjs';
import {createExplicitMethodTools,FINAL_RAW_JSON_GUIDANCE} from './explicit-method-tools-r2.mjs';
export async function runExplicitMethodEpisode({caseId,arm,task,client,recycler,measure_index_tokens,run_id,on_event,
 view,maximumToolActions=10,limits={}}){
 if(!['baseline','index'].includes(arm)||typeof task?.problem_statement!=='string')throw Error('method-episode-r2.invalid-input');
 const native=await loadNativeMethodEpisode(),bound=createExplicitMethodTools({caseId,view,maximumToolActions});
 const configured={maximum_calls:11,output_cap:512,total_tokens:65536,index_entries:10,index_tokens:1024,
  finalization_reserve_tokens:16384,finalization_calls:2,
  ...(arm==='index'?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:512,task_state_evidence:8,task_state_outcomes:8}:{}),
  maximum_terminal_corrections:0,incomplete_output_corrections:0,...limits};
 // Common instructions, not post-hoc parsing or a treatment-only advantage.
 const nativeTask={...task,problem_statement:task.problem_statement+'\nCOMMON OUTPUT CONTRACT:\n'+FINAL_RAW_JSON_GUIDANCE};
 let allAttempts=0;
 const eventHook=async event=>{
  if(event.kind==='method-tool-attempt'&&++allAttempts>maximumToolActions)throw Error('method-episode.all-tool-action-budget-exhausted');
  if(on_event)await on_event(event);
 };
 const result=await native.runEpisode({task:nativeTask,arm,client,recycler,measure_index_tokens,run_id,
  tools:bound.tools,execute_tool:bound.execute_tool,limits:configured,on_event:eventHook});
 const toolState=bound.snapshot();
 return {...result,native_method_binding:native.binding,
  method_interface_binding:{version:'explicit-method-r2',common_raw_json_guidance:FINAL_RAW_JSON_GUIDANCE,
   finalization_reserve_tokens:configured.finalization_reserve_tokens,finalization_calls:configured.finalization_calls,
   reserves_inside_original_budget:true,terminal_submission:false,source_context:undefined},
  method_tool_accounting:{...toolState,all_tool_attempts:allAttempts,over_budget:toolState.over_budget||allAttempts>maximumToolActions},
  functionality_valid:result.status==='final_context_selected'&&result.selection?.final_read_ids.length>0&&!toolState.over_budget&&allAttempts<=maximumToolActions,
  claim_ceiling:'Explicit native adapter qualification only; quality needs prospective paired provider campaign and disjoint confirmation'};
}
