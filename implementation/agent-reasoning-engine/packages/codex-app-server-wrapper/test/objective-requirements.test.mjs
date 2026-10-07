import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createCodexAppServerWrapper, createReasoningStateLedger, loadRepositoryProfile} from '../index.mjs';
import {materializeRequirementSnapshot, digestIntentMaterial} from '../../request-intent-runtime/index.mjs';
import {createCodexObjectiveLifecycle, OBJECTIVE_CONTEXT_KEY} from '../src/objective-lifecycle.mjs';
import {REQUEST_CONTEXT_KEY} from '../src/request-context.mjs';
import {verifyRequirementContinuityReplay} from '../src/objective-requirements.mjs';
import {verifyCodexModelEntryReceipt} from '../src/model-entry-receipt.mjs';
import {semanticModulePort} from './semantic-module-fixture.mjs';

const root = resolve(import.meta.dirname, '..');
const repo = resolve(root, '../../../../..');
const profilePath = resolve(root, 'profiles/repository-v1.json');
const loaded = loadRepositoryProfile(profilePath, repo);
assert.equal(loaded.ok, true, loaded.reason_codes?.join(','));
const config = {enabled: true, requirement_tracking: true};
const request = (id, text, threadId = 'requirements-thread') => ({jsonrpc: '2.0', id, method: 'turn/start', params: {threadId, input: [{type: 'text', text}]}});
const seed = (input, requirements = ['citations']) => materializeRequirementSnapshot({consumer_ref: input.state.consumer_ref,
  scope_ref: input.state.scope_ref, objective_id: input.state.active_objective.objective_id,
  objective_state_digest: input.state.state_digest, requirements, source_refs: [input.request_ref, 'fixture:explicit-user-requirements']});
const create = (overrides = {}, profile = {}) => createCodexAppServerWrapper({
  loaded_profile: {...loaded.value, objective_resolution: config, ...profile},
  decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
  ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot,
  requirement_seed_provider: seed, module_port: semanticModulePort(), ...overrides});
const forward = action => {
  assert.equal(action.to_server.length, 1, JSON.stringify(action.to_client));
  return JSON.parse(action.to_server[0].params.additionalContext[OBJECTIVE_CONTEXT_KEY].value);
};
const reason = action => {assert.equal(action.to_server.length, 0); return action.to_client[0].error.data.reason_codes;};
const initial = 'Research context management approaches.';
const continuityEvents = ledger => ledger.snapshot().filter(e => e.event_kind === 'objective-transition-resolved');
const active = result => result.requirement_continuity.snapshots.find(s => s.objective_id === result.resolution.next_state.active_objective.objective_id);
function lifecycle(options = {}) {
  return createCodexObjectiveLifecycle({ledger: createReasoningStateLedger(), profile_id: 'test', configuration: config, requirement_seed_provider: seed, module_port: semanticModulePort(), ...options});
}
const prepare = (life, id, text) => life.prepare(request(id, text), {consumer_ref: 'consumer'});

test('actual outgoing requests preserve exact requirements through local operations without a model', async () => {
  let modelCalls = 0, seedCalls = 0;
  const ledger = createReasoningStateLedger();
  const w = create({reasoning_ledger: ledger, objective_provider: () => {modelCalls++; throw Error('unexpected');},
    requirement_seed_provider: input => {seedCalls++; return seed(input);}});
  const firstAction = await w.processClientMessage(request(1, initial));
  const first = forward(firstAction);
  assert.equal(firstAction.model_entry_receipts?.length, 1);
  const receipt = firstAction.model_entry_receipts[0];
  assert.equal(verifyCodexModelEntryReceipt(receipt,
    {forwarded_message: firstAction.to_server[0]}), true);
  assert.equal(receipt.objective_resolution_digest, first.resolution_digest);
  assert.equal(receipt.requirement_continuity_digest, first.requirement_continuity_digest);
  assert.equal(receipt.objective_state_digest, first.state_digest);
  assert.equal(receipt.source, 'direct');
  assert.equal(verifyCodexModelEntryReceipt({...receipt, route_id: 'forged'},
    {forwarded_message: firstAction.to_server[0]}), false);
  assert.equal(verifyCodexModelEntryReceipt(receipt,
    {forwarded_message: request(99, 'Different request')}), false);
  assert.equal(verifyCodexModelEntryReceipt(receipt,
    {forwarded_message: firstAction.to_server[0], request_binding_digest: 'a'.repeat(64)}), false);
  assert.doesNotMatch(JSON.stringify(receipt), /Research context management approaches|citations/u);
  assert.equal(first.schema_version, 'are.codex-objective-fragment/v2');
  assert.deepEqual(first.requirement_snapshot.requirements, ['citations']);
  for (const [id, text, expected, transition] of [
    [2, 'Please add table to the requirements.', ['citations', 'table'], 'refine'],
    [3, 'Can you remove citations from the requirements?', ['table'], 'refine'],
    [4, 'Keep table as a requirement.', ['table'], 'continue'],
    [5, 'do next', ['table'], 'continue'],
    [6, 'Add table to the requirements.', ['table'], 'continue'],
  ]) {
    const action = await w.processClientMessage(request(id, text));
    const current = forward(action);
    assert.deepEqual(current.requirement_snapshot.requirements, expected);
    assert.equal(current.transition, transition);
    assert.equal(current.requirement_snapshot.objective_state_digest, current.state_digest);
    assert.equal(current.active_objective.objective_id, first.active_objective.objective_id);
    assert.equal(current.requirement_snapshot.authority_effect, 'none');
    assert.equal(action.to_server[0].params.input[0].text, text);
    assert.equal(action.model_entry_receipts?.length, 1);
    assert.equal(verifyCodexModelEntryReceipt(action.model_entry_receipts[0],
      {forwarded_message: action.to_server[0]}), true);
    assert.equal(action.model_entry_receipts[0].objective_state_digest, current.state_digest);
  }
  assert.equal(seedCalls, 1); assert.equal(modelCalls, 0);
  assert.equal(continuityEvents(ledger).length, 6);
  assert.ok(!JSON.stringify(w.inspectState().objective_states).includes('citations'));
  w.close();
});

