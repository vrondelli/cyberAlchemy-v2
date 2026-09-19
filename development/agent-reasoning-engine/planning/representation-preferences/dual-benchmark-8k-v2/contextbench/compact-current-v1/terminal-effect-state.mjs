// Additive current-ARE codec integration. Open questions: README.md.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {bindDelivery,observationItems,observationMaterial,stable} from './delivery.mjs';
const need=(x,m)=>{if(!x)throw Error(`terminal-effect-state.${m}`);};
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
export function patchHunks(patch){
  let path=null;const result=new Map();
  for(const line of (patch??'').split('\n')){
    const file=line.match(/^diff --git a\/(.+?) b\/(.+)$/);if(file){path=file[2];continue;}
    const hunk=line.match(/^@@ -(\d+)(?:,(\d+))? \+/);if(hunk&&path){const start=Number(hunk[1]),end=start+Number(hunk[2]??1)-1;result.set(path,[...(result.get(path)??[]),{start,end}]);}
  }
  return result;
}
const overlap=(read,hunks)=>hunks.reduce((sum,h)=>sum+Math.max(0,Math.min(read.end_line,h.end)-Math.max(read.start_line,h.start)+1),0);
export async function buildTerminalEffectState({captures,receipts,pending_messages=[],patch,repoRoot,max_evidence=8}){
  need(Number.isSafeInteger(max_evidence)&&max_evidence>0&&typeof repoRoot==='string','options');
  const hunks=patchHunks(patch);if(!hunks.size)return {suppressed:true,reason:'no-effect-hunks',text:null,evidence:[],selection_read_ids:[]};
  const confirmed=bindDelivery({captures,receipts}).read_observations,pending=[],calls=new Map();
  for(const message of pending_messages){
    if(message.role==='assistant')for(const call of message.tool_calls??[])calls.set(call.id,call);
    if(message.role!=='tool')continue;const call=calls.get(message.tool_call_id);if(!call)continue;let result;try{result=JSON.parse(message.content);}catch{continue;}
    let items;try{items=observationItems(call,result);}catch{continue;}
    for(const {tool_call_id,o} of items){const material=observationMaterial(tool_call_id,o),id=hash(material);if(o.read_id===id)pending.push({id,...material});}
  }
  const baseRoot=resolve(repoRoot),baseHashes=new Map();
  for(const path of hunks.keys()){const target=resolve(baseRoot,path);if(target!==baseRoot&&!target.startsWith(baseRoot+sep))continue;try{baseHashes.set(path,hash(readFileSync(target)));}catch{}}
  const reads=[...new Map([...confirmed,...pending].map(x=>[x.id,x])).values()].filter(x=>x.source_sha256===baseHashes.get(x.path)).map((x,index)=>({...x,index,width:x.end_line-x.start_line+1})),ranked=[];
  for(const [path,pathHunks] of hunks){
    ranked.push(...reads.filter(x=>x.path===path).map(x=>({...x,overlap_lines:overlap(x,pathHunks)})).filter(x=>x.overlap_lines>0).sort((a,b)=>b.overlap_lines-a.overlap_lines||b.width-a.width||b.index-a.index));
  }
  const distinct=[...new Map(ranked.map(x=>[x.id,x])).values()].slice(0,max_evidence);if(!distinct.length)return {suppressed:true,reason:'no-delivered-base-effect-overlap',effect_paths:[...hunks.keys()],delivered_paths:[...new Set(reads.map(x=>x.path))],evidence:[],selection_read_ids:[],model_tokens:0};
  const evidence=distinct.map(item=>({read_id:item.id,path:item.path,start_line:item.start_line,end_line:item.end_line,source_sha256:item.source_sha256,overlap_lines:item.overlap_lines}));
  return {suppressed:false,reason:null,evidence,selection_read_ids:evidence.map(x=>x.read_id),model_tokens:0};
}
