// Materialize H14 implementation review, fixed matrix and D03 record. No provider calls.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment, verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root = 'agent-reasoning-engine/research/contextbench-v1/';
const fileSha = path => sha(readFileSync(path));
const write = (name, value) => {
  const bytes = JSON.stringify(value, null, 2) + '\n', target = root + name;
  if (existsSync(target)) { if (readFileSync(target, 'utf8') !== bytes) throw Error('round8.artifact-drift:' + name); }
  else writeFileSync(target, bytes, {flag: 'wx'});
};

export function prepare() {
  const bindings = [
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/task-state.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/task-state.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.test.mjs',
  ].map(path => ({path, sha256: fileSha(path)}));
  write('token-fitted-state-review-v1.json', {
    schema_version: 'are.contextbench-instrument-review/v1',
    hypothesis_ref: JSON.parse(readFileSync(root + 'hypotheses-round8.json')).selection.selected,
    predecessor_failure_ref: 'round7-stopping-review.json',
    mechanism: 'At the recycler-selected generation, measure exact state text and deterministically evict oldest outcome or evidence facts in bounded halvings until it fits. Preserve objective identity, newest facts, provenance, and a visible truncation count.',
    bindings,
    verified: ['No generation-zero or speculative projection is constructed.', 'A fitted projection measures at most four variants for the configured maximum of twenty facts.', 'Every returned projection is at or below its exact token cap.', 'Newest facts remain after eviction and evicted counts are visible.', 'An irreducible cap fails before model dispatch with a distinct token-cap-too-small code.'],
    tests: {focused: {passed: 16, failed: 0}, contextbench: {passed: 129, failed: 0, log_ref: '/tmp/are-r8-contextbench-tests.log'}, coding_agent_runtime: {passed: 133, failed: 0, log_ref: '/tmp/are-r8-coding-runtime-tests.log'}},
    provider_model_calls: 0,
    claim_ceiling: 'Offline bounded-fitting implementation validity only; exact provider-tokenizer trace replay remains before freeze.',
    authority_effect: 'none',
    open_questions_ref: 'PLAN-round8.md#open-questions',
  });
  const prior = JSON.parse(readFileSync(root + 'development-matrix-v7.json'));
  const hypotheses = JSON.parse(readFileSync(root + 'hypotheses-round8.json'));
  const selected = hypotheses.records.find(record => record.record_id === hypotheses.selection.selected);
  const cells = prior.cells.map(cell => ({...cell, cell_id: cell.cell_id.replace(/^r7-/, 'r8-')}));
  const matrix = {...prior,
    round: 'contextbench-development-round8', cells,
    selection: 'Same eight exposed language-stratified tasks as rounds four, six and seven. Round-seven attempts and unstarted identities remain historical; no reserved confirmation identity is used.',
    predecessor_closeout_ref: 'round7-closeout.json', protocol_ref: 'PLAN-round8.md', continuity_ref: 'round8-continuity.json',
    treatment: 'Only limits.task_state_projection differs within each pair. Treatment state uses exact-generation bounded tokenizer fitting. All tools, source, context, caps, terminal policy, provider and scorer are matched.',
    stopping_rules: ['No within-round changes, replacements, source refresh, threshold changes or lucky reruns.', 'Pause unstarted cells on shared provider or instrument failure and retain every attempted outcome.', 'Any presented state above 1,024 tokens, more than four fitting measurements for one render, unused-generation measurement, unmatched presentation, or state-cap episode failure is an instrument failure.', 'No acceptance or successor selection changes from observed outcomes.'],
    success_criteria: {...prior.success_criteria, maximum_presented_state_tokens: 1024, maximum_state_measurements_per_render: 4, state_cap_episode_failures: 0},
    claim_ceiling: 'Eight exposed GLM-5.3-flash 8K fitted-state development pairs; no full cohort, larger window, confirmation, repair correctness, transfer or clearance claim.',
    open_questions_ref: 'PLAN-round8.md#open-questions',
  };
  write('development-matrix-v8.json', matrix);
  const experiment = createResearchExperiment({
    hypothesis_ref: selected.record_id,
    research_question: selected.experiment_template.research_question,
    baseline_ref: 'development-matrix-v8.json:control', treatment_ref: 'development-matrix-v8.json:state', metrics: selected.metrics,
    dataset_refs: ['development-matrix-v8.json@' + fileSha(root + 'development-matrix-v8.json')], required_repetitions: 1,
    success_criteria: {...matrix.success_criteria, scope: matrix.claim_ceiling, protocol_ref: 'PLAN-round8.md'}, stop_conditions: matrix.stopping_rules, observation_refs: [],
  });
  if (!verifyEvolutionRecord(experiment, experiment.schema_version).ok) throw Error('round8.invalid-experiment');
  write('experiment-round8.json', experiment);
  return {tasks: matrix.tasks.length, cells: matrix.cells.length, experiment: experiment.record_id, component_review: fileSha(root + 'token-fitted-state-review-v1.json')};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(prepare()));
