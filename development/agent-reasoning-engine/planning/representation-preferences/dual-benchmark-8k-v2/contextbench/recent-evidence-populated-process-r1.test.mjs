import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runRecentPopulatedQualification} from './recent-evidence-populated-process-r1.mjs';

const terminal = {schema: 'are.recent-evidence-populated-campaign/v1', qualified: true, model_calls: 0,
  populated_requests: 4, rows: Array.from({length: 4}, () => ({qualified: true,
    result: {populated_requests: 1}}))};
function fixture(t, body) {
  const root = mkdtempSync(join(tmpdir(), 'recent-populated-child-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const worker = join(root, 'worker.mjs');
  writeFileSync(worker, body);
  return {worker, kill_grace_ms: 30};
}
const args = () => ({request: {schedule: {assigned_outcomes: 4}},
  signal: new AbortController().signal, deadline_ms: 3000});

test('returns only after a successful child closes', async t => {
  const deps = fixture(t, "for await(const c of process.stdin){};process.stdout.write(" +
    JSON.stringify(JSON.stringify({terminal, error: null})) + ");");
  const result = await runRecentPopulatedQualification(args(), deps);
  assert.equal(result.qualified, true);
  assert.equal(result.process_settlement.local_settled, true);
  assert.equal(result.process_settlement.remote_completion_claimed, false);
  assert.throws(() => process.kill(result.process_settlement.child_pid, 0), {code: 'ESRCH'});
});

test('child failure preserves measurements and settlement', async t => {
  const report = {...terminal, qualified: false, persistence_failure: 'disk'};
  const deps = fixture(t, "for await(const c of process.stdin){};process.stdout.write(" +
    JSON.stringify(JSON.stringify({terminal: report, error: 'disk'})) + ",()=>process.exit(2));");
  await assert.rejects(runRecentPopulatedQualification(args(), deps), error => {
    assert.deepEqual(error.result.measurement_report, report);
    assert.equal(error.result.qualified, false);
    assert.equal(error.result.process_settlement.local_settled, true);
    return true;
  });
});

test('deadline kills and settles an unresponsive child', async t => {
  const deps = fixture(t, "process.on('SIGTERM',()=>{});for await(const c of process.stdin){};setInterval(()=>{},1000);");
  await assert.rejects(runRecentPopulatedQualification({...args(), deadline_ms: 200}, deps), error => {
    assert.equal(error.result.deadline_exceeded, true);
    assert.equal(error.result.process_settlement.local_settled, true);
    assert.equal(error.result.qualified, false);
    return true;
  });
});

test('parent cancellation cannot return qualified', async t => {
  const deps = fixture(t, "for await(const c of process.stdin){};setInterval(()=>{},1000);"),
    controller = new AbortController(), timer = setTimeout(() => controller.abort(), 100);
  try {
    await assert.rejects(runRecentPopulatedQualification({...args(), signal: controller.signal}, deps), error => {
      assert.equal(error.result.qualified, false);
      assert.equal(error.result.process_settlement.local_settled, true);
      return true;
    });
  } finally { clearTimeout(timer); }
});

test('actual worker rejects an invalid freeze before provider access', async () => {
  await assert.rejects(runRecentPopulatedQualification(args()), error => {
    assert.equal(error.result.measurement_report, null);
    assert.equal(error.result.process_settlement.exit_code, 2);
    assert.equal(error.result.process_settlement.local_settled, true);
    return true;
  });
});

test('rejects invalid deadlines and already cancelled input', async () => {
  for (const deadline_ms of [0, 1200001])
    await assert.rejects(runRecentPopulatedQualification({...args(), deadline_ms}), /deadline/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(runRecentPopulatedQualification({...args(), signal: controller.signal}), /active-signal/);
});
