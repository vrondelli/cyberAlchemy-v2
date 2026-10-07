import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceSignals,navigationRanking} from './source-entity-operator-nav-r1.mjs';
const docs=[
  {path:'pkg/Greater.java',text:'package pkg; class Greater extends Relational { public String getSymbol() { return ">"; } }',source_sha256:'a'},
  {path:'pkg/Relational.java',text:'package pkg; class Relational {}',source_sha256:'b'},
  {path:'pkg/Fake.java',text:'package pkg; class Fake { /* String getSymbol(){return "=";} */ String s="pkg.Greater"; }',source_sha256:'c'}];
test('only source-declared literal operator and exact qualified type become seeds',()=>{
  const s=sourceSignals(docs,'Evaluating <$x > $y> expected:<false> pkg.Greater.run()');
  assert.deepEqual(s.operator.map(x=>x.path),['pkg/Greater.java']);assert.deepEqual(s.qualified.map(x=>x.path),['pkg/Greater.java']);
  assert.equal(s.operator[0].source_sha256,'a');
});
test('quoted operators and comment getters do not create aliases',()=>{
  const s=sourceSignals(docs,'Evaluating <$x = ">"> expected:<false>');
  assert.deepEqual(s.operators,['=']);assert.equal(s.operator.length,0);
});
test('nested names use declared outer owner; ambiguous FQN is rejected',()=>{
  assert.equal(sourceSignals(docs,'pkg.Greater$Nested.run()').qualified[0].path,'pkg/Greater.java');
  assert.equal(sourceSignals([...docs,{...docs[0],path:'other/Greater.java'}],'pkg.Greater.run()').qualified.length,0);
});
test('source-linked parent is reachable and witnessed without labels',()=>{
  const r=navigationRanking(docs,'Evaluating <$x > $y> expected:<false>',[],[],()=>true,[], 'operator');
  assert.ok(r.ranked.includes('pkg/Relational.java'));assert.equal(r.witnesses.get('pkg/Relational.java').trail[0].symbol,'pkg.Relational');
});
