import assert from 'node:assert/strict';
import test from 'node:test';
import {createReasoningStateLedger} from '../../reasoning-state-runtime/index.mjs';
import {materializeReasoningPlanContext} from '../../reasoning-state-runtime/plan-context.mjs';
import {materializeRequirementSnapshot} from '../../request-intent-runtime/index.mjs';
import {createOwnedObjectiveLifecycle} from '../src/objective-session-lifecycle.mjs';
import {materializePlanRequirementMigration, verifyPlanRequirementMigrationReplay,
  verifyRequirementContinuity, prepareObjectiveRequirements} from '../src/objective-requirements.mjs';
import {resolveObjectiveTransition} from '../../request-intent-runtime/index.mjs';
import {semanticModulePort} from './semantic-module-fixture.mjs';
import {createSemanticTextFacade} from '../../module-port/semantic-text.mjs';

async function fixture({suspended = false} = {}) {
  const ledger = createReasoningStateLedger();
  const owned = createOwnedObjectiveLifecycle({ledger, module_port: semanticModulePort(),
    configuration: {enabled: true, requirement_tracking: true},
    requirement_seed_provider: ({state, request_ref}) => materializeRequirementSnapshot({
      consumer_ref: state.consumer_ref, scope_ref: state.scope_ref,
      objective_id: state.active_objective.objective_id, objective_state_digest: state.state_digest,
      requirements: ['Overview', 'Old panel', 'Manual latency requirement'], source_refs: [request_ref]}),
  });
  const request = (id, text) => ({consumer_ref: 'host', scope_ref: 'conversation',
    thread_ref: 'thread:1', request_ref: `real-request:${id}`, request: text});
  let prepared = await owned.prepare(request(1, 'Research context management approaches.'));
  assert.equal(prepared.ok, true);
  if (suspended) {
    prepared = await owned.prepare(request(2, 'Before that, explain routing'));
    assert.equal(prepared.ok, true);
    assert.equal(prepared.resolution.next_state.suspended_objectives.length, 1);
  }
  const plan = (summaries, previous = null, thread = 'thread:1') => {
    const digest = (previous ? 'b' : 'a').repeat(64), parent = previous ? 'plan:new' : 'plan:old';
    const result = materializeReasoningPlanContext({thread_ref: thread,
      parent_plan_ref: parent, parent_plan_digest: digest,
      feature_obligations: summaries.map((summary, index) => ({obligation_id: `panel-${index}`, summary, status: 'open'})),
      active_slice_id: 'panel-0', unresolved_decisions: [],
      source_refs: [{source_ref: parent, source_digest: digest}], previous_plan_context_digest: previous},
    {expected_thread_ref: thread, source_digests: {[parent]: digest}});
    assert.equal(result.ok, true);
    return result.value;
  };
  const previous_plan_context = plan(['Overview', 'Old panel']);
  const plan_context = plan(['Overview', 'Evolution'], previous_plan_context.plan_context_digest);
  const previous = prepared.requirement_continuity, state = prepared.resolution.next_state;
  const accounting = previous.snapshots.map(snapshot => ({objective_id: snapshot.objective_id,
    snapshot_digest: snapshot.snapshot_digest, retained: ['Overview', 'Manual latency requirement'],
    added: ['Evolution'], removed: ['Old panel']}));
  return {input: {previous, state, previous_plan_context, plan_context, accounting,
    source_ref: 'host-plan-selection:fixture'}, ledger, prepared, plan};
}

test('replacement preserves manual requirements and suspended objectives without inventing a prompt', async () => {
  const {input, ledger} = await fixture({suspended: true});
  const before = JSON.stringify(input), events = ledger.snapshot().length;
  const receipt = materializePlanRequirementMigration(input);
  assert.equal(receipt.authority_effect, 'none');
  assert.equal(receipt.next_continuity.snapshots.length, 2);
  for (const snapshot of receipt.next_continuity.snapshots) {
    assert.deepEqual(snapshot.requirements, ['Evolution', 'Manual latency requirement', 'Overview']);
    assert.equal(snapshot.objective_state_digest, input.state.state_digest);
    assert.ok(snapshot.source_refs.includes(input.source_ref));
  }
  assert.equal(receipt.next_continuity.resolution_digest, input.previous.resolution_digest);
  assert.equal(receipt.next_continuity.previous_continuity_digest, input.previous.continuity_digest);
  assert.equal(verifyRequirementContinuity(receipt.next_continuity, input.state), true);
  assert.equal(JSON.stringify(input), before);
  assert.equal(ledger.snapshot().length, events); // materialization grants no ledger effects
  assert.equal(Object.isFrozen(receipt.next_continuity.snapshots), true);
});

test('replay is deterministic and rejects recomputed or closed-schema tampering', async () => {
  const {input} = await fixture({suspended: true});
  const receipt = materializePlanRequirementMigration(input);
  const reordered = {...input, accounting: [...input.accounting].reverse().map(row =>
    ({...row, retained: [...row.retained].reverse()}))};
  assert.deepEqual(materializePlanRequirementMigration(reordered), receipt);
  assert.equal(verifyPlanRequirementMigrationReplay(receipt, input), true);
  for (const changed of [{...receipt, extra: true}, {...receipt, migration_digest: '0'.repeat(64)},
    {...receipt, source_ref: 'other'}, {...receipt, next_continuity: input.previous}]) {
    assert.equal(verifyPlanRequirementMigrationReplay(changed, input), false);
  }
});

