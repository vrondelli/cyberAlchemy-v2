import {projectPagedFiles} from './paging.mjs';
import {hash,stable,need} from './transport.mjs';

export function validateSourcePolicy(value='none') {
 need(['none','inspected-mutation-v1'].includes(value),'source-policy-invalid');return value;
}
const MAX_BYTES=4096;
const envelope=(sources,omitted_source_count)=>({schema_version:'are.glm-inspected-mutation-sources/v1',posture:'untrusted-source-data',
 sources,omitted_source_count,maximum_serialized_bytes:MAX_BYTES,authority_effect:'none'});

// Source bytes are untrusted data projected from the verified native journal.
// This function neither reads a file nor invents an implementation or snippet.
function inspectedSources({history,base,mutation_allowlist,observation_allowlist,paged=false,history_limit=12}) {
 need(Array.isArray(history)&&[12,16].includes(history_limit)&&history.length<=history_limit,'source-history-invalid');
 need(base?.files&&typeof base.files==='object'&&!Array.isArray(base.files)
  &&Array.isArray(mutation_allowlist)&&Array.isArray(observation_allowlist)
  &&[mutation_allowlist,observation_allowlist].every(paths=>paths.length<=24&&paths.every(path=>typeof path==='string'&&path.length>0)
   &&new Set(paths).size===paths.length),'source-scope-invalid');
 const selected=new Set(mutation_allowlist.filter(path=>observation_allowlist.includes(path))),seen=new Set(),sources=new Map();
 for(const entry of history) {
  need(entry&&typeof entry==='object'&&!Array.isArray(entry),'source-history-invalid');
  if(entry.calls===undefined)continue;
  need(Array.isArray(entry.calls),'source-history-invalid');
  for(const [index,call] of entry.calls.entries()) {
   need(call&&typeof call.id==='string'&&call.id.length>0&&call.id.length<=256&&!call.id.includes('\0')&&!seen.has(call.id),'source-call-id-invalid');
   seen.add(call.id);need(seen.size<=24,'source-call-limit');
   const path=call.arguments?.path;
   if(call.name!=='read-file'||!selected.has(path))continue;
   const observation=entry.observations?.[index];
   need(observation&&typeof observation.ok==='boolean','source-observation-invalid');
   if(observation.ok===false||observation.output?.paged===true)continue;
   const output=observation.output,sourceHash=base.files[path];
   need(observation.deferred!==true&&/^[a-f0-9]{64}$/.test(sourceHash??'')&&output?.path===path&&output.sha256===sourceHash
    &&typeof output.utf8==='string'&&hash(output.utf8)===sourceHash,'source-bytes-invalid');
   const native=entry.messages?.[0]?.tool_calls?.[index],result=entry.messages?.[index+1];
   let args;
   try {args=typeof native?.function?.arguments==='string'?JSON.parse(native.function.arguments):native?.function?.arguments;}
   catch {need(false,'source-protocol-invalid');}
   need(entry.messages?.[0]?.role==='assistant'&&native?.type==='function'&&native.id===call.id&&native.function?.name==='read-file'
    &&stable(args)===stable(call.arguments)&&result?.role==='tool'&&result.tool_call_id===call.id&&result.content===stable(observation),
   'source-protocol-invalid');
   // Validate every alias before deduplicating; a later mismatched read cannot
   // hide behind the first successful observation of the same source path.
   if(!sources.has(path))sources.set(path,{path,sha256:sourceHash,source_call_id:call.id,utf8:output.utf8});
  }
 }
 if(paged)for(const f of projectPagedFiles(history,base.files,new Set(),5500)){
  if(!selected.has(f.path)||!f.read_complete||sources.has(f.path))continue;
  const pages=history.flatMap(e=>(e.calls??[]).map((c,i)=>({call:c,output:e.observations?.[i]?.ok?e.observations[i].output:null}))).filter(p=>p.call.name==='read-file'&&p.output?.paged&&p.output.path===f.path).sort((a,b)=>a.output.offset-b.output.offset);
  let text='';for(const p of pages)text+=p.output.utf8.slice(Math.max(0,text.length-p.output.offset));
  need(hash(text)===f.sha256,'source-bytes-invalid');
  sources.set(f.path,{path:f.path,sha256:f.sha256,source_call_id:pages[0].call.id,source_call_ids:pages.map(p=>p.call.id),utf8:text});
 }
 return [...sources.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}

export function projectInspectedMutationSources(input) {
 const candidates=inspectedSources(input),included=[];
 for(const source of candidates) {
  const prospective=[...included,source];
  // Treat every remaining source as omitted while checking this candidate.
  // Later inclusions can only reduce the count's serialized width.
  const candidate=envelope(prospective,candidates.length-prospective.length);
  if(Buffer.byteLength(JSON.stringify(candidate),'utf8')<=MAX_BYTES)included.push(source);
 }
 const result=envelope(included,candidates.length-included.length);
 need(Buffer.byteLength(JSON.stringify(result),'utf8')<=MAX_BYTES,'source-projection-too-large');
 return result;
}


// Exact decoded JSON field values, not generated summaries or promoted authority.
export function projectInspectedRequirements({history,base,observation_allowlist,paged=false,history_limit=12}) {
 const sources=inspectedSources({history,base,observation_allowlist,mutation_allowlist:observation_allowlist,paged,history_limit});
 const unique=new Set(),candidates=[];
 for(const source of sources) {
  let value;try{value=JSON.parse(source.utf8)?.requirements;}catch{continue;}
  if(!Array.isArray(value)||!value.length||!value.every(item=>typeof item==='string'))continue;
  const key=stable(value);if(unique.has(key))continue;unique.add(key);
  candidates.push({path:source.path,sha256:source.sha256,source_call_id:source.source_call_id,...(source.source_call_ids?{source_call_ids:source.source_call_ids}:{}),selector:'/requirements',value});
 }
 const fields=[];
 const wrap=()=>({posture:'untrusted-json-fields',fields,omitted_field_count:candidates.length-fields.length,maximum_serialized_bytes:2048,authority_effect:'none'});
 for(const field of candidates){fields.push(field);if(Buffer.byteLength(stable(wrap()))>2048)fields.pop();}
 const result=wrap();need(Buffer.byteLength(stable(result))<=2048,'source-projection-too-large');return result;
}

// Preserve exact explanatory fields from already verified source examples.
// No fixture names, oracle reads, generated summaries, or interpreted outcomes.
export function projectInspectedExamples({history,base,observation_allowlist,paged=false,history_limit=12,include_explanations=false}) {
 const sources=inspectedSources({history,base,observation_allowlist,mutation_allowlist:observation_allowlist,paged,history_limit});
 const seen=new Set(),candidates=[];
 need(typeof include_explanations==='boolean','example-selection-invalid');
 for(const source of sources){
  let examples;try{examples=JSON.parse(source.utf8)?.examples;}catch{continue;}
  if(!Array.isArray(examples))continue;
  const values=[];
  for(const [index,example] of examples.entries())for(const key of (include_explanations?['interpretation','explanation']:['interpretation']))if(typeof example?.[key]==='string'&&example[key].length&&!seen.has(example[key])){
   seen.add(example[key]);values.push({selector:'/examples/'+index+'/'+key,value:example[key]});
  }
  if(values.length)candidates.push({path:source.path,sha256:source.sha256,source_call_ids:source.source_call_ids??[source.source_call_id],values});
 }
 const fields=[],maximum_serialized_bytes=1536,total=seen.size;
 const wrap=()=>({posture:'untrusted-json-fields',fields,omitted_field_count:total-fields.reduce((n,f)=>n+f.values.length,0),maximum_serialized_bytes,authority_effect:'none'});
 for(const candidate of candidates){const {values,...ref}=candidate,field={...ref,values:[]};fields.push(field);
  for(const value of values){field.values.push(value);if(Buffer.byteLength(stable(wrap()))>maximum_serialized_bytes)field.values.pop();}
  if(!field.values.length)fields.pop();
 }
 need(Buffer.byteLength(stable(wrap()))<=maximum_serialized_bytes,'source-projection-too-large');return wrap();
}
