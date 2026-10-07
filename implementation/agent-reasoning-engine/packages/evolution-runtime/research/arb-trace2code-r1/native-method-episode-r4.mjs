// Separate native integration of common compact method handles; no core/frozen edits.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R4.json.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {loadReliableMethodEpisode} from './native-method-episode-r3.mjs';
import {createExplicitMethodTools} from './explicit-method-tools-r2.mjs';
import * as compactPolicy from './compact-method-terminal-r4b.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,c)=>{if(!v)throw Error('method-episode-r4.'+c);};
let loaded;
export async function loadCompactMethodEpisode(){
 if(loaded)return loaded;
 need(typeof compactPolicy.selectMethodHandleSubmission==='function','qualified-policy');
 const base=await loadReliableMethodEpisode(),raw=readFileSync(base.binding.native_source_path);
 need(sha(raw)===base.binding.native_source_sha256,'native-source-drift');let effective=raw.toString('utf8');
 for(const {before,after}of base.binding.seams){need(effective.split(before).length===2,'base-seam-binding');effective=effective.replace(before,()=>after);}
 effective=effective.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g,(_m,prefix,spec,suffix)=>prefix+pathToFileURL(resolve(dirname(base.binding.native_source_path),spec)).href+suffix);
 need(sha(effective)===base.binding.effective_module_sha256,'base-module-binding');
 const seams=[
  ["const TERMINAL_TOOL='submit_context_selection';",
   'im'+'port {buildMethodHandleTable,methodHandleTool,methodHandleMessage,selectMethodHandleSubmission} from '+JSON.stringify(new URL('./compact-method-terminal-r4b.mjs',import.meta.url).href)+";\nconst TERMINAL_TOOL='submit_method_handles';"],
  ['Finish with a JSON object containing summary (string) and context_read_ids (unique array of read_id strings for source context you used).',
   'Finish with summary (at most160 characters) and context_handles (unique listed aliases for relevant delivered complete source). Use the exact current-request handle table, not raw read IDs. No duplicate prose outside terminal arguments.'],
  ['  let methodToolAttempts=0;',
   '  let methodToolAttempts=0;const method_handle_presentations=[];'],
  ['      const stateCandidates=new Map();',
   '      const stateCandidates=new Map();const methodTableCandidates=new Map();'],
  ['          const promptTools=terminalSubmission?(finalizing?[terminalTool]:[...tools,terminalTool]):(finalizing?[]:tools);',
   '          const methodTable=buildMethodHandleTable({captures,receipts:client.receipts,messages});\n          messages.push(methodHandleMessage(methodTable));\n          const compactTerminal=methodHandleTool(methodTable);\n          const promptTools=finalizing?[compactTerminal]:[...tools,compactTerminal];'],
  ['          if(taskState)stateCandidates.set(prompt,{generation:meta.generation,state:taskState});',
   '          methodTableCandidates.set(prompt,{table:clone(methodTable),generation:meta.generation});\n          if(taskState)stateCandidates.set(prompt,{generation:meta.generation,state:taskState});'],
  ["      recordStatePresentation(generated.receipt,'response');",
   "      const matchedTables=[...methodTableCandidates].filter(([prompt])=>hash(stable(bodyForReceipt(prompt,generated.receipt)))===generated.receipt.request_sha256);\n      if(matchedTables.length!==1)throw Error('method-handles.request-table-candidate-binding');\n      method_handle_presentations.push({step,generation:matchedTables[0][1].generation,request_sha256:generated.receipt.request_sha256,receipt_index,table:matchedTables[0][1].table});\n      recordStatePresentation(generated.receipt,'response');"],
  ['          selection=(terminalSubmission&&terminalCall?selectTerminalSubmission:selectFinalReads)({captures,receipts:client.receipts,response_capture,\n          ...(source_context?{source_context:source_context()}: {})});}',
   '          selection=selectMethodHandleSubmission({captures,receipts:client.receipts,response_capture,table:method_handle_presentations.at(-1)?.table});}'],
  ['  return {status,error,selection,terminal_corrections,',
   '  return {status,error,selection,method_handle_presentations,terminal_corrections,']
 ];
 for(const[before,after]of seams){need(effective.split(before).length===2,'single-compact-seam-binding');effective=effective.replace(before,()=>after);}
 // Remaining prose/correction labels are aligned prospectively, never a
 // normalization of returned model arguments or historical selections.
 effective=effective.replaceAll('submit_context_selection','submit_method_handles').replaceAll('context_read_ids','context_handles');
 const module=await import('data:text/javascript;base64,'+Buffer.from(effective).toString('base64'));
 need(typeof module.runEpisode==='function','native-export');
 loaded={runEpisode:module.runEpisode,binding:{...base.binding,base_effective_module_sha256:base.binding.effective_module_sha256,
  effective_module_sha256:sha(effective),compact_seams:seams.map(([before,after])=>({before,after})),
  adaptation:'All native r3 localization/pending/capacity/action seams retained, plus shared exact request-local all-method alias table/tool/selection and successful-request presentation capture. Canonical native loop and all frozen predecessors unchanged.',
  physical_line_provenance_claimed:false,authority_effect:'none'}};return loaded;
}
export async function runCompactMethodEpisode({caseId,arm,task,client,recycler,measure_index_tokens,run_id,on_event,
 view,maximumToolActions=10,limits={}}){
 need(['baseline','index'].includes(arm)&&typeof task?.problem_statement==='string','input');
 need(Number.isSafeInteger(maximumToolActions)&&maximumToolActions>0&&maximumToolActions<=10,'action-cap');
 const native=await loadCompactMethodEpisode(),bound=createExplicitMethodTools({caseId,view,maximumToolActions});
 const configured={maximum_calls:11,output_cap:512,total_tokens:65536,index_entries:10,index_tokens:1024,
  finalization_reserve_tokens:16384,finalization_calls:2,terminal_submission:true,terminal_content_fallback:true,output_deferral:true,
  ...(arm==='index'?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:512,task_state_evidence:8,task_state_outcomes:8}:{}),
  maximum_terminal_corrections:0,incomplete_output_corrections:0,...limits,method_maximum_tool_actions:maximumToolActions};
 need(configured.maximum_calls<=11&&configured.output_cap<=512&&configured.total_tokens<=65536,'numeric-cap');
 need(configured.maximum_terminal_corrections===0&&configured.incomplete_output_corrections===0&&configured.terminal_submission===true&&configured.terminal_content_fallback===true,'strict-common-terminal');
 const nativeTask={...task,problem_statement:task.problem_statement+'\nCOMMON COMPACT METHOD CONTRACT:\nFinalize using submit_method_handles with a brief summary (at most160 characters) and unique current-request context_handles, most likely file first. Exact raw JSON with the identical schema is also accepted. Do not emit duplicate prose outside arguments. Read IDs remain private evidence identities; select their current listed aliases, not invented signatures. All eligible complete method reads remain addressable, including confirmed earlier reads. A withheld capacity notice grants no source credit. Empty honestly reports inability and is not a valid localization prediction.'};
 let allAttempts=0;const eventHook=async event=>{if(event.kind==='method-tool-attempt')allAttempts++;if(on_event)await on_event(event);};
 const result=await native.runEpisode({task:nativeTask,arm,client,recycler,measure_index_tokens,run_id,
  tools:bound.tools,execute_tool:bound.execute_tool,limits:configured,on_event:eventHook});
 const toolState=bound.snapshot();return {...result,native_method_binding:native.binding,
  method_interface_binding:{version:'compact-method-r4',terminal_tool:compactPolicy.METHOD_HANDLE_TOOL,terminal_content_fallback:true,
   all_eligible_reads_addressable:true,maximum_summary_utf16_units:160,output_deferral:configured.output_deferral,
   finalization_reserve_tokens:configured.finalization_reserve_tokens,finalization_calls:configured.finalization_calls,
   reserves_inside_original_budget:true,physical_line_provenance_claimed:false},
  method_tool_accounting:{...toolState,all_tool_attempts:allAttempts,over_budget:toolState.over_budget||allAttempts>maximumToolActions},
  functionality_valid:result.status==='final_context_selected'&&result.selection?.final_read_ids.length>0&&!toolState.over_budget&&allAttempts<=maximumToolActions,
  claim_ceiling:'Native common compact-interface candidate; real paired quality and disjoint confirmation required'};
}
