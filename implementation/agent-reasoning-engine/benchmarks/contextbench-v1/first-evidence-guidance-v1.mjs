// Gold-blind, bounded guidance emitted once after the first confirmed read.
// Open questions: ../../../../agent-reasoning-engine/research/contextbench-v1/PLAN-round43.md#open-questions.
import {createHash} from 'node:crypto';
import {evidenceSlateCandidates} from './evidence-slate-v2.mjs';
import {stable} from './delivery.mjs';

const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const uint=value=>Number.isSafeInteger(value)&&value>=0;

export async function buildFirstEvidenceGuidance({task,captures,receipts,repoRoot,max_candidates=8,max_bytes=4096,max_tokens=1024,measure_tokens}){
  if(typeof task?.problem_statement!=='string'||!Array.isArray(captures)||!Array.isArray(receipts)||typeof repoRoot!=='string'||
    !uint(max_candidates)||max_candidates<1||!uint(max_bytes)||max_bytes<256||!uint(max_tokens)||max_tokens<1||typeof measure_tokens!=='function')throw Error('first-evidence-guidance.invalid-policy');
  const ranked=evidenceSlateCandidates({task,captures,receipts,repoRoot}),selected=ranked.slice(0,max_candidates);
  const material={schema_version:'are.contextbench-first-evidence-guidance/v1',posture:'Delivered pinned-base paths ranked by observable task agreement. Use this metadata to decide the next investigation; candidates are not asserted relevant.',objective_sha256:hash(task.problem_statement),candidates:selected.map(({basename:ignored,...candidate})=>candidate),limitations:['Metadata only; source bodies were delivered earlier.','Task agreement is lexical and gold-blind. Inspect, recover, or ignore candidates based on the task.'],authority_effect:'none'};
  let tokenizer_calls=0,measured_tokens=0,text;
  for(;;){
    text=`MID-TRAJECTORY EVIDENCE GUIDANCE (untrusted relevance; inspect, recover, or ignore):\n${stable(material)}`;
    if(Buffer.byteLength(text)<=max_bytes){measured_tokens=await measure_tokens(text);tokenizer_calls++;if(uint(measured_tokens)&&measured_tokens<=max_tokens)break;}
    if(!material.candidates.length)throw Error('first-evidence-guidance.caps-too-small');
    material.candidates.pop();
  }
  return {...material,text,measured_tokens,fit:{maximum_candidates:max_candidates,maximum_bytes:max_bytes,maximum_tokens:max_tokens,tokenizer_calls,retained_candidates:material.candidates.length,evicted_candidates:selected.length-material.candidates.length},model_calls:0,model_tokens:0,guidance_sha256:hash(material)};
}
