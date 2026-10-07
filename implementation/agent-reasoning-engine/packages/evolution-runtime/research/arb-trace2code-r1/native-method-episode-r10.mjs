// Profile-bound stateless native successor; canonical and frozen ancestors unchanged.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {loadAcquisitionMethodEpisode} from './native-method-episode-r5.mjs';
import {createExplicitMethodTools} from './explicit-method-tools-r2.mjs';
import {loadProfileBoundModule,profileModuleURL,profileClosureEvidence} from './profile-bound-module-closure-r10.mjs';
const compactPolicy=await loadProfileBoundModule(new URL('./method-selection-terminal-r5.mjs',import.meta.url));
import {ACQUISITION_GUIDANCE_SHA256_R7} from './evidence-acquisition-guidance-r7.mjs';
const navigationState=await loadProfileBoundModule(new URL('./native-navigation-state-r6.mjs',import.meta.url));
import {clarifySelectionContract} from './native-method-contract-r10.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,c)=>{if(!v)throw Error('method-episode-r10.'+c);};
let loaded;
export async function loadProfileBoundMethodEpisode(){
 if(loaded)return loaded;
 const previous=await loadAcquisitionMethodEpisode(),binding=previous.binding;
 const raw=readFileSync(binding.native_source_path);need(sha(raw)===binding.native_source_sha256,'native-source-drift');
 let effective=raw.toString('utf8');
 function apply(seams){for(const {before,after}of seams){need(effective.split(before).length===2,'predecessor-seam');effective=effective.replace(before,()=>after);}}
 apply(binding.seams);
 effective=effective.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g,(_m,prefix,spec,suffix)=>prefix+pathToFileURL(resolve(dirname(binding.native_source_path),spec)).href+suffix);
 apply(binding.compact_seams);
 effective=effective.replaceAll('submit_context_selection','submit_method_handles').replaceAll('context_read_ids','context_handles');
 apply(binding.acquisition_seams);
 effective=effective.replaceAll('submit_method_handles','submit_source_handles').replaceAll('with the final summary and delivered context_handles','with only context_handles from the current-request table');
 need(sha(effective)===binding.effective_module_sha256&&sha(effective)==='fa263221d933d6cc86a9200c813cc99a0d572f93f9b6c9ddc04dde7ceebe5c4b','r5-module-digest');
 const before=new URL('../../../../benchmarks/contextbench-v1/task-state.mjs',import.meta.url).href;
 const after=new URL('./native-navigation-state-r6.mjs',import.meta.url).href;
 need(effective.split(before).length===2&&typeof navigationState.buildTaskStateProjection==='function','navigation-seam');effective=effective.replace(before,()=>after);
 need(sha(effective)==='687d1ee2463a5bbd4213c90e01dd172475f6e60eab6a91916e89425ec499009c','r6-module-digest');
 const predecessorHash=sha(effective);
 const guidanceBefore="const messages=[{role:'system',content:system},{role:'user',content:task.problem_statement},...deliveryVisible];";
 const guidanceAfter="const messages=evidenceGuidedMessagesR7([{role:'system',content:system},{role:'user',content:task.problem_statement},...deliveryVisible],arm);";
 need(effective.split(guidanceBefore).length===2,'guidance-seam');
 effective=effective.replace(guidanceBefore,()=>guidanceAfter);
 const guidanceImport="import {evidenceGuidedMessagesR7} from "+JSON.stringify(new URL('./evidence-acquisition-guidance-r7.mjs',import.meta.url).href)+";\n";
 effective=guidanceImport+effective;
 const originalGuidanceHash=sha(effective);
 need(originalGuidanceHash==='e1ce489e10110872ce755b95d0cc30722a45591078d9d1773ed7f8c9be0ac520','r7-module-digest');
 effective=effective.replace(/(from\s+['"])(file:[^'"]+)(['"])/g,(_m,prefix,url,suffix)=>prefix+profileModuleURL(url)+suffix);
 const module=await import('data:text/javascript;base64,'+Buffer.from(effective).toString('base64'));
 loaded={runEpisode:module.runEpisode,binding:{...binding,previous_effective_module_sha256:originalGuidanceHash,pre_guidance_r6_module_sha256:predecessorHash,provider_profile_closure:profileClosureEvidence(),effective_module_sha256:sha(effective),guidance_sha256:ACQUISITION_GUIDANCE_SHA256_R7,guidance_seams:[{before:guidanceBefore,after:guidanceAfter}],guidance_import:guidanceImport,
  navigation_seams:[{before,after}],adaptation:'Exact frozen r7 effective module verified, then isolate every file import into pinned profile namespace. Shared delivery clears historical thinking; terminal message and common task wording clarify eligibility versus sufficiency equally in both arms. Native eligibility/schema/tools/source/navigation/caps/comparator and r7 guidance unchanged.',authority_effect:'none'}};return loaded;
}
export async function runProfileBoundMethodEpisode({caseId,arm,task,client,recycler,measure_index_tokens,run_id,on_event,
 view,maximumToolActions=10,limits={}}){
 need(['baseline','index'].includes(arm)&&typeof task?.problem_statement==='string'&&task.native_navigation_case_id===undefined,'input');
 need(Number.isSafeInteger(maximumToolActions)&&maximumToolActions>0&&maximumToolActions<=10,'action-cap');
 const native=await loadProfileBoundMethodEpisode(),bound=createExplicitMethodTools({caseId,view,maximumToolActions});
 const configured={maximum_calls:11,output_cap:512,total_tokens:65536,index_entries:10,index_tokens:1024,
  finalization_reserve_tokens:16384,finalization_calls:2,terminal_submission:true,terminal_content_fallback:true,output_deferral:true,
  ...(arm==='index'?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:512,task_state_evidence:8,task_state_outcomes:8}:{}),
  maximum_terminal_corrections:0,incomplete_output_corrections:0,...limits,method_maximum_tool_actions:maximumToolActions};
 need(configured.maximum_calls<=11&&configured.output_cap<=512&&configured.total_tokens<=65536,'numeric-cap');
 need(configured.maximum_terminal_corrections===0&&configured.incomplete_output_corrections===0&&configured.terminal_submission===true&&configured.terminal_content_fallback===true,'strict-terminal');
 const nativeTask={...task,native_navigation_case_id:caseId,problem_statement:task.problem_statement+'\nCOMMON ACQUISITION-FIRST SOURCE CONTRACT:\nFirst inspect runtime_status; missing runtime does not remove source access. Navigate source catalogs with list_files/list_methods, then acquire complete methods with read_file using exact catalog coordinates. Do not finalize during exploration before complete source is available. terminal_eligible only permits selection; it does not mean the failure is explained. If uncertainty remains, use remaining actions to inspect a relevant alternative. Select when evidence is sufficient or forced finalization requires it. When selecting, call submit_source_handles with only {"context_handles":["h0"]}, choosing relevant listed handles most likely file first. An exact raw object with the same schema is accepted. No summary, function-name prefix, prose or fences. All eligible earlier complete reads remain addressable; never select withheld source. Forced finalization may honestly return an empty array; empty is not a valid localization prediction. Missing/zero runtime evidence does not prove source irrelevance.'};
 let allAttempts=0;const hook=async e=>{if(e.kind==='method-tool-attempt')allAttempts++;if(on_event)await on_event(e);};
 const result=await native.runEpisode({task:nativeTask,arm,client,recycler,measure_index_tokens,run_id,tools:bound.tools,execute_tool:bound.execute_tool,limits:configured,on_event:hook});
 const toolState=bound.snapshot();return {...result,native_method_binding:native.binding,
  method_interface_binding:{version:'profile-bound-method-r10',shared_clear_thinking:true,evidence_acquisition_guidance:arm==='index',guidance_sha256:arm==='index'?ACQUISITION_GUIDANCE_SHA256_R7:null,terminal_tool:compactPolicy.METHOD_HANDLE_TOOL,terminal_payload_fields:['context_handles'],
   acquisition_first:true,navigation_state_projection:arm==='index',navigation_state_caps:{maximum_tokens:512,maximum_bytes:4096},all_eligible_reads_addressable:true,terminal_content_fallback:true,output_deferral:configured.output_deferral,
   finalization_reserve_tokens:configured.finalization_reserve_tokens,finalization_calls:configured.finalization_calls,
   reserves_inside_original_budget:true,physical_line_provenance_claimed:false},
  method_tool_accounting:{...toolState,all_tool_attempts:allAttempts,over_budget:toolState.over_budget||allAttempts>maximumToolActions},
  functionality_valid:result.status==='final_context_selected'&&result.selection?.final_read_ids.length>0&&!toolState.over_budget&&allAttempts<=maximumToolActions,
  claim_ceiling:'Native acquisition/selection interface candidate; live quality and independent confirmation required'};
}
