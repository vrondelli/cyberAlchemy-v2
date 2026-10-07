// Exposed post-seal FILE acquisition proxy only, not native F1.
// Open Questions: evidence/G02-QUERY-EXPANSION-SCREEN-R1.json.
const need=(v,r)=>{if(!v)throw Error('query-screen.'+r);};
import{createHash}from'node:crypto';
export function verifyLeadSeal({cases,seal,readLeadBytes}){
 need(cases.length===12&&seal.rows.length===12,'complete-cohort');const result=[];
 for(const c of cases){
  const rows=seal.rows.filter(r=>r.pair===c.pair);need(rows.length===1,'unique-seal-entry');
  const bytes=readLeadBytes(c.pair);need(createHash('sha256').update(bytes).digest('hex')===rows[0].leads_sha256,'lead-digest');
  const data=JSON.parse(bytes);need(data.pair===c.pair&&data.instance_id===c.instance_id&&
   data.treatment.length===3&&data.control.length===3,'lead-identity');result.push(data);
 }
 return result; // No labels may be loaded until every entry above verifies.
}
// Equivalent to pinned Gold.files path normalization, not byte/symbol scoring.
export function normalizeGoldPath(path){
 need(typeof path==='string','gold-path');const p=path.replaceAll('\\','/');
 if(p.startsWith('/testbed/'))return p.slice('/testbed/'.length);
 if(p.startsWith('/workspace/')){const r=p.slice('/workspace/'.length),i=r.indexOf('/');return i<0?r:r.slice(i+1);}
 return p.startsWith('/')?p.replace(/^\/+/, ''):p.replace(/^[./]+/, '');
}
export function goldFiles(data){
 let init=data.init_ctx??[],add=data.add_ctx??[];
 need(Array.isArray(init)&&Array.isArray(add),'gold-context');
 if(!init.length&&!add.length&&Array.isArray(data.gold_ctx))init=data.gold_ctx;
 return [...new Set([...init,...add].filter(x=>x.file).map(x=>normalizeGoldPath(x.file)))].sort();
}
export function observedFiles(prediction){
 const t=prediction.traj_data;need(Array.isArray(t?.pred_steps),'trajectory');
 const result=new Set();
 for(const step of [...t.pred_steps,{files:t.pred_files,spans:t.pred_spans}]){
  need(Array.isArray(step.files)&&step.spans&&typeof step.spans==='object','step');
  for(const p of [...step.files,...Object.keys(step.spans)]){need(typeof p==='string','observed-path');result.add(p);}
 }
 return [...result].sort();
}
export function pairLeadWidths(treatment,control){
 need(Array.isArray(treatment)&&Array.isArray(control)&&treatment.length<=3&&control.length<=3,'slots');
 const out={treatment:[],control:[]};
 for(let i=0;i<3;i++){
  const t=treatment[i]??null,c=control[i]??null;
  for(const x of [t,c])if(x)need(Number.isSafeInteger(x.start_line)&&Number.isSafeInteger(x.end_line)&&
   x.start_line>=1&&x.end_line>=x.start_line&&x.end_line-x.start_line+1<=17,'range');
  const width=t&&c?Math.min(t.end_line-t.start_line+1,c.end_line-c.start_line+1):null;
  for(const [name,x]of [['treatment',t],['control',c]])out[name].push(x?{...x,end_line:width?x.start_line+width-1:x.end_line}:null);
 }
 return out;
}
export function scoreFileAcquisition({referenceFiles,observed,treatment,control}){
 need(referenceFiles.length>0,'empty-reference');
 const gold=new Set(referenceFiles),old=new Set(observed),out={reference_file_count:gold.size};
 for(const [arm,leads]of [['treatment',treatment],['control',control]]){
  need(leads.length===3,'complete-slots');
  const paths=new Set(leads.filter(Boolean).map(x=>x.path));
  need([...paths].every(p=>!old.has(p)),'not-novel-source');
  const hits=[...paths].filter(p=>gold.has(p)).sort();
  out[arm]={allocated_slots:3,proposed_unique_files:paths.size,novel_reference_files:hits,
   hit_count:hits.length,reference_file_coverage_gain:hits.length/gold.size};
 }
 return out;
}
