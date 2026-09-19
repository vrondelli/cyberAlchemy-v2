// Prospective research registration only; no provider dispatch.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createResearchHypothesis, createResearchExperiment, verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {digest} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {buildSchemaAgreementSchedule} from './schema-agreement-schedule-r1.mjs';
import {buildProspectiveDag} from './schema-agreement-prospective-dag-r1.mjs';
const c = import.meta.dirname, root = resolve(c, '../../../../../..');
const read = file => JSON.parse(readFileSync(file));
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const objectHash = object => createHash('sha256').update(stable(object)).digest('hex');
const protocol = 'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md';
const parentPath = join(c, 'schema-agreement-production-live-r1/RESEARCH-RESULT-R2.json');
const parent = read(parentPath), prior = read(join(c, 'SCHEMA-AGREEMENT-RESEARCH-R1.json'));
const reviews = ['schema-agreement-production-live-r1/RESEARCH-RESULT-REVIEW-R2.json',
  'RECENT-EVIDENCE-LEDGER-IMPLEMENTATION-REVIEW-R1.json'].map(p => join(c, p));
for (const file of reviews) {
  const review = read(file); assert.equal(review.approved, true);
  for (const binding of review.source_bindings) assert.equal(hash(resolve(root, binding.path)), binding.sha256);
}
const oldSchedule = read(join(c, 'SCHEMA-AGREEMENT-SCHEDULE-R1.json'));
const {schedule_sha256, ...previous} = buildSchemaAgreementSchedule({config_path: oldSchedule.config_path,
  cohort_path: oldSchedule.cohort_path, cohort_sha256: oldSchedule.cohort_sha256});
assert.deepEqual({...previous, schedule_sha256}, oldSchedule);
const slots = previous.slots.map(slot => {
  const cell = {...slot.cell, cell_id: slot.task_id + '-recent-evidence-ledger-r1',
    comparison_arm: 'recent-evidence-ledger', context_projection: 'recent-evidence-ledger-r1'};
  return {...slot, slot_id: slot.task_id + '--recent-evidence-ledger', arm: 'recent-evidence-ledger',
    cell, cell_sha256: objectHash(cell)};
});
const scheduleBody = {...previous, schema: 'are.recent-evidence-ledger-schedule/v1', slots,
  candidates: ['recent-evidence-ledger'], dispatch_admitted: false, open_questions_ref: protocol};
const schedule = {...scheduleBody, schedule_sha256: objectHash(scheduleBody)};
const scorePath = join(c, 'schema-agreement-production-live-r1/score/RESULTS.json'), score = read(scorePath);
const auditPath = join(c, 'LEDGER-VISIBILITY-AUDIT-R1.json'), audit = read(auditPath);
const total = field => audit.rows.reduce((n, row) => n + row[field], 0);
assert.equal(total('fully_repeated_direct_read_calls'), 43);
assert.equal(total('successful_direct_read_calls'), 72);
assert.equal(total('latest_returned_path_absent_from_ledger_requests'), 66);
assert.equal(total('ledger_requests_after_successful_direct_read'), 73);
const refs = [parentPath, ...reviews, scorePath, auditPath, join(c, protocol),
  join(c, 'SELECTION-LOSS-ANALYSIS-R2.json'), join(c, 'RECENT-EVIDENCE-LEDGER-REPLAY-R1.json'),
  join(c, 'audit-ledger-visibility-r1.py'), join(c, 'recent-evidence-episode-r1.mjs'),
  join(c, 'schema-agreement-schedule-r1.mjs'), join(c, 'schema-agreement-prospective-dag-r1.mjs'),
  join(c, 'register-recent-evidence-ledger-r1.mjs')];
