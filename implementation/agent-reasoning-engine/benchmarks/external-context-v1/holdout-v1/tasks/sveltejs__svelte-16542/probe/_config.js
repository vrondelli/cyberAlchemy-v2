import { tick } from 'svelte';
import { test } from '../../test';
export default test({
 mode: ['client', 'hydrate'],
 async test({ assert, target }) {
  await tick(); await tick();
  assert.equal(target.textContent.trim(), '5', 'ARE_EXPECTED_AWAIT_CONST');
 }
});
