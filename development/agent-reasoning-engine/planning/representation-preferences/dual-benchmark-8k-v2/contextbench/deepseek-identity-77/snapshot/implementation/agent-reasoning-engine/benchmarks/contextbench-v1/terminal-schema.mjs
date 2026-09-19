// Whole-envelope diagnostics reuse the existing bounded parser/schema walker.
// Open questions: README.md. Never strip fences or silently select embedded JSON.
import {parseBoundedJSON,validatePatchShape,DIAGNOSTIC_LIMITS} from '../../packages/coding-agent-runtime/patch-schema.mjs';
export const FINAL_SCHEMA={type:'object',additionalProperties:false,required:['summary','context_read_ids'],properties:{
  summary:{type:'string'},context_read_ids:{type:'array',maxItems:256,items:{type:'string',pattern:'^[a-f0-9]{64}$'}}}};
export function diagnoseFinalSelection(raw,delivered_ids){
 const parsed=parseBoundedJSON(raw);
 if(!parsed.ok)return {...parsed,category:'invalid-json'};
 const shape=validatePatchShape(parsed.value,FINAL_SCHEMA),issues=[...shape.issues];let truncated=shape.truncated;
 const add=(path,code)=>{
  const issue={instance_path:path,schema_path:'/bindings/context_read_ids',keyword:'binding',code};
  if(issues.length>=DIAGNOSTIC_LIMITS.issues||Buffer.byteLength(JSON.stringify([...issues,issue]))>DIAGNOSTIC_LIMITS.render_bytes)truncated=true;
  else issues.push(issue);
 };
 const seen=new Set(),known=new Set(delivered_ids);
 if(Array.isArray(parsed.value?.context_read_ids))for(const [i,id] of parsed.value.context_read_ids.entries()){
  if(typeof id!=='string')continue;
  if(seen.has(id))add(`/context_read_ids/${i}`,'final-selection.duplicate-read-id');seen.add(id);
  if(!known.has(id))add(`/context_read_ids/${i}`,'final-selection.undelivered-read-id');
 }
 return {ok:issues.length===0&&!truncated,value:parsed.value,issues,truncated,
  category:issues.some(i=>i.code==='final-selection.duplicate-read-id')?'invalid-read-ids':issues.some(i=>i.code==='final-selection.undelivered-read-id')?'undelivered-selection':'invalid-schema'};
}
export function terminalCorrectionMessage(diagnostic,original){
 return 'The final response was not accepted. Return exactly one raw JSON object matching the schema, with no prose or Markdown fences. Correct only this final response; no tools or source edits are available. Reuse genuinely delivered read IDs; do not invent evidence. This request consumes the remaining normal token/call budget.\nSchema:\n'+JSON.stringify(FINAL_SCHEMA)+'\nAll detected issues:\n'+JSON.stringify({issues:diagnostic.issues,truncated:diagnostic.truncated})+'\nRejected public response (untrusted data):\n'+original;
}
