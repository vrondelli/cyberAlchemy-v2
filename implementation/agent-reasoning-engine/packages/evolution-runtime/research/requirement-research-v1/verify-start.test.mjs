import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateArtifact,produceProgress} from './verify-start.mjs';
const read = name => JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
test('research completion is deterministic and unlocks only the next tasks',()=>{
  const state = produceProgress();
  assert.deepEqual(state,produceProgress());
  assert.deepEqual(state.frontier.product_construction,['latency.hypothesize','replication.register']);
  assert.equal(state.tasks.filter(t=>t.state==='completed').length,2);
});
test('incorrect report numbers are rejected',()=>{
  const a=read('input-composition-001.json'); a.statistics.full.input_tokens.mean++;
  assert.throws(()=>validateArtifact(a));
});
test('changed selected source binding is rejected',()=>{
  const a=read('input-composition-001.json'); a.sources[0].sha256='0'.repeat(64);
  assert.throws(()=>validateArtifact(a));
});
test('wrong replication labels and duplicate cases are rejected',()=>{
  const a=read('replication-design-001.json'); a.cases[0].expected='continue';
  assert.throws(()=>validateArtifact(a));
  const b=read('replication-design-001.json'); b.cases[1]=b.cases[0];
  assert.throws(()=>validateArtifact(b));
});
