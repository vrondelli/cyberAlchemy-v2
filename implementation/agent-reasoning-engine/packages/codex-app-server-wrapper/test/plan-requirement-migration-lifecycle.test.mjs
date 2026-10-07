import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {appendReasoningPlanContext, recoverReasoningStateLedger} from '../../reasoning-state-runtime/index.mjs';
import {materializeRequirementSnapshot} from '../../request-intent-runtime/index.mjs';
import {createOwnedObjectiveLifecycle} from '../src/objective-session-lifecycle.mjs';
import {semanticModulePort} from './semantic-module-fixture.mjs';

const request = (id, text = 'do next') => ({consumer_ref: 'host', scope_ref: 'conversation',
  thread_ref: 'thread:1', request_ref: `real-request:${id}`, request: text});
const plan = (previous = null) => {
  const parent = previous ? 'plan:new' : 'plan:old', digest = (previous ? 'b' : 'a').repeat(64);
  return {thread_ref: 'thread:1', parent_plan_ref: parent, parent_plan_digest: digest,
    feature_obligations: ['Overview', previous ? 'Evolution' : 'Old panel'].map((summary, index) =>
      ({obligation_id: `panel-${index}`, summary, status: 'open'})),
    active_slice_id: 'panel-0', unresolved_decisions: [],
    source_refs: [{source_ref: parent, source_digest: digest}], previous_plan_context_digest: previous};
};
const sourceDigests = input => Object.fromEntries(input.source_refs.map(row => [row.source_ref, row.source_digest]));
const owned = ledger => createOwnedObjectiveLifecycle({ledger, module_port: semanticModulePort(),
  configuration: {enabled: true, requirement_tracking: true},
  requirement_seed_provider: ({state, request_ref}) => materializeRequirementSnapshot({consumer_ref: state.consumer_ref,
    scope_ref: state.scope_ref, objective_id: state.active_objective.objective_id,
    objective_state_digest: state.state_digest, requirements: ['Overview', 'Old panel', 'Manual latency requirement'],
    source_refs: [request_ref]})});

async function fixture(t, suspended = false) {
  const directory = mkdtempSync(join(tmpdir(), 'are-plan-migration-'));
  const path = join(directory, 'reasoning.jsonl'), ledger_id = 'reasoning:plan-migration';
  const handles = [];
  const open = () => {
    const recovered = recoverReasoningStateLedger({path, ledger_id});
    assert.equal(recovered.ok, true, JSON.stringify(recovered.reason_codes));
    handles.push(recovered.ledger);
    return recovered.ledger;
  };
  t.after(() => { for (const ledger of handles) ledger.close(); rmSync(directory, {recursive: true, force: true}); });
  const ledger = open(), initialInput = plan();
  const initial = appendReasoningPlanContext(ledger, initialInput,
    {expected_thread_ref: initialInput.thread_ref, source_digests: sourceDigests(initialInput)});
  assert.equal(initial.ok, true);
  const epoch = ledger.seal({event_digests: [initial.event.event_digest], consumer_ref: 'host', request_ref: 'host:initial-plan'});
  assert.equal(ledger.checkpoint({checkpoint_kind: 'manual', epoch: epoch.value, subject_digest: initial.value.plan_context_digest}).ok, true);
  const lifecycle = owned(ledger);
  let prepared = await lifecycle.prepare(request(1, 'Research context management approaches.'));
  assert.equal(prepared.ok, true);
  if (suspended) {
    prepared = await lifecycle.prepare(request(2, 'Before that, explain routing'));
    assert.equal(prepared.ok, true);
  }
  const successor = plan(initial.value.plan_context_digest);
  const input = {consumer_ref: 'host', scope_ref: 'conversation', thread_ref: 'thread:1',
    previous_continuity_digest: prepared.requirement_continuity.continuity_digest,
    plan_input: successor, source_digests: sourceDigests(successor), source_ref: 'host-selection:replacement',
    accounting: prepared.requirement_continuity.snapshots.map(snapshot => ({objective_id: snapshot.objective_id,
      snapshot_digest: snapshot.snapshot_digest, retained: ['Overview', 'Manual latency requirement'],
      added: ['Evolution'], removed: ['Old panel']}))};
  return {ledger, lifecycle, prepared, initial, input, open, path, ledger_id};
}

