import assert from 'node:assert/strict';
import {test} from 'node:test';
import {retainedFrames,sourceWindow} from './screen-defects4j-caller-context-r1.mjs';
test('frame parsing uses class package and enclosing class for nested methods',()=>{
  assert.deepEqual(retainedFrames('at p.Example$Inner.run(Example.java:31)\n'),[{suffix:'p/Example.java',line:31}]);
  assert.deepEqual(retainedFrames('at p.X.run(Native Method)\n'),[]);
});
test('caller source observations have deterministic line and character bounds',()=>{
  assert.deepEqual(sourceWindow(['a','b','c'],1),{start_line:1,utf8:'a\nb\nc'});
  const lines=Array.from({length:100},(_,i)=>'line'+(i+1));
  const result=sourceWindow(lines,50);
  assert.equal(result.start_line,30);assert.equal(result.utf8.split('\n').length,41);
  assert.equal(sourceWindow(['x'.repeat(2000)],1).utf8.length,1200);
});
