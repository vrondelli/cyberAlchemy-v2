import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildCandidateOnlySchedule,verifyCandidateOnlySchedule} from './candidate-only-schedule.mjs';
const config_path=fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url)),cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url));
const sources={config_path,cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex')};
test('ready ARE candidate can run all four tasks without waiting for radical or controls',()=>{
 const s=buildCandidateOnlySchedule(sources);assert.equal(s.slots.length,4);assert.ok(s.slots.every(x=>x.arm==='current-are'&&x.role==='candidate'));
 assert.equal(s.maximum_total_model_tokens,384000);assert.equal(s.maximum_model_calls,384);assert.equal(s.workers,2);
 assert.equal(s.matched_control_savings_evaluable,false);assert.equal(s.accepted_control_savings,null);assert.equal(s.dispatch_admitted,false);
 assert.equal(verifyCandidateOnlySchedule({schedule:s,...sources}),true);
});
test('independent architecture can be scheduled separately or alongside ARE without controls',()=>{
 for(const candidates of [['independent-investigations'],['current-are','independent-investigations']]){
 const s=buildCandidateOnlySchedule({...sources,candidates});assert.equal(s.slots.length,candidates.length*4);
 assert.equal(s.maximum_total_model_tokens,candidates.length*384000);assert.ok(s.slots.every(x=>candidates.includes(x.arm)));
 assert.equal(verifyCandidateOnlySchedule({schedule:s,...sources}),true);}
});
test('controls, unknown unimplemented treatments and altered envelopes are rejected',()=>{
 for(const candidates of [[],['minimal-history'],['retrieval-first'],['current-are','current-are']])assert.throws(()=>buildCandidateOnlySchedule({...sources,candidates}));
 for(const alter of [s=>s.slots.pop(),s=>s.slots[0].cell.limits.total_tokens++,s=>s.matched_control_savings_evaluable=true,s=>s.workers=4,s=>s.slots[0].arm='minimal-history']){
 const s=buildCandidateOnlySchedule(sources);alter(s);assert.throws(()=>verifyCandidateOnlySchedule({schedule:s,...sources}));}
});
