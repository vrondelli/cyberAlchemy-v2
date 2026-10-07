// Benchmark-only adaptation of the actual native episode loop; no core edits.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R1.json.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {createFrozenAdaptiveCommonTools} from './adaptive-common-tools-r1.mjs';
const nativePath=fileURLToPath(new URL('../../../../benchmarks/contextbench-v1/episode.mjs',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,c)=>{if(!v)throw Error('method-episode.'+c);};
const oldInstruction='Resolve the repository issue and attempt a source patch using the available tools.';
const newInstruction='Localize the faulty production implementation using the available read-only tools. Do not attempt a patch or claim a verified repair. Select delivered complete-method evidence for the most likely faulty files, most likely first; observations alone do not prove fault or irrelevance.';
let loaded=null;
export async function loadNativeMethodEpisode(){
 if(loaded)return loaded;
 const raw=readFileSync(nativePath),source=raw.toString('utf8');
 need(source.split(oldInstruction).length===2,'single-native-instruction-binding');
 let effective=source.replace(oldInstruction,()=>newInstruction);
 const replacements=[
  ['let deliveryVisible=source_context?retainPendingToolExchange(visible,exchange):visible;',
   'let deliveryVisible=retainPendingToolExchange(visible,exchange);'],
  ['if(source_context)pendingToolExchange=[message];','pendingToolExchange=[message];'],
  ['history.push(toolMessage);if(source_context)pendingToolExchange.push(toolMessage);',
   'history.push(toolMessage);pendingToolExchange.push(toolMessage);'],
  ['for(const call of message.tool_calls){',
   "for(const call of message.tool_calls){await on_event({kind:'method-tool-attempt',step,tool:call.function.name});"]
 ];
 for(const [before,after]of replacements){need(effective.split(before).length===2,'single-native-seam-binding');effective=effective.replace(before,()=>after);}
 effective=effective.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g,(_m,prefix,spec,suffix)=>prefix+pathToFileURL(resolve(dirname(nativePath),spec)).href+suffix);
 const module=await import('data:text/javascript;base64,'+Buffer.from(effective).toString('base64'));
 need(typeof module.runEpisode==='function','native-export');
 loaded={runEpisode:module.runEpisode,binding:{native_source_path:nativePath,native_source_sha256:sha(raw),
  effective_module_sha256:sha(effective),adaptation:'One localization instruction, three unconditional native pending-exchange retention seams and one pre-tool action-budget event, plus absolute dependency URLs. Native dispatch/recycler/budget/index/receipt/final-selection logic reused; canonical runner unchanged.',
  authority_effect:'none'}};return loaded;
}
const closed=(args,keys)=>args&&typeof args==='object'&&!Array.isArray(args)&&Object.keys(args).every(k=>keys.includes(k));
const stringSchema={type:'string',minLength:1};
const tool=(name,description,properties,required)=>({type:'function',function:{name,description,
 parameters:{type:'object',additionalProperties:false,properties,required}}});
