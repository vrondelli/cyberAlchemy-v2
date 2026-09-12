// Exact round-eight source closure and D08 transition. No model requests.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha, verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build, verifyPredecessor, verifyEvidence} from './bind-round9.mjs';

const repository = resolve('.');
const research = resolve('agent-reasoning-engine/research/contextbench-v1');
const path = name => resolve(research, name);
const read = name => JSON.parse(readFileSync(path(name)));
const fileSha = target => sha(readFileSync(target));
const write = (name, value) => {
  const bytes = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
  const target = path(name);
  if (existsSync(target)) {
    if (readFileSync(target, 'utf8') !== bytes) throw Error('round9.artifact-drift:' + name);
  } else writeFileSync(target, bytes, {flag: 'wx'});
};

function preflight() {
  const report = read('initial-envelope-round9.json');
  const matrix = read('development-matrix-v9.json');
  if (report.status !== 'passed-initial-envelope' || report.model_calls !== 0 || report.rows.length !== 8) throw Error('round9.preflight-report');
  if (matrix.cells.some(cell => cell.limits.incomplete_output_corrections !== 1)) throw Error('round9.correction-policy-mismatch');
  const rows = report.rows.map(row => {
    const resultRef = resolve(row.output_path, 'result.json');
    const result = JSON.parse(readFileSync(resultRef));
    if (result.status !== 'token_budget_stopped' || result.error !== 'recycling.dispatch-admission-denied' || result.receipts.some(receipt => receipt.kind === 'model' && receipt.dispatched) || result.captures.length !== 1 || result.admissions.length !== 1 || result.admissions[0].reason !== 'token-budget.preflight-disabled' || result.admissions[0].total_token_limit !== 96000 || result.task_state_presentations.length !== 0) throw Error('round9.preflight-row:' + row.instance_id);
    return {instance_id: row.instance_id, result_ref: resultRef, result_sha256: fileSha(resultRef), capture_sha256: result.captures[0].prompt_sha256};
  });
  return {
    status: 'verified',
    initial_envelope_rows: rows.length,
    rows,
    common_correction_policy: 1,
    model_calls: 0,
    task_state_presentations: 0,
    authority_effect: 'none',
    open_questions_ref: 'PLAN-round9.md#open-questions',
  };
}

function validation() {
  const suites = [
    ['freeze-tests-round9.log', '/tmp/are-r9-contextbench-tests.log', 131],
    ['coding-runtime-tests-round9.log', '/tmp/are-r9-coding-runtime-tests.log', 133],
    ['continuity-runtime-tests-round9.log', '/tmp/are-r9-evolution-runtime-tests.log', 51],
  ];
  const logs = [];
  for (const [name, source, expected] of suites) {
    const bytes = readFileSync(source, 'utf8');
    if (!bytes.includes(`ℹ tests ${expected}`) || !bytes.includes(`ℹ pass ${expected}`) || !bytes.includes('ℹ fail 0')) throw Error('round9.tests:' + name);
    write(name, bytes);
    logs.push({path: path(name), sha256: fileSha(path(name)), passed: expected});
  }
  return {status: 'passed', contextbench_tests: 131, coding_runtime_tests: 133, evolution_runtime_tests: 51, failed: 0, provider_model_calls: 0, logs, component_review_ref: 'incomplete-output-correction-review-v1.json', authority_effect: 'none', open_questions_ref: 'PLAN-round9.md#open-questions'};
}

function preflightState() {
  const built = build();
  const ready = read('work-state-ready-v9.json');
  const artifact = 'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round9.json';
  const events = [...ready.events,
    {event_id: 'r9-preflight-start', task_id: 'contextbench.round9.preflight', action: 'start'},
    {event_id: 'r9-preflight-complete', task_id: 'contextbench.round9.preflight', action: 'complete', evidence: [{criterion_id: 'initial-envelope-and-common-policy-health', artifact_ref: artifact, artifact_digest: fileSha(path('preflight-binding-round9.json'))}]},
  ];
  const state = replayResearchWork({plan: built.plan, registrations: built.registrations, events, verify_evidence: verifyEvidence, verify_registration: verifyPredecessor});
  if (state.frontier.product_construction[0] !== 'contextbench.round9.freeze') throw Error('round9.freeze-not-ready');
  return state;
}

