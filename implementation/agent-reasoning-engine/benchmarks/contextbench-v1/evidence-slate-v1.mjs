// Gold-blind finalization slate over confirmed pinned-base observations.
// Open questions: ../../../../agent-reasoning-engine/research/contextbench-v1/PLAN-round33.md#open-questions.
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync} from 'node:fs';
import {basename,resolve,sep} from 'node:path';
import {bindDelivery,stable} from './delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
const stop=new Set(['the','and','for','with','from','this','that','into','when','then','should','would','could']);
export const featureWords=text=>new Set((String(text).toLowerCase().match(/[a-z][a-z0-9]{1,}/g)??[]).filter(word=>!stop.has(word)));
export const featureOverlap=(left,right)=>[...left].filter(value=>right.has(value)).length;
const safe=(root,path)=>{const target=resolve(root,path);return target===root||target.startsWith(root+sep);};
const uint=x=>Number.isSafeInteger(x)&&x>=0;

export function evidenceSlateCandidates({task,captures,receipts,repoRoot}){
  if(typeof task?.problem_statement!=='string'||!Array.isArray(captures)||!Array.isArray(receipts)||typeof repoRoot!=='string')throw Error('evidence-slate.invalid-input');
  return evidenceSlateCandidatesFromDelivery({task,delivery:bindDelivery({captures,receipts}),repoRoot});
}

export function evidenceSlateCandidatesFromDelivery({task,delivery,repoRoot}){
  if(typeof task?.problem_statement!=='string'||delivery?.schema_version!=='are.contextbench-delivery-binding/v1'||!Array.isArray(delivery.read_observations)||typeof repoRoot!=='string')throw Error('evidence-slate.invalid-delivery');
  const root=resolve(repoRoot),realRoot=realpathSync(root),baseHashes=new Map();
  for(const read of delivery.read_observations){
    if(baseHashes.has(read.path)||!safe(root,read.path))continue;
    try{const target=realpathSync(resolve(root,read.path));if(safe(realRoot,target))baseHashes.set(read.path,hash(readFileSync(target)));}catch{}
  }
  const observations=delivery.read_observations.map((read,index)=>({...read,index,width:read.end_line-read.start_line+1,presentations:read.confirmed_receipts.length,recency:Math.max(...read.confirmed_receipts)})).filter(read=>read.source_sha256===baseHashes.get(read.path)),groups=new Map();
  for(const read of observations){if(!groups.has(read.path))groups.set(read.path,[]);groups.get(read.path).push(read);}
  const taskWords=featureWords(task.problem_statement),candidates=[];
  for(const [path,items] of groups){
    const selected=[...items].sort((a,b)=>b.width-a.width||b.recency-a.recency||b.index-a.index||a.id.localeCompare(b.id))[0],pathWords=featureWords(path.replace(/[._/\\-]+/g,' ')),bodyWords=featureWords(selected.body);
    candidates.push({read_id:selected.id,retrieval_handle:`observed-read:${selected.id}`,path,start_line:selected.start_line,end_line:selected.end_line,source_sha256:selected.source_sha256,distinct_path_observations:items.length,receipt_presentations:items.reduce((sum,item)=>sum+item.presentations,0),last_confirmed_receipt:Math.max(...items.map(item=>item.recency)),width:selected.width,task_path_token_overlap:featureOverlap(taskWords,pathWords),task_body_token_overlap:featureOverlap(taskWords,bodyWords),basename:basename(path)});
  }
  return candidates.sort((a,b)=>b.task_body_token_overlap-a.task_body_token_overlap||b.task_path_token_overlap-a.task_path_token_overlap||b.distinct_path_observations-a.distinct_path_observations||b.receipt_presentations-a.receipt_presentations||b.last_confirmed_receipt-a.last_confirmed_receipt||b.width-a.width||a.read_id.localeCompare(b.read_id));
}

export async function buildEvidenceSlate({task,captures,receipts,repoRoot,max_candidates=8,max_bytes=4096,max_tokens=1024,measure_tokens}){
  if(!uint(max_candidates)||max_candidates<1||!uint(max_bytes)||max_bytes<256||!uint(max_tokens)||max_tokens<1||typeof measure_tokens!=='function')throw Error('evidence-slate.invalid-policy');
  return buildEvidenceSlateFromCandidates({task,ranked:evidenceSlateCandidates({task,captures,receipts,repoRoot}),max_candidates,max_bytes,max_tokens,measure_tokens});
}

export async function buildEvidenceSlateFromCandidates({task,ranked,max_candidates=8,max_bytes=4096,max_tokens=1024,measure_tokens}){
  if(typeof task?.problem_statement!=='string'||!Array.isArray(ranked)||!uint(max_candidates)||max_candidates<1||!uint(max_bytes)||max_bytes<256||!uint(max_tokens)||max_tokens<1||typeof measure_tokens!=='function')throw Error('evidence-slate.invalid-policy');
  const selected=ranked.slice(0,max_candidates),material={schema_version:'are.contextbench-evidence-slate/v1',posture:'Delivered pinned-base candidates ranked by observable task agreement and attention; candidates are not asserted relevant.',objective_sha256:hash(task.problem_statement),candidates:selected.map(({basename:ignored,...candidate})=>candidate),limitations:['Metadata only; source bodies were delivered earlier.','Choose only evidence actually useful to the task. An empty selection is valid.'],authority_effect:'none'};
  let tokenizer_calls=0,measured_tokens=0,text;
  for(;;){text=`FINALIZATION EVIDENCE CANDIDATES (untrusted relevance; choose, ignore, or submit empty):\n${stable(material)}`;if(Buffer.byteLength(text)<=max_bytes){measured_tokens=await measure_tokens(text);tokenizer_calls++;if(uint(measured_tokens)&&measured_tokens<=max_tokens)break;}if(!material.candidates.length)throw Error('evidence-slate.caps-too-small');material.candidates.pop();}
  return {...material,text,measured_tokens,fit:{maximum_candidates:max_candidates,maximum_bytes:max_bytes,maximum_tokens:max_tokens,tokenizer_calls,retained_candidates:material.candidates.length,evicted_candidates:selected.length-material.candidates.length},model_calls:0,model_tokens:0,slate_sha256:hash(material)};
}
