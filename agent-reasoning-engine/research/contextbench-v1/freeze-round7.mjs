// Exact round-seven source closure and D08 transition. No model requests.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha, verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build, verifyPredecessor, verifyEvidence} from './bind-round7.mjs';

const repository = resolve('.');
const research = resolve('agent-reasoning-engine/research/contextbench-v1');
const path = name => resolve(research, name);
const read = name => JSON.parse(readFileSync(path(name)));
const fileSha = target => sha(readFileSync(target));
const write = (name, value) => {
  const bytes = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
  const target = path(name);
  if (existsSync(target)) {
    if (readFileSync(target, 'utf8') !== bytes) throw Error('round7.artifact-drift:' + name);
  } else writeFileSync(target, bytes, {flag: 'wx'});
};

function preflight() {
  const report = read('initial-envelope-round7.json');
  const failed = read('initial-envelope-round7-attempt1-disk-failure.json');
  const health = read('state-tokenizer-health-round7.json');
  if (report.status !== 'passed-initial-envelope' || report.model_calls !== 0 || report.rows.length !== 8) throw Error('round7.preflight-report');
  if (failed.status !== 'incomplete' || failed.model_calls !== 0 || failed.rows.length !== 2 || failed.rows[1].status !== 'orchestration_error' || !failed.rows[1].error.includes('No space left on device')) throw Error('round7.preflight-failure-history');
  if (health.status !== 'passed' || health.model_calls !== 0 || health.probes.length !== 3 || health.receipts.length !== 3 || health.receipts.some(receipt => !receipt.dispatched || receipt.status !== 200)) throw Error('round7.state-tokenizer-health');
  const rows = report.rows.map(row => {
    const resultRef = resolve(row.output_path, 'result.json');
    const result = JSON.parse(readFileSync(resultRef));
    if (result.status !== 'token_budget_stopped' || result.error !== 'recycling.dispatch-admission-denied' || result.receipts.some(receipt => receipt.kind === 'model' && receipt.dispatched) || result.captures.length !== 1 || result.admissions.length !== 1 || result.admissions[0].reason !== 'token-budget.preflight-disabled' || result.admissions[0].total_token_limit !== 96000 || result.task_state_presentations.length !== 0) throw Error('round7.preflight-row:' + row.instance_id);
    return {instance_id: row.instance_id, result_ref: resultRef, result_sha256: fileSha(resultRef), capture_sha256: result.captures[0].prompt_sha256};
  });
  return {
    status: 'verified',
    initial_envelope_rows: rows.length,
    rows,
    state_tokenizer_health: {status: health.status, probes: health.probes.length, receipts: health.receipts.length, artifact_ref: path('state-tokenizer-health-round7.json'), artifact_sha256: fileSha(path('state-tokenizer-health-round7.json'))},
    retained_failed_attempt: {artifact_ref: path('initial-envelope-round7-attempt1-disk-failure.json'), artifact_sha256: fileSha(path('initial-envelope-round7-attempt1-disk-failure.json')), cause: 'tmpfs exhausted during isolated repository clone before task-two tokenizer or any model dispatch'},
    model_calls: 0,
    task_state_presentations: 0,
    authority_effect: 'none',
    open_questions_ref: 'PLAN-round7.md#open-questions',
  };
}

function validation() {
  const suites = [
    ['freeze-tests-round7.log', '/tmp/are-r7-contextbench-tests-freeze.log', 128],
    ['coding-runtime-tests-round7.log', '/tmp/are-r7-coding-runtime-tests-freeze.log', 133],
    ['continuity-runtime-tests-round7.log', '/tmp/are-r7-evolution-runtime-tests-freeze.log', 51],
  ];
  const logs = [];
  for (const [name, source, expected] of suites) {
    const bytes = readFileSync(source, 'utf8');
    if (!bytes.includes(`ℹ tests ${expected}`) || !bytes.includes(`ℹ pass ${expected}`) || !bytes.includes('ℹ fail 0')) throw Error('round7.tests:' + name);
    write(name, bytes);
    logs.push({path: path(name), sha256: fileSha(path(name)), passed: expected});
  }
  return {status: 'passed', contextbench_tests: 128, coding_runtime_tests: 133, evolution_runtime_tests: 51, failed: 0, provider_model_calls: 0, logs, component_review_ref: 'exact-generation-render-review-v1.json', authority_effect: 'none', open_questions_ref: 'PLAN-round7.md#open-questions'};
}

function preflightState() {
  const built = build();
  const ready = read('work-state-ready-v7.json');
  const artifact = 'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round7.json';
  const events = [...ready.events,
    {event_id: 'r7-preflight-start', task_id: 'contextbench.round7.preflight', action: 'start'},
    {event_id: 'r7-preflight-complete', task_id: 'contextbench.round7.preflight', action: 'complete', evidence: [{criterion_id: 'tokenizer-and-initial-envelope-health', artifact_ref: artifact, artifact_digest: fileSha(path('preflight-binding-round7.json'))}]},
  ];
  const state = replayResearchWork({plan: built.plan, registrations: built.registrations, events, verify_evidence: verifyEvidence, verify_registration: verifyPredecessor});
  if (state.frontier.product_construction[0] !== 'contextbench.round7.freeze') throw Error('round7.freeze-not-ready');
  return state;
}

