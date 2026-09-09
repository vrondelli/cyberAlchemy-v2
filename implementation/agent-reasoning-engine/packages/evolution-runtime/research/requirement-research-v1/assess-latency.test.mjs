import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessedLatencyProgress,buildLatencyAssessment,verifyLatencyAssessment} from './assess-latency.mjs';

test('latency counterevidence produces a bounded fast-path successor',()=>{
  const assessment=buildLatencyAssessment();
  assert.equal(verifyLatencyAssessment(assessment),true);
  assert.equal(assessment.registered_learning.disposition,'revise-hypothesis');
  assert.equal(assessment.revised_hypothesis.implementation_pattern,'deterministic-explicit-operation-fast-path-with-context-bound-model-fallback');
  assert.equal(assessment.revised_hypothesis.experiment_template.success_criteria.fast_path_precision,1);
  assert.equal(assessment.revised_hypothesis.experiment_template.success_criteria.ambiguous_fast_path_rate,0);
});

test('latency assessment claim drift is rejected',()=>{
  const assessment=structuredClone(buildLatencyAssessment());
  assessment.measured_decomposition.paired.compact_turn_wins=40;
  assert.throws(()=>verifyLatencyAssessment(assessment));
});

test('latency assessment closes the original research plan',()=>{
  const state=assessedLatencyProgress();
  assert.deepEqual(state,assessedLatencyProgress());
  assert.deepEqual(state.frontier,{operational_support:[],product_construction:[]});
  assert.equal(state.tasks.every(task=>task.state==='completed'),true);
});
