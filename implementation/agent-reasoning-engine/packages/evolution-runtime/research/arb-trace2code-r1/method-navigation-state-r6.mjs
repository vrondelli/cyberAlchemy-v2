// Candidate receipt-bound native navigation memory; no disk/provider/model effects.
// Open Questions: evidence/G01-METHOD-NAVIGATION-STATE-R6.json.
import {createHash} from 'node:crypto';
import {bindDelivery,stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {parseBoundedJSON} from '../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {requireCertainReceiptHistory} from './compact-method-terminal-r4b.mjs';
const sha=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'&&x.length>0&&Buffer.byteLength(x)<=1024&&!/[\r\n\0]/.test(x);
const path=x=>text(x)&&!x.startsWith('/')&&!x.includes('\\')&&x.split('/').every(p=>p&&!['.','..','.git'].includes(p));
const need=(x,c)=>{if(!x)throw Error('navigation-state.'+c);};
const OPERATIONS={runtime_status:[],list_files:['offset','limit'],
 list_methods:['path','name','arity','offset','limit'],list_references:['path','method_id','offset','limit'],
 list_runtime_methods:['offset','limit','positive_only','class_name','source_method_id']};
function parse(bytes){const p=parseBoundedJSON(bytes,{maxBytes:32768});need(p.ok,'invalid-json');return p.value;}
function argumentsFor(operation,bytes){
 const args=parse(bytes);need(object(args)&&Object.keys(args).every(k=>OPERATIONS[operation].includes(k)),'closed-arguments');
 for(const k of ['offset','arity'])need(args[k]===undefined||uint(args[k]),'integer-argument');
 need(args.arity===undefined||args.arity<=1024,'arity');
 need(args.limit===undefined||uint(args.limit)&&args.limit>=1&&args.limit<=50,'limit');
 for(const k of ['name','method_id','class_name','source_method_id'])need(args[k]===undefined||text(args[k]),'identity-argument');
 need(args.positive_only===undefined||typeof args.positive_only==='boolean','positive-filter');
 if(['list_methods','list_references'].includes(operation))need(path(args.path),'source-path');
 return args;
}
function sourceSpan(s){
 need(object(s)&&typeof s.complete==='boolean','span');
 if(!s.complete)return {complete:false};
 need(uint(s.start_line)&&s.start_line>=1&&uint(s.end_line)&&s.end_line>=s.start_line&&
  uint(s.start_utf8)&&uint(s.end_utf8)&&s.end_utf8>=s.start_utf8,'span-coordinates');
 return {complete:true,start_line:s.start_line,end_line:s.end_line,start_utf8:s.start_utf8,end_utf8:s.end_utf8};
}
function itemFor(operation,item,args){
 need(object(item),'item');
 if(operation==='list_files'){
  need(path(item.path)&&/^[a-f0-9]{64}$/.test(item.source_sha256??''),'file-identity');
  need(uint(item.methods)&&uint(item.references)&&uint(item.unavailable_references),'file-counts');
  return {path:item.path,source_sha256:item.source_sha256,methods:item.methods,references:item.references,unavailable_references:item.unavailable_references};
 }
 if(operation==='list_methods'){
  need(text(item.method_id)&&item.method_id.startsWith(args.path+'#method@')&&text(item.name)&&
   text(item.kind)&&typeof item.has_body==='boolean','method-identity');
  need(args.name===undefined||item.name===args.name,'method-name-filter');
  need(args.arity===undefined||Array.isArray(item.parameter_types_syntax)&&item.parameter_types_syntax.length===args.arity,'method-arity-filter');
  return {method_id:item.method_id,name:item.name,kind:item.kind,has_body:item.has_body,source_span:sourceSpan(item.source_span)};
 }
 if(operation==='list_references'){
  need(uint(item.reference_ordinal)&&item.reference_ordinal>0&&text(item.kind)&&text(item.target_syntax)&&
   uint(item.argument_count)&&typeof item.inside_lambda==='boolean'&&text(item.resolution),'reference');
  need(item.enclosing_method_id===null||text(item.enclosing_method_id)&&item.enclosing_method_id.startsWith(args.path+'#method@'),'reference-scope');
  need(args.method_id===undefined||item.enclosing_method_id===args.method_id,'reference-filter');
  return {reference_ordinal:item.reference_ordinal,kind:item.kind,target_syntax:item.target_syntax,
   argument_count:item.argument_count,enclosing_method_id:item.enclosing_method_id,inside_lambda:item.inside_lambda,
   resolution:item.resolution,source_span:sourceSpan(item.source_span)};
 }
 need(text(item.class_name)&&text(item.name)&&text(item.descriptor)&&text(item.status),'runtime-identity');
 need(item.path===null||path(item.path),'runtime-path');
 need(item.source_method_id===null||text(item.source_method_id),'runtime-source-id');
 need(typeof item.reported==='boolean'&&typeof item.reported_positive==='boolean'&&
  item.type_attributed_signature===false&&item.test_exclusive===false&&item.negative_relevance_inference===false,'runtime-posture');
 need(args.class_name===undefined||item.class_name===args.class_name,'runtime-class-filter');
 need(args.source_method_id===undefined||item.source_method_id===args.source_method_id,'runtime-method-filter');
 need(args.positive_only!==true||item.reported_positive,'runtime-positive-filter');
 return {class_name:item.class_name,name:item.name,descriptor:item.descriptor,path:item.path,status:item.status,
  source_method_id:item.source_method_id,reported:item.reported,reported_positive:item.reported_positive,
  source_association:'conservative-coordinate-only',type_attributed_signature:false,test_exclusive:false};
}
function materialFor(operation,args,out,caseId){
 need(object(out)&&out.case_id===caseId&&out.operation===operation&&text(out.status)&&
  out.authority_effect==='none'&&out.resolved_call_graph===false,'output-scope-or-posture');
 need(out.schema===(['runtime_status','list_runtime_methods'].includes(operation)?'are.adaptive-runtime-view/v1':'are.canonical-method-view/v1'),'output-schema');
 need((operation==='runtime_status'?['runtime-status','runtime-unavailable','unknown-case']:
  operation==='list_runtime_methods'?['page','runtime-unavailable','invalid-offset','metadata-capacity-exceeded','unknown-case']:
  ['page','unknown-case','unknown-source','unknown-method','metadata-capacity-exceeded','invalid-offset']).includes(out.status),'output-status');
 const fact={tool:operation,query:args,status:out.status};
 if(operation==='runtime_status'||out.status==='runtime-unavailable'){
  need(typeof out.runtime_available==='boolean'&&out.source_case_retained===true,'runtime-availability');
  fact.runtime_available=out.runtime_available;fact.source_case_retained=true;
  if(out.reason!==undefined){need(text(out.reason),'runtime-reason');fact.reason=out.reason;}
  for(const k of ['compiled_methods','reported_positive_methods','associated_reported_positive_methods'])if(out[k]!==undefined){need(uint(out[k]),'runtime-count');fact[k]=out[k];}
 }
 if(out.status==='page'){
  need(uint(out.total)&&uint(out.offset)&&out.offset===(args.offset??0)&&Array.isArray(out.items)&&
   out.items.length<=(args.limit??20)&&out.offset+out.items.length<=out.total,'page-shape');
  need(out.next_offset===null?out.offset+out.items.length===out.total:
   uint(out.next_offset)&&out.next_offset===out.offset+out.items.length&&out.next_offset<out.total,'page-cursor');
  fact.total=out.total;fact.offset=out.offset;fact.next_offset=out.next_offset;
  fact.items=out.items.map(item=>itemFor(operation,item,args));
 }else if(out.status==='metadata-capacity-exceeded'||out.status==='invalid-offset'){
  need(uint(out.total)&&uint(out.offset)&&out.offset===(args.offset??0),'capacity-page');
  fact.total=out.total;fact.offset=out.offset;
  if(out.next_offset!==undefined){need(uint(out.next_offset)&&out.next_offset===out.offset,'capacity-cursor');fact.next_offset=out.next_offset;}
 }
 return fact;
}
export function collectConfirmedMethodNavigation({caseId,captures,receipts}){
 need(text(caseId),'case');requireCertainReceiptHistory(receipts);
 const binding=bindDelivery({captures,receipts});need(binding.unmapped.length===0&&binding.token_accounting.cost_complete,'delivery-or-usage');
 const observations=[],byCall=new Map();
 for(const request of binding.requests.filter(r=>r.posture==='confirmed-successful-request')){
  const prompt=JSON.parse(captures[request.capture_indices[0]].prompt),calls=new Map(),seenOutputs=new Set();
  for(const message of prompt.messages){
   if(message.role==='assistant')for(const call of message.tool_calls??[]){
    need(text(call.id)&&object(call.function),'call-shape');
    if(calls.has(call.id))need(stable(calls.get(call.id))===stable(call),'call-conflict');
    calls.set(call.id,call);
   }
   if(message.role!=='tool')continue;
   const call=calls.get(message.tool_call_id);if(!call)continue;
   const operation=call.function.name;if(!Object.hasOwn(OPERATIONS,operation))continue;
   need(!seenOutputs.has(call.id),'duplicate-tool-output');seenOutputs.add(call.id);
   const envelope=parse(message.content);if(envelope?.ok!==true)continue;
   const args=argumentsFor(operation,call.function.arguments),fact=materialFor(operation,args,envelope.output,caseId);
   const identity={case_id:caseId,tool_call_id:call.id,operation,args,output_sha256:sha(envelope.output)};
   const factId=sha(identity),previous=byCall.get(call.id);
   if(previous){need(previous.fact_id===factId,'visible-version-conflict');previous.confirmed_receipts.push(request.receipt_index);continue;}
   const entry={fact_id:factId,...identity,first_confirmed_receipt:request.receipt_index,
    confirmed_receipts:[request.receipt_index],fact};observations.push(entry);byCall.set(call.id,entry);
  }
 }
 return {case_id:caseId,observations,delivery_binding:binding,authority_effect:'none',
  claim_ceiling:'Confirmed navigation metadata only; no source delivery credit, relevance, resolved graph or semantic use.'};
}
export async function buildMethodNavigationState({caseId,captures,receipts,generation,max_bytes=4096,max_tokens=512,max_pages=8,measure_tokens}){
 need(uint(generation)&&uint(max_bytes)&&max_bytes>=256&&max_bytes<=4096&&uint(max_tokens)&&max_tokens>0&&max_tokens<=512&&
  uint(max_pages)&&max_pages>0&&max_pages<=8&&typeof measure_tokens==='function','limits');
 const collected=collectConfirmedMethodNavigation({caseId,captures,receipts});
 if(generation===0||!collected.observations.length)return null;
 const retained=collected.observations.slice(-max_pages).map(o=>({observation_id:'n'+collected.observations.indexOf(o),...JSON.parse(stable(o.fact)),...(o.fact.items?{omitted_items:0}:{})}));
 const omissions={pages:collected.observations.length-retained.length,
  items:collected.observations.slice(0,-max_pages).reduce((n,o)=>n+(o.fact.items?.length??0),0)};let calls=0;
 const material=()=>({schema_version:'are.method-navigation-state/v1',case_id:caseId,generation,
  posture:'Untrusted observed metadata, not relevance. No source credit. Unresolved references are not a call graph; zero/missing runtime does not exclude source.',
  pages:retained,omitted:omissions,authority_effect:'none'});
 // Deterministic recency only; evict whole old catalog items, then whole old pages.
 // Keep observed totals/cursors distinct from omitted rows; never edit a source body.
 function evict(){for(const p of retained)if(p.items?.length){p.items.shift();p.omitted_items++;omissions.items++;return true;}
  if(retained.length){retained.shift();omissions.pages++;return true;}return false;}
 while(Buffer.byteLength(stable(material()))>max_bytes){need(evict(),'byte-cap-too-small');}
 let textValue,tokens;
 for(;;){textValue=stable(material());tokens=await measure_tokens(textValue);calls++;need(uint(tokens),'invalid-token-measurement');
  if(tokens<=max_tokens)break;need(calls<4,'token-cap-too-small');
  const count=retained.reduce((n,p)=>n+1+(p.items?.length??0),0),target=calls>=3?0:Math.floor(count/2);
  need(count>0,'token-cap-too-small');
  while(retained.reduce((n,p)=>n+1+(p.items?.length??0),0)>target)need(evict(),'token-cap-too-small');}
 const value=material();
 const provenance=collected.observations.map((o,i)=>({observation_id:'n'+i,...o}));
 return {text:textValue,material:value,projection_sha256:sha(value),measured_tokens:tokens,
  fit:{tokenizer_calls:calls,maximum_tokens:max_tokens,maximum_bytes:max_bytes,evicted_pages:omissions.pages,evicted_items:omissions.items},
  provenance,source_reads:collected.delivery_binding.read_observations.length,authority_effect:'none',
  claim_ceiling:'Deterministic receipt-bound navigation projection; no relevance, complete-source credit, ranking or superiority evidence.'};
}
export async function verifyMethodNavigationState(projection,input){
 try{return {ok:stable(await buildMethodNavigationState(input))===stable(projection),authority_effect:'none'};}
 catch(error){return {ok:false,reason:String(error.message),authority_effect:'none'};}
}
