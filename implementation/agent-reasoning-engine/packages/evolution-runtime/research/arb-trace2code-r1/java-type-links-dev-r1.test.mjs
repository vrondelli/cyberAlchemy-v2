import test from 'node:test';
import assert from 'node:assert/strict';
import {maskNonCode,buildTypeLinks,navigateTypes} from './java-type-links-dev-r1.mjs';
// Open Questions: G01-DEFECTS4J-SYMBOL-NAV-DEV-R1.md.
const docs=[{path:'p/A.java',text:'package p; import q.B; class A { B b; C c; String x="Ghost"; /* Ghost */ }'},
  {path:'q/B.java',text:'package q; import p.C; class B { C value; }'},
  {path:'p/C.java',text:'package p; class C {}'},
  {path:'other/C.java',text:'package other; class C {}'},
  {path:'p/Ghost.java',text:'package p; class Ghost {}'}];
test('comments and literal names do not create edges',()=>{
  assert.equal(maskNonCode('"Ghost" // Ghost\n/*Ghost*/').includes('Ghost'),false);
  assert.equal(buildTypeLinks(docs).edges.get('p/A.java').has('p/Ghost.java'),false);
});
test('same-package and explicit imports resolve without global-name fallback',()=>{
  const g=buildTypeLinks(docs);assert.deepEqual([...g.edges.get('p/A.java')].sort(),['p/C.java','q/B.java']);
  assert.equal(g.edges.get('p/A.java').has('other/C.java'),false);
});
test('wildcards and static imports retain source-owner edges',()=>{
  const g=buildTypeLinks([...docs,{path:'z/X.java',text:'package z; import p.*; import static q.B.VALUE; class X { C c; int x=VALUE; }'}]);
  assert.ok(g.edges.get('z/X.java').has('p/C.java'));assert.ok(g.edges.get('z/X.java').has('q/B.java'));
});
test('two-hop navigation retains source-backed witnesses',()=>{
  const g=buildTypeLinks(docs),n=navigateTypes(g,['p/A.java']);
  assert.ok(n.scores.get('p/C.java')>0);assert.ok(n.witnesses.get('p/C.java').trail.length<=2);
  assert.equal(n.scores.has('p/Ghost.java'),false);
});
