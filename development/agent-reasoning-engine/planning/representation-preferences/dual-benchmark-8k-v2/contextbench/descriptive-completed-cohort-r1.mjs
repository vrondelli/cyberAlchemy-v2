// Validate all completed outcomes, never cherry-pick survivor quality.
// Open questions: CANDIDATE-DESCRIPTIVE-SCORING.md.
import assert from 'node:assert/strict';
export function verifyCompletedCohort({outcomes,assigned_outcomes,eligible_sequences}){
 assert.ok(Array.isArray(outcomes)&&outcomes.length===assigned_outcomes,'diagnostic.outcome-denominator');
 const actual=outcomes.flatMap((o,i)=>{assert.ok(o&&typeof o.status==='string','diagnostic.outcome-status');return o.status==='final_context_selected'?[i]:[];});
 assert.ok(actual.length>0,'diagnostic.no-completed-outcomes');assert.deepEqual(eligible_sequences,actual,'diagnostic.all-completed-cohort');return true;
}
