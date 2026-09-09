import {createImprovementSignal, createImprovementTarget, createResearchHypothesis, createResearchExperiment,
  createHypothesisObservation, createLearningDecision, createVariantComparison, runResearchScout} from '../index.mjs';
import {createEvolutionScheduler} from './scheduler.mjs';
import {digest, sealed} from '../../request-intent-runtime/src/canonical.mjs';
import {verifyLearningRecord} from '../../request-intent-runtime/src/learning-loop.mjs';

export function assessInteractionLearningProgress(state, policy) {
  if (!verifyLearningRecord(state, 'interaction-state') || !verifyLearningRecord(policy, 'interaction-learning-policy')) throw Error('learning.progress-input-invalid');
  const turns = Object.values(state.turns).filter(t => t.outcome).slice(-policy.episode_window);
  const eligible = turns.filter(t => t.outcome.disposition !== 'inconclusive');
  const failed = new Set(turns.filter(t => t.outcome.disposition === 'contradicted').map(t => t.request_ref));
  for (const l of Object.values(state.lessons)) if (l.reflection.improvement_eligible && turns.some(t => t.request_ref === l.episode_ref)) failed.add(l.episode_ref);
  for (const a of state.applications) if (a.disposition === 'contradicted' && turns.some(t => t.request_ref === a.request_ref)) failed.add(a.request_ref);
  const triggerId = `interaction-target:${digest([state.participant_ref, state.product_ref, 'attributed-interaction-failure'])}`;
  const prior = state.evolution[triggerId];
  return sealed('are.interaction-learning-progress/v1', {participant_ref: state.participant_ref, product_ref: state.product_ref,
    cohort_refs: turns.map(t => t.request_ref), evaluated_count: eligible.length, inconclusive_count: turns.length - eligible.length,
    supported_count: eligible.filter(t => t.outcome.disposition === 'supported').length, failure_refs: [...failed].sort(),
    metric: 'episode_success_rate', evaluator_id: 'are.literal-output-checks/v1', baseline_ref: 'V0', policy_digest: policy.record_digest,
    trigger_id: triggerId, disposition: prior ? prior.disposition : failed.size >= policy.recurrence_limit ? 'research-required' : 'observe'}, 'record_digest');
}
export function projectInteractionLearningToHypothesis(progress, implementationBinding) {
  if (!verifyLearningRecord(progress, 'interaction-learning-progress') || progress.disposition !== 'research-required') throw Error('learning.progress-not-eligible');
  if (!implementationBinding?.path || !/^[a-f0-9]{64}$/.test(implementationBinding.sha256)) throw Error('learning.implementation-binding-required');
  const signal = createImprovementSignal({kind: 'interaction.attributed-failure', source_result_ref: progress.record_digest,
    scope: 'interaction-learning', observed_value: progress.failure_refs.length, expected_value: 0, metric: progress.metric,
    provenance_refs: [progress.record_digest]});
  const target = createImprovementTarget({target_key: progress.trigger_id, signal_refs: [signal.record_id], metric: progress.metric,
    direction: 'higher', threshold: 1 / 48, baseline_ref: 'V0', mutation_allowlist: [implementationBinding.path]});
  const hypothesis = createResearchHypothesis({hypothesis_key: progress.trigger_id, statement: 'Scoped source-bound lesson application may reduce repeated interaction failures.',
    mechanism: 'Apply relevant corrections before final context projection; test observed output and exclusions.',
    falsifier: 'No additional successful held-out episode, a protected regression, or an exceeded cost bound.',
    scope: 'interaction-learning', metrics: [progress.metric], provenance_refs: [progress.record_digest, `${implementationBinding.path}@${implementationBinding.sha256}`],
    implementation_pattern: 'apply-intent-reflection-before-context-projection', implementation_ref: `${implementationBinding.path}@${implementationBinding.sha256}`,
    experiment_template: {research_question: 'Does the scoped lesson improve the frozen cohort?', baseline_ref: 'V0', treatment_ref: 'V3', required_repetitions: 2}});
  return {signal, target, hypothesis};
}

