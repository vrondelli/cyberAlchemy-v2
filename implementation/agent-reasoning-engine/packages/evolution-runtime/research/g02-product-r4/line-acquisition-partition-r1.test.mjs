import test from'node:test';import assert from'node:assert/strict';import{partitionLineAcquisition}from'./line-acquisition-partition-r1.mjs';
const p={traj_data:{pred_steps:[{files:['a'],spans:{a:[{start:1,end:2}]}}],pred_files:['a'],pred_spans:{a:[{start:1,end:1}]}}};
test('disjoint complete partition with overlapping labels deduplicated',()=>{
 const gold={gold_ctx:[{file:'a',start_line:1,end_line:4},{file:'a',start_line:2,end_line:3},{file:'b',start_line:1,end_line:1}]};const r=partitionLineAcquisition({gold,prediction:p});assert.equal(r.gold_units,5);assert.equal(r.selected_units,1);assert.equal(r.acquired_but_unselected_units,1);assert.equal(r.unread_within_observed_path_units,2);assert.equal(r.never_observed_path_units,1);assert.equal(r.final_predicted_units,1);
});
test('file observed without corresponding range is within-path unread, not acquisition',()=>{
 const prediction={traj_data:{...p.traj_data,pred_steps:[...p.traj_data.pred_steps,{files:['b'],spans:{}}]}};const r=partitionLineAcquisition({gold:{gold_ctx:[{file:'b',start_line:1,end_line:3}]},prediction});assert.equal(r.unread_within_observed_path_units,3);assert.equal(r.never_observed_path_units,0);
});
test('final selection cannot manufacture an unobserved source line',()=>{
 assert.throws(()=>partitionLineAcquisition({gold:{gold_ctx:[{file:'a',start_line:1,end_line:4}]},prediction:{traj_data:{...p.traj_data,pred_spans:{a:[{start:1,end:3}]}}}}),/final-outside-acquired/);
});
test('native path normalization and init/add precedence retained',()=>{
 const r=partitionLineAcquisition({gold:{init_ctx:[{file:'/testbed/a',start_line:1,end_line:1}],add_ctx:[{file:'./a',start_line:2,end_line:2}],gold_ctx:[{file:'other',start_line:1,end_line:100}]},prediction:p});assert.equal(r.gold_units,2);assert.equal(r.acquired_intersection,2);
});
