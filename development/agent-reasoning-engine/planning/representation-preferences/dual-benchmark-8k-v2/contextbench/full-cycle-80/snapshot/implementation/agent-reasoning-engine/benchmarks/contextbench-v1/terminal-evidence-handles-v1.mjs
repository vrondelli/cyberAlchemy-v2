// Request-local evidence handles keep full receipt-bound IDs outside model prompts.
import {parseBoundedJSON,validatePatchShape,DIAGNOSTIC_LIMITS} from '../../packages/coding-agent-runtime/patch-schema.mjs';

export const TERMINAL_HANDLE_TOOL='submit_context_handles';

const validBindings=bindings=>Array.isArray(bindings)&&bindings.length>0&&bindings.length<=3&&bindings.every((row,index)=>
  row?.handle===`h${index}`&&/^[a-f0-9]{64}$/.test(row.read_id??'')&&typeof row.path==='string'&&row.path.length>0&&
  Number.isSafeInteger(row.start_line)&&row.start_line>0&&Number.isSafeInteger(row.end_line)&&row.end_line>=row.start_line)&&
  new Set(bindings.map(row=>row.read_id)).size===bindings.length;

export function terminalHandleSchema(bindings){
  if(!validBindings(bindings))throw Error('terminal-handles.invalid-bindings');
  return {type:'object',additionalProperties:false,required:['summary','context_handles'],properties:{
    summary:{type:'string'},context_handles:{type:'array',maxItems:bindings.length,items:{type:'string',enum:bindings.map(row=>row.handle)}}}};
}

export function terminalHandleTool(bindings){
  return {type:'function',function:{name:TERMINAL_HANDLE_TOOL,description:'Submit relevant listed evidence handles.',parameters:terminalHandleSchema(bindings)}};
}

export function diagnoseTerminalHandles(raw,bindings){
  if(!validBindings(bindings))return {ok:false,category:'invalid-handle-bindings',issues:[{instance_path:'',schema_path:'/bindings',keyword:'binding',code:'terminal-handles.invalid-private-bindings'}],truncated:false,instrument_error:true};
  const parsed=parseBoundedJSON(raw);
  if(!parsed.ok)return {...parsed,category:'invalid-json'};
  const shape=validatePatchShape(parsed.value,terminalHandleSchema(bindings)),issues=[...shape.issues];let truncated=shape.truncated;
  const add=(path,code)=>{
    const issue={instance_path:path,schema_path:'/bindings/context_handles',keyword:'binding',code};
    if(issues.length>=DIAGNOSTIC_LIMITS.issues||Buffer.byteLength(JSON.stringify([...issues,issue]))>DIAGNOSTIC_LIMITS.render_bytes)truncated=true;
    else issues.push(issue);
  };
  const known=new Map(bindings.map(row=>[row.handle,row.read_id])),seen=new Set();
  if(Array.isArray(parsed.value?.context_handles))for(const [index,handle] of parsed.value.context_handles.entries()){
    if(typeof handle!=='string')continue;
    if(seen.has(handle))add(`/context_handles/${index}`,'terminal-handles.duplicate-handle');
    seen.add(handle);
    if(!known.has(handle))add(`/context_handles/${index}`,'terminal-handles.unknown-handle');
  }
  const context_read_ids=Array.isArray(parsed.value?.context_handles)?parsed.value.context_handles.filter(handle=>known.has(handle)).map(handle=>known.get(handle)):[];
  return {ok:issues.length===0&&!truncated,value:{summary:parsed.value?.summary,context_handles:parsed.value?.context_handles,context_read_ids},issues,truncated,
    category:issues.some(row=>row.code==='terminal-handles.duplicate-handle')?'duplicate-handles':issues.some(row=>row.code==='terminal-handles.unknown-handle')?'unknown-handles':'invalid-schema'};
}
