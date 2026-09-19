// Gold-blind ordering only. No source acquisition, provider, or evaluator access.
// Open questions: PLAN.md. Inputs must already pass native delivery/provenance checks.
import assert from 'node:assert/strict';
import {featureWords} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.mjs';
export const LEGACY='legacy-public-overlap-v1';
export const DIVERSITY='marginal-task-source-coverage-v1';
const cmp=(a,b)=>a<b?-1:a>b?1:0;
function union(spans){
 const result=[];
 for(const s of [...spans].sort((a,b)=>a.start_line-b.start_line||a.end_line-b.end_line)){
  assert.ok(Number.isSafeInteger(s.start_line)&&s.start_line>0&&Number.isSafeInteger(s.end_line)&&s.end_line>=s.start_line);
  const previous=result.at(-1);
  if(previous&&s.start_line<=previous.end_line+1)previous.end_line=Math.max(previous.end_line,s.end_line);
  else result.push({...s});
 }
 return result;
}
const size=spans=>spans.reduce((n,s)=>n+s.end_line-s.start_line+1,0);
function overlap(a,b){let total=0;for(const x of a)for(const y of b)total+=Math.max(0,Math.min(x.end_line,y.end_line)-Math.max(x.start_line,y.start_line)+1);return total;}
/** Stable full permutation, so smaller packet caps retain the same ranking prefix. */
export function rankProjectedEvidence({eligible,reads,problem_statement,policy=DIVERSITY}){
 assert.ok([LEGACY,DIVERSITY].includes(policy));assert.ok(Array.isArray(eligible)&&Array.isArray(reads)&&typeof problem_statement==='string');
 const byId=new Map(reads.map(r=>[r.id,r]));assert.equal(byId.size,reads.length);
 assert.equal(new Set(eligible.map(r=>r.read_id)).size,eligible.length);
 if(policy===LEGACY)return {eligible:[...eligible],audit:{policy,selection:'unchanged predecessor order'}};
 const query=featureWords(problem_statement),seenTerms=new Set(),seenPaths=new Set(),seenSource=new Map();
 const pending=eligible.map(row=>{
  const read=byId.get(row.read_id);assert.ok(read&&read.path===row.path&&read.source_sha256===row.source_sha256,'projected-read-binding');
  const words=featureWords(read.path+' '+read.body),terms=[...query].filter(w=>words.has(w)).sort();
  const spans=union(row.base_spans);assert.ok(spans.length);
  return {row,terms,spans,key:JSON.stringify([row.path,row.base_source_sha256])};
 });
 const selected=[],decisions=[];
 while(pending.length){
  const scored=pending.map(item=>{
   const covered=seenSource.get(item.key)??[],width=size(item.spans),novel=width-overlap(item.spans,covered);
   return {...item,score:[Number(item.row.preferred),item.terms.filter(w=>!seenTerms.has(w)).length,Number(novel>0),novel/width,item.terms.length,Number(!seenPaths.has(item.row.path)),width,item.row.recency]};
  }).sort((a,b)=>{for(let i=0;i<a.score.length;i++){const d=b.score[i]-a.score[i];if(d)return d;}return cmp(a.row.path,b.row.path)||cmp(a.row.read_id,b.row.read_id);});
  const chosen=scored[0];selected.push(chosen.row);decisions.push({read_id:chosen.row.read_id,score:chosen.score});
  for(const term of chosen.terms)seenTerms.add(term);seenPaths.add(chosen.row.path);
  seenSource.set(chosen.key,union([...(seenSource.get(chosen.key)??[]),...chosen.spans]));
  pending.splice(pending.findIndex(x=>x.row.read_id===chosen.row.read_id),1);
 }
 return {eligible:selected,audit:{policy,query_terms:query.size,covered_query_terms:seenTerms.size,decisions,claim_ceiling:'Lexical/source diversity only; not semantic relevance, completeness, native quality or token savings.'}};
}
