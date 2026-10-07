import test from 'node:test';
import assert from 'node:assert/strict';
import {validate} from './run-receipt-review-r2.mjs';

const packet={current_selected_files:['a.py'],delivered_reads:[{index:0},{index:1}]};
test('accepts exact bounded edits',()=>{
  assert.deepEqual(validate({add_read_indexes:[1],drop_files:['a.py']},packet),
    {add_read_indexes:[1],drop_files:['a.py']});
});
test('rejects invented evidence and extra fields',()=>{
  assert.throws(()=>validate({add_read_indexes:[2],drop_files:[]},packet));
  assert.throws(()=>validate({add_read_indexes:[],drop_files:['x.py']},packet));
  assert.throws(()=>validate({add_read_indexes:[],drop_files:[],score:1},packet));
});
