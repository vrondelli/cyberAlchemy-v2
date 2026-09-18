import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecisionState,decisionPhase} from './decision-state-v1.mjs';
import {minimumPairCountReachable} from './decision-state-validation.mjs';

const task={problem_statement:'repair the parser'};
const common={task,captures:[],receipts:[],repoRoot:process.cwd(),patch:'diff --git a/src/a.c b/src/a.c\n',max_evidence:8,max_bytes:4096,max_tokens:1024,measure_tokens:async text=>Math.ceil(text.length/4)};

test('maps every admitted boundary kind to one phase',()=>{
  assert.equal(decisionPhase('effect-confirmed'),'effect');
  assert.equal(decisionPhase('terminal-candidate'),'terminal');
  for(const kind of ['output-pressure','response-pressure','context-pressure'])assert.equal(decisionPhase(kind),'pressure');
  assert.throws(()=>decisionPhase('mystery'),/unknown-boundary-kind/);
});

test('builds bounded effect state with unresolved verification',async()=>{
  const state=await buildDecisionState({...common,boundary:{kind:'effect-confirmed',confirmed_effect:{affected_paths:['src/a.c','src/a.c']}}});
  assert.equal(state.schema_version,'are.contextbench-decision-state/v1');
  assert.equal(state.phase,'effect');
  assert.deepEqual(state.observation.affected_paths,['src/a.c']);
  assert.equal(state.observation.verification,'unresolved');
  assert.ok(state.bytes<=4096&&state.measured_tokens<=1024);
  assert.equal(state.model_calls,0);
});

test('builds terminal and typed pressure states without claiming success',async()=>{
  const terminal=await buildDecisionState({...common,boundary:{kind:'terminal-candidate',terminal_kind:'tool'}});
  assert.equal(terminal.phase,'terminal');
  assert.equal(terminal.observation.selection_acceptance,'unresolved');
  const pressure=await buildDecisionState({...common,boundary:{kind:'response-pressure',failure_code:'message-invalid',failed_input_tokens:10,failed_output_tokens:2}});
  assert.equal(pressure.phase,'pressure');
  assert.equal(pressure.observation.failure_code,'message-invalid');
  assert.equal(pressure.authority_effect,'none');
});

test('stops exactly when the minimum pair count becomes unreachable',()=>{
  assert.equal(minimumPairCountReachable({eligible_pairs:0,processed_prefixes:2,scheduled_prefixes:8,minimum_pairs:6}),true);
  assert.equal(minimumPairCountReachable({eligible_pairs:0,processed_prefixes:3,scheduled_prefixes:8,minimum_pairs:6}),false);
  assert.equal(minimumPairCountReachable({eligible_pairs:4,processed_prefixes:7,scheduled_prefixes:8,minimum_pairs:6}),false);
  assert.throws(()=>minimumPairCountReachable({eligible_pairs:0,processed_prefixes:9,scheduled_prefixes:8,minimum_pairs:6}),/invalid-feasibility/);
});
