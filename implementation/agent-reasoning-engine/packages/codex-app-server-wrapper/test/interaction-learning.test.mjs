import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve} from 'node:path';
import {mkdtempSync, rmSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createCodexAppServerWrapper, createReasoningStateLedger, loadRepositoryProfile} from '../index.mjs';
import {createInteractionLearningLifecycle, addInteractionLearningContext,
  LEARNING_PRECEDENCE_CONTEXT_KEY} from '../src/interaction-learning-lifecycle.mjs';
import {materializeIntentContract} from '../../request-intent-runtime/index.mjs';
import {createInteractionEvolutionAdapter} from '../../evolution-runtime/src/interaction-learning.mjs';
import {reduceInteractionState} from '../../request-intent-runtime/src/learning-loop.mjs';
import {digestValue} from '../src/canonical.mjs';
const root = resolve(import.meta.dirname, '..'), repo = resolve(root, '../../../../..');
const loaded = loadRepositoryProfile(resolve(root, 'profiles/repository-v1.json'), repo);
assert.equal(loaded.ok, true);
const configuration = {enabled: true, participant_ref: 'user:a', product_ref: 'product:a', policy: {mode: 'apply-scoped'}};
const request = (id, text = 'Explain context management', threadId = 't') => ({jsonrpc: '2.0', id, method: 'turn/start', params: {threadId, input: [{type: 'text', text}]}});
const check = {check_id: 'plain', kind: 'excludes', value: 'jargon'};
const feedback = {quote: 'Avoid jargon', instruction: 'Avoid jargon', target: 'response', posture: 'inferred', retention_scope: 'current-interaction', correction_kind: 'misinterpretation', expected_checks: [check]};
function harness(extra = {}) {
  const ledger = extra.ledger ?? createReasoningStateLedger(); let supplied = {};
  const evolution = extra.evolution ? {create_adapter: createInteractionEvolutionAdapter, ...extra.evolution} : undefined;
  const life = createInteractionLearningLifecycle({ledger, configuration, input_provider: () => supplied, ...extra, ...(evolution ? {evolution} : {})});
  const set = x => {supplied = x;};
  const step = (id, text, output, options = {}) => {
    set(options); const p = life.prepare(request(id, text)); assert.equal(p.ok, true, JSON.stringify(p));
    const contract = materializeIntentContract({request_ref: p.request.request_ref, request_digest: digestValue(text), objective: text, target: 'response', disposition: 'act'});
    assert.equal(life.dispatch(p, digestValue(['dispatch', id]), digestValue('context'), contract).ok, true);
    assert.equal(life.bind(String(id), 't', `turn:${id}`).ok, true);
    const message = {method: 'turn/completed', params: {threadId: 't', turn: {id: `turn:${id}`, items: output === null ? [] : [{type: 'agentMessage', text: output}]}}};
    assert.equal(life.complete(message).ok, true);
    return {p, message};
  };
  return {life, step, set, ledger};
}
test('owned feedback observation is thread-bound, checkpointed, content-free and write-free across replay', () => {
  const h = harness();
  const empty = h.life.observeFeedback({thread_id: 't'});
  assert.equal(empty.status, 'no-records'); assert.equal(empty.checkpoint_digest, null);
  assert.equal(empty.pending_feedback_count, 0);
  const first = h.step(1, 'Explain context management', 'private answer jargon');
  h.step(2, 'Avoid jargon', 'private plain answer', {feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  h.set({});
  assert.equal(h.life.submitFeedback({thread_id: 't', feedback_id: 'private-feedback-id', text: 'private ambiguous correction'}).disposition, 'pending');
  const before = JSON.stringify(h.ledger.snapshot());
  const observed = h.life.observeFeedback({thread_id: 't'});
  assert.equal(observed.status, 'observed'); assert.equal(observed.durability, 'process-memory');
  assert.match(observed.checkpoint_digest, /^[a-f0-9]{64}$/);
  assert.equal(observed.pending_feedback_count, 1); assert.equal(observed.retained_lesson_count, 1);
  assert.equal(observed.disabled_lesson_count, 0); assert.equal(observed.dispatched_application_count, 1);
  assert.equal(observed.evaluated_application_count, 1, 'Dispatch and outcome rows must not double-count one application.');
  const {observation_digest, ...material} = observed;
  assert.equal(observation_digest, digestValue(material));
  assert.doesNotMatch(JSON.stringify(observed), /private|Avoid jargon|learning:|lesson:|participant_ref|interaction_ref/);
  const foreign = h.life.observeFeedback({thread_id: 'other'});
  assert.notEqual(foreign.binding_ref, observed.binding_ref);
  for (const key of ['pending_feedback_count', 'retained_lesson_count', 'disabled_lesson_count',
    'dispatched_application_count', 'evaluated_application_count']) assert.equal(foreign[key], 0);
  assert.equal(JSON.stringify(h.ledger.snapshot()), before);
  const replay = createInteractionLearningLifecycle({ledger: h.ledger, configuration});
  assert.deepEqual(replay.observeFeedback({thread_id: 't'}), observed);
  assert.equal(JSON.stringify(h.ledger.snapshot()), before);
  const lesson = Object.values(h.life.inspect({detail: true}).lessons)[0];
  assert.equal(h.life.control({action: 'disable-reuse', control_id: 'disable', lesson_id: lesson.lesson_id}).ok, true);
  assert.equal(h.life.observeFeedback({thread_id: 't'}).disabled_lesson_count, 1);
  assert.equal(h.life.control({action: 'set-mode', control_id: 'off', mode: 'off'}).ok, true);
  const off = h.life.observeFeedback({thread_id: 't'});
  assert.equal(off.mode, 'off'); assert.equal(off.retained_lesson_count, 1, 'Off is not erasure of retained evidence.');
});

test('feedback observations withdraw counters for missing checkpoints, disabled configuration and checkpoint faults', () => {
  const h = harness(); h.step(1, 'Explain context', 'answer');
  const missing = createInteractionLearningLifecycle({ledger: {...h.ledger, checkpoints: () => []}, configuration});
  const failed = missing.observeFeedback({thread_id: 't'});
  assert.equal(failed.status, 'unavailable'); assert.equal(failed.state_digest, null);
  for (const key of ['pending_feedback_count', 'retained_lesson_count', 'disabled_lesson_count',
    'dispatched_application_count', 'evaluated_application_count']) assert.equal(failed[key], null);
  const disabled = createInteractionLearningLifecycle({ledger: createReasoningStateLedger()});
  assert.equal(disabled.observeFeedback({thread_id: 't'}).status, 'disabled');
  assert.equal(disabled.observeFeedback({thread_id: 't'}).pending_feedback_count, null);
  assert.equal(h.life.observeFeedback({thread_id: ' t'}).ok, false);
  const ledger = createReasoningStateLedger();
  const faulted = harness({ledger: {...ledger, checkpoint: () => ({ok: false})}});
  faulted.set({});
  assert.equal(faulted.life.submitFeedback({thread_id: 't', feedback_id: 'fault', text: 'ambiguous'}).ok, false);
  assert.equal(faulted.life.observeFeedback({thread_id: 't'}).status, 'unavailable');
});

test('feedback observation refuses a newer uncheckpointed owner event instead of borrowing an older checkpoint', () => {
  const h = harness(); h.step(1, 'Explain context', 'answer');
  assert.equal(h.life.observeFeedback({thread_id: 't'}).status, 'observed');
  assert.equal(h.ledger.append({event_kind: 'interaction-feedback-pending', idempotency_key: 'unsealed',
    content: {binding: {participant_ref: configuration.participant_ref, product_ref: configuration.product_ref},
      interaction_ref: 't', request_ref: 'unsealed', request_digest: digestValue('private unsealed feedback')}}).ok, true);
  const before = JSON.stringify(h.ledger.snapshot());
  const observed = h.life.observeFeedback({thread_id: 't'});
  assert.equal(observed.status, 'unavailable'); assert.equal(observed.checkpoint_digest, null);
  assert.equal(observed.pending_feedback_count, null); assert.equal(observed.retained_lesson_count, null);
  assert.equal(JSON.stringify(h.ledger.snapshot()), before);
});

test('complete learning cycle records dispatch, outcome, scoped correction, application, contradictions, and revocation', () => {
  const h = harness(); const first = h.step(1, 'Explain context management', 'jargon', {checks: [check]});
  const repaired = h.step(2, 'Avoid jargon', 'Plain explanation', {feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  assert.equal(repaired.p.view.items.length, 1);
  h.step(3, 'Explain context again', 'jargon'); h.step(4, 'Explain context again', 'jargon');
  const state = h.life.inspect({detail: true}); assert.equal(state.disabled.length, 1);
  assert.deepEqual(state.applications.filter(a => a.outcome_ref).map(a => a.disposition), ['supported', 'contradicted', 'contradicted']);
  assert.equal(h.step(5, 'Explain context again', 'plain').p.view.items.length, 0);
  assert.equal(h.life.control({action: 'disable-reuse', control_id: 'user:revoke', lesson_id: state.disabled[0]}).ok, true);
  assert.equal(h.life.control({action: 'erase', control_id: 'bad'}).ok, false);
  const recovered = createInteractionLearningLifecycle({ledger: h.ledger, configuration});
  assert.equal(recovered.inspect({detail: true}).record_digest, h.life.inspect({detail: true}).record_digest);
  assert.equal(recovered.complete(repaired.message).disposition, 'replayed');
  assert.equal(recovered.prepare(request(1)).ok, false);
});
test('feedback-only applied and pending receipts replay from the learning ledger without a model turn', () => {
  const h = harness();
  const first = h.step(1, 'Explain context management', 'jargon');
  h.set({feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  const applied = h.life.submitFeedback({thread_id: 't', feedback_id: 'feedback:a', text: 'Avoid jargon'});
  assert.equal(applied.disposition, 'applied');
  assert.equal(Object.keys(h.life.inspect({detail: true}).turns).length, 1);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration,
    input_provider: ({request: text}) => text === 'Unsupported' ? {}
      : ({feedback: {...feedback, episode_ref: first.p.request.request_ref}})});
  assert.equal(restored.submitFeedback({thread_id: 't', feedback_id: 'feedback:a', text: 'Avoid jargon'}).disposition, 'replayed');
  assert.deepEqual(restored.submitFeedback({thread_id: 't', feedback_id: 'feedback:a', text: 'Changed'}).reason_codes,
    ['learning.feedback-id-conflict']);
  const pending = restored.submitFeedback({thread_id: 'other', feedback_id: 'feedback:pending', text: 'Unsupported'});
  assert.deepEqual(pending.reason_codes, ['learning.feedback-unclassified']);
  const listed = restored.listPendingFeedback({thread_id: 'other'});
  assert.deepEqual(listed.items, [{feedback_id: 'feedback:pending', text_digest: digestValue('Unsupported'),
    candidate_episode_ref: null}]);
  assert.equal(JSON.stringify(listed).includes('Unsupported'), false);
  assert.deepEqual(restored.listPendingFeedback({thread_id: 't'}).items, []);
  const replay = createInteractionLearningLifecycle({ledger: h.ledger, configuration, input_provider: () => ({})});
  assert.deepEqual(replay.listPendingFeedback({thread_id: 'other'}).items, listed.items);
  assert.equal(replay.submitFeedback({thread_id: 'other', feedback_id: 'feedback:pending', text: 'Unsupported'}).replayed, true);
  assert.deepEqual(replay.submitFeedback({thread_id: 'other', feedback_id: 'feedback:pending', text: 'Changed'}).reason_codes,
    ['learning.feedback-id-conflict']);
});
test('pending feedback can be explicitly dismissed with exact text and no learned lesson', () => {
  const h = harness(); h.set({});
  const input = {thread_id: 't', feedback_id: 'feedback:review', text: 'A task-specific correction'};
  assert.equal(h.life.submitFeedback(input).disposition, 'pending');
  assert.equal(h.life.listPendingFeedback({thread_id: 't'}).items[0].candidate_episode_ref, null);
  assert.equal(h.life.inspect().pending_feedback_count, 1);
  assert.deepEqual(h.life.dismissPendingFeedback({...input, text: 'Changed'}).reason_codes,
    ['learning.feedback-id-conflict']);
  assert.deepEqual(h.life.dismissPendingFeedback({...input, thread_id: 'other'}).reason_codes,
    ['learning.feedback-pending-not-found']);
  const dismissed = h.life.dismissPendingFeedback(input);
  assert.equal(dismissed.disposition, 'dismissed');
  assert.equal(dismissed.replayed, undefined);
  assert.equal(h.life.dismissPendingFeedback(input).replayed, true);
  assert.equal(h.life.submitFeedback(input).disposition, 'dismissed');
  assert.equal(h.life.inspect().lesson_count, 0);
  assert.equal(h.life.inspect().pending_feedback_count, 0);
  assert.deepEqual(h.life.listPendingFeedback({thread_id: 't'}).items, []);
  const reviewed = h.ledger.snapshot().find(event => event.event_kind === 'interaction-feedback-reviewed');
  assert.ok(reviewed);
  assert.equal(JSON.stringify(reviewed).includes(input.text), false);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration,
    input_provider: () => ({feedback})});
  assert.equal(restored.dismissPendingFeedback(input).replayed, true);
  assert.equal(restored.submitFeedback(input).disposition, 'dismissed');
  assert.equal(restored.inspect().lesson_count, 0);
  assert.equal(restored.inspect().pending_feedback_count, 0);
  assert.deepEqual(restored.listPendingFeedback({thread_id: 't'}).items, []);
});
test('pending attribution follows completed-event order across lexically reordered request IDs and replay', () => {
  const h = harness();
  h.step(6, 'First answered request', 'First answer');
  const latest = h.step(25, 'Second answered request', 'Second answer');
  h.set({});
  const input = {thread_id: 't', feedback_id: 'feedback:latest-order', text: 'Please clarify the latest answer.'};
  const pending = h.life.submitFeedback(input);
  assert.equal(pending.candidate_episode_ref, latest.p.request.request_ref);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration, input_provider: () => ({})});
  assert.equal(restored.listPendingFeedback({thread_id: 't'}).items[0].candidate_episode_ref,
    latest.p.request.request_ref);
  const afterRestart = restored.submitFeedback({...input, feedback_id: 'feedback:latest-after-restart'});
  assert.equal(afterRestart.candidate_episode_ref, latest.p.request.request_ref);
});
test('explicit pending review applies only to an exact completed answer and replays without a second lesson', () => {
  const h = harness();
  const first = h.step(1, 'Explain context management', 'A clear answer');
  h.set({});
  const input = {thread_id: 't', feedback_id: 'feedback:apply',
    text: 'Please make the answer clearer.', episode_ref: first.p.request.request_ref,
    quote: 'make the answer clearer', instruction: 'Use plain language.'};
  assert.equal(h.life.submitFeedback(input).disposition, 'pending');
  assert.equal(h.life.listPendingFeedback({thread_id: 't'}).items[0].candidate_episode_ref,
    first.p.request.request_ref);
  assert.deepEqual(h.life.applyPendingFeedback({...input, text: 'Changed make the answer clearer'}).reason_codes,
    ['learning.feedback-id-conflict']);
  assert.deepEqual(h.life.applyPendingFeedback({...input, thread_id: 'other'}).reason_codes,
    ['learning.feedback-pending-not-found']);
  assert.deepEqual(h.life.applyPendingFeedback({...input, episode_ref: 'missing'}).reason_codes,
    ['learning.feedback-attribution-unresolved']);
  const applied = h.life.applyPendingFeedback(input);
  assert.equal(applied.disposition, 'applied');
  assert.equal(applied.retention_scope, 'current-interaction');
  assert.equal(h.life.inspect().lesson_count, 1);
  assert.equal(h.life.inspect().pending_feedback_count, 0);
  assert.deepEqual(h.life.listPendingFeedback({thread_id: 't'}).items, []);
  assert.equal(h.life.applyPendingFeedback(input).replayed, true);
  assert.deepEqual(h.life.applyPendingFeedback({...input, instruction: 'Another instruction.'}).reason_codes,
    ['learning.feedback-review-conflict']);
  assert.deepEqual(h.life.dismissPendingFeedback(input).reason_codes, ['learning.feedback-already-applied']);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration, input_provider: () => ({})});
  assert.equal(restored.applyPendingFeedback(input).replayed, true);
  assert.equal(restored.submitFeedback(input).disposition, 'applied');
  assert.equal(restored.inspect().lesson_count, 1);
  assert.equal(restored.inspect().pending_feedback_count, 0);
  const saved = h.ledger.snapshot().find(event => event.content?.event?.pending_feedback_review);
  assert.ok(saved);
  assert.equal(JSON.stringify(saved).includes(input.text), false);
});
test('explicit one-time and task-only feedback cannot become a later-answer lesson', () => {
  const h = harness();
  const first = h.step(1, 'Explain context management', 'A clear answer');
  h.set({feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  const narrow = [
    'Just this once, use plain language.',
    'For this answer only, use plain language.',
    'For the next answer only, use plain language.',
    'Update this task only.',
  ];
  for (const [index, text] of narrow.entries()) {
    const input = {thread_id: 't', feedback_id: `feedback:narrow:${index}`, text,
      episode_ref: first.p.request.request_ref, quote: text.slice(0, -1),
      instruction: 'Use plain language for later answers.'};
    const pending = h.life.submitFeedback(input);
    assert.equal(pending.disposition, 'pending');
    assert.deepEqual(pending.reason_codes, ['learning.feedback-scope-conflict']);
    assert.deepEqual(h.life.applyPendingFeedback(input).reason_codes,
      ['learning.feedback-scope-conflict']);
  }
  assert.equal(h.life.inspect().lesson_count, 0);
  assert.equal(h.life.inspect().pending_feedback_count, narrow.length);
  const next = h.step(2, 'Just this once, use plain language.', 'A plain answer',
    {feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  assert.equal(next.p.pending_lesson, null);
  assert.equal(h.life.inspect().lesson_count, 0);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration,
    input_provider: () => ({feedback: {...feedback, episode_ref: first.p.request.request_ref}})});
  const replay = restored.submitFeedback({thread_id: 't', feedback_id: 'feedback:narrow:0', text: narrow[0]});
  assert.equal(replay.disposition, 'pending');
  assert.deepEqual(replay.reason_codes, ['learning.feedback-scope-conflict']);
  assert.equal(restored.inspect().lesson_count, 0);
});
test('pending review refuses an unanswered episode and cannot silently choose product retention', () => {
  const h = harness();
  const blank = h.step(1, 'Explain context management', null);
  h.set({});
  const input = {thread_id: 't', feedback_id: 'feedback:blank', text: 'Please make the answer clearer.',
    episode_ref: blank.p.request.request_ref, quote: 'make the answer clearer', instruction: 'Use plain language.'};
  assert.equal(h.life.submitFeedback(input).disposition, 'pending');
  assert.deepEqual(h.life.applyPendingFeedback(input).reason_codes, ['learning.feedback-attribution-unresolved']);
  assert.equal(h.life.inspect().pending_feedback_count, 1);
  assert.equal(h.life.inspect().lesson_count, 0);
});
test('explicit pending revision replaces only a lesson applied to the corrected answer', () => {
  const h = harness();
  const first = h.step(1, 'Explain context management', 'A clear answer');
  h.set({});
  const original = {thread_id: 't', feedback_id: 'feedback:original',
    text: 'Please make the answer clearer.', episode_ref: first.p.request.request_ref,
    quote: 'make the answer clearer', instruction: 'Use plain language.'};
  assert.equal(h.life.submitFeedback(original).disposition, 'pending');
  const applied = h.life.applyPendingFeedback(original);
  assert.equal(applied.revision, 1);
  assert.equal(applied.predecessor_digest, null);
  assert.deepEqual(h.life.listCurrentLessons({thread_id: 'other'}).items, []);
  assert.deepEqual(h.life.listCurrentLessons({thread_id: 't'}).items.map(item => item.lesson_id),
    [applied.lesson_id]);
  const second = h.step(2, 'Explain context again', 'A later answer');
  assert.equal(second.p.view.items[0].lesson_digest, applied.lesson_digest);
  assert.equal(addInteractionLearningContext(request(2), second.p).params.additionalContext[LEARNING_PRECEDENCE_CONTEXT_KEY], undefined);
  const revise = {thread_id: 't', feedback_id: 'feedback:revision',
    text: 'Please include one example in the answer.', episode_ref: second.p.request.request_ref,
    quote: 'include one example', instruction: 'Include one concrete example.',
    revises_lesson_id: applied.lesson_id, expected_lesson_digest: applied.lesson_digest};
  assert.equal(h.life.submitFeedback(revise).disposition, 'pending');
  assert.deepEqual(h.life.applyPendingFeedback({...revise, expected_lesson_digest: 'a'.repeat(64)}).reason_codes,
    ['learning.feedback-predecessor-not-applied']);
  assert.deepEqual(h.life.applyPendingFeedback({...revise, episode_ref: first.p.request.request_ref}).reason_codes,
    ['learning.feedback-predecessor-not-applied']);
  assert.deepEqual(h.life.applyPendingFeedback({...revise, expected_lesson_digest: undefined}).reason_codes,
    ['learning.feedback-review-predecessor-invalid']);
  const revised = h.life.applyPendingFeedback(revise);
  assert.equal(revised.disposition, 'applied');
  assert.equal(revised.lesson_id, applied.lesson_id);
  assert.equal(revised.revision, 2);
  assert.equal(revised.predecessor_digest, applied.lesson_digest);
  assert.notEqual(revised.lesson_digest, applied.lesson_digest);
  assert.equal(h.life.applyPendingFeedback(revise).replayed, true);
  assert.deepEqual(h.life.applyPendingFeedback({...revise, instruction: 'Different.'}).reason_codes,
    ['learning.feedback-review-conflict']);
  const listed = h.life.listCurrentLessons({thread_id: 't'});
  assert.deepEqual(listed.items, [{lesson_id: revised.lesson_id, lesson_digest: revised.lesson_digest,
    revision: 2, instruction: revise.instruction}]);
  const third = h.step(3, 'Explain context once more', 'A third answer');
  assert.deepEqual(third.p.view.items.map(item => item.instruction), [revise.instruction]);
  const forwarded = addInteractionLearningContext(request(3), third.p);
  const precedence = JSON.parse(forwarded.params.additionalContext[LEARNING_PRECEDENCE_CONTEXT_KEY].value);
  assert.equal(precedence.schema_version, 'are.interaction-learning-precedence/v1');
  assert.deepEqual(precedence.revisions, [{lesson_id: applied.lesson_id,
    current_lesson_digest: revised.lesson_digest, predecessor_lesson_digest: applied.lesson_digest}]);
  assert.equal(precedence.instruction.includes('Earlier versions in conversation history are superseded'), true);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration,
    input_provider: () => ({})});
  assert.equal(restored.applyPendingFeedback(revise).replayed, true);
  assert.deepEqual(restored.listCurrentLessons({thread_id: 't'}).items, listed.items);
  assert.equal(restored.inspect().lesson_count, 1);
  assert.equal(restored.inspect().pending_feedback_count, 0);
});
test('an unacknowledged pending-review write never dismisses feedback in memory', () => {
  const h = harness(); h.set({});
  const input = {thread_id: 't', feedback_id: 'feedback:unacknowledged', text: 'Unsupported correction'};
  assert.equal(h.life.submitFeedback(input).disposition, 'pending');
  const failed = createInteractionLearningLifecycle({ledger: {...h.ledger, append: () => undefined}, configuration});
  assert.deepEqual(failed.dismissPendingFeedback(input).reason_codes,
    ['learning.checkpoint-failed-restart-required']);
  assert.equal(failed.inspect().pending_feedback_count, 1);
  assert.deepEqual(failed.dismissPendingFeedback(input).reason_codes,
    ['learning.checkpoint-failed-restart-required']);
  assert.equal(createInteractionLearningLifecycle({ledger: h.ledger, configuration}).inspect().pending_feedback_count, 1);
});
test('pending dismissal survives a file-backed wrapper restart without a model turn', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'are-feedback-review-')); let wrapper;
  const create = () => createCodexAppServerWrapper({loaded_profile: {...loaded.value,
    interaction_learning: configuration,
    reasoning_state: {...loaded.value.reasoning_state, ledger_id: 'feedback-review-test',
      storage_mode: 'append-only-file-fsync', log_path: resolve(dir, 'events.jsonl'), single_writer: true}},
    decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot,
    interaction_input_provider: () => ({})});
  const rpc = (id, method) => ({jsonrpc: '2.0', id, method, params: {
    threadId: 't', feedbackId: 'feedback:file-review', text: 'A task-specific correction'}});
  try {
    wrapper = create();
    const pending = await wrapper.processClientMessage(rpc(1, 'cyberalchemy/learning/submitFeedback'));
    assert.equal(pending.to_server.length, 0);
    assert.equal(pending.to_client[0].result.disposition, 'pending');
    wrapper.close(); wrapper = create();
    const listed = await wrapper.processClientMessage({jsonrpc: '2.0', id: 4,
      method: 'cyberalchemy/learning/pendingFeedback/list', params: {threadId: 't'}});
    assert.equal(listed.to_server.length, 0);
    assert.equal(listed.to_client[0].result.items[0].feedback_id, 'feedback:file-review');
    assert.equal(JSON.stringify(listed).includes('A task-specific correction'), false);
    const dismissed = await wrapper.processClientMessage(rpc(2, 'cyberalchemy/learning/dismissPendingFeedback'));
    assert.equal(dismissed.to_server.length, 0);
    assert.equal(dismissed.to_client[0].result.disposition, 'dismissed');
    wrapper.close(); wrapper = create();
    assert.equal((await wrapper.processClientMessage(rpc(3, 'cyberalchemy/learning/submitFeedback')))
      .to_client[0].result.disposition, 'dismissed');
    assert.equal(wrapper.inspectLearningState().pending_feedback_count, 0);
    assert.equal(wrapper.inspectLearningState().lesson_count, 0);
    assert.equal(readFileSync(resolve(dir, 'events.jsonl'), 'utf8').includes('A task-specific correction'), false);
  } finally {wrapper?.close(); rmSync(dir, {recursive: true, force: true});}
});
test('inconclusive outcomes stay unknown, changed mind is not improvement evidence, and quoted feedback is rejected', () => {
  const h = harness(); const first = h.step(1, 'Explain context management', null, {checks: [check]});
  assert.equal(h.life.inspect({detail: true}).turns[first.p.request.request_ref].outcome.disposition, 'inconclusive');
  assert.equal(h.life.inspect({detail: true}).turns[first.p.request.request_ref].response_present, false);
  h.set({feedback: {...feedback, episode_ref: first.p.request.request_ref, quoted: true}});
  assert.equal(h.life.prepare(request(2, 'Avoid jargon')).ok, false);
  const answered = h.step(3, 'Explain context', 'jargon');
  h.step(4, 'Avoid jargon', 'plain', {feedback: {...feedback, correction_kind: 'changed-mind', episode_ref: answered.p.request.request_ref}});
  assert.equal(Object.values(h.life.inspect({detail: true}).lessons)[0].reflection.improvement_eligible, false);
});
test('unanswered completed episodes cannot receive response corrections through either ingress after replay', () => {
  for (const output of [null, '', '   ']) {
    const h = harness();
    const blank = h.step(1, 'Explain context', output);
    const before = JSON.stringify(h.ledger.snapshot());
    const corrections = {feedback: {...feedback, episode_ref: blank.p.request.request_ref}};
    const replay = createInteractionLearningLifecycle({ledger: h.ledger, configuration, input_provider: () => corrections});
    for (const life of [h.life, replay]) {
      if (life === h.life) h.set(corrections);
      assert.deepEqual(life.prepare(request(2, 'Avoid jargon')).reason_codes, ['learning.feedback-attribution-unresolved']);
      assert.deepEqual(life.submitFeedback({thread_id: 't', feedback_id: 'invalid-response', text: 'Avoid jargon'}).reason_codes,
        ['learning.feedback-attribution-unresolved']);
      assert.equal(life.inspect().lesson_count, 0);
      assert.equal(JSON.stringify(h.ledger.snapshot()), before);
    }
  }
});

