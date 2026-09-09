import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildFastPathArtifacts,completedFastPathProgress,verifyFastPathArtifact} from './complete-fast-path.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
test('fast-path construction evidence is exact and tamper evident',()=>{
  const artifacts=buildFastPathArtifacts();
  for(const [key,name] of Object.entries({freeze:'fast-path-freeze-evidence-002.json',build:'fast-path-build-evidence-002.json',benchmark:'fast-path-benchmark-evidence-002.json',assessment:'fast-path-learning-evidence-002.json'})){
    assert.deepEqual(artifacts[key],read(name));assert.equal(verifyFastPathArtifact(artifacts[key]),true);
  }
  assert.throws(()=>verifyFastPathArtifact({...artifacts.benchmark,disposition:'accepted'}));
});
test('local support routes to independent replication rather than activation',()=>{
  const assessment=buildFastPathArtifacts().assessment;
  assert.equal(assessment.decision.disposition,'collect-replications');
  assert.match(assessment.next_step,/independently authored adversarial holdout/);
});
test('successor work plan replays to a complete empty frontier',()=>{
  const state=completedFastPathProgress();assert.deepEqual(state,completedFastPathProgress());
  assert.deepEqual(state.frontier,{operational_support:[],product_construction:[]});assert.equal(state.tasks.every(task=>task.state==='completed'),true);
});