// Persist start before calling this adapter, and completion afterwards through the
// same reasoning ledger. A recovered start with no result is delivery-unknown.
export function createInteractionEvolutionAdapter({research_providers = [], run_experiment, implementation_binding, on_result = () => {}, callback_timeout_ms = 30000} = {}) {
  if (!Number.isSafeInteger(callback_timeout_ms) || callback_timeout_ms < 1 || callback_timeout_ms > 300000) throw Error('learning.callback-timeout-invalid');
  async function bounded(fn, input) {
    const controller = new AbortController(); let timer;
    try {return await Promise.race([Promise.resolve().then(() => fn({...input, signal: controller.signal})), new Promise((_, reject) => {
      timer = setTimeout(() => {controller.abort(); reject(Error('learning.callback-timeout'));}, callback_timeout_ms);
    })]);} finally {clearTimeout(timer);}
  }
  const scheduler = createEvolutionScheduler({run_cycle: async ({progress, policy}) => {
    const {signal, target, hypothesis} = projectInteractionLearningToHypothesis(progress, implementation_binding);
    const records = [signal, target, hypothesis];
    if (!research_providers.length) return {disposition: 'research-pending', records, attempts: [], authority_effect: 'none'};
    if (research_providers.length > policy.max_providers) throw Error('learning.research-provider-budget-exceeded');
    // Scout target is a redacted structural target; no raw conversation text.
    const research = await runResearchScout(target, research_providers.map(p => ({id: p.id, search: input => bounded(p.search, input)})), {enabled: true, maximum_results_per_provider: policy.max_results_per_provider});
    if (!research.ok) return {disposition: 'research-failed', records, research, attempts: [], authority_effect: 'none'};
    records.push(...research.results);
    if (typeof run_experiment !== 'function') return {disposition: 'experiment-pending', records, attempts: [], authority_effect: 'none'};
    const attempts = [], identities = new Set(); let noGain = 0;
    for (let attempt = 0; attempt < policy.max_attempts; attempt++) {
      const experiment = createResearchExperiment({hypothesis_ref: hypothesis.record_id, research_question: hypothesis.experiment_template.research_question,
        baseline_ref: 'V0', treatment_ref: `V3:attempt-${attempt + 1}`, metrics: [progress.metric], dataset_refs: ['interaction-learning-48/v1'],
        required_repetitions: 2, success_criteria: {minimum_delta: 1 / 48, safety_regressions: 0}, stop_conditions: ['protected-regression', 'two-no-gain', 'three-attempts']});
      const measured = await bounded(run_experiment, Object.freeze({experiment, hypothesis, research_results: research.results, attempt: attempt + 1, authority_effect: 'none'}));
      if (!measured?.variant_ref || identities.has(measured.variant_ref)) throw Error('learning.identical-experiment-retry');
      identities.add(measured.variant_ref);
      const comparison = createVariantComparison({...measured, target_ref: target.record_id, baseline_ref: 'V0',
        fitness: {target_metric: progress.metric, direction: 'higher', minimum_delta: 1 / 48, protected_quality: {scope_safety: 0}, maximum_regression_ratio: {latency_ms: 0.1}}});
      const observation = createHypothesisObservation({hypothesis_ref: hypothesis.record_id, source_result_ref: comparison.record_id,
        source_result_digest: comparison.digest, observation_kind: comparison.outcome === 'KEEP' ? 'supporting' : 'counterevidence', phase: 'experiment',
        claim: comparison.outcome === 'KEEP' ? 'Declared comparison gates passed.' : 'Candidate failed a declared comparison gate.', evaluator_id: 'are.variant-comparison/v1', evidence_refs: measured.run_refs});
      const decision = createLearningDecision({hypothesis_ref: hypothesis.record_id, observation_refs: [observation.record_id], experiment_ref: experiment.record_id,
        disposition: comparison.outcome === 'KEEP' ? 'candidate-supported' : 'revise-hypothesis', reason_codes: comparison.reason_codes,
        supporting_count: comparison.outcome === 'KEEP' ? 1 : 0, counterevidence_count: comparison.outcome === 'KEEP' ? 0 : 1,
        next_action: comparison.outcome === 'KEEP' ? 'recommend-only product review' : 'revise or stop; preserve negative result'});
      records.push(experiment, comparison, observation, decision); attempts.push({experiment, comparison, observation, decision});
      on_result(attempts.at(-1));
      if (comparison.outcome === 'KEEP') return {disposition: 'candidate-supported', records, attempts, authority_effect: 'none'};
      if (comparison.reason_codes.some(code => code !== 'fitness.target-not-improved')) return {disposition: 'treatment-rejected', records, attempts, authority_effect: 'none'};
      if (++noGain >= policy.no_gain_limit) return {disposition: 'stopped-no-gain', records, attempts, authority_effect: 'none'};
    }
    return {disposition: 'budget-exhausted', records, attempts, authority_effect: 'none'};
  }});
  return {run: (progress, policy) => scheduler.runOnce({trigger_id: progress.trigger_id, progress, policy})};
}
