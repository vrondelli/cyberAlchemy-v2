import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPairs,resolveComparisonSpec} from './analyze-round.mjs';

test('uses the state treatment dimension when evidence arm is common',()=>{
 const matrix={tasks:[{instance_id:'task-1'}],cells:[
  {instance_id:'task-1',arm:'baseline',state_arm:'control'},
  {instance_id:'task-1',arm:'baseline',state_arm:'state'},
 ]};
 const comparison=resolveComparisonSpec(matrix);
 assert.deepEqual(comparison,{field:'state_arm',baseline:'control',treatment:'state'});
 const pairs=buildPairs(matrix,[
  {instance_id:'task-1',comparison_arm:'control',span_f1:0.25},
  {instance_id:'task-1',comparison_arm:'state',span_f1:0.75},
 ],comparison);
 assert.equal(pairs[0].difference,0.5);
 assert.equal(pairs[0].baseline,0.25);
 assert.equal(pairs[0].treatment,0.75);
});

test('retains baseline versus index compatibility',()=>{
 const matrix={tasks:[{instance_id:'task-1'}],cells:[
  {instance_id:'task-1',arm:'baseline'},
  {instance_id:'task-1',arm:'index'},
 ]};
 assert.deepEqual(resolveComparisonSpec(matrix),{field:'arm',baseline:'baseline',treatment:'index'});
});

test('fails closed when no declared comparison dimension has two arms',()=>{
 assert.throws(()=>resolveComparisonSpec({cells:[{arm:'baseline'},{arm:'baseline'}]}),/analysis\.comparison-dimension/);
});
