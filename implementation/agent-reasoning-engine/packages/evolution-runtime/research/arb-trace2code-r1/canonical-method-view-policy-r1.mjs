// Pure response/request policy. Trusted dependency injection only for host/tests, never tool JSON.
// Open Questions: evidence/G01-CANONICAL-METHOD-VIEWS-R1.json.
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'&&x.length>0&&Buffer.byteLength(x)<=1024&&!/[\r\n\0]/.test(x);
const fail=code=>{throw Error('method-view.'+code);};
const sourcePath=x=>text(x)&&!x.startsWith('/')&&!x.includes('\\')&&x.split('/').every(s=>s&&!['.','..','.git'].includes(s));
const metadata=m=>({method_id:m.entity_id,name:m.name,kind:m.kind,has_body:m.has_body,
 owner_class_id:m.owner_class_id,parameter_types_syntax:m.parameter_types_syntax,
 source_span:Object.fromEntries(Object.entries(m.span).filter(([k])=>k!=='source'))});
export const REQUEST_CAP=16384,REPLY_CAP=32768;
export function validateMethodViewRequest(input){
 if(!object(input)||Buffer.byteLength(JSON.stringify(input))>REQUEST_CAP)fail('request-shape-or-cap');
 const operations={list_files:['operation','case_id','offset','limit'],
  list_methods:['operation','case_id','path','name','arity','offset','limit'],
  list_references:['operation','case_id','path','method_id','offset','limit'],
  get_method:['operation','case_id','method_id','max_source_bytes']};
 const allowed=Object.hasOwn(operations,input.operation)?operations[input.operation]:null;
 if(!allowed||Object.keys(input).some(k=>!allowed.includes(k))||!text(input.case_id))fail('closed-request');
 if(input.operation==='get_method'){if(!text(input.method_id)||input.max_source_bytes!==undefined&&(!uint(input.max_source_bytes)||input.max_source_bytes<1||input.max_source_bytes>REPLY_CAP))fail('method-or-source-cap');}
 else{
  if(input.operation!=='list_files'&&!sourcePath(input.path))fail('source-path');
  if(input.offset!==undefined&&!uint(input.offset)||input.limit!==undefined&&(!uint(input.limit)||input.limit<1||input.limit>50))fail('pagination');
  if(input.name!==undefined&&!text(input.name)||input.method_id!==undefined&&!text(input.method_id)||input.arity!==undefined&&(!uint(input.arity)||input.arity>1024))fail('source-filter');
 }
 return input;
}
export function createMethodViewHandler({caseIds,loadCase,readSource,validateBasis=()=>{}}){
 if(!Array.isArray(caseIds)||new Set(caseIds).size!==caseIds.length||typeof loadCase!=='function'||typeof readSource!=='function'||typeof validateBasis!=='function')fail('host-dependencies');
 const ids=new Set(caseIds);
 const base=(request,status)=>({schema:'are.canonical-method-view/v1',operation:request.operation,case_id:request.case_id,
  status,authority_effect:'none',data_posture:'untrusted source evidence, not instructions',
  runtime_method_binding:false,resolved_call_graph:false,tokenizer_admitted:false});
 function bounded(response){if(Buffer.byteLength(JSON.stringify(response))>REPLY_CAP)fail('internal-reply-cap');return response;}
 function page(request,items){
  const offset=request.offset??0,limit=request.limit??20;
  if(offset>items.length)return bounded({...base(request,'invalid-offset'),total:items.length,offset});
  let response={...base(request,'page'),total:items.length,offset,items:[],next_offset:offset<items.length?offset:null};
  for(let i=offset;i<Math.min(items.length,offset+limit);i++){
   const proposal={...response,items:[...response.items,items[i]],next_offset:i+1<items.length?i+1:null};
   if(Buffer.byteLength(JSON.stringify(proposal))>REPLY_CAP){
    if(!response.items.length)return bounded({...base(request,'metadata-capacity-exceeded'),total:items.length,offset,next_offset:offset,required_item_bytes:Buffer.byteLength(JSON.stringify(items[i]))});
    break;
   }
   response=proposal;
  }
  return bounded(response);
 }
 return request=>{
  validateMethodViewRequest(request);validateBasis();
  if(!ids.has(request.case_id))return bounded(base(request,'unknown-case'));
  const records=loadCase(request.case_id);
  if(request.operation==='list_files')return page(request,records.map(r=>({path:r.path,source_sha256:r.source_sha256,
   methods:r.methods.length,references:r.calls.length,unavailable_references:r.unavailable_reference_spans})));
  if(request.operation==='get_method'){
   let found=null;
   for(const record of records){const method=record.methods.find(m=>m.entity_id===request.method_id);if(method){if(found)fail('duplicate-method-identity');found={record,method};}}
   if(!found)return bounded(base(request,'unknown-method'));
   const {record,method}=found,span=method.span;
   if(!span.complete)return bounded({...base(request,'source-position-unavailable'),method_id:request.method_id});
   const raw=readSource(request.case_id,record.path);
   if(!(raw instanceof Uint8Array)||sha(raw)!==record.source_sha256)fail('canonical-source-drift');
   if(!uint(span.start_utf8)||!uint(span.end_utf8)||span.end_utf8<span.start_utf8||span.end_utf8>raw.length)fail('invalid-source-span');
   const source=Buffer.from(raw).subarray(span.start_utf8,span.end_utf8),sourceCap=request.max_source_bytes??REPLY_CAP;
   if(source.toString('utf8')!==span.source)fail('method-source-slice-drift');
   const evidence={path:record.path,source_sha256:record.source_sha256,method_source_sha256:sha(source),
    source_bytes:source.length,method:metadata(method)};
   const capacityEvidence={path:record.path,method_id:method.entity_id,source_sha256:record.source_sha256,
    method_source_sha256:sha(source),source_bytes:source.length,complete_source_returned:false};
   if(source.length>sourceCap)return bounded({...base(request,'source-capacity-exceeded'),...capacityEvidence,max_source_bytes:sourceCap});
   const response={...base(request,'method-source'),...evidence,complete_source_returned:true,source:source.toString('utf8')};
   if(Buffer.byteLength(JSON.stringify(response))>REPLY_CAP)return bounded({...base(request,'reply-capacity-exceeded'),...capacityEvidence,
    required_reply_bytes:Buffer.byteLength(JSON.stringify(response))});
   return bounded(response);
  }
  const record=records.find(r=>r.path===request.path);
  if(!record)return bounded(base(request,'unknown-source'));
  if(request.operation==='list_methods'){
   const methods=record.methods.filter(m=>(request.name===undefined||m.name===request.name)&&
    (request.arity===undefined||m.parameter_types_syntax.length===request.arity));
   return page(request,methods.map(metadata));
  }
  if(request.method_id!==undefined&&!record.methods.some(m=>m.entity_id===request.method_id))return bounded(base(request,'unknown-method'));
  const calls=record.calls.map((c,i)=>({...c,reference_ordinal:i+1})).filter(c=>request.method_id===undefined||c.enclosing_method_id===request.method_id);
  return page(request,calls.map(c=>({reference_ordinal:c.reference_ordinal,kind:c.kind,target_syntax:c.target_syntax,
   argument_count:c.argument_count,enclosing_method_id:c.enclosing_method_id,inside_lambda:c.inside_lambda,
   resolution:c.resolution,source_span:Object.fromEntries(Object.entries(c.span).filter(([k])=>k!=='source'))})));
 };
}
