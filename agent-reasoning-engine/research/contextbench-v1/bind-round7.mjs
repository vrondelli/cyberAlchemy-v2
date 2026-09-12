// Reviewed round-six failure -> H13 D07/D08 construction and preflight frontier.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord, verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson, digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan, replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha, verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root = 'agent-reasoning-engine/research/contextbench-v1/';
const source = root + 'round6-selected-hypothesis-review.json';
const expected = '5de21347c4ca9fdeb4c0bb5b73d16f7a1305ad62eb4facb1d8d3f4ff70d87155';
const fileSha = path => sha(readFileSync(path));
const read = path => JSON.parse(readFileSync(path));

export function predecessor() {
  const bytes = readFileSync(source);
  if (sha(bytes) !== expected) throw Error('round7.predecessor-drift');
  const records = JSON.parse(bytes).records;
  if (records.length !== 4 || records.some(record => !verifyEvolutionRecord(record, record.schema_version).ok)) throw Error('round7.predecessor-records');
  const decision = records.find(record => record.schema_version === 'are.learning-decision/v1');
  const continuity = read(root + 'round7-continuity.json');
  const material = {
    schema_version: 'are.contextbench-history-projection/v1',
    experiment_id: 'contextbench-round6-stopped',
    records,
    stopping_review: {source_ref: root + 'round6-stopping-review.json', source_digest: fileSha(root + 'round6-stopping-review.json')},
    implementation: {record_id: 'implementation-evidence:' + fileSha(root + 'exact-generation-render-review-v1.json'), source_ref: root + 'exact-generation-render-review-v1.json'},
    question: {record_id: 'candidate-question:contextbench-exact-generation-round7', question: continuity.question_and_hypotheses.question, source_decision_ref: decision.record_id},
    source_ref: source,
    source_digest: expected,
    authority_effect: 'none',
  };
  return {...material, registration_digest: digest(material)};
}

export const verifyPredecessor = registration => {
  try { return canonicalJson(registration) === canonicalJson(predecessor()); } catch { return false; }
};

export function build() {
  const registrations = [predecessor()];
  const research_dag = materializeResearchDag({registrations, verify_registration: verifyPredecessor});
  const rows = [
    ['continuity', [], 'objective-method-and-round6-continuity'],
    ['integrate', ['continuity'], 'awaitable-exact-generation-render-boundary'],
    ['test', ['integrate'], 'zero-speculation-and-exact-exposure-controls'],
    ['design', ['test'], 'fixed-matched-h13-experiment'],
    ['preflight', ['design'], 'tokenizer-and-initial-envelope-health'],
    ['freeze', ['preflight'], 'exact-frozen-run-envelope'],
    ['run', ['freeze'], 'all-sixteen-attempts-accounted'],
    ['score', ['run'], 'native-scores-token-and-state-integrity'],
    ['review', ['score'], 'reviewed-h13-decision-and-method-bound-successor'],
  ];
  const tasks = rows.map(([id, deps, criterion]) => ({
    task_id: 'contextbench.round7.' + id,
    title: 'ContextBench round seven: ' + id,
    owner: 'executing agent',
    lane: 'product-construction',
    stage: id,
    question_ref: registrations[0].question.record_id,
    depends_on: deps.map(dep => 'contextbench.round7.' + dep),
    completion_criteria: [criterion],
    validator_ref: 'contextbench.round7.verify:' + id,
  }));
  const plan = materializeResearchPlan({research_dag, registrations, tasks, verify_registration: verifyPredecessor});
  return {registrations, research_dag, plan, state: replayResearchWork({plan, registrations, verify_registration: verifyPredecessor}), claim_ceiling: 'H13 exposed GLM-5.3-flash 8K development construction; no provider outcome or benchmark clearance.'};
}

