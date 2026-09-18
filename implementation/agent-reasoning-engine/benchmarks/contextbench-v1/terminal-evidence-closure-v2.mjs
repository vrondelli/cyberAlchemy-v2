// Round 31 frozen candidate: effect overlap, with a no-effect repeated-attention fallback.
// Open questions: ../../../agent-reasoning-engine/research/contextbench-v1/PLAN-round31.md.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {bindDelivery,observationItems,observationMaterial,stable} from './delivery.mjs';
import {buildTerminalEffectState} from './terminal-effect-state.mjs';

const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
const within=(root,path)=>{const target=resolve(root,path);return target===root||target.startsWith(root+sep);};

function pendingReads(pending_messages){
  const calls=new Map(),reads=[];
  for(const message of pending_messages){
    if(message.role==='assistant')for(const call of message.tool_calls??[])calls.set(call.id,call);
    if(message.role!=='tool')continue;
    const call=calls.get(message.tool_call_id);if(!call)continue;
    let result;try{result=JSON.parse(message.content);}catch{continue;}
    let items;try{items=observationItems(call,result);}catch{continue;}
    for(const {tool_call_id,o} of items){
      const material=observationMaterial(tool_call_id,o),id=hash(material);
      if(o.read_id===id)reads.push({id,...material,confirmed_receipts:[Number.MAX_SAFE_INTEGER]});
    }
  }
  return reads;
}

function repeatedAttention({captures,receipts,pending_messages,repoRoot,max_paths}){
  const confirmed=bindDelivery({captures,receipts}).read_observations;
  const reads=[...confirmed,...pendingReads(pending_messages)].map((x,index)=>({...x,index,width:x.end_line-x.start_line+1,frequency:x.confirmed_receipts?.length??1,recency:Math.max(...(x.confirmed_receipts??[index]))}));
  const root=resolve(repoRoot),hashes=new Map();
  for(const read of reads){
    if(hashes.has(read.path)||!within(root,read.path))continue;
    try{hashes.set(read.path,hash(readFileSync(resolve(root,read.path))));}catch{}
  }
  const base=reads.filter(x=>x.source_sha256===hashes.get(x.path));
  const groups=new Map();
  for(const read of base){if(!groups.has(read.path))groups.set(read.path,[]);groups.get(read.path).push(read);}
  const ranked=[...groups].map(([path,items])=>({path,items,frequency:items.reduce((n,x)=>n+x.frequency,0),recency:Math.max(...items.map(x=>x.recency)),width:Math.max(...items.map(x=>x.width))}))
    .sort((a,b)=>b.frequency-a.frequency||b.recency-a.recency||b.width-a.width||a.path.localeCompare(b.path)).slice(0,max_paths);
  const selected=ranked.map(group=>group.items.sort((a,b)=>b.width-a.width||b.recency-a.recency||b.index-a.index||a.id.localeCompare(b.id))[0]);
  const evidence=selected.map(x=>({read_id:x.id,path:x.path,start_line:x.start_line,end_line:x.end_line,source_sha256:x.source_sha256,path_frequency:groups.get(x.path).reduce((n,y)=>n+y.frequency,0)}));
  return {suppressed:evidence.length===0,reason:evidence.length?'no-effect-repeated-attention': 'no-delivered-base-observations',mode:'repeated-attention',evidence,selection_read_ids:evidence.map(x=>x.read_id),delivered_paths:[...groups.keys()],model_tokens:0};
}

export async function buildTerminalEvidenceClosure({captures,receipts,pending_messages=[],patch,repoRoot,max_evidence=8,max_no_effect_paths=4}){
  if(!Number.isSafeInteger(max_no_effect_paths)||max_no_effect_paths<1)throw Error('terminal-evidence-closure.invalid-no-effect-path-limit');
  const effect=await buildTerminalEffectState({captures,receipts,pending_messages,patch,repoRoot,max_evidence});
  if(effect.reason!=='no-effect-hunks')return {...effect,mode:'effect-overlap'};
  return repeatedAttention({captures,receipts,pending_messages,repoRoot,max_paths:max_no_effect_paths});
}
