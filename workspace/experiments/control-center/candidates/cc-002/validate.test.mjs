import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCandidate, validate} from './validate.mjs';

test('current selected bytes match without concealing nested runtime failure', () => {
  const result = validate();
  assert.equal(result.selected_binding, 'PASS');
  assert.equal(result.nested_runtime_profile.status, 'FAIL');
  assert.ok(result.missing_route_policies.includes('CA2-ROUTE-LOCATE'));
  assert.equal(result.native_smoke_ready, false);
});
test('reject changed layout digest', () => {
  const c = readCandidate(); c.additional_sources[0].sha256 = '0'.repeat(64);
  assert.equal(validate(c).selected_binding, 'FAIL');
});
test('reject omitted layout source', () => {
  const c = readCandidate(); c.additional_sources.pop();
  assert.ok(validate(c).errors.includes('additional-source-coverage'));
});
test('reject inherited approval and effects', () => {
  const c = readCandidate(); c.approval = 'approved'; c.authority_effect = 'activate';
  assert.ok(validate(c).errors.includes('claim-ceiling'));
});
test('reject changed historical lineage', () => {
  const c = readCandidate(); c.previous.sha256 = '0'.repeat(64);
  assert.equal(validate(c).selected_binding, 'FAIL');
});
test('reject an incomplete change ledger', () => {
  const c = readCandidate(); c.changed_sources.pop();
  assert.ok(validate(c).errors.includes('change-ledger'));
});
