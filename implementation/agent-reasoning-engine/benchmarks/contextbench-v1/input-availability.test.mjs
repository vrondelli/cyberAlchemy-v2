import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyInputAvailability,unavailableBranchRows,unavailablePreflightRow} from './input-availability.mjs';

test('legacy and explicit ready tasks remain available',()=>{
  assert.deepEqual(classifyInputAvailability({instance_id:'a'}),{available:true,reason:null});
  assert.deepEqual(classifyInputAvailability({instance_id:'a',input_status:'ready'}),{available:true,reason:null});
});

test('the exact pinned null-prompt classification becomes zero-call accounting',()=>{
  const task={instance_id:'x',input_status:'input-unavailable',input_reason:'pinned-dataset-public-problem-statement-null'};
  assert.deepEqual(classifyInputAvailability(task),{available:false,reason:task.input_reason});
  assert.deepEqual(unavailablePreflightRow({instance_id:'x'},task.input_reason),{instance_id:'x',status:'input_unavailable',error:task.input_reason,model_calls:0,tokenizer_receipts:[],admissions:[],output_path:null});
  assert.deepEqual(unavailableBranchRows({cell_id:'p'},[{cell_id:'b',instance_id:'x'}],task.input_reason),[{cell_id:'b',prefix_cell_id:'p',instance_id:'x',status:'not_started_input_unavailable',prefix_status:'input_unavailable',reason:task.input_reason}]);
});

test('unknown classifications fail closed',()=>{
  assert.throws(()=>classifyInputAvailability({instance_id:'x',input_status:'skip'}),/input-availability.invalid:x/);
});
