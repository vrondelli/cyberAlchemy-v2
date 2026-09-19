// Reuse existing complete-exchange projection. Open questions: MINIMAL-HISTORY.md.
import {createHash} from 'node:crypto';
import {projectHistory} from './discovery-v1/history.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('minimal-history.'+m);};

/** Full executed history only. Task/system instructions are assembled separately.
 * Keeps original assistant fields (including reasoning) and whole tool results.
 * Does not measure tokens, fabricate summaries or provide dispatch admission.
 */
export function projectMinimalHistory({history}){
 need(Array.isArray(history),'history-array');
 for(const message of history){
  need(message&&['assistant','tool'].includes(message.role),'conversation-role');
  if(message.role==='assistant'){
   need(message.tool_calls===undefined||Array.isArray(message.tool_calls),'tool-call-array');
   for(const call of message.tool_calls??[]){
    need(call&&call.type==='function'&&typeof call.id==='string'&&call.id.length>0,'tool-call');
    need(call.function&&typeof call.function.name==='string'&&call.function.name.length>0&&typeof call.function.arguments==='string','tool-function');
   }
  }else need(typeof message.tool_call_id==='string'&&typeof message.content==='string','tool-result');
 }
 const input=structuredClone(history),projected=projectHistory({history:input});
 return {history:projected.history,projection:{policy:'minimal-history-two-exchanges-v1',input_sha256:hash(input),output_sha256:hash(projected.history),...projected.diagnostics}};
}