test('receipt remains absent when objective resolution is disabled', async () => {
  const w = create({}, {objective_resolution: {enabled: false}});
  try {
    const action = await w.processClientMessage(request(1, initial));
    assert.equal(action.to_server.length, 1);
    assert.equal(Object.hasOwn(action, 'model_entry_receipts'), false);
  } finally {w.close();}
});

test('automatic successor carries a receipt for its own forwarded request', async () => {
  const w = create({objective_provider: input => input.request === 'Validate the bounded result.'
    ? {transition: 'new', objective: {description: input.request},
      evidence_span: {start: 0, end: input.request.length}} : null});
  try {
    const started = await w.processClientMessage(request(1, initial));
    assert.equal(started.to_server.length, 1);
    await w.processServerMessage({jsonrpc: '2.0', id: 1, result: {turn: {id: 'turn-1'}}});
    const proposal = {proposal_id: 'P1', declared_plan_digest: 'plan:P1', action_ref: 'validate',
      route_id: 'CA2-ROUTE-VALIDATE', objective_kind: 'validate', effect_classes: ['non-effectful-validate'],
      reversible: true, evidence_refs: ['plan:P1'], next_turn: {params: {threadId: 'requirements-thread',
        input: [{type: 'text', text: 'Validate the bounded result.'}]}}};
    const registration = await w.processClientMessage({jsonrpc: '2.0', id: 2,
      method: 'cyberalchemy/continuation/registerPlan', params: {threadId: 'requirements-thread', proposal}});
    assert.equal(registration.to_client[0].result.registered, true);
    const completed = await w.processServerMessage({jsonrpc: '2.0', method: 'turn/completed',
      params: {threadId: 'requirements-thread', turn: {id: 'turn-1', items: [], status: 'completed'}}});
    assert.equal(completed.to_server.length, 1, JSON.stringify(completed.to_client));
    assert.equal(completed.model_entry_receipts?.length, 1);
    const receipt = completed.model_entry_receipts[0];
    assert.equal(receipt.source, 'generated');
    assert.equal(verifyCodexModelEntryReceipt(receipt, {forwarded_message: completed.to_server[0]}), true);
    assert.notEqual(receipt.forwarded_message_digest, started.model_entry_receipts[0].forwarded_message_digest);
  } finally {w.close();}
});

