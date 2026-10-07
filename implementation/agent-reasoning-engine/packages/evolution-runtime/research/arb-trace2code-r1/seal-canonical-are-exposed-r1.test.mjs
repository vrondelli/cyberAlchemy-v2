import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {callerContext,stackRank} from './seal-canonical-are-exposed-r1.mjs';
test('caller observations reject out-of-range or capped-away trace anchors',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-canonical-callers-'));mkdirSync(join(root,'pkg'));
  writeFileSync(join(root,'pkg','Short.java'),'class Short {}\n');
  writeFileSync(join(root,'pkg','Long.java'),Array.from({length:30},(_,i)=>'//'+i+'x'.repeat(150)).join('\n'));
  const p={sources:[{path:'pkg/Short.java',sha256:'a'},{path:'pkg/Long.java',sha256:'b'}]};
  const c=callerContext('at pkg.Short.method(Short.java:9)\nat pkg.Long.method(Long.java:25)\n',p,root);
  assert.equal(c.observations.length,0);assert.deepEqual(c.skipped.map(x=>x.reason),['trace-line-out-of-range','trace-line-outside-capped-window']);
});
test('distinct caller observation keeps actual trace line and bounded window',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-canonical-callers-'));mkdirSync(join(root,'pkg'));
  writeFileSync(join(root,'pkg','One.java'),'class One {\nvoid method() {}\n}\n');
  const c=callerContext('at pkg.One.method(One.java:2)\nat pkg.One.method(One.java:2)\n',{sources:[{path:'pkg/One.java',sha256:'a'}]},root);
  assert.equal(c.observations.length,1);assert.match(c.observations[0].utf8,/void method/);assert.equal(c.observations[0].trace_line,2);
});
test('stack ranking preserves historic main/src/generated preference and test exclusions',()=>{
  const frames=[{matches:['examples/pkg/File.java','src/pkg/File.java','src/main/pkg/File.java','src/test/pkg/File.java','src/pkg/TestThing.java'].map(path=>({path}))}];
  assert.deepEqual(stackRank(frames),['src/main/pkg/File.java','src/pkg/File.java','examples/pkg/File.java']);
});
