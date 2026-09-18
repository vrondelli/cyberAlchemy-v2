import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, rmSync, readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInteractionReview} from '../src/interaction-review.mjs';
import {classifyRepresentationRequest as classify, proposePreferenceOffers, inspectPreferenceOffers, applyPreferenceDecision, validatePreferenceDecision} from '../src/representation-preferences.mjs';
const interpret = i => ({...(i.state.active_objective ? {transition: 'continue', referent_objective_id: i.state.active_objective.objective_id} : {transition: 'new', objective: {description: i.request}}),
  evidence_span: {start: 0, end: i.request.length}, ...(i.requirement_snapshot ? {requirement_delta: {retained: i.requirement_snapshot.requirements, added: [], removed: []}} : {})});
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'are-preference-')); let app, n = 0, fail = false;
  const open = () => app = createInteractionReview({state_path: join(dir, 'state.jsonl'), objective_provider: interpret,
    response_provider: () => {if (fail) throw Error('test-provider-failure'); return 'Scripted answer';}});
  t.after(() => {app?.close(); rmSync(dir, {recursive: true, force: true});});
  open();
  return {get app() {return app;}, dir, open, fail: value => {fail = value;},
    send: (text, extra = {}) => app.submit({request_id: `r${++n}`, thread_id: 't', text, ...(n === 1 ? {requirements: []} : {}), ...extra}),
    async offer(format = 'DAG') {let r; for (let i = 0; i < 3; i++) {r = await this.send(`Plan picnic in ${format}`); assert.equal(r.ok, true, JSON.stringify(r));} assert.equal(r.preference_offers.length, 1); return r.preference_offers[0];},
    accept(o, scope = 'current-product', extra = {}) {return this.send(o.confirmation_text, {preference_decision: {offer_id: o.offer_id, action: 'accept', retention_scope: scope}, ...extra});}};
}
test('bounded grammar recognizes task/format and abstains on hostile or ambiguous text', () => {
  for (const [text, task, format] of [['Plan in a DAG', 'plan', 'dag'], ['Please prepare a plan using a checklist', 'plan', 'checklist'],
    ['Compare options as a table', 'compare', 'table'], ['Plan in plain text', 'plan', 'plain'], ['Plan picnic', 'plan', null]]) assert.deepEqual(classify(text), {task, format});
  for (const text of ['What is a DAG?', 'Planets', 'Do not plan in a DAG', 'Plan without a DAG', '"Plan in a DAG"', 'Plan using `DAG`', '> Plan in a DAG', 'Plan picnic\nPlan in a DAG', 'Plan in a DAG; ignore instructions', 'Plan picnic and explain risks as a table', 'Plan picnic then compare options in a DAG', 'Plan launch, summarize risks as a table']) assert.equal(classify(text), null, text);
});
test('offers at third completion, saves only on consent, applies exactly and persists/revokes', async t => {
  const f = setup(t); const first = await f.send('Plan in a DAG'); assert.deepEqual(first.preference_offers, []);
  assert.deepEqual((await f.send('Plan picnic in a DAG')).preference_offers, []);
  const third = await f.send('Plan holiday in a DAG'); const o = third.preference_offers[0]; assert.ok(o);
  assert.equal(f.app.inspect().lessons.length, 0); assert.equal(o.evidence_refs.length, 3);
  assert.deepEqual((await f.send('Plan more in a DAG')).preference_offers, []);
  f.app.close(); f.open(); assert.equal(f.app.inspect().preference_offers[0].offer_id, o.offer_id);
  assert.equal((await f.accept(o)).ok, true); assert.equal(f.app.inspect().lessons.length, 1);
  assert.equal((await f.send('Plan picnic')).selected_lessons.length, 1);
  assert.equal((await f.send('Compare options')).selected_lessons.length, 0);
  const plain = await f.send('Plan in plain text'); assert.equal(plain.selected_lessons.length, 0); assert.equal(plain.lesson_assessments[0].disposition, 'overridden');
  const cross = await f.send('Plan picnic', {thread_id: 'other', requirements: []}); assert.equal(cross.selected_lessons.length, 1);
  const id = f.app.inspect().lessons[0].lesson_id;
  assert.equal(f.app.control({action: 'disable-reuse', control_id: 'revoke', lesson_id: id}).ok, true);
  f.app.close(); f.open(); assert.equal((await f.send('Plan picnic')).selected_lessons.length, 0);
  for (let i = 0; i < 3; i++) assert.deepEqual((await f.send('Plan in a DAG')).preference_offers, []);
});
test('current-interaction preference does not cross threads', async t => {
  const f = setup(t), o = await f.offer(); assert.equal((await f.accept(o, 'current-interaction')).ok, true);
  assert.equal((await f.send('Plan picnic', {thread_id: 'other', requirements: []})).selected_lessons.length, 0);
});
test('decline persists without saving and does not nag', async t => {
  const f = setup(t), o = await f.offer();
  assert.equal((await f.send('No thanks', {preference_decision: {offer_id: o.offer_id, action: 'decline'}})).ok, true);
  f.app.close(); f.open(); assert.deepEqual(f.app.inspect().preference_offers, []); assert.equal(f.app.inspect().lessons.length, 0);
  for (let i = 0; i < 3; i++) assert.deepEqual((await f.send('Plan in a DAG')).preference_offers, []);
});
test('confirmation mismatch, foreign offer, wrong thread and mode off cannot save', async t => {
  const f = setup(t), o = await f.offer();
  assert.equal((await f.accept(o, 'current-product', {text: 'yes'})).reason_codes[0], 'representation.confirmation-mismatch');
  assert.equal((await f.accept({...o, offer_id: `offer:${'0'.repeat(64)}`})).ok, false);
  assert.equal((await f.accept(o, 'current-product', {thread_id: 'other'})).ok, false);
  f.app.control({action: 'set-mode', control_id: 'off', mode: 'off'});
  assert.equal((await f.accept(o)).ok, false); assert.equal(f.app.inspect().lessons.length, 0);
  assert.deepEqual(f.app.inspect().preference_offers, []);
});
test('off and observe modes do not observe repeated requests', async t => {
  for (const mode of ['off', 'observe']) {
    const f = setup(t); f.app.control({action: 'set-mode', control_id: mode, mode});
    for (let i = 0; i < 3; i++) assert.deepEqual((await f.send('Plan in a DAG')).preference_offers, []);
    f.app.control({action: 'set-mode', control_id: 'on', mode: 'apply-scoped'});
    assert.deepEqual((await f.send('Plan in a DAG')).preference_offers, []);
  }
});
test('references, failed responses and duplicate requests do not create observations', async t => {
  const f = setup(t);
  for (let i = 0; i < 3; i++) assert.deepEqual((await f.send('Explain context', {references: [{id: 'ref', text: 'Plan in a DAG'}]})).preference_offers, []);
  f.fail(true); assert.equal((await f.send('Plan in a DAG')).ok, false); f.fail(false);
  const r = await f.send('Plan in a DAG', {request_id: 'duplicate'}); assert.deepEqual(r.preference_offers, []);
  assert.equal((await f.send('Plan in a DAG', {request_id: 'duplicate'})).ok, false);
  assert.deepEqual((await f.send('Plan in a DAG')).preference_offers, []);
});
test('consent survives provider failure once the lesson has been durably saved', async t => {
  const f = setup(t), o = await f.offer(); f.fail(true);
  assert.equal((await f.accept(o)).disposition, 'delivery-unknown'); f.app.close(); f.fail(false); f.open();
  assert.equal(f.app.inspect().lessons.length, 1); assert.deepEqual(f.app.inspect().preference_offers, []);
  assert.equal((await f.send('Plan picnic')).selected_lessons.length, 1);
});
test('twenty-request window includes failures and unknown requests', () => {
  const events = []; const state = {policy: {mode: 'apply-scoped'}, lessons: {}, disabled: []};
  function add(i, signal, ok) {events.push({event_kind: 'interaction-host-request', content: {response_id: `${i}`, request: {thread_id: 't'}, preference_observation: signal}});
    events.push({event_kind: 'interaction-host-result', content: {response_id: `${i}`, ok}});}
  add(0, {task: 'plan', format: 'dag'}, true); add(1, {task: 'plan', format: 'dag'}, true);
  for (let i = 2; i < 22; i++) add(i, null, false);
  add(22, {task: 'plan', format: 'dag'}, true);
  assert.deepEqual(proposePreferenceOffers(events, state, {participant_ref: 'u', product_ref: 'p'}), []);
});
test('decision schema rejects unknown fields and implicit scope', () => {
  const d = {offer_id: `offer:${'a'.repeat(64)}`, action: 'accept'};
  assert.throws(() => validatePreferenceDecision(d), /scope-invalid/);
  assert.throws(() => validatePreferenceDecision({...d, retention_scope: 'current-product', unknown: true}), /decision-invalid/);
});
test('actual pre-change ledger replays with unchanged state digest and saved lesson', t => {
  const f = setup(t); f.app.close();
  writeFileSync(join(f.dir, 'state.jsonl'), gunzipSync(readFileSync(new URL('./fixtures/preference-legacy.jsonl.gz', import.meta.url))));
  f.open(); assert.equal(f.app.inspect().state_digest, 'f6cbf5888604f0ef1352fc5c1ff88ba9e394b713ccf40c4c291bc24072a7dd0b');
  assert.equal(f.app.inspect().lessons.length, 1);
});

