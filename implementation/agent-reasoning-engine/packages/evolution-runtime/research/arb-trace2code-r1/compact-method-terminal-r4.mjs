// Common all-evidence formatter/selector candidate, never a ranked slate.
// Open Questions: evidence/G01-COMPACT-METHOD-TERMINAL-R4.json.
import {createHash} from 'node:crypto';
import {stable,bindDelivery,bodyForReceipt,observationMaterial} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {parseBoundedJSON,validatePatchShape} from '../../../../packages/coding-agent-runtime/patch-schema.mjs';
export const METHOD_HANDLE_TOOL='submit_method_handles';
const version='are.compact-method-terminal/v1',sha=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const need=(v,c)=>{if(!v)throw Error('method-handles.'+c);};
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const rowKeys=['handle','read_id','path','start_line','end_line'];
function checkTable(table){
 need(table?.schema_version===version&&Array.isArray(table.bindings)&&table.bindings.length<=10,'table-shape');
 need(Object.keys(table).every(k=>['schema_version','bindings','table_sha256'].includes(k)),'table-extra-fields');
 need(table.bindings.every((r,i)=>r&&Object.keys(r).length===5&&Object.keys(r).every(k=>rowKeys.includes(k))&&
  r.handle==='h'+i&&/^[a-f0-9]{64}$/.test(r.read_id??'')&&typeof r.path==='string'&&r.path.length>0&&
  uint(r.start_line)&&r.start_line>0&&uint(r.end_line)&&r.end_line>=r.start_line),'binding-shape');
 need(new Set(table.bindings.map(r=>r.read_id)).size===table.bindings.length,'duplicate-private-id');
 need(table.table_sha256===sha({schema_version:version,bindings:table.bindings}),'table-digest');
}
function methodRows(messages){
 need(Array.isArray(messages),'messages');const calls=new Map(),rows=[];
 for(const message of messages){
  if(message.role==='assistant')for(const call of message.tool_calls??[]){
   if(calls.has(call.id))need(stable(calls.get(call.id))===stable(call),'call-identity');calls.set(call.id,call);
  }
  if(message.role!=='tool')continue;
  const call=calls.get(message.tool_call_id);if(call?.function?.name!=='read_file')continue;
  let result;try{result=JSON.parse(message.content);}catch{throw Error('method-handles.unparseable-read');}
  if(result?.ok!==true)continue; // Errors/deferral notices supply no source row.
  const args=JSON.parse(call.function.arguments),o=result.output;
  need(o?.complete_method===true&&typeof o.method_id==='string'&&args.method_id===o.method_id,'complete-method-required');
  need(uint(o.source_byte_start)&&uint(o.source_byte_end)&&o.source_byte_end>=o.source_byte_start&&
   uint(o.byte_count)&&o.byte_count===o.source_byte_end-o.source_byte_start&&o.byte_count===Buffer.byteLength(o.utf8??''),'complete-byte-extent');
  need(o.method_source_sha256===sha(o.utf8),'method-byte-digest');
  const material=observationMaterial(call.id,o),id=sha(material);
  need(o.read_id===id&&args.path===o.path&&args.start_line===o.start_line,'observation-binding');
  rows.push({read_id:id,path:o.path,start_line:o.start_line,end_line:o.end_line});
 }
 return rows;
}
export function buildMethodHandleTable({captures,receipts,messages}){
 const binding=bindDelivery({captures,receipts});need(binding.unmapped.length===0,'unmapped-source');
 const qualified=new Map();
 for(const request of binding.requests.filter(r=>r.posture==='confirmed-successful-request')){
  const rendered=JSON.parse(captures[request.capture_indices[0]].prompt);
  for(const row of methodRows(rendered.messages))qualified.set(row.read_id,row);
 }
 const rows=new Map();
 for(const read of binding.read_observations){need(qualified.has(read.id),'confirmed-nonmethod-source');rows.set(read.id,qualified.get(read.id));}
 // These are prospective render candidates, NOT receipts or delivery credit.
 // A projected notice has ok:false and therefore cannot expose withheld IDs.
 for(const row of methodRows(messages)){
  if(rows.has(row.read_id))need(stable(rows.get(row.read_id))===stable(row),'source-row-drift');rows.set(row.read_id,row);
 }
 need(rows.size<=10,'original-read-action-cap'); // No slating, trimming or eviction.
 const table={schema_version:version,bindings:[...rows.values()].map((r,i)=>({handle:'h'+i,...r}))};
 table.table_sha256=sha(table);checkTable(table);return table;
}
export function methodHandleSchema(table){
 checkTable(table);
 return {type:'object',additionalProperties:false,required:['summary','context_handles'],properties:{
  summary:{type:'string',pattern:'^[\\s\\S]{0,160}$'},
  context_handles:{type:'array',maxItems:table.bindings.length,items:{type:'string',
   ...(table.bindings.length?{enum:table.bindings.map(r=>r.handle)}:{pattern:'^h[0-9]$'})}}}};
}
export function methodHandleTool(table){
 return {type:'function',function:{name:METHOD_HANDLE_TOOL,
  description:'Finish with relevant listed handles, most likely file first. Summary at most160 characters. No duplicate prose outside arguments. No repository action.',
  parameters:methodHandleSchema(table)}};
}
export function methodHandleMessage(table){
 checkTable(table);return {role:'user',content:stable({method_terminal_handles:{schema_version:version,table_sha256:table.table_sha256,
  evidence:table.bindings.map(({read_id,...publicRow})=>publicRow)},
  contract:'Use submit_method_handles once or exact raw JSON with summary/context_handles. Choose only relevant listed handles, most likely file first, up to8 distinct files. Keep summary at most160 characters; no separate prose. Empty honestly reports inability and is not a valid localization prediction. Handles grant no source credit without successful request delivery.'})};
}
function diagnose(raw,table){
 const parsed=parseBoundedJSON(raw);
 if(!parsed.ok)return {...parsed,category:'invalid-json'};
 const result=validatePatchShape(parsed.value,methodHandleSchema(table)),issues=[...result.issues];
 const handles=parsed.value.context_handles;
 if(Array.isArray(handles)&&new Set(handles).size!==handles.length)issues.push({code:'method-handles.duplicate-handle'});
 return {...result,ok:issues.length===0&&!result.truncated,issues,value:parsed.value,
  category:issues.some(x=>x.code==='method-handles.duplicate-handle')?'duplicate-handles':'invalid-schema'};
}
export function selectMethodHandleSubmission({captures,receipts,response_capture,table}){
 checkTable(table);const c=response_capture;need(c&&typeof c==='object','capture-required');
 const {capture_sha256,...material}=c;need(sha(material)===capture_sha256,'capture-digest');
 need(uint(c.receipt_index),'receipt-index');const r=receipts[c.receipt_index];
 need(r?.kind==='model'&&r.dispatched===true&&!r.dispatch_uncertain&&r.status===200&&!r.failure_code&&
  sha(r)===c.receipt_sha256&&r.request_sha256===c.request_sha256,'receipt-mismatch');
 need(!receipts.slice(c.receipt_index+1).some(x=>x.kind==='model'&&x.dispatched===true),'not-terminal-response');
 const binding=bindDelivery({captures,receipts});need(!binding.unmapped.length&&binding.token_accounting.cost_complete,'delivery-or-usage');
 const request=binding.requests.find(x=>x.receipt_index===c.receipt_index&&x.posture==='confirmed-successful-request');
 need(request,'unconfirmed-response');const rendered=JSON.parse(captures[request.capture_indices[0]].prompt);
 need(sha(stable(bodyForReceipt(captures[request.capture_indices[0]].prompt,r)))===r.request_sha256,'request-binding');
 const tables=rendered.messages.filter(m=>m.role==='user').filter(m=>{
  try{return Object.hasOwn(JSON.parse(m.content),'method_terminal_handles');}catch{return false;}
 });
 need(tables.length===1&&stable(tables[0])===stable(methodHandleMessage(table)),'exact-request-table-required');
 const tools=rendered.tools.filter(t=>t.function?.name===METHOD_HANDLE_TOOL);
 need(tools.length===1&&stable(tools[0])===stable(methodHandleTool(table)),'exact-declared-tool-required');
 const byId=new Map(binding.read_observations.map(x=>[x.id,x]));
 need(byId.size===table.bindings.length&&table.bindings.every(row=>{
  const read=byId.get(row.read_id);return read&&read.path===row.path&&read.start_line===row.start_line&&read.end_line===row.end_line;
 }),'all-handles-confirmed-no-slate');
 const p=c.public_response,calls=p?.message?.tool_calls;need(p?.message?.role==='assistant'&&p.finish_reason===r.finish_reason,'response-profile');
 let raw,terminalCall;
 if(calls?.length){
  need(p.finish_reason==='tool_calls'&&calls.length===1&&calls[0].function?.name===METHOD_HANDLE_TOOL&&
   typeof calls[0].function.arguments==='string','terminal-tool-required');terminalCall=calls[0];raw=terminalCall.function.arguments;
 }else{need(p.finish_reason==='stop'&&!calls,'terminal-text-required');raw=p.message.content;}
 const diagnostic=diagnose(raw,table);
 if(!diagnostic.ok){const error=Error('method-handles.'+diagnostic.category);error.diagnostic=diagnostic;throw error;}
 const privateIds=new Map(table.bindings.map(row=>[row.handle,row.read_id]));
 const final_read_ids=diagnostic.value.context_handles.map(h=>{need(privateIds.has(h),'unknown-handle');return privateIds.get(h);});
 need(new Set(final_read_ids.map(id=>byId.get(id).path)).size<=8,'original-eight-file-cap');
 return {final_read_ids,summary:diagnostic.value.summary,model_context_handles:diagnostic.value.context_handles,
  response_capture_sha256:c.capture_sha256,request_sha256:r.request_sha256,handle_table_sha256:table.table_sha256,
  ...(terminalCall?{terminal_submission_call_id:terminalCall.id}:{})};
}