test('interruption and restart restore the suspended objective requirement set without reseeding', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'are-requirement-restart-'));
  const profile = {reasoning_state: {...loaded.value.reasoning_state, ledger_id: 'requirement-restart',
    storage_mode: 'append-only-file-fsync', log_path: resolve(dir, 'events.jsonl'), single_writer: true}};
  let w;
  try {
    w = create({requirement_seed_provider: input => seed(input, input.request.startsWith('Before') ? ['plain language'] : ['citations'])}, profile);
    const first = forward(await w.processClientMessage(request(1, initial)));
    forward(await w.processClientMessage(request(2, 'Add table to the requirements.')));
    const interruption = forward(await w.processClientMessage(request(3, 'Before that, explain routing')));
    assert.deepEqual(interruption.requirement_snapshot.requirements, ['plain language']);
    w.close();
    w = create({requirement_seed_provider: () => {throw Error('must not seed on replay');}}, profile);
    const resumed = forward(await w.processClientMessage(request(4, 'Resume previous task')));
    assert.equal(resumed.active_objective.objective_id, first.active_objective.objective_id);
    assert.deepEqual(resumed.requirement_snapshot.requirements, ['citations', 'table']);
    assert.deepEqual(reason(await w.processClientMessage(request(4, 'Resume previous task'))), ['objective.request-already-recorded-dispatch-not-retried']);
    assert.deepEqual(reason(await w.processClientMessage(request(4, 'Remove table from the requirements.'))), ['objective.request-identity-conflict']);
    const continued = forward(await w.processClientMessage(request(5, 'do next')));
    assert.deepEqual(continued.requirement_snapshot.requirements, ['citations', 'table']);
  } finally {w?.close(); rmSync(dir, {recursive: true, force: true});}
});

test('replacing work retires its requirements; a new task parks them', async () => {
  const ledger = createReasoningStateLedger();
  const life = lifecycle({ledger, requirement_seed_provider: input => seed(input, [input.request])});
  const a = await prepare(life, 1, initial);
  const b = await prepare(life, 2, 'New task: Research another topic');
  assert.equal(b.requirement_continuity.snapshots.length, 2);
  const c = await prepare(life, 3, 'Instead, explain context');
  assert.equal(c.requirement_continuity.snapshots.length, 2);
  assert.ok(!c.requirement_continuity.snapshots.some(s => s.objective_id === b.resolution.next_state.active_objective.objective_id));
  assert.ok(c.requirement_continuity.snapshots.some(s => s.objective_id === a.resolution.next_state.active_objective.objective_id));
  assert.equal(lifecycle({ledger}).inspect().length, 1);
});

test('explicit empty seed is distinct from missing seed', async () => {
  const missing = create({requirement_seed_provider: undefined});
  assert.deepEqual(reason(await missing.processClientMessage(request(1, initial))), ['requirements.explicit-seed-required']);
  assert.deepEqual(missing.inspectState().objective_states, []);
  const empty = create({requirement_seed_provider: input => seed(input, [])});
  assert.deepEqual(forward(await empty.processClientMessage(request(1, initial))).requirement_snapshot.requirements, []);
  missing.close(); empty.close();
});

test('an exact attested hosted hint seeds requirements; missing or unverified hints cannot', async () => {
  const w = create({requirement_seed_provider: undefined});
  const hosted = request(1, initial);
  hosted.params.additionalContext = {[REQUEST_CONTEXT_KEY]: {kind: 'application', value: JSON.stringify({
    schema_version: 'are.request-context-hint/v1', raw_request: initial,
    requirement_seed: ['citations'],
  })}};
  assert.deepEqual(reason(await w.processClientMessage(hosted)), ['requirements.seed-unverified']);
  const first = forward(await w.processClientMessage(hosted, {hosted_input_verified: true}));
  assert.deepEqual(first.requirement_snapshot.requirements, ['citations']);
  const continued = forward(await w.processClientMessage(request(2, 'do next')));
  assert.deepEqual(continued.requirement_snapshot.requirements, ['citations']);
  const other = request(3, 'New task: Research another topic');
  assert.deepEqual(reason(await w.processClientMessage(other, {hosted_input_verified: true})),
    ['requirements.explicit-seed-required']);
  w.close();
});

test('hosted requirement hint must bind exact user text and a bounded unique list', async () => {
  const w = create({requirement_seed_provider: undefined});
  const hinted = (seed, raw = initial) => {
    const message = request(1, initial);
    message.params.additionalContext = {[REQUEST_CONTEXT_KEY]: {kind: 'application', value: JSON.stringify({
      schema_version: 'are.request-context-hint/v1', raw_request: raw, requirement_seed: seed,
    })}};
    return message;
  };
  assert.deepEqual(reason(await w.processClientMessage(hinted(['citations'], 'Different request'),
    {hosted_input_verified: true})), ['requirements.seed-request-mismatch']);
  assert.deepEqual(reason(await w.processClientMessage(hinted(['citations', 'citations']),
    {hosted_input_verified: true})), ['requirements.seed-invalid']);
  assert.deepEqual(forward(await w.processClientMessage(hinted([]),
    {hosted_input_verified: true})).requirement_snapshot.requirements, []);
  w.close();
});

