import test from 'node:test';import assert from 'node:assert/strict';import {verifyCompletedCohort} from './descriptive-completed-cohort-r1.mjs';
const input={outcomes:['run_error','final_context_selected','final_context_selected','final_context_selected'].map(status=>({status})),assigned_outcomes:4,eligible_sequences:[1,2,3]};
test('accepts complete survivor cohort independent of historical indices',()=>assert.equal(verifyCompletedCohort(input),true));
test('rejects stale, omitted, duplicated, reordered or failed-task selections',()=>{for(const eligible_sequences of [[0,2],[1,2],[1,2,2,3],[3,2,1],[0,1,2,3]])assert.throws(()=>verifyCompletedCohort({...input,eligible_sequences}));});
test('missing assignments or outcome status cannot silently narrow denominator',()=>{assert.throws(()=>verifyCompletedCohort({...input,outcomes:input.outcomes.slice(1)}));assert.throws(()=>verifyCompletedCohort({...input,outcomes:[{},...input.outcomes.slice(1)]}));});
