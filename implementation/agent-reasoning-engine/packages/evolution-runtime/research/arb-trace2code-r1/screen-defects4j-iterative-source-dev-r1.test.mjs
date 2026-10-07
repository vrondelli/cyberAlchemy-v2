// Open Questions: G01-DEFECTS4J-ITERATIVE-SOURCE-DEV-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {retrievalSnippet,queryViews,fuseViews} from './screen-defects4j-iterative-source-dev-r1.mjs';
test('retrieval window selects distinct-term overlap and earliest tie',()=>{
  const lines=Array.from({length:60},(_,i)=>i===32?'specificTerm querySignal':'boilerplate');
  const s=retrievalSnippet(lines.join('\n'),'specificTerm querySignal');
  assert.equal(s.start_line,21);assert.ok(s.utf8.includes('specificTerm'));
});
test('retrieved evidence uses fixed character cap',()=>{
  const s=retrievalSnippet('x'.repeat(2000),'x');assert.equal(s.utf8.length,1200);
});
test('view decomposition and equal-rank fusion remain unchanged',()=>{
  assert.deepEqual(fuseViews([['a','b'],['b','a']]),['a','b']);
  assert.equal(queryViews('--- test\nError\n\nCaller source observations:\n',[]).length,3);
});
