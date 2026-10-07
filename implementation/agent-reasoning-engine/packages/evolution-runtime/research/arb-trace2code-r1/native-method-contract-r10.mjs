// Equal-arm public wording only; no change to eligibility, schema or budgets.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import assert from 'node:assert/strict';
export const CONTRACT_BEFORE="When terminal_eligible is true, call submit_source_handles";
export const CONTRACT_AFTER="terminal_eligible only permits selection; it does not mean the failure is explained. If uncertainty remains, use remaining actions to inspect a relevant alternative. Select when evidence is sufficient or forced finalization requires it. When selecting, call submit_source_handles";
export function clarifySelectionContract(source){
 assert.equal(typeof source,'string');assert.equal(source.split(CONTRACT_BEFORE).length,2,'contract-r10.exact-seam');
 const next=source.replace(CONTRACT_BEFORE,CONTRACT_AFTER);
 assert.equal(next.replace(CONTRACT_AFTER,CONTRACT_BEFORE),source,'contract-r10.only-wording');
 return next;
}
