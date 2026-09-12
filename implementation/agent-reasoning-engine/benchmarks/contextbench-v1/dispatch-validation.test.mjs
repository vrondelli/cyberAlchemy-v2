import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
const cell = {cell_id: 'cell-a', instance_id: 'task-a'};
function fixture(t, extra = {}) {
  const root = mkdtempSync(join(tmpdir(), 'are-dispatch-validation-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const r = {...cell, status: 'call_budget_exhausted', error: null, native_export: null, export_error: null, ...extra};
  const bytes = JSON.stringify(r);
  writeFileSync(join(root, 'result.json'), bytes);
  writeFileSync(join(root, 'completed.json'), JSON.stringify({status: r.status,
    result_sha256: createHash('sha256').update(bytes).digest('hex'), benchmark_cleared: false}));
  return root;
}
test('retained task/call/token/format outcomes permit later cells', t => {
  for (const status of ['call_budget_exhausted', 'token_budget_stopped', 'context_budget_stopped', 'invalid_final_response']) {
    const root = fixture(t, {status});
    assert.equal(validateDispatchCompletion({cell, root}).directive, 'continue-sequence');
  }
});
test('valid terminal selection with exporter failure pauses future dispatch', t => {
  const root = fixture(t, {status: 'final_context_selected', export_error: 'instrument.final-context-unmapped-current-lines'});
  const v = validateDispatchCompletion({cell, root});
  assert.equal(v.directive, 'pause-unstarted');
  assert.deepEqual(v.issues.map(x => x.code), ['dispatch.shared-export-failure']);
});
test('reports all independent identity, status, integrity and scoring defects', t => {
  const root = fixture(t, {cell_id: 'wrong', instance_id: 'wrong', status: 'unknown', native_export: {}});
  writeFileSync(join(root, 'completed.json'), JSON.stringify({status: 'other', result_sha256: '0'.repeat(64), benchmark_cleared: true}));
  writeFileSync(join(root, 'scoring-status.json'), JSON.stringify({exit_code: 1, error: 'ETIMEDOUT'}));
  const codes = validateDispatchCompletion({cell, root}).issues.map(x => x.code);
  for (const code of ['dispatch.result-integrity', 'dispatch.status-mismatch', 'dispatch.cell-mismatch',
    'dispatch.instance-mismatch', 'dispatch.shared-runtime-failure', 'dispatch.invalid-clearance-claim',
    'dispatch.export-without-final-selection', 'dispatch.scoring-failed', 'dispatch.scoring-process-error'])
    assert.ok(codes.includes(code), code);
  assert.equal(codes.filter(x => x === 'dispatch.artifact-unreadable').length, 2);
});
test('missing or malformed completion evidence produces diagnostics', t => {
  const root = fixture(t);
  writeFileSync(join(root, 'result.json'), 'null');
  writeFileSync(join(root, 'completed.json'), '{');
  assert.deepEqual(validateDispatchCompletion({cell, root}).issues.map(x => x.code),
    ['dispatch.artifact-invalid-json', 'dispatch.artifact-not-object']);
});
test('final export requires scoring artifacts and no process error', t => {
  const root = fixture(t, {status: 'final_context_selected', native_export: {}});
  assert.equal(validateDispatchCompletion({cell, root}).ok, false);
  for (const [file, value] of [['scoring-status.json', {exit_code: 0, error: null}], ['prediction.json', {}], ['native-score.json', {}]])
    writeFileSync(join(root, file), JSON.stringify(value));
  assert.equal(validateDispatchCompletion({cell, root}).ok, true);
});
test('missing or malformed final export cannot silently pass', t => {
  for (const native_export of [null, false, [], '']) {
    const root = fixture(t, {status: 'final_context_selected', native_export});
    assert.equal(validateDispatchCompletion({cell, root}).ok, false);
  }
});
test('no-context outcome requires an explicit empty selection and no export', t => {
  const valid = fixture(t, {status: 'no_context_selected', selection: {final_read_ids: []}});
  assert.equal(validateDispatchCompletion({cell, root: valid}).ok, true);
  for (const selection of [null, {final_read_ids: ['fabricated']}]) {
    const root = fixture(t, {status: 'no_context_selected', selection});
    assert.ok(validateDispatchCompletion({cell, root}).issues.some(i => i.code === 'dispatch.no-context-selection-mismatch'));
  }
});
