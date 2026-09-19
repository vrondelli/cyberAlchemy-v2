// Encoding occurs before measurement and capture. Open questions: COMPACT-RUNTIME.md.
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {encodeToolPayload,decodeToolPayload,PAYLOAD_GUIDE,PAYLOAD_ENCODING} from './tool-payload-codec.mjs';
const need=(v,m)=>{if(!v)throw Error('compact-prompt.'+m);};
export function renderCompactPrompt({messages,tools}){
 need(Array.isArray(messages)&&Array.isArray(tools),'inputs');
 // Serialize once to retain precisely the JSON values the transport would receive.
 const wire=JSON.parse(stable({messages,tools})),calls=new Map();let encoded=false;
 for(const message of wire.messages){
  if(message.role==='assistant')for(const call of message.tool_calls??[]){
   need(typeof call.id==='string'&&!calls.has(call.id),'tool-identity');calls.set(call.id,call);
  }
  if(message.role!=='tool')continue;
  const call=calls.get(message.tool_call_id);
  // Other tool payloads, including edits and recovery results, remain byte-identical.
  if(call?.function?.name!=='search')continue;
  need(typeof message.content==='string','search-content');
  let payload;try{payload=JSON.parse(message.content);}catch{throw Error('compact-prompt.search-json');}
  const original=payload?.output?.observation_encoding===PAYLOAD_ENCODING?decodeToolPayload({tool:'search',payload}):payload;
  const result=encodeToolPayload({tool:'search',result:original});
  if(result.encoded){message.content=stable(result.payload);encoded=true;}
 }
 if(encoded){
  const system=wire.messages.find(m=>m.role==='system');
  need(system&&typeof system.content==='string','system-guide');
  const suffix='\n'+PAYLOAD_GUIDE;if(!system.content.endsWith(suffix))system.content+=suffix;
 }
 const prompt=stable(wire);need(Buffer.byteLength(prompt)<=262144,'request-byte-bound');return prompt;
}
