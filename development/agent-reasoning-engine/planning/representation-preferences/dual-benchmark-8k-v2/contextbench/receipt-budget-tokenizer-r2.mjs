// Actual receipt accounting, no synthetic charge for cache hits.
// Open questions: FRONTIER-RESOURCE-HYPOTHESES-R2.md.
export function createReceiptTokenizerReserve({get_receipts,get_index_receipts,maximum=192,final_reserve=32,maximum_index=512,index_final_reserve=32}){
 const need=(v,m)=>{if(!v)throw Error('receipt-budget.'+m);};
 need(typeof get_receipts==='function'&&typeof get_index_receipts==='function','receipt-getters');
 for(const [cap,reserve] of [[maximum,final_reserve],[maximum_index,index_final_reserve]])need(Number.isSafeInteger(cap)&&Number.isSafeInteger(reserve)&&reserve>0&&reserve<cap,'limits');
 let phase='exploration',active=null,poisoned=false,operations=0,indexOperations=0;
 const read=()=>({request:get_receipts().filter(r=>r.kind==='tokenizer'),index:get_index_receipts().filter(r=>r.kind==='index-tokenizer')});
 let checkpoint=structuredClone(read());
 const ceiling=family=>family==='request'?maximum-(phase==='exploration'?final_reserve:0):maximum_index-(phase==='exploration'?index_final_reserve:0);
 function checked(){
  try{const rows=read();for(const f of ['request','index']){
   need(rows[f].length>=checkpoint[f].length&&JSON.stringify(rows[f].slice(0,checkpoint[f].length))===JSON.stringify(checkpoint[f]),'receipt-prefix-changed');
   need(rows[f].length<=ceiling(f),'receipt-limit-exceeded');
   if(!active)for(const r of rows[f])need((Number.isInteger(r.status)&&r.status>=100&&r.status<=599)||(r.status===null&&typeof r.failure_code==='string'),'unsettled-receipt');
  }return rows;}catch(error){poisoned=true;throw error;}
 }
 function snapshot(){const rows=checked();if(!active)checkpoint=structuredClone(rows);return {phase,poisoned,pending_family:active,actual_tokenizer_receipts:rows.request.length,actual_index_receipts:rows.index.length,measurement_operations:operations,index_operations:indexOperations,remaining:ceiling('request')-rows.request.length-(active==='request'?1:0),index_remaining:ceiling('index')-rows.index.length-(active==='index'?1:0),maximum,final_reserve,maximum_index,index_final_reserve};}
 async function runFamily(family,operation){
  need(!poisoned,'uncertain-operation');need(!active,'concurrent-operation');need(typeof operation==='function','operation');
  const before=checked();need(before[family].length<ceiling(family),'reserved-capacity');checkpoint=structuredClone(before);active=family;
  if(family==='request')operations++;else indexOperations++;
  let failed=false;
  try{return await operation();}catch(error){failed=true;throw error;}
  finally{
   active=null;
   try{
    const after=checked(),other=family==='request'?'index':'request',delta=after[family].length-before[family].length;
    need(delta>=0&&delta<=1,'multiple-attempts');need(after[other].length===before[other].length,'cross-family-attempt');
    // A failed operation without an attempt receipt may have uncertain effects.
    // Do not treat it as a successful cache hit or permit another operation.
    if(failed&&delta===0)poisoned=true;
    checkpoint=structuredClone(after);
   }catch(error){poisoned=true;throw error;}
  }
 }
 checked();
 return {run:operation=>runFamily('request',operation),runIndex:operation=>runFamily('index',operation),snapshot,
  canExplore:(request_headroom=19,index_headroom=5)=>{need(Number.isSafeInteger(request_headroom)&&request_headroom>=1&&Number.isSafeInteger(index_headroom)&&index_headroom>=1,'headroom');const s=snapshot();return !poisoned&&!active&&phase==='exploration'&&s.remaining>=request_headroom&&s.index_remaining>=index_headroom;},
  beginFinal(){need(!active&&!poisoned&&phase==='exploration','phase-transition');checked();phase='final';return snapshot();}};
}
