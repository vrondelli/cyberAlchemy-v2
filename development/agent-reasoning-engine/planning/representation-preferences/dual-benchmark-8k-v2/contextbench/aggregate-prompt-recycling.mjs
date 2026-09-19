// Additive native runner adapter. Open questions: AGGREGATE-NATIVE-INTEGRATION.md.
import {createHash} from 'node:crypto';
import {admitToolBatch} from './aggregate-tool-admission-v3.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('aggregate-native.'+m);};
export function createPromptAdmission({client,persist,signal,limit=8000,allow_recycler_fallback=false}){
 need(typeof client?.measureEnvelope==='function'&&typeof persist==='function','dependencies');
 need(Number.isSafeInteger(limit)&&limit>0&&limit<=8000,'limit');
 need(typeof allow_recycler_fallback==='boolean','fallback-policy');
 const projections=new Map();
 async function admitMessages(messages,tools){
  need(!signal?.aborted,'aborted');
  const history=structuredClone(messages),calls=new Map(),keys=new Map();
  for(const m of history){
   if(m.role==='assistant')for(const call of m.tool_calls??[]){need(!calls.has(call.id),'duplicate-call');calls.set(call.id,call);}
   if(m.role==='tool'){
    const call=calls.get(m.tool_call_id);need(call,'unbound-result');
    const key=hash({call,content:m.content});keys.set(m.tool_call_id,key);
    if(projections.has(key))m.content=projections.get(key);
   }
  }
  let end=history.length;
  while(end>0&&['user','system'].includes(history[end-1].role))end--;
  let start=end-1;
  while(start>=0&&history[start].role==='tool')start--;
  const assistant=history[start],tail=history.slice(start+1,end),suffix=history.slice(end);
  if(!tail.length||!assistant?.tool_calls?.length)return renderCompactPrompt({messages:history,tools});
  need(tail.length===assistant.tool_calls.length&&tail.every((m,i)=>m.tool_call_id===assistant.tool_calls[i].id),'batch-order');
  const cached=tail.map(m=>projections.has(keys.get(m.tool_call_id)));
  if(cached.every(Boolean))return renderCompactPrompt({messages:history,tools});
  need(cached.every(x=>!x),'mixed-cached-batch');
  const result=await admitToolBatch({limit,messages:history.slice(0,start),tools,assistant,suffix,results:tail.map(m=>JSON.parse(m.content)),
   measure:prompt=>client.measureEnvelope(prompt),archive:record=>persist({kind:'tool-output-archive',record})});
  await persist({kind:'aggregate-admission',status:result.status,attempts:result.attempts,prompt_sha256:result.prompt_sha256??null,delivery:'unconfirmed'});
  if(result.status!=='admitted'&&allow_recycler_fallback&&typeof result.prompt==='string')return result.prompt;
  need(result.status==='admitted','mandatory-envelope-too-large');
  // Freeze each projected observation across later history renderings. Otherwise
  // one read ID could acquire different visible bytes as available space changes.
  result.outputs.forEach((output,i)=>projections.set(keys.get(tail[i].tool_call_id),stable(output)));
  return result.prompt;
 }
 return admitMessages;
}
