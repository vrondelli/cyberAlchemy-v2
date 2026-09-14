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

function selectEvidence(observations,{max_evidence,max_paths,max_handles_per_path,handle_selection='newest'}){
  if(max_paths===undefined&&max_handles_per_path===undefined)return observations.slice(-max_evidence);
  const paths=new Set();
  for(let index=observations.length-1;index>=0;index--){
    const path=observations[index].path;
    if(!paths.has(path)&&paths.size<max_paths)paths.add(path);
  }
  const selected=[];
  for(const path of paths){
    const candidates=observations.map((observation,index)=>({observation,index})).filter(item=>item.observation.path===path);
    candidates.sort(handle_selection==='widest'
      ?(a,b)=>(b.observation.end_line-b.observation.start_line)-(a.observation.end_line-a.observation.start_line)||b.index-a.index
      :(a,b)=>b.index-a.index);
    selected.push(...candidates.slice(0,max_handles_per_path));
  }
  return selected.sort((a,b)=>a.index-b.index).map(item=>item.observation).slice(-max_evidence);
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

export async function buildTaskStateProjection({task,captures,receipts,events,generation,max_evidence=8,max_outcomes=12,include_outcomes=true,max_paths,max_handles_per_path,handle_selection='newest',novelty_gate=false,exclude_read_ids=[],max_bytes=4096,max_tokens,measure_tokens}={}){
  if(!uint(generation)||generation===0)return null;
  if(typeof task?.problem_statement!=='string'||!Array.isArray(events)||!uint(max_evidence)||!uint(max_outcomes)||typeof include_outcomes!=='boolean'||!uint(max_bytes)||max_bytes<256)throw Error('task-state.invalid-input');
  const pathBalanced=max_paths!==undefined||max_handles_per_path!==undefined;
  if(pathBalanced&&(!uint(max_paths)||max_paths<1||!uint(max_handles_per_path)||max_handles_per_path<1))throw Error('task-state.invalid-path-balance-policy');
  if(!['newest','widest'].includes(handle_selection)||(handle_selection!=='newest'&&!pathBalanced))throw Error('task-state.invalid-handle-selection-policy');
  if(typeof novelty_gate!=='boolean'||!Array.isArray(exclude_read_ids)||exclude_read_ids.some(id=>typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))||new Set(exclude_read_ids).size!==exclude_read_ids.length||(!novelty_gate&&exclude_read_ids.length))throw Error('task-state.invalid-novelty-policy');
  const delivery=bindDelivery({captures,receipts});
  const selectedBeforeNovelty=selectEvidence(delivery.read_observations,{max_evidence,max_paths,max_handles_per_path,handle_selection});
  const excluded=new Set(exclude_read_ids),selectedEvidence=novelty_gate?selectedBeforeNovelty.filter(item=>!excluded.has(item.id)):selectedBeforeNovelty;
  const evidence=selectedEvidence.map(x=>({read_id:x.id,retrieval_handle:`observed-read:${x.id}`,path:x.path,start_line:x.start_line,end_line:x.end_line,source_sha256:x.source_sha256}));
  const outcomes=include_outcomes?events.map(eventFact).filter(Boolean).slice(-max_outcomes):[];
  if(evidence.length===0&&outcomes.length===0&&!novelty_gate)return null;
  const material={schema_version:'are.contextbench-task-state/v1',generation,projection_mode:include_outcomes?'evidence-and-outcomes':'evidence-only',objective:{sha256:hash(task.problem_statement),characters:task.problem_statement.length,posture:'unchanged task message in this request'},
    ...(pathBalanced?{evidence_policy:{kind:novelty_gate?'newest-path-widest-handle-novelty-gated-receipt-bound/v1':handle_selection==='widest'?'newest-path-widest-handle-receipt-bound/v1':'newest-path-balanced-receipt-bound/v1',maximum_paths:max_paths,maximum_distinct_handles_per_path:max_handles_per_path,handle_selection,...(novelty_gate?{novelty_gate:true}:{}),ordering:'chronological-after-selection',posture:'observed-not-relevant'}}:{}),
    evidence,outcomes,truncation:{evicted_evidence:pathBalanced?delivery.read_observations.length-selectedBeforeNovelty.length:0,...(novelty_gate?{suppressed_seen_evidence:selectedBeforeNovelty.length-selectedEvidence.length}:{}),evicted_outcomes:0,policy:pathBalanced?`retain ${handle_selection} distinct receipt-bound handles across newest paths${novelty_gate?', then suppress handles already presented in this branch':''}, then fit exact byte and tokenizer caps`:'retain newest receipt-bound facts within exact byte and tokenizer caps'},limitations:['Observed process facts only; no inferred intent, relevance, correctness, or completion.','Read handles contain no source body; recover evidence explicitly when needed.',...(include_outcomes?[]:['Exploratory tool-outcome chronology remains in the host ledger and is omitted from this model-facing projection.'])],authority_effect:'none'};
  if(novelty_gate&&evidence.length===0&&outcomes.length===0){
    const projection={...material,suppressed:true,suppression_reason:'no-novel-selected-evidence',projection_sha256:hash(material)};
    return{...projection,text:null,measured_tokens:0,fit:{tokenizer_calls:0,maximum_tokens:max_tokens??null,evicted_evidence:material.truncation.evicted_evidence,evicted_outcomes:0}};
  }
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
