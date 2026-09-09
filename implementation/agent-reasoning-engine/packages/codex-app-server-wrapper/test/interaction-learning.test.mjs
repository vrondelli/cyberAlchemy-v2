import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve} from 'node:path';
import {mkdtempSync, rmSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createCodexAppServerWrapper, createReasoningStateLedger, loadRepositoryProfile} from '../index.mjs';
import {createInteractionLearningLifecycle} from '../src/interaction-learning-lifecycle.mjs';
import {materializeIntentContract} from '../../request-intent-runtime/index.mjs';
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
  const life = createInteractionLearningLifecycle({ledger, configuration, input_provider: () => supplied, ...extra});
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
test('inconclusive outcomes stay unknown, changed mind is not improvement evidence, and quoted feedback is rejected', () => {
  const h = harness(); const first = h.step(1, 'Explain context management', null, {checks: [check]});
  assert.equal(h.life.inspect({detail: true}).turns[first.p.request.request_ref].outcome.disposition, 'inconclusive');
  h.set({feedback: {...feedback, episode_ref: first.p.request.request_ref, quoted: true}});
  assert.equal(h.life.prepare(request(2, 'Avoid jargon')).ok, false);
  h.step(3, 'Avoid jargon', 'plain', {feedback: {...feedback, correction_kind: 'changed-mind', episode_ref: first.p.request.request_ref}});
  assert.equal(Object.values(h.life.inspect({detail: true}).lessons)[0].reflection.improvement_eligible, false);
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
    w.close(); feedbackInput = {}; w = create(); assert.deepEqual(w.inspectLearningState({detail: true}), state);
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
