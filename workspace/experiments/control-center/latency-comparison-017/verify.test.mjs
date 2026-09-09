import test from 'node:test';
import assert from 'node:assert/strict';
import {sha,verifyEntries} from './verify.mjs';
test('exact bytes pass; drift, absent and malformed inputs fail closed',()=>{
  const rows=[{path:'source',sha256:sha('exact')}];
  assert.doesNotThrow(()=>verifyEntries(rows,()=>Buffer.from('exact')));
  assert.throws(()=>verifyEntries(rows,()=>Buffer.from('changed')),/input-drift/);
  assert.throws(()=>verifyEntries([],()=>''),/missing-inputs/);
  assert.throws(()=>verifyEntries([...rows,...rows],()=>Buffer.from('exact')),/invalid-input-path/);
  assert.throws(()=>verifyEntries([{...rows[0],path:'../outside'}],()=>''),/invalid-input-path/);
});
