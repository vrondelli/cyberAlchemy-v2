// Additive native runner adapter. Open questions: AGGREGATE-NATIVE-INTEGRATION.md.
import {createHash} from 'node:crypto';
import {createNativeInvestigationDriver as createBaseDriver} from './independent-native-driver.mjs';
import {admitToolBatch} from './aggregate-tool-admission.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('aggregate-native.'+m);};
export function createNativeInvestigationDriver({persist,...native}){
 need(typeof native.client?.measureEnvelope==='function'&&typeof persist==='function','dependencies');
 const driver=createBaseDriver(native),projections=new Map();let closed=false;
 async function admitMessages(messages,tools){
  need(!closed&&!native.signal?.aborted,'closed-or-aborted');
  const history=structuredClone(messages),calls=new Map(),keys=new Map();
  for(const m of history){
   if(m.role==='assistant')for(const call of m.tool_calls??[]){need(!calls.has(call.id),'duplicate-call');calls.set(call.id,call);}
   if(m.role==='tool'){
    const call=calls.get(m.tool_call_id);need(call,'unbound-result');
    const key=hash({call,content:m.content});keys.set(m.tool_call_id,key);
    if(projections.has(key))m.content=projections.get(key);
   }
  }
  let start=history.length-1;
  while(start>=0&&history[start].role==='tool')start--;
  const assistant=history[start],tail=history.slice(start+1);
  if(!tail.length||!assistant?.tool_calls?.length)return renderCompactPrompt({messages:history,tools});
  need(tail.length===assistant.tool_calls.length&&tail.every((m,i)=>m.tool_call_id===assistant.tool_calls[i].id),'batch-order');
  const cached=tail.map(m=>projections.has(keys.get(m.tool_call_id)));
  if(cached.every(Boolean))return renderCompactPrompt({messages:history,tools});
  need(cached.every(x=>!x),'mixed-cached-batch');
  const result=await admitToolBatch({messages:history.slice(0,start),tools,assistant,results:tail.map(m=>JSON.parse(m.content)),
   measure:prompt=>native.client.measureEnvelope(prompt),archive:record=>persist({kind:'tool-output-archive',record})});
  persist({kind:'aggregate-admission',status:result.status,attempts:result.attempts,prompt_sha256:result.prompt_sha256??null,delivery:'unconfirmed'});
  need(result.status==='admitted','mandatory-envelope-too-large');
  // Freeze each projected observation across later history renderings. Otherwise
  // one read ID could acquire different visible bytes as available space changes.
  result.outputs.forEach((output,i)=>projections.set(keys.get(tail[i].tool_call_id),stable(output)));
  return result.prompt;
 }
 return Object.freeze({...driver,admitMessages,close(){closed=true;return driver.close();}});
}