test('a signed hosted seed cannot be accepted without tracking', async () => {
  const w = create({}, {objective_resolution: {enabled: true, requirement_tracking: false}});
  const message = request(1, initial);
  message.params.additionalContext = {[REQUEST_CONTEXT_KEY]: {kind: 'application', value: JSON.stringify({
    schema_version: 'are.request-context-hint/v1', raw_request: initial,
    requirement_seed: ['citations'],
  })}};
  assert.deepEqual(reason(await w.processClientMessage(message, {hosted_input_verified: true})),
    ['requirements.tracking-not-configured']);
  w.close();
});

test('host seed must bind the request, consumer, scope, objective and next state exactly', async () => {
  for (const change of [{consumer_ref: 'other'}, {scope_ref: 'other'}, {objective_id: 'other'},
    {objective_state_digest: 'a'.repeat(64)}, {source_refs: ['not-this-request']}]) {
    const life = lifecycle({requirement_seed_provider: input => {
      const {schema_version, authority_effect, snapshot_digest, ...values} = seed(input);
      return materializeRequirementSnapshot({...values, ...change});
    }});
    const result = await prepare(life, 1, initial);
    assert.equal(result.ok, false); assert.deepEqual(result.reason_codes, ['requirements.seed-binding-invalid']);
    assert.deepEqual(life.inspect(), []);
  }
});

test('malformed or asynchronous seed adapters fail before recording an objective', async () => {
  for (const provider of [() => null, () => ({requirements: []}), () => {throw Error('fixture.seed-unavailable');},
    async () => {throw Error('fixture.async-seed-failure');}]) {
    const ledger = createReasoningStateLedger();
    const life = lifecycle({ledger, requirement_seed_provider: provider});
    assert.equal((await prepare(life, 1, initial)).ok, false);
    assert.equal(continuityEvents(ledger).length, 0);
  }
});

test('untrusted request metadata cannot seed requirements and threads stay isolated', async () => {
  const w = create({requirement_seed_provider: undefined});
  const input = request(1, initial); input.params._are = {requirement_snapshot: {requirements: []}};
  assert.deepEqual(reason(await w.processClientMessage(input)), ['requirements.explicit-seed-required']);
  w.close();
  const isolated = create();
  forward(await isolated.processClientMessage(request(1, initial, 'a')));
  assert.deepEqual(reason(await isolated.processClientMessage(request(2, 'do next', 'b'))), ['objective.active-reference-missing']);
  isolated.close();
});

test('ambiguous refinements require a checked delta and keep existing provider deadline', async () => {
  let calls = 0;
  const life = lifecycle({provider: input => {
    calls++; assert.deepEqual(input.requirement_snapshot.requirements, ['citations']);
    return {transition: 'refine', objective: {description: initial}, evidence_span: {start: 0, end: input.request.length},
      requirement_delta: {retained: ['citations'], added: ['examples'], removed: []}};
  }});
  await prepare(life, 1, initial);
  const refined = await prepare(life, 2, 'Also include examples');
  assert.equal(refined.ok, true); assert.equal(calls, 1);
  assert.deepEqual(active(refined).requirements, ['citations', 'examples']);
  const stalled = lifecycle({configuration: {...config, provider_timeout_ms: 5}, provider: () => new Promise(() => {})});
  await prepare(stalled, 1, initial);
  assert.deepEqual((await prepare(stalled, 2, 'Also include examples')).reason_codes, ['objective.provider-timeout']);
});

test('missing delta and silent losses block without advancing state', async () => {
  for (const delta of [undefined, {retained: [], added: ['examples'], removed: []}]) {
    const ledger = createReasoningStateLedger();
    const life = lifecycle({ledger, provider: input => ({transition: 'refine', objective: {description: initial},
      evidence_span: {start: 0, end: input.request.length}, ...(delta ? {requirement_delta: delta} : {})})});
    await prepare(life, 1, initial);
    const before = life.inspect();
    const result = await prepare(life, 2, 'Also include examples');
    assert.equal(result.ok, false); assert.deepEqual(life.inspect(), before);
    assert.equal(continuityEvents(ledger).length, 1);
  }
});

test('negated, quoted and conditional local near-misses never apply a guessed change', async () => {
  for (const text of ['Do not add table to the requirements.', '"Add table to the requirements."',
    'Add table if useful to the requirements.', 'Keep examples as a requirement.']) {
    const life = lifecycle(); await prepare(life, 1, initial); const before = life.inspect();
    assert.equal((await prepare(life, 2, text)).ok, false); assert.deepEqual(life.inspect(), before);
  }
});

