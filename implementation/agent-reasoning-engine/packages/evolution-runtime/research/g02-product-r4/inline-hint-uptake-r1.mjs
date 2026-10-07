// Successful-request presentation and later read association, not semantic use.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-R2-RESULT.json.
import {createHash} from 'node:crypto';
import {bindDelivery,observationMaterial,stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const need=(v,r)=>{if(!v)throw Error('inline-uptake.'+r);};
export function associateLaterReads(hint,reads) {
 const candidates=hint.candidates.map(c=>{
  const a=c.read_file_args,end=a.start_line+a.line_count-1;
  const later=reads.filter(r=>r.first_confirmed_receipt>hint.first_confirmed_receipt&&
   r.path===a.path&&r.source_sha256===hint.source_sha256);
  return {definition_id:c.id,kind:c.kind,suggested_start_line:a.start_line,suggested_end_line:end,
   exact_suggested_range_read_ids:later.filter(r=>r.start_line===a.start_line&&r.end_line===end).map(r=>r.id),
   contains_full_definition_read_ids:later.filter(r=>r.start_line<=c.definition_start_line&&r.end_line>=c.definition_end_line).map(r=>r.id),
   overlaps_definition_read_ids:later.filter(r=>r.start_line<=c.definition_end_line&&r.end_line>=c.definition_start_line).map(r=>r.id)};
 });
 return {...hint,candidates};
}
export function auditInlinePresentation(result) {
 const b=bindDelivery({captures:result.captures,receipts:result.receipts});
 need(b.unmapped.length===0&&b.token_accounting.cost_complete,'complete-binding');
 const hints=new Map();
 for(const r of b.requests.filter(r=>r.posture==='confirmed-successful-request')){
  // Identical capture bytes are one rendering, even if measured more than once.
  const p=JSON.parse(result.captures[r.capture_indices[0]].prompt);
  for(const m of p.messages.filter(m=>m.role==='tool')){
   let t;try{t=JSON.parse(m.content);}catch{continue;}
   const o=t?.ok===true?t.output:null,n=o?.typed_navigation;
   if(!n?.candidates?.length)continue;
   const read=b.read_observations.find(x=>x.tool_call_id===m.tool_call_id&&x.id===o.read_id);
   need(read&&read.confirmed_receipts.includes(r.receipt_index),'hint-read-binding');
   need(sha(stable(observationMaterial(m.tool_call_id,o)))===read.id,'material-identity');
   need(n.discovery_only===true&&n.source_sha256===o.source_sha256&&n.observation_body_sha256===sha(o.utf8),'metadata-identity');
   for(const c of n.candidates){const a=c.read_file_args;
    need(['class','function'].includes(c.kind)&&a.path===o.path&&a.revision==='base'&&
     Number.isSafeInteger(a.start_line)&&Number.isSafeInteger(a.line_count)&&a.line_count>0&&
     a.start_line===c.definition_start_line&&c.definition_end_line>=c.definition_start_line,'candidate-scope');
   }
   if(hints.has(read.id)){need(hints.get(read.id).metadata_sha256===sha(stable(n)),'metadata-drift');continue;}
   hints.set(read.id,{read_id:read.id,path:read.path,source_sha256:read.source_sha256,
    first_confirmed_receipt:r.receipt_index,metadata_sha256:sha(stable(n)),candidates:n.candidates});
  }
 }
 return {confirmed_hint_reads:hints.size,confirmed_source_reads:b.read_observations.length,
  hints:[...hints.values()].map(h=>associateLaterReads(h,b.read_observations)),
  claim_ceiling:'Successful-request metadata delivery and temporal same-source read association only; not semantic uptake, causality or quality.'};
}
