// Open Questions: G01-DEFECTS4J-MULTIVIEW-DEV-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {queryViews,fuseViews,additions} from './screen-defects4j-multiview-dev-r1.mjs';
test('views are source-derived, deduplicated, preserve exception with no frames',()=>{
  assert.deepEqual(queryViews('--- test\nFailure\n\nCaller source observations:\n',[]),['--- test\nFailure\n\nCaller source observations:\n','--- test\nFailure\n','Failure']);
});
test('RRF rewards agreement and resolves ties deterministically',()=>{
  assert.deepEqual(fuseViews([['a','b'],['b','a']]),['a','b']);
  assert.deepEqual(fuseViews([['a','b'],['c','b']])[0],'b');
});
test('adds only missing bounded paths; width control can match exactly',()=>{
  assert.deepEqual(additions(['a','b','c','d'],['a','c'],1),['b']);
  assert.deepEqual(additions(['a'],['a']),[]);
});
