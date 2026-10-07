// Separate source-only acquisition-first native candidate; frozen ancestors unchanged.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R5.json.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {loadReliableMethodEpisode} from './native-method-episode-r3.mjs';
import {loadCompactMethodEpisode} from './native-method-episode-r4.mjs';
import {createExplicitMethodTools} from './explicit-method-tools-r2.mjs';
import * as compactPolicy from './method-selection-terminal-r5.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,c)=>{if(!v)throw Error('method-episode-r5.'+c);};
let loaded;
export async function loadAcquisitionMethodEpisode(){
 if(loaded)return loaded;
 const base=await loadReliableMethodEpisode(),previous=await loadCompactMethodEpisode();
 const raw=readFileSync(base.binding.native_source_path);need(sha(raw)===base.binding.native_source_sha256,'native-source-drift');
 let effective=raw.toString('utf8');
 for(const {before,after}of base.binding.seams){need(effective.split(before).length===2,'base-seam');effective=effective.replace(before,()=>after);}
 effective=effective.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g,(_m,prefix,spec,suffix)=>prefix+pathToFileURL(resolve(dirname(base.binding.native_source_path),spec)).href+suffix);
 need(sha(effective)===base.binding.effective_module_sha256,'base-module-digest');
 for(const {before,after}of previous.binding.compact_seams){need(effective.split(before).length===2,'compact-seam');effective=effective.replace(before,()=>after);}
 effective=effective.replaceAll('submit_context_selection','submit_method_handles').replaceAll('context_read_ids','context_handles');
 need(sha(effective)===previous.binding.effective_module_sha256,'previous-module-digest');
 const seams=[
  [new URL('./compact-method-terminal-r4b.mjs',import.meta.url).href,new URL('./method-selection-terminal-r5.mjs',import.meta.url).href],
  ['messages.push(methodHandleMessage(methodTable));','messages.push(methodHandleMessage(methodTable,{finalizing}));'],
  ['const promptTools=finalizing?[compactTerminal]:[...tools,compactTerminal];','const promptTools=finalizing?[compactTerminal]:(methodTable.bindings.length?[...tools,compactTerminal]:tools);'],
  ['methodTableCandidates.set(prompt,{table:clone(methodTable),generation:meta.generation});','methodTableCandidates.set(prompt,{table:clone(methodTable),generation:meta.generation,finalizing});'],
  ['table:matchedTables[0][1].table});','table:matchedTables[0][1].table,finalizing:matchedTables[0][1].finalizing});'],
  ['table:method_handle_presentations.at(-1)?.table});','table:method_handle_presentations.at(-1)?.table,finalizing:method_handle_presentations.at(-1)?.finalizing});'],
  ['Finish with summary (at most160 characters) and context_handles (unique listed aliases for relevant delivered complete source). Use the exact current-request handle table, not raw read IDs. No duplicate prose outside terminal arguments.',
   'First acquire complete source evidence using repository tools. Missing runtime does not make source unavailable; use list_files, list_methods and read_file. Finalize only when terminal_eligible is true, using only context_handles from the exact current-request table. For function calls, arguments are the JSON object; for raw stop responses, return exactly the object with no function-name prefix, summary, prose or fences.'],
 ];
 for(const [before,after]of seams){need(effective.split(before).length===2,'acquisition-seam');effective=effective.replace(before,()=>after);}
 effective=effective.replaceAll('submit_method_handles','submit_source_handles')
  .replaceAll('with the final summary and delivered context_handles','with only context_handles from the current-request table');
 const module=await import('data:text/javascript;base64,'+Buffer.from(effective).toString('base64'));
 need(typeof module.runEpisode==='function','native-export');
 loaded={runEpisode:module.runEpisode,binding:{...previous.binding,previous_effective_module_sha256:previous.binding.effective_module_sha256,
  effective_module_sha256:sha(effective),acquisition_seams:seams.map(([before,after])=>({before,after})),
  adaptation:'Exact r3/r4 reconstruction verified, then common acquisition-first request-local terminal declaration/phase capture and selection-only schema/instructions. No model response normalization, fabricated provenance, source_context or ancestor edits.',
  authority_effect:'none'}};return loaded;
}
export async function runAcquisitionMethodEpisode({caseId,arm,task,client,recycler,measure_index_tokens,run_id,on_event,
 view,maximumToolActions=10,limits={}}){
 need(['baseline','index'].includes(arm)&&typeof task?.problem_statement==='string','input');
 need(Number.isSafeInteger(maximumToolActions)&&maximumToolActions>0&&maximumToolActions<=10,'action-cap');
 const native=await loadAcquisitionMethodEpisode(),bound=createExplicitMethodTools({caseId,view,maximumToolActions});
 const configured={maximum_calls:11,output_cap:512,total_tokens:65536,index_entries:10,index_tokens:1024,
  finalization_reserve_tokens:16384,finalization_calls:2,terminal_submission:true,terminal_content_fallback:true,output_deferral:true,
  ...(arm==='index'?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:512,task_state_evidence:8,task_state_outcomes:8}:{}),
  maximum_terminal_corrections:0,incomplete_output_corrections:0,...limits,method_maximum_tool_actions:maximumToolActions};
 need(configured.maximum_calls<=11&&configured.output_cap<=512&&configured.total_tokens<=65536,'numeric-cap');
 need(configured.maximum_terminal_corrections===0&&configured.incomplete_output_corrections===0&&configured.terminal_submission===true&&configured.terminal_content_fallback===true,'strict-terminal');
 const nativeTask={...task,problem_statement:task.problem_statement+'\nCOMMON ACQUISITION-FIRST SOURCE CONTRACT:\nFirst inspect runtime_status; missing runtime does not remove source access. Navigate source catalogs with list_files/list_methods, then acquire complete methods with read_file using exact catalog coordinates. Do not finalize during exploration before complete source is available. When terminal_eligible is true, call submit_source_handles with only {"context_handles":["h0"]}, choosing relevant listed handles most likely file first. An exact raw object with the same schema is accepted. No summary, function-name prefix, prose or fences. All eligible earlier complete reads remain addressable; never select withheld source. Forced finalization may honestly return an empty array; empty is not a valid localization prediction. Missing/zero runtime evidence does not prove source irrelevance.'};
 let allAttempts=0;const hook=async e=>{if(e.kind==='method-tool-attempt')allAttempts++;if(on_event)await on_event(e);};
 const result=await native.runEpisode({task:nativeTask,arm,client,recycler,measure_index_tokens,run_id,tools:bound.tools,execute_tool:bound.execute_tool,limits:configured,on_event:hook});
 const toolState=bound.snapshot();return {...result,native_method_binding:native.binding,
  method_interface_binding:{version:'acquisition-method-r5',terminal_tool:compactPolicy.METHOD_HANDLE_TOOL,terminal_payload_fields:['context_handles'],
   acquisition_first:true,all_eligible_reads_addressable:true,terminal_content_fallback:true,output_deferral:configured.output_deferral,
   finalization_reserve_tokens:configured.finalization_reserve_tokens,finalization_calls:configured.finalization_calls,
   reserves_inside_original_budget:true,physical_line_provenance_claimed:false},
  method_tool_accounting:{...toolState,all_tool_attempts:allAttempts,over_budget:toolState.over_budget||allAttempts>maximumToolActions},
  functionality_valid:result.status==='final_context_selected'&&result.selection?.final_read_ids.length>0&&!toolState.over_budget&&allAttempts<=maximumToolActions,
  claim_ceiling:'Native acquisition/selection interface candidate; live quality and independent confirmation required'};
}