const sourceBindings = refs.map(path => ({path, sha256: hash(path)}));
const measurement = {schema: 'are.recent-evidence-ledger-measurements/v1',
  baseline: {mean_native_span_f1: score.acquisition.mean_native_span_f1,
    mean_coverage_per_10000_tokens: score.acquisition.mean_coverage_per_10000_tokens,
    total_model_tokens: score.totals['schema-agreement'].known_tokens,
    repeated_direct_reads: 43, successful_direct_reads: 72, direct_read_repetition_rate: 43 / 72,
    ledger_omissions: 66, eligible_ledger_requests: 73, ledger_omission_rate: 66 / 73},
  metric_definitions: {
    'direct-read-repetition-rate': 'Pooled fully repeated successful direct read_file calls / all successful direct read_file calls, per source hash and revision. Returned evidence only; not proof of unnecessary effort or model delivery.',
    'latest-returned-path-ledger-omission-rate': 'Pooled exploration requests whose latest successfully returned direct-read path is absent from actual captured ledger / exploration requests after a successful direct read. Path-level, not version-specific.',
    'useful-coverage-per-10000-model-tokens': 'Equal-task mean of 10000 * exported confirmed-source union span recall / total model input+output tokens. Not raw retrieval coverage or matched causal savings.',
    'native-span-f1': 'Equal-task mean native span-F1; retain every fixed task and failed outcome.',
  },
  eligibility: {all_four_fixed_tasks: true, all_valid: true, complete_native_and_cost_evidence: true,
    post_score_integrity_verified: true, unknown_usage_receipts: 0,
    all_requests_below_7999: true, positive_mechanism_denominators_on_each_task: true,
    all_mechanism_calls_and_requests_classified: true},
  support: {mean_span_f1_at_least: score.acquisition.mean_native_span_f1,
    mean_Q_greater_than: score.acquisition.mean_coverage_per_10000_tokens,
    direct_read_repetition_rate_less_than: 43 / 72, ledger_omission_rate_less_than: 66 / 73,
    tolerance: 1e-12},
  decision: 'Ineligible is inconclusive. Eligible failure of any support threshold is counterevidence. All support thresholds passing is descriptive support only. Strict improvement must exceed tolerance; at-least permits tolerance. Perfect native quality, original 15% token reduction and untouched confirmation remain separate unachieved goals.',
  source_bindings: sourceBindings, open_questions_ref: protocol};
const measurementPath = join(c, 'RECENT-EVIDENCE-LEDGER-MEASUREMENTS-R1.json');
const schedulePath = join(c, 'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json');
const candidatePath = join(c, 'RECENT-EVIDENCE-LEDGER-RESEARCH-R1.json');
const overlayPath = join(c, 'RECENT-EVIDENCE-LEDGER-PROSPECTIVE-OVERLAY-R1.json');
for (const file of [measurementPath, schedulePath, candidatePath, overlayPath]) assert.equal(existsSync(file), false, 'immutable-output-exists');
const serializedMeasurement = JSON.stringify(measurement, null, 2) + '\n';
const measurementSha = createHash('sha256').update(serializedMeasurement).digest('hex');
const template = {...prior.experiment, research_question: parent.registration.question.question,
  baseline_ref: measurementPath + '#baseline@sha256:' + measurementSha, treatment_ref: 'recent-evidence-ledger-r1'};
for (const key of ['schema_version', 'record_id', 'record_digest', 'hypothesis_ref', 'metrics']) delete template[key];
const metrics = [...new Set([...prior.experiment.metrics, ...Object.keys(measurement.metric_definitions)])];
const common = {continuity_contract: {...parent.continuity,
  current_milestone: 'Test recent confirmed-evidence ledger ordering on four fixed exposed GLM8K tasks. Perfect quality, original token-reduction objective and untouched confirmation remain open.'},
  experiment_template: template, scope: 'Four fixed tasks; candidate only; historical comparisons descriptive.',
  mechanism: 'Newest first-confirmed observation by source version determines bounded ledger order. Preserve all coverage verification and existing rendering, retrieval, selection and budget limits.',
  metrics, provenance_refs: [...refs, measurementPath, schedulePath]};