test('same-thread plan and active/suspended requirements share one real fsync checkpoint and recover', async t => {
  const f = await fixture(t, true);
  const oldState = f.lifecycle.inspect()[0].state_digest;
  const result = f.lifecycle.migratePlanRequirements(f.input);
  assert.equal(result.ok, true, JSON.stringify(result.reason_codes));
  assert.equal(result.disposition, 'migrated');
  assert.equal(f.lifecycle.inspect()[0].state_digest, oldState);
  assert.equal(f.lifecycle.inspect()[0].suspended_count, 1);
  const epoch = f.ledger.epochs().find(value => value.request_ref === `host-plan-migration:${result.migration.plan_context_digest}`);
  assert.equal(epoch.event_digests.length, 2);
  const checkpoint = f.ledger.checkpoints().find(value => value.checkpoint_digest === result.checkpoint_digest);
  assert.equal(checkpoint.durability, 'append-only-file-fsync');
  assert.equal(checkpoint.epoch_digest, epoch.epoch_digest);
  assert.equal(checkpoint.head_event_digest, result.event_digest);
  assert.equal(f.ledger.snapshot().filter(event => event.event_kind === 'objective-transition-resolved').length, 2);
  f.ledger.close();
  const recovered = owned(f.open());
  const next = await recovered.prepare(request(3));
  assert.equal(next.ok, true);
  assert.equal(next.requirement_continuity.previous_continuity_digest, result.migration.next_continuity.continuity_digest);
  assert.ok(next.requirement_continuity.snapshots.every(snapshot =>
    JSON.stringify(snapshot.requirements) === JSON.stringify(['Evolution', 'Manual latency requirement', 'Overview'])));
});

test('idempotent retry after later real prompts and recovery does not rewind requirements or state', async t => {
  const f = await fixture(t);
  const first = f.lifecycle.migratePlanRequirements(f.input);
  assert.equal(first.ok, true);
  const later = await f.lifecycle.prepare(request(2, 'Add narrow display to the requirements.'));
  assert.equal(later.ok, true, JSON.stringify(later.reason_codes));
  f.ledger.close();
  const ledger = f.open(), restored = owned(ledger), before = restored.inspect(), count = ledger.snapshot().length;
  const repeated = restored.migratePlanRequirements(f.input);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.disposition, 'duplicate');
  assert.equal(repeated.checkpoint_digest, first.checkpoint_digest);
  assert.equal(ledger.snapshot().length, count);
  assert.deepEqual(restored.inspect(), before);
  assert.deepEqual(restored.migratePlanRequirements({...f.input, source_ref: 'conflict'}).reason_codes,
    ['requirements.migration-identity-conflict']);
  const continued = await restored.prepare(request(3));
  assert.equal(continued.ok, true);
  assert.ok(continued.requirement_continuity.snapshots[0].requirements.includes('narrow display'));
});

test('invalid, stale, foreign, unverified and unaccounted migration inputs write nothing', async t => {
  const f = await fixture(t, true), before = f.ledger.snapshot().length;
  const [row, other] = f.input.accounting;
  const bad = [null, {...f.input, unknown: true}, {...f.input, consumer_ref: 'foreign'},
    {...f.input, thread_ref: 'thread:foreign'}, {...f.input, scope_ref: 'foreign'},
    {...f.input, previous_continuity_digest: '0'.repeat(64)}, {...f.input, source_digests: {}},
    {...f.input, plan_input: {...f.input.plan_input, previous_plan_context_digest: '0'.repeat(64)}},
    {...f.input, accounting: [row]}, {...f.input, accounting: [row, row]},
    {...f.input, accounting: [row, {...other, retained: ['Overview']}]}, {...f.input, accounting: null}];
  for (const input of bad) {
    assert.equal(f.lifecycle.migratePlanRequirements(input).ok, false);
    assert.equal(f.ledger.snapshot().length, before);
  }
  assert.equal(f.lifecycle.migratePlanRequirements(f.input).ok, true);
});

