import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildAssessment,verifyAssessment,assessedProgress} from './assess-replication.mjs';
test('counterevidence produces bounded polarity assessment and successor hypothesis',()=>{
  const artifact=buildAssessment();assert.equal(verifyAssessment(artifact),true);
  assert.deepEqual(artifact.failure_clusters.map(x=>[x.cluster_id,x.count]),[['removal-retained',3],['negative-instruction-reified',1]]);
  assert.equal(artifact.recurrence.affected_unique_cases,4);assert.equal(artifact.adjacency_anomaly.same_output_digest,true);
  assert.equal(artifact.adjacency_anomaly.distinct_prompt_digests,true);
});
test('assessment claim drift is rejected',()=>{
  const artifact=structuredClone(buildAssessment());artifact.failure_clusters[0].count=2;assert.throws(()=>verifyAssessment(artifact));
});
test('assessment closes replication branch and leaves latency registration ready',()=>{
  const state=assessedProgress();assert.deepEqual(state,assessedProgress());
  assert.deepEqual(state.frontier.product_construction,['latency.register']);
  assert.equal(state.tasks.find(task=>task.task_id==='replication.assess').state,'completed');
});
