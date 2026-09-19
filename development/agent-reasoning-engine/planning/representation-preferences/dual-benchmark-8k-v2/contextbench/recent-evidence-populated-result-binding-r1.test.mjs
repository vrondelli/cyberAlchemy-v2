import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {verifyRecentPopulatedQualification} from './recent-evidence-populated-result-binding-r1.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'recent-populated-binding-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const schedule = {schedule_sha256: 'a'.repeat(64), slots: Array.from({length: 4}, (_, index) => ({
    slot_id: 'slot-' + index, instance_id: 'task-' + index,
    cell_sha256: hash(stable({index}))}))};
  const rows = schedule.slots.map((slot, index) => {
    const request_sha256 = String(index).repeat(64), donor_sha256 = String(index + 4).repeat(64);
    const request = {receipt_index: index, historical_prompt_sha256: 'b'.repeat(64),
      candidate_prompt_sha256: 'c'.repeat(64), request_sha256, envelope_tokens: 7000,
      projected_tokens: 6998, ledger_entries: 2, included_entries: 1, omitted_entries: 1,
      historical_paths: ['a'], candidate_paths: ['b']};
    const result = {qualified: true, model_calls: 0, task_id: slot.instance_id,
      cell_sha256: slot.cell_sha256, donor_sha256, requests_measured: 1, populated_requests: 1,
      maximum_envelope_tokens: 7000, rows: [request], receipts: [{kind: 'tokenizer', dispatched: true,
        status: 200, automatic_retries: 0, input_tokens: 4438, request_sha256}], index_receipts: []};
    return {slot_id: slot.slot_id, qualified: true, model_calls: 0, donor_sha256, result};
  });
  const report = {schema: 'are.recent-evidence-populated-campaign/v1', qualified: true, model_calls: 0,
    schedule_sha256: schedule.schedule_sha256, workers: 2, requests_measured: 4, populated_requests: 4,
    maximum_envelope_tokens: 7000, rows};
  const qualification = {qualified: true, measurement_report: report, process_settlement: {local_settled: true,
    process_group_absent: true, forced: false, exit_code: 0}};
  const write = value => {
    const path = join(root, 'RESULTS-' + Math.random() + '.json'), bytes = JSON.stringify(value);
    writeFileSync(path, bytes);
    return {qualification_path: path, qualification_sha256: hash(bytes), schedule};
  };
  return {schedule, qualification, write};
}

test('accepts a complete four-task populated qualification', t => {
  const fixtureValue = fixture(t);
  assert.equal(verifyRecentPopulatedQualification(fixtureValue.write(fixtureValue.qualification)), true);
});

test('rejects missing tasks, model evidence, window overflow and aggregate drift', t => {
  for (const mutate of [
    value => value.measurement_report.rows.pop(),
    value => value.measurement_report.rows[0].result.receipts[0].kind = 'model',
    value => value.measurement_report.rows[0].result.rows[0].envelope_tokens = 8001,
    value => value.measurement_report.populated_requests = 3,
  ]) {
    const f = fixture(t), value = structuredClone(f.qualification);
    mutate(value);
    assert.throws(() => verifyRecentPopulatedQualification(f.write(value)));
  }
});

test('rejects file drift', t => {
  const f = fixture(t), args = f.write(f.qualification);
  assert.throws(() => verifyRecentPopulatedQualification({...args, qualification_sha256: '0'.repeat(64)}),
    /file-drift/);
});
