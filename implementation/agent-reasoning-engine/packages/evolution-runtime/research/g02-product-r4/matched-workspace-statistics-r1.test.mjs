import test from 'node:test';
import assert from 'node:assert/strict';
import {mean,f1,signFlipPValue} from './matched-workspace-statistics-r1.mjs';
test('native F1 retains zero and asymmetric precision/coverage',()=>{
 assert.equal(f1({coverage:0,precision:0}),0);
 assert.equal(f1({coverage:.5,precision:1}),2/3);
 assert.throws(()=>f1({coverage:NaN,precision:1}));
});
test('means never silently drop invalid or failed cases',()=>{
 assert.equal(mean([0,.5,1]),.5);assert.throws(()=>mean([]));assert.throws(()=>mean([1,NaN]));
});
test('exact paired sign flips include ties and all-zero null',()=>{
 assert.equal(signFlipPValue([1,1]),.25);
 assert.equal(signFlipPValue([1,-1]),.75);
 assert.equal(signFlipPValue([0,0]),1);
 assert.equal(signFlipPValue(Array(12).fill(1)),1/4096);
 assert.throws(()=>signFlipPValue(Array(21).fill(1)));
});
