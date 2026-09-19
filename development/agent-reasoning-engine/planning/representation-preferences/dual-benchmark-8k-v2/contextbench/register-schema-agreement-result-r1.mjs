// Native retrospective registration. Open questions: RECENT-EVIDENCE-LEDGER-R1.md.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createResearchResult, createHypothesisObservation, createLearningDecision, verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {materializeResearchDag} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {digest} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {createHistoricalSourceOverlay} from './historical-source-overlay.mjs';
const c = import.meta.dirname, root = resolve(c, '../../../../../..');
const stage = join(c, 'schema-agreement-production-live-r1');
const read = file => JSON.parse(readFileSync(file));
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const candidatePath = join(c, 'SCHEMA-AGREEMENT-RESEARCH-R1.json');
const candidate = read(candidatePath), parent = read(candidate.parent_ref);
const reviewPath = join(stage, 'RESULT-REVIEW-R1.json'), review = read(reviewPath);
const scorePath = join(stage, 'score/RESULTS.json'), score = read(scorePath);
const analysisPath = join(c, 'LEDGER-VISIBILITY-AUDIT-R1.json'), analysis = read(analysisPath);
const freeze = read(join(stage, 'FREEZE.json'));
assert.ok(review.approved && review.result_integrity_approved);
assert.equal(review.score_sha256, hash(scorePath));
const analysisBindings = analysis.source_bindings.map(b => ({...b, path: resolve(c, b.path)}));
for (const b of [...review.source_bindings, ...analysisBindings]) assert.equal(hash(resolve(root, b.path)), b.sha256);
assert.equal(score.assigned_outcomes, 4);
assert.equal(score.development_target_passed, false);
assert.equal(score.totals['schema-agreement'].known_tokens, 335219);
assert.equal(score.acquisition.disposition, 'counterevidence');
assert.equal(analysis.rows.reduce((n, r) => n + r.successful_direct_read_calls, 0), 72);
assert.equal(analysis.rows.reduce((n, r) => n + r.fully_repeated_direct_read_calls, 0), 43);
const experiment = candidate.experiment;
const hypothesis = candidate.records.find(r => r.record_id === experiment.hypothesis_ref);
assert.ok(hypothesis);
const refs = [scorePath, reviewPath, analysisPath, candidatePath,
  join(c, 'SCHEMA-AGREEMENT-MEASUREMENTS-R1.json'),
  join(c, 'SCHEMA-AGREEMENT-PROSPECTIVE-OVERLAY-R1.json'),
  join(c, 'SCHEMA-AGREEMENT-REGISTRATION-REVIEW-R2.json'),
  join(c, 'SELECTION-LOSS-ANALYSIS-R1.json'),
  join(c, 'LEDGER-VISIBILITY-AUDIT-R1.md'),
  join(c, 'RECENT-EVIDENCE-LEDGER-R1.md')];
const limitations = [
  'Four exposed fixed tasks; historical comparisons are descriptive only',
  'No fresh controls or matched token-savings claim',
  'Truthful structural schema did not achieve the registered quality threshold',
  'Ledger omissions and repeated reads are associated; causality remains unproven',
  'Returned reads are not synonymous with receipt-confirmed delivery or wasted model tokens',
  'Perfect native quality, original 15% token reduction and untouched confirmation remain unverified',
];
const result = createResearchResult({target_ref: hypothesis.record_id, provider_id: 'glm-5.3-flash',
  source_ref: scorePath, source_version: hash(scorePath),
  mechanism: 'Shared advertised/runtime structural search schema on fixed four-task 8K candidate-only evaluation',
  evidence: refs, counterevidence: [], limitations});
const observation = createHypothesisObservation({hypothesis_ref: hypothesis.record_id,
  source_result_ref: result.record_id, source_result_digest: result.record_digest,
  observation_kind: 'supporting', phase: 'experiment',
  claim: 'Narrow integrity/mechanism evidence only: four valid outputs, 335219 known model tokens, 89 model calls, maximum projected window 7987. Ranked rejection 6/14 and mean recall per 10000 tokens .049285014729090575 improve descriptively against the registered historical measurements. This is not support for the full quality-efficiency hypothesis.',
  evaluator_id: 'pinned-native-evaluator-and-independent-result-review', evidence_refs: refs, limitations});
const counter = createHypothesisObservation({hypothesis_ref: hypothesis.record_id,
  source_result_ref: result.record_id, source_result_digest: result.record_digest,
  observation_kind: 'counterevidence', phase: 'experiment',
  claim: 'Registered adjudication is eligible counterevidence: zero perfect tasks and mean span-F1 .3917843227829315 below .39681048402826774. Mean final-recall loss decomposes into .5840114022098546 never acquired and .07856943088838794 acquired but not selected. Prompt audit finds latest returned path absent in 66/73 subsequent ledgers, and 43/72 direct successful reads add no new returned lines for the same source version. These audits suggest mechanisms, not causal attribution.',
  evaluator_id: 'pinned-native-evaluator-and-independent-result-review', evidence_refs: refs, limitations});
