import {readFileSync} from 'node:fs';
const readGold=()=>JSON.parse(readFileSync(new URL('./gold.json',import.meta.url),'utf8'));
export function scoreOutput(task_id,output){
 const g=readGold()[task_id];if(!g)throw Error('unknown task');const metadata={category:g.category,application_opportunity:['apply','change'].includes(g.category),suppression_opportunity:['suppress','override','scope','decline','revoke'].includes(g.category)};let obj;try{obj=JSON.parse(output.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{return {...metadata,misapplication:null,valid:false,format_correct:false,content_correct:false,pass:false,reason:'invalid-json'};}
 let valid=false,dependency_ok=true;const reasons=[];let content='';
 if(obj?.format==='plain'){valid=typeof obj.text==='string'&&obj.text.trim().length>0;content=typeof obj.text==='string'?obj.text:'';}
 if(obj?.format==='table'){valid=Array.isArray(obj.columns)&&obj.columns.length>0&&obj.columns.every(x=>typeof x==='string')&&Array.isArray(obj.rows)&&obj.rows.length>0&&obj.rows.every(r=>Array.isArray(r)&&r.length===obj.columns.length&&r.every(x=>typeof x==='string'));content=valid?obj.rows.flat().join(' '):'';if(g.row_pairs)dependency_ok=valid&&g.row_pairs.every(pair=>obj.rows.some(row=>pair.every(word=>row.join(' ').toLowerCase().includes(word))));}
 if(obj?.format==='checklist'){valid=Array.isArray(obj.items)&&obj.items.length>0&&obj.items.every(x=>typeof x==='string');content=valid?obj.items.join(' '):'';}
 if(obj?.format==='dag'){
  const ns=obj.nodes,es=obj.edges;valid=Array.isArray(ns)&&ns.length>1&&ns.every(n=>n!==null&&typeof n==='object'&&typeof n.id==='string'&&n.id&&typeof n.label==='string'&&n.label.trim())&&new Set(ns.map(n=>n.id)).size===ns.length&&Array.isArray(es)&&es.length>0;
  if(valid){const ids=new Set(ns.map(n=>n.id));valid=es.every(e=>Array.isArray(e)&&e.length===2&&ids.has(e[0])&&ids.has(e[1])&&e[0]!==e[1]);}
  const reach=(a,b,seen=new Set())=>{if(a===b)return true;if(seen.has(a))return false;seen.add(a);return es.filter(e=>e[0]===a).some(e=>reach(e[1],b,seen));};
  if(valid)valid=es.every(e=>!reach(e[1],e[0]));
  if(valid){content=ns.map(n=>n.label).join(' ');const candidates=g.concepts.map(variants=>ns.filter(n=>variants.some(v=>n.label.toLowerCase().includes(v))));dependency_ok=(g.dependencies??[]).every(([a,b])=>candidates[a].some(x=>candidates[b].some(y=>x.id!==y.id&&reach(x.id,y.id))));}else dependency_ok=false;
 }
 if(g.sentence_count && obj?.format==='plain'){const sentences=content.match(/[^.!?]+[.!?]+(?:\s|$)/g)??[];dependency_ok=dependency_ok&&sentences.length===g.sentence_count&&sentences.join('').trim()===content.trim();}
 if(g.ordered_concepts && obj?.format==='plain'){const lower=content.toLowerCase();const positions=g.concepts.map(vs=>Math.min(...vs.map(v=>lower.indexOf(v)).filter(i=>i>=0)));dependency_ok=dependency_ok&&positions.every((v,i)=>Number.isFinite(v)&&(i===0||v>positions[i-1]));}
 const content_correct=g.concepts.every(variants=>variants.some(v=>content.toLowerCase().includes(v)))&&dependency_ok;
 const format_correct=obj?.format===g.format;
 if(!valid)reasons.push('invalid-structure');if(!format_correct)reasons.push('wrong-representation');if(!content_correct)reasons.push('missing-content-or-dependency');
 return {semantic_review_required:true,valid,format_correct,content_correct,pass:valid&&format_correct&&content_correct,category:g.category,application_opportunity:['apply','change'].includes(g.category),suppression_opportunity:['suppress','override','scope','decline','revoke'].includes(g.category),misapplication:['suppress','override','scope','decline','revoke'].includes(g.category)?obj?.format==='dag':null,reason_codes:reasons};
}