test('accounting must cover every snapshot exactly with no silent losses or remove/add laundering', async () => {
  const {input} = await fixture({suspended: true});
  const [row, other] = input.accounting;
  const invalid = [[], [row], [row, row], [row, {...other, objective_id: 'foreign'}],
    [row, {...other, snapshot_digest: '0'.repeat(64)}],
    [row, {...other, retained: ['Overview']}],
    [row, {...other, added: ['Evolution', 'Old panel']}],
    [row, {...other, removed: ['Old panel', 'foreign']}],
    [row, {...other, added: ['Evolution', 'Evolution']}],
    [row, {...other, added: [' Evolution']}],
    [row, {...other, added: ['x'.repeat(2049)]}],
    [row, {...other, added: [], removed: ['Old panel']}],
    [row, {...other, private: 'not allowed'}]];
  for (const accounting of invalid) assert.throws(() => materializePlanRequirementMigration({...input, accounting}));
});

test('successor plan must be valid and linked to the exact same-thread predecessor', async () => {
  const {input, plan} = await fixture();
  const invalid = [input.previous_plan_context,
    {...input.plan_context, parent_plan_digest: 'c'.repeat(64)},
    plan(['Overview', 'Evolution'], '0'.repeat(64)),
    plan(['Overview', 'Evolution'], input.previous_plan_context.plan_context_digest, 'thread:foreign')];
  for (const plan_context of invalid) assert.throws(() => materializePlanRequirementMigration({...input, plan_context}));
  for (const source_ref of ['', ' padded ', 'x'.repeat(513)]) {
    assert.throws(() => materializePlanRequirementMigration({...input, source_ref}));
  }
});

test('a subsequent real continuation can derive continuity from the migrated predecessor', async () => {
  const {input} = await fixture();
  const receipt = materializePlanRequirementMigration(input);
  const semanticText = createSemanticTextFacade(semanticModulePort(), {consumer_id: 'request-intent-runtime'});
  const next = await prepareObjectiveRequirements({state: input.state,
    expected_state_digest: input.state.state_digest, consumer_ref: 'host', scope_ref: 'conversation',
    request: 'do next', request_ref: 'real-request:3', selected_context: []},
  {previous: receipt.next_continuity, resolve: selected => resolveObjectiveTransition(selected, null, semanticText)});
  assert.equal(next.ok, true);
  assert.equal(next.continuity.previous_continuity_digest, receipt.next_continuity.continuity_digest);
  assert.deepEqual(next.continuity.snapshots[0].requirements, ['Evolution', 'Manual latency requirement', 'Overview']);
  assert.equal(next.resolution.request_ref, 'real-request:3');
});

test('manual removals must be explicit and aggregate migration budget remains 32 KiB', async () => {
  const {input, plan} = await fixture({suspended: true});
  const accounting = input.accounting.map(row => ({...row, retained: ['Overview'],
    removed: ['Old panel', 'Manual latency requirement']}));
  const receipt = materializePlanRequirementMigration({...input, accounting});
  assert.ok(receipt.next_continuity.snapshots.every(snapshot =>
    !snapshot.requirements.includes('Manual latency requirement')));
  const summaries = Array.from({length: 32}, (_, index) => `Panel ${index}: ` + 'x'.repeat(290));
  const largePlan = plan(summaries, input.previous_plan_context.plan_context_digest);
  const largeAccounting = input.accounting.map(row => ({...row,
    retained: ['Manual latency requirement'], added: summaries, removed: ['Overview', 'Old panel']}));
  assert.throws(() => materializePlanRequirementMigration({...input, plan_context: largePlan,
    accounting: largeAccounting}), /requirements.migration-budget-exceeded/);
});

test('compact accounting reconstructs exact text and refuses unbound or overlapping indices', async () => {
  const {input} = await fixture({suspended: true});
  const accounting = input.previous.snapshots.map(snapshot => ({objective_id: snapshot.objective_id,
    snapshot_digest: snapshot.snapshot_digest,
    retained_indices: snapshot.requirements.flatMap((value, index) => value !== 'Old panel' ? [index] : []),
    removed_indices: [snapshot.requirements.indexOf('Old panel')], added_obligation_ids: ['panel-1'], added_requirements: []}));
  const compact = {...input, accounting}, receipt = materializePlanRequirementMigration(compact);
  assert.equal(receipt.schema_version, 'are.plan-requirement-migration/v2');
  assert.deepEqual(receipt.next_continuity, materializePlanRequirementMigration(input).next_continuity);
  assert.equal(verifyPlanRequirementMigrationReplay(receipt, compact), true);
  const row = accounting[0];
  for (const changed of [{...row, retained_indices: []}, {...row, retained_indices: [63]},
    {...row, removed_indices: [...row.removed_indices, ...row.retained_indices]},
    {...row, retained_indices: ['0']}, {...row, added_obligation_ids: ['foreign']},
    {...row, added_requirements: ['Evolution']}, {...row, snapshot_digest: '0'.repeat(64)}]) {
    assert.throws(() => materializePlanRequirementMigration({...input, accounting: [changed, accounting[1]]}));
  }
});
