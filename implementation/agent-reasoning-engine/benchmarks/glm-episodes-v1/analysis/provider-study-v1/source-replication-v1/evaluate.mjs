// Prospective replication rules; Open questions: EVALUATION.md.
export {attributeSource} from '../source-instruction-v1/evaluate.mjs';
import {assess as assessPilot} from '../source-instruction-v1/evaluate.mjs';
export function assess(rows){
 const base=assessPilot(rows),b=base.baseline,t=base.treatment,complete=rows.length===16&&b.completed===8&&t.completed===8;
 const missing=!complete||rows.some(r=>!r.attributable||typeof r.raw_source_semantics!=='boolean'||r.failed_receipts>0);
 const recovery=rows.every(r=>r.gate?.passed===true&&r.gate.archive_recovery_confirmed===true&&r.recycles>0);
 const floor=t.qualified>=7;
 const support=t.unchanged_source<b.unchanged_source&&t.raw_semantic_passes>=b.raw_semantic_passes&&t.qualified>b.qualified&&floor;
 const kind=missing?'inconclusive':!base.safety_passed||!recovery?'counterevidence':b.unchanged_source===0?'inconclusive':support?'supporting':'counterevidence';
 return {...base,complete,kind,recovery_passed:recovery,treatment_quality_floor_met:floor,reason:missing?'incomplete-or-unattributable-evidence':!base.safety_passed||!recovery?'safety-or-recovery-violation':b.unchanged_source===0?'no-baseline-mechanism-exposure':support?'replicated-noop-and-qualified-improvement':'replication-screen-not-met'};
}
