// Common acquisition-first selection-only terminal, no response normalization.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R5.json.
import {createHash} from 'node:crypto';
import {stable,bindDelivery,bodyForReceipt} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {parseBoundedJSON,validatePatchShape} from '../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {requireCertainReceiptHistory,buildMethodHandleTable,methodHandleSchema as validateTableSchema} from './compact-method-terminal-r4b.mjs';
export {buildMethodHandleTable};
export const METHOD_HANDLE_TOOL='submit_source_handles';
const version='are.compact-method-terminal/v1',sha=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const need=(v,c)=>{if(!v)throw Error('method-handles.'+c);},uint=x=>Number.isSafeInteger(x)&&x>=0;
const checkTable=table=>{validateTableSchema(table);};
export function terminalEligible(table,finalizing=false){checkTable(table);need(typeof finalizing==='boolean','phase');return finalizing||table.bindings.length>0;}
export function methodHandleSchema(table){
 checkTable(table);
 return {type:'object',additionalProperties:false,required:['context_handles'],properties:{
  context_handles:{type:'array',maxItems:table.bindings.length,items:{type:'string',
   ...(table.bindings.length?{enum:table.bindings.map(r=>r.handle)}:{pattern:'^h[0-9]$'})}}}};
}
export function methodHandleTool(table){
 return {type:'function',function:{name:METHOD_HANDLE_TOOL,
  description:'Select relevant listed handles, most likely file first. Arguments contain only context_handles. No summary, prose or repository action.',
  parameters:methodHandleSchema(table)}};
}
export function methodHandleMessage(table,{finalizing=false}={}){
 checkTable(table);need(typeof finalizing==='boolean','phase');return {role:'user',content:stable({method_terminal_handles:{schema_version:version,terminal_schema_version:'are.method-selection-terminal/v1',table_sha256:table.table_sha256,
  evidence:table.bindings.map(({read_id,...publicRow})=>publicRow),phase:finalizing?'finalizing':'exploration',terminal_eligible:terminalEligible(table,finalizing)},
  contract:'First acquire complete source using repository tools. Missing runtime does not make source unavailable: list_files, list_methods, then read_file using exact coordinates. When terminal_eligible is true, call submit_source_handles once with only context_handles or return exactly {"context_handles":["h0"]} using your chosen listed handles, most likely file first, up to8 distinct files. No function-name prefix, summary, prose, or fences. When false, continue acquisition; do not finalize. Forced finalization may honestly select []; empty is never a valid localization prediction. Only successful request delivery grants source credit.'})};
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
export function selectMethodHandleSubmission({captures,receipts,response_capture,table,finalizing=false}){
 requireCertainReceiptHistory(receipts);checkTable(table);need(terminalEligible(table,finalizing),'terminal-not-eligible');const c=response_capture;need(c&&typeof c==='object','capture-required');
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
 need(tables.length===1&&stable(tables[0])===stable(methodHandleMessage(table,{finalizing})),'exact-request-table-required');
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
 return {final_read_ids,model_context_handles:diagnostic.value.context_handles,
  response_capture_sha256:c.capture_sha256,request_sha256:r.request_sha256,handle_table_sha256:table.table_sha256,
  ...(terminalCall?{terminal_submission_call_id:terminalCall.id}:{})};
}