function freezeContinuity() {
  const continuity = structuredClone(read('round7-continuity.json'));
  delete continuity.experiment_and_task_refs.unresolved;
  continuity.experiment_and_task_refs.work_plan_ref = 'work-plan-v7.json';
  continuity.continuity_review.run_ready = true;
  continuity.continuity_review.passed = true;
  continuity.continuity_review.unresolved_bindings = [];
  for (const name of ['work-plan-v7.json', 'work-state-ready-v7.json', 'work-state-preflight-v7.json', 'initial-envelope-round7-attempt1-disk-failure.json', 'initial-envelope-round7.json', 'state-tokenizer-health-round7.json', 'preflight-binding-round7.json', 'freeze-validation-v7.json', 'bind-round7.mjs', 'prepare-round7.mjs', 'prepare-round7-continuity.mjs']) {
    continuity.continuity_review.reviewed_artifacts.push({path: 'agent-reasoning-engine/research/contextbench-v1/' + name, sha256: fileSha(path(name))});
  }
  const result = verifyResearchContinuity({binding: continuity, policy: JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v1.json'))), hypotheses: read('hypotheses-round7.json'), phase: 'freeze', root: repository});
  if (!result.ok) throw Error('round7.continuity:' + result.reason_codes.join(','));
  return continuity;
}

function sources() {
  const prior = read('freeze-round6.json').sources.map(source => resolve(source.path));
  const additions = [
    ...['round6-stopping-review.json', 'round6-selected-hypothesis-review.json', 'round6-closeout.json', 'work-state-stopped-v6.json', 'hypotheses-round7.json', 'PLAN-round7.md', 'exact-generation-render-review-v1.json', 'prepare-round7.mjs', 'development-matrix-v7.json', 'experiment-round7.json', 'prepare-round7-continuity.mjs', 'round7-continuity.json', 'verify-round7-continuity.mjs', 'bind-round7.mjs', 'work-plan-v7.json', 'work-state-ready-v7.json', 'initial-envelope-round7-attempt1-disk-failure.json', 'initial-envelope-round7.json', 'state-tokenizer-health-round7.json', 'preflight-binding-round7.json', 'freeze-validation-v7.json', 'work-state-preflight-v7.json', 'round7-freeze-continuity.json', 'freeze-tests-round7.log', 'coding-runtime-tests-round7.log', 'continuity-runtime-tests-round7.log', 'freeze-round7-invalid-claim.json', 'freeze-round7.mjs'].map(name => 'agent-reasoning-engine/research/contextbench-v1/' + name),
    ...['context-recycling.mjs'].map(name => 'implementation/agent-reasoning-engine/packages/coding-agent-runtime/' + name),
    ...['episode.mjs', 'episode.test.mjs', 'live-client.mjs', 'live-client.test.mjs', 'task-state.mjs', 'task-state.test.mjs', 'state-tokenizer-preflight.mjs', 'round6-preserved/runtime-manifest.json', 'round6-preserved/context-recycling.mjs', 'round6-preserved/episode.mjs', 'round6-preserved/episode.test.mjs'].map(name => 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/' + name),
    'agent-reasoning-engine/research/continuity-policy-v1.json',
  ].map(item => resolve(repository, item));
  const unique = [...new Set([...prior, ...additions])].sort();
  for (const source of unique) if (!existsSync(source)) throw Error('round7.missing-source:' + source);
  return unique.map(source => ({path: source, sha256: fileSha(source)}));
}

export function createFreeze() {
  write('preflight-binding-round7.json', preflight());
  write('freeze-validation-v7.json', validation());
  write('work-state-preflight-v7.json', preflightState());
  write('round7-freeze-continuity.json', freezeContinuity());
  const material = {
    schema_version: 'are.contextbench-freeze/v1',
    status: 'frozen',
    authority_effect: 'none',
    node_version: process.version,
    expected_tasks: 8,
    expected_cells: 16,
    matrix_ref: path('development-matrix-v7.json'),
    preflight_ref: path('initial-envelope-round7.json'),
    task_manifest_ref: resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),
    task_directory: resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),
    repository_inventory_ref: '/tmp/are-contextbench-repositories-v1/inventory.json',
    upstream: '/tmp/are-contextbench-upstream-117',
    python: '/tmp/are-contextbench-venv-117/bin/python',
    scorer: resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),
    scoring_cache: '/tmp/are-contextbench-native-score-cache-v1',
    sources: sources(),
    continuity_review: {...read('round7-freeze-continuity.json').continuity_review, passed: true},
    claim_ceiling: 'development diagnostic only; not benchmark clearance',
    predecessor_freeze_ref: path('freeze-round6.json'),
    successor_reason: 'Round six produced zero H11 exposure because state was measured speculatively; H13 measures and presents state only for the recycler-selected generation.',
  };
  write('freeze-round7.json', {...material, freeze_sha256: sha(material)});
  verifyFreeze(path('freeze-round7.json'));
  const built = build();
  const ready = read('work-state-preflight-v7.json');
  const artifact = 'agent-reasoning-engine/research/contextbench-v1/freeze-round7.json';
  const events = [...ready.events,
    {event_id: 'r7-freeze-start', task_id: 'contextbench.round7.freeze', action: 'start'},
    {event_id: 'r7-freeze-complete', task_id: 'contextbench.round7.freeze', action: 'complete', evidence: [{criterion_id: 'exact-frozen-run-envelope', artifact_ref: artifact, artifact_digest: fileSha(path('freeze-round7.json'))}]},
  ];
  const state = replayResearchWork({plan: built.plan, registrations: built.registrations, events, verify_evidence: verifyEvidence, verify_registration: verifyPredecessor});
  if (!state.tasks.some(task => task.task_id === 'contextbench.round7.run' && task.state === 'ready')) throw Error('round7.run-not-ready');
  write('work-state-frozen-v7.json', state);
  return {sources: material.sources.length, freeze_sha256: sha(material), artifact_sha256: fileSha(path('freeze-round7.json')), frontier: state.frontier};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(createFreeze()));
