// Open Questions: G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {frameReferences,inspectFrame} from './audit-defects4j-trace-source-r1.mjs';
test('nested class references retain outer source and method independently',()=>{
  assert.deepEqual(frameReferences('at p.A$Inner.call(A.java:4)')[0],{suffix:'p/A.java',method:'call',trace_line:4});
});
test('out-of-range trace is not clamped and missing method remains absent',()=>{
  const r=inspectFrame('class A {\n}\n',{trace_line:3,method:'absent'});
  assert.equal(r.source_lines,2);assert.equal(r.line_in_range,false);assert.equal(r.method_token_present,false);
});
test('comment/string method mentions do not count and constructors are unknown',()=>{
  assert.equal(inspectFrame('class A { String x="fake()"; /* fake() */ }',{trace_line:1,method:'fake'}).method_token_present,false);
  assert.equal(inspectFrame('class A {}',{trace_line:1,method:'<init>'}).method_token_present,null);
});
