// Exact single-text-block projection of pinned DSH0.1.5-rc.2 default pruner.
// Open questions: DEEPSEEK-CONTROL-FIT-DAG.md. No hidden middle counts as delivery.
import {stable,observationItems} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {encodeToolPayload} from './tool-payload-codec.mjs';
export const PRUNE_MARKER='\n\n[... tool result middle pruned ...]\n\n';
export function pruneNativeText(text){const points=Array.from(text);return points.length<=8192?text:points.slice(0,4096).join('')+PRUNE_MARKER+points.slice(-1024).join('');}
export function visibleToolObservations({call,output,content}){
 if(typeof content!=='string')throw Error('dsh-wire.tool-output-mismatch');
 const tool=call.function.name,encoded=encodeToolPayload({tool,result:output});
 const variants=[{payload:output,encoded:false},...(encoded.encoded?[encoded]:[])];
 for(const variant of variants){
  const original=stable(variant.payload),pruned=pruneNativeText(original);
  if(content!==original&&content!==pruned)continue;
  const observations=observationItems(call,output);
  if(content===original)return {observations,pruned:false,encoded:variant.encoded};
  const points=Array.from(original),head=points.slice(0,4096).join(''),tail=points.slice(-1024).join('');
  // Each complete serialized row (and dictionary source, when factored) must
  // occur wholly in a retained original interval, never across the marker.
  const visible=value=>{const text=stable(value);return head.includes(text)||tail.includes(text);};
  return {pruned:true,encoded:variant.encoded,observations:observations.filter(({o},index)=>{
   if(!variant.encoded)return visible(o);
   const row=variant.payload.output.observations[index];return visible(row)&&visible(variant.payload.output.sources[row.source_ref]);
  })};
 }
 throw Error('dsh-wire.tool-output-mismatch');
}