export function createMethodEpisodeTools({caseId,view=createFrozenAdaptiveCommonTools(),maximumToolActions=10}){
 need(typeof caseId==='string'&&caseId.length>0&&typeof view==='function'&&Number.isSafeInteger(maximumToolActions)&&maximumToolActions>0,'tool-host');
 const tools=[tool('method_navigation','Read the exact source/runtime catalog for this case. Runtime positives are command-phase observations, not proof of fault; missing/zero does not mean irrelevant. Paginate explicitly.',{
  operation:{enum:['list_files','list_methods','list_references','runtime_status','list_runtime_methods']},
  path:stringSchema,name:stringSchema,arity:{type:'integer',minimum:0,maximum:1024},method_id:stringSchema,
  offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:50},
  positive_only:{type:'boolean'},class_name:stringSchema,source_method_id:stringSchema},['operation']),
 tool('read_file','Read one COMPLETE canonical method span, not an arbitrary file/window. Supply exact method_id, its path and source_span.start_line from the method catalog. Returns a source-bound read_id; size failures are explicit.',{
  method_id:stringSchema,path:stringSchema,start_line:{type:'integer',minimum:1}},['method_id','path','start_line']),
 tool('recover_observed_read','Recover an exact previously delivered source read using its handle; this does not acquire new source.',{
  retrieval_handle:stringSchema},['retrieval_handle'])];
 let attempts=0;const ledger=[];
 const record=(name,args,output)=>{ledger.push({ordinal:attempts,name,args,output_sha256:sha(JSON.stringify(output))});return output;};
 async function execute_tool(name,args){
  attempts++;
  if(attempts>maximumToolActions)return record(name,args,{ok:false,error:'method-episode.tool-action-budget-exhausted'});
  if(name==='method_navigation'){
   need(closed(args,['operation','path','name','arity','method_id','offset','limit','positive_only','class_name','source_method_id'])&&
    ['list_files','list_methods','list_references','runtime_status','list_runtime_methods'].includes(args.operation),'navigation-request');
   const output=view({...args,case_id:caseId});return record(name,args,{ok:true,output});
  }
  need(name==='read_file'&&closed(args,['method_id','path','start_line'])&&typeof args.method_id==='string'&&
   typeof args.path==='string'&&Number.isSafeInteger(args.start_line)&&args.start_line>=1,'source-request');
  const reply=view({operation:'get_method',case_id:caseId,method_id:args.method_id});
  if(reply.status!=='method-source')return record(name,args,{ok:false,error:'method-episode.'+reply.status,evidence:reply});
  need(reply.path===args.path&&reply.method.source_span.start_line===args.start_line,'source-coordinate-mismatch');
  const output={path:reply.path,start_line:args.start_line,end_line:reply.method.source_span.end_line,
   utf8:reply.source,byte_count:Buffer.byteLength(reply.source),source_sha256:reply.source_sha256,
   method_source_sha256:reply.method_source_sha256,method_id:args.method_id,
   source_byte_start:reply.method.source_span.start_utf8,source_byte_end:reply.method.source_span.end_utf8,
   source_scope:'exact complete method byte span; not whole physical lines or entire file',complete_method:true,
   runtime_method_execution_inferred:false};
  return record(name,args,{ok:true,output});
 }
 return {tools,execute_tool,snapshot:()=>({attempts,maximumToolActions,over_budget:attempts>maximumToolActions,ledger})};
}
export async function runNativeMethodEpisode({caseId,arm,task,client,recycler,measure_index_tokens,run_id,on_event,
 view,maximumToolActions=10,limits={}}){
 need(['baseline','index'].includes(arm),'arm');
 const native=await loadNativeMethodEpisode(),bound=createMethodEpisodeTools({caseId,view,maximumToolActions});
 const configured={maximum_calls:11,output_cap:512,total_tokens:65536,index_entries:10,index_tokens:1024,
  ...(arm==='index'?{task_state_projection:true,task_state_bytes:4096,task_state_tokens:512,
   task_state_evidence:8,task_state_outcomes:8}:{}),
  maximum_terminal_corrections:0,incomplete_output_corrections:0,...limits};
 let allAttempts=0;
 const eventHook=async event=>{
  if(event.kind==='method-tool-attempt'){allAttempts++;need(allAttempts<=maximumToolActions,'all-tool-action-budget-exhausted');}
  if(on_event)await on_event(event);
 };
 const result=await native.runEpisode({task,arm,client,recycler,measure_index_tokens,run_id,
  tools:bound.tools,execute_tool:bound.execute_tool,limits:configured,on_event:eventHook});
 const toolState=bound.snapshot();
 return {...result,native_method_binding:native.binding,method_tool_accounting:{...toolState,all_tool_attempts:allAttempts,over_budget:toolState.over_budget||allAttempts>maximumToolActions},
  functionality_valid:result.status==='final_context_selected'&&result.selection?.final_read_ids.length>0&&!toolState.over_budget&&allAttempts<=maximumToolActions,
  claim_ceiling:'Native adapted localization episode; no accuracy or superiority without paired native scoring/confirmation'};
}