test('answered episode attribution cannot cross threads or mutate the ledger on rejection', () => {
  const h = harness(); const answered = h.step(1, 'Explain context', 'A technical answer');
  h.set({feedback: {...feedback, episode_ref: answered.p.request.request_ref}});
  const before = JSON.stringify(h.ledger.snapshot());
  assert.deepEqual(h.life.prepare(request(2, 'Avoid jargon', 'other')).reason_codes,
    ['learning.feedback-attribution-unresolved']);
  assert.deepEqual(h.life.submitFeedback({thread_id: 'other', feedback_id: 'cross-thread', text: 'Avoid jargon'}).reason_codes,
    ['learning.feedback-attribution-unresolved']);
  assert.equal(h.life.inspect().lesson_count, 0);
  assert.equal(JSON.stringify(h.ledger.snapshot()), before);
});

test('completed turns checkpoint answer presence without retaining answer text', () => {
  const h = harness();
  const answered = h.step(1, 'Explain context', 'A response');
  const blank = h.step(2, 'Explain context', '   ');
  const state = h.life.inspect({detail: true});
  assert.equal(state.turns[answered.p.request.request_ref].response_present, true);
  assert.equal(state.turns[blank.p.request.request_ref].response_present, false);
  const restored = createInteractionLearningLifecycle({ledger: h.ledger, configuration}).inspect({detail: true});
  assert.equal(restored.turns[answered.p.request.request_ref].response_present, true);
  assert.equal(restored.turns[blank.p.request.request_ref].response_present, false);
});
test('interrupted and failed host turns cannot become feedback episode sources after restart', () => {
  for (const status of ['interrupted', 'failed']) {
    const h = harness(); h.set({});
    const first = h.life.prepare(request(1, 'Explain context'));
    assert.equal(first.ok, true);
    const contract = materializeIntentContract({request_ref: first.request.request_ref,
      request_digest: digestValue('Explain context'), objective: 'Explain context', target: 'response', disposition: 'act'});
    assert.equal(h.life.dispatch(first, digestValue(['dispatch', status]), digestValue('context'), contract).ok, true);
    assert.equal(h.life.bind('1', 't', 'turn:1').ok, true);
    assert.equal(h.life.complete({method: 'turn/completed', params: {threadId: 't',
      turn: {id: 'turn:1', status, items: [{type: 'agentMessage', text: 'partial answer'}]}}}).ok, true);
    const turn = h.life.inspect({detail: true}).turns[first.request.request_ref];
    assert.equal(turn.completion_status, 'noncompleted');
    assert.match(turn.outcome.evidence_ref, /:noncompleted$/u);
    const recovered = createInteractionLearningLifecycle({ledger: h.ledger, configuration,
      input_provider: () => ({feedback: {...feedback, episode_ref: first.request.request_ref}})});
    assert.equal(recovered.prepare(request(2, 'Avoid jargon')).reason_codes[0], 'learning.feedback-attribution-unresolved');
    assert.equal(Object.keys(recovered.inspect({detail: true}).lessons).length, 0);
  }
});
test('historical outcomes without a completion posture remain ineligible for new feedback', () => {
  const h = harness(); h.set({});
  const first = h.life.prepare(request(1, 'Explain context'));
  assert.equal(first.ok, true);
  const contract = materializeIntentContract({request_ref: first.request.request_ref,
    request_digest: digestValue('Explain context'), objective: 'Explain context', target: 'response', disposition: 'act'});
  assert.equal(h.life.dispatch(first, digestValue('legacy-dispatch'), digestValue('context'), contract).ok, true);
  assert.equal(h.life.bind('1', 't', 'turn:1').ok, true);
  const before = h.life.inspect({detail: true});
  const event = {event_id: 'legacy-outcome', kind: 'outcome', request_ref: first.request.request_ref,
    lessons: [], completion_digest: digestValue('legacy-completion'), observation: {
      request_ref: first.request.request_ref, turn_ref: before.turns[first.request.request_ref].turn_ref,
      output: 'A response', evidence_ref: 'codex:legacy:completed'}};
  const legacy = reduceInteractionState(before, event);
  assert.equal(Object.hasOwn(legacy.turns[first.request.request_ref], 'completion_status'), false);
  const snapshot = [...h.ledger.snapshot(), {event_kind: 'interaction-learning-transition', content: {
    binding: {participant_ref: configuration.participant_ref, product_ref: configuration.product_ref},
    event, state_digest: legacy.record_digest}}];
  const restored = createInteractionLearningLifecycle({ledger: {snapshot: () => snapshot}, configuration,
    input_provider: () => ({feedback: {...feedback, episode_ref: first.request.request_ref}})});
  assert.equal(restored.prepare(request(2, 'Avoid jargon')).reason_codes[0], 'learning.feedback-attribution-unresolved');
});
test('off, observe, explicit override, scope and invalidated evidence cannot silently apply lessons', () => {
  for (const mode of ['off', 'observe']) {
    const h = harness({configuration: {...configuration, policy: {mode}}}); const first = h.step(1, 'Explain context', 'jargon');
    const second = h.step(2, 'Avoid jargon', 'plain', {feedback: {...feedback, episode_ref: first.p.request.request_ref}});
    assert.equal(second.p.view.items.length, 0);
  }
  const h = harness(); const first = h.step(1, 'Explain context', 'jargon');
  h.step(2, 'Avoid jargon', 'plain', {feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  for (const options of [{target: 'code'}, {checks: [{check_id: 'override', kind: 'includes', value: 'jargon'}]}, {invalidated_refs: ['learning:["t",2]']}]) {
    h.set(options); assert.equal(h.life.prepare(request(3)).view.items.length, 0);
  }
  h.set({}); assert.equal(h.life.prepare(request(3, 'Explain context', 'other-thread')).view.items.length, 0);
  assert.equal(h.life.control({action: 'set-mode', control_id: 'mode1', mode: 'off'}).ok, true);
  assert.equal(h.life.prepare(request(3)).view.items.length, 0);
});
test('recurrence joins existing evolution records, preserves research-pending and replays without research', async () => {
  const h = harness({evolution: {implementation_binding: {path: 'private/test.mjs', sha256: 'a'.repeat(64)}}});
  for (let i = 1; i <= 3; i++) h.step(i, 'Explain context', 'jargon', {checks: [check]});
  assert.equal(h.life.inspect().progress.disposition, 'research-required');
  const result = await h.life.runEvolution(); assert.equal(result.disposition, 'research-pending');
  assert.equal(result.records.length, 3);
  assert.equal((await h.life.runEvolution()).disposition, 'research-pending');
  assert.equal(createInteractionLearningLifecycle({ledger: h.ledger, configuration}).inspect().progress.disposition, 'research-pending');
});
test('two no-gain attempts stop and a passing comparison only recommends a candidate', async () => {
  for (const gain of [0, 0.1]) {
    let calls = 0, searches = 0;
    const h = harness({evolution: {implementation_binding: {path: 'private/test.mjs', sha256: 'a'.repeat(64)},
      research_providers: [{id: 'local-fixture', search: async () => {searches++; return [];}}],
      run_experiment: async ({attempt}) => {calls++; return {variant_ref: `variant:${attempt}`, manifest_ref: 'frozen:test', environment_ref: 'node:test',
        baseline_metrics: {episode_success_rate: 0.5, scope_safety: 1, latency_ms: 100}, candidate_metrics: {episode_success_rate: 0.5 + gain, scope_safety: 1, latency_ms: 100},
        safety_passed: true, determinism_passed: true, holdout_passed: true, run_refs: ['run:a', 'run:b']};}}});
    for (let i = 1; i <= 3; i++) h.step(i, 'Explain context', 'jargon', {checks: [check]});
    const result = await h.life.runEvolution(); assert.equal(result.disposition, gain ? 'candidate-supported' : 'stopped-no-gain', JSON.stringify(result));
    assert.equal(calls, gain ? 1 : 2); assert.equal(searches, 1); assert.equal(result.authority_effect, 'none');
    await h.life.runEvolution(); assert.equal(searches, 1);
  }
});
test('real wrapper injects lesson into outgoing request and restores its application after file-ledger restart', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'are-learning-')); let w, feedbackInput = {};
  const create = () => createCodexAppServerWrapper({loaded_profile: {...loaded.value, interaction_learning: configuration,
    reasoning_state: {...loaded.value.reasoning_state, ledger_id: 'learning-test', storage_mode: 'append-only-file-fsync', log_path: resolve(dir, 'events.jsonl'), single_writer: true}},
    decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot,
    interaction_input_provider: () => feedbackInput});
  try {
    w = create(); const a = await w.processClientMessage(request(1)); assert.equal(a.to_server.length, 1, JSON.stringify(a.to_client));
    await w.processServerMessage({jsonrpc: '2.0', id: 1, result: {turn: {id: 'turn:1'}}});
    await w.processServerMessage({jsonrpc: '2.0', method: 'turn/completed', params: {threadId: 't', turn: {id: 'turn:1', status: 'completed', items: [{type: 'agentMessage', text: 'jargon'}]}}});
    feedbackInput = {feedback: {...feedback, episode_ref: 'learning:["t",1]'}};
    const b = await w.processClientMessage(request(2, 'Avoid jargon. Explain context management.'));
    assert.equal(b.to_server.length, 1, JSON.stringify(b.to_client));
    assert.equal(JSON.parse(b.to_server[0].params.additionalContext['cyberalchemy.are.interaction-learning'].value).items.length, 1);
    await w.processServerMessage({jsonrpc: '2.0', id: 2, result: {turn: {id: 'turn:2'}}});
    await w.processServerMessage({jsonrpc: '2.0', method: 'item/agentMessage/delta', params: {threadId: 't', turnId: 'turn:2', itemId: 'm', delta: 'plain explanation'}});
    await w.processServerMessage({jsonrpc: '2.0', method: 'turn/completed', params: {threadId: 't', turn: {id: 'turn:2', status: 'completed', items: []}}});
    const state = w.inspectLearningState({detail: true}); assert.equal(state.applications.at(-1).disposition, 'supported');
    const beforeObservation = readFileSync(resolve(dir, 'events.jsonl'), 'utf8');
    const observation = w.observeLearningFeedback({thread_id: 't'});
    assert.equal(observation.status, 'observed'); assert.equal(observation.durability, 'append-only-file-fsync');
    assert.equal(observation.retained_lesson_count, 1); assert.equal(observation.dispatched_application_count, 1);
    assert.equal(observation.evaluated_application_count, 1);
    assert.equal(readFileSync(resolve(dir, 'events.jsonl'), 'utf8'), beforeObservation);
    w.close(); feedbackInput = {}; w = create(); assert.deepEqual(w.inspectLearningState({detail: true}), state);
    const afterRestart = readFileSync(resolve(dir, 'events.jsonl'), 'utf8');
    assert.deepEqual(w.observeLearningFeedback({thread_id: 't'}), observation);
    assert.equal(readFileSync(resolve(dir, 'events.jsonl'), 'utf8'), afterRestart);
  } finally {w?.close(); rmSync(dir, {recursive: true, force: true});}
});
test('revision retains predecessor and user revocation wins over a later revision', () => {
  const h = harness(); const first = h.step(1, 'Explain context', 'jargon');
  h.step(2, 'Avoid jargon', 'plain', {feedback: {...feedback, episode_ref: first.p.request.request_ref}});
  const old = Object.values(h.life.inspect({detail: true}).lessons)[0];
  h.life.control({action: 'disable-reuse', control_id: 'user:disable', lesson_id: old.lesson_id});
  const revision = h.step(3, 'Avoid jargon', 'plain', {feedback: {...feedback, episode_ref: first.p.request.request_ref, revises_lesson_id: old.lesson_id}});
  const next = h.life.inspect({detail: true}).lessons[old.lesson_id];
  assert.equal(next.revision, 2); assert.equal(next.predecessor_digest, old.record_digest); assert.equal(revision.p.view.items.length, 0);
});
test('checkpoint failure blocks dispatch and later attempts, without a false acknowledged learning state', () => {
  const real = createReasoningStateLedger();
  const h = harness({ledger: {...real, checkpoint: () => ({ok: false, reason_codes: ['fixture:disk-failed']})}});
  assert.equal(h.life.prepare(request(1)).ok, false);
  assert.equal(h.life.prepare(request(2)).reason_codes[0], 'learning.checkpoint-failed-restart-required');
  assert.equal(h.life.inspect({detail: true}).revision, 0);
});
test('async attribution is rejected without an unhandled rejection; missing episode cannot become a lesson', async () => {
  const h = harness({input_provider: async () => {throw Error('fixture:adapter-failed');}});
  assert.equal(h.life.prepare(request(1)).reason_codes[0], 'learning.input-adapter-must-be-synchronous');
  await new Promise(resolve => setImmediate(resolve));
  const other = harness(); other.set({feedback: {...feedback, episode_ref: 'unknown'}});
  assert.equal(other.life.prepare(request(1, 'Avoid jargon')).reason_codes[0], 'learning.feedback-attribution-unresolved');
});
test('persisted policy survives a changed default and unknown output size does not become success', () => {
  const h = harness(); h.step(1, 'Explain context', 'x'.repeat(40000), {checks: [check]});
  assert.equal(Object.values(h.life.inspect({detail: true}).turns)[0].outcome.disposition, 'inconclusive');
  const restarted = createInteractionLearningLifecycle({ledger: h.ledger, configuration: {...configuration, policy: {mode: 'off'}}});
  assert.equal(restarted.inspect().mode, 'apply-scoped');
});
test('timed-out experiment leaves durable failure and cannot be rerun by repeated delivery', async () => {
  let calls = 0;
  const h = harness({evolution: {callback_timeout_ms: 10, research_providers: [{id: 'local', search: async () => []}],
    run_experiment: () => {calls++; return new Promise(() => {});}}});
  for (let i = 1; i <= 3; i++) h.step(i, 'Explain context', 'jargon', {checks: [check]});
  const result = await h.life.runEvolution(); assert.equal(result.disposition, 'failed'); assert.equal(result.reason, 'learning.callback-timeout');
  await h.life.runEvolution(); assert.equal(calls, 1);
});
test('protected regression stops after one attempt even when the target metric improves', async () => {
  let calls = 0;
  const h = harness({evolution: {research_providers: [{id: 'local', search: async () => []}], run_experiment: async () => {calls++;
    return {variant_ref: 'unsafe', manifest_ref: 'frozen:test', environment_ref: 'node:test', baseline_metrics: {episode_success_rate: 0.5, scope_safety: 1, latency_ms: 100},
      candidate_metrics: {episode_success_rate: 0.9, scope_safety: 0, latency_ms: 100}, safety_passed: false, determinism_passed: true, holdout_passed: true, run_refs: ['a','b']};}}});
  for (let i = 1; i <= 3; i++) h.step(i, 'Explain context', 'jargon', {checks: [check]});
  const result = await h.life.runEvolution(); assert.equal(result.disposition, 'treatment-rejected'); assert.equal(calls, 1);
});
test('one joined cycle closes three attributed failures through correction, later application, research and two distinct experiments', async () => {
  let searches = 0; const attempts = [];
  const h = harness({evolution: {research_providers: [{id: 'local-fixture', search: async () => {searches++; return [{source_ref:'fixture:research',source_version:'v1',mechanism:'Apply relevant explicit source before projection', evidence:['Labeled mock mechanism'],limitations:['Not empirical research']}];}}],
    run_experiment: async ({attempt, research_results}) => {assert.equal(research_results.length,1); attempts.push(attempt);
      return {variant_ref: `mock-distinct:${attempt}`, manifest_ref:'fixture:48',environment_ref:'mock:node',baseline_metrics:{episode_success_rate:0.5,scope_safety:1,latency_ms:100},
        candidate_metrics:{episode_success_rate:attempt===1?0.5:0.6,scope_safety:1,latency_ms:100},safety_passed:true,determinism_passed:true,holdout_passed:true,run_refs:['fixture:a','fixture:b']};}}});
  let first;
  for(let i=1;i<=3;i++) {const run=h.step(i,'Explain context','jargon',{checks:[check]}); first ??= run;}
  h.step(4,'Avoid jargon','plain',{feedback:{...feedback,episode_ref:first.p.request.request_ref}});
  const applied=h.step(5,'Explain context','plain'); assert.equal(applied.p.view.items.length,1);
  const result=await h.life.runEvolution(); assert.equal(result.disposition,'candidate-supported');
  assert.deepEqual(attempts,[1,2]);assert.equal(searches,1);
  assert.equal(result.attempts[0].comparison.outcome,'REJECT'); assert.equal(result.attempts[1].comparison.outcome,'KEEP');
  assert.equal(result.attempts[1].decision.next_action,'recommend-only product review');
  const recovered=createInteractionLearningLifecycle({ledger:h.ledger,configuration});
  assert.equal((await recovered.runEvolution()).disposition,'candidate-supported');assert.equal(searches,1);
});
test('completion replay rejects changed output under the same turn identity', () => {
  const h = harness(); const done = h.step(1,'Explain context','plain');
  assert.equal(h.life.complete(done.message).disposition,'replayed');
  assert.equal(h.life.complete({...done.message,params:{...done.message.params,turn:{...done.message.params.turn,items:[{type:'agentMessage',text:'changed'}]}}}).reason_codes[0],'learning.completion-identity-conflict');
});
test('loaded canary config preserves learning and requirement tracking; serving profile stays disabled', () => {
  assert.equal(loaded.value.interaction_learning.enabled,false);
  const canary=loadRepositoryProfile(resolve(root,'profiles/interaction-learning-canary-v1.json'),repo);
  assert.equal(canary.ok,true,JSON.stringify(canary.reason_codes));assert.equal(canary.value.interaction_learning.policy.mode,'apply-scoped');
  const dir=mkdtempSync(resolve(tmpdir(),'are-learning-config-'));
  try {
    const original=JSON.parse(readFileSync(resolve(root,'profiles/repository-v1.json'),'utf8'));
    original.objective_resolution={enabled:true,requirement_tracking:true};
    const path=resolve(dir,'profile.json');writeFileSync(path,JSON.stringify(original));
    const result=loadRepositoryProfile(path,repo);assert.equal(result.ok,true,JSON.stringify(result.reason_codes));assert.equal(result.value.objective_resolution.requirement_tracking,true);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
