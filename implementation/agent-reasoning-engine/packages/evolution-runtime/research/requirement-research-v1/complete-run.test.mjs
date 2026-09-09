import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRunEvidence,verifyRunEvidence,completedRunProgress} from './complete-run.mjs';
test('registered result reduces to exact measured counterevidence',()=>{
  const evidence=buildRunEvidence();assert.equal(verifyRunEvidence(evidence),true);
  assert.deepEqual(evidence.summary.treatment,{classification_correct:68,passed:68,requirements_preserved:68,runtime_integrity:72,total:72});
  assert.deepEqual(evidence.discordances,{both_correct:50,baseline_only:3,treatment_only:18,neither:1});
  assert.equal(evidence.disposition,'revise-hypothesis');
});
test('changed result claims are rejected',()=>{
  const evidence=structuredClone(buildRunEvidence());evidence.gates.requirement_preservation=true;assert.throws(()=>verifyRunEvidence(evidence));
});
test('completed run unlocks assessment while preserving latency registration',()=>{
  const state=completedRunProgress();assert.deepEqual(state,completedRunProgress());
  assert.deepEqual(state.frontier.product_construction,['latency.register','replication.assess']);
  assert.equal(state.tasks.find(t=>t.task_id==='replication.run').state,'completed');
});
