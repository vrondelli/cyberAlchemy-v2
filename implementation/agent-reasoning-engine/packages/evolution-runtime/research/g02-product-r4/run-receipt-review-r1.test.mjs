import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReview} from './run-receipt-review-r1.mjs';

const packet = {current_selected_files:['src/a.py'], delivered_reads:[
  {index:0,path:'src/a.py'}, {index:1,path:'src/b.py'}, {index:2,path:'src/c.py'}]};

test('accepts bounded exact-handle review', () => {
  assert.deepEqual(validateReview({add_read_indexes:[1,2],drop_files:['src/a.py']},packet),
    {add_read_indexes:[1,2],drop_files:['src/a.py']});
});

test('rejects invented indexes, duplicate adds, and unknown paths', () => {
  assert.throws(() => validateReview({add_read_indexes:[3],drop_files:[]},packet));
  assert.throws(() => validateReview({add_read_indexes:[1,1],drop_files:[]},packet));
  assert.throws(() => validateReview({add_read_indexes:[],drop_files:['src/x.py']},packet));
});

test('rejects extra response fields and oversized edits', () => {
  assert.throws(() => validateReview({add_read_indexes:[],drop_files:[],explanation:'x'},packet));
  assert.throws(() => validateReview({add_read_indexes:[0,1,2,3,4,5],drop_files:[]},packet));
});
