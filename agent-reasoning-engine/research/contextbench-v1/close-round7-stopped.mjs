// Close frozen round seven after the state token-cap stopping condition. No provider calls.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHypothesisObservation, createLearningDecision, createResearchHypothesis, verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha, verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {build, verifyPredecessor, verifyEvidence} from './bind-round7.mjs';

const root = 'agent-reasoning-engine/research/contextbench-v1/';
const out = '/home/vrondelli/.cache/are/contextbench-round7-live';
const read = name => JSON.parse(readFileSync(root + name));
const fileSha = path => sha(readFileSync(path));
const write = (name, value) => {
  const bytes = JSON.stringify(value, null, 2) + '\n';
  const target = root + name;
  if (existsSync(target)) {
    if (readFileSync(target, 'utf8') !== bytes) throw Error('round7.artifact-drift:' + name);
  } else writeFileSync(target, bytes, {flag: 'wx'});
};

export function close() {
  verifyFreeze(root + 'freeze-round7.json');
  const matrix = read('development-matrix-v7.json');
  const attempted = [], unstarted = [];
  for (const cell of matrix.cells) {
    const resultPath = resolve(out, cell.cell_id, 'result.json');
    if (!existsSync(resultPath)) { unstarted.push(cell.cell_id); continue; }
    const result = JSON.parse(readFileSync(resultPath));
    const models = result.receipts.filter(receipt => receipt.kind === 'model' && receipt.dispatched);
    const stateReceipts = result.index_tokenizer_receipts ?? [];
    attempted.push({
      cell_id: cell.cell_id,
      state_arm: cell.state_arm,
      status: result.status,
      error: result.error,
      result_sha256: fileSha(resultPath),
      model_calls: models.length,
      known_model_tokens: models.reduce((sum, receipt) => sum + (receipt.input_tokens ?? 0) + (receipt.output_tokens ?? 0), 0),
      unknown_usage_calls: models.filter(receipt => !Number.isSafeInteger(receipt.input_tokens) || !Number.isSafeInteger(receipt.output_tokens)).length,
      state_tokenizer_calls: stateReceipts.length,
      state_tokenizer_failures: stateReceipts.filter(receipt => receipt.failure_code).length,
      maximum_measured_state_tokens: Math.max(0, ...stateReceipts.map(receipt => receipt.tokens ?? 0)),
      task_state_presentations: result.task_state_presentations?.length ?? 0,
      presentation_generations: [...new Set((result.task_state_presentations ?? []).map(presentation => presentation.generation))].sort(),
    });
  }
  if (attempted.length !== 2 || unstarted.length !== 14 || attempted[0].status !== 'no_context_selected' || attempted[1].error !== 'task-state.token-cap-exceeded' || attempted[1].task_state_presentations !== 4 || attempted[1].maximum_measured_state_tokens !== 1224) throw Error('round7.stopping-evidence-invalid');
  const review = {
    schema_version: 'are.contextbench-round7-stopping-review/v1',
    status: 'closed-under-instrument-stopping-rule',
    scheduled_cells: 16,
    attempted_cells: 2,
    unstarted_cells: unstarted,
    attempted,
    model_calls: attempted.reduce((sum, row) => sum + row.model_calls, 0),
    known_model_tokens: attempted.reduce((sum, row) => sum + row.known_model_tokens, 0),
    unknown_usage_calls: attempted.reduce((sum, row) => sum + row.unknown_usage_calls, 0),
    state_tokenizer_calls: attempted.reduce((sum, row) => sum + row.state_tokenizer_calls, 0),
    task_state_presentations: attempted.reduce((sum, row) => sum + row.task_state_presentations, 0),
    speculative_state_measurements: 0,
    diagnosis: 'Exact-generation rendering succeeded and four treatment model requests received state. The rolling projection then measured 1,224 tokens against its frozen 1,024-token cap and correctly blocked before the next model dispatch. Byte-bounded construction did not guarantee tokenizer-bounded construction.',
    interpretation: 'H13 fixed speculative measurement and established real exposure, but failed its completion non-degradation criterion. No native paired score exists. The next mechanism must fit observed facts to the exact tokenizer cap instead of treating a recoverable projection-size condition as a terminal episode error.',
    retention_rule: 'Retain both attempts and fourteen unstarted identities. Do not resume or relabel round seven. Fit projection contents under the measured cap and freeze a separately versioned successor.',
    benchmark_cleared: false,
    authority_effect: 'none',
    open_questions_ref: 'PLAN-round7.md#open-questions',
  };
  write('round7-stopping-review.json', review);

  const hypotheses = read('hypotheses-round7.json');
  const selected = hypotheses.records.find(record => record.record_id === hypotheses.selection.selected);
  const experiment = read('experiment-round7.json');
  const observation = createHypothesisObservation({
    hypothesis_ref: selected.record_id,
    source_result_ref: resolve(root + 'round7-stopping-review.json'),
    source_result_digest: fileSha(root + 'round7-stopping-review.json'),
    observation_kind: 'counterevidence',
    phase: 'experiment',
    claim: 'Exact-generation state reached four treatment requests with zero speculative measurements, then exceeded its fixed state-token cap and degraded valid completion relative to the matched control.',
    evaluator_id: 'contextbench.round7.stopping-review',
    evidence_refs: ['round7-stopping-review.json', resolve(out, 'r7-01-control-8k/result.json'), resolve(out, 'r7-01-state-8k/result.json')],
    observed_markers: ['2 attempted', '14 unstarted', '4 task-state presentations', '0 speculative measurements', '1224 measured state tokens', '1024 state-token cap', 'treatment completion failure'],
    limitations: ['No native scored pair exists.', 'One task cannot estimate average quality.', 'The result tests H13 completion and bounding behavior, not semantic utility after a completed treatment episode.'],
  });
  const decision = createLearningDecision({
    hypothesis_ref: selected.record_id,
    observation_refs: [observation.record_id],
    experiment_ref: experiment.record_id,
    disposition: 'revise-hypothesis',
    reason_codes: ['learning.counterevidence-observed', 'instrument.state-token-fit-missing', 'experiment.valid-completion-degraded'],
    supporting_count: 0,
    counterevidence_count: 1,
    experiment_support_count: 0,
    next_action: 'Retain exact-generation rendering and fit the newest receipt-bound state facts deterministically under the measured tokenizer cap before each post-recycle model request.',
  });
  for (const record of [observation, decision]) if (!verifyEvolutionRecord(record, record.schema_version).ok) throw Error('round7.record-invalid');
  write('round7-selected-hypothesis-review.json', {records: [selected, experiment, observation, decision], benchmark_cleared: false, authority_effect: 'none', open_questions_ref: 'PLAN-round7.md#open-questions'});

  const common = {
    scope: 'GLM-5.3-flash exposed 8K ContextBench development tasks; tokenizer-fitted exact-generation post-recycle state with structured terminal submission common.',
    metrics: selected.metrics,
    provenance_refs: [decision.record_id, 'round7-stopping-review.json', 'round7-selected-hypothesis-review.json', 'round8-continuity.json'],
  };
  const h14 = createResearchHypothesis({...common,
    hypothesis_key: 'CB117-H14',
    statement: 'A tokenizer-fitted exact-generation state projection preserves useful recent process facts without causing state-cap episode failure and improves useful completion.',
    mechanism: 'Build only at the selected generation, measure the projection with the provider tokenizer, and deterministically evict oldest outcome or evidence facts until the exact projection is at or below the frozen token cap. Preserve objective identity, newest facts, provenance, and all model-token accounting.',
    falsifier: 'Any selected state projection exceeds the cap, any state-cap condition terminates an otherwise runnable episode, provenance breaks, treatment completion degrades, or the fixed paired native outcome target is not met.',
    parent_hypothesis_ref: selected.record_id,
    experiment_template: {...selected.experiment_template,
      research_question: 'Does tokenizer-fitted exact-generation state improve native evidence selection after recycling without projection-size failures?',
      stop_conditions: ['Any presented projection exceeds the frozen state-token cap.', 'Any eviction removes objective identity or breaks fact provenance.', 'Shared provider or instrument failure pauses unstarted cells.'],
    },
  });
  const delta = createResearchHypothesis({...common,
    hypothesis_key: 'CB117-H15-R8',
    statement: 'A per-generation delta of newly observed facts is more useful and token-efficient than a rolling recent-fact projection.',
    mechanism: 'Present only facts first observed since the preceding recycle boundary while retaining recoverable evidence handles outside the prompt.',
    falsifier: 'Delta state omits facts needed for completion or fails to reduce model tokens without native-quality loss.',
    experiment_template: {research_question: 'Does generation-delta state outperform rolling fitted state?', baseline_ref: 'candidate:rolling-fitted-state', treatment_ref: 'candidate:generation-delta-state', dataset_refs: ['round-seven exposed trace'], required_repetitions: 1, success_criteria: {native_improvement: true, model_token_non_increase: true}, stop_conditions: ['Required prior fact becomes unavailable.']},
  });
  const h0 = createResearchHypothesis({...common,
    hypothesis_key: 'CB117-H0-R8',
    statement: 'Even bounded exact-generation state does not improve native outcomes because semantic task reasoning is the limiting factor.',
    mechanism: 'The model already has sufficient observable recovery; remaining errors arise from interpretation and selection rather than state representation.',
    falsifier: 'A fitted-state-only treatment improves frozen paired native outcomes under identical caps and tools.',
    experiment_template: {research_question: 'Does fitted exact-generation state produce no native improvement?', baseline_ref: 'round8:control', treatment_ref: 'round8:fitted-state', dataset_refs: ['exposed eight-task cohort'], required_repetitions: 1, success_criteria: {null_prediction: 'no positive gain'}, stop_conditions: ['Arm integrity mismatch.']},
  });
  for (const record of [h14, delta, h0]) if (!verifyEvolutionRecord(record, record.schema_version).ok) throw Error('round8.hypothesis-invalid');
  write('hypotheses-round8.json', {records: [h14, delta, h0], selection: {selected: h14.record_id, alternatives: [delta.record_id, h0.record_id], reason: 'Round seven proved exact exposure but found a deterministic token-fit defect. H14 repairs that observed boundary while H15 and the semantic null remain explicit alternatives.'}, authority_effect: 'none', open_questions_ref: 'PLAN-round8.md#open-questions'});

  const built = build();
  const frozen = read('work-state-frozen-v7.json');
  const events = [...frozen.events,
    {event_id: 'r7-run-start', task_id: 'contextbench.round7.run', action: 'start'},
    {event_id: 'r7-run-block', task_id: 'contextbench.round7.run', action: 'block', reason: 'State projection exceeded its frozen tokenizer cap after four valid presentations; 2 attempts retained, 14 unstarted.'},
  ];
  const state = replayResearchWork({plan: built.plan, registrations: built.registrations, events, verify_evidence: verifyEvidence, verify_registration: verifyPredecessor});
  write('work-state-stopped-v7.json', state);
  write('round7-closeout.json', {
    status: 'closed-under-instrument-stopping-rule', scheduled_cells: 16, attempted_cells: 2, unstarted_cells: unstarted,
    model_calls: review.model_calls, known_model_tokens: review.known_model_tokens, unknown_usage_calls: review.unknown_usage_calls,
    native_scored_cells: 0, complete_pairs: 0, task_state_presentations: review.task_state_presentations, speculative_state_measurements: 0,
    result_refs: ['round7-stopping-review.json', 'round7-selected-hypothesis-review.json'], successor_hypotheses_ref: 'hypotheses-round8.json', selected_successor_ref: h14.record_id,
    remaining_goal: 'Clear fixed ContextBench acceptance and finish GLM small-window useful-state qualification under total model-token cost.', benchmark_cleared: false, authority_effect: 'none', open_questions_ref: 'PLAN-round7.md#open-questions',
  });
  return {attempted: 2, unstarted: 14, model_calls: review.model_calls, known_model_tokens: review.known_model_tokens, presentations: review.task_state_presentations, next: h14.record_id, benchmark_cleared: false};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(close()));
