import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseAcquisitionCommitment as diagnose} from './workspace-acquisition-commitment-r1.mjs';
const native=(file,span,steps)=>({final:{file:{coverage:file},span:{coverage:span}},
 trajectory:{steps:steps.map(([file,span])=>({coverage:{file,span}}))}});
test('separates never acquired evidence from acquired but unselected evidence',()=>{
 const r=diagnose(native(.5,.25,[[0,0],[.75,.5]]));
 assert.deepEqual(r.file,{acquired_coverage:.75,final_coverage:.5,unacquired_coverage:.25,
  acquired_but_unselected_coverage:.25,retained_fraction_of_acquired:2/3});
 assert.equal(r.span.acquired_but_unselected_coverage,.25);
});
test('no acquisition has an undefined retention ratio, not a fabricated success',()=>{
 const r=diagnose(native(0,0,[]));assert.equal(r.file.retained_fraction_of_acquired,null);
 assert.equal(r.file.unacquired_coverage,1);
});
test('full retention does not imply source relevance or precision',()=>{
 const r=diagnose(native(1,1,[[1,1]]));assert.equal(r.file.retained_fraction_of_acquired,1);
 assert.equal(r.file.acquired_but_unselected_coverage,0);
});
test('rejects changed native views or invalid coverage instead of hiding inconsistency',()=>{
 assert.throws(()=>diagnose(native(.5,.5,[[1,1],[.5,.5]])),/non-cumulative/);
 assert.throws(()=>diagnose(native(1,1,[[.5,.5]])),/outside-observed/);
 assert.throws(()=>diagnose(native(NaN,1,[[1,1]])),/invalid-coverage/);
});
