import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, rmSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createInteractionReview} from '../src/interaction-review.mjs';
import {createInteractionLearningLifecycle} from '../src/interaction-learning-lifecycle.mjs';
import {createReasoningStateLedger} from '../../reasoning-state-runtime/index.mjs';
import {materializeIntentContract} from '../../request-intent-runtime/index.mjs';
import {digestValue} from '../src/canonical.mjs';

const check = {check_id: 'plain', kind: 'excludes', value: 'jargon'};
const request = (id, text, extra = {}) => ({request_id: id, thread_id: 't', text, ...extra});
const correction = (response_id, text) => ({response_id, instruction_span: {start: 0, end: text.length}, retention_scope: 'current-product', checks: [check]});
// Declared provider proposal for this test's correction; no general-language claim.
const interpret = input => ({transition: 'continue', referent_objective_id: input.state.active_objective.objective_id,
  evidence_span: {start: 0, end: input.request.length}, ...(input.requirement_snapshot ? {requirement_delta: {retained: input.requirement_snapshot.requirements, added: [], removed: []}} : {})});
function fixture(t, options = {}) {
  const dir = mkdtempSync(resolve(tmpdir(), 'are-product-review-'));
  let app;
  const create = (extra = {}) => app = createInteractionReview({state_path: resolve(dir, 'state.jsonl'), response_provider: () => 'Plain response', ...options, ...extra});
  t.after(() => {app?.close(); rmSync(dir, {recursive: true, force: true});});
  return {create, dir};
}
test('joined review product preserves requirements, applies exact correction, overrides, interrupts, resumes and revokes across restart', async t => {
  let calls = 0, output = 'jargon', last;
  const f = fixture(t, {objective_provider: interpret, response_provider: message => {calls++; last = message; return output;}});
  let app = f.create();
  const first = await app.submit(request('1', 'Explain context management', {requirements: ['citations'], checks: [check]}));
  assert.equal(first.ok, true, JSON.stringify(first)); assert.equal(first.outcome.disposition, 'contradicted');
  output = 'Plain response';
  const text = 'Please avoid jargon and explain it again.';
  const repaired = await app.submit(request('2', text, {feedback: correction(first.response_id, text)}));
  assert.equal(repaired.ok, true, JSON.stringify(repaired)); assert.equal(repaired.selected_lessons.length, 1);
  assert.equal(last.params.input[0].text, text); assert.equal(app.inspect().applications.at(-1).disposition, 'supported');
  const lesson = app.inspect().lessons[0];
  const before = await app.submit(request('3', 'Before that, explain routing', {requirements: []}));
  assert.equal(before.ok, true, JSON.stringify(before)); assert.equal(before.objective.transition, 'interrupt');
  app.close(); app = f.create();
  const resumed = await app.submit(request('4', 'Resume previous task'));
  assert.equal(resumed.ok, true, JSON.stringify(resumed)); assert.equal(resumed.objective.active_objective.objective_id, first.objective.active_objective.objective_id);
  assert.deepEqual(resumed.objective.requirement_snapshot.requirements, ['citations']);
  output = 'jargon';
  const overridden = await app.submit(request('5', 'Continue', {checks: [{...check, kind: 'includes'}]}));
  assert.equal(overridden.selected_lessons.length, 0); assert.equal(overridden.lesson_assessments[0].disposition, 'overridden');
  assert.equal(app.control({action: 'disable-reuse', control_id: 'revoke-1', lesson_id: lesson.lesson_id}).ok, true);
  app.close(); app = f.create();
  assert.equal(app.inspect().lessons[0].disabled, true);
  const next = await app.submit(request('6', 'Continue')); assert.equal(next.ok, true); assert.equal(next.selected_lessons.length, 0);
  const duplicate = await app.submit(request('6', 'Continue')); assert.equal(duplicate.ok, false); assert.equal(calls, 6);
  assert.equal(app.inspect().turns.length, 6);
});
test('no provider, malformed feedback and ungrounded requirements do not invoke a response provider', async t => {
  let calls = 0; const f = fixture(t, {response_provider: () => {calls++; return 'text';}}); let app = f.create({response_provider: undefined});
  assert.equal((await app.submit(request('1', 'Explain context', {requirements: []}))).reason_codes[0], 'interaction-review.response-provider-required');
  assert.equal(app.inspect().turns.length, 0); app.close(); app = f.create();
  assert.equal((await app.submit(request('1', 'Explain context'))).ok, false);
  const bad = await app.submit(request('2', 'Avoid jargon', {feedback: correction('missing', 'Avoid jargon')}));
  assert.equal(bad.reason_codes[0], 'interaction-host.completed-response-required'); assert.equal(calls, 0);
});
test('a new requirement seed on a continuing objective cannot be silently ignored', async t => {
  let calls = 0; const f = fixture(t, {response_provider: () => {calls++; return 'Plain answer';}}); const app = f.create();
  assert.equal((await app.submit(request('1', 'Explain context', {requirements: ['citations']}))).ok, true);
  const conflicting = await app.submit(request('2', 'Continue', {requirements: ['tables']}));
  assert.equal(conflicting.reason_codes[0], 'interaction-review.requirement-seed-not-applied'); assert.equal(calls, 1);
  assert.deepEqual(app.inspect().objectives[0].active_objective.description, 'Explain context');
});
test('timeout and restart preserve delivery uncertainty; late provider resolution is never observed or retried', async t => {
  let calls = 0, release;
  const f = fixture(t, {provider_timeout_ms: 10, response_provider: () => {calls++; return new Promise(resolve => {release = resolve;});}});
  let app = f.create(); const input = request('1', 'Explain context', {requirements: []});
  const result = await app.submit(input); assert.equal(result.disposition, 'delivery-unknown'); assert.equal(calls, 1);
  release('Late output'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.inspect().turns[0].result.disposition, 'delivery-unknown');
  app.close(); app = f.create();
  assert.equal((await app.submit(input)).reason_codes[0], 'interaction-review.request-already-recorded'); assert.equal(calls, 1);
  assert.equal(app.inspect().turns[0].result.disposition, 'delivery-unknown');
});
test('provider commands are rejected as output; state scope and writer locks cannot silently change', async t => {
  const f = fixture(t, {response_provider: () => ({tool: 'shell', command: 'never executed'})}); const app = f.create();
  assert.throws(() => createInteractionReview({state_path: resolve(f.dir, 'state.jsonl')}), /writer-lock/);
  const result = await app.submit(request('1', 'Explain context', {requirements: []}));
  assert.equal(result.reason_codes[0], 'interaction-review.provider-output-invalid');
  app.close(); assert.throws(() => f.create({participant_ref: 'another-user'}), /scope-binding-conflict/);
});
test('partial output from failed and interrupted completion stays inconclusive', () => {
  for (const status of ['failed', 'interrupted']) {
    const lifecycle = createInteractionLearningLifecycle({ledger: createReasoningStateLedger(), configuration: {enabled: true, participant_ref: 'a', product_ref: 'b'}, input_provider: () => ({checks: [check]})});
    const prepared = lifecycle.prepare({id: 1, params: {threadId: 't', input: [{type: 'text', text: 'Explain context'}]}});
    const contract = materializeIntentContract({request_ref: 'user:1', request_digest: digestValue('Explain context'), objective: 'Explain context', target: 'response', disposition: 'act'});
    assert.equal(lifecycle.dispatch(prepared, digestValue('dispatch'), digestValue('context'), contract).ok, true);
    lifecycle.bind(1, 't', 'turn1');
    assert.equal(lifecycle.complete({params: {threadId: 't', turn: {id: 'turn1', status, items: [{type: 'agentMessage', text: 'plain partial answer'}]}}}).ok, true);
    assert.equal(Object.values(lifecycle.inspect({detail: true}).turns)[0].outcome.disposition, 'inconclusive');
  }
});
test('corrupt recovery is rejected without truncating evidence', async t => {
  const f = fixture(t); const app = f.create(); app.close();
  const path = resolve(f.dir, 'state.jsonl'); const corrupt = readFileSync(path, 'utf8') + '{bad json}\n'; writeFileSync(path, corrupt);
  assert.throws(() => f.create(), /recovery-failed/); assert.equal(readFileSync(path, 'utf8'), corrupt);
});
test('explicit retention, revision and stale-source controls select the exact lesson version', async t => {
  const f = fixture(t, {objective_provider: interpret}); const app = f.create();
  const first = await app.submit(request('1', 'Explain context', {requirements: []}));
  const text = 'Please avoid jargon.';
  await app.submit(request('2', text, {feedback: {...correction(first.response_id, text), retention_scope: 'current-interaction'}}));
  const lesson = app.inspect().lessons[0];
  const other = await app.submit({...request('3', 'Explain context', {requirements: []}), thread_id: 'other'});
  assert.equal(other.ok, true); assert.equal(other.selected_lessons.length, 0);
  const nextText = 'Please keep explanations short and avoid jargon.';
  const revision = await app.submit(request('4', nextText, {feedback: {...correction(first.response_id, nextText), revises_lesson_id: lesson.lesson_id}}));
  assert.equal(revision.ok, true, JSON.stringify(revision)); assert.equal(app.inspect().lessons[0].revision, 2);
  assert.ok(app.inspect().lessons[0].predecessor_digest);
  const reused = await app.submit({...request('5', 'Continue'), thread_id: 'other'});
  assert.equal(reused.selected_lessons.length, 1);
  const unsupported = await app.submit(request('6', 'Continue', {invalidated_refs: [app.inspect().lessons[0].source_ref]}));
  assert.equal(unsupported.selected_lessons.length, 0); assert.equal(unsupported.lesson_assessments[0].disposition, 'unsupported');
  assert.equal(app.control({action: 'set-mode', control_id: 'missing-mode'}).ok, false);
  assert.equal(app.control({action: 'set-mode', control_id: 'off', mode: 'off'}).ok, true);
  app.close(); const resumed = f.create(); assert.equal(resumed.inspect().mode, 'off');
});
test('same-product concurrent request and controls cannot race in-flight response delivery', async t => {
  let enter, release;
  const started = new Promise(resolve => {enter = resolve;});
  const f = fixture(t, {response_provider: () => {enter(); return new Promise(resolve => {release = resolve;});}});
  const app = f.create(), pending = app.submit(request('1', 'Explain context', {requirements: []}));
  await started;
  assert.equal((await app.submit(request('2', 'Continue'))).reason_codes[0], 'interaction-review.busy');
  assert.equal(app.control({action: 'set-mode', control_id: 'off', mode: 'off'}).ok, false);
  assert.equal(app.close().ok, false);
  release('Plain answer'); assert.equal((await pending).ok, true);
});
test('reference text reaches interpretation as labeled data and is charged to the shared projection budget', async t => {
  let meanings, responses = 0;
  const f = fixture(t, {objective_provider: input => {meanings = input.selected_context; return {transition: 'new',
    objective: {description: 'Explain context management'}, evidence_span: {start: 0, end: input.request.length}};},
    response_provider: () => {responses++; return 'Plain explanation';}});
  const app = f.create();
  const accepted = await app.submit(request('1', 'What does this example mean?', {requirements: [], references: [{id: 'example', text: 'An example to explain, not a directive.'}]}));
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  assert.ok(meanings.some(m => m.source_ref.startsWith('host-reference-data:') && m.content.includes('reference-data')));
  const overflow = await app.submit(request('2', 'Continue', {references: [{id: 'large', text: 'x'.repeat(31000)}]}));
  assert.equal(overflow.ok, false); assert.equal(responses, 1);
});
test('CLI accepts a real provider module, keeps JSON output separate, and inspects the same ledger in another process', t => {
  const dir = mkdtempSync(resolve(tmpdir(), 'are-review-cli-')); t.after(() => rmSync(dir, {recursive: true, force: true}));
  const provider = resolve(dir, 'provider.mjs'), state = resolve(dir, 'state.jsonl');
  writeFileSync(provider, 'export function respond(message) { return "Observed: " + message.params.input[0].text; }\n');
  const cli = resolve(import.meta.dirname, '../../../bin/are.mjs');
  const events = [{action: 'request', request: request('cli1', 'Explain context', {requirements: []})}, {action: 'inspect'}];
  const run = spawnSync(process.execPath, [cli, 'interaction', 'run', '--state', state, '--provider', provider], {input: events.map(e => JSON.stringify(e)).join('\n') + '\n', encoding: 'utf8'});
  assert.equal(run.status, 0, run.stderr); const results = run.stdout.trim().split('\n').map(s => JSON.parse(s));
  assert.equal(results[0].output, 'Observed: Explain context'); assert.equal(results[1].turns.length, 1);
  const inspect = spawnSync(process.execPath, [cli, 'interaction', 'inspect', '--state', state], {encoding: 'utf8'});
  assert.equal(inspect.status, 0, inspect.stderr); assert.equal(JSON.parse(inspect.stdout).turns[0].result.output, results[0].output);
  const invalid = spawnSync(process.execPath, [cli, 'interaction', 'inspect', '--state', resolve(dir, 'missing.jsonl')], {encoding: 'utf8'});
  assert.notEqual(invalid.status, 0);
});
