import test from 'node:test';
import assert from 'node:assert/strict';
import {layers,build,verifySaved} from './build.mjs';
import {verifyEvolutionRecord} from '../../../../packages/evolution-runtime/index.mjs';
test('saved study binds current evidence and contains only prospective records',()=>{
 assert.equal(verifySaved().ok,true);const b=build();assert.equal(b.records.length,7);
 assert.deepEqual(b.observations,[]);assert.deepEqual(b.learning_decisions,[]);
 for(const r of b.records) assert.equal(verifyEvolutionRecord(r).ok,true);
});
test('tampered hypothesis fails canonical verification',()=>{
 const r=structuredClone(build().records[0]);r.statement='changed';assert.equal(verifyEvolutionRecord(r).ok,false);
});
test('DAG rejects cycles, unresolved references and duplicate identities',()=>{
 const n=[{id:'a'},{id:'b'}];assert.throws(()=>layers(n,[{from:'a',to:'b'},{from:'b',to:'a'}]),/cycle/);
 assert.throws(()=>layers(n,[{from:'a',to:'missing'}]),/unresolved/);
 assert.throws(()=>layers([{id:'a'},{id:'a'}],[]),/duplicate node/);
});
test('every future model design depends on the audit and its hypothesis',()=>{
 const b=build();for(const h of b.definitions.filter(h=>h.kind==='model')) {
  const parents=b.projection.edges.filter(e=>e.to==='design-'+h.id).map(e=>e.from).sort();
  assert.deepEqual(parents,['audit',h.id].sort());
 }
});
