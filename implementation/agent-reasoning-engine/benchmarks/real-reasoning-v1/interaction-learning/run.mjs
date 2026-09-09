import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createInteractionLearningLifecycle} from '../../../packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs';
import {createReasoningStateLedger} from '../../../packages/codex-app-server-wrapper/index.mjs';
import {materializeIntentContract, digestIntentMaterial as digest} from '../../../packages/request-intent-runtime/index.mjs';
const base = import.meta.dirname;
const read = file => readFileSync(`${base}/${file}`, 'utf8');
const freeze = JSON.parse(read('CORPUS-FREEZE.json'));
for (const [path, hash] of Object.entries(freeze.files)) if (createHash('sha256').update(read(path)).digest('hex') !== hash) throw Error(`Frozen corpus changed: ${path}`);
const episodes = read('episodes.jsonl').trim().split('\n').map(JSON.parse);
// Labels are kept outside runTreatment and used only after treatment output exists.
function runTreatment(input, variant) {
  const started = performance.now();
  let supplied = {};
  const life = createInteractionLearningLifecycle({ledger: createReasoningStateLedger(),
    configuration: {enabled: true, participant_ref: 'participant', product_ref: 'product', policy: {mode: ['V0','V1'].includes(variant) ? 'observe' : 'apply-scoped'}},
    input_provider: () => supplied});
  const start = (id, text, thread = 'thread') => life.prepare({id, params: {threadId: thread, input: [{type: 'text', text}]}});
  const finish = (prepared, id, text, output) => {
    const contract = materializeIntentContract({request_ref: prepared.request.request_ref, request_digest: digest(text), objective: text, target: 'response', disposition: 'act'});
    const dispatch = life.dispatch(prepared, digest([id, 'dispatch']), digest('context'), contract);
    if (!dispatch.ok) throw Error(JSON.stringify(dispatch));
    life.bind(id, prepared.request.interaction_ref, `turn:${id}`);
    const completed = life.complete({params: {threadId: prepared.request.interaction_ref, turn: {id: `turn:${id}`, items: [{type: 'agentMessage', text: output}]}}});
    if (!completed.ok) throw Error(JSON.stringify(completed));
  };
  const first = start(1, input.initial_request); finish(first, 1, input.initial_request, input.initial_output);
  supplied = {target: input.feedback.target, feedback: {...input.feedback, episode_ref: first.request.request_ref}};
  if (variant === 'V0' || variant === 'V2' && input.feedback.posture === 'inferred') supplied = {};
  const correction = start(2, input.feedback_request);
  if (correction.ok) finish(correction, 2, input.feedback_request, 'Plain explanation.');
  const lesson = Object.values(life.inspect({detail: true}).lessons)[0];
  if (input.control && lesson) life.control({action: input.control, control_id: 'explicit:control', lesson_id: lesson.lesson_id});
  supplied = {...input.later};
  const later = start(3, input.later_request, input.later.thread ?? 'thread');
  if (!later.ok) throw Error(JSON.stringify(later));
  // V1 is the declared generic-summary ablation: no applicability projection.
  const instructions = variant === 'V1' ? Object.values(life.inspect({detail: true}).lessons).map(l => l.preference.instruction) : later.view.items.map(l => l.instruction);
  const result = {feedback_accepted: Boolean(lesson), applied: instructions.length > 0,
    failure_class_eligible: lesson?.reflection.improvement_eligible ?? false,
    selected_instruction_digest: digest(instructions), projection_bytes: Buffer.byteLength(JSON.stringify(later.view)),
    extra_model_calls: 0, state_digest: life.inspect({detail: true}).record_digest};
  finish(later, 3, input.later_request, instructions.length ? 'Plain explanation.' : 'Technical jargon.');
  result.application_dispositions = life.inspect({detail: true}).applications.filter(a => a.outcome_ref).map(a => a.disposition);
  result.functional_digest = digest(result); result.local_lifecycle_ms = performance.now() - started; return result;
}
const results = [];
for (const episode of episodes) for (const variant of freeze.variants) for (let repetition = 1; repetition <= 2; repetition++)
  results.push({episode_id: episode.episode_id, split: episode.split, variant, repetition, ...runTreatment(episode, variant)});
const judges = new Map(read('judges.jsonl').trim().split('\n').map(JSON.parse).map(j => [j.episode_id,j]));
for (const r of results) {const j = judges.get(r.episode_id); r.application_correct = r.applied === j.later_application_expected;
  r.scope_violation = r.applied && !j.later_application_expected; r.classification_correct = r.failure_class_eligible === j.failure_class_eligible;}
const metrics = Object.fromEntries(freeze.variants.map(v => {const rs = results.filter(r => r.variant === v); return [v, {
  local_lifecycle_p95_ms: rs.map(r => r.local_lifecycle_ms).sort((a,b) => a-b)[Math.ceil(rs.length * 0.95)-1],
  application_accuracy: rs.filter(r => r.application_correct).length / rs.length, scope_violations: rs.filter(r => r.scope_violation).length,
  classification_accuracy: rs.filter(r => r.classification_correct).length / rs.length,
  max_projection_bytes: Math.max(...rs.map(r => r.projection_bytes)), extra_model_calls: 0}];}));
const mismatches = results.filter(r => r.repetition === 1 && r.functional_digest !== results.find(x => x.episode_id === r.episode_id && x.variant === r.variant && x.repetition === 2).functional_digest).length;
const gates = {v3_application: metrics.V3.application_accuracy === 1, v3_scope: metrics.V3.scope_violations === 0,
  v3_classification: metrics.V3.classification_accuracy === 1, budget: metrics.V3.max_projection_bytes <= 32768, deterministic: mismatches === 0};
console.log(JSON.stringify({schema_version: 'are.interaction-learning-benchmark-result/v1', status: Object.values(gates).every(Boolean) ? 'PASS' : 'FAIL',
  corpus_digest: digest(freeze), episode_count: episodes.length, run_count: results.length, metrics, gates, determinism_mismatches: mismatches,
  timing_scope: 'Local lifecycle setup, 3 dispatch/outcome transitions and 1 correction; no model/provider latency. Descriptive samples, no empirical speedup claim.',
  model_tokens: null, monetary_cost: null, protected_checks: ['wrong-scope application', 'source classification', '32KiB context', 'deterministic replay'],
  remaining_failures: 'Semantic interpretation, independent scenario lineage, external holdout generalization and real model quality are not evaluated by scripted outputs.',
  next_hypothesis: 'After binary compatibility is repaired, test whether scoped lesson selection improves actual model output without protected regressions.',
  claim_limit: freeze.claim_limit, outcomes: 'Scripted outputs test outcome plumbing only; no model quality, latency gain or generalized learning claim.', results, authority_effect: 'none'}, null, 2));
if (!Object.values(gates).every(Boolean)) process.exitCode = 1;
