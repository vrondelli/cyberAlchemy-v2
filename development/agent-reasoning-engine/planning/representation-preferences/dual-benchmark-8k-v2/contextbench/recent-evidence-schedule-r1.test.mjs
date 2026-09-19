import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRecentEvidenceSchedule, verifyRecentEvidenceSchedule} from './recent-evidence-schedule-r1.mjs';
const registered = JSON.parse(readFileSync(new URL('./RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json', import.meta.url)));
const sources = {config_path: registered.config_path, cohort_path: registered.cohort_path, cohort_sha256: registered.cohort_sha256};
test('runtime schedule equals the reviewed prospective schedule without controls or budget drift', () => {
  assert.deepEqual(buildRecentEvidenceSchedule(sources), registered);
  assert.equal(verifyRecentEvidenceSchedule({schedule: registered, ...sources}), true);
  assert.deepEqual(registered.candidates, ['recent-evidence-ledger']);
  assert.equal(registered.fresh_control_runs, false); assert.equal(registered.workers, 2);
  assert.equal(registered.maximum_total_model_tokens, 384000);
});
test('worker, task, arm, per-task budget and dispatch changes are rejected', () => {
  for (const mutate of [s => s.workers++, s => s.slots.pop(), s => s.slots[0].arm = 'control',
    s => s.slots[0].cell.limits.total_tokens++, s => s.dispatch_admitted = true]) {
    const schedule = structuredClone(registered); mutate(schedule);
    assert.throws(() => verifyRecentEvidenceSchedule({schedule, ...sources}), /exact-schedule/);
  }
});
