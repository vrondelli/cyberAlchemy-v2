import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCandidate, validate} from './validate.mjs';

test('selected binding and repaired runtime prerequisites pass independently', () => {
  const result = validate();
  assert.equal(result.selected_binding, 'PASS');
  assert.equal(result.nested_runtime_profile.status, 'PASS');
  assert.deepEqual(result.missing_route_policies, []);
  assert.equal(result.selected_runtime_prerequisites_pass, true);
  assert.equal(result.approval, 'not-requested');
});
test('changed profile digest fails closed', () => {
  const c = readCandidate(); c.legacy_binding.bindings.are_governed_chat.source_closure[11].sha256 = '0'.repeat(64);
  assert.equal(validate(c).selected_binding, 'FAIL');
});
test('omitted new regression source fails closed', () => {
  const c = readCandidate(); c.additional_sources.pop();
  assert.ok(validate(c).errors.includes('additional-source-coverage'));
});
test('inherited approval fails closed', () => {
  const c = readCandidate(); c.approval = 'approved';
  assert.ok(validate(c).errors.includes('claim-ceiling'));
});
test('changed predecessor digest fails closed', () => {
  const c = readCandidate(); c.previous.sha256 = '0'.repeat(64);
  assert.equal(validate(c).selected_binding, 'FAIL');
});
test('fabricated change ledger fails closed', () => {
  const c = readCandidate(); c.changed_sources = [{path:'fabricated'}];
  assert.ok(validate(c).errors.includes('change-ledger'));
});
