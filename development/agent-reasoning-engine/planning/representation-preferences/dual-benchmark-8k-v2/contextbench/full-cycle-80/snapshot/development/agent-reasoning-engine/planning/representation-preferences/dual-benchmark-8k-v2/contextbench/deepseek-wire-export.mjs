// Actual DSH streaming-wire binding; no ARE body reconstruction or archive union.
// Open questions: DEEPSEEK-WIRE-EXPORT.md.
import {createHash} from 'node:crypto';
import {stable,observationItems,observationMaterial} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {FINAL_SCHEMA} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-schema.mjs';
import {diagnoseSourceSelection} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/provenance-validator.mjs';
import {projectObservationsToBase} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs';
import {exportTrajectory} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/export.mjs';
import {visibleToolObservations} from './deepseek-delivery-view.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const need=(v,m)=>{if(!v)throw Error('dsh-wire.'+m);};
const uint=v=>Number.isSafeInteger(v)&&v>=0;
const plus=(a,b)=>{need(uint(a)&&uint(b)&&Number.isSafeInteger(a+b),'token-overflow');return a+b;};
const callMaterial=c=>({id:c.id,name:c.function?.name,args:JSON.parse(c.function?.arguments)});
export function parseDeepSeekStream(bytes,{allowUnsuccessful=false}={}){
 need(typeof bytes==='string'&&Buffer.byteLength(bytes)<=16*1024**2,'response-size');
 const calls=new Map();let done=false,finish=null,usage=null,model=null;
 for(const frame of bytes.replaceAll('\r\n','\n').split('\n\n')){
  if(!frame.trim())continue;
  const lines=frame.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trimStart());
  if(!lines.length)continue;
  need(!done,'data-after-done');const data=lines.join('\n');if(data==='[DONE]'){done=true;continue;}
  let value;try{value=JSON.parse(data);}catch{throw Error('dsh-wire.invalid-stream-json');}
  need(value&&typeof value==='object'&&!value.error,'provider-error');
  if(value.model!==undefined){need(typeof value.model==='string'&&(!model||model===value.model),'response-model-drift');model=value.model;}
  if(value.usage){need(usage===null||stable(usage)===stable(value.usage),'usage-conflict');usage=value.usage;}
  need(Array.isArray(value.choices)&&value.choices.length<=1,'choices');
  for(const choice of value.choices){
   need(finish===null,'choice-after-finish');
   need(choice.index===0&&choice.delta&&typeof choice.delta==='object','choice-shape');
   if(choice.finish_reason!==null&&choice.finish_reason!==undefined){need(finish===null,'duplicate-finish');finish=choice.finish_reason;}
   const delta=choice.delta;need(delta.role===undefined||delta.role==='assistant','response-role');
   if(delta.tool_calls!==undefined){need(Array.isArray(delta.tool_calls),'tool-deltas');for(const c of delta.tool_calls){
    need(uint(c.index)&&c.index<8,'tool-index');const prior=calls.get(c.index)??{id:'',type:'function',function:{name:'',arguments:''}};
    need(c.type===undefined||c.type==='function','tool-type');
    for(const [key,target] of [['id',prior],['name',prior.function],['arguments',prior.function]]){const fragment=key==='id'?c.id:c.function?.[key];if(fragment!==undefined){need(typeof fragment==='string','tool-fragment');target[key]+=fragment;}}
    calls.set(c.index,prior);
   }}
  }
 }
 need(done&&finish!==null,'incomplete-stream');const successful=['tool_calls','stop'].includes(finish);need(successful||(allowUnsuccessful&&['length','sensitive','model_context_window_exceeded','network_error','content_filter'].includes(finish)),'unsuccessful-finish');
 need(usage&&uint(usage.prompt_tokens)&&uint(usage.completion_tokens)&&uint(usage.total_tokens),'usage-required');
 need(plus(usage.prompt_tokens,usage.completion_tokens)===usage.total_tokens,'usage-total');
 // A complete unsuccessful response belongs to the harness. Partial tool arguments
 // are never promoted to executable calls or source evidence by this parser.
 if(!successful)return {model,finish_reason:finish,tool_calls:[],usage};
 const ordered=[...calls].sort((a,b)=>a[0]-b[0]);
 need(ordered.every(([i,c],n)=>i===n&&c.id&&c.function.name),'tool-identities');
 const tool_calls=ordered.map(([,c])=>c);need(new Set(tool_calls.map(c=>c.id)).size===tool_calls.length,'duplicate-response-tool');
 need(finish==='tool_calls'?tool_calls.length>0:tool_calls.length===0,'finish-tools-mismatch');
 for(const c of tool_calls){const args=callMaterial(c).args;need(args&&typeof args==='object'&&!Array.isArray(args),'tool-arguments');}
 return {model,finish_reason:finish,tool_calls,usage};
}
export function exportDeepSeekWire({exchanges,records,task,repoRoot}){
 need(Array.isArray(exchanges)&&exchanges.length>0&&exchanges.length<=96&&Array.isArray(records),'inputs');
 const results=new Map(),intents=new Map(),snapshots=[],terminals=[];
 for(const record of records){
  need(terminals.length===0,'record-after-terminal');
  if(record.kind==='tool-intent'){need(record.call?.id&&!intents.has(record.call.id),'duplicate-intent');intents.set(record.call.id,record.call);}
  if(record.kind==='source-snapshot')snapshots.push(record.snapshot);
  if(record.kind==='tool-result'){need(intents.has(record.call?.id)&&stable(callMaterial(intents.get(record.call.id)))===stable(callMaterial(record.call)),'result-without-intent');need(record.call?.id&&!results.has(record.call.id),'duplicate-result');need(record.cancelled_after_execution===false,'cancelled-result');results.set(record.call.id,record);}
  if(record.kind==='terminal-candidate')terminals.push(record);
 }
 need(terminals.length===1,'terminal-candidate-count');
 const issued=new Map(),reads=new Map(),requests=[];let input=0,output=0,last;
 for(const [index,e] of exchanges.entries()){
  need(e&&e.status===200&&typeof e.request_bytes==='string'&&typeof e.response_bytes==='string','successful-exchange-required');
  need(hash(e.request_bytes)===e.request_sha256&&hash(e.response_bytes)===e.response_sha256,'wire-digest');
  need(Buffer.byteLength(e.request_bytes)<=32*1024**2,'request-size');
  const body=JSON.parse(e.request_bytes),response=parseDeepSeekStream(e.response_bytes,{allowUnsuccessful:true});
  need(body.model==='glm-5.3-flash'&&response.model===body.model&&body.stream===true&&Array.isArray(body.messages)&&(body.tools===undefined||Array.isArray(body.tools)),'request-profile');
  const cap=body.max_tokens??body.max_completion_tokens;need(uint(cap)&&cap>0&&response.usage.completion_tokens<=cap,'output-cap');
  input=plus(input,response.usage.prompt_tokens);output=plus(output,response.usage.completion_tokens);
  const visibleCalls=new Map(),visibleResults=new Set(),confirmed=[];
  for(const message of body.messages){
   if(message.role==='assistant')for(const call of message.tool_calls??[]){
    need(issued.has(call.id)&&stable(callMaterial(call))===stable(callMaterial(issued.get(call.id))),'assistant-call-not-issued');
    need(!visibleCalls.has(call.id),'duplicate-visible-call');visibleCalls.set(call.id,call);
   }
   if(message.role!=='tool')continue;
   need(!visibleResults.has(message.tool_call_id),'duplicate-visible-result');visibleResults.add(message.tool_call_id);
   const call=visibleCalls.get(message.tool_call_id);need(call,'orphan-tool-result');
   const record=results.get(call.id);
   if(call.function.name==='submit_context_selection')continue; // Rejection feedback is not source evidence.
   need(record&&stable(callMaterial(record.call))===stable(callMaterial(call)),'tool-record-mismatch');
   const delivery=visibleToolObservations({call,output:record.output,content:message.content});
   for(const {tool_call_id,o} of delivery.observations){
    const args=callMaterial(call).args;
    if(call.function.name==='search')need(typeof args.query==='string'&&o.utf8.includes(args.query)&&o.path.startsWith(args.path_prefix??''),'search-arguments-output');
    else need(args.path===o.path&&args.start_line===o.start_line,'read-arguments-output');
    const material=observationMaterial(tool_call_id,o),id=hash(stable(material));need(o.read_id===id,'observation-id');
    if(!reads.has(id))reads.set(id,{id,...material,first_confirmed_receipt:index,confirmed_receipts:[]});
    const r=reads.get(id);if(!r.confirmed_receipts.includes(index))r.confirmed_receipts.push(index);confirmed.push(id);
   }
  }
  for(const call of response.tool_calls){need(!issued.has(call.id),'reused-response-tool-id');need((body.tools??[]).some(t=>t.function?.name===call.function.name),'unadvertised-tool');issued.set(call.id,call);}
  requests.push({index,request_sha256:e.request_sha256,response_sha256:e.response_sha256,read_ids:[...new Set(confirmed)]});last={body,response};
 }
 need(last.response.finish_reason==='tool_calls'&&last.response.tool_calls.length===1,'terminal-response');
 const final=last.response.tool_calls[0],candidate=terminals[0];
 need(final.function.name==='submit_context_selection'&&final.id===candidate.call_id,'terminal-call');
 need((last.body.tools??[]).some(t=>t.function?.name==='submit_context_selection'&&stable(t.function.parameters)===stable(FINAL_SCHEMA)),'terminal-schema');
 const selection=JSON.parse(final.function.arguments);need(stable(selection)===stable(candidate.selection),'terminal-selection-mismatch');
 const observed=[...reads.values()],diagnostic=diagnoseSourceSelection({raw:stable(selection),reads:observed,snapshots,repoRoot});need(diagnostic.ok,'selected-source-not-delivered-or-invalid');
 const projection=projectObservationsToBase(observed,snapshots,repoRoot),selected=new Set(selection.context_read_ids);
 const final_event_ids=projection.projections.filter(p=>selected.has(p.read_id)).flatMap(p=>p.event_ids);
 const exported=exportTrajectory({schema_version:'are.context-delivery-ledger/v1',instance_id:task.instance_id,repo_url:task.repo_url,commit:task.base_commit,events:projection.events,final_event_ids},repoRoot);
 return {...exported,requests,read_observations:observed,selection,source_projection:projection,token_accounting:{known_input_tokens:input,known_output_tokens:output,known_total_tokens:plus(input,output),model_calls:exchanges.length},claim_ceiling:'Caller-pinned complete successful streaming exchanges and recorded source results; durable run completeness, request admission and provider authenticity require separate evidence.',benchmark_cleared:false};
}
