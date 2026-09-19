// Matched component packets. No model calls; caller supplies the real state tokenizer.
// Open questions: PLAN.md. Complete wire admission is a separate required boundary.
import assert from 'node:assert/strict';
import {buildTerminalEvidence,EXPANDED} from './terminal-evidence.mjs';
import {LEGACY,DIVERSITY} from './ranking.mjs';
export async function buildPairedPackets(options){
 let maximum=options.max_handles??32;assert.ok(Number.isSafeInteger(maximum)&&maximum>=1&&maximum<=32);
 const attempts=[];
 while(maximum>=1){
  const common={...options,version:EXPANDED,max_handles:maximum};
  const legacy=await buildTerminalEvidence({...common,ranking_policy:LEGACY});
  const diversity=await buildTerminalEvidence({...common,ranking_policy:DIVERSITY});
  attempts.push({maximum_handles:maximum,legacy_fit:legacy.fit,diversity_fit:diversity.fit});
  if(legacy.status!=='ready'||diversity.status!=='ready')return {admitted:false,reason:'paired-packet-unfit',legacy,diversity,attempts,model_calls:0};
  const count=Math.min(legacy.private.bindings.length,diversity.private.bindings.length);
  if(legacy.private.bindings.length===diversity.private.bindings.length){
   assert.deepEqual(legacy.model.tool,diversity.model.tool,'matched expanded schema required');
   return {admitted:true,legacy,diversity,attempts,matched_handles:count,model_calls:0,complete_wire_admission_required:true};
  }
  assert.ok(count<maximum,'paired backoff must make progress');maximum=count;
 }
 throw Error('paired packet backoff exhausted');
}