const decision = createLearningDecision({hypothesis_ref: hypothesis.record_id, experiment_ref: experiment.record_id,
  observation_refs: [observation.record_id, counter.record_id], disposition: 'run-experiment',
  reason_codes: ['perfect-quality-failed', 'registered-quality-counterevidence', 'acquisition-shortfall', 'coverage-ledger-presentation-omission', 'owner-suspended-controls'],
  next_action: 'Prospectively register H-L recent confirmed-evidence ordering as a separate incremental experiment. Preserve source verification, 384-token/four-entry ledger, fixed4/8K/96K/2workers and native scoring. Review implementation and qualify real token fit before launch. Keep a task-derived exploration frontier as a separate radical hypothesis. No fresh controls, gold-guided generation, retries or budget expansion.'});
const records = [hypothesis, experiment, result, observation, counter, decision];
for (const record of records) assert.equal(verifyEvolutionRecord(record).ok, true);
const implementationBody = {source_bindings: freeze.files.filter(b => b.path.endsWith('.mjs'))};
const implementation = {record_id: 'implementation:' + digest(implementationBody), ...implementationBody};
const text = 'Does presenting recent confirmed source coverage first reduce repetitive retrieval and improve acquired relevant evidence per total model token within unchanged budgets?';
const question = {record_id: 'question:' + digest({question: text}), question: text};
const extra = [...refs, join(c, 'register-schema-agreement-result-r1.mjs')].map(path => ({path, sha256: hash(path)}));
const evidence_bindings = [...new Map([...review.source_bindings, ...analysisBindings, ...extra].map(b => [resolve(root, b.path), b])).values()];
const body = {experiment_id: experiment.record_id, records, implementation, question, evidence_bindings};
const registration = {...body, registration_digest: digest(body)};
const overlay = createHistoricalSourceOverlay(parent.historical_source_overlay);
const registrations = [...parent.historical_registration_refs.map(p => read(p).registration), parent.registration, registration];
const verify_registration = registrationToCheck => {
  try {
    const {registration_digest, ...bodyToCheck} = registrationToCheck;
    assert.equal(digest(bodyToCheck), registration_digest);
    for (const binding of [...registrationToCheck.implementation.source_bindings, ...registrationToCheck.evidence_bindings]) {
      const actual = hash(resolve(root, binding.path));
      if (registration_digest === registration.registration_digest || actual === binding.sha256) assert.equal(actual, binding.sha256);
      else overlay.verifyBinding(binding);
    }
    return registrationToCheck.records.every(r => verifyEvolutionRecord(r).ok);
  } catch { return false; }
};
const research_dag = materializeResearchDag({registrations,
  lineage: [...parent.research_dag.lineage, {question_ref: parent.registration.question.record_id,
    hypothesis_ref: hypothesis.record_id, source_ref: candidatePath}], verify_registration});
const specs = [
  ['hypotheses', [], 'product-construction', 'Register H-L measurement contract, alternative hypotheses and candidate-only schedule'],
  ['candidate', ['hypotheses'], 'product-construction', 'Review recent-evidence ledger, exact episode identity, 13 local tests and offline ordering replay'],
  ['qualification', ['candidate'], 'operational-support', 'Freeze exact sources and qualify real tokenizer/window fit under WSL storage guard'],
  ['run', ['qualification'], 'product-construction', 'Run four fixed candidate tasks with two shared workers and retain all costs and failures'],
  ['decision', ['run'], 'product-construction', 'Native score and mechanism audit lead to next hypothesis or untouched confirmation'],
];
const work = materializeResearchPlan({research_dag, registrations, verify_registration,
  tasks: specs.map(([id, deps, lane, criterion]) => ({task_id: 'schema-postrun-r1:' + id,
    title: id, depends_on: deps.map(d => 'schema-postrun-r1:' + d), owner: 'coordinator', lane,
    stage: 'prototype', question_ref: question.record_id, completion_criteria: [criterion],
    validator_ref: join(c, 'RECENT-EVIDENCE-LEDGER-R1.md')}))});
const artifact = {schema: 'are.schema-agreement-postrun-research/v1', registration, research_dag, work,
  continuity: {...candidate.continuity, current_milestone: decision.next_action},
  historical_registration_refs: [...parent.historical_registration_refs, candidate.parent_ref],
  historical_source_overlay: parent.historical_source_overlay, parent_ref: candidatePath,
  campaign_goal_achieved: false, accepted_token_savings: null, authority_effect: 'none',
  open_questions_ref: '../RECENT-EVIDENCE-LEDGER-R1.md'};
writeFileSync(join(stage, 'RESEARCH-RESULT.json'), JSON.stringify(artifact, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({native_records: records.length, nodes: research_dag.nodes.length,
  tasks: work.tasks.length, outcome: 'all-four-completed-quality-failed', new_model_calls: 0}));
