// Conservative operation accounting plus actual transport receipts.
// Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
export function createTokenizerReserve({get_receipts,maximum=192,final_reserve=32}){
 const need=(v,m)=>{if(!v)throw Error('frontier-tokenizer.'+m);};
 need(typeof get_receipts==='function'&&Number.isSafeInteger(maximum)&&Number.isSafeInteger(final_reserve)&&final_reserve>0&&final_reserve<maximum,'configuration');
 let charged=0,phase='exploration',active=false;
 const observed=()=>get_receipts().filter(r=>r.kind==='tokenizer').length;
 const used=()=>Math.max(charged,observed());
 const ceiling=()=>phase==='exploration'?maximum-final_reserve:maximum;
 function snapshot(){return {phase,charged_operations:charged,actual_tokenizer_receipts:observed(),used:used(),remaining:Math.max(0,ceiling()-used()),maximum,final_reserve};}
 async function run(operation){
  need(!active,'concurrent-operation');need(typeof operation==='function','operation');need(used()<ceiling(),'reserved-capacity');
  charged=used()+1;active=true;const before=observed();
  try{return await operation();}finally{active=false;need(observed()-before<=1,'operation-multiple-tokenizer-calls');need(observed()<=ceiling(),'transport-budget-exceeded');}
 }
 return {run,snapshot,canExplore:(headroom=1)=>phase==='exploration'&&snapshot().remaining>=headroom,beginFinal(){need(!active&&phase==='exploration','phase-transition');phase='final';return snapshot();}};
}
