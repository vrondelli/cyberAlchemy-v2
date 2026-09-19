import test from 'node:test';
import assert from 'node:assert/strict';
import {qualifyRecentEvidenceFinalCampaign} from './recent-evidence-final-campaign-r1.mjs';

function fixture() {
  const slots = Array.from({length: 4}, (_, sequence) => ({sequence,
    slot_id: `slot-${sequence}`, arm: 'recent-evidence-ledger', task_id: `task-${sequence}`,
    instance_id: `instance-${sequence}`, task_sha256: String(sequence).repeat(64),
    base_commit: `base-${sequence}`, cell: {comparison_arm: 'recent-evidence-ledger'}}));
  const writes = [];
  return {
    request: {schedule: {slots, fresh_control_runs: false, schedule_sha256: 'a'.repeat(64)},
      sources: {}, donor_stage: '/donor', donor_review_sha256: 'b'.repeat(64), out: '/out',
      persistence: {writeJson: (...args) => writes.push(args)}, signal: new AbortController().signal,
      credential_path: '/credential', before_measure: async () => true},
    writes,
  };
}

test('qualifies four candidate-only rows with two-worker accounting and no models', async () => {
  const {request, writes} = fixture();
  const loads = new Map();
  let active = 0, maximumActive = 0;
  const report = await qualifyRecentEvidenceFinalCampaign(request, {
    verify_schedule() {},
    load({sequence}) {
      loads.set(sequence, (loads.get(sequence) ?? 0) + 1);
      return {task: {instance_id: `instance-${sequence}`}, branch_inputs: {}, snapshots: [],
        repoRoot: `/repo-${sequence}`, source_bindings: [], donor_sha256: String(sequence + 4).repeat(64)};
    },
    create_factory: () => ({create_client() {}, measure_index_tokens() {}}),
    async qualify({cell, task}) {
      assert.equal(cell.comparison_arm, 'recent-evidence-ledger');
      active++;
      maximumActive = Math.max(maximumActive, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return {qualified: true, model_calls: 0, task_id: task.instance_id, projected_tokens: 7000};
    },
  });
  assert.equal(report.qualified, true);
  assert.equal(report.model_calls, 0);
  assert.equal(report.rows.length, 4);
  assert.equal(maximumActive, 2);
  assert.deepEqual([...loads.values()], [2, 2, 2, 2]);
  assert.equal(writes.length, 1);
});

test('rejects a fresh control slot before donor or tokenizer work', async () => {
  const {request} = fixture();
  request.schedule.slots[2].arm = 'control';
  let loaded = 0;
  await assert.rejects(qualifyRecentEvidenceFinalCampaign(request, {
    verify_schedule() {}, load() { loaded++; },
  }), /candidate-only/);
  assert.equal(loaded, 0);
});
