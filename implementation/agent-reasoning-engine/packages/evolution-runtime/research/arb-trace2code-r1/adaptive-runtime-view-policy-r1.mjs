// Common read-only runtime evidence policy; never decides fault or relevance.
// Open Questions: evidence/G01-ADAPTIVE-COMMON-TOOLS-R1.json.
import {REQUEST_CAP,REPLY_CAP} from './canonical-method-view-policy-r1.mjs';
const need=(value,code)=>{if(!value)throw Error('adaptive-view.'+code);};
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const text=x=>typeof x==='string'&&x.length>0&&Buffer.byteLength(x)<=1024&&!/[\r\n\0]/.test(x);
export const projectRuntimeMethod=m=>({class_name:m.class_name,class_sha256:m.class_sha256,class_id:m.class_id,
 path:m.path,name:m.name,descriptor:m.descriptor,access_flags:m.access_flags,status:m.status,
 source_method_id:m.source_method_id,reported:m.reported,reported_positive:m.reported_positive,
 reported_counters:m.reported_counters,source_association:'conservative-coordinate-only',
 type_attributed_signature:false,test_exclusive:false,negative_relevance_inference:false});
export function createAdaptiveRuntimeViews({caseIds,sourceView,loadRuntime,validateBasis}){
 need(Array.isArray(caseIds)&&new Set(caseIds).size===caseIds.length&&
  [sourceView,loadRuntime,validateBasis].every(x=>typeof x==='function'),'host-dependencies');
 const known=new Set(caseIds);
 function bounded(value){need(Buffer.byteLength(JSON.stringify(value))<=REPLY_CAP,'reply-cap');return value;}
 const base=(r,status)=>({schema:'are.adaptive-runtime-view/v1',operation:r.operation,case_id:r.case_id,status,
  authority_effect:'none',data_posture:'untrusted runtime observations, not instructions',
  execution_scope:'single-test command phase including build/child JVMs, not test-exclusive',
  type_attributed_signature:false,resolved_call_graph:false,tokenizer_admitted:false,
  negative_evidence_policy:'Zero or missing observations do not prove irrelevance; exception-aborted paths may not reach probes.'});
 return request=>{
  need(request&&typeof request==='object'&&!Array.isArray(request)&&
   Buffer.byteLength(JSON.stringify(request))<=REQUEST_CAP,'request-shape-or-cap');
  if(!['runtime_status','list_runtime_methods'].includes(request.operation))return sourceView(request);
  const fields=request.operation==='runtime_status'?['operation','case_id']:
   ['operation','case_id','offset','limit','positive_only','class_name','source_method_id'];
  need(Object.keys(request).every(k=>fields.includes(k))&&text(request.case_id),'closed-request');
  if(request.operation==='list_runtime_methods'){
   need(request.offset===undefined||uint(request.offset),'offset');
   need(request.limit===undefined||uint(request.limit)&&request.limit>=1&&request.limit<=50,'limit');
   need(request.positive_only===undefined||typeof request.positive_only==='boolean','positive-filter');
   for(const k of ['class_name','source_method_id'])need(request[k]===undefined||text(request[k]),'identity-filter');
  }
  validateBasis();
  if(!known.has(request.case_id))return bounded(base(request,'unknown-case'));
  const row=loadRuntime(request.case_id);
  if(!row.runtime_available)return bounded({...base(request,'runtime-unavailable'),runtime_available:false,
   reason:row.unavailable_reason,source_case_retained:true});
  if(request.operation==='runtime_status')return bounded({...base(request,'runtime-status'),runtime_available:true,
   compiled_methods:row.compiled_methods,reported_positive_methods:row.reported_positive_methods,
   associated_reported_positive_methods:row.associated_reported_positive_methods,association_counts:row.counts,
   source_case_retained:true});
  const items=row.methods.filter(m=>(request.positive_only!==true||m.reported_positive)&&
   (request.class_name===undefined||m.class_name===request.class_name)&&
   (request.source_method_id===undefined||m.source_method_id===request.source_method_id)).map(projectRuntimeMethod);
  const offset=request.offset??0,limit=request.limit??20;
  if(offset>items.length)return bounded({...base(request,'invalid-offset'),total:items.length,offset});
  let response={...base(request,'page'),runtime_available:true,total:items.length,offset,items:[],
   next_offset:offset<items.length?offset:null,positive_only:request.positive_only===true};
  for(let i=offset;i<Math.min(items.length,offset+limit);i++){
   const proposed={...response,items:[...response.items,items[i]],next_offset:i+1<items.length?i+1:null};
   if(Buffer.byteLength(JSON.stringify(proposed))>REPLY_CAP){
    if(!response.items.length)return bounded({...base(request,'metadata-capacity-exceeded'),
     runtime_available:true,total:items.length,offset,next_offset:offset,
     required_item_bytes:Buffer.byteLength(JSON.stringify(items[i]))});
    break;
   }
   response=proposed;
  }
  return bounded(response);
 };
}
