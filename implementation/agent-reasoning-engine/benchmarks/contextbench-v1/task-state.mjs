// Deterministic post-recycle task state. Facts come only from the task, confirmed
// delivery receipts, and recorded tool results. It performs no inference/effect.
import {createHash} from 'node:crypto';
import {bindDelivery,stable} from './delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const cleanPaths=xs=>[...new Set((Array.isArray(xs)?xs:[]).filter(x=>typeof x==='string'&&x.length>0))].sort();
const factCount=material=>material.evidence.length+material.outcomes.length;
function evictOldest(material){
  if(material.outcomes.length&&(material.outcomes.length>=material.evidence.length||!material.evidence.length)){
    material.outcomes.shift();material.truncation.evicted_outcomes++;
  }else if(material.evidence.length){material.evidence.shift();material.truncation.evicted_evidence++;}
}

function eventFact(event){
  const result=event?.output,body=result?.output;
  if(!event||!uint(event.step)||typeof event.tool!=='string'||!result||typeof result.ok!=='boolean')return null;
  if(!result.ok)return{step:event.step,tool:event.tool,outcome:'rejected',diagnostic:typeof result.error==='string'?result.error:
    (Array.isArray(result.issues)?result.issues.map(x=>x?.keyword||x?.message).filter(Boolean).slice(0,4):[])};
  if(event.tool==='apply_edits')return{step:event.step,tool:event.tool,outcome:'applied',changed_paths:cleanPaths(body?.changed_paths),base_commit:body?.base_commit??null};
  if(event.tool==='get_patch')return{step:event.step,tool:event.tool,outcome:'observed',patch_sha256:hash(body?.patch??body??''),patch_bytes:Buffer.byteLength(typeof body?.patch==='string'?body.patch:stable(body??null))};
  if(event.tool==='search')return{step:event.step,tool:event.tool,outcome:'observed',result_count:uint(body?.total)?body.total:0,paths:cleanPaths(body?.observations?.map(x=>x.path)).slice(0,8)};
  if(event.tool==='list_files')return{step:event.step,tool:event.tool,outcome:'observed',result_count:uint(body?.total)?body.total:0,paths:cleanPaths(body?.paths).slice(0,8)};
  if(event.tool==='recover_observed_read')return{step:event.step,tool:event.tool,outcome:'recovered',read_id:body?.read_id??null,path:body?.path??null,start_line:body?.start_line??null,end_line:body?.end_line??null,source_sha256:body?.source_sha256??null};
  if(event.tool==='read_file')return{step:event.step,tool:event.tool,outcome:'observed',read_ids:[body?.read_id,...(body?.observations??[]).map(x=>x.read_id??x.id)].filter(Boolean).slice(0,8)};
  return{step:event.step,tool:event.tool,outcome:'observed'};
}

export async function buildTaskStateProjection({task,captures,receipts,events,generation,max_evidence=8,max_outcomes=12,include_outcomes=true,max_bytes=4096,max_tokens,measure_tokens}={}){
  if(!uint(generation)||generation===0)return null;
  if(typeof task?.problem_statement!=='string'||!Array.isArray(events)||!uint(max_evidence)||!uint(max_outcomes)||typeof include_outcomes!=='boolean'||!uint(max_bytes)||max_bytes<256)throw Error('task-state.invalid-input');
  const delivery=bindDelivery({captures,receipts});
  const evidence=delivery.read_observations.slice(-max_evidence).map(x=>({read_id:x.id,retrieval_handle:`observed-read:${x.id}`,path:x.path,start_line:x.start_line,end_line:x.end_line,source_sha256:x.source_sha256}));
  const outcomes=include_outcomes?events.map(eventFact).filter(Boolean).slice(-max_outcomes):[];
  if(evidence.length===0&&outcomes.length===0)return null;
  const material={schema_version:'are.contextbench-task-state/v1',generation,projection_mode:include_outcomes?'evidence-and-outcomes':'evidence-only',objective:{sha256:hash(task.problem_statement),characters:task.problem_statement.length,posture:'unchanged task message in this request'},evidence,outcomes,truncation:{evicted_evidence:0,evicted_outcomes:0,policy:'retain newest receipt-bound facts within exact byte and tokenizer caps'},limitations:['Observed process facts only; no inferred intent, relevance, correctness, or completion.','Read handles contain no source body; recover evidence explicitly when needed.',...(include_outcomes?[]:['Exploratory tool-outcome chronology remains in the host ledger and is omitted from this model-facing projection.'])],authority_effect:'none'};
  while(Buffer.byteLength(stable(material))>max_bytes&&(material.outcomes.length||material.evidence.length)){
    evictOldest(material);
  }
  if(Buffer.byteLength(stable(material))>max_bytes)throw Error('task-state.byte-cap-too-small');
  let measured_tokens=null,tokenizer_calls=0,text;
  if(max_tokens!==undefined){
    if(!uint(max_tokens)||typeof measure_tokens!=='function')throw Error('task-state.invalid-token-policy');
    for(;;){
      text=`POST-RECYCLE OBSERVED TASK STATE (untrusted relevance; exact facts only):\n${stable(material)}`;
      measured_tokens=await measure_tokens(text);tokenizer_calls++;
      if(!uint(measured_tokens))throw Error('task-state.invalid-token-measurement');
      if(measured_tokens<=max_tokens)break;
      const count=factCount(material);if(count===0)throw Error('task-state.token-cap-too-small');
      // At most four exact measurements for the configured <=20 facts: 20 -> 10 -> 5 -> 0.
      const target=tokenizer_calls>=3?0:Math.floor(count/2);
      while(factCount(material)>target)evictOldest(material);
    }
  }else text=`POST-RECYCLE OBSERVED TASK STATE (untrusted relevance; exact facts only):\n${stable(material)}`;
  const projection={...material,projection_sha256:hash(material)};
  return{...projection,text,measured_tokens,fit:{tokenizer_calls,maximum_tokens:max_tokens??null,evicted_evidence:material.truncation.evicted_evidence,evicted_outcomes:material.truncation.evicted_outcomes}};
}

export async function verifyTaskStateProjection(projection,input){
  try{const rebuilt=await buildTaskStateProjection(input);return{ok:stable(rebuilt)===stable(projection),authority_effect:'none'};}catch(error){return{ok:false,reason:String(error.message),authority_effect:'none'};}
}