export function verifyEvidence(evidence) {
  try {
    if (fileSha(resolve(evidence.artifact_ref)) !== evidence.artifact_digest) return {ok: false};
    if (evidence.validator_ref === 'contextbench.round7.verify:continuity') {
      const result = verifyResearchContinuity({binding: read(root + 'round7-continuity.json'), policy: read('agent-reasoning-engine/research/continuity-policy-v1.json'), hypotheses: read(root + 'hypotheses-round7.json'), phase: 'final', root: resolve('.')});
      if (!result.ok) return {ok: false};
    } else if (['integrate', 'test'].some(stage => evidence.validator_ref.endsWith(':' + stage))) {
      const review = read(root + 'exact-generation-render-review-v1.json');
      if (review.tests.contextbench.passed !== 128 || review.tests.contextbench.failed !== 0 || review.tests.coding_agent_runtime.passed !== 133 || review.tests.coding_agent_runtime.failed !== 0 || review.provider_model_calls !== 0) return {ok: false};
      for (const item of review.bindings) if (fileSha(item.path) !== item.sha256) return {ok: false};
    } else if (evidence.validator_ref === 'contextbench.round7.verify:design') {
      const experiment = read(root + 'experiment-round7.json');
      const matrix = read(root + 'development-matrix-v7.json');
      if (!verifyEvolutionRecord(experiment, experiment.schema_version).ok || matrix.round !== 'contextbench-development-round7' || matrix.cells.length !== 16 || matrix.tasks.length !== 8) return {ok: false};
      for (let index = 0; index < matrix.cells.length; index += 2) {
        const pair = matrix.cells.slice(index, index + 2);
        if (new Set(pair.map(cell => cell.instance_id)).size !== 1 || new Set(pair.map(cell => cell.state_arm)).size !== 2) return {ok: false};
      }
    } else if (evidence.validator_ref === 'contextbench.round7.verify:preflight') {
      const preflight = read(root + 'preflight-binding-round7.json');
      if (preflight.status !== 'verified' || preflight.model_calls !== 0 || preflight.initial_envelope_rows !== 8 || preflight.state_tokenizer_health?.status !== 'passed') return {ok: false};
    } else if (evidence.validator_ref === 'contextbench.round7.verify:freeze') {
      const {freeze, matrix} = verifyFreeze(evidence.artifact_ref);
      if (matrix.round !== 'contextbench-development-round7' || freeze.expected_cells !== 16 || freeze.expected_tasks !== 8) return {ok: false};
    } else return {ok: false};
    return {ok: true, binding: evidence};
  } catch { return {ok: false}; }
}

export function materialize() {
  const built = build();
  const evidence = (criterion, artifact) => [{criterion_id: criterion, artifact_ref: artifact, artifact_digest: fileSha(resolve(artifact))}];
  const stages = [
    ['continuity', 'objective-method-and-round6-continuity', root + 'round7-continuity.json'],
    ['integrate', 'awaitable-exact-generation-render-boundary', root + 'exact-generation-render-review-v1.json'],
    ['test', 'zero-speculation-and-exact-exposure-controls', root + 'exact-generation-render-review-v1.json'],
    ['design', 'fixed-matched-h13-experiment', root + 'experiment-round7.json'],
  ];
  const events = stages.flatMap(([id, criterion, artifact]) => [
    {event_id: `r7-${id}-start`, task_id: `contextbench.round7.${id}`, action: 'start'},
    {event_id: `r7-${id}-complete`, task_id: `contextbench.round7.${id}`, action: 'complete', evidence: evidence(criterion, artifact)},
  ]);
  const state = replayResearchWork({plan: built.plan, registrations: built.registrations, events, verify_evidence: verifyEvidence, verify_registration: verifyPredecessor});
  if (state.frontier.product_construction[0] !== 'contextbench.round7.preflight') throw Error('round7.frontier-invalid');
  for (const [name, value] of [['work-plan-v7.json', built], ['work-state-ready-v7.json', state]]) {
    const target = root + name;
    const bytes = JSON.stringify(value, null, 2) + '\n';
    if (existsSync(target)) {
      if (readFileSync(target, 'utf8') !== bytes) throw Error('round7.artifact-drift:' + name);
    } else writeFileSync(target, bytes, {flag: 'wx'});
  }
  return {tasks: built.plan.tasks.length, frontier: state.frontier.product_construction};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(materialize()));
