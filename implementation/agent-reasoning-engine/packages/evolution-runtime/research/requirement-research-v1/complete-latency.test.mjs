import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildLatencyRunEvidence,completedLatencyProgress,verifyLatencyRunEvidence} from './complete-latency.mjs';

test('controlled latency result reduces to exact measured counterevidence',()=>{
  const evidence=buildLatencyRunEvidence();
  assert.equal(verifyLatencyRunEvidence(evidence),true);
  assert.deepEqual(evidence.gates,{cache_balance:true,quality:false,relative_latency:false,runtime_integrity:true});
  assert.equal(evidence.summary.compact.passed,40);
  assert.equal(evidence.summary.full.passed,38);
  assert.equal(evidence.disposition,'revise-hypothesis');
});

test('changed latency claims are rejected',()=>{
  const evidence=structuredClone(buildLatencyRunEvidence());
  evidence.gates.relative_latency=true;
  assert.throws(()=>verifyLatencyRunEvidence(evidence));
});

test('completed controlled run unlocks latency assessment',()=>{
  const state=completedLatencyProgress();
  assert.deepEqual(state,completedLatencyProgress());
  assert.deepEqual(state.frontier.product_construction,['latency.assess']);
  assert.equal(state.tasks.find(task=>task.task_id==='latency.run').state,'completed');
});
