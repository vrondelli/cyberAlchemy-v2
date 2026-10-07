// Diagnostic LINE units, never byte/Span-F1 or a deployable policy.
// Open Questions: G02-INVENTORY-SOURCE-CARDS-R1.json.
import{normalizeGoldPath}from'./query-expansion-screen-metrics-r1.mjs';
const need=(v,r)=>{if(!v)throw Error('line-partition.'+r);};
function add(out,path,start,end){
 need(typeof path==='string'&&Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=1&&end>=start&&end<=1000000,'range');
 const normalized=normalizeGoldPath(path);if(!out.has(normalized))out.set(normalized,new Set());const lines=out.get(normalized);for(let n=start;n<=end;n++)lines.add(n);
}
function predictionLines(spans){need(spans&&typeof spans==='object'&&!Array.isArray(spans),'spans');const out=new Map();
 for(const[path,ranges]of Object.entries(spans)){need(Array.isArray(ranges),'ranges');for(const r of ranges)add(out,path,r.start,r.end);}return out;}
export function partitionLineAcquisition({gold,prediction}){
 const init=gold.init_ctx??[],addCtx=gold.add_ctx??[],ctx=!init.length&&!addCtx.length&&Array.isArray(gold.gold_ctx)?gold.gold_ctx:[...init,...addCtx],g=new Map();
 for(const r of ctx)if(r.file)add(g,r.file,r.start_line,r.end_line);
 const t=prediction.traj_data;need(Array.isArray(t?.pred_steps)&&Array.isArray(t.pred_files),'prediction');const observedPaths=new Set(),acquired=new Map();
 for(const step of t.pred_steps){need(Array.isArray(step.files),'step-files');for(const path of [...step.files,...Object.keys(step.spans)])observedPaths.add(normalizeGoldPath(path));
  for(const[path,lines]of predictionLines(step.spans)){if(!acquired.has(path))acquired.set(path,new Set());for(const n of lines)acquired.get(path).add(n);}}
 const final=predictionLines(t.pred_spans);let finalPred=0;
 for(const[path,lines]of final){finalPred+=lines.size;for(const n of lines)need(acquired.get(path)?.has(n),'final-outside-acquired');}
 const count={gold_units:0,selected_units:0,acquired_but_unselected_units:0,unread_within_observed_path_units:0,never_observed_path_units:0};
 for(const[path,lines]of g)for(const n of lines){count.gold_units++;if(final.get(path)?.has(n))count.selected_units++;else if(acquired.get(path)?.has(n))count.acquired_but_unselected_units++;else if(observedPaths.has(path))count.unread_within_observed_path_units++;else count.never_observed_path_units++;}
 need(count.gold_units>0,'empty-gold');return{...count,final_predicted_units:finalPred,acquired_intersection:count.selected_units+count.acquired_but_unselected_units,
 fractions:Object.fromEntries(['selected_units','acquired_but_unselected_units','unread_within_observed_path_units','never_observed_path_units'].map(k=>[k,count[k]/count.gold_units]))};
}
