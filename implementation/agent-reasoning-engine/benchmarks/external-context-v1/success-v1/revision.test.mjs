import test from 'node:test';import assert from 'node:assert/strict';
import {phaseFor,stagingFeedback} from './revision-phases.mjs';
import {tools,validateArgs} from './revision-contract.mjs';
const id='a'.repeat(64),names=p=>p.tools.map(t=>t.function.name);
test('failed candidate remains investigable across former forced-staging cutoffs',()=>{
 const s={hypotheses:[{},{}],candidates:[{candidate_id:id,test:{status:'intended_failure'}}]};
 for(const step of [10,18,19,20,21]) {const p=phaseFor(step,s,tools);assert(names(p).includes('read_file'));assert(names(p).includes('stage_patch_candidate'));assert(names(p).includes('report_unable'));assert(!names(p).includes('submit_patch_candidate'));}
 assert(!names(phaseFor(22,s,tools)).includes('stage_patch_candidate'));
 assert.deepEqual(names(phaseFor(23,s,tools)),['report_unable']);
});
test('stage-test-submit sequence binds candidate and permits final green submission',()=>{
 const s={hypotheses:[{},{}],candidates:[{candidate_id:id}]};
 let p=phaseFor(22,s,tools);assert.deepEqual(names(p),['run_public_reproducer']);assert.equal(p.required_candidate_id,id);
 s.candidates[0].test={status:'passed'};p=phaseFor(23,s,tools);assert.deepEqual(names(p),['submit_patch_candidate']);assert.equal(p.required_candidate_id,id);
});
test('hypotheses and two-candidate limit remain enforced',()=>{
 assert(!names(phaseFor(10,{hypotheses:[],candidates:[]},tools)).includes('stage_patch_candidate'));
 assert(!names(phaseFor(15,{hypotheses:[{},{}],candidates:[{test:{status:'intended_failure'}},{test:{status:'intended_failure'}}]},tools)).includes('stage_patch_candidate'));
});
test('explicit inability requires evidence and whole closed schema',()=>{
 assert(validateArgs('report_unable',JSON.stringify({reason:'Cannot locate binding with current evidence',evidence_refs:['source.js:20']})).ok);
 const v=validateArgs('report_unable',JSON.stringify({reason:'',evidence_refs:[],extra:1}));assert(!v.ok);assert(v.issues.length>=3);
});
test('invalid exact edit returns actionable bounded feedback',()=>{
 const r=stagingFeedback(new Error('docker stack: old_text must match exactly once\n'+'x'.repeat(2000)));
 assert.equal(r.error,'old_text must match exactly once');assert.match(r.recovery,/ORIGINAL base/);assert.match(r.recovery,/report_unable/);
});
