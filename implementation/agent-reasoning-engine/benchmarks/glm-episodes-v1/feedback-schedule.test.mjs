import test from 'node:test';import assert from 'node:assert/strict';
import {selectFeedbackSchedule,feedbackOutcome,selectCorrectionInput} from './feedback-schedule.mjs';
const run=()=>({status:'COMPLETED',planned:4,completed:4,trials:Array.from({length:4},(_,index)=>({id:'trial-'+index,index,gate:index!==0,repair:false}))});
test('fresh schedule retains unsubmitted trials and caps four corrections',()=>{const r=selectFeedbackSchedule(run(),true);assert.equal(r.schedule.length,4);assert.equal(r.schedule[0].gate,false);assert.equal(r.maximum_model_attempts,4);});
test('incomplete run and duplicate identities reject',()=>{const r=run();r.status='STOPPED';assert.throws(()=>selectFeedbackSchedule(r,true));r.status='COMPLETED';r.trials[1].id=r.trials[0].id;assert.throws(()=>selectFeedbackSchedule(r,true));});
test('historical mode still requires six submissions',()=>assert.throws(()=>selectFeedbackSchedule(run())));
test('blocked stages and missing submissions cannot be counted as final passes',()=>{const r=feedbackOutcome([{id:'a',result:{status:'BLOCK'}},{id:'b',result:{status:'NO_SUBMISSION'}},{id:'c',result:{status:'REPAIRED'}}],[{id:'a',result:{ok:true}},{id:'c',result:{ok:true}}]);assert.deepEqual(r,{final_verified:1,corrected_verified:1,unsubmitted:1});});

const matrix=()=>({status:'COMPLETED',planned:12,completed:12,trials:['archive-slice-bounds','exact-json-scoring','retention-tool-pairs','retention-long-window'].flatMap(episode=>[8000,10000,12000].map(soft_limit=>({episode,soft_limit}))).map((r,index)=>({...r,index,id:'trial-'+index,gate:index!==0,repair:false}))});
test('matrix preserves twelve trials including failures and caps twelve corrections',()=>{const r=selectFeedbackSchedule(matrix(),12);assert.equal(r.schedule.length,12);assert.equal(r.maximum_model_attempts,12);assert.equal(r.schedule[0].gate,false);});
test('matrix rejects duplicated conditions and incomplete dimensions',()=>{const m=matrix();m.trials[1].soft_limit=8000;assert.throws(()=>selectFeedbackSchedule(m,12),/matrix-condition/);});
test('unknown fresh size cannot expand call budgets',()=>assert.throws(()=>selectFeedbackSchedule(matrix(),16),/mode-invalid/));

test('format-blocked proposals remain unsubmitted while recovered or semantic-blocked proposals do not',()=>{
 const rows=[{id:'missing',result:{status:'BLOCK',format:{status:'BLOCK'}}},{id:'recovered',result:{status:'REPAIRED',format:{status:'FORMAT_REPAIRED'}}},{id:'semantic',result:{status:'BLOCK',format:null}}];
 assert.deepEqual(feedbackOutcome(rows,[{id:'recovered',result:{ok:true}}]),{final_verified:1,corrected_verified:1,unsubmitted:1});
});

test('passed delivery with invalid submission selects rejected text, not a candidate file',()=>{
 const trace={status:'BLOCK',completion_gate:{passed:true},reason_codes:['glm.candidate-invalid'],candidate_validation:{ok:false},final_response_evidence:{text:'{}',truncated:false}};
 assert.deepEqual(selectCorrectionInput(trace,undefined),{rejected_text:'{}'});
 assert.throws(()=>selectCorrectionInput(trace,{}),/candidate-state/);
 for(const t of [{...trace,completion_gate:{passed:false}},{...trace,completion_gate:null},{...trace,final_response_evidence:{text:'{}',truncated:true}},{...trace,reason_codes:['glm.transport-failed']}])assert.deepEqual(selectCorrectionInput(t,undefined),{rejected_text:''});
});
test('accepted candidate requires consistent submission and delivery state',()=>{
 const trace={status:'AWAITING_APPROVAL',completion_gate:{passed:true}},candidate={value:'proposal'};
 assert.deepEqual(selectCorrectionInput(trace,candidate),{candidate});
 assert.throws(()=>selectCorrectionInput(trace,undefined),/candidate-missing/);
 assert.throws(()=>selectCorrectionInput({...trace,completion_gate:null},candidate),/candidate-state/);
});
