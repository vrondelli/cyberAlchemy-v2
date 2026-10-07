import test from 'node:test';
import assert from 'node:assert/strict';
import {filterTaskSupportedPrediction} from './filter-prediction.mjs';

const prediction=files=>({instance_id:'task',traj_data:{pred_steps:[{files:[files[0]],spans:{[files[0]]:[{start:1,end:3}]}}],pred_files:files,pred_spans:Object.fromEntries(files.map(path=>[path,[{start:1,end:3}]]))}});

test('keeps task-named and edited paths; leaves delivered trajectory untouched',()=>{
  const files=['src/notifications.js','src/categorySearch.js','src/postTools.js','src/helper.js'];
  const original=prediction(files),patch='diff --git a/src/helper.js b/src/helper.js\n';
  const result=filterTaskSupportedPrediction({prediction:original,problem_statement:'Notifications and category selector dropdown issues',patch});
  assert.equal(result.diagnostic.applied,true);
  assert.deepEqual(result.prediction.traj_data.pred_files,['src/notifications.js','src/categorySearch.js','src/helper.js']);
  assert.deepEqual(result.prediction.traj_data.pred_steps,original.traj_data.pred_steps);
  assert.deepEqual(original.traj_data.pred_files,files);
});

test('fails open when task-name support is too sparse',()=>{
  const files=['src/alpha.js','src/beta.js'];
  const result=filterTaskSupportedPrediction({prediction:prediction(files),problem_statement:'Opaque request',patch:''});
  assert.equal(result.diagnostic.applied,false);
  assert.deepEqual(result.prediction.traj_data.pred_files,files);
});

test('rejects missing patch and final-span binding',()=>{
  assert.throws(()=>filterTaskSupportedPrediction({prediction:prediction(['a.js']),problem_statement:'a',patch:null}),/patch-type/);
  const malformed=prediction(['a.js']);delete malformed.traj_data.pred_spans['a.js'];
  assert.throws(()=>filterTaskSupportedPrediction({prediction:malformed,problem_statement:'a',patch:''}),/empty-or-unbound/);
});
