import {patchToolSchema} from '../patch-schema.mjs';
import {parsePatchSetCandidate} from '../patch-set-runtime.mjs';
import {need} from './transport.mjs';
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
function scope(base,paths){
 need(sha(base?.tree_sha256)&&Array.isArray(paths)&&paths.length>0&&paths.length<=24&&new Set(paths).size===paths.length&&paths.every(p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.split(/[\\/]/).includes('..')&&sha(base.files?.[p])),'submission-scope-invalid');
}
// Proposal protocol only: this is never registered with the filesystem executor.
export function submissionTool(base,paths){
 scope(base,paths);
 return {type:'function',function:{name:'submit_patch_candidate',description:'Submit a proposal using the required schema. This does not apply changes. Preserve complete replacement source and trusted scope exactly.',parameters:patchToolSchema(base,paths)}};
}
export function parseSubmission(message,finishReason,{base,mutation_allowlist}){
 scope(base,mutation_allowlist);
 const fail=reason=>({ok:false,reason_codes:[reason],issues:[{instance_path:'',schema_path:'/native-envelope',keyword:'protocol',code:reason,expected:{}}],truncated:false});
 if(finishReason!=='tool_calls'||message?.role!=='assistant'||message.function_call||!Array.isArray(message.tool_calls)||message.tool_calls.length!==1)return fail('submission.single-native-call-required');
 const call=message.tool_calls[0];
 if(call?.type!=='function'||typeof call.id!=='string'||!call.id||call.function?.name!=='submit_patch_candidate'||typeof call.function.arguments!=='string')return fail('submission.call-invalid');
 let parsed;try{parsed=parsePatchSetCandidate(call.function.arguments);}catch{return fail('submission.arguments-invalid');}
 if(!parsed.ok)return parsed;
 if(parsed.value.expected_base_tree_sha256!==base.tree_sha256||parsed.value.changes.some(c=>!mutation_allowlist.includes(c.path)||c.expected_file_sha256!==base.files[c.path]))return fail('submission.scope-drift');
 return {...parsed,call_id:call.id,authority_effect:'none'};
}