const records = [
  createResearchHypothesis({...common, hypothesis_key: 'recent-evidence-ledger-r1-visibility',
    statement: 'Recent confirmed-source ledger ordering reduces repeated reads and improves exported useful coverage per model token without reducing native span-F1.',
    falsifier: 'Apply the pinned measurement contract to all four outcomes. Missing eligibility is inconclusive; failure of any quality, Q, repetition or omission threshold is counterevidence. Offline ordering improvement alone does not support model behavior.'}),
  createResearchHypothesis({...common, hypothesis_key: 'recent-evidence-ledger-r1-model-planning',
    statement: 'Task interpretation or model planning dominates, so improved ledger visibility alone does not meet the registered quality-efficiency thresholds.',
    falsifier: 'All H-L support gates pass on eligible evidence, providing descriptive counterevidence to the claim that ledger ordering cannot help; no causal inference.'}),
  createResearchHypothesis({...common, hypothesis_key: 'recent-evidence-ledger-r1-radical-frontier',
    mechanism: 'Separate future task-derived exploration frontier and visited-evidence policy; not bundled with the current ledger-ordering intervention.',
    statement: 'An explicit exploration frontier can outperform reactive local tool choice under the same model-token budget.',
    falsifier: 'Requires its own prospective experiment with unchanged tasks and budgets; this H-L run cannot confirm or falsify the radical intervention.'}),
];
const experiment = createResearchExperiment({...template, hypothesis_ref: records[0].record_id, metrics});
for (const record of [...records, experiment]) assert.equal(verifyEvolutionRecord(record).ok, true);
const candidate = {schema: 'are.candidate-only-research/v1', parent_ref: parentPath,
  measurement_contract_ref: measurementPath, measurement_contract_sha256: measurementSha,
  continuity: common.continuity_contract, records, experiment,
  selection: {selected: records[0].record_id, counterhypotheses: records.slice(1).map(r => r.record_id)},
  work: parent.work, source_bindings: [...sourceBindings,
    {path: measurementPath, sha256: measurementSha},
    {path: schedulePath, sha256: createHash('sha256').update(JSON.stringify(schedule, null, 2) + '\n').digest('hex')}],
  schedule_sha256: schedule.schedule_sha256, maximum_workers: 2, maximum_model_tokens: 384000,
  dispatch_admitted: false, matched_control_savings_evaluable: false, campaign_goal_achieved: false,
  authority_effect: 'none', open_questions_ref: protocol};
const {dag_digest: inheritedDigest, ...graphBody} = buildProspectiveDag({candidate, parent});
// The reused structural builder has a historical question link; bind this
// candidate's own unresolved-question owner and recompute the graph digest.
const updatedGraph = {...graphBody, open_questions_ref: protocol};
const graph = {...updatedGraph, dag_digest: digest(updatedGraph)};
const candidateBytes = JSON.stringify(candidate, null, 2) + '\n';
const overlay = {schema: 'are.recent-evidence-ledger-prospective-registration/v1',
  candidate_ref: candidatePath, parent_ref: parentPath, graph,
  source_bindings: [...sourceBindings, {path: candidatePath, sha256: createHash('sha256').update(candidateBytes).digest('hex')}],
  registration_review_required: true, dispatch_admitted: false, provider_calls: 0,
  open_questions_ref: protocol};
writeFileSync(measurementPath, serializedMeasurement, {flag: 'wx'});
writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + '\n', {flag: 'wx'});
writeFileSync(candidatePath, candidateBytes, {flag: 'wx'});
writeFileSync(overlayPath, JSON.stringify(overlay, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({native_records: 4, tasks: 4, workers: 2, maximum_model_tokens: 384000,
  graph_nodes: graph.nodes.length, graph_edges: graph.edges.length, provider_calls: 0, dispatch_admitted: false}));
