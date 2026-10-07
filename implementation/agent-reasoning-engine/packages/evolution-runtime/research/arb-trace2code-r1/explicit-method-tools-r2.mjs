// Prospective interface candidate; not part of the frozen live r1 campaign.
// Open Questions: evidence/G01-NATIVE-METHOD-INTERFACE-DIAGNOSIS-R2.json.
import {createMethodEpisodeTools} from './native-method-episode-r1.mjs';
const text=description=>({type:'string',minLength:1,description});
const page={offset:{type:'integer',minimum:0,description:'Use next_offset from the preceding page; omit for the first page.'},
 limit:{type:'integer',minimum:1,maximum:50}};
const path=text('Exact production file path from list_files or a runtime method row, not a directory or absolute path.');
const methodId=text('Copy the exact opaque method_id from list_methods (or nonnull runtime source_method_id). Never invent a signature, name or path:line identifier.');
const definitions={
 runtime_status:{description:'Check runtime evidence availability for this case. Takes no arguments. Missing/zero runtime evidence never excludes source.',properties:{},required:[]},
 list_runtime_methods:{description:'Page retained command-phase runtime observations, including unresolved mappings. They are not test-exclusive or proof of fault. Use small pages and exact class filters.',
  properties:{...page,positive_only:{type:'boolean'},class_name:text('Exact fully qualified compiled class name.'),source_method_id:methodId},required:[]},
 list_files:{description:'Page all eligible production source files. Takes only pagination, never a path filter. No file omitted for missing runtime.',properties:{...page},required:[]},
 list_methods:{description:'Page method declarations in ONE exact production file. Read opaque method_id and source_span.start_line from the returned catalog before reading source.',
  properties:{path,name:text('Optional exact source method name, not a signature.'),arity:{type:'integer',minimum:0,maximum:1024},...page},required:['path']},
 list_references:{description:'Page unresolved syntactic reference nodes in one exact source file, optionally one exact catalog method_id. Not a resolved dependency graph.',
  properties:{path,method_id:methodId,...page},required:['path']},
 read_file:{description:'Read ONE COMPLETE source-bound method using the exact catalog method_id/path/source_span.start_line. No arbitrary file/window reads. Save returned read_id for final selection; capacity failures are explicit.',
  properties:{method_id:methodId,path,start_line:{type:'integer',minimum:1,description:'Copy source_span.start_line exactly from list_methods, not a stack-trace line.'}},required:['method_id','path','start_line']},
 recover_observed_read:{description:'Recover an exact previously delivered read using its observed-read handle. No new source is acquired.',
  properties:{retrieval_handle:text('Exact previously delivered retrieval_handle.')},required:['retrieval_handle']}
};
export function explicitMethodToolSchemas(){return Object.entries(definitions).map(([name,d])=>({type:'function',function:{name,
 description:d.description,parameters:{type:'object',additionalProperties:false,properties:d.properties,required:d.required}}}));}
export function createExplicitMethodTools(options){
 const bound=createMethodEpisodeTools(options),tools=explicitMethodToolSchemas();
 const execute_tool=async(name,args)=>{
  // Read and recovery remain governed by the original native adapter. The native
  // loop intercepts recovery; this wrapper never admits invented handles.
  if(['read_file','recover_observed_read'].includes(name))return bound.execute_tool(name,args);
  if(!Object.hasOwn(definitions,name))return bound.execute_tool(name,args);
  // Never discard unknown fields or replace IDs. Frozen downstream validators
  // still reject operation-specific invalid requests and enforce source bindings.
  if(!args||typeof args!=='object'||Array.isArray(args)||Object.hasOwn(args,'operation'))
   return bound.execute_tool('method_navigation',{operation:name,invalid_request:true});
  return bound.execute_tool('method_navigation',{...args,operation:name});
 };
 return{tools,execute_tool,snapshot:bound.snapshot};
}
export const FINAL_RAW_JSON_GUIDANCE='Finish with exactly one raw JSON object: {"summary":"brief localization rationale","context_read_ids":["exact delivered read_id"]}. No prose before/after, no Markdown fences, no patch. Method IDs are catalog coordinates; read IDs are delivered evidence handles. They are not interchangeable. Select only read IDs confirmed delivered to the model. If no defensible selection is available, return an empty array honestly.';
