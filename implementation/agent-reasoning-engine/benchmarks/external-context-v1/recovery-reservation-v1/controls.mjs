import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {phaseFor} from './phases.mjs';
import {phaseFor as baseline} from '../feedback-timing-v1/phases.mjs';
import {tools} from '../holdout-v1/contract.mjs';
const empty={candidates:[],hypotheses:[],probe_requests:0};
const hypotheses={...empty,hypotheses:[{},{}]};
const candidate={...hypotheses,candidates:[{candidate_id:'a'}]};
const green={...hypotheses,candidates:[{candidate_id:'a',test:{status:'passed'}}]};
const names=x=>x.tools.map(t=>t.function.name);
let comparisons=0;
for(let step=0;step<24;step++)for(const state of [empty,hypotheses,candidate,green]){
 assert.deepEqual(phaseFor(step,state,tools,'baseline'),baseline(step,state,tools));comparisons++;
 if(state.candidates.length||step<10||step>=22)assert.deepEqual(phaseFor(step,state,tools,'reserved'),baseline(step,state,tools));
}
assert(names(phaseFor(9,empty,tools,'reserved')).includes('read_file'));
assert.deepEqual(names(phaseFor(10,empty,tools,'reserved')).sort(),['record_hypotheses','report_unable']);
assert(names(phaseFor(13,hypotheses,tools,'reserved')).includes('read_file'));
assert.deepEqual(names(phaseFor(14,hypotheses,tools,'reserved')).sort(),['report_unable','stage_patch_candidate']);
assert(names(phaseFor(15,candidate,tools,'reserved')).includes('read_file'));
assert(names(phaseFor(15,candidate,tools,'reserved')).includes('run_public_reproducer'));
assert(names(phaseFor(15,candidate,tools,'reserved')).includes('stage_patch_candidate'));
assert.deepEqual(names(phaseFor(23,green,tools,'reserved')),['submit_patch_candidate']);
assert.deepEqual(names(phaseFor(23,empty,tools,'reserved')),['report_unable']);
assert.throws(()=>phaseFor(0,empty,tools,'bad'));
writeFileSync(new URL('controls.json',import.meta.url),JSON.stringify({status:'passed',baseline_state_step_comparisons:comparisons,checks:['unchanged baseline','boundary calls 10/11 and 14/15','candidate recovery restores original tools','green final submission','inability exit','unknown policy rejection'],authority_effect:'none',open_questions_ref:'PLAN.md'},null,2)+'\n',{flag:'wx'});
console.log('Phase controls passed');