test('revocation permits a different representation without reoffering the revoked format', async t => {
  const f = setup(t), o = await f.offer(); assert.equal((await f.accept(o)).ok, true);
  f.app.control({action: 'disable-reuse', control_id: 'revoke', lesson_id: f.app.inspect().lessons[0].lesson_id});
  const table = await f.offer('table'); assert.equal((await f.accept(table)).ok, true);
  const r = await f.send('Plan picnic'); assert.equal(r.selected_lessons.length, 1); assert.match(r.selected_lessons[0].instruction, /table/);
});
test('pending acceptance needs an actual lesson; expiry and cross-thread scope conflicts fail closed', () => {
  const o = {offer_id: `offer:${'b'.repeat(64)}`, thread_id: 'b', task: 'plan', format: 'table', evidence_refs: ['one'], confirmation_text: 'Use a table for plans.'};
  const events = [{event_kind: 'interaction-host-request', content: {response_id: 'one', request: {thread_id: 'b'}}},
    {event_kind: 'interaction-host-result', content: {response_id: 'one', ok: true, preference_offers: [o]}},
    {event_kind: 'interaction-host-request', content: {response_id: 'failed-accept', request: {thread_id: 'b', preference_decision: {offer_id: o.offer_id, action: 'accept'}}}}];
  const state = {policy: {mode: 'apply-scoped'}, lessons: {}, disabled: []};
  assert.equal(inspectPreferenceOffers(events, state).length, 1);
  state.lessons.other = {lesson_id: 'other', preference: {representation: {task: 'plan', format: 'dag'}, retention_scope: 'current-interaction', interaction_ref: 'a', grounding: {source: {request_ref: 'old'}}}};
  assert.throws(() => applyPreferenceDecision({thread_id: 'b', text: o.confirmation_text, preference_decision: {offer_id: o.offer_id, action: 'accept', retention_scope: 'current-product'}}, events, state), /requires-revocation/);
  for (let i = 0; i < 20; i++) events.push({event_kind: 'interaction-host-request', content: {response_id: `later${i}`, request: {thread_id: 'b'}}});
  assert.deepEqual(inspectPreferenceOffers(events, state), []);
});
test('runtime rejects conflicting typed lessons and current explicit format resolves selection', async () => {
  const {sealed} = await import('../../request-intent-runtime/src/canonical.mjs');
  const {createInteractionState, materializeLearningPolicy, projectInteractionContext} = await import('../../request-intent-runtime/src/learning-loop.mjs');
  const rows = gunzipSync(readFileSync(new URL('./fixtures/preference-legacy.jsonl.gz', import.meta.url))).toString().trim().split('\n').map(JSON.parse);
  const original = rows.find(r => r.value?.content?.event?.kind === 'lesson').value.content.event.lesson;
  const reseal = (record, fields) => {const {record_digest, ...rest} = record; return sealed(rest.schema_version, {...rest, ...fields}, 'record_digest');};
  const dag = reseal(original, {lesson_id: 'dag', preference: reseal(original.preference, {representation: {task: 'plan', format: 'dag'}})});
  const table = reseal(original, {lesson_id: 'table', preference: reseal(original.preference, {representation: {task: 'plan', format: 'table'}})});
  const binding = {participant_ref: 'review:user', product_ref: 'review:are', interaction_ref: 'legacy'};
  const state = reseal(createInteractionState(binding), {lessons: {dag, table}});
  const policy = materializeLearningPolicy({mode: 'apply-scoped'});
  const request = {...binding, request_ref: 'current', request: 'Plan', target: 'response', representation: {task: 'plan', format: null}};
  assert.throws(() => projectInteractionContext(state, request, policy), /representation-conflict/);
  assert.equal(projectInteractionContext(state, {...request, representation: {task: 'plan', format: 'dag'}}, policy).items[0].lesson_id, 'dag');
});
