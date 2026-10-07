// Separately versioned trusted method-byte adaptation of the actual native loop.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R3.json.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {createExplicitMethodTools} from './explicit-method-tools-r2.mjs';
const nativePath=fileURLToPath(new URL('../../../../benchmarks/contextbench-v1/episode.mjs',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,c)=>{if(!v)throw Error('method-episode-r3.'+c);};
let loaded;
export async function loadReliableMethodEpisode(){
 if(loaded)return loaded;
 const raw=readFileSync(nativePath);let effective=raw.toString('utf8');
 const seams=[
  ['Resolve the repository issue and attempt a source patch using the available tools.',
   'Localize the faulty production implementation using read-only tools. Never patch or claim verified repair. Select complete delivered method evidence for likely faulty files, most likely first; observations do not prove fault or irrelevance.'],
  ['let deliveryVisible=source_context?retainPendingToolExchange(visible,exchange):visible;',
   'let deliveryVisible=retainPendingToolExchange(visible,exchange);'],
  ['if(source_context)pendingToolExchange=[message];','pendingToolExchange=[message];'],
  ['history.push(toolMessage);if(source_context)pendingToolExchange.push(toolMessage);',
   'history.push(toolMessage);pendingToolExchange.push(toolMessage);'],
  // Only these two source_context prerequisites are adapted. No invented
  // provenance callback; physical-line/patch/terminal-effect logic stays off.
  ['(outputDeferral&&!source_context)','false'],
  ['(terminalSubmission&&!source_context)','false'],
  ["im"+"port {deferReadOnlyOutputs} from './output-deferral.mjs';",
   "im"+"port {deferMethodOutputs as deferReadOnlyOutputs} from '"+new URL('./method-output-deferral-r3.mjs',import.meta.url).href+"';"],
  ['  try {\n    for(let step=activeStep;',
   '  let methodToolAttempts=0;\n  try {\n    for(let step=activeStep;'],
  ['      activeStep=step;',
   "      activeStep=step;\n      if(!finalizing&&methodToolAttempts>=limits.method_maximum_tool_actions){finalizing=true;await on_event({kind:'finalization-start',step,reason:'repository-action-capacity'});}"],
  ['Model calls remaining including this one: ${limits.maximum_calls-step}. Final response must be the specified JSON.',
   'Repository actions remaining: ${limits.method_maximum_tool_actions-methodToolAttempts}; every invalid/recovery attempt consumes one. Do not batch more calls than remain. Prefer one concise call per response. Model calls remaining including this one: ${limits.maximum_calls-step}. Final response must be the specified JSON.'],
  ['for(const call of message.tool_calls){',
   "for(const call of message.tool_calls){methodToolAttempts++;await on_event({kind:'method-tool-attempt',step,tool:call.function.name,attempt:methodToolAttempts});if(methodToolAttempts>limits.method_maximum_tool_actions)throw Error('method-episode.all-tool-action-budget-exhausted');"]
 ];
 for(const [before,after]of seams){need(effective.split(before).length===2,'single-native-seam-binding');effective=effective.replace(before,()=>after);}
 effective=effective.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g,(_m,prefix,spec,suffix)=>prefix+pathToFileURL(resolve(dirname(nativePath),spec)).href+suffix);
 const module=await import('data:text/javascript;base64,'+Buffer.from(effective).toString('base64'));
 need(typeof module.runEpisode==='function','native-export');
 loaded={runEpisode:module.runEpisode,binding:{native_source_path:nativePath,native_source_sha256:sha(raw),
  effective_module_sha256:sha(effective),seams:seams.map(([before,after])=>({before,after})),
  adaptation:'Method-byte terminal/deferral guards, method-specific deferred projection, unconditional pending exchange, shared exact action headroom and localization instruction. Native dispatch/recycler/index/receipt/selectors reused; canonical source and r1/r2 unchanged.',
  physical_line_provenance_claimed:false,authority_effect:'none'}};return loaded;
}
export async function runReliableMethodEpisode({caseId,arm,task,client,recycler,measure_index_tokens,run_id,on_event,
 view,maximumToolActions=10,limits={}}){
 need(['baseline','index'].includes(arm)&&typeof task?.problem_statement==='string','input');
 need(Number.isSafeInteger(maximumToolActions)&&maximumToolActions>0&&maximumToolActions<=10,'action-cap');
 const native=await loadReliableMethodEpisode(),bound=createExplicitMethodTools({caseId,view,maximumToolActions});
 const configured={maximum_calls:11,output_cap:512,total_tokens:65536,index_entries:10,index_tokens:1024,
  finalization_reserve_tokens:16384,finalization_calls:2,terminal_submission:true,terminal_content_fallback:true,output_deferral:true,
  ...(arm==='index'?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:512,task_state_evidence:8,task_state_outcomes:8}:{}),
  maximum_terminal_corrections:0,incomplete_output_corrections:0,...limits,method_maximum_tool_actions:maximumToolActions};
 need(configured.maximum_calls<=11&&configured.output_cap<=512&&configured.total_tokens<=65536,'numeric-cap');
 need(configured.maximum_terminal_corrections===0&&configured.incomplete_output_corrections===0,'no-correction');
 const nativeTask={...task,problem_statement:task.problem_statement+'\nCOMMON METHOD CONTRACT:\nPrefer submit_context_selection once with a brief summary and unique exact delivered read IDs, most likely file first. It is a terminal declaration, not a repository action. An exact raw JSON object with the same schema is also accepted. No prose/fences, patch, invented ID, or partial-method selection. Withheld capacity notices deliver no source. An honest empty selection is allowed but is not a valid localization prediction.'};
 let allAttempts=0;
 const eventHook=async event=>{if(event.kind==='method-tool-attempt')allAttempts++;if(on_event)await on_event(event);};
 const result=await native.runEpisode({task:nativeTask,arm,client,recycler,measure_index_tokens,run_id,
  tools:bound.tools,execute_tool:bound.execute_tool,limits:configured,on_event:eventHook});
 const toolState=bound.snapshot();
 return {...result,native_method_binding:native.binding,
  method_interface_binding:{version:'reliable-method-r3',terminal_submission:configured.terminal_submission,
   terminal_content_fallback:configured.terminal_content_fallback,output_deferral:configured.output_deferral,
   finalization_reserve_tokens:configured.finalization_reserve_tokens,finalization_calls:configured.finalization_calls,
   reserves_inside_original_budget:true,physical_line_provenance_claimed:false},
  method_tool_accounting:{...toolState,all_tool_attempts:allAttempts,over_budget:toolState.over_budget||allAttempts>maximumToolActions},
  functionality_valid:result.status==='final_context_selected'&&result.selection?.final_read_ids.length>0&&!toolState.over_budget&&allAttempts<=maximumToolActions,
  claim_ceiling:'Source-qualified private method-native candidate only; actual paired quality and disjoint confirmation remain required'};
}