test('recovery rejects altered requirement history even if outer records are resealed', async () => {
  const ledger = createReasoningStateLedger(); const life = lifecycle({ledger});
  await prepare(life, 1, initial); await prepare(life, 2, 'Add table to the requirements.');
  const original = continuityEvents(ledger);
  assert.equal(verifyRequirementContinuityReplay(original[1].content.requirement_continuity,
    original[0].content.requirement_continuity, original[1].content.resolution), true);
  for (const mutate of [
    content => {delete content.requirement_continuity;},
    content => {content.requirement_continuity.previous_continuity_digest = 'a'.repeat(64);},
    content => {content.requirement_continuity.snapshots[0].requirements = [];},
    content => {content.requirement_continuity.seed_snapshot = content.requirement_continuity.snapshots[0];},
  ]) {
    const events = JSON.parse(JSON.stringify(ledger.snapshot())); const target = events.filter(e => e.event_kind === 'objective-transition-resolved')[1];
    mutate(target.content);
    if (target.content.requirement_continuity) {
      const {continuity_digest, ...material} = target.content.requirement_continuity;
      target.content.requirement_continuity.continuity_digest = digestIntentMaterial(material);
    }
    assert.throws(() => lifecycle({ledger: {...ledger, snapshot: () => events}}), /requirement continuity/);
  }
});

test('tracked history cannot silently downgrade to untracked forwarding', async () => {
  const ledger = createReasoningStateLedger(); await prepare(lifecycle({ledger}), 1, initial);
  for (const configuration of [{enabled: true}, {enabled: false}]) {
    const life = lifecycle({ledger, configuration});
    assert.deepEqual((await prepare(life, 2, 'do next')).reason_codes, ['requirements.tracking-disabled-after-history']);
  }
});

test('default-disabled path never invokes seed provider or changes legacy event shape', async () => {
  const ledger = createReasoningStateLedger(); let calls = 0;
  const life = lifecycle({ledger, configuration: {enabled: true}, requirement_seed_provider: () => {calls++; throw Error();}});
  const result = await prepare(life, 1, initial);
  assert.equal(result.ok, true); assert.equal(calls, 0);
  assert.equal(result.requirement_continuity, undefined);
  assert.equal(continuityEvents(ledger)[0].content.requirement_continuity, undefined);
});

test('checkpoint failure forwards nothing and prevents an in-memory successor', async () => {
  const real = createReasoningStateLedger();
  const w = create({reasoning_ledger: {...real, checkpoint: () => ({ok: false, reason_codes: ['fixture.checkpoint-failure']})}});
  assert.deepEqual(reason(await w.processClientMessage(request(1, initial))), ['fixture.checkpoint-failure']);
  assert.deepEqual(w.inspectState().objective_states, []);
  assert.deepEqual(reason(await w.processClientMessage(request(2, initial))), ['objective.ledger-write-failed-restart-required']);
  w.close();
});

test('aggregate state budget and shared outgoing-context budget block without truncation', async () => {
  const tooLarge = lifecycle({requirement_seed_provider: input => seed(input, ['x'.repeat(18000)])});
  assert.deepEqual((await prepare(tooLarge, 1, initial)).reason_codes, ['requirements.continuity-invalid-or-over-budget']);
  const w = create({}, {context_projection: {...loaded.value.context_projection, max_inline_bytes: 100}});
  const action = await w.processClientMessage(request(1, initial));
  assert.equal(action.to_server.length, 0);
  assert.match(JSON.stringify(action.to_client), /budget|too-large|exceed/);
  w.close();
  const probe = create();
  const projected = await probe.processClientMessage(request(1, initial));
  forward(projected);
  const contentBytes = JSON.parse(projected.to_server[0].params.additionalContext['cyberalchemy.are.context-basis'].value).inline_bytes;
  probe.close();
  const combined = create({}, {context_projection: {...loaded.value.context_projection, max_inline_bytes: contentBytes + 500}});
  const combinedAction = await combined.processClientMessage(request(1, initial));
  assert.deepEqual(reason(combinedAction), ['requirements.shared-context-budget-exceeded']);
  combined.close();
});

test('configuration validates requirement tracking as an opt-in dependent on objective resolution', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'are-requirement-config-'));
  try {
    const base = JSON.parse(readFileSync(profilePath, 'utf8'));
    for (const [objective_resolution, expected] of [[config, true], [{enabled: true, requirement_tracking: false}, true],
      [{enabled: false, requirement_tracking: true}, false], [{enabled: true, requirement_tracking: 'yes'}, false]]) {
      const file = resolve(dir, 'profile.json'); writeFileSync(file, JSON.stringify({...base, objective_resolution}));
      const result = loadRepositoryProfile(file, repo); assert.equal(result.ok, expected, JSON.stringify(result.reason_codes));
    }
  } finally {rmSync(dir, {recursive: true, force: true});}
});
