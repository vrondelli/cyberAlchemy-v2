// Prospective H23 quality screen. Open questions: README.md.
export function assess(rows){
 const group=(condition,arm)=>rows.filter(r=>r.condition===condition&&r.arm===arm),passes=g=>g.filter(r=>r.qualified).length;
 const complete=rows.length===18&&new Set(rows.map(r=>r.id)).size===18&&['split','pressure','strong-pressure'].every(c=>['baseline','payload'].every(a=>group(c,a).length===3));
 const controls=['baseline','payload'].every(a=>passes(group('split',a))===3&&group('split',a).every(r=>r.exposure.recycles===0));
 const candidate=group('pressure','payload'),baseline=group('pressure','baseline'),strong=group('strong-pressure','payload');
 const observedBenefit=candidate.length===3&&candidate.every(r=>r.qualified&&r.exposure.recycles===0&&r.exposure.facts.every(f=>f.at_final))&&passes(candidate)>passes(baseline);
 const measuredBaseline=baseline.length===3&&baseline.every(r=>r.exposure.rejected_with_both_originals&&r.exposure.recycles>0);
 const measuredStrong=strong.length===3&&strong.every(r=>r.exposure.recycles>0);
 const known=rows.every(r=>r.safety&&r.receipts.every(x=>x.status===200)),kind=!complete||!known||!controls||!measuredBaseline||!measuredStrong?'inconclusive':observedBenefit?'supporting':'counterevidence';
 return {complete,kind,controls,measured_baseline_pressure:measuredBaseline,measured_strong_pressure:measuredStrong,near_pressure_benefit:observedBenefit,baseline_pressure_correct:passes(baseline),candidate_pressure_correct:passes(candidate),candidate_strong_pressure_correct:passes(strong),unknown_semantic_rows:rows.filter(r=>r.raw_semantics===null).length,groups:['split','pressure','strong-pressure'].flatMap(condition=>['baseline','payload'].map(arm=>({condition,arm,correct:passes(group(condition,arm)),rows:group(condition,arm).length})))};
}
