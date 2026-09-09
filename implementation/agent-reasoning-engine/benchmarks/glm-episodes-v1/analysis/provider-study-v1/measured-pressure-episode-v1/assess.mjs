// Predeclared diagnostic screen. Open questions: README.md.
export function assess(rows){
 const ids=new Set();for(const r of rows){const id=r.block+':'+r.arm;if(ids.has(id))throw Error('duplicate arm');ids.add(id);}
 const subset=(arm,condition)=>rows.filter(r=>r.arm===arm&&r.condition===condition),correct=(arm,c)=>subset(arm,c).filter(r=>r.qualified).length;
 const pressure=subset('admission','pressure'),sourceLoss=r=>r.exposure.recycles>0&&r.exposure.rejected_with_both_originals&&r.exposure.facts.every(f=>f.ever_original&&f.before_first_recycle&&!f.at_first_recycle);
 const complete=rows.length===18&&new Set(rows.map(r=>r.block)).size===9&&['baseline','admission'].every(a=>['co-located','split','pressure'].every(c=>subset(a,c).length===3));
 const controls=correct('baseline','co-located')===3&&correct('admission','co-located')===3&&correct('admission','split')===3&&rows.filter(r=>r.condition!=='pressure').every(r=>r.exposure.recycles===0);
 const known=rows.every(r=>r.safety&&r.exposure.facts.every(f=>f.ever_original)),pressureQualified=pressure.length===3&&pressure.every(sourceLoss);
 return {complete,controls_passed:controls,known_delivery:known,pressure_qualified:pressureQualified,kind:!complete||!controls||!known||!pressureQualified?'inconclusive':correct('admission','pressure')===0?'supporting':'counterevidence',baseline_controls:correct('baseline','co-located'),candidate_controls:correct('admission','co-located'),candidate_unpressured:correct('admission','split'),candidate_pressure_correct:correct('admission','pressure'),pressure_source_losses:pressure.filter(sourceLoss).length,unknown_semantic_rows:rows.filter(r=>r.raw_semantics===null).length};
}
