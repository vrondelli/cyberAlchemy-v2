// Candidate identity normalization before tool execution. Open questions: ../../../../../../../../PLAN.md.
import {createHash} from 'node:crypto';
const stable=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(ok,code)=>{if(!ok)throw Error('tool-call-identity.'+code);};
export function scopeToolCallIdentities(message,{request_sha256,sequence}){
 need(/^[a-f0-9]{64}$/.test(request_sha256)&&Number.isSafeInteger(sequence)&&sequence>0,'scope');
 need(message?.role==='assistant'&&Array.isArray(message.tool_calls)&&message.tool_calls.length>0&&message.tool_calls.length<=8,'message');
 const ids=message.tool_calls.map(c=>c?.id);
 need(ids.every(id=>typeof id==='string'&&id.length>0)&&new Set(ids).size===ids.length,'duplicate-or-invalid-provider-id');
 const publicMessage={role:message.role,content:message.content??null,tool_calls:message.tool_calls};
 const provider_public_sha256=hash(publicMessage);
 const mapping=ids.map((provider_id,index)=>({index,provider_id,runtime_id:'call_are_'+hash({version:1,request_sha256,sequence,provider_public_sha256,index,provider_id}).slice(0,48)}));
 const normalized=structuredClone(message);
 for(const m of mapping)normalized.tool_calls[m.index].id=m.runtime_id;
 const normalized_public_sha256=hash({...publicMessage,tool_calls:normalized.tool_calls});
 return {message:normalized,evidence:{schema_version:'are.tool-call-identity/v1',request_sha256,sequence,provider_public_sha256,normalized_public_sha256,mapping,authority_effect:'none'}};
}