for (const stage of ['migration-event', 'epoch', 'checkpoint']) {
  test(`failed ${stage} persistence publishes no requirements and recovered uncheckpointed tail refuses`, async t => {
    const f = await fixture(t), before = f.lifecycle.inspect(), sink = f.ledger._state.sink;
    f.ledger._state.sink = {...sink, append(record) {
      const fail = stage === 'migration-event' ? record.value?.event_kind === 'plan-requirements-migrated'
        : stage === 'epoch' ? record.record_kind === 'reasoning-state-epoch'
          : record.record_kind === 'reasoning-state-checkpoint';
      return fail ? {ok: false, reason_codes: [`fixture.${stage}-failure`]} : sink.append(record);
    }};
    assert.equal(f.lifecycle.migratePlanRequirements(f.input).ok, false);
    assert.deepEqual(f.lifecycle.inspect(), before);
    assert.deepEqual((await f.lifecycle.prepare(request(2))).reason_codes,
      ['objective.ledger-write-failed-restart-required']);
    f.ledger.close();
    const recovered = recoverReasoningStateLedger({path: f.path, ledger_id: f.ledger_id});
    assert.equal(recovered.ok, false);
    assert.ok(recovered.reason_codes.some(code => code.includes('uncheckpointed')));
  });
}

test('failed flush is not exposed as retained checkpoint or accepted by same-process replay', async t => {
  const f = await fixture(t), sink = f.ledger._state.sink, checkpointCount = f.ledger.checkpoints().length;
  f.ledger._state.sink = {...sink, flush: () => ({ok: false, reason_codes: ['fixture.flush-failure']})};
  assert.equal(f.lifecycle.migratePlanRequirements(f.input).ok, false);
  assert.equal(f.ledger.checkpoints().length, checkpointCount);
  assert.throws(() => owned(f.ledger), /lacks exact checkpoint/);
});

test('scope-thread binding and a pending real request prevent foreign or racing migration', async t => {
  const f = await fixture(t);
  assert.deepEqual((await f.lifecycle.prepare({...request(2), thread_ref: 'thread:foreign'})).reason_codes,
    ['objective.scope-thread-binding-invalid']);
  const running = f.lifecycle.prepare(request(2));
  assert.deepEqual(f.lifecycle.migratePlanRequirements(f.input).reason_codes, ['objective.scope-preparation-inflight']);
  assert.equal((await running).ok, true);
  assert.deepEqual(f.lifecycle.migratePlanRequirements(f.input).reason_codes, ['requirements.migration-stale-continuity']);
});

test('two replacements replay at historical plan frontiers and an old retry cannot undo the successor', async t => {
  const f = await fixture(t), first = f.lifecycle.migratePlanRequirements(f.input);
  assert.equal(first.ok, true);
  const later = await f.lifecycle.prepare(request(2, 'Add narrow display to the requirements.'));
  assert.equal(later.ok, true);
  const successor = {...f.input.plan_input, previous_plan_context_digest: first.migration.plan_context_digest,
    parent_plan_ref: 'plan:third', parent_plan_digest: 'c'.repeat(64),
    source_refs: [{source_ref: 'plan:third', source_digest: 'c'.repeat(64)}],
    feature_obligations: [{obligation_id: 'overview', summary: 'Overview', status: 'open'},
      {obligation_id: 'adapters', summary: 'Adapters', status: 'open'}], active_slice_id: 'adapters'};
  const input = {...f.input, plan_input: successor, source_digests: sourceDigests(successor),
    previous_continuity_digest: later.requirement_continuity.continuity_digest,
    source_ref: 'host-selection:third', accounting: later.requirement_continuity.snapshots.map(snapshot =>
      ({objective_id: snapshot.objective_id, snapshot_digest: snapshot.snapshot_digest,
        retained: snapshot.requirements.filter(value => value !== 'Evolution'), added: ['Adapters'], removed: ['Evolution']}))};
  const second = f.lifecycle.migratePlanRequirements(input);
  assert.equal(second.ok, true, JSON.stringify(second.reason_codes));
  f.ledger.close();
  const restored = owned(f.open()), before = restored.inspect();
  assert.equal(restored.migratePlanRequirements(f.input).disposition, 'duplicate');
  assert.equal(restored.migratePlanRequirements(input).disposition, 'duplicate');
  assert.deepEqual(restored.inspect(), before);
  const next = await restored.prepare(request(3));
  assert.equal(next.ok, true);
  assert.deepEqual(next.requirement_continuity.snapshots[0].requirements,
    ['Adapters', 'Manual latency requirement', 'Overview', 'narrow display']);
});
