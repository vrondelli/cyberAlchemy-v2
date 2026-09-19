import test from 'node:test';
import assert from 'node:assert/strict';
import {qualifyRecentPopulatedCampaign} from './recent-evidence-populated-campaign-r2.mjs';

function fixture({fail = -1, drift = -1} = {}) {
  const slots = Array.from({length: 4}, (_, sequence) => ({sequence, slot_id: 'slot-' + sequence,
    arm: 'recent-evidence-ledger', cell: {sequence}}));
  const schedule = {slots, assigned_outcomes: 4, fresh_control_runs: false, schedule_sha256: 'a'.repeat(64)};
  const writes = [], loads = new Map();
  const load = ({sequence}) => {
    const count = (loads.get(sequence) ?? 0) + 1;
    loads.set(sequence, count);
    return {donor_sha256: sequence === drift && count > 1 ? 'f'.repeat(64) : String(sequence).repeat(64),
      source_bindings: [], task: {instance_id: 'task-' + sequence}};
  };
  const qualify = async ({cell}) => {
    if (cell.sequence === fail) { const error = Error('fixture-failure'); error.result = {model_calls: 0}; throw error; }
    return {qualified: true, model_calls: 0, requests_measured: cell.sequence + 1,
      populated_requests: 1, maximum_envelope_tokens: 7000 + cell.sequence};
  };
  const deps = {load, qualify, verify_schedule: () => true,
    create_factory: () => ({create_client: () => {}, measure_index_tokens: () => {}})};
  const request = {schedule, sources: {}, donor_stage: '/donor', donor_review_sha256: 'b'.repeat(64),
    out: '/out', persistence: {writeJson: (path, value) => writes.push({path, value})},
    signal: new AbortController().signal, credential_path: '/credential', before_measure: async () => true};
  return {request, deps, writes, loads};
}

test('runs four fixed candidate slots with two workers and aggregates coverage', async () => {
  const f = fixture(), result = await qualifyRecentPopulatedCampaign(f.request, f.deps);
  assert.equal(result.qualified, true);
  assert.equal(result.workers, 2);
  assert.equal(result.requests_measured, 10);
  assert.equal(result.populated_requests, 4);
  assert.equal(result.maximum_envelope_tokens, 7003);
  assert.equal(result.model_calls, 0);
  assert.equal(f.writes.length, 1);
  assert.deepEqual([...f.loads.values()], [2, 2, 2, 2]);
});

test('keeps the fixed denominator when one slot fails', async () => {
  const f = fixture({fail: 1}), result = await qualifyRecentPopulatedCampaign(f.request, f.deps);
  assert.equal(result.qualified, false);
  assert.equal(result.rows.length, 4);
  assert.equal(result.rows[1].status, 'failed');
  assert.ok(result.rows.some(row => row.status === 'not-started'));
});

test('rejects donor drift after tokenizer qualification', async () => {
  const f = fixture({drift: 2}), result = await qualifyRecentPopulatedCampaign(f.request, f.deps);
  assert.equal(result.qualified, false);
  assert.equal(result.rows[2].status, 'failed');
  assert.match(result.rows[2].error, /donor-drift/);
});