function freezeContinuity() {
  const continuity = structuredClone(read('round9-continuity.json'));
  delete continuity.experiment_and_task_refs.unresolved;
  continuity.experiment_and_task_refs.work_plan_ref = 'work-plan-v9.json';
  continuity.continuity_review.run_ready = true;
  continuity.continuity_review.passed = true;
  continuity.continuity_review.unresolved_bindings = [];
  for (const name of ['work-plan-v9.json', 'work-state-ready-v9.json', 'work-state-preflight-v9.json', 'initial-envelope-round9.json', 'preflight-binding-round9.json', 'freeze-validation-v9.json', 'bind-round9.mjs', 'prepare-round9.mjs']) {
    continuity.continuity_review.reviewed_artifacts.push({path: 'agent-reasoning-engine/research/contextbench-v1/' + name, sha256: fileSha(path(name))});
  }
  const result = verifyResearchContinuity({binding: continuity, policy: JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v1.json'))), hypotheses: read('hypotheses-round9.json'), phase: 'freeze', root: repository});
  if (!result.ok) throw Error('round9.continuity:' + result.reason_codes.join(','));
  return continuity;
}

function sources() {
  const prior = read('freeze-round8.json').sources.map(source => resolve(source.path));
  const additions = [
    ...['round8-stopping-review.json', 'round8-selected-hypothesis-review.json', 'round8-closeout.json', 'work-state-stopped-v8.json', 'hypotheses-round9.json', 'PLAN-round9.md', 'incomplete-output-correction-review-v1.json', 'prepare-round9.mjs', 'development-matrix-v9.json', 'experiment-round9.json', 'round9-continuity.json', 'verify-round9-continuity.mjs', 'bind-round9.mjs', 'work-plan-v9.json', 'work-state-ready-v9.json', 'initial-envelope-round9.json', 'preflight-binding-round9.json', 'freeze-validation-v9.json', 'work-state-preflight-v9.json', 'round9-freeze-continuity.json', 'freeze-tests-round9.log', 'coding-runtime-tests-round9.log', 'continuity-runtime-tests-round9.log', 'freeze-round9.mjs'].map(name => 'agent-reasoning-engine/research/contextbench-v1/' + name),
    ...['context-recycling.mjs'].map(name => 'implementation/agent-reasoning-engine/packages/coding-agent-runtime/' + name),
    ...['episode.mjs', 'episode.test.mjs', 'live-client.mjs', 'live-client.test.mjs', 'task-state.mjs', 'task-state.test.mjs', 'round8-preserved/runtime-manifest.json', 'round8-preserved/context-recycling.mjs', 'round8-preserved/episode.mjs', 'round8-preserved/episode.test.mjs', 'round8-preserved/live-client.mjs', 'round8-preserved/live-client.test.mjs', 'round8-preserved/task-state.mjs', 'round8-preserved/task-state.test.mjs'].map(name => 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/' + name),
    'agent-reasoning-engine/research/continuity-policy-v1.json',
  ].map(item => resolve(repository, item));
  const unique = [...new Set([...prior, ...additions])].sort();
  for (const source of unique) if (!existsSync(source)) throw Error('round9.missing-source:' + source);
  return unique.map(source => ({path: source, sha256: fileSha(source)}));
}

export function createFreeze() {
  write('preflight-binding-round9.json', preflight());
  write('freeze-validation-v9.json', validation());
  write('work-state-preflight-v9.json', preflightState());
  write('round9-freeze-continuity.json', freezeContinuity());
  const material = {
    schema_version: 'are.contextbench-freeze/v1',
    status: 'frozen',
    authority_effect: 'none',
    node_version: process.version,
    expected_tasks: 8,
    expected_cells: 16,
    matrix_ref: path('development-matrix-v9.json'),
    preflight_ref: path('initial-envelope-round9.json'),
    task_manifest_ref: resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),
    task_directory: resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),
    repository_inventory_ref: '/tmp/are-contextbench-repositories-v1/inventory.json',
    upstream: '/tmp/are-contextbench-upstream-117',
    python: '/tmp/are-contextbench-venv-117/bin/python',
    scorer: resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),
    scoring_cache: '/tmp/are-contextbench-native-score-cache-v1',
    sources: sources(),
    continuity_review: {...read('round9-freeze-continuity.json').continuity_review, passed: true},
    claim_ceiling: 'development diagnostic only; not benchmark clearance',
    predecessor_freeze_ref: path('freeze-round8.json'),
    successor_reason: 'Round eight stopped on a length-limited control response before treatment exposure; H18 adds one explicit budget-accounted correction common to both arms while retaining fitted state.',
  };
  write('freeze-round9.json', {...material, freeze_sha256: sha(material)});
  verifyFreeze(path('freeze-round9.json'));
  const built = build();
  const ready = read('work-state-preflight-v9.json');
  const artifact = 'agent-reasoning-engine/research/contextbench-v1/freeze-round9.json';
  const events = [...ready.events,
    {event_id: 'r9-freeze-start', task_id: 'contextbench.round9.freeze', action: 'start'},
    {event_id: 'r9-freeze-complete', task_id: 'contextbench.round9.freeze', action: 'complete', evidence: [{criterion_id: 'exact-frozen-run-envelope', artifact_ref: artifact, artifact_digest: fileSha(path('freeze-round9.json'))}]},
  ];
  const state = replayResearchWork({plan: built.plan, registrations: built.registrations, events, verify_evidence: verifyEvidence, verify_registration: verifyPredecessor});
  if (!state.tasks.some(task => task.task_id === 'contextbench.round9.run' && task.state === 'ready')) throw Error('round9.run-not-ready');
  write('work-state-frozen-v9.json', state);
  return {sources: material.sources.length, freeze_sha256: sha(material), artifact_sha256: fileSha(path('freeze-round9.json')), frontier: state.frontier};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(createFreeze()));
