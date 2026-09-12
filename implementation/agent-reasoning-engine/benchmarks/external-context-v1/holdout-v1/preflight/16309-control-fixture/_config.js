import { test } from '../../test';
export default test({
 mode: ['client', 'hydrate'],
 test({ assert, target }) {
  const selects = target.querySelectorAll('select');
  assert.equal(selects[0].value, 'o2', 'ARE_CONTROL_SELECTED_OPTION');
  assert.equal(selects[1].value, 'o2', 'ARE_EXPECTED_SELECTED_OPTION');
 }
});
